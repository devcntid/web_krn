import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { PostEditor } from "@/components/admin/publikasi/PostEditor";
import { SITE_URL } from "@/config/site";
import { can, requireUser } from "@/server/permissions";
import { listCategoryOptions, listUserOptions } from "@/server/repos/admin-posts";

export const metadata: Metadata = { title: "Tulis Publikasi" };

/** Publikasi baru: belum ada baris di database sampai simpan (otomatis) pertama. */
export default async function PublikasiBaruPage() {
  const user = await requireUser();
  if (!can(user, "draft.write")) redirect("/admin/publikasi/");

  const [categories, users] = await Promise.all([listCategoryOptions(), listUserOptions()]);
  const canReview = can(user, "content.review");
  return (
    <PostEditor
      post={{
        id: null,
        slug: "",
        title: "",
        excerpt: "",
        contentJson: null,
        contentHtml: "",
        status: "draft",
        publishedAt: null,
        updatedAt: null,
        authorId: user.id,
        reviewerId: null,
        featured: null,
        seoTitle: "",
        seoDescription: "",
        canonical: "",
        categoryIds: [],
        tags: [],
      }}
      categories={categories}
      users={users
        .filter((u) => canReview || u.id === user.id)
        .map((u) => ({ id: u.id, name: u.name, reviewer: u.role === "super_admin" || u.role === "editor" }))}
      perms={{
        canEdit: true,
        canPublish: can(user, "content.publish"),
        canReview,
        canSeo: can(user, "seo.manage"),
        canTrash: false,
      }}
      siteHost={new URL(SITE_URL).host}
    />
  );
}
