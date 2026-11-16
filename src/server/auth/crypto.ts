import "server-only";

import { createCipheriv, createDecipheriv, hkdfSync, randomBytes } from "node:crypto";

/**
 * Enkripsi rahasia TOTP saat disimpan (AES-256-GCM). Kunci diturunkan via HKDF dari
 * TOTP_ENCRYPTION_KEY bila ada, selain itu dari AUTH_SECRET. Format: v1.<iv>.<tag>.<ciphertext> (base64url).
 * Catatan: mengganti kunci/AUTH_SECRET membuat rahasia lama tidak terbaca → pengguna harus daftar ulang 2FA.
 */
function key(): Buffer {
  const material = process.env.TOTP_ENCRYPTION_KEY || process.env.AUTH_SECRET;
  if (!material) throw new Error("AUTH_SECRET (atau TOTP_ENCRYPTION_KEY) belum di-set.");
  return Buffer.from(hkdfSync("sha256", material, "krn-admin", "totp-secret-v1", 32));
}

export function encryptSecret(plain: string): string {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", key(), iv);
  const ct = Buffer.concat([cipher.update(plain, "utf8"), cipher.final()]);
  return ["v1", iv, cipher.getAuthTag(), ct].map((p) => (typeof p === "string" ? p : p.toString("base64url"))).join(".");
}

export function decryptSecret(stored: string): string | null {
  const [v, iv, tag, ct] = stored.split(".");
  if (v !== "v1" || !iv || !tag || !ct) return null;
  try {
    const decipher = createDecipheriv("aes-256-gcm", key(), Buffer.from(iv, "base64url"));
    decipher.setAuthTag(Buffer.from(tag, "base64url"));
    return Buffer.concat([decipher.update(Buffer.from(ct, "base64url")), decipher.final()]).toString("utf8");
  } catch {
    return null;
  }
}
