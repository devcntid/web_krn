import Link from "next/link";
import { Search } from "lucide-react";

import { getPostsByCategory, paginate } from "@/lib/content";
import { PostCard } from "@/components/cards/PostCard";
import { Pagination } from "@/components/navigation/Pagination";

export const GRID_TABS = [
  { slug: "artikel", label: "Artikel" },
  { slug: "berita", label: "Berita" },
  { slug: "kemitraan", label: "Kemitraan" },
] as const;

export type GridTab = (typeof GRID_TABS)[number]["slug"];

/** Batas "Muat lebih banyak" (× perPage kartu); setelah itu pagination biasa yang dipakai. */
const MAX_LOADED_BATCHES = 5;

type PostGridProps = {
  /** Path halaman listing, mis. "/artikel/". */
  basePath: string;
  category: GridTab;
  /** Tab bawaan halaman ini (tidak ditulis ke URL). */
  defaultCategory: GridTab;
  page: number;
  query: string;
  /**
   * Jumlah "halaman" yang dimuat sekaligus dari awal (tombol "Muat lebih banyak" di mobile).
   * Hanya berlaku di halaman pertama.
   */
  loaded?: number;
  perPage?: number;
};

/**
 * Pengganti shortcode `pkp-post-grid` (admin-ajax) — tab kategori, pencarian,
 * dan pagination kini memakai URL (?kategori=&q=&hal=) sehingga bisa di-crawl
 * dan dibagikan. Mobile (artboard "M4 · Publikasi"): tab bisa digeser dan tombol
 * "Muat lebih banyak" (?muat=) menggantikan pagination; semuanya tetap berupa
 * tautan biasa sehingga berfungsi tanpa JavaScript.
 */
export async function PostGrid({ basePath, category, defaultCategory, page, query, loaded = 1, perPage = 9 }: PostGridProps) {
  const q = query.trim().toLowerCase();
  const all = (await getPostsByCategory(category)).filter(
    (p) => !q || `${p.title} ${p.excerpt}`.toLowerCase().includes(q),
  );
  const result = paginate(all, page, perPage);

  // Mode "Muat lebih banyak": dari halaman 1, tampilkan `batches` halaman sekaligus.
  const loadMoreMode = result.page === 1;
  const maxBatches = Math.min(result.totalPages, MAX_LOADED_BATCHES);
  const batches = loadMoreMode ? Math.min(Math.max(1, Math.floor(loaded) || 1), maxBatches) : 1;
  const items = batches > 1 ? all.slice(0, batches * perPage) : result.items;
  const hasMore = loadMoreMode && batches < maxBatches;

  const href = (opts: { kategori?: string; hal?: number; q?: string; muat?: number }) => {
    const sp = new URLSearchParams();
    const kat = opts.kategori ?? category;
    if (kat !== defaultCategory) sp.set("kategori", kat);
    if (opts.q) sp.set("q", opts.q);
    if (opts.hal && opts.hal > 1) sp.set("hal", String(opts.hal));
    if (opts.muat && opts.muat > 1) sp.set("muat", String(opts.muat));
    const s = sp.toString();
    return s ? `${basePath}?${s}` : basePath;
  };

  return (
    <div>
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <ul className="-mx-[5vw] flex gap-2 overflow-x-auto px-[5vw] pb-1 md:mx-0 md:flex-wrap md:gap-4 md:overflow-visible md:px-0 md:pb-0" aria-label="Kategori">
          {GRID_TABS.map((tab) => {
            const active = tab.slug === category;
            return (
              <li key={tab.slug} className="shrink-0">
                <Link
                  href={href({ kategori: tab.slug })}
                  aria-current={active ? "true" : undefined}
                  className={`inline-flex h-11 min-w-[104px] items-center justify-center rounded-[10px] border-2 border-primary px-5 text-sm font-medium whitespace-nowrap transition-colors md:h-9 ${
                    active ? "bg-primary text-white" : "bg-white text-ink hover:bg-primary hover:text-white"
                  }`}
                >
                  {tab.label}
                </Link>
              </li>
            );
          })}
        </ul>
        <form action={basePath} method="get" role="search" className="relative md:w-[362px]">
          <input type="hidden" name="kategori" value={category} />
          <label htmlFor="grid-search" className="sr-only">
            Cari berita
          </label>
          <Search aria-hidden className="pointer-events-none absolute top-1/2 left-4 size-4 -translate-y-1/2 text-muted" />
          <input
            id="grid-search"
            name="q"
            type="search"
            defaultValue={query}
            placeholder="Search for News"
            className="h-11 w-full rounded-[6px] bg-[#e4e4e4] pr-4 pl-10 text-sm text-ink outline-none placeholder:text-body-soft focus:ring-2 focus:ring-primary md:h-9"
          />
        </form>
      </div>

      {items.length ? (
        <div className="mt-5 grid gap-4 sm:grid-cols-2 md:mt-8 md:gap-5 lg:grid-cols-3">
          {items.map((post, i) => (
            // Kartu pertama tiap kelompok menjadi jangkar gulir setelah "Muat lebih banyak".
            <div key={post.slug} id={i > 0 && i % perPage === 0 ? `muat-${i / perPage + 1}` : undefined} className="scroll-mt-20">
              <PostCard post={post} excerptClassName="max-md:hidden" />
            </div>
          ))}
        </div>
      ) : (
        <p className="mt-12 text-center text-body-soft">Tidak ada publikasi yang cocok.</p>
      )}

      {hasMore && (
        <Link
          href={`${href({ q: query || undefined, muat: batches + 1 })}#muat-${batches + 1}`}
          className="mt-5 flex h-12 items-center justify-center rounded-lg border-2 border-primary text-sm font-semibold text-primary transition-colors hover:bg-primary hover:text-white md:hidden"
        >
          Muat lebih banyak
        </Link>
      )}

      {/* Di mobile, pagination hanya menjadi cadangan (halaman ≥2 atau semua sudah dimuat). */}
      <div className={hasMore ? "max-md:hidden" : undefined}>
        <Pagination
          page={result.page}
          totalPages={result.totalPages}
          hrefFor={(n) => href({ hal: n, q: query || undefined })}
        />
      </div>
    </div>
  );
}
