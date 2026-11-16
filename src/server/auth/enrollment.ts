import "server-only";

import { and, eq, isNull } from "drizzle-orm";

import { getDb, schema } from "../db";
import { decryptSecret } from "./crypto";
import { TOTP_ISSUER, newTotpSecret } from "./totp";
import { generateURI } from "otplib";

/** Buat (atau ganti) rahasia TOTP yang belum dikonfirmasi. Tidak berlaku bila 2FA sudah aktif. */
export async function startTotpEnrollment(userId: string, email: string): Promise<void> {
  const { encrypted } = newTotpSecret(email);
  await getDb()
    .update(schema.users)
    .set({ totpSecret: encrypted, totpLastStep: null })
    .where(and(eq(schema.users.id, userId), isNull(schema.users.totpEnabledAt)));
}

/** Rahasia yang menunggu konfirmasi, untuk ditampilkan sekali ke pemiliknya sendiri. */
export async function getPendingEnrollment(userId: string): Promise<{ secret: string; uri: string } | null> {
  const [row] = await getDb()
    .select({ email: schema.users.email, totpSecret: schema.users.totpSecret, totpEnabledAt: schema.users.totpEnabledAt })
    .from(schema.users)
    .where(eq(schema.users.id, userId))
    .limit(1);
  if (!row?.totpSecret || row.totpEnabledAt) return null;
  const secret = decryptSecret(row.totpSecret);
  if (!secret) return null;
  return { secret, uri: generateURI({ issuer: TOTP_ISSUER, label: row.email, secret }) };
}
