import { notFound, redirect } from "next/navigation";

import { EmptyState } from "@/components/admin/EmptyState";
import { PageEditor } from "@/components/admin/halaman/PageEditor";
import { STATIC_ROUTES } from "@/config/routes";
import { can, requireUser } from "@/server/permissions";
import { listCategoryOptions } from "@/server/repos/admin-posts";
import { SYSTEM_PAGE_PATHS, getEditorPage } from "@/server/repos/admin-pages";

/** Editor section untuk satu halaman. */
export default async function HalamanEditPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await requireUser();
  if (!can(user, "pages.manage")) redirect("/admin/");
  const { id } = await params;
  if (!/^[1-9]\d{0,9}$/.test(id)) notFound();

  const [page, categories] = await Promise.all([getEditorPage(Number(id)), listCategoryOptions()]);
  if (!page || page.status === "trashed") notFound();

  if (SYSTEM_PAGE_PATHS.has(page.path)) {
    return (
      <div className="min-w-0 flex-[999_1_520px]">
        <EmptyState
          title={`${page.title} dirender otomatis`}
          description={
            page.path === "new-beranda"
              ? "Beranda dikelola di menu Kelola Beranda."
              : "Halaman ini menampilkan daftar publikasi secara otomatis; isinya diatur lewat menu Publikasi."
          }
        />
      </div>
    );
  }

  return (
    <PageEditor
      key={page.id}
      page={page}
      options={{ categories: categories.map((c) => ({ value: c.slug, label: c.name })) }}
      isStaticRoute={STATIC_ROUTES.has(page.path)}
    />
  );
}
