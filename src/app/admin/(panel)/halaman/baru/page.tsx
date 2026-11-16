import { redirect } from "next/navigation";

import { NewPageForm } from "@/components/admin/halaman/NewPageForm";
import { SITE_URL } from "@/config/site";
import { can, requireUser } from "@/server/permissions";
import { listAdminPages } from "@/server/repos/admin-pages";

/** Form halaman baru. Induk yang ditawarkan: halaman utama (satu tingkat) yang bukan percobaan lama. */
export default async function HalamanBaruPage() {
  const user = await requireUser();
  if (!can(user, "pages.manage")) redirect("/admin/");
  const parents = (await listAdminPages())
    .filter((p) => !p.path.includes("/") && !p.redirected && p.path !== "new-beranda")
    .map((p) => ({ path: p.path, title: p.title || p.path }));
  return <NewPageForm parents={parents} siteHost={new URL(SITE_URL).host} />;
}
