import type { Metadata } from "next";

import { EmptyState } from "@/components/admin/EmptyState";
import { PageHeader } from "@/components/admin/PageHeader";
import { requireAbility } from "@/server/permissions";

export const metadata: Metadata = { title: "Pustaka Media" };

export default async function Page() {
  await requireAbility("media.manage");
  return (
    <>
      <PageHeader title="Pustaka Media" />
      <EmptyState
        title="Segera hadir"
        description="Bagian ini dibangun pada langkah B9."
      />
    </>
  );
}
