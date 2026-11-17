import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { SeoManager } from "@/components/admin/seo/SeoManager";
import { can, requireUser } from "@/server/permissions";
import { listAdminRedirects, listNotFound, seoHealth } from "@/server/seo-service";

export const metadata: Metadata = { title: "SEO & Redirect" };

/** /admin/seo (artboard "A9 · SEO & Redirect"). Butuh kemampuan "SEO & redirect". */
export default async function SeoPage() {
  const user = await requireUser();
  if (!can(user, "seo.manage")) redirect("/admin/");
  const [health, redirects, notFound] = await Promise.all([seoHealth(), listAdminRedirects(), listNotFound()]);
  return <SeoManager health={health} redirects={redirects} notFound={notFound} />;
}
