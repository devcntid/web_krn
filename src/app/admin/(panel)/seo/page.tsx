import type { Metadata } from "next";

import { EmptyState } from "@/components/admin/EmptyState";
import { PageHeader } from "@/components/admin/PageHeader";
import { requireAbility } from "@/server/permissions";

export const metadata: Metadata = { title: "SEO & Redirect" };

export default async function Page() {
  await requireAbility("seo.manage");
  return (
    <>
      <PageHeader title="SEO & Redirect" />
      <EmptyState
        title="Segera hadir"
        description="Bagian ini dibangun pada langkah B12."
      />
    </>
  );
}
