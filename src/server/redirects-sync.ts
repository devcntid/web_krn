import "server-only";

import { getDb, schema } from "./db";
import { isStaticRedirect } from "@/lib/redirect-rules";

/**
 * Sinkronkan redirect dinamis (tabel `redirects`, tanpa yang statis di next.config) ke Vercel Edge
 * Config agar src/proxy.ts bisa membacanya cepat tanpa query database per permintaan.
 *
 * Kunci Edge Config: `redirects` → { "/lama/": ["/baru/", 301], "/hapus/": ["", 410] }.
 * Env: EDGE_CONFIG (baca, dipakai proxy), EDGE_CONFIG_ID + VERCEL_API_TOKEN (tulis, [VERCEL_TEAM_ID]).
 */
export const EDGE_CONFIG_KEY = "redirects";
export type RedirectMap = Record<string, [destination: string, status: number]>;

export async function buildRedirectMap(): Promise<RedirectMap> {
  const rows = await getDb().select({ source: schema.redirects.source, destination: schema.redirects.destination, statusCode: schema.redirects.statusCode }).from(schema.redirects);
  const map: RedirectMap = {};
  for (const r of rows) if (!isStaticRedirect(r.source)) map[r.source] = [r.destination, r.statusCode];
  return map;
}

export type SyncResult = { ok: true; count: number } | { ok: false; error: string; configured: boolean };

export function edgeConfigConfigured(): boolean {
  return Boolean(process.env.EDGE_CONFIG_ID && process.env.VERCEL_API_TOKEN);
}

export async function syncRedirectsToEdgeConfig(): Promise<SyncResult> {
  const id = process.env.EDGE_CONFIG_ID;
  const token = process.env.VERCEL_API_TOKEN;
  if (!id || !token) return { ok: false, configured: false, error: "Edge Config belum dikonfigurasi (EDGE_CONFIG_ID, VERCEL_API_TOKEN). Redirect tersimpan di database tetapi belum aktif di situs." };
  const map = await buildRedirectMap();
  const team = process.env.VERCEL_TEAM_ID ? `?teamId=${encodeURIComponent(process.env.VERCEL_TEAM_ID)}` : "";
  try {
    const res = await fetch(`https://api.vercel.com/v1/edge-config/${encodeURIComponent(id)}/items${team}`, {
      method: "PATCH",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify({ items: [{ operation: "upsert", key: EDGE_CONFIG_KEY, value: map }] }),
      cache: "no-store",
    });
    if (!res.ok) return { ok: false, configured: true, error: `Sinkron Edge Config gagal (HTTP ${res.status}).` };
    return { ok: true, count: Object.keys(map).length };
  } catch {
    return { ok: false, configured: true, error: "Sinkron Edge Config gagal (jaringan)." };
  }
}
