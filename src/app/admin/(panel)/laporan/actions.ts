"use server";

import { revalidatePath, updateTag } from "next/cache";

import { CACHE_TAGS } from "@/lib/content";
import { auditSchema, legalSchema, parseInput, reportSchema } from "@/server/action-input";
import { requireAbility } from "@/server/permissions";
import * as svc from "@/server/transparency-service";
import type { AuditInput, LegalInput, ReportInput, TransparencyResult } from "@/types/admin-transparency";

/** Segarkan halaman publik terkait (cache data transparansi + halaman id/en) dan admin. */
function refresh(paths: readonly string[]) {
  updateTag(CACHE_TAGS.transparency);
  for (const p of paths) {
    revalidatePath(p);
    revalidatePath(`/en${p}`);
  }
  revalidatePath("/admin/laporan");
}
const REPORT = ["/e-report"];
const AUDIT = ["/audit-keuangan"];
const LEGAL = ["/asas-legalitas"];

/** Validasi bentuk input dengan Zod sebelum service dipanggil. */
const guarded = <T,>(schema: Parameters<typeof parseInput<T>>[0], raw: unknown, fn: (input: T) => Promise<TransparencyResult>): Promise<TransparencyResult> => {
  const parsed = parseInput(schema, raw);
  return parsed.ok ? fn(parsed.data) : Promise.resolve(parsed);
};

async function act(paths: readonly string[], fn: (user: Awaited<ReturnType<typeof requireAbility>>) => Promise<TransparencyResult>): Promise<TransparencyResult> {
  const user = await requireAbility("compliance.manage");
  const result = await fn(user);
  if (result.ok) refresh(paths);
  return result;
}
const int = (n: unknown) => (Number.isInteger(n) ? (n as number) : Number.NaN);
const step = (s: unknown): -1 | 1 => (s === -1 ? -1 : 1);

export const createReportAction = async (input: ReportInput) => act(REPORT, (u) => guarded(reportSchema, input, (d) => svc.createReport(u, d)));
export const updateReportAction = async (id: number, input: ReportInput) => act(REPORT, (u) => guarded(reportSchema, input, (d) => svc.updateReport(u, int(id), d)));
export const setReportVisibleAction = async (id: number, visible: boolean) => act(REPORT, (u) => svc.setReportVisible(u, int(id), visible === true));
export const moveReportAction = async (id: number, s: -1 | 1) => act(REPORT, (u) => svc.moveReport(u, int(id), step(s)));
export const deleteReportAction = async (id: number) => act(REPORT, (u) => svc.deleteReport(u, int(id)));

export const saveAuditAction = async (id: number | null, input: AuditInput) => act(AUDIT, (u) => guarded(auditSchema, input, (d) => svc.saveAudit(u, id === null ? null : int(id), d)));
export const deleteAuditAction = async (id: number) => act(AUDIT, (u) => svc.deleteAudit(u, int(id)));

export const saveLegalDocAction = async (id: number | null, input: LegalInput) => act(LEGAL, (u) => guarded(legalSchema, input, (d) => svc.saveLegalDoc(u, id === null ? null : int(id), d)));
export const moveLegalDocAction = async (id: number, s: -1 | 1) => act(LEGAL, (u) => svc.moveLegalDoc(u, int(id), step(s)));
export const deleteLegalDocAction = async (id: number) => act(LEGAL, (u) => svc.deleteLegalDoc(u, int(id)));
