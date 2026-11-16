import { loadEnvConfig } from "@next/env";
import { defineConfig } from "drizzle-kit";

// drizzle-kit tidak membaca .env.local sendiri — pakai pemuat env milik Next.js.
loadEnvConfig(process.cwd());

// Migrasi (DDL) memakai koneksi langsung, bukan pooler.
const url = process.env.DATABASE_URL_UNPOOLED ?? process.env.DATABASE_URL;
if (!url) throw new Error("DATABASE_URL_UNPOOLED / DATABASE_URL belum di-set (lihat docs/DATABASE.md).");

export default defineConfig({
  dialect: "postgresql",
  schema: "./src/server/db/schema.ts",
  out: "./src/server/db/migrations",
  dbCredentials: { url },
  strict: true,
  verbose: true,
});
