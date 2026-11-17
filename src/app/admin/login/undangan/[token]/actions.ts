"use server";

import { headers } from "next/headers";

import { clientIp, isRateLimited, recordFailure } from "@/server/auth/rate-limit";
import { acceptInvite } from "@/server/users-service";
import type { UsersResult } from "@/types/admin-users";

/** Terima undangan (tanpa sesi). Percobaan gagal dibatasi per IP, sama seperti login. */
export async function acceptInviteAction(token: string, name: string, password: string): Promise<UsersResult> {
  const keys = [{ kind: "ip" as const, value: clientIp(await headers()) }];
  if (await isRateLimited(keys)) return { ok: false, error: "Terlalu banyak percobaan. Coba lagi 15 menit lagi." };
  const result = await acceptInvite(String(token), String(name), String(password));
  if (!result.ok) await recordFailure(keys);
  return result;
}
