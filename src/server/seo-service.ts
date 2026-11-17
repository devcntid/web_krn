import "server-only";

import { desc, eq, sql } from "drizzle-orm";

import { isDonationAppPath } from "@/config/routes";
import { STATIC_REDIRECT_SOURCES, forbiddenSource, isStaticRedirect, normalizeRedirectPath } from "@/lib/redirect-rules";
import type { AdminRedirect, NotFoundEntry, RedirectInput, SeoResult } from "@/types/admin-seo";
import { legacyRedirects } from "@/config/redirects";
import { logActivity } from "./activity";
import { getDb, schema } from "./db";
import type { AuthUser } from "./permissions";

const { notFoundLog, redirects } = schema;

export async function listAdminRedirects(): Promise<AdminRedirect[]> {
  const rows = await getDb().select().from(redirects).orderBy(desc(redirects.updatedAt), desc(redirects.id));
  return rows.map((r) => ({ id: r.id, source: r.source, destination: r.destination, statusCode: r.statusCode, note: r.note ?? "", hits: r.hits, isStatic: isStaticRedirect(r.source) }));
}

/** Log 404 yang belum punya redirect, paling sering dulu. */
export async function listNotFound(limit = 100): Promise<NotFoundEntry[]> {
  const rows = await getDb()
    .select({ path: notFoundLog.path, hits: notFoundLog.hits, lastSeen: notFoundLog.lastSeen })
    .from(notFoundLog)
    .where(sql`not exists (select 1 from ${redirects} where rtrim(${redirects.source}, '/') = rtrim(${notFoundLog.path}, '/'))`)
    .orderBy(desc(notFoundLog.hits), desc(notFoundLog.lastSeen))
    .limit(limit);
  return rows.map((r) => ({ ...r, lastSeen: r.lastSeen.toISOString() }));
}

class SeoError extends Error {
  constructor(message: string, public readonly field?: "source" | "destination") {
    super(message);
  }
}

/**
 * Validasi redirect: sumber & tujuan sah, tidak menunjuk dirinya sendiri, dan tidak membentuk
 * loop dengan redirect lain (database + statis). Mengembalikan nilai yang sudah dinormalkan.
 */
async function validate(input: RedirectInput, selfId: number | null) {
  const source = normalizeRedirectPath(input.source);
  const problem = forbiddenSource(source);
  if (problem) throw new SeoError(problem, "source");
  if (source.length > 500) throw new SeoError("Path sumber terlalu panjang.", "source");
  if (STATIC_REDIRECT_SOURCES.has(source)) throw new SeoError("Path ini sudah dialihkan oleh redirect statis (next.config).", "source");
  const status = Number(input.statusCode);
  if (status !== 301 && status !== 302 && status !== 410) throw new SeoError("Kode harus 301, 302, atau 410.");

  let destination = "";
  if (status !== 410) {
    const raw = input.destination.trim();
    if (!raw) throw new SeoError("Tujuan wajib diisi (kecuali 410).", "destination");
    if (/^https?:\/\//i.test(raw) && !/^https?:\/\/(?:www\.)?relawannusantara\.org(\/|$)/i.test(raw)) {
      if (!/^https:\/\//i.test(raw)) throw new SeoError("URL luar harus https://.", "destination");
      destination = raw;
    } else if (/^(\/|https?:\/\/(?:www\.)?relawannusantara\.org)/i.test(raw)) {
      destination = isDonationAppPath(raw.replace(/^https?:\/\/[^/]+/, "")) ? raw.replace(/^https?:\/\/[^/]+/, "") : normalizeRedirectPath(raw);
    } else throw new SeoError("Tujuan harus path (/…/) atau URL https://.", "destination");
    if (destination === source) throw new SeoError("Tujuan tidak boleh sama dengan sumber.", "destination");
  }

  // Ikuti rantai dari tujuan; bila kembali ke sumber = loop.
  if (destination.startsWith("/")) {
    const rows = await getDb().select({ id: redirects.id, source: redirects.source, destination: redirects.destination, statusCode: redirects.statusCode }).from(redirects);
    const next = new Map<string, string>();
    for (const r of rows) if (r.id !== selfId && r.statusCode !== 410 && r.destination.startsWith("/")) next.set(r.source, r.destination);
    for (const r of legacyRedirects) if (!r.source.includes(":")) next.set(r.source, r.destination);
    const seen = new Set<string>([source]);
    let cur: string | undefined = destination;
    for (let i = 0; cur && i < 20; i++) {
      if (seen.has(cur)) throw new SeoError(`Membentuk loop: ${[...seen, cur].join(" → ")}`, "destination");
      seen.add(cur);
      cur = next.get(cur);
    }
  }
  return { source, destination, statusCode: status, note: input.note.trim().slice(0, 300) || null };
}

const fail = (error: unknown): SeoResult => {
  if (error instanceof SeoError) return { ok: false, error: error.message, field: error.field };
  const code = (error as { cause?: { code?: string } })?.cause?.code;
  if (code === "23505") return { ok: false, error: "Sudah ada redirect dari path ini.", field: "source" };
  console.error("redirect gagal", error);
  return { ok: false, error: "Gagal menyimpan. Coba lagi." };
};

export async function saveRedirect(user: AuthUser, id: number | null, input: RedirectInput): Promise<SeoResult> {
  try {
    const v = await validate(input, id);
    const db = getDb();
    if (id === null) {
      const [row] = await db.insert(redirects).values(v).returning({ id: redirects.id });
      await logActivity({ userId: user.id, action: "create", entity: "redirect", entityId: row?.id, summary: `Menambah redirect ${v.source} → ${v.destination || "410"} (${v.statusCode})` });
      return { ok: true, message: "Redirect ditambahkan." };
    }
    const [old] = await db.select().from(redirects).where(eq(redirects.id, id)).limit(1);
    if (!old) throw new SeoError("Redirect tidak ditemukan.");
    if (isStaticRedirect(old.source)) throw new SeoError("Redirect statis diatur di kode (src/config/redirects.ts).");
    await db.update(redirects).set(v).where(eq(redirects.id, id));
    await logActivity({ userId: user.id, action: "edit", entity: "redirect", entityId: id, summary: `Mengubah redirect ${v.source} → ${v.destination || "410"} (${v.statusCode})`, diff: { before: [old.source, old.destination, old.statusCode], after: [v.source, v.destination, v.statusCode] } });
    return { ok: true, message: "Redirect disimpan." };
  } catch (error) {
    return fail(error);
  }
}

export async function deleteRedirect(user: AuthUser, id: number): Promise<SeoResult> {
  try {
    const db = getDb();
    const [old] = await db.select().from(redirects).where(eq(redirects.id, id)).limit(1);
    if (!old) throw new SeoError("Redirect tidak ditemukan.");
    if (isStaticRedirect(old.source)) throw new SeoError("Redirect statis diatur di kode (src/config/redirects.ts).");
    await db.delete(redirects).where(eq(redirects.id, id));
    await logActivity({ userId: user.id, action: "delete", entity: "redirect", entityId: id, summary: `Menghapus redirect ${old.source} → ${old.destination || "410"}`, diff: { source: old.source, destination: old.destination, statusCode: old.statusCode } });
    return { ok: true, message: "Redirect dihapus." };
  } catch (error) {
    return fail(error);
  }
}

export async function clearNotFound(user: AuthUser, path: string): Promise<SeoResult> {
  await getDb().delete(notFoundLog).where(eq(notFoundLog.path, path));
  await logActivity({ userId: user.id, action: "delete", entity: "not_found", entityId: path.slice(0, 200), summary: `Mengabaikan 404 ${path}` });
  return { ok: true, message: "Entri 404 dihapus." };
}

/** Kartu kesehatan SEO. Sitemap dihitung dari fungsi sitemap yang sama dengan /sitemap.xml. */
export async function seoHealth(): Promise<import("@/types/admin-seo").SeoHealth> {
  const db = getDb();
  const [[p], [g], [m]] = await Promise.all([
    db
      .select({
        noDesc: sql<number>`count(*) filter (where coalesce(btrim(${schema.posts.seoDescription}), '') = '')`.mapWith(Number),
        h1: sql<number>`count(*) filter (where ${schema.posts.contentHtml} ~* '<h1[\\s>]')`.mapWith(Number),
      })
      .from(schema.posts)
      .where(eq(schema.posts.status, "published")),
    db.select({ noDesc: sql<number>`count(*) filter (where coalesce(btrim(${schema.pages.seoDescription}), '') = '')`.mapWith(Number) }).from(schema.pages).where(eq(schema.pages.status, "published")),
    db.select({ n: sql<number>`count(*) filter (where ${schema.media.mime} like 'image/%' and btrim(${schema.media.alt}) = '')`.mapWith(Number) }).from(schema.media),
  ]);
  const { default: sitemap } = await import("@/app/sitemap");
  const entries = await sitemap();
  const path = (u: string) => u.replace(/^https?:\/\/[^/]+/, "");
  const en = entries.filter((e) => path(e.url).startsWith("/en/")).length;
  const cats = entries.filter((e) => path(e.url).startsWith("/category/")).length;
  const [{ n: postCount } = { n: 0 }] = await db.select({ n: sql<number>`count(*)`.mapWith(Number) }).from(schema.posts).where(eq(schema.posts.status, "published"));
  const { edgeConfigConfigured } = await import("./redirects-sync");
  return {
    postsNoDescription: p?.noDesc ?? 0,
    postsWithH1: p?.h1 ?? 0,
    pagesNoDescription: g?.noDesc ?? 0,
    mediaNoAlt: m?.n ?? 0,
    sitemap: { urls: entries.length, posts: Math.min(postCount, entries.length), pages: entries.length - en - cats - Math.min(postCount, entries.length), categories: cats, english: en },
    edgeConfig: edgeConfigConfigured(),
  };
}
