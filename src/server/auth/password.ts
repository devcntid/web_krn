import "server-only";

import { hash, verify } from "@node-rs/argon2";

/**
 * Argon2id (default @node-rs/argon2) dengan parameter OWASP: m=19 MiB, t=2, p=1.
 * Hash menyimpan parameternya sendiri, jadi parameter bisa dinaikkan kapan saja.
 */
const OPTIONS = { memoryCost: 19456, timeCost: 2, parallelism: 1 } as const;

export const MIN_PASSWORD_LENGTH = 12;

export function hashPassword(password: string): Promise<string> {
  return hash(password, OPTIONS);
}

export async function verifyPassword(passwordHash: string, password: string): Promise<boolean> {
  try {
    return await verify(passwordHash, password);
  } catch {
    return false;
  }
}

/** Hash tiruan agar waktu respons sama saat email tidak ditemukan (cegah enumerasi). */
let dummyHash: Promise<string> | undefined;
export async function burnPasswordCheck(password: string): Promise<void> {
  dummyHash ??= hashPassword("tidak-ada-akun-dengan-password-ini");
  await verifyPassword(await dummyHash, password);
}
