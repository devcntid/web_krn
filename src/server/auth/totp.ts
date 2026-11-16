import "server-only";

import { generateSecret, generateURI, verify } from "otplib";

import { decryptSecret, encryptSecret } from "./crypto";

export const TOTP_ISSUER = "Relawan Nusantara Admin";

/** Rahasia baru (Base32) + versi terenkripsinya untuk disimpan di users.totp_secret. */
export function newTotpSecret(label: string): { secret: string; encrypted: string; uri: string } {
  const secret = generateSecret();
  return { secret, encrypted: encryptSecret(secret), uri: generateURI({ issuer: TOTP_ISSUER, label, secret }) };
}

/**
 * Verifikasi kode 6 digit. Toleransi ±1 langkah (30 dtk) untuk selisih jam.
 * `afterTimeStep` menolak kode dari langkah yang sudah pernah dipakai (anti-replay).
 * Mengembalikan time step yang diterima, atau null.
 */
export async function verifyTotp(encrypted: string, token: string, afterTimeStep: number | null): Promise<number | null> {
  if (!/^\d{6}$/.test(token)) return null;
  const secret = decryptSecret(encrypted);
  if (!secret) return null;
  try {
    const result = await verify({
      secret,
      token,
      epochTolerance: 30,
      ...(afterTimeStep != null ? { afterTimeStep } : {}),
    });
    return result.valid && "timeStep" in result ? result.timeStep : null;
  } catch {
    return null;
  }
}
