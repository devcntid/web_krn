import "server-only";

import { and, eq, isNull, sql } from "drizzle-orm";
import NextAuth, { type NextAuthConfig } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";

import { logActivity } from "../activity";
import { getDb, schema } from "../db";
import { TOTP_REQUIRED_ROLES as TOTP_REQUIRED, type Role } from "../roles";
import { burnPasswordCheck, verifyPassword } from "./password";
import { clearFailures, clientIp, isRateLimited, recordFailure } from "./rate-limit";
import { verifyTotp } from "./totp";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: Role;
      /** true bila 2FA sudah lolos atau tidak diwajibkan untuk peran ini. */
      mfaPassed: boolean;
      /** Apakah TOTP sudah terdaftar (untuk menentukan langkah verifikasi vs pendaftaran). */
      totpEnrolled: boolean;
    } & DefaultSessionUser;
    /** Hanya dipakai sebagai payload `unstable_update` — kode diverifikasi di callback `jwt`. */
    totpCode?: string;
  }
}
type DefaultSessionUser = { name?: string | null; email?: string | null; image?: string | null };

declare module "@auth/core/jwt" {
  interface JWT {
    uid?: string;
    role?: Role;
    mfa?: boolean;
    totpEnrolled?: boolean;
    /** Waktu login (ms) — batas umur absolut sesi. */
    authAt?: number;
  }
}

/** Umur absolut sesi; JWT Auth.js diperpanjang tiap akses, jadi batas ini ditegakkan sendiri. */
const SESSION_MAX_AGE_S = 8 * 60 * 60;
const IDLE_MAX_AGE_S = 2 * 60 * 60;

export const googleEnabled = Boolean(process.env.AUTH_GOOGLE_ID && process.env.AUTH_GOOGLE_SECRET);

function allowedDomain(): string | null {
  const d = process.env.ALLOWED_EMAIL_DOMAIN?.trim().toLowerCase().replace(/^@/, "");
  return d || null;
}

async function findUserByEmail(email: string) {
  const [row] = await getDb()
    .select()
    .from(schema.users)
    .where(eq(sql`lower(${schema.users.email})`, email.trim().toLowerCase()))
    .limit(1);
  return row ?? null;
}

const config: NextAuthConfig = {
  // Credentials hanya didukung Auth.js dengan strategi JWT (lihat docs/AUTH.md).
  session: { strategy: "jwt", maxAge: IDLE_MAX_AGE_S },
  trustHost: true,
  pages: { signIn: "/admin/login/", error: "/admin/login/" },
  providers: [
    ...(googleEnabled ? [Google] : []),
    Credentials({
      credentials: { email: { type: "email" }, password: { type: "password" } },
      async authorize(credentials, request) {
        const email = typeof credentials.email === "string" ? credentials.email.trim().toLowerCase() : "";
        const password = typeof credentials.password === "string" ? credentials.password : "";
        if (!email || !password || email.length > 254 || password.length > 1024) return null;

        const ip = clientIp(request.headers);
        const keys = [
          { kind: "email" as const, value: email },
          { kind: "ip" as const, value: ip },
        ];
        if (await isRateLimited(keys)) return null;

        const user = await findUserByEmail(email);
        const ok = user?.passwordHash ? await verifyPassword(user.passwordHash, password) : (await burnPasswordCheck(password), false);
        if (!user || !ok || user.disabledAt) {
          await recordFailure(keys);
          return null;
        }
        await clearFailures("email", email);
        return { id: user.id, email: user.email, name: user.name };
      },
    }),
  ],
  callbacks: {
    async signIn({ account, profile }) {
      if (account?.provider !== "google") return account?.provider === "credentials";
      // Google: email harus terverifikasi, domainnya sama persis dengan ALLOWED_EMAIL_DOMAIN,
      // dan sudah ada baris aktif di `users` (tidak ada pembuatan akun otomatis).
      const domain = allowedDomain();
      const email = profile?.email?.toLowerCase();
      if (!domain || !email || profile?.email_verified !== true) return false;
      if (email.slice(email.lastIndexOf("@") + 1) !== domain) return false;
      const user = await findUserByEmail(email);
      return Boolean(user && !user.disabledAt);
    },

    async jwt({ token, user, account, trigger, session }) {
      const db = getDb();
      const now = Date.now();

      if (user && account) {
        // Login baru: petakan ke baris `users` milik kita.
        const row = account.provider === "credentials" && user.id ? { id: user.id } : user.email ? await findUserByEmail(user.email) : null;
        if (!row) return null;
        token = { sub: row.id, uid: row.id, authAt: now, mfa: false };
        await logActivity({ userId: row.id, action: "login", entity: "user", entityId: row.id, summary: `Masuk dengan ${account.provider === "google" ? "Google" : "email & password"}` });
      }

      if (!token.uid || !token.authAt || now - token.authAt > SESSION_MAX_AGE_S * 1000) return null;

      // Baca ulang setiap request: peran, status nonaktif, dan status 2FA berlaku seketika.
      const [row] = await db.select().from(schema.users).where(eq(schema.users.id, token.uid)).limit(1);
      if (!row || row.disabledAt) return null;

      const needsTotp = TOTP_REQUIRED.includes(row.role);
      // `mfa` HANYA berarti "kode TOTP sudah diverifikasi pada sesi ini". Jangan pernah diisi true
      // hanya karena peran saat ini tidak mewajibkan 2FA: bila peran itu kemudian dinaikkan ke
      // editor/super_admin, sesi lama akan lolos tanpa pernah memasukkan kode.
      let mfa = token.mfa === true;

      if (trigger === "update" && needsTotp && !mfa && typeof session?.totpCode === "string") {
        const keys = [{ kind: "totp" as const, value: row.id }];
        if (row.totpSecret && !(await isRateLimited(keys))) {
          const step = await verifyTotp(row.totpSecret, session.totpCode, row.totpLastStep);
          if (step != null) {
            // Klaim time step secara atomik agar kode yang sama tidak bisa dipakai dua kali.
            const claimed = await db
              .update(schema.users)
              .set({ totpLastStep: step, totpEnabledAt: row.totpEnabledAt ?? new Date() })
              .where(
                and(
                  eq(schema.users.id, row.id),
                  row.totpLastStep == null ? isNull(schema.users.totpLastStep) : eq(schema.users.totpLastStep, row.totpLastStep),
                ),
              )
              .returning({ id: schema.users.id });
            if (claimed.length) {
              mfa = true;
              if (!row.totpEnabledAt) await logActivity({ userId: row.id, action: "setup_2fa", entity: "user", entityId: row.id, summary: "Mengaktifkan verifikasi dua langkah (2FA)" });
              row.totpEnabledAt ??= new Date();
              await clearFailures("totp", row.id);
            }
          } else {
            await recordFailure(keys);
          }
        }
      }

      if (!row.lastActiveAt || now - row.lastActiveAt.getTime() > 5 * 60 * 1000) {
        await db.update(schema.users).set({ lastActiveAt: new Date(now) }).where(eq(schema.users.id, row.id));
      }

      return {
        ...token,
        name: row.name,
        email: row.email,
        picture: row.image,
        role: row.role,
        mfa,
        totpEnrolled: Boolean(row.totpEnabledAt),
      };
    },

    session({ session, token }) {
      return {
        ...session,
        user: {
          ...session.user,
          id: token.uid ?? "",
          role: token.role ?? "viewer",
          // Lolos bila TOTP sudah diverifikasi, atau peran SAAT INI (dibaca ulang dari DB) tidak mewajibkannya.
          mfaPassed: token.mfa === true || !TOTP_REQUIRED.includes(token.role ?? "viewer"),
          totpEnrolled: token.totpEnrolled === true,
        },
      };
    },
  },
};

export const { handlers, auth, signIn, signOut, unstable_update } = NextAuth(config);
