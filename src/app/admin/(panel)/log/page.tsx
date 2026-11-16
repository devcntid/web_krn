import type { Metadata } from "next";

import { EmptyState } from "@/components/admin/EmptyState";
import { PageHeader } from "@/components/admin/PageHeader";
import { requireAbility } from "@/server/permissions";

export const metadata: Metadata = { title: "Log Aktivitas" };

export default async function Page() {
  await requireAbility("system.manage");
  return (
    <>
      <PageHeader title="Log Aktivitas" />
      <EmptyState
        title="Segera hadir"
        description="Bagian ini dibangun pada langkah B15."
      />
    </>
  );
}
