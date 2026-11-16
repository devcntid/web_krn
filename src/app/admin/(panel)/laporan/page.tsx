import type { Metadata } from "next";

import { EmptyState } from "@/components/admin/EmptyState";
import { PageHeader } from "@/components/admin/PageHeader";
import { requireAbility } from "@/server/permissions";

export const metadata: Metadata = { title: "e-Report & Audit" };

export default async function Page() {
  await requireAbility("compliance.manage");
  return (
    <>
      <PageHeader title="e-Report & Audit" />
      <EmptyState
        title="Segera hadir"
        description="Bagian ini dibangun pada langkah B11."
      />
    </>
  );
}
