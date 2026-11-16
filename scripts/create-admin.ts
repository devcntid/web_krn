/**
 * Membuat Super Admin pertama: `npm run admin:create -- --email admin@contoh.org --name "Nama"`.
 * Kata sandi dibaca dari env ADMIN_PASSWORD atau diminta lewat prompt (tidak ditampilkan di layar).
 * Menulis ke database DATABASE_URL — pastikan menunjuk database yang benar.
 */
import { loadEnvConfig } from "@next/env";
import { sql } from "drizzle-orm";
import { createInterface } from "node:readline";
import { parseArgs } from "node:util";

loadEnvConfig(process.cwd());

function promptHidden(question: string): Promise<string> {
  return new Promise((resolve) => {
    const rl = createInterface({ input: process.stdin, output: process.stdout, terminal: true });
    const write = (rl as unknown as { _writeToOutput: (s: string) => void })._writeToOutput;
    (rl as unknown as { _writeToOutput: (s: string) => void })._writeToOutput = (s: string) => {
      if (s.startsWith(question)) write.call(rl, s);
    };
    rl.question(question, (answer) => {
      rl.close();
      process.stdout.write("\n");
      resolve(answer);
    });
  });
}

async function main() {
  // Diimpor dinamis agar .env.local sudah termuat sebelum modul database dipakai.
  const { getDb, schema } = await import("../src/server/db");
  const { MIN_PASSWORD_LENGTH, hashPassword } = await import("../src/server/auth/password");
  const { values } = parseArgs({ options: { email: { type: "string" }, name: { type: "string" } } });
  const email = values.email?.trim().toLowerCase();
  if (!email || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) throw new Error("Wajib: --email <alamat email valid>");

  const password = process.env.ADMIN_PASSWORD ?? (await promptHidden("Kata sandi: "));
  if (password.length < MIN_PASSWORD_LENGTH) throw new Error(`Kata sandi minimal ${MIN_PASSWORD_LENGTH} karakter.`);
  if (!process.env.ADMIN_PASSWORD && (await promptHidden("Ulangi kata sandi: ")) !== password) throw new Error("Kata sandi tidak sama.");

  const db = getDb();
  const existing = await db
    .select({ id: schema.users.id })
    .from(schema.users)
    .where(sql`lower(${schema.users.email}) = ${email}`)
    .limit(1);
  if (existing.length) throw new Error("Email sudah terdaftar — tidak ada yang diubah.");

  const [row] = await db
    .insert(schema.users)
    .values({ email, name: values.name ?? null, role: "super_admin", passwordHash: await hashPassword(password) })
    .returning({ id: schema.users.id });
  console.log(`Super Admin dibuat (id ${row.id}). Saat login pertama Anda akan diminta mendaftarkan 2FA.`);
  process.exit(0);
}

main().catch((e: unknown) => {
  console.error(e instanceof Error ? e.message : e);
  process.exit(1);
});
