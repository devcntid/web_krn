import {
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import Link from "next/link";

import { parsePageParam } from "@/lib/page-param";

import {
  DataTableBody,
  type BulkAction,
  type BulkActionResult,
  type ColumnMeta,
} from "./DataTableBody";

/*
 * DataTable — Server Component, state di URL.
 *
 * Keputusan: sorting & pagination dikendalikan URL (?sort=&dir=&page=), bukan state klien, karena B6
 * (daftar publikasi) memakai tab status, pencarian, filter, dan pagination "via URL" yang diambil di
 * server dari database — tabel tidak pernah memegang seluruh data. Header kolom & tombol halaman
 * hanyalah <Link> yang mempertahankan query lain (tab/filter/cari).
 *
 * Fungsi `render` kolom tidak bisa dikirim ke Client Component, jadi sel dirender DI SERVER menjadi
 * ReactNode lalu diserahkan ke DataTableBody (klien) yang hanya mengurus pilih-baris & aksi massal.
 * Aksi massal adalah Server Action `(formData) => …` yang menerima `action` dan `ids` (berulang).
 */

export type SortDir = "asc" | "desc";
export type SearchParams = Record<string, string | string[] | undefined>;

export type Column<Row> = {
  key: string;
  header: string;
  sortable?: boolean;
  align?: "left" | "right" | "center";
  className?: string;
  /** Dijalankan di server. Bawaan: String(row[key]). */
  render?: (row: Row) => React.ReactNode;
};

type Props<Row> = {
  /** Keterangan tabel untuk pembaca layar. */
  caption: string;
  rows: readonly Row[];
  columns: readonly Column<Row>[];
  getRowId: (row: Row) => string;
  /** Path halaman (mis. "/admin/publikasi/") + query saat ini, untuk membangun URL sort/halaman. */
  basePath: string;
  searchParams?: SearchParams;
  sort?: { key: string; dir: SortDir };
  page: number;
  pageSize: number;
  total: number;
  bulkActions?: readonly BulkAction[];
  bulkAction?: (formData: FormData) => Promise<BulkActionResult>;
  empty?: React.ReactNode;
};

/** Baca ?sort=&dir=&page= secara aman (kunci sort harus salah satu kolom sortable). */
export function parseTableParams(
  sp: SearchParams,
  sortable: readonly string[],
  fallback: { key: string; dir: SortDir },
): { sort: { key: string; dir: SortDir }; page: number } {
  const one = (v: string | string[] | undefined) =>
    Array.isArray(v) ? v[0] : v;
  const key = one(sp.sort);
  const dir = one(sp.dir);
  return {
    sort:
      key && sortable.includes(key)
        ? { key, dir: dir === "asc" ? "asc" : "desc" }
        : fallback,
    page: parsePageParam(one(sp.page)),
  };
}

function hrefWith(
  basePath: string,
  sp: SearchParams,
  patch: Record<string, string | null>,
): string {
  const q = new URLSearchParams();
  for (const [k, v] of Object.entries(sp)) {
    if (v === undefined || k in patch) continue;
    for (const one of Array.isArray(v) ? v : [v]) q.append(k, one);
  }
  for (const [k, v] of Object.entries(patch)) if (v !== null) q.set(k, v);
  const s = q.toString();
  return s ? `${basePath}?${s}` : basePath;
}

function defaultCell<Row>(row: Row, key: string): React.ReactNode {
  const v = (row as Record<string, unknown>)[key];
  return v === null || v === undefined ? "—" : String(v);
}

const linkBtn =
  "flex min-h-11 min-w-11 items-center justify-center rounded-lg px-2 text-sm font-bold focus-visible:outline-2 focus-visible:outline-primary";

export function DataTable<Row>({
  caption,
  rows,
  columns,
  getRowId,
  basePath,
  searchParams = {},
  sort,
  page,
  pageSize,
  total,
  bulkActions,
  bulkAction,
  empty,
}: Props<Row>) {
  const pages = Math.max(1, Math.ceil(total / pageSize));
  const meta: ColumnMeta[] = columns.map((c) => ({
    key: c.key,
    align: c.align ?? "left",
    className: c.className,
  }));

  const headers = columns.map((c) => {
    if (!c.sortable) return { key: c.key, node: c.header, ariaSort: undefined };
    const active = sort?.key === c.key;
    const nextDir: SortDir = active && sort?.dir === "asc" ? "desc" : "asc";
    const Icon = !active
      ? ArrowUpDown
      : sort?.dir === "asc"
        ? ArrowUp
        : ArrowDown;
    return {
      key: c.key,
      ariaSort: active
        ? sort?.dir === "asc"
          ? ("ascending" as const)
          : ("descending" as const)
        : ("none" as const),
      node: (
        <Link
          href={hrefWith(basePath, searchParams, {
            sort: c.key,
            dir: nextDir,
            page: null,
          })}
          scroll={false}
          className="-mx-1 inline-flex min-h-11 items-center gap-1 rounded px-1 hover:text-primary focus-visible:outline-2 focus-visible:outline-primary"
        >
          {c.header}
          <Icon
            aria-hidden="true"
            size={14}
            className={active ? "text-primary" : "opacity-50"}
          />
          <span className="sr-only">
            , urutkan {nextDir === "asc" ? "naik" : "turun"}
          </span>
        </Link>
      ),
    };
  });

  const body = rows.map((row) => ({
    id: getRowId(row),
    cells: columns.map((c) =>
      c.render ? c.render(row) : defaultCell(row, c.key),
    ),
  }));

  const from = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const to = Math.min(total, page * pageSize);
  const windowPages = Array.from({ length: pages }, (_, i) => i + 1).filter(
    (p) => p === 1 || p === pages || Math.abs(p - page) <= 1,
  );

  return (
    <div className="overflow-hidden rounded-xl border border-admin-line bg-white">
      {rows.length === 0 ? (
        <div className="p-4">
          {empty ?? (
            <p className="py-8 text-center text-sm text-admin-text">
              Belum ada data.
            </p>
          )}
        </div>
      ) : (
        <DataTableBody
          caption={caption}
          headers={headers}
          columns={meta}
          rows={body}
          bulkActions={bulkActions ?? []}
          bulkAction={bulkAction}
        />
      )}
      <nav
        aria-label="Paginasi tabel"
        className="flex flex-wrap items-center justify-between gap-3 border-t border-admin-line px-4 py-2 text-sm text-admin-text"
      >
        <p>
          Menampilkan {from}–{to} dari {total}
        </p>
        <ul className="flex items-center gap-1">
          <li>
            {page > 1 ? (
              <Link
                href={hrefWith(basePath, searchParams, {
                  page: String(page - 1),
                })}
                scroll={false}
                className={`${linkBtn} text-admin-ink hover:bg-admin-canvas`}
              >
                <ChevronLeft aria-hidden="true" size={18} />
                <span className="sr-only">Halaman sebelumnya</span>
              </Link>
            ) : (
              <span
                aria-hidden="true"
                className={`${linkBtn} text-admin-field`}
              >
                <ChevronLeft size={18} />
              </span>
            )}
          </li>
          {windowPages.map((p, i) => (
            <li key={p} className="flex items-center">
              {i > 0 && windowPages[i - 1] !== p - 1 ? (
                <span aria-hidden="true" className="px-1">
                  …
                </span>
              ) : null}
              <Link
                href={hrefWith(basePath, searchParams, { page: String(p) })}
                scroll={false}
                aria-current={p === page ? "page" : undefined}
                aria-label={`Halaman ${p}`}
                className={`${linkBtn} ${p === page ? "bg-primary text-white" : "text-admin-ink hover:bg-admin-canvas"}`}
              >
                {p}
              </Link>
            </li>
          ))}
          <li>
            {page < pages ? (
              <Link
                href={hrefWith(basePath, searchParams, {
                  page: String(page + 1),
                })}
                scroll={false}
                className={`${linkBtn} text-admin-ink hover:bg-admin-canvas`}
              >
                <ChevronRight aria-hidden="true" size={18} />
                <span className="sr-only">Halaman berikutnya</span>
              </Link>
            ) : (
              <span
                aria-hidden="true"
                className={`${linkBtn} text-admin-field`}
              >
                <ChevronRight size={18} />
              </span>
            )}
          </li>
        </ul>
      </nav>
    </div>
  );
}
