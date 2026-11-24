import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";

import { VisualBuilder } from "@/components/admin/halaman/VisualBuilder";
import { isVisualPage } from "@/lib/visual-page";
import { can, requireUser } from "@/server/permissions";
import { getEditorPage } from "@/server/repos/admin-pages";

export const metadata: Metadata = { title: "Visual Builder" };

/** Editor visual layar penuh. Halaman klasik tetap di /admin/halaman/[id]. */
export default async function VisualBuilderPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await requireUser();
  if (!can(user, "pages.manage")) redirect("/admin/");
  const { id } = await params;
  if (!/^[1-9]\d{0,9}$/.test(id)) notFound();
  const page = await getEditorPage(Number(id));
  if (!page || page.status === "trashed") notFound();
  if (!isVisualPage(page.sections)) redirect(`/admin/halaman/${page.id}/`);
  return <VisualBuilder page={page} />;
}
