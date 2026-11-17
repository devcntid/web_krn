import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { TransparencyManager } from "@/components/admin/laporan/TransparencyManager";
import { can, requireUser } from "@/server/permissions";
import { listAdminAudits, listAdminLegalDocs, listAdminReports, reportThemeOptions } from "@/server/transparency-service";

export const metadata: Metadata = { title: "e-Report & Audit" };

/** /admin/laporan (artboard "A8 · e-Report & Audit"). Butuh kemampuan "e-Report, audit, legalitas". */
export default async function LaporanPage() {
  const user = await requireUser();
  if (!can(user, "compliance.manage")) redirect("/admin/");
  const [reports, audits, legal, themes] = await Promise.all([listAdminReports(), listAdminAudits(), listAdminLegalDocs(), reportThemeOptions()]);
  return <TransparencyManager reports={reports} audits={audits} legal={legal} themes={themes} />;
}
