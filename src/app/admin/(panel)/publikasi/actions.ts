"use server";

import { revalidatePath } from "next/cache";

import { parseInput, savePostSchema } from "@/server/action-input";
import { requireAbility, requireUser } from "@/server/permissions";
import { type BulkAction, bulkUpdatePosts, restoreRevision, savePost } from "@/server/posts-service";
import { listMediaImages, listRevisions, searchTags } from "@/server/repos/admin-posts";
import { refreshPostCaches } from "@/server/revalidate";
import type { BulkResult, MediaPage, RevisionSummary, SavePostInput, SaveResult, TagRef } from "@/types/admin-posts";

const LIST_PATH = "/admin/publikasi";

/** Simpan publikasi dari editor (buat baru, simpan otomatis, kirim review, terbit, jadwal, tarik ke draf). */
export async function savePostAction(raw: SavePostInput): Promise<SaveResult> {
  const user = await requireUser();
  const parsed = parseInput(savePostSchema, raw);
  if (!parsed.ok) return { ok: false, error: parsed.error };
  const input = parsed.data;
  const { result, revalidateSlugs } = await savePost(user, input);
  if (result.ok) {
    refreshPostCaches(revalidateSlugs);
    if (input.intent !== "autosave") revalidatePath(LIST_PATH, "layout");
  }
  return result;
}

const BULK_ACTIONS: readonly BulkAction[] = ["draft", "trash", "restore", "delete", "category"];

/** Aksi massal dari DataTable: `action`, `ids` (berulang), dan `option` (ID kategori tujuan). */
export async function bulkPostsAction(formData: FormData): Promise<BulkResult> {
  const user = await requireUser();
  const action = String(formData.get("action") ?? "");
  if (!BULK_ACTIONS.some((a) => a === action)) return { message: "Aksi tidak dikenal.", tone: "error" };
  const ids = formData.getAll("ids").map((v) => Number.parseInt(String(v), 10));
  const option = Number.parseInt(String(formData.get("option") ?? ""), 10);
  if (action === "category" && !Number.isInteger(option)) return { message: "Pilih kategori tujuan dulu.", tone: "error" };

  const { done, skipped, revalidateSlugs } = await bulkUpdatePosts(user, action as BulkAction, ids, Number.isInteger(option) ? option : undefined);
  refreshPostCaches(revalidateSlugs);
  revalidatePath(LIST_PATH, "layout");
  if (done === 0) return { message: "Tidak ada publikasi yang dapat diproses dengan peran Anda.", tone: "error" };
  return {
    message: `${done} publikasi diproses${skipped ? `, ${skipped} dilewati (tidak berhak atau status tidak sesuai)` : ""}.`,
    tone: skipped ? "info" : "success",
  };
}

/** Pindahkan satu publikasi ke sampah dari editor. */
export async function trashPostAction(id: number): Promise<BulkResult> {
  const user = await requireUser();
  const { done, revalidateSlugs } = await bulkUpdatePosts(user, "trash", [id]);
  refreshPostCaches(revalidateSlugs);
  revalidatePath(LIST_PATH, "layout");
  return done ? { message: "Publikasi dipindahkan ke sampah.", tone: "success" } : { message: "Anda tidak berhak memindahkan publikasi ini ke sampah.", tone: "error" };
}

export async function listRevisionsAction(postId: number): Promise<RevisionSummary[]> {
  await requireAbility("draft.write");
  return Number.isInteger(postId) ? listRevisions(postId) : [];
}

export async function restoreRevisionAction(postId: number, revisionId: number): Promise<{ ok: boolean; error?: string }> {
  const user = await requireUser();
  const { ok, error, revalidateSlugs } = await restoreRevision(user, postId, revisionId);
  if (ok) {
    refreshPostCaches(revalidateSlugs);
    revalidatePath(LIST_PATH, "layout");
  }
  return { ok, error };
}

export async function searchTagsAction(q: string): Promise<TagRef[]> {
  await requireAbility("draft.write");
  return searchTags(String(q).slice(0, 80));
}

export async function searchMediaAction(q: string, page: number): Promise<MediaPage> {
  await requireAbility("draft.write");
  return listMediaImages(String(q).slice(0, 120), Number.isInteger(page) && page > 0 ? page : 1);
}
