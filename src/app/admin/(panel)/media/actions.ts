"use server";

import { revalidatePath, revalidateTag } from "next/cache";

import { CACHE_TAGS } from "@/lib/content";

import { deleteMedia, registerUpload, updateMediaMeta } from "@/server/media-service";
import { requireAbility, requireUser } from "@/server/permissions";
import { getMediaDetail } from "@/server/repos/admin-media";
import type { MediaActionResult, MediaDetail } from "@/types/admin-media";

const PATH = "/admin/media";

/** Catat file yang baru selesai diunggah (dipanggil klien setelah upload()). */
export async function registerUploadAction(url: string): Promise<MediaActionResult> {
  const user = await requireAbility("media.manage");
  if (typeof url !== "string" || !/^https:\/\/[a-z0-9-]+\.public\.blob\.vercel-storage\.com\/media\//.test(url)) {
    return { ok: false, error: "URL unggahan tidak sah." };
  }
  const result = await registerUpload(user.id, url);
  if (result.ok) revalidatePath(PATH);
  return result;
}

export async function getMediaDetailAction(id: number): Promise<MediaDetail | null> {
  await requireUser();
  return Number.isInteger(id) ? getMediaDetail(id) : null;
}

export async function updateMediaAction(id: number, input: { alt: string; caption: string }): Promise<MediaActionResult> {
  const user = await requireAbility("media.manage");
  const { affectsPosts, ...result } = await updateMediaMeta(user, id, input);
  if (result.ok) {
    revalidatePath(PATH);
    // Alt gambar unggulan tampil di kartu & halaman publikasi; disegarkan di latar (stale-while-revalidate).
    if (affectsPosts) revalidateTag(CACHE_TAGS.posts, "max");
  }
  return result;
}

export async function deleteMediaAction(id: number): Promise<MediaActionResult> {
  const user = await requireAbility("media.manage");
  const result = await deleteMedia(user, id);
  if (result.ok) revalidatePath(PATH);
  return result;
}
