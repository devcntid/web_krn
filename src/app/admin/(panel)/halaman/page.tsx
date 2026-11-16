import type { Metadata } from "next";

import { EmptyState } from "@/components/admin/EmptyState";
import { PageHeader } from "@/components/admin/PageHeader";
import { requireAbility } from "@/server/permissions";

export const metadata: Metadata = { title: "Halaman" };

export default async function Page() {
  await requireAbility("pages.manage");
  return (
    <>
      <PageHeader title="Halaman" />
      <EmptyState
        title="Segera hadir"
        description="Bagian ini dibangun pada langkah B7."
      />
    </>
  );
}
