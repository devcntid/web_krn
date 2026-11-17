import "server-only";

import { type SQL, and, desc, eq, inArray, isNull, lt, notInArray, or, sql } from "drizzle-orm";

import { ACTIVITY_KINDS, ACTIVITY_RANGES, type ActivityKind, type ActivityRange, HOME_SETTING_IDS, KIND_ACTIONS, SETUP_ENTITIES, activityKind } from "@/lib/activity-kinds";
import { getDb, schema } from "./db";

const { activityLog, users } = schema;

export type ActivityFilters = {
  userId: string;
  kind: ActivityKind | "";
  range: ActivityRange;
  /** YYYY-MM-DD (WIB). Bila diisi, menggantikan `range`. */
  from: string;
  to: string;
};

export type ActivityRow = {
  id: number;
  at: string;
  kind: ActivityKind;
  action: string;
  entity: string;
  entityId: string | null;
  userName: string;
  summary: string;
  hasDiff: boolean;
};

const DATE = /^\d{4}-\d{2}-\d{2}$/;
const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v) ?? "";

/** Baca filter dari query string /admin/log; nilai tidak dikenal diabaikan. */
export function parseActivityFilters(params: Record<string, string | string[] | undefined>): ActivityFilters {
  const kind = one(params.aksi).toUpperCase();
  const range = one(params.rentang);
  const uuid = /^[0-9a-f-]{36}$/i;
  return {
    userId: uuid.test(one(params.pengguna)) || one(params.pengguna) === "sistem" ? one(params.pengguna) : "",
    kind: (ACTIVITY_KINDS as readonly string[]).includes(kind) ? (kind as ActivityKind) : "",
    range: range in ACTIVITY_RANGES ? (range as ActivityRange) : "30",
    from: DATE.test(one(params.dari)) ? one(params.dari) : "",
    to: DATE.test(one(params.sampai)) ? one(params.sampai) : "",
  };
}

const ALL_FIXED = [...KIND_ACTIONS.LOGIN, ...KIND_ACTIONS.TERBIT, ...KIND_ACTIONS.HAPUS];

/** Padanan SQL dari activityKind() — satu sumber aturan di src/lib/activity-kinds.ts. */
function kindCondition(kind: ActivityKind): SQL {
  const setupEntity = and(
    inArray(activityLog.entity, [...SETUP_ENTITIES]),
    sql`not (${activityLog.entity} = 'settings' and coalesce(${activityLog.entityId}, '') in (${sql.join(
      HOME_SETTING_IDS.map((id) => sql`${id}`),
      sql`, `,
    )}))`,
  )!;
  const isSetup = or(inArray(activityLog.action, [...KIND_ACTIONS.SETUP]), setupEntity)!;
  switch (kind) {
    case "LOGIN":
      return inArray(activityLog.action, [...KIND_ACTIONS.LOGIN]);
    case "TERBIT":
      return inArray(activityLog.action, [...KIND_ACTIONS.TERBIT]);
    case "HAPUS":
      return inArray(activityLog.action, [...KIND_ACTIONS.HAPUS]);
    case "SETUP":
      return and(notInArray(activityLog.action, ALL_FIXED), isSetup)!;
    case "EDIT":
      return and(notInArray(activityLog.action, ALL_FIXED), sql`not (${isSetup})`)!;
  }
}

/** Awal hari (00:00 WIB) untuk tanggal YYYY-MM-DD. */
const wibStart = (date: string) => new Date(`${date}T00:00:00+07:00`);

function where(f: ActivityFilters): SQL | undefined {
  const conds: (SQL | undefined)[] = [];
  if (f.userId === "sistem") conds.push(isNull(activityLog.userId));
  else if (f.userId) conds.push(eq(activityLog.userId, f.userId));
  if (f.kind) conds.push(kindCondition(f.kind));
  if (f.from || f.to) {
    if (f.from) conds.push(sql`${activityLog.createdAt} >= ${wibStart(f.from)}`);
    if (f.to) conds.push(lt(activityLog.createdAt, new Date(wibStart(f.to).getTime() + 86_400_000)));
  } else if (f.range === "1") {
    conds.push(sql`${activityLog.createdAt} >= (date_trunc('day', now() at time zone 'Asia/Jakarta') at time zone 'Asia/Jakarta')`);
  } else if (f.range !== "all") {
    conds.push(sql`${activityLog.createdAt} >= now() - make_interval(days => ${Number(f.range)})`);
  }
  return and(...conds);
}

const columns = {
  id: activityLog.id,
  at: activityLog.createdAt,
  action: activityLog.action,
  entity: activityLog.entity,
  entityId: activityLog.entityId,
  summary: activityLog.summary,
  userName: sql<string | null>`coalesce(${users.name}, ${users.email})`,
  hasDiff: sql<boolean>`${activityLog.diff} is not null`,
};

type RawRow = { id: number; at: Date; action: string; entity: string; entityId: string | null; summary: string; userName: string | null; hasDiff: boolean };

const toRow = (r: RawRow): ActivityRow => ({
  id: r.id,
  at: r.at.toISOString(),
  kind: activityKind(r.action, r.entity, r.entityId),
  action: r.action,
  entity: r.entity,
  entityId: r.entityId,
  userName: r.userName ?? "Sistem",
  summary: r.summary,
  hasDiff: r.hasDiff,
});

export const ACTIVITY_PAGE_SIZE = 50;

export async function listActivity(f: ActivityFilters, page: number): Promise<{ rows: ActivityRow[]; total: number }> {
  const db = getDb();
  const w = where(f);
  const [rows, [count]] = await Promise.all([
    db
      .select(columns)
      .from(activityLog)
      .leftJoin(users, eq(users.id, activityLog.userId))
      .where(w)
      .orderBy(desc(activityLog.createdAt), desc(activityLog.id))
      .limit(ACTIVITY_PAGE_SIZE)
      .offset((page - 1) * ACTIVITY_PAGE_SIZE),
    db.select({ n: sql<number>`count(*)::int` }).from(activityLog).where(w),
  ]);
  return { rows: rows.map(toRow), total: count?.n ?? 0 };
}

/** Pengguna yang pernah tercatat (untuk filter), termasuk yang sudah tidak aktif. */
export async function activityUsers(): Promise<{ id: string; name: string }[]> {
  const rows = await getDb()
    .select({ id: users.id, name: sql<string>`coalesce(${users.name}, ${users.email})` })
    .from(users)
    .orderBy(sql`coalesce(${users.name}, ${users.email})`);
  return rows;
}

export async function getActivityDiff(id: number): Promise<Record<string, unknown> | null> {
  const [row] = await getDb().select({ diff: activityLog.diff }).from(activityLog).where(eq(activityLog.id, id)).limit(1);
  return (row?.diff as Record<string, unknown> | null) ?? null;
}

export const CSV_MAX_ROWS = 10_000;

const csvCell = (v: string) => {
  // Cegah injeksi formula spreadsheet (=, +, -, @ di awal sel).
  const safe = /^[=+\-@\t\r]/.test(v) ? `'${v}` : v;
  return /[",\n\r]/.test(safe) ? `"${safe.replace(/"/g, '""')}"` : safe;
};

const wibStamp = (d: Date) => new Date(d.getTime() + 7 * 3_600_000).toISOString().replace("T", " ").slice(0, 19);

/** CSV (UTF-8 + BOM agar Excel membaca huruf dengan benar), maksimal CSV_MAX_ROWS baris terbaru. */
export async function activityCsv(f: ActivityFilters): Promise<string> {
  const rows = await getDb()
    .select({ ...columns, diff: activityLog.diff })
    .from(activityLog)
    .leftJoin(users, eq(users.id, activityLog.userId))
    .where(where(f))
    .orderBy(desc(activityLog.createdAt), desc(activityLog.id))
    .limit(CSV_MAX_ROWS);
  const header = ["waktu_wib", "jenis", "aksi", "pengguna", "entitas", "id_entitas", "ringkasan", "perubahan"];
  const lines = rows.map((r) =>
    [wibStamp(r.at), activityKind(r.action, r.entity, r.entityId), r.action, r.userName ?? "Sistem", r.entity, r.entityId ?? "", r.summary, r.diff ? JSON.stringify(r.diff) : ""]
      .map(csvCell)
      .join(","),
  );
  return `﻿${[header.join(","), ...lines].join("\r\n")}\r\n`;
}
