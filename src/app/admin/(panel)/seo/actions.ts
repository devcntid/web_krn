"use server";

import { revalidatePath } from "next/cache";

import { logActivity } from "@/server/activity";
import { parseInput, redirectSchema } from "@/server/action-input";
import { requireAbility } from "@/server/permissions";
import { syncRedirectsToEdgeConfig } from "@/server/redirects-sync";
import { clearNotFound, deleteRedirect, saveRedirect } from "@/server/seo-service";
import type { RedirectInput, SeoResult } from "@/types/admin-seo";

/** Setelah redirect berubah: sinkronkan ke Edge Config; kegagalan sinkron jadi peringatan, bukan galat. */
async function withSync(result: SeoResult): Promise<SeoResult> {
  if (!result.ok) return result;
  const sync = await syncRedirectsToEdgeConfig();
  revalidatePath("/admin/seo");
  return sync.ok ? { ...result, message: `${result.message} Aktif di situs (${sync.count} redirect dinamis).` } : { ...result, warning: sync.error };
}

export async function saveRedirectAction(id: number | null, input: RedirectInput): Promise<SeoResult> {
  const user = await requireAbility("seo.manage");
  const parsed = parseInput(redirectSchema, input);
  if (!parsed.ok) return parsed;
  return withSync(await saveRedirect(user, id === null ? null : Number(id), parsed.data));
}

export async function deleteRedirectAction(id: number): Promise<SeoResult> {
  const user = await requireAbility("seo.manage");
  return withSync(await deleteRedirect(user, Number(id)));
}

export async function syncRedirectsAction(): Promise<SeoResult> {
  const user = await requireAbility("seo.manage");
  const sync = await syncRedirectsToEdgeConfig();
  if (sync.ok) await logActivity({ userId: user.id, action: "sync", entity: "redirect", summary: `Menyinkronkan ${sync.count} redirect dinamis ke Edge Config` });
  return sync.ok ? { ok: true, message: `${sync.count} redirect dinamis disinkronkan ke Edge Config.` } : { ok: false, error: sync.error };
}

export async function clearNotFoundAction(path: string): Promise<SeoResult> {
  const user = await requireAbility("seo.manage");
  const result = await clearNotFound(user, String(path));
  revalidatePath("/admin/seo");
  return result;
}
