import type { Metadata } from "next";

import { LogView, type SearchParams } from "@/components/admin/log/LogView";
import { requireAbility } from "@/server/permissions";

export const metadata: Metadata = { title: "Log Aktivitas" };

/** /admin/log (artboard "A12 · Log Aktivitas"): jejak audit semua perubahan. Hanya Super Admin. */
export default async function LogPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  await requireAbility("system.manage");
  return <LogView sp={await searchParams} />;
}

