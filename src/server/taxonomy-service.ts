import "server-only";

import { and, eq, inArray, like, ne, or, sql } from "drizzle-orm";

import { slugify } from "@/lib/slug";
import type { TaxonomyKind, TaxonomyResult, TaxonomyRow, TermInput } from "@/types/admin-taxonomy";
import { type DbOrTx, logActivity } from "./activity";
import { getDb, schema } from "./db";
import type { AuthUser } from "./permissions";

const { categories, postCategories, postTags, posts, redirects, tags } = schema;

/** Kategori yang dipakai kode situs (jenis publikasi & tab Publikasi) — tidak boleh dihapus/digabung/diganti slug. */
export const PROTECTED_CATEGORY_SLUGS: ReadonlySet<string> = new Set(["blog", "berita", "artikel", "kemitraan"]);

const archivePath = (kind: TaxonomyKind, path: string) => (kind === "category" ? `/category/${path}/` : `/tag/${path}/`);

class TaxError extends Error {
  constructor(
    message: string,
    public readonly field?: "name" | "slug" | "parentId" | "target",
  ) {
    super(message);
  }
}

/* ---------- Daftar ---------- */

/**
 * Jumlah publikasi (selain sampah) per istilah. Nama tabel ditulis lengkap: di dalam subquery,
 * kolom `id` tanpa awalan akan terbaca sebagai `posts.id`.
 */
const categoryCount = sql<number>`(select count(*) from post_categories pc inner join posts p on p.id = pc.post_id where pc.category_id = "categories"."id" and p.status <> 'trashed')`.mapWith(Number);
const tagCount = sql<number>`(select count(*) from post_tags pt inner join posts p on p.id = pt.post_id where pt.tag_id = "tags"."id" and p.status <> 'trashed')`.mapWith(Number);

/** Kategori berurutan sebagai pohon (induk diikuti anak-anaknya). */
export async function listCategoryRows(): Promise<TaxonomyRow[]> {
  const rows = await getDb()
    .select({ id: categories.id, name: categories.name, slug: categories.slug, path: categories.path, description: categories.description, parentId: categories.parentId, count: categoryCount })
    .from(categories);
  const byParent = new Map<number | null, typeof rows>();
  for (const r of rows) byParent.set(r.parentId, [...(byParent.get(r.parentId) ?? []), r]);
  const out: TaxonomyRow[] = [];
  const walk = (parent: number | null, depth: number) => {
    for (const r of (byParent.get(parent) ?? []).sort((a, b) => b.count - a.count || a.name.localeCompare(b.name))) {
      out.push({ ...r, kind: "category", depth });
      if (depth < 5) walk(r.id, depth + 1);
    }
  };
  walk(null, 0);
  // Yatim (induk tidak ada) tetap ditampilkan.
  for (const r of rows) if (!out.some((o) => o.id === r.id)) out.push({ ...r, kind: "category", depth: 0 });
  return out;
}

export const TAG_PAGE_SIZE = 50;

export async function listTagRows(q: string, page: number, sort: "count" | "name"): Promise<{ rows: TaxonomyRow[]; total: number }> {
  const db = getDb();
  const term = q.trim();
  const where = term ? or(like(sql`lower(${tags.name})`, `%${term.toLowerCase().replace(/[\\%_]/g, "\\$&")}%`), like(tags.slug, `%${slugify(term)}%`)) : undefined;
  const count = tagCount;
  const [rows, [totalRow]] = await Promise.all([
    db
      .select({ id: tags.id, name: tags.name, slug: tags.slug, description: tags.description, count })
      .from(tags)
      .where(where)
      .orderBy(...(sort === "name" ? [sql`lower(${tags.name})`] : [sql`${count} desc`, sql`lower(${tags.name})`]))
      .limit(TAG_PAGE_SIZE)
      .offset((page - 1) * TAG_PAGE_SIZE),
    db.select({ n: sql<number>`count(*)`.mapWith(Number) }).from(tags).where(where),
  ]);
  return { total: totalRow?.n ?? 0, rows: rows.map((r) => ({ ...r, kind: "tag", path: r.slug, parentId: null, depth: 0 })) };
}

export async function taxonomyTotals(): Promise<{ categories: number; tags: number }> {
  const [row] = await getDb()
    .select({ c: sql<number>`(select count(*) from ${categories})`.mapWith(Number), t: sql<number>`(select count(*) from ${tags})`.mapWith(Number) })
    .from(sql`(select 1) x`);
  return { categories: row?.c ?? 0, tags: row?.t ?? 0 };
}

/** Pilihan tujuan "Gabungkan" untuk tag (dicari berdasarkan nama). */
export async function searchTagTargets(q: string, excludeId: number): Promise<{ id: number; name: string; slug: string }[]> {
  const term = q.trim().toLowerCase();
  if (term.length < 2) return [];
  return getDb()
    .select({ id: tags.id, name: tags.name, slug: tags.slug })
    .from(tags)
    .where(and(ne(tags.id, excludeId), like(sql`lower(${tags.name})`, `%${term.replace(/[\\%_]/g, "\\$&")}%`)))
    .orderBy(sql`length(${tags.name})`)
    .limit(12);
}

/* ---------- Validasi ---------- */

function cleanInput(kind: TaxonomyKind, input: TermInput): { name: string; slug: string; description: string; parentId: number | null } {
  const name = input.name.trim().replace(/\s+/g, " ");
  if (!name) throw new TaxError("Nama wajib diisi.", "name");
  if (name.length > 120) throw new TaxError("Nama terlalu panjang (maksimal 120 karakter).", "name");
  const slug = (input.slug.trim() || slugify(name)).toLowerCase();
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug) || slug.length > 100) throw new TaxError("Slug hanya boleh berisi huruf kecil, angka, dan tanda hubung.", "slug");
  if (slug === "page") throw new TaxError("Slug ini dipakai untuk penomoran halaman arsip.", "slug");
  const description = input.description.trim().slice(0, 500);
  const parentId = kind === "category" && input.parentId ? input.parentId : null;
  return { name, slug, description, parentId };
}

/** Path arsip kategori (induk/anak) dan pemeriksaan siklus. */
async function categoryPath(tx: DbOrTx, slug: string, parentId: number | null, selfId: number | null): Promise<string> {
  if (!parentId) return slug;
  const [parent] = await tx.select({ id: categories.id, path: categories.path }).from(categories).where(eq(categories.id, parentId)).limit(1);
  if (!parent) throw new TaxError("Induk tidak ditemukan.", "parentId");
  if (selfId !== null) {
    if (parent.id === selfId) throw new TaxError("Kategori tidak bisa menjadi induk dirinya sendiri.", "parentId");
    const [self] = await tx.select({ path: categories.path }).from(categories).where(eq(categories.id, selfId)).limit(1);
    if (self && (parent.path === self.path || parent.path.startsWith(`${self.path}/`))) throw new TaxError("Induk tidak boleh salah satu turunan kategori ini.", "parentId");
  }
  return `${parent.path}/${slug}`;
}

async function addRedirect(tx: DbOrTx, from: string, to: string, note: string): Promise<void> {
  if (from === to) return;
  // Redirect lama yang menunjuk ke `from` diarahkan langsung ke tujuan baru (hindari rantai).
  await tx.update(redirects).set({ destination: to }).where(eq(redirects.destination, from));
  await tx.delete(redirects).where(eq(redirects.source, to));
  await tx.insert(redirects).values({ source: from, destination: to, statusCode: 301, note }).onConflictDoUpdate({ target: redirects.source, set: { destination: to, statusCode: 301, note } });
}

/* ---------- Tambah / ubah ---------- */

export type TaxonomyOutcome = { result: TaxonomyResult; archives: string[] };

const fail = (error: unknown): TaxonomyOutcome => {
  if (error instanceof TaxError) return { result: { ok: false, error: error.message, field: error.field }, archives: [] };
  const code = (error as { code?: string; cause?: { code?: string } })?.cause?.code ?? (error as { code?: string })?.code;
  if (code === "23505") return { result: { ok: false, error: "Slug sudah dipakai istilah lain.", field: "slug" }, archives: [] };
  console.error("taksonomi gagal", error);
  return { result: { ok: false, error: "Gagal menyimpan. Coba lagi." }, archives: [] };
};

export async function createTerm(user: AuthUser, kind: TaxonomyKind, input: TermInput): Promise<TaxonomyOutcome> {
  try {
    const v = cleanInput(kind, input);
    return await getDb().transaction(async (tx) => {
      if (kind === "category") {
        const path = await categoryPath(tx, v.slug, v.parentId, null);
        const [row] = await tx.insert(categories).values({ name: v.name, slug: v.slug, path, description: v.description, parentId: v.parentId }).returning({ id: categories.id });
        await logActivity({ userId: user.id, action: "create", entity: "category", entityId: row?.id, summary: `Menambah kategori “${v.name}” (/category/${path}/)` }, tx);
        return { result: { ok: true as const, message: `Kategori “${v.name}” ditambahkan.` }, archives: [] };
      }
      const [row] = await tx.insert(tags).values({ name: v.name, slug: v.slug, description: v.description }).returning({ id: tags.id });
      await logActivity({ userId: user.id, action: "create", entity: "tag", entityId: row?.id, summary: `Menambah tag “${v.name}”` }, tx);
      return { result: { ok: true as const, message: `Tag “${v.name}” ditambahkan.` }, archives: [] };
    });
  } catch (error) {
    return fail(error);
  }
}

/**
 * Ubah nama/slug/induk/deskripsi. Bila path arsip berubah, semua path anak ikut diperbarui dan
 * dibuat redirect 301 dari arsip lama ke arsip baru.
 */
export async function updateTerm(user: AuthUser, kind: TaxonomyKind, id: number, input: TermInput): Promise<TaxonomyOutcome> {
  try {
    const v = cleanInput(kind, input);
    return await getDb().transaction(async (tx) => {
      if (kind === "tag") {
        const [old] = await tx.select().from(tags).where(eq(tags.id, id)).limit(1);
        if (!old) throw new TaxError("Tag tidak ditemukan.");
        await tx.update(tags).set({ name: v.name, slug: v.slug, description: v.description }).where(eq(tags.id, id));
        const archives = [archivePath("tag", old.slug), archivePath("tag", v.slug)];
        if (old.slug !== v.slug) await addRedirect(tx, archivePath("tag", old.slug), archivePath("tag", v.slug), `Otomatis: slug tag “${v.name}” diubah`);
        await logActivity({ userId: user.id, action: "edit", entity: "tag", entityId: id, summary: `Mengubah tag “${v.name}”`, diff: diffOf(old, v) }, tx);
        return { result: { ok: true as const, message: "Tag disimpan." }, archives };
      }

      const [old] = await tx.select().from(categories).where(eq(categories.id, id)).limit(1);
      if (!old) throw new TaxError("Kategori tidak ditemukan.");
      if (PROTECTED_CATEGORY_SLUGS.has(old.slug) && (old.slug !== v.slug || old.parentId !== v.parentId)) {
        throw new TaxError("Slug dan induk kategori ini dipakai struktur situs dan tidak bisa diubah; nama & deskripsi tetap bisa.", "slug");
      }
      const path = await categoryPath(tx, v.slug, v.parentId, id);
      await tx.update(categories).set({ name: v.name, slug: v.slug, path, description: v.description, parentId: v.parentId }).where(eq(categories.id, id));
      const archives = [archivePath("category", old.path)];
      if (old.path !== path) {
        // Path turunan: ganti awalan lama dengan yang baru, beserta redirect masing-masing.
        const children = await tx.select({ id: categories.id, path: categories.path }).from(categories).where(like(categories.path, `${old.path.replace(/[\\%_]/g, "\\$&")}/%`));
        for (const c of children) {
          const next = `${path}${c.path.slice(old.path.length)}`;
          await tx.update(categories).set({ path: next }).where(eq(categories.id, c.id));
          await addRedirect(tx, archivePath("category", c.path), archivePath("category", next), "Otomatis: path kategori induk diubah");
          archives.push(archivePath("category", c.path));
        }
        await addRedirect(tx, archivePath("category", old.path), archivePath("category", path), `Otomatis: alamat kategori “${v.name}” diubah`);
      }
      await logActivity({ userId: user.id, action: "edit", entity: "category", entityId: id, summary: `Mengubah kategori “${v.name}”`, diff: { ...diffOf(old, v), ...(old.path !== path ? { path: [old.path, path] } : {}) } }, tx);
      return { result: { ok: true as const, message: "Kategori disimpan." }, archives };
    });
  } catch (error) {
    return fail(error);
  }
}

function diffOf(old: { name: string; slug: string; description: string; parentId?: number | null }, v: { name: string; slug: string; description: string; parentId: number | null }) {
  const d: Record<string, unknown> = {};
  if (old.name !== v.name) d.name = [old.name, v.name];
  if (old.slug !== v.slug) d.slug = [old.slug, v.slug];
  if (old.description !== v.description) d.description = [old.description, v.description];
  if ("parentId" in old && (old.parentId ?? null) !== v.parentId) d.parentId = [old.parentId, v.parentId];
  return d;
}

/* ---------- Gabungkan ---------- */

/**
 * Pindahkan semua publikasi dari `sourceId` ke `targetId`, buat redirect 301 dari arsip lama ke
 * arsip tujuan, lalu hapus istilah lama. Untuk kategori: anak-anak istilah lama dipindah ke tujuan
 * (path & redirect mereka ikut diperbarui). Mengembalikan arsip yang perlu disegarkan.
 */
export async function mergeTerms(user: AuthUser, kind: TaxonomyKind, sourceId: number, targetId: number): Promise<TaxonomyOutcome & { slugs: string[] }> {
  try {
    if (sourceId === targetId) throw new TaxError("Pilih istilah tujuan yang berbeda.", "target");
    return await getDb().transaction(async (tx) => {
      if (kind === "tag") {
        const [src] = await tx.select().from(tags).where(eq(tags.id, sourceId)).limit(1);
        const [dst] = await tx.select().from(tags).where(eq(tags.id, targetId)).limit(1);
        if (!src || !dst) throw new TaxError("Tag tidak ditemukan.", "target");
        const moved = await tx.select({ postId: postTags.postId }).from(postTags).where(eq(postTags.tagId, src.id));
        if (moved.length) await tx.insert(postTags).values(moved.map((m) => ({ postId: m.postId, tagId: dst.id }))).onConflictDoNothing();
        await tx.delete(tags).where(eq(tags.id, src.id)); // post_tags lama ikut terhapus (cascade)
        await addRedirect(tx, archivePath("tag", src.slug), archivePath("tag", dst.slug), `Gabungkan tag “${src.name}” → “${dst.name}”`);
        await logActivity({ userId: user.id, action: "merge", entity: "tag", entityId: dst.id, summary: `Menggabungkan tag “${src.name}” ke “${dst.name}” (${moved.length} publikasi)`, diff: { from: { id: src.id, slug: src.slug }, to: { id: dst.id, slug: dst.slug }, posts: moved.length } }, tx);
        return {
          result: { ok: true as const, message: `“${src.name}” digabungkan ke “${dst.name}” (${moved.length} publikasi dipindah).` },
          archives: [archivePath("tag", src.slug), archivePath("tag", dst.slug)],
          slugs: await publishedSlugs(tx, moved.map((m) => m.postId)),
        };
      }

      const [src] = await tx.select().from(categories).where(eq(categories.id, sourceId)).limit(1);
      const [dst] = await tx.select().from(categories).where(eq(categories.id, targetId)).limit(1);
      if (!src || !dst) throw new TaxError("Kategori tidak ditemukan.", "target");
      if (PROTECTED_CATEGORY_SLUGS.has(src.slug)) throw new TaxError("Kategori ini dipakai struktur situs dan tidak bisa digabungkan.", "target");
      if (dst.path === src.path || dst.path.startsWith(`${src.path}/`)) throw new TaxError("Tujuan tidak boleh turunan kategori yang digabungkan.", "target");

      const moved = await tx.select({ postId: postCategories.postId }).from(postCategories).where(eq(postCategories.categoryId, src.id));
      if (moved.length) await tx.insert(postCategories).values(moved.map((m) => ({ postId: m.postId, categoryId: dst.id }))).onConflictDoNothing();

      // Anak langsung pindah ke tujuan; path semua turunan diperbarui + redirect.
      const archives = [archivePath("category", src.path), archivePath("category", dst.path)];
      const descendants = await tx.select({ id: categories.id, path: categories.path, parentId: categories.parentId, slug: categories.slug }).from(categories).where(like(categories.path, `${src.path.replace(/[\\%_]/g, "\\$&")}/%`));
      for (const c of descendants.sort((a, b) => a.path.length - b.path.length)) {
        const next = `${dst.path}${c.path.slice(src.path.length)}`;
        const [clash] = await tx.select({ id: categories.id }).from(categories).where(and(eq(categories.path, next), ne(categories.id, c.id))).limit(1);
        if (clash) throw new TaxError(`Subkategori “${c.slug}” bentrok dengan subkategori yang sudah ada di tujuan. Gabungkan subkategori itu dulu.`, "target");
        await tx.update(categories).set({ path: next, ...(c.parentId === src.id ? { parentId: dst.id } : {}) }).where(eq(categories.id, c.id));
        await addRedirect(tx, archivePath("category", c.path), archivePath("category", next), `Gabungkan kategori “${src.name}” → “${dst.name}”`);
        archives.push(archivePath("category", c.path));
      }
      await tx.delete(categories).where(eq(categories.id, src.id)); // post_categories lama ikut terhapus (cascade)
      await addRedirect(tx, archivePath("category", src.path), archivePath("category", dst.path), `Gabungkan kategori “${src.name}” → “${dst.name}”`);
      await logActivity({ userId: user.id, action: "merge", entity: "category", entityId: dst.id, summary: `Menggabungkan kategori “${src.name}” ke “${dst.name}” (${moved.length} publikasi)`, diff: { from: { id: src.id, path: src.path }, to: { id: dst.id, path: dst.path }, posts: moved.length, subcategories: descendants.length } }, tx);
      return {
        result: { ok: true as const, message: `“${src.name}” digabungkan ke “${dst.name}” (${moved.length} publikasi dipindah).` },
        archives,
        slugs: await publishedSlugs(tx, moved.map((m) => m.postId)),
      };
    });
  } catch (error) {
    return { ...fail(error), slugs: [] };
  }
}

async function publishedSlugs(tx: DbOrTx, ids: number[]): Promise<string[]> {
  if (!ids.length) return [];
  const rows = await tx.select({ slug: posts.slug }).from(posts).where(and(inArray(posts.id, ids.slice(0, 1000)), eq(posts.status, "published")));
  return rows.map((r) => r.slug);
}
