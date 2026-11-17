"use server";

import { getActivityDiff } from "@/server/activity-log";
import { requireAbility } from "@/server/permissions";

/** Isi diff sebelum/sesudah untuk tombol "Lihat" (dimuat saat dibuka agar daftar tetap ringan). */
export async function getActivityDiffAction(id: number): Promise<Record<string, unknown> | null> {
  await requireAbility("system.manage");
  return getActivityDiff(Number(id));
}
