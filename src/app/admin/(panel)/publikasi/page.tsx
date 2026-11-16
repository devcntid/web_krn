import type { Metadata } from "next";

import { EmptyState } from "@/components/admin/EmptyState";
import { PageHeader } from "@/components/admin/PageHeader";
import { requireUser } from "@/server/permissions";

export const metadata: Metadata = { title: "Publikasi" };

export default async function Page() {
  await requireUser();
  return (
    <>
      <PageHeader title="Publikasi" />
      <EmptyState
        title="Segera hadir"
        description="Bagian ini dibangun pada langkah B6."
      />
    </>
  );
}
