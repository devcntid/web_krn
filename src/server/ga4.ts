import "server-only";

import { createSign } from "node:crypto";

import { unstable_cache } from "next/cache";

/**
 * Ringkasan GA4 untuk kartu "Pengunjung 30 hari" di dashboard (B17), lewat GA4 Data API
 * dengan service account — tanpa dependensi tambahan (JWT RS256 ditandatangani node:crypto).
 *
 * Env:
 *   GA4_PROPERTY_ID   ID properti numerik (Admin GA4 → Detail properti), BUKAN "G-XXXX".
 *   GA4_CLIENT_EMAIL  email service account (…@….iam.gserviceaccount.com)
 *   GA4_PRIVATE_KEY   private key PEM dari file JSON kunci (boleh dengan "\n" literal)
 * Service account harus ditambahkan sebagai "Viewer" di Admin GA4 → Akses properti.
 * Hasil di-cache 1 jam.
 */

export type Ga4Summary =
  | { status: "unconfigured" }
  | { status: "error"; message: string }
  | { status: "ok"; daily: { date: string; sessions: number }[]; sessions: number; donateClicks: number; whatsappClicks: number };

/** Nama event yang dikirim situs publik (src/components/layout/Analytics.tsx). */
export const GA4_EVENTS = { donate: "donate_click", whatsapp: "whatsapp_click" } as const;

function credentials() {
  const propertyId = process.env.GA4_PROPERTY_ID?.trim();
  const clientEmail = process.env.GA4_CLIENT_EMAIL?.trim();
  const privateKey = process.env.GA4_PRIVATE_KEY?.replace(/\\n/g, "\n").trim();
  return propertyId && clientEmail && privateKey ? { propertyId, clientEmail, privateKey } : null;
}

export const ga4Configured = () => credentials() !== null;

const b64url = (v: string | Buffer) => Buffer.from(v).toString("base64url");

async function accessToken(clientEmail: string, privateKey: string): Promise<string> {
  const now = Math.floor(Date.now() / 1000);
  const header = b64url(JSON.stringify({ alg: "RS256", typ: "JWT" }));
  const claims = b64url(
    JSON.stringify({ iss: clientEmail, scope: "https://www.googleapis.com/auth/analytics.readonly", aud: "https://oauth2.googleapis.com/token", iat: now, exp: now + 3600 }),
  );
  const signature = createSign("RSA-SHA256").update(`${header}.${claims}`).sign(privateKey).toString("base64url");
  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer", assertion: `${header}.${claims}.${signature}` }),
    cache: "no-store",
  });
  const json = (await res.json()) as { access_token?: string; error_description?: string; error?: string };
  if (!res.ok || !json.access_token) throw new Error(`Token Google ditolak: ${json.error_description ?? json.error ?? res.status}`);
  return json.access_token;
}

type ReportRow = { dimensionValues?: { value?: string }[]; metricValues?: { value?: string }[] };

async function runReport(propertyId: string, token: string, body: unknown): Promise<ReportRow[]> {
  const res = await fetch(`https://analyticsdata.googleapis.com/v1beta/properties/${propertyId}:runReport`, {
    method: "POST",
    headers: { authorization: `Bearer ${token}`, "content-type": "application/json" },
    body: JSON.stringify(body),
    cache: "no-store",
  });
  const json = (await res.json()) as { rows?: ReportRow[]; error?: { message?: string } };
  if (!res.ok) throw new Error(json.error?.message ?? `GA4 Data API ${res.status}`);
  return json.rows ?? [];
}

const RANGE = [{ startDate: "29daysAgo", endDate: "today" }];

async function fetchSummary(): Promise<Ga4Summary> {
  const c = credentials();
  if (!c) return { status: "unconfigured" };
  try {
    const token = await accessToken(c.clientEmail, c.privateKey);
    const [days, events] = await Promise.all([
      runReport(c.propertyId, token, { dateRanges: RANGE, dimensions: [{ name: "date" }], metrics: [{ name: "sessions" }], orderBys: [{ dimension: { dimensionName: "date" } }] }),
      runReport(c.propertyId, token, {
        dateRanges: RANGE,
        dimensions: [{ name: "eventName" }],
        metrics: [{ name: "eventCount" }],
        dimensionFilter: { filter: { fieldName: "eventName", inListFilter: { values: Object.values(GA4_EVENTS) } } },
      }),
    ]);
    // Lengkapi 30 hari (hari tanpa sesi tidak dikembalikan GA4).
    const byDate = new Map(days.map((r) => [r.dimensionValues?.[0]?.value ?? "", Number(r.metricValues?.[0]?.value ?? 0)]));
    const daily: { date: string; sessions: number }[] = [];
    const wib = new Date(Date.now() + 7 * 3_600_000);
    for (let i = 29; i >= 0; i--) {
      const d = new Date(wib.getTime() - i * 86_400_000).toISOString().slice(0, 10);
      daily.push({ date: d, sessions: byDate.get(d.replace(/-/g, "")) ?? 0 });
    }
    const count = (name: string) => Number(events.find((r) => r.dimensionValues?.[0]?.value === name)?.metricValues?.[0]?.value ?? 0);
    return {
      status: "ok",
      daily,
      sessions: daily.reduce((s, d) => s + d.sessions, 0),
      donateClicks: count(GA4_EVENTS.donate),
      whatsappClicks: count(GA4_EVENTS.whatsapp),
    };
  } catch (error) {
    console.error("GA4 Data API:", error);
    return { status: "error", message: error instanceof Error ? error.message : "Gagal menghubungi GA4" };
  }
}

const cachedSummary = unstable_cache(fetchSummary, ["ga4-summary-30d"], { revalidate: 3600, tags: ["ga4"] });

/** Ringkasan 30 hari (cache 1 jam; kegagalan tidak di-cache agar cepat pulih setelah konfigurasi diperbaiki). */
export async function getGa4Summary(): Promise<Ga4Summary> {
  if (!ga4Configured()) return { status: "unconfigured" };
  const result = await cachedSummary();
  return result.status === "error" ? fetchSummary() : result;
}
