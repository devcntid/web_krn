import type { Metadata } from "next";

import { SettingsForm } from "@/components/admin/pengaturan/SettingsForm";
import { requireAbility } from "@/server/permissions";
import { readSiteSettings } from "@/server/site-settings";

export const metadata: Metadata = { title: "Pengaturan Situs" };

/** /admin/pengaturan (artboard "A11 · Pengaturan Situs"). Hanya Super Admin (system.manage). */
export default async function Page() {
  await requireAbility("system.manage");
  return <SettingsForm initial={await readSiteSettings()} />;
}
