import "server-only";

import { sql } from "drizzle-orm";

import { getDb, schema } from "./db";

const BOT = /bot|crawl|spider|slurp|bingpreview|facebookexternalhit|embedly|headless|lighthouse|pingdom|uptime|curl|wget|python|go-http|java\/|scrapy|axios|node-fetch|httpclient|semrush|ahrefs|mj12|dotbot|petal|bytespider|gptbot|claudebot|ccbot/i;

/** Path yang tidak perlu dicatat (aset, probe keamanan umum). */
const NOISE = /^\/(_next|api|admin)\/|\.(?:php|asp|aspx|env|ini|sql|bak|map|ico|png|jpe?g|gif|webp|svg|css|js|txt|xml)$|^\/(wp-admin|wp-login|xmlrpc|\.well-known|\.git|cgi-bin)/i;

/** Catat satu 404 (upsert hits+1). Mengabaikan bot, aset, dan path yang terlalu panjang. */
export async function recordNotFound(path: string, userAgent: string): Promise<void> {
  if (!userAgent || BOT.test(userAgent)) return;
  let p = path.split(/[?#]/)[0] ?? "";
  try {
    p = decodeURI(p);
  } catch {
    return;
  }
  if (!p.startsWith("/") || p.length > 300 || NOISE.test(p)) return;
  p = p.replace(/^\/en(?=\/)/, "");
  if (!p.endsWith("/")) p = `${p}/`;
  await getDb()
    .insert(schema.notFoundLog)
    .values({ path: p, hits: 1 })
    .onConflictDoUpdate({ target: schema.notFoundLog.path, set: { hits: sql`${schema.notFoundLog.hits} + 1`, lastSeen: sql`now()` } });
}
