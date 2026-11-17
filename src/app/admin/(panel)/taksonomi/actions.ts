"use server";

import { revalidatePath } from "next/cache";

import { parseInput, termSchema } from "@/server/action-input";
import { requireAbility } from "@/server/permissions";
import { refreshTaxonomyCaches } from "@/server/revalidate-taxonomy";
import { createTerm, mergeTerms, searchTagTargets, updateTerm } from "@/server/taxonomy-service";
import type { TaxonomyKind, TaxonomyResult, TermInput } from "@/types/admin-taxonomy";

const PATH = "/admin/taksonomi";
const isKind = (k: unknown): k is TaxonomyKind => k === "category" || k === "tag";

export async function createTermAction(kind: TaxonomyKind, raw: TermInput): Promise<TaxonomyResult> {
  const user = await requireAbility("content.review");
  if (!isKind(kind)) return { ok: false, error: "Jenis tidak dikenal." };
  const parsed = parseInput(termSchema, raw);
  if (!parsed.ok) return parsed;
  const input = parsed.data;
  const { result } = await createTerm(user, kind, input);
  if (result.ok) {
    refreshTaxonomyCaches([]);
    revalidatePath(PATH);
  }
  return result;
}

export async function updateTermAction(kind: TaxonomyKind, id: number, raw: TermInput): Promise<TaxonomyResult> {
  const user = await requireAbility("content.review");
  if (!isKind(kind) || !Number.isInteger(id)) return { ok: false, error: "Permintaan tidak sah." };
  const parsed = parseInput(termSchema, raw);
  if (!parsed.ok) return parsed;
  const input = parsed.data;
  const { result, archives } = await updateTerm(user, kind, id, input);
  if (result.ok) {
    refreshTaxonomyCaches(archives);
    revalidatePath(PATH);
  }
  return result;
}

export async function mergeTermsAction(kind: TaxonomyKind, sourceId: number, targetId: number): Promise<TaxonomyResult> {
  const user = await requireAbility("content.review");
  if (!isKind(kind) || !Number.isInteger(sourceId) || !Number.isInteger(targetId)) return { ok: false, error: "Permintaan tidak sah." };
  const { result, archives, slugs } = await mergeTerms(user, kind, sourceId, targetId);
  if (result.ok) {
    refreshTaxonomyCaches(archives, slugs);
    revalidatePath(PATH);
  }
  return result;
}

export async function searchTagTargetsAction(q: string, excludeId: number): Promise<{ id: number; name: string; slug: string }[]> {
  await requireAbility("content.review");
  return searchTagTargets(String(q).slice(0, 80), Number(excludeId));
}
