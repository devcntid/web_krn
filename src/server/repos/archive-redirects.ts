import "server-only";

import { eq, or } from "drizzle-orm";

import { getDb, schema } from "../db";

/**
 * Tujuan redirect untuk arsip kategori/tag yang sudah dihapus (mis. hasil "Gabungkan" di
 * /admin/taksonomi). Dibaca dari tabel `redirects`; null bila tidak ada.
 * Penanganan umum semua redirect dari database menyusul di B12 (SEO & Redirect).
 */
export async function findArchiveRedirect(source: string): Promise<string | null> {
  const withSlash = source.endsWith("/") ? source : `${source}/`;
  const [row] = await getDb()
    .select({ destination: schema.redirects.destination, statusCode: schema.redirects.statusCode })
    .from(schema.redirects)
    .where(or(eq(schema.redirects.source, withSlash), eq(schema.redirects.source, withSlash.slice(0, -1))))
    .limit(1);
  return row && row.statusCode !== 410 && /^\/(?!\/)/.test(row.destination) ? row.destination : null;
}
