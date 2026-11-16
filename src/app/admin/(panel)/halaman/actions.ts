"use server";

import { revalidatePath } from "next/cache";

import { createPage, savePage } from "@/server/pages-service";
import { requireAbility } from "@/server/permissions";
import { refreshPageCaches } from "@/server/revalidate";
import type { CreatePageInput, CreatePageResult, SavePageInput, SavePageResult } from "@/types/admin-pages";

/** Simpan halaman dari editor section. */
export async function savePageAction(input: SavePageInput): Promise<SavePageResult> {
  const user = await requireAbility("pages.manage");
  const { result, path, listChanged } = await savePage(user, input);
  if (result.ok && path) {
    refreshPageCaches(path, listChanged);
    revalidatePath("/admin/halaman", "layout");
  }
  return result;
}

export async function createPageAction(input: CreatePageInput): Promise<CreatePageResult> {
  const user = await requireAbility("pages.manage");
  const result = await createPage(user, input);
  if (result.ok) revalidatePath("/admin/halaman", "layout");
  return result;
}
