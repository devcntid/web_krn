import type { Metadata } from "next";

import { EmptyState } from "@/components/admin/EmptyState";
import { PageHeader } from "@/components/admin/PageHeader";
import { requireAbility } from "@/server/permissions";

export const metadata: Metadata = { title: "Kategori & Tag" };

export default async function Page() {
  await requireAbility("content.review");
  return (
    <>
      <PageHeader title="Kategori & Tag" />
      <EmptyState
        title="Segera hadir"
        description="Bagian ini dibangun pada langkah B10."
      />
    </>
  );
}
