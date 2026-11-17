"use server";

import { revalidatePath, updateTag } from "next/cache";

import { CACHE_TAGS } from "@/lib/content";
import { discardHomeDraft, publishHome, saveHomeDraft } from "@/server/home-service";
import { homeEditorSchema, parseInput } from "@/server/action-input";
import { requireAbility } from "@/server/permissions";
import type { HomeEditorData, HomeSaveResult } from "@/types/admin-home";

/** Simpan salinan kerja beranda (dipakai sebelum Pratinjau). */
export async function saveHomeDraftAction(raw: HomeEditorData): Promise<HomeSaveResult> {
  const user = await requireAbility("pages.manage");
  const parsed = parseInput(homeEditorSchema, raw);
  if (!parsed.ok) return parsed;
  return saveHomeDraft(user, parsed.data as HomeEditorData);
}

/** "Terbitkan Perubahan": tulis settings.home lalu segarkan tag `settings` dan beranda. */
export async function publishHomeAction(raw: HomeEditorData): Promise<HomeSaveResult> {
  const user = await requireAbility("pages.manage");
  const parsed = parseInput(homeEditorSchema, raw);
  if (!parsed.ok) return parsed;
  const result = await publishHome(user, parsed.data as HomeEditorData);
  if (result.ok) {
    updateTag(CACHE_TAGS.settings);
    revalidatePath("/");
    revalidatePath("/en");
    revalidatePath("/admin/beranda");
  }
  return result;
}

export async function discardHomeDraftAction(): Promise<void> {
  const user = await requireAbility("pages.manage");
  await discardHomeDraft(user);
  revalidatePath("/admin/beranda");
}
