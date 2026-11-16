import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { auth, googleEnabled } from "@/server/auth";
import { getPendingEnrollment } from "@/server/auth/enrollment";

import { beginTotpEnrollment, cancelLogin, loginWithGoogle, loginWithPassword, verifyTotpCode } from "./actions";

export const metadata: Metadata = { title: "Masuk" };

const ERRORS: Record<string, string> = {
  credentials: "Email atau kata sandi salah, atau terlalu banyak percobaan. Coba lagi nanti.",
  totp: "Kode verifikasi tidak valid atau terlalu banyak percobaan.",
  AccessDenied: "Akun Google ini tidak memiliki akses ke admin.",
};

const field = "mt-1 block w-full min-h-11 rounded-md border border-border bg-white px-3 text-ink-900";
const primaryBtn = "min-h-11 w-full rounded-md bg-primary px-4 font-semibold text-white hover:bg-primary-500";
const secondaryBtn = "min-h-11 w-full rounded-md border border-border bg-white px-4 font-semibold text-ink-900 hover:bg-surface-alt";

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> };

export default async function LoginPage({ searchParams }: Props) {
  const params = await searchParams;
  const rawCallback = typeof params.callbackUrl === "string" ? params.callbackUrl : "";
  const callbackUrl = /^\/admin(\/|$)/.test(rawCallback) && !rawCallback.startsWith("//") ? rawCallback : "/admin/";
  const errorKey = typeof params.error === "string" ? params.error : "";
  const error = errorKey ? (ERRORS[errorKey] ?? "Gagal masuk. Coba lagi.") : null;

  const user = (await auth())?.user;
  if (user?.mfaPassed) redirect(callbackUrl);

  const pending = user && !user.totpEnrolled ? await getPendingEnrollment(user.id) : null;

  return (
    <main className="mx-auto max-w-sm rounded-lg border border-border bg-white p-6">
      <h1 className="text-2xl font-bold text-ink-900">{user ? "Verifikasi dua langkah" : "Masuk Admin"}</h1>
      {error && (
        <p role="alert" className="mt-4 rounded-md border border-accent-700 bg-cream p-3 text-sm text-ink-900">
          {error}
        </p>
      )}

      {!user && (
        <>
          <form action={loginWithPassword} className="mt-6 space-y-4">
            <input type="hidden" name="callbackUrl" value={callbackUrl} />
            <label className="block text-sm font-semibold">
              Email
              <input name="email" type="email" autoComplete="username" required className={field} />
            </label>
            <label className="block text-sm font-semibold">
              Kata sandi
              <input name="password" type="password" autoComplete="current-password" required className={field} />
            </label>
            <button type="submit" className={primaryBtn}>
              Masuk
            </button>
          </form>
          {googleEnabled && (
            <form action={loginWithGoogle} className="mt-4">
              <input type="hidden" name="callbackUrl" value={callbackUrl} />
              <button type="submit" className={secondaryBtn}>
                Masuk dengan Google
              </button>
            </form>
          )}
        </>
      )}

      {user && user.totpEnrolled && (
        <form action={verifyTotpCode} className="mt-6 space-y-4">
          <input type="hidden" name="callbackUrl" value={callbackUrl} />
          <label className="block text-sm font-semibold">
            Kode 6 digit dari aplikasi autentikator
            <input name="code" inputMode="numeric" pattern="[0-9 ]{6,7}" autoComplete="one-time-code" required className={field} />
          </label>
          <button type="submit" className={primaryBtn}>
            Verifikasi
          </button>
        </form>
      )}

      {user && !user.totpEnrolled && (
        <div className="mt-6 space-y-4">
          <p className="text-sm">Peran Anda wajib memakai verifikasi dua langkah (TOTP). Daftarkan aplikasi autentikator terlebih dahulu.</p>
          {pending ? (
            <>
              <p className="text-sm">
                Tambahkan akun baru di aplikasi autentikator dengan kunci berikut, lalu masukkan kode yang muncul:
              </p>
              <p className="break-all rounded-md bg-surface-alt p-3 font-mono text-sm text-ink-900">{pending.secret}</p>
              <p className="text-sm">
                <a href={pending.uri} className="font-semibold text-primary underline">
                  Buka di aplikasi autentikator
                </a>
              </p>
              <form action={verifyTotpCode} className="space-y-4">
                <input type="hidden" name="callbackUrl" value={callbackUrl} />
                <label className="block text-sm font-semibold">
                  Kode 6 digit
                  <input name="code" inputMode="numeric" pattern="[0-9 ]{6,7}" autoComplete="one-time-code" required className={field} />
                </label>
                <button type="submit" className={primaryBtn}>
                  Aktifkan &amp; masuk
                </button>
              </form>
            </>
          ) : (
            <form action={beginTotpEnrollment}>
              <input type="hidden" name="callbackUrl" value={callbackUrl} />
              <button type="submit" className={primaryBtn}>
                Buat kunci 2FA
              </button>
            </form>
          )}
        </div>
      )}

      {user && (
        <form action={cancelLogin} className="mt-4">
          <button type="submit" className={secondaryBtn}>
            Batal &amp; keluar
          </button>
        </form>
      )}
    </main>
  );
}
