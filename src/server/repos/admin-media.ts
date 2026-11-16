import "server-only";

import { type SQL, and, desc, eq, ilike, or, sql } from "drizzle-orm";

import type { MediaDetail, MediaItem, MediaListFilters, MediaUsage } from "@/types/admin-media";
import { getDb, schema } from "../db";

const { audits, media, pages, posts, reports, settings, users } = schema;

export const MEDIA_PAGE_SIZE = 40;

const likePattern = (q: string) => `%${q.replace(/[\\%_]/g, "\\$&")}%`;

/** Folder "YYYY/MM" dari pathname (wp-content/uploads/2026/11/… atau media/2026/11/…). */
const folderExpr = sql<string | null>`substring(${media.pathname} from '(?:uploads|media)/([0-9]{4}/[0-9]{2})/')`;

const columns = {
  id: media.id,
  url: media.url,
  pathname: media.pathname,
  mime: media.mime,
  size: media.size,
  width: media.width,
  height: media.height,
  alt: media.alt,
  caption: media.caption,
  source: media.source,
};

type Row = { id: number; url: string; pathname: string; mime: string; size: number | null; width: number | null; height: number | null; alt: string; caption: string | null; source: "legacy" | "blob" };

export const toMediaItem = (r: Row): MediaItem => ({ ...r, caption: r.caption ?? "", name: r.pathname.split("/").pop() ?? r.pathname });

function conditions(f: MediaListFilters): SQL | undefined {
  const where: (SQL | undefined)[] = [];
  const q = f.q.trim();
  if (q) where.push(or(ilike(media.pathname, likePattern(q)), ilike(media.alt, likePattern(q))));
  if (f.kind === "image") where.push(sql`${media.mime} like 'image/%'`);
  else if (f.kind === "pdf") where.push(eq(media.mime, "application/pdf"));
  else if (f.kind === "video") where.push(sql`${media.mime} like 'video/%'`);
  if (/^\d{4}\/\d{2}$/.test(f.folder)) where.push(sql`${folderExpr} = ${f.folder}`);
  if (f.noAlt) where.push(sql`${media.mime} like 'image/%' and btrim(${media.alt}) = ''`);
  return where.length ? and(...where) : undefined;
}

export async function listMedia(f: MediaListFilters): Promise<{ items: MediaItem[]; total: number }> {
  const db = getDb();
  const where = conditions(f);
  const [rows, [countRow]] = await Promise.all([
    db
      .select(columns)
      .from(media)
      .where(where)
      // Unggahan baru dulu; media lama (waktu seed sama) diurutkan menurut folder terbaru.
      .orderBy(desc(media.source), sql`${folderExpr} desc nulls last`, desc(media.createdAt), desc(media.id))
      .limit(MEDIA_PAGE_SIZE)
      .offset((f.page - 1) * MEDIA_PAGE_SIZE),
    db.select({ n: sql<number>`count(*)`.mapWith(Number) }).from(media).where(where),
  ]);
  return { items: rows.map(toMediaItem), total: countRow?.n ?? 0 };
}

/** Ringkasan untuk kepala halaman & pilihan filter folder. */
export async function mediaOverview(): Promise<{ total: number; noAlt: number; folders: string[] }> {
  const db = getDb();
  const [[row], folders] = await Promise.all([
    db
      .select({
        total: sql<number>`count(*)`.mapWith(Number),
        noAlt: sql<number>`count(*) filter (where ${media.mime} like 'image/%' and btrim(${media.alt}) = '')`.mapWith(Number),
      })
      .from(media),
    db.selectDistinct({ folder: folderExpr }).from(media).orderBy(sql`${folderExpr} desc nulls last`),
  ]);
  return { total: row?.total ?? 0, noAlt: row?.noAlt ?? 0, folders: folders.map((f) => f.folder).filter((f): f is string => Boolean(f)) };
}

export async function findMediaRow(id: number) {
  const [row] = await getDb().select().from(media).where(eq(media.id, id)).limit(1);
  return row ?? null;
}

/**
 * Di mana sebuah media dipakai: gambar unggulan / isi / og:image publikasi, section halaman,
 * pengaturan (beranda, identitas), sampul e-Report, dan PDF audit. Pencocokan memakai URL persis
 * seperti yang tersimpan di konten.
 */
export async function findMediaUsage(item: { id: number; url: string }): Promise<MediaUsage[]> {
  const db = getDb();
  const pattern = likePattern(item.url);
  const [postRows, pageRows, settingRows, reportRows, auditRows] = await Promise.all([
    db
      .select({ id: posts.id, title: posts.title })
      .from(posts)
      .where(or(eq(posts.featuredMediaId, item.id), eq(posts.ogImage, item.url), sql`${posts.contentHtml} like ${pattern}`))
      .orderBy(desc(posts.id))
      .limit(50),
    db.select({ id: pages.id, title: pages.title, path: pages.path }).from(pages).where(sql`${pages.sections}::text like ${pattern} or ${pages.ogImage} = ${item.url}`).limit(50),
    db.select({ key: settings.key }).from(settings).where(sql`${settings.value}::text like ${pattern}`),
    db.select({ id: reports.id, title: reports.title }).from(reports).where(eq(reports.coverMediaId, item.id)).limit(50),
    db.select({ id: audits.id, year: audits.year }).from(audits).where(eq(audits.pdfMediaId, item.id)),
  ]);

  const settingLabel: Record<string, string> = { home: "Beranda", "home.draft": "Beranda (draf)", identity: "Identitas situs", menu: "Menu", integrations: "Integrasi", contact: "Kontak", socials: "Media sosial" };
  return [
    ...postRows.map((p): MediaUsage => ({ kind: "post", label: `Publikasi: ${p.title}`, href: `/admin/publikasi/${p.id}/` })),
    ...pageRows.map((p): MediaUsage => ({ kind: "page", label: `Halaman: ${p.title || `/${p.path}/`}`, href: `/admin/halaman/${p.id}/` })),
    ...settingRows.map((s): MediaUsage => ({ kind: "settings", label: `Pengaturan: ${settingLabel[s.key] ?? s.key}`, href: s.key.startsWith("home") ? "/admin/beranda/" : "/admin/pengaturan/" })),
    ...reportRows.map((r): MediaUsage => ({ kind: "report", label: `e-Report: ${r.title}`, href: "/admin/laporan/" })),
    ...auditRows.map((a): MediaUsage => ({ kind: "audit", label: `Audit ${a.year}`, href: "/admin/laporan/" })),
  ];
}

export async function getMediaDetail(id: number): Promise<MediaDetail | null> {
  const [row] = await getDb()
    .select({ ...columns, createdAt: media.createdAt, uploader: users.name })
    .from(media)
    .leftJoin(users, eq(users.id, media.uploadedBy))
    .where(eq(media.id, id))
    .limit(1);
  if (!row) return null;
  const { createdAt, uploader, ...rest } = row;
  return { item: toMediaItem(rest), uploadedBy: uploader, uploadedAt: createdAt.toISOString(), usage: await findMediaUsage(row) };
}
