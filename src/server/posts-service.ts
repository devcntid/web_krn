import "server-only";

import { and, eq, inArray, ne, or } from "drizzle-orm";

import { slugProblem, slugify } from "@/lib/slug";
import type { ContentStatus, SaveField, SavePostInput, SaveResult } from "@/types/admin-posts";
import { type DbOrTx, logActivity } from "./activity";
import { autoExcerpt, sanitizeContentHtml } from "./content/sanitize";
import { getDb, schema } from "./db";
import type { AuthUser } from "./permissions";
import { can } from "./roles";

const { categories, media, pages, postCategories, postRevisions, postTags, posts, redirects, tags, users } = schema;

type PostRow = typeof posts.$inferSelect;

/** Isi revisi (`post_revisions.snapshot`): cukup untuk memulihkan tulisan, SEO, kategori, dan tag. */
export type PostSnapshot = {
  title: string;
  slug: string;
  excerpt: string;
  contentJson: unknown;
  contentHtml: string;
  seoTitle: string | null;
  seoDescription: string | null;
  canonical: string | null;
  featuredMediaId: number | null;
  categoryIds: number[];
  tagIds: number[];
  status: ContentStatus;
};

class SaveError extends Error {
  constructor(
    message: string,
    public readonly field?: SaveField,
  ) {
    super(message);
  }
}

const STATUS_LABEL: Record<ContentStatus, string> = {
  draft: "Draf",
  review: "Review",
  scheduled: "Terjadwal",
  published: "Terbit",
  trashed: "Sampah",
};

/* ---------- Hak akses per post ---------- */

/**
 * Editor/Super Admin boleh mengubah semua post. Penulis & Kontributor hanya post miliknya;
 * post yang sudah terbit/terjadwal hanya boleh diubah peran yang bisa menerbitkan.
 */
export function canEditPost(user: AuthUser, post: { authorId: string | null; status: ContentStatus }): boolean {
  if (post.status === "trashed") return false;
  if (can(user, "content.review")) return true;
  if (!can(user, "draft.write") || post.authorId !== user.id) return false;
  if ((post.status === "published" || post.status === "scheduled") && !can(user, "content.publish")) return false;
  return true;
}

/** Memindahkan ke sampah / memulihkan: aturan yang sama dengan mengedit (post di sampah dinilai dari pemiliknya). */
export function canManagePost(user: AuthUser, post: { authorId: string | null }): boolean {
  return can(user, "content.review") || (can(user, "content.publish") && post.authorId === user.id);
}

/* ---------- Util ---------- */

/** "2026-11-20T09:00" (WIB) → Date. */
function parseWib(value: string | null): Date | null {
  if (!value) return null;
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(value)) throw new SaveError("Format tanggal tidak dikenali.", "publishAt");
  const date = new Date(`${value}:00+07:00`);
  if (Number.isNaN(date.getTime())) throw new SaveError("Format tanggal tidak dikenali.", "publishAt");
  return date;
}

const emptyToNull = (value: string) => value.trim() || null;

async function slugTaken(tx: DbOrTx, slug: string, selfId: number | null): Promise<boolean> {
  const [post] = await tx
    .select({ id: posts.id })
    .from(posts)
    .where(and(eq(posts.slug, slug), selfId === null ? undefined : ne(posts.id, selfId)))
    .limit(1);
  if (post) return true;
  const [page] = await tx.select({ id: pages.id }).from(pages).where(eq(pages.path, slug)).limit(1);
  if (page) return true;
  const [redirect] = await tx
    .select({ id: redirects.id })
    .from(redirects)
    .where(or(eq(redirects.source, `/${slug}/`), eq(redirects.source, `/${slug}`)))
    .limit(1);
  return Boolean(redirect);
}

/**
 * Slug akhir: unik di antara post, tidak bentrok dengan halaman, redirect, route khusus, dan
 * path aplikasi donasi. Slug yang masih mengikuti judul diberi akhiran -2, -3, … bila bentrok;
 * slug yang diketik manual ditolak dengan pesan.
 */
async function resolveSlug(tx: DbOrTx, input: SavePostInput, existing: PostRow | null): Promise<string> {
  const typed = input.slug.trim().toLowerCase();
  if (existing && typed === existing.slug) return typed; // tidak diubah (termasuk slug lama ber-encode)

  if (!input.slugAuto) {
    const problem = slugProblem(typed);
    if (problem) throw new SaveError(problem, "slug");
    if (await slugTaken(tx, typed, existing?.id ?? null)) {
      throw new SaveError("Permalink sudah dipakai publikasi, halaman, atau redirect lain.", "slug");
    }
    return typed;
  }

  const base = slugify(input.title) || `publikasi-${Date.now().toString(36)}`;
  for (let i = 1; i <= 50; i++) {
    const candidate = i === 1 ? base : `${base}-${i}`;
    if (existing && candidate === existing.slug) return candidate;
    if (!slugProblem(candidate) && !(await slugTaken(tx, candidate, existing?.id ?? null))) return candidate;
  }
  throw new SaveError("Tidak dapat membuat permalink unik dari judul ini. Isi permalink secara manual.", "slug");
}

async function resolveTagIds(tx: DbOrTx, tagIds: number[], newTags: string[]): Promise<number[]> {
  const ids = new Set<number>();
  const wanted = [...new Set(tagIds.filter((n) => Number.isInteger(n)))];
  if (wanted.length) {
    const rows = await tx.select({ id: tags.id }).from(tags).where(inArray(tags.id, wanted));
    for (const r of rows) ids.add(r.id);
  }
  for (const raw of newTags.slice(0, 20)) {
    const name = raw.trim().replace(/\s+/g, " ").slice(0, 80);
    const slug = slugify(name);
    if (!name || !slug) continue;
    const [found] = await tx.select({ id: tags.id }).from(tags).where(eq(tags.slug, slug)).limit(1);
    if (found) {
      ids.add(found.id);
      continue;
    }
    const [created] = await tx.insert(tags).values({ slug, name }).returning({ id: tags.id });
    if (created) ids.add(created.id);
  }
  return [...ids];
}

async function replaceTerms(tx: DbOrTx, postId: number, categoryIds: number[], tagIds: number[]): Promise<void> {
  await tx.delete(postCategories).where(eq(postCategories.postId, postId));
  if (categoryIds.length) await tx.insert(postCategories).values(categoryIds.map((categoryId) => ({ postId, categoryId })));
  await tx.delete(postTags).where(eq(postTags.postId, postId));
  if (tagIds.length) await tx.insert(postTags).values(tagIds.map((tagId) => ({ postId, tagId })));
}

async function userExists(tx: DbOrTx, id: string): Promise<boolean> {
  if (!/^[0-9a-f-]{36}$/i.test(id)) return false;
  const [row] = await tx.select({ id: users.id }).from(users).where(eq(users.id, id)).limit(1);
  return Boolean(row);
}

/* ---------- Simpan ---------- */

export type SaveOutcome = {
  result: SaveResult;
  /** Slug yang cache publiknya perlu disegarkan (kosong bila tidak ada perubahan yang terlihat publik). */
  revalidateSlugs: string[];
};

export async function savePost(user: AuthUser, input: SavePostInput): Promise<SaveOutcome> {
  try {
    return await getDb().transaction(async (tx) => {
      const title = input.title.trim().replace(/\s+/g, " ");
      if (!title) throw new SaveError("Judul wajib diisi.", "title");
      if (title.length > 300) throw new SaveError("Judul terlalu panjang (maksimal 300 karakter).", "title");

      let existing: PostRow | null = null;
      if (input.id !== null) {
        const [row] = await tx.select().from(posts).where(eq(posts.id, input.id)).limit(1);
        if (!row) throw new SaveError("Publikasi tidak ditemukan.");
        if (!canEditPost(user, row)) throw new SaveError("Anda tidak berhak mengubah publikasi ini.");
        existing = row;
      } else if (!can(user, "draft.write")) {
        throw new SaveError("Peran Anda tidak dapat menulis publikasi.");
      }
      const before: ContentStatus = existing?.status ?? "draft";
      const canPublish = can(user, "content.publish");
      const canReview = can(user, "content.review");

      /* Status & tanggal */
      const publishAt = parseWib(input.publishAt);
      let status: ContentStatus = before;
      let publishedAt: Date | null = existing?.publishedAt ?? null;
      const now = new Date();
      switch (input.intent) {
        case "autosave":
          if (before !== "draft") throw new SaveError("Simpan otomatis hanya berlaku untuk draf.");
          break;
        case "save":
          if (before === "scheduled" && publishAt) publishedAt = publishAt;
          break;
        case "review":
          status = "review";
          break;
        case "draft":
          if ((before === "published" || before === "scheduled") && !canPublish) {
            throw new SaveError("Peran Anda tidak dapat menarik publikasi yang sudah terbit.");
          }
          status = "draft";
          break;
        case "publish":
          if (!canPublish) throw new SaveError("Peran Anda tidak dapat menerbitkan. Kirim ke Review.");
          if (publishAt && publishAt.getTime() > now.getTime() + 60_000) {
            throw new SaveError("Tanggal terbit ada di masa depan. Gunakan Jadwalkan.", "publishAt");
          }
          status = "published";
          publishedAt = publishAt ?? publishedAt ?? now;
          if (publishedAt.getTime() > now.getTime()) publishedAt = now;
          break;
        case "schedule":
          if (!canPublish) throw new SaveError("Peran Anda tidak dapat menjadwalkan. Kirim ke Review.");
          if (!publishAt) throw new SaveError("Isi tanggal terbit untuk menjadwalkan.", "publishAt");
          if (publishAt.getTime() <= now.getTime()) throw new SaveError("Tanggal jadwal harus di masa depan.", "publishAt");
          status = "scheduled";
          publishedAt = publishAt;
          break;
      }
      if (status === "published" && before === "published" && publishAt && publishAt.getTime() <= now.getTime()) {
        publishedAt = publishAt; // ubah tanggal post yang sudah terbit
      }

      /* Isi */
      const slug = await resolveSlug(tx, input, existing);
      let contentHtml = existing?.contentHtml ?? "";
      let contentJson: unknown = existing?.contentJson ?? null;
      const contentChanged = input.content !== undefined;
      if (input.content) {
        if (input.content.html.length > 2_000_000) throw new SaveError("Isi tulisan terlalu besar.");
        contentHtml = sanitizeContentHtml(input.content.html);
        contentJson = input.content.json ?? null;
      }
      if ((status === "published" || status === "scheduled" || status === "review") && !contentHtml.trim()) {
        throw new SaveError("Isi tulisan masih kosong.");
      }
      let excerpt = input.excerpt.trim().replace(/\s+/g, " ").slice(0, 500);
      if (!excerpt && input.intent !== "autosave") excerpt = autoExcerpt(contentHtml);

      /* SEO */
      const seoTitle = emptyToNull(input.seoTitle)?.slice(0, 200) ?? null;
      const seoDescription = emptyToNull(input.seoDescription)?.slice(0, 500) ?? null;
      let canonical = existing?.canonical ?? null;
      if (can(user, "seo.manage")) {
        canonical = emptyToNull(input.canonical);
        if (canonical && !/^(\/|https?:\/\/)/.test(canonical)) {
          throw new SaveError("Canonical harus berupa path (/…/) atau URL lengkap.", "canonical");
        }
      }
      // Canonical bawaan menunjuk URL sendiri — ikut berubah bila permalink berubah.
      if (existing && canonical === `/${existing.slug}/` && slug !== existing.slug) canonical = `/${slug}/`;

      /* Relasi */
      const categoryIds = input.categoryIds.length
        ? (await tx.select({ id: categories.id }).from(categories).where(inArray(categories.id, [...new Set(input.categoryIds)]))).map((c) => c.id)
        : [];
      const tagIds = await resolveTagIds(tx, input.tagIds, input.newTags);

      let featuredMediaId: number | null = null;
      if (input.featuredMediaId !== null) {
        const [m] = await tx.select({ id: media.id, alt: media.alt }).from(media).where(eq(media.id, input.featuredMediaId)).limit(1);
        if (m) {
          featuredMediaId = m.id;
          const alt = input.featuredAlt?.trim();
          if (alt && !m.alt.trim()) await tx.update(media).set({ alt: alt.slice(0, 300) }).where(eq(media.id, m.id));
        }
      }

      let authorId = existing ? existing.authorId : user.id;
      let reviewerId = existing?.reviewerId ?? null;
      if (canReview) {
        if (input.authorId && (await userExists(tx, input.authorId))) authorId = input.authorId;
        else if (input.authorId === null && existing) authorId = null;
        reviewerId = input.reviewerId && (await userExists(tx, input.reviewerId)) ? input.reviewerId : null;
        // Menyetujui tulisan orang lain yang menunggu review → tercatat sebagai reviewer.
        if (before === "review" && (status === "published" || status === "scheduled") && authorId !== user.id && !reviewerId) {
          reviewerId = user.id;
        }
      }

      /* Tulis */
      const values = {
        slug,
        title,
        excerpt,
        contentJson,
        contentHtml,
        status,
        publishedAt,
        authorId,
        reviewerId,
        featuredMediaId,
        seoTitle,
        seoDescription,
        canonical,
      };
      let id: number;
      if (existing) {
        id = existing.id;
        await tx.update(posts).set(values).where(eq(posts.id, id));
      } else {
        const [created] = await tx.insert(posts).values(values).returning({ id: posts.id });
        if (!created) throw new SaveError("Gagal membuat publikasi.");
        id = created.id;
      }
      await replaceTerms(tx, id, categoryIds, tagIds);

      const slugChanged = existing !== null && existing.slug !== slug;
      if (slugChanged && existing && before === "published") {
        // URL lama yang sudah terindeks diarahkan ke permalink baru.
        await tx
          .insert(redirects)
          .values({ source: `/${existing.slug}/`, destination: `/${slug}/`, statusCode: 301, note: "Otomatis: permalink publikasi diubah" })
          .onConflictDoNothing();
      }

      if (input.intent !== "autosave") {
        const snapshot: PostSnapshot = {
          title,
          slug,
          excerpt,
          contentJson,
          contentHtml,
          seoTitle,
          seoDescription,
          canonical,
          featuredMediaId,
          categoryIds,
          tagIds,
          status,
        };
        await tx.insert(postRevisions).values({ postId: id, snapshot, authorId: user.id });
      }

      // Simpan otomatis tidak dicatat, kecuali saat ia yang pertama kali membuat publikasi.
      if (input.intent !== "autosave" || !existing) {
        const action = !existing
          ? "create"
          : status !== before
            ? status === "published"
              ? "publish"
              : status === "scheduled"
                ? "schedule"
                : status === "review"
                  ? "submit_review"
                  : before === "published" || before === "scheduled"
                    ? "unpublish"
                    : "edit"
            : "edit";
        const verb: Record<string, string> = {
          create: "Membuat",
          publish: "Menerbitkan",
          schedule: "Menjadwalkan",
          submit_review: "Mengirim ke review",
          unpublish: "Menarik ke draf",
          edit: "Mengubah",
        };
        const diff: Record<string, unknown> = {};
        if (existing && existing.title !== title) diff.title = [existing.title, title];
        if (slugChanged && existing) diff.slug = [existing.slug, slug];
        if (status !== before) diff.status = [STATUS_LABEL[before], STATUS_LABEL[status]];
        if ((existing?.publishedAt?.getTime() ?? null) !== (publishedAt?.getTime() ?? null)) {
          diff.publishedAt = [existing?.publishedAt?.toISOString() ?? null, publishedAt?.toISOString() ?? null];
        }
        if (contentChanged) diff.content = "diubah";
        await logActivity({ userId: user.id, action, entity: "post", entityId: id, summary: `${verb[action]} publikasi “${title}”`, diff }, tx);
      }

      const publicChange = before === "published" || status === "published";
      const revalidateSlugs = publicChange ? [...new Set([slug, ...(existing ? [existing.slug] : [])])] : [];
      return {
        result: {
          ok: true as const,
          id,
          slug,
          status,
          excerpt,
          publishedAt: publishedAt?.toISOString() ?? null,
          savedAt: new Date().toISOString(),
        },
        revalidateSlugs,
      };
    });
  } catch (error) {
    if (error instanceof SaveError) return { result: { ok: false, error: error.message, field: error.field }, revalidateSlugs: [] };
    console.error("savePost gagal", error);
    return { result: { ok: false, error: "Gagal menyimpan. Coba lagi." }, revalidateSlugs: [] };
  }
}

/* ---------- Aksi massal & per baris ---------- */

export type BulkAction = "draft" | "trash" | "restore" | "delete" | "category";

export type BulkOutcome = { done: number; skipped: number; revalidateSlugs: string[] };

/**
 * draft = jadikan draf · trash = pindahkan ke sampah · restore = pulihkan (jadi draf) ·
 * delete = hapus permanen (hanya dari sampah, Editor/Super Admin) ·
 * category = pindah kategori: kategori tujuan ditambahkan; bila tujuannya jenis publikasi
 * (Artikel/Berita), jenis yang lain dilepas.
 */
export async function bulkUpdatePosts(user: AuthUser, action: BulkAction, ids: number[], categoryId?: number): Promise<BulkOutcome> {
  const unique = [...new Set(ids.filter((n) => Number.isInteger(n) && n > 0))].slice(0, 200);
  if (!unique.length) return { done: 0, skipped: 0, revalidateSlugs: [] };

  return getDb().transaction(async (tx) => {
    const rows = await tx
      .select({ id: posts.id, slug: posts.slug, title: posts.title, status: posts.status, authorId: posts.authorId })
      .from(posts)
      .where(inArray(posts.id, unique));

    let target: { id: number; slug: string; name: string } | undefined;
    if (action === "category") {
      if (!categoryId) return { done: 0, skipped: rows.length, revalidateSlugs: [] };
      [target] = await tx.select({ id: categories.id, slug: categories.slug, name: categories.name }).from(categories).where(eq(categories.id, categoryId)).limit(1);
      if (!target) return { done: 0, skipped: rows.length, revalidateSlugs: [] };
    }

    const allowed = rows.filter((p) => {
      switch (action) {
        case "delete":
          return p.status === "trashed" && can(user, "content.review");
        case "restore":
          return p.status === "trashed" && canManagePost(user, p);
        case "trash":
          return p.status !== "trashed" && canManagePost(user, p);
        case "draft":
          return p.status !== "trashed" && p.status !== "draft" && canManagePost(user, p);
        case "category":
          return canEditPost(user, p);
      }
    });
    if (!allowed.length) return { done: 0, skipped: rows.length, revalidateSlugs: [] };
    const allowedIds = allowed.map((p) => p.id);

    if (action === "delete") {
      await tx.delete(posts).where(inArray(posts.id, allowedIds));
    } else if (action === "category" && target) {
      const typeSlugs = ["artikel", "berita"];
      if (typeSlugs.includes(target.slug)) {
        const others = await tx.select({ id: categories.id }).from(categories).where(inArray(categories.slug, typeSlugs.filter((s) => s !== target.slug)));
        if (others.length) {
          await tx.delete(postCategories).where(
            and(
              inArray(postCategories.postId, allowedIds),
              inArray(
                postCategories.categoryId,
                others.map((c) => c.id),
              ),
            ),
          );
        }
      }
      await tx
        .insert(postCategories)
        .values(allowedIds.map((postId) => ({ postId, categoryId: target.id })))
        .onConflictDoNothing();
      await tx.update(posts).set({ updatedAt: new Date() }).where(inArray(posts.id, allowedIds));
    } else {
      const status: ContentStatus = action === "trash" ? "trashed" : "draft";
      await tx.update(posts).set({ status }).where(inArray(posts.id, allowedIds));
    }

    const verb: Record<BulkAction, string> = {
      draft: "Menjadikan draf",
      trash: "Memindahkan ke sampah",
      restore: "Memulihkan dari sampah",
      delete: "Menghapus permanen",
      category: `Memindahkan ke kategori ${target?.name ?? ""}`,
    };
    const logAction: Record<BulkAction, string> = { draft: "unpublish", trash: "trash", restore: "restore", delete: "delete", category: "edit" };
    for (const p of allowed) {
      await logActivity(
        {
          userId: user.id,
          action: logAction[action],
          entity: "post",
          entityId: p.id,
          summary: `${verb[action]}: “${p.title}”`,
          diff: action === "category" ? { category: [null, target?.name ?? null] } : { status: [STATUS_LABEL[p.status], action === "delete" ? null : STATUS_LABEL[action === "trash" ? "trashed" : "draft"]] },
        },
        tx,
      );
    }

    // Yang terlihat publik berubah bila post sebelumnya terbit (atau kategorinya berubah).
    const revalidateSlugs = allowed.filter((p) => p.status === "published").map((p) => p.slug);
    return { done: allowed.length, skipped: rows.length - allowed.length, revalidateSlugs };
  });
}

/* ---------- Revisi ---------- */

function isSnapshot(value: unknown): value is PostSnapshot {
  if (typeof value !== "object" || value === null) return false;
  const v = value as Record<string, unknown>;
  return typeof v.title === "string" && typeof v.contentHtml === "string" && Array.isArray(v.categoryIds) && Array.isArray(v.tagIds);
}

/**
 * Pulihkan isi, ringkasan, SEO, gambar unggulan, kategori, dan tag dari sebuah revisi.
 * Status, permalink, dan tanggal terbit TIDAK ikut dipulihkan. Pemulihan dicatat sebagai revisi baru.
 */
export async function restoreRevision(user: AuthUser, postId: number, revisionId: number): Promise<{ ok: boolean; error?: string; revalidateSlugs: string[] }> {
  return getDb().transaction(async (tx) => {
    const [post] = await tx.select().from(posts).where(eq(posts.id, postId)).limit(1);
    if (!post) return { ok: false, error: "Publikasi tidak ditemukan.", revalidateSlugs: [] };
    if (!canEditPost(user, post)) return { ok: false, error: "Anda tidak berhak mengubah publikasi ini.", revalidateSlugs: [] };
    const [rev] = await tx
      .select()
      .from(postRevisions)
      .where(and(eq(postRevisions.id, revisionId), eq(postRevisions.postId, postId)))
      .limit(1);
    if (!rev || !isSnapshot(rev.snapshot)) return { ok: false, error: "Revisi tidak ditemukan.", revalidateSlugs: [] };
    const snap = rev.snapshot;

    const categoryIds = snap.categoryIds.length
      ? (await tx.select({ id: categories.id }).from(categories).where(inArray(categories.id, snap.categoryIds))).map((c) => c.id)
      : [];
    const tagIds = snap.tagIds.length ? (await tx.select({ id: tags.id }).from(tags).where(inArray(tags.id, snap.tagIds))).map((t) => t.id) : [];
    let featuredMediaId: number | null = null;
    if (snap.featuredMediaId !== null) {
      const [m] = await tx.select({ id: media.id }).from(media).where(eq(media.id, snap.featuredMediaId)).limit(1);
      featuredMediaId = m?.id ?? null;
    }

    const contentHtml = sanitizeContentHtml(snap.contentHtml);
    await tx
      .update(posts)
      .set({
        title: snap.title,
        excerpt: snap.excerpt,
        contentJson: snap.contentJson ?? null,
        contentHtml,
        seoTitle: snap.seoTitle,
        seoDescription: snap.seoDescription,
        featuredMediaId,
      })
      .where(eq(posts.id, postId));
    await replaceTerms(tx, postId, categoryIds, tagIds);

    const snapshot: PostSnapshot = { ...snap, slug: post.slug, canonical: post.canonical, contentHtml, featuredMediaId, categoryIds, tagIds, status: post.status };
    await tx.insert(postRevisions).values({ postId, snapshot, authorId: user.id });
    await logActivity(
      {
        userId: user.id,
        action: "restore_revision",
        entity: "post",
        entityId: postId,
        summary: `Memulihkan revisi publikasi “${snap.title}”`,
        diff: { revision: rev.id, ...(post.title !== snap.title ? { title: [post.title, snap.title] } : {}) },
      },
      tx,
    );
    return { ok: true, revalidateSlugs: post.status === "published" ? [post.slug] : [] };
  });
}
