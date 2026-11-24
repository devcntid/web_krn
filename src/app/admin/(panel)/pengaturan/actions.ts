"use server";

import { revalidatePath, updateTag } from "next/cache";

import { CACHE_TAGS } from "@/lib/content";
import type { SiteSettings } from "@/lib/site-settings-schema";
import { requireAbility } from "@/server/permissions";
import { type SaveSettingsResult, saveSiteSettings } from "@/server/site-settings";

/** "Simpan" di /admin/pengaturan: tulis kunci yang berubah lalu segarkan tag `settings` (header, footer, analytics). */
export async function saveSiteSettingsAction(data: SiteSettings): Promise<SaveSettingsResult> {
  const user = await requireAbility("system.manage");
  const result = await saveSiteSettings(user, data);
  if (result.ok && result.changed.length) {
    updateTag(CACHE_TAGS.settings);
    revalidatePath("/admin/pengaturan");
    if (result.changed.includes("reading")) {
      revalidatePath("/");
      revalidatePath("/id");
      revalidatePath("/en");
    }
  }
  return result;
}
