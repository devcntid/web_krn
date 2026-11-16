import "server-only";

import { del, head } from "@vercel/blob";
import { eq, or } from "drizzle-orm";

import { UPLOAD_MAX_BYTES, UPLOAD_TYPES, mediaKindOf } from "@/lib/media-upload";
import type { MediaActionResult } from "@/types/admin-media";
import { logActivity } from "./activity";
import { getDb, schema } from "./db";
import { fetchImageDimensions } from "./media/dimensions";
import type { AuthUser } from "./permissions";
import { findMediaRow, findMediaUsage, toMediaItem } from "./repos/admin-media";

const { media, posts } = schema;

const blobConfigured = () => Boolean(process.env.BLOB_READ_WRITE_TOKEN || (process.env.VERCEL_OIDC_TOKEN && process.env.BLOB_STORE_ID));
const NO_BLOB = "Vercel Blob belum dikonfigurasi di lingkungan ini (BLOB_READ_WRITE_TOKEN). Lihat docs/MEDIA.md.";

/**
 * Catat file yang baru diunggah ke Blob di tabel media. Metadata (ukuran, tipe, pathname) diambil
 * dari Blob lewat head() — bukan dari klien — lalu dimensi gambar dibaca dari byte awal file.
 * Idempoten per pathname: dipanggil klien setelah unggah DAN oleh webhook onUploadCompleted.
 */
export async function registerUpload(userId: string | null, url: string): Promise<MediaActionResult> {
  if (!blobConfigured()) return { ok: false, error: NO_BLOB };
  let blob: Awaited<ReturnType<typeof head>>;
  try {
    blob = await head(url);
  } catch {
    return { ok: false, error: "File tidak ditemukan di Blob store." };
  }
  if (!/^media\/\d{4}\/\d{2}\//.test(blob.pathname)) return { ok: false, error: "Hanya file di folder media/ yang dicatat sebagai unggahan baru." };
  const rule = UPLOAD_TYPES[blob.contentType];
  if (!rule || blob.size > UPLOAD_MAX_BYTES[rule.kind]) {
    // Tidak semestinya terjadi (token membatasi tipe & ukuran) — buang file yang tidak sah.
    await del(blob.url).catch(() => undefined);
    return { ok: false, error: "Tipe atau ukuran file tidak diizinkan." };
  }

  const db = getDb();
  const [existing] = await db.select().from(media).where(eq(media.pathname, blob.pathname)).limit(1);
  if (existing) return { ok: true, item: toMediaItem(existing) };

  const dims = rule.kind === "image" ? await fetchImageDimensions(blob.url) : null;
  const [row] = await db
    .insert(media)
    .values({ url: blob.url, source: "blob", pathname: blob.pathname, mime: blob.contentType, size: blob.size, width: dims?.width ?? null, height: dims?.height ?? null, uploadedBy: userId })
    .onConflictDoNothing({ target: media.pathname })
    .returning();
  // Bentrok = panggilan paralel (klien & webhook) sudah mencatatnya.
  const saved = row ?? (await db.select().from(media).where(eq(media.pathname, blob.pathname)).limit(1))[0];
  if (!saved) return { ok: false, error: "Gagal mencatat file di pustaka media." };
  if (row) {
    await logActivity({ userId, action: "create", entity: "media", entityId: saved.id, summary: `Mengunggah media ${blob.pathname}`, diff: { mime: blob.contentType, size: blob.size, dimensions: dims } });
  }
  return { ok: true, item: toMediaItem(saved) };
}

/**
 * Simpan teks alt & keterangan. Teks alt wajib untuk gambar.
 * `affectsPosts` = alt berubah pada gambar unggulan/og publikasi → cache publikasi perlu disegarkan.
 */
export async function updateMediaMeta(user: AuthUser, id: number, input: { alt: string; caption: string }): Promise<MediaActionResult & { affectsPosts?: boolean }> {
  const row = await findMediaRow(id);
  if (!row) return { ok: false, error: "Media tidak ditemukan." };
  const alt = input.alt.trim().replace(/\s+/g, " ").slice(0, 300);
  const caption = input.caption.trim().replace(/\s+/g, " ").slice(0, 500) || null;
  if (mediaKindOf(row.mime) === "image" && !alt) return { ok: false, error: "Teks alt wajib diisi untuk gambar." };
  if (row.alt === alt && (row.caption ?? null) === caption) return { ok: true, item: toMediaItem(row) };

  const [saved] = await getDb().update(media).set({ alt, caption }).where(eq(media.id, id)).returning();
  if (!saved) return { ok: false, error: "Gagal menyimpan." };
  await logActivity({
    userId: user.id,
    action: "edit",
    entity: "media",
    entityId: id,
    summary: `Mengubah teks alt/keterangan media ${row.pathname}`,
    diff: { ...(row.alt !== alt ? { alt: [row.alt, alt] } : {}), ...((row.caption ?? null) !== caption ? { caption: [row.caption, caption] } : {}) },
  });
  let affectsPosts = false;
  if (row.alt !== alt) {
    const [used] = await getDb().select({ id: posts.id }).from(posts).where(or(eq(posts.featuredMediaId, id), eq(posts.ogImage, row.url))).limit(1);
    affectsPosts = Boolean(used);
  }
  return { ok: true, item: toMediaItem(saved), affectsPosts };
}

/**
 * Hapus media: ditolak bila masih dipakai konten; selain itu file dihapus dari Blob (del) lalu
 * barisnya dihapus. Bila penghapusan di Blob gagal, baris TIDAK dihapus.
 */
export async function deleteMedia(user: AuthUser, id: number): Promise<MediaActionResult> {
  const row = await findMediaRow(id);
  if (!row) return { ok: false, error: "Media tidak ditemukan." };
  const usage = await findMediaUsage(row);
  if (usage.length) return { ok: false, error: `Media masih dipakai di ${usage.length} tempat. Lepaskan dari konten tersebut sebelum menghapus.`, usage };
  if (!blobConfigured()) return { ok: false, error: NO_BLOB };
  try {
    // Pathname berlaku untuk media lama (wp-content/uploads/…) maupun baru (media/…).
    await del(row.pathname);
  } catch (error) {
    console.error("del() Blob gagal", row.pathname, error);
    return { ok: false, error: "Gagal menghapus file dari Blob store. Baris pustaka tidak dihapus; coba lagi." };
  }
  await getDb().delete(media).where(eq(media.id, id));
  await logActivity({ userId: user.id, action: "delete", entity: "media", entityId: id, summary: `Menghapus media ${row.pathname}`, diff: { url: row.url, mime: row.mime, size: row.size, alt: row.alt } });
  return { ok: true };
}
