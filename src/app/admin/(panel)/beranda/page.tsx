import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { EmptyState } from "@/components/admin/EmptyState";
import { PageHeader } from "@/components/admin/PageHeader";
import { HomeEditor } from "@/components/admin/beranda/HomeEditor";
import { getHomeEditorState } from "@/server/home-service";
import { can, requireUser } from "@/server/permissions";

export const metadata: Metadata = { title: "Kelola Beranda" };

/** /admin/beranda (artboard "A5 · Kelola Beranda"). Isi disimpan di settings.home. */
export default async function BerandaPage() {
  const user = await requireUser();
  if (!can(user, "pages.manage")) redirect("/admin/");
  const state = await getHomeEditorState();
  if (!state) {
    return (
      <>
        <PageHeader title="Kelola Beranda" />
        <EmptyState title="Konten beranda belum ada di database" description="Jalankan npm run db:seed:home untuk mengisinya dari konten awal." />
      </>
    );
  }
  return <HomeEditor initial={state.data} hasDraft={state.hasDraft} />;
}
