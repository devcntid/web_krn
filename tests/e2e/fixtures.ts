/**
 * Data uji e2e (tests/e2e/publish-flow.spec.ts). Dijalankan oleh global-setup/teardown Playwright:
 *   tsx --require tests/stubs/server-only-shim.cjs tests/e2e/fixtures.ts setup|teardown
 * Semua data berawalan zz-e2e dan dihapus di teardown. DATABASE_URL & AUTH_SECRET dari lingkungan.
 */
import fs from "node:fs";

import { like, or, sql } from "drizzle-orm";

import { encryptSecret } from "../../src/server/auth/crypto";
import { hashPassword } from "../../src/server/auth/password";
import { getDb, schema } from "../../src/server/db";
import { E2E } from "./constants";


async function teardown() {
  const db = getDb();
  const posts = await db.delete(schema.posts).where(like(schema.posts.slug, "zz-e2e-%")).returning({ id: schema.posts.id });
  await db.delete(schema.redirects).where(like(schema.redirects.source, "/zz-e2e-%"));
  await db.delete(schema.authAttempts).where(like(schema.authAttempts.key, "%zz-e2e-%"));
  const users = await db.delete(schema.users).where(like(schema.users.email, "zz-e2e-%")).returning({ id: schema.users.id });
  // Log aktivitas uji: baris tentang post/redirect uji dan login pengguna uji (user_id sudah null).
  await db.delete(schema.activityLog).where(
    or(
      like(schema.activityLog.summary, "%zz-e2e%"),
      posts.length ? sql`${schema.activityLog.entity} = 'post' and ${schema.activityLog.entityId} in (${sql.join(posts.map((p) => sql`${String(p.id)}`), sql`, `)})` : sql`false`,
      users.length ? sql`${schema.activityLog.entity} = 'user' and ${schema.activityLog.entityId} in (${sql.join(users.map((u) => sql`${u.id}`), sql`, `)})` : sql`false`,
    ),
  );
  fs.rmSync(E2E.stateFile, { force: true });
  console.log(`e2e teardown: ${posts.length} post, ${users.length} pengguna dihapus`);
}

async function setup() {
  await teardown();
  const { generateSecret } = await import("otplib");
  const secret = generateSecret();
  const passwordHash = await hashPassword(E2E.password);
  await getDb()
    .insert(schema.users)
    .values([
      { email: E2E.contributor, name: "ZZ E2E Kontributor", role: "kontributor", passwordHash },
      { email: E2E.editor, name: "ZZ E2E Editor", role: "editor", passwordHash, totpSecret: encryptSecret(secret), totpEnabledAt: new Date() },
    ]);
  fs.writeFileSync(E2E.stateFile, JSON.stringify({ totpSecret: secret }));
  console.log("e2e setup: 2 pengguna uji dibuat");
}

if (require.main === module) {
  (process.argv[2] === "teardown" ? teardown() : setup()).then(
    () => process.exit(0),
    (e) => {
      console.error(e);
      process.exit(1);
    },
  );
}
