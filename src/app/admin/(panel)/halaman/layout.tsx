import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import { PageHeader } from "@/components/admin/PageHeader";
import { PageList } from "@/components/admin/halaman/PageList";
import { can, requireUser } from "@/server/permissions";
import { listAdminPages } from "@/server/repos/admin-pages";

export const metadata: Metadata = { title: "Halaman" };

/** Kerangka /admin/halaman (artboard "A4 · Halaman & Section"): daftar halaman di kiri, editor di kanan. */
export default async function HalamanLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const user = await requireUser();
  if (!can(user, "pages.manage")) redirect("/admin/");
  const items = await listAdminPages();
  return (
    <>
      <PageHeader
        title="Halaman"
        description="Susun halaman dari section siap pakai — tanpa page builder berat."
        actions={
          <Link
            href="/admin/halaman/baru/"
            className="inline-flex min-h-11 items-center rounded-admin bg-primary px-4.5 text-sm font-extrabold text-white hover:bg-admin-primary-dark focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
          >
            + Halaman Baru
          </Link>
        }
      />
      <div className="flex flex-wrap items-start gap-4.5">
        <PageList items={items} />
        {children}
      </div>
    </>
  );
}
