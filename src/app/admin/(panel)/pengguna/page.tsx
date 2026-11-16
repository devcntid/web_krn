import type { Metadata } from "next";

import { EmptyState } from "@/components/admin/EmptyState";
import { PageHeader } from "@/components/admin/PageHeader";
import { requireAbility } from "@/server/permissions";

export const metadata: Metadata = { title: "Pengguna & Peran" };

export default async function Page() {
  await requireAbility("system.manage");
  return (
    <>
      <PageHeader title="Pengguna & Peran" />
      <EmptyState
        title="Segera hadir"
        description="Bagian ini dibangun pada langkah B13."
      />
    </>
  );
}
