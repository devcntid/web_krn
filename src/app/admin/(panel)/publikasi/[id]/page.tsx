import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { PostEditor } from "@/components/admin/publikasi/PostEditor";
import { SITE_URL } from "@/config/site";
import { can, requireUser } from "@/server/permissions";
import { canEditPost, canManagePost } from "@/server/posts-service";
import { getEditorPost, listCategoryOptions, listUserOptions } from "@/server/repos/admin-posts";

export const metadata: Metadata = { title: "Edit Publikasi" };

/** Editor publikasi yang sudah ada (artboard "A3"). Peran tanpa hak ubah melihatnya dalam mode baca. */
export default async function EditPublikasiPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await requireUser();
  const { id: raw } = await params;
  if (!/^[1-9]\d{0,9}$/.test(raw)) notFound();

  const [post, categories, users] = await Promise.all([getEditorPost(Number(raw)), listCategoryOptions(), listUserOptions()]);
  if (!post) notFound();

  const canReview = can(user, "content.review");
  return (
    <PostEditor
      key={post.id}
      post={post}
      categories={categories}
      // Hanya Editor/Super Admin yang memilih penulis & reviewer; peran lain cukup nama yang tercantum.
      users={users
        .filter((u) => canReview || u.id === post.authorId || u.id === post.reviewerId)
        .map((u) => ({ id: u.id, name: u.name, reviewer: u.role === "super_admin" || u.role === "editor" }))}
      perms={{
        canEdit: canEditPost(user, post),
        canPublish: can(user, "content.publish"),
        canReview,
        canSeo: can(user, "seo.manage"),
        canTrash: post.status !== "trashed" && canManagePost(user, post),
      }}
      siteHost={new URL(SITE_URL).host}
    />
  );
}
