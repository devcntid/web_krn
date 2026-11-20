import Link from "next/link";

import { EmptyState } from "@/components/admin/EmptyState";
import { PageHeader } from "@/components/admin/PageHeader";
import { DiffButton } from "@/components/admin/log/DiffButton";
import { ACTIVITY_KINDS, ACTIVITY_RANGES, KIND_CLASS, KIND_LABEL } from "@/lib/activity-kinds";
import { parsePageParam } from "@/lib/page-param";
import { ACTIVITY_PAGE_SIZE, type ActivityFilters, activityUsers, listActivity, parseActivityFilters } from "@/server/activity-log";

export type SearchParams = Record<string, string | string[] | undefined>;

const BASE = "/admin/log/";
const field =
  "min-h-11 w-full rounded-admin border border-admin-field bg-white px-3 text-sm text-admin-ink focus-visible:outline-2 focus-visible:outline-primary";
const btn =
  "inline-flex min-h-11 items-center justify-center rounded-admin border border-admin-field bg-white px-4 text-sm font-bold text-admin-ink hover:bg-admin-canvas focus-visible:outline-2 focus-visible:outline-primary";
const primaryBtn =
  "inline-flex min-h-11 items-center justify-center rounded-admin bg-primary px-4.5 text-sm font-extrabold text-white hover:bg-admin-primary-dark focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary";

const timeFmt = new Intl.DateTimeFormat("id-ID", { timeZone: "Asia/Jakarta", hour: "2-digit", minute: "2-digit" });
const dayFmt = new Intl.DateTimeFormat("id-ID", { timeZone: "Asia/Jakarta", weekday: "long", day: "numeric", month: "long", year: "numeric" });
const fullFmt = new Intl.DateTimeFormat("id-ID", { timeZone: "Asia/Jakarta", dateStyle: "full", timeStyle: "medium" });
const dayKey = (iso: string) => new Date(new Date(iso).getTime() + 7 * 3_600_000).toISOString().slice(0, 10);

/** Query string filter aktif (untuk tautan halaman & ekspor). */
function query(f: ActivityFilters, extra: Record<string, string> = {}): string {
  const p = new URLSearchParams();
  if (f.userId) p.set("pengguna", f.userId);
  if (f.kind) p.set("aksi", f.kind.toLowerCase());
  if (f.from || f.to) {
    if (f.from) p.set("dari", f.from);
    if (f.to) p.set("sampai", f.to);
  } else if (f.range !== "30") p.set("rentang", f.range);
  for (const [k, v] of Object.entries(extra)) p.set(k, v);
  const s = p.toString();
  return s ? `?${s}` : "";
}

/** Isi halaman (tanpa cek akses — pemanggil wajib sudah memanggil requireAbility). */
export async function LogView({ sp }: { sp: SearchParams }) {
  const filters = parseActivityFilters(sp);
  const page = parsePageParam(sp.halaman);
  const [{ rows, total }, people] = await Promise.all([listActivity(filters, page), activityUsers()]);
  const pages = Math.max(1, Math.ceil(total / ACTIVITY_PAGE_SIZE));
  const now = new Date();
  const todayKey = dayKey(now.toISOString());
  const yesterdayKey = dayKey(new Date(now.getTime() - 86_400_000).toISOString());
  const groups: { key: string; items: typeof rows }[] = [];
  for (const r of rows) {
    const key = dayKey(r.at);
    const last = groups[groups.length - 1];
    if (last?.key === key) last.items.push(r);
    else groups.push({ key, items: [r] });
  }
  const dayLabel = (key: string) => (key === todayKey ? "Hari ini" : key === yesterdayKey ? "Kemarin" : dayFmt.format(new Date(`${key}T12:00:00+07:00`)));
  const filtered = Boolean(filters.userId || filters.kind || filters.from || filters.to || filters.range !== "30");

  return (
    <div className="space-y-5">
      <PageHeader
        title="Log Aktivitas"
        description="Jejak audit semua perubahan konten dan pengaturan."
        actions={
          <a href={`${BASE}ekspor/${query(filters)}`} className={btn} download>
            Ekspor CSV
          </a>
        }
      />

      <form method="get" action={BASE} className="grid gap-3 rounded-xl border border-admin-line bg-white p-4 sm:grid-cols-2 lg:grid-cols-[1fr_1fr_1fr_auto]" aria-label="Filter log">
        <div className="min-w-0">
          <label htmlFor="f-user" className="text-xs font-bold text-admin-text">
            Pengguna
          </label>
          <select id="f-user" name="pengguna" defaultValue={filters.userId} className={`${field} mt-1`}>
            <option value="">Semua pengguna</option>
            {people.map((u) => (
              <option key={u.id} value={u.id}>
                {u.name}
              </option>
            ))}
            <option value="sistem">Sistem / pengguna terhapus</option>
          </select>
        </div>
        <div className="min-w-0">
          <label htmlFor="f-kind" className="text-xs font-bold text-admin-text">
            Aksi
          </label>
          <select id="f-kind" name="aksi" defaultValue={filters.kind.toLowerCase()} className={`${field} mt-1`}>
            <option value="">Semua aksi</option>
            {ACTIVITY_KINDS.map((k) => (
              <option key={k} value={k.toLowerCase()}>
                {KIND_LABEL[k]}
              </option>
            ))}
          </select>
        </div>
        <div className="min-w-0">
          <label htmlFor="f-range" className="text-xs font-bold text-admin-text">
            Rentang
          </label>
          <select id="f-range" name="rentang" defaultValue={filters.range} className={`${field} mt-1`}>
            {Object.entries(ACTIVITY_RANGES).map(([v, label]) => (
              <option key={v} value={v}>
                {label}
              </option>
            ))}
          </select>
        </div>
        <div className="flex items-end gap-2">
          <button type="submit" className={primaryBtn}>
            Terapkan
          </button>
          {filtered ? (
            <Link href={BASE} className={btn}>
              Reset
            </Link>
          ) : null}
        </div>
        <details className="sm:col-span-2 lg:col-span-4" open={Boolean(filters.from || filters.to)}>
          <summary className="inline-flex min-h-11 cursor-pointer items-center text-sm font-bold text-primary">Rentang tanggal khusus</summary>
          <div className="mt-2 grid gap-3 sm:grid-cols-2 lg:max-w-xl">
            <div>
              <label htmlFor="f-from" className="text-xs font-bold text-admin-text">
                Dari tanggal (WIB)
              </label>
              <input id="f-from" type="date" name="dari" defaultValue={filters.from} className={`${field} mt-1`} />
            </div>
            <div>
              <label htmlFor="f-to" className="text-xs font-bold text-admin-text">
                Sampai tanggal (WIB)
              </label>
              <input id="f-to" type="date" name="sampai" defaultValue={filters.to} className={`${field} mt-1`} />
            </div>
          </div>
          <p className="mt-1 text-xs text-admin-text">Bila diisi, menggantikan pilihan Rentang.</p>
        </details>
      </form>

      <p className="text-sm text-admin-text" aria-live="polite">
        {total.toLocaleString("id-ID")} aktivitas{pages > 1 ? ` · halaman ${page} dari ${pages}` : ""}
      </p>

      {rows.length === 0 ? (
        <EmptyState title="Tidak ada aktivitas" description={filtered ? "Tidak ada aktivitas yang cocok dengan filter ini." : "Belum ada aktivitas tercatat."} />
      ) : (
        <div className="space-y-5">
          {groups.map((g) => (
            <section key={g.key} aria-labelledby={`hari-${g.key}`} className="rounded-xl border border-admin-line bg-white">
              <h2 id={`hari-${g.key}`} className="border-b border-admin-line px-4 py-3 text-sm font-extrabold text-admin-ink sm:px-5">
                {dayLabel(g.key)}
              </h2>
              <ol className="divide-y divide-admin-line">
                {g.items.map((r) => (
                  <li key={r.id} className="flex flex-wrap items-center gap-x-4 gap-y-1.5 px-4 py-3 sm:flex-nowrap sm:px-5">
                    <time dateTime={r.at} title={fullFmt.format(new Date(r.at))} className="w-12 shrink-0 font-mono text-xs font-bold text-admin-text">
                      {timeFmt.format(new Date(r.at))}
                    </time>
                    <span className={`inline-flex w-16 shrink-0 justify-center rounded-full px-2 py-0.5 text-[11px] font-extrabold tracking-wide ${KIND_CLASS[r.kind]}`}>{r.kind}</span>
                    <p className="min-w-0 basis-full text-sm text-admin-ink sm:flex-1 sm:basis-auto">
                      <span className="font-extrabold">{r.userName}</span> <span className="break-words">{r.summary}</span>
                    </p>
                    {r.hasDiff ? <DiffButton id={r.id} summary={`${r.userName} — ${r.summary}`} /> : null}
                  </li>
                ))}
              </ol>
            </section>
          ))}
        </div>
      )}

      {pages > 1 ? (
        <nav aria-label="Halaman log" className="flex flex-wrap items-center justify-between gap-3">
          {page > 1 ? (
            <Link className={btn} href={`${BASE}${query(filters, { halaman: String(page - 1) })}`}>
              ← Lebih baru
            </Link>
          ) : (
            <span />
          )}
          {page < pages ? (
            <Link className={btn} href={`${BASE}${query(filters, { halaman: String(page + 1) })}`}>
              Lebih lama →
            </Link>
          ) : null}
        </nav>
      ) : null}
    </div>
  );
}
