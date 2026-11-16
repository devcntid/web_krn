import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";

import { type Column, DataTable, type SearchParams, parseTableParams } from "@/components/admin/DataTable";
import type { BulkAction } from "@/components/admin/DataTableBody";
import { EmptyState } from "@/components/admin/EmptyState";
import { PageHeader } from "@/components/admin/PageHeader";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { PostFilters } from "@/components/admin/publikasi/PostFilters";
import { mediaUrl } from "@/lib/media";
import { SEO_LEVEL_LABEL, type SeoLevel, evaluateSeo } from "@/lib/seo-score";
import { can, requireUser } from "@/server/permissions";
import { type AdminPostRow, countPostsByStatus, listAdminPosts, listCategoryOptions, listPostFilterOptions } from "@/server/repos/admin-posts";
import { CONTENT_STATUSES, type ContentStatus } from "@/types/admin-posts";

import { bulkPostsAction } from "./actions";

export const metadata: Metadata = { title: "Publikasi" };

const BASE = "/admin/publikasi/";
const PAGE_SIZE = 20;

const TABS: readonly { key: ContentStatus | "all"; label: string }[] = [
  { key: "all", label: "Semua" },
  { key: "published", label: "Terbit" },
  { key: "review", label: "Review" },
  { key: "scheduled", label: "Terjadwal" },
  { key: "draft", label: "Draf" },
  { key: "trashed", label: "Sampah" },
];

const SEO_DOT: Record<SeoLevel, string> = {
  baik: "bg-admin-seo-good",
  perlu: "bg-admin-seo-warn",
  kurang: "bg-admin-danger",
};

const num = new Intl.NumberFormat("id-ID");
const dateFmt = new Intl.DateTimeFormat("id-ID", { timeZone: "Asia/Jakarta", day: "2-digit", month: "short", year: "numeric" });
const monthFmt = new Intl.DateTimeFormat("id-ID", { timeZone: "UTC", month: "long", year: "numeric" });

const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v) ?? "";

/** Daftar publikasi (artboard "A2 · Publikasi"). Tab, cari, filter, urutan, dan halaman ada di URL. */
export default async function PublikasiPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const user = await requireUser();
  const sp = await searchParams;

  const statusParam = one(sp.status);
  const status: ContentStatus | "all" = CONTENT_STATUSES.find((s) => s === statusParam) ?? "all";
  const filters = { q: one(sp.q).slice(0, 120), kategori: one(sp.kategori), penulis: one(sp.penulis), bulan: one(sp.bulan) };
  const { sort, page } = parseTableParams(sp, ["title", "status", "date"], { key: "date", dir: "desc" });

  const [{ rows, total }, counts, categories, options] = await Promise.all([
    listAdminPosts({
      status,
      q: filters.q,
      category: filters.kategori,
      author: filters.penulis,
      month: filters.bulan,
      sort: { key: sort.key === "title" || sort.key === "status" ? sort.key : "date", dir: sort.dir },
      page,
      pageSize: PAGE_SIZE,
    }),
    countPostsByStatus(),
    listCategoryOptions(),
    listPostFilterOptions(),
  ]);

  /** Query yang dipertahankan saat pindah tab (filter tetap, halaman kembali ke 1). */
  const tabHref = (key: ContentStatus | "all") => {
    const q = new URLSearchParams();
    if (key !== "all") q.set("status", key);
    if (filters.q) q.set("q", filters.q);
    if (filters.kategori) q.set("kategori", filters.kategori);
    if (filters.penulis) q.set("penulis", filters.penulis);
    if (filters.bulan) q.set("bulan", filters.bulan);
    const s = q.toString();
    return s ? `${BASE}?${s}` : BASE;
  };

  const canWrite = can(user, "draft.write");
  const canBulk = can(user, "content.publish");
  const bulkActions: BulkAction[] = !canBulk
    ? []
    : status === "trashed"
      ? [
          { value: "restore", label: "Pulihkan" },
          ...(can(user, "content.review")
            ? [
                {
                  value: "delete",
                  label: "Hapus permanen",
                  tone: "danger" as const,
                  confirm: {
                    title: "Hapus permanen publikasi terpilih?",
                    description: "Publikasi beserta riwayat revisinya dihapus dan tidak dapat dikembalikan.",
                    confirmLabel: "Hapus permanen",
                  },
                },
              ]
            : []),
        ]
      : [
          {
            value: "category",
            label: "Pindah kategori",
            optionLabel: "Kategori tujuan…",
            options: categories.map((c) => ({ value: String(c.id), label: c.name })),
          },
          { value: "draft", label: "Jadikan draf" },
          {
            value: "trash",
            label: "Pindahkan ke sampah",
            tone: "danger",
            confirm: {
              title: "Pindahkan publikasi terpilih ke sampah?",
              description: "Publikasi yang sudah terbit akan hilang dari situs. Anda masih bisa memulihkannya dari tab Sampah.",
              confirmLabel: "Pindahkan ke sampah",
            },
          },
        ];

  const columns: Column<AdminPostRow>[] = [
    {
      key: "title",
      header: "Judul",
      sortable: true,
      render: (r) => (
        <div className="flex min-w-64 items-center gap-3">
          {r.thumbnail ? (
            <Image src={mediaUrl(r.thumbnail)} alt="" width={56} height={40} sizes="56px" className="h-10 w-14 shrink-0 rounded-md object-cover" />
          ) : (
            <span aria-hidden="true" className="h-10 w-14 shrink-0 rounded-md bg-admin-neutral-bg" />
          )}
          <div className="min-w-0">
            <Link
              href={`${BASE}${r.id}/`}
              className="inline-flex min-h-11 items-center font-bold text-admin-ink hover:text-primary focus-visible:outline-2 focus-visible:outline-primary"
            >
              {r.title}
            </Link>
            <p className="-mt-2 truncate pb-1 text-xs text-admin-text">/{r.slug}/</p>
          </div>
        </div>
      ),
    },
    { key: "categories", header: "Kategori", render: (r) => (r.categories.length ? r.categories.join(", ") : "—") },
    {
      key: "seo",
      header: "SEO",
      render: (r) => {
        const { level } = evaluateSeo({ ...r });
        return (
          <span className="inline-flex items-center gap-1.5 text-[13px] font-bold whitespace-nowrap">
            <span aria-hidden="true" className={`size-2 rounded-full ${SEO_DOT[level]}`} />
            {SEO_LEVEL_LABEL[level]}
          </span>
        );
      },
    },
    { key: "status", header: "Status", sortable: true, render: (r) => <StatusBadge status={r.status} /> },
    {
      key: "date",
      header: "Tanggal",
      sortable: true,
      className: "whitespace-nowrap text-admin-text",
      render: (r) => (r.publishedAt ? dateFmt.format(r.publishedAt) : "—"),
    },
    {
      key: "actions",
      header: "Aksi",
      align: "right",
      className: "whitespace-nowrap",
      render: (r) => (
        <span className="inline-flex items-center justify-end gap-1">
          <Link
            href={`${BASE}${r.id}/`}
            className="inline-flex min-h-11 items-center rounded px-2 text-[13px] font-bold text-primary hover:text-admin-primary-dark focus-visible:outline-2 focus-visible:outline-primary"
          >
            {canWrite && r.status !== "trashed" ? "Edit" : "Buka"}
            <span className="sr-only">: {r.title}</span>
          </Link>
          {r.status === "published" ? (
            <Link
              href={`/${r.slug}/`}
              target="_blank"
              rel="noopener"
              className="inline-flex min-h-11 items-center rounded px-2 text-[13px] font-bold text-primary hover:text-admin-primary-dark focus-visible:outline-2 focus-visible:outline-primary"
            >
              Lihat <span aria-hidden="true">&nbsp;↗</span>
              <span className="sr-only">: {r.title} (tab baru)</span>
            </Link>
          ) : null}
        </span>
      ),
    },
  ];

  return (
    <>
      <PageHeader
        title="Publikasi"
        description={`${num.format(counts.all)} publikasi · Artikel, Berita, Kemitraan`}
        actions={
          canWrite ? (
            <Link
              href={`${BASE}baru/`}
              className="inline-flex min-h-11 items-center rounded-admin bg-primary px-4.5 text-sm font-extrabold text-white hover:bg-admin-primary-dark focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
            >
              + Tulis Publikasi
            </Link>
          ) : null
        }
      />

      <nav aria-label="Status publikasi" className="-mb-1 border-b border-admin-line">
        <ul className="flex flex-wrap gap-1.5">
          {TABS.map((t) => {
            const active = t.key === status;
            return (
              <li key={t.key}>
                <Link
                  href={tabHref(t.key)}
                  aria-current={active ? "page" : undefined}
                  className={`flex min-h-11 items-center gap-1.5 border-b-[3px] px-3.5 text-sm font-bold focus-visible:outline-2 focus-visible:outline-primary ${
                    active ? "border-primary text-primary" : "border-transparent text-admin-neutral-text hover:text-primary"
                  }`}
                >
                  {t.label}
                  <span className="text-xs font-semibold text-admin-text">{num.format(counts[t.key])}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      <PostFilters
        action={BASE}
        hidden={{
          ...(status !== "all" ? { status } : {}),
          ...(one(sp.sort) ? { sort: sort.key, dir: sort.dir } : {}),
        }}
        values={filters}
        categories={categories.map((c) => ({ value: c.slug, label: c.name }))}
        authors={options.authors.map((a) => ({ value: a.id, label: a.name }))}
        months={options.months.map((m) => ({ value: m, label: monthFmt.format(new Date(`${m}-01T00:00:00Z`)) }))}
      />

      <DataTable
        caption="Daftar publikasi"
        rows={rows}
        columns={columns}
        getRowId={(r) => String(r.id)}
        basePath={BASE}
        searchParams={sp}
        sort={sort}
        page={page}
        pageSize={PAGE_SIZE}
        total={total}
        bulkActions={bulkActions}
        bulkAction={bulkPostsAction}
        empty={
          <EmptyState
            title={status === "trashed" ? "Sampah kosong" : "Tidak ada publikasi"}
            description={
              filters.q || filters.kategori || filters.penulis || filters.bulan
                ? "Tidak ada publikasi yang cocok dengan pencarian atau filter ini."
                : "Belum ada publikasi dengan status ini."
            }
          />
        }
      />
    </>
  );
}
