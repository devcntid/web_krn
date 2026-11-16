import "server-only";

import { Pool } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-serverless";

import * as schema from "./schema";

/**
 * Koneksi Postgres (Neon) untuk kode server. Memakai Pool WebSocket dari
 * @neondatabase/serverless agar transaksi interaktif tersedia (terbit + revisi +
 * log aktivitas dalam satu transaksi). DATABASE_URL = connection string *pooled*.
 */
function createDb() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error("DATABASE_URL belum di-set (lihat .env.example dan docs/DATABASE.md).");
  }
  return drizzle(new Pool({ connectionString }), { schema });
}

type Db = ReturnType<typeof createDb>;

// Di development, modul dimuat ulang saat HMR — simpan instance agar tidak membuka pool baru terus-menerus.
const globalForDb = globalThis as unknown as { __krnDb?: Db };

/** Instance Drizzle; dibuat saat pertama dipakai agar build tanpa DATABASE_URL tidak gagal. */
export function getDb(): Db {
  if (!globalForDb.__krnDb) globalForDb.__krnDb = createDb();
  return globalForDb.__krnDb;
}

export { schema };
export type { Db };
