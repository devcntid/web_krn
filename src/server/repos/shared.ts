import "server-only";

import { type AnyColumn, sql } from "drizzle-orm";

/**
 * Tanggal sebagai teks waktu Asia/Jakarta tanpa zona ("2026-11-11T09:12:00") —
 * format yang sama dengan ekspor WordPress, sehingga pemformat tanggal di
 * src/lib/format.ts tetap menghasilkan tanggal yang sama.
 */
export const wibText = (column: AnyColumn) => sql<string>`to_char(${column} at time zone 'Asia/Jakarta', 'YYYY-MM-DD"T"HH24:MI:SS')`;
