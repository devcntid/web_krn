import "server-only";

import { and, eq } from "drizzle-orm";

import type { Page, PageSummary, SeoMeta } from "@/types/content";
import { getDb, schema } from "../db";
import { wibText } from "./shared";

const { pages } = schema;
const published = eq(pages.status, "published");

type Section = { type?: string; visible?: boolean; data?: { html?: string } };

/** HTML halaman generik = gabungan section "richtext" yang tampil. */
function sectionsToHtml(sections: unknown): string {
  if (!Array.isArray(sections)) return "";
  return (sections as Section[])
    .filter((s) => s.type === "richtext" && s.visible !== false)
    .map((s) => s.data?.html ?? "")
    .join("\n");
}

const slugOf = (path: string) => path.split("/").pop() ?? path;

export async function listPublishedPages(): Promise<PageSummary[]> {
  const rows = await getDb()
    .select({ rowId: pages.id, legacyId: pages.legacyId, path: pages.path, title: pages.title, modified: wibText(pages.updatedAt) })
    .from(pages)
    .where(published)
    .orderBy(pages.id);
  return rows.map((r) => ({ id: r.legacyId ?? r.rowId, path: r.path, slug: slugOf(r.path), title: r.title, modified: r.modified }));
}

export async function findPublishedPage(path: string): Promise<Page | null> {
  const [row] = await getDb()
    .select({
      rowId: pages.id,
      legacyId: pages.legacyId,
      path: pages.path,
      title: pages.title,
      modified: wibText(pages.updatedAt),
      sections: pages.sections,
      seoTitle: pages.seoTitle,
      seoDescription: pages.seoDescription,
      ogImage: pages.ogImage,
      canonical: pages.canonical,
      robots: pages.robots,
    })
    .from(pages)
    .where(and(eq(pages.path, path), published))
    .limit(1);
  if (!row) return null;

  const seo: SeoMeta = {
    title: row.seoTitle ?? "",
    description: row.seoDescription ?? "",
    canonical: row.canonical ?? `/${row.path}/`,
    robots: row.robots ?? "",
    ogTitle: row.seoTitle ?? undefined,
    ogDescription: row.seoDescription ?? undefined,
    ogImage: row.ogImage ?? undefined,
    ogType: "article",
    modifiedTime: `${row.modified}+07:00`,
  };
  return { id: row.legacyId ?? row.rowId, path: row.path, slug: slugOf(row.path), title: row.title, modified: row.modified, html: sectionsToHtml(row.sections), seo };
}
