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

type PostGridProps = {
  /** Path halaman listing, mis. "/artikel/". */
  basePath: string;
  category: GridTab;
  /** Tab bawaan halaman ini (tidak ditulis ke URL). */
  defaultCategory: GridTab;
  page: number;
  query: string;
  perPage?: number;
};

/**
 * Pengganti shortcode `pkp-post-grid` (admin-ajax) — tab kategori, pencarian,
 * dan pagination kini memakai URL (?kategori=&q=&hal=) sehingga bisa di-crawl
 * dan dibagikan.
 */
export function PostGrid({ basePath, category, defaultCategory, page, query, perPage = 9 }: PostGridProps) {
  const q = query.trim().toLowerCase();
  const all = getPostsByCategory(category).filter(
    (p) => !q || `${p.title} ${p.excerpt}`.toLowerCase().includes(q),
  );
  const result = paginate(all, page, perPage);

  const href = (opts: { kategori?: string; hal?: number; q?: string }) => {
    const sp = new URLSearchParams();
    const kat = opts.kategori ?? category;
    if (kat !== defaultCategory) sp.set("kategori", kat);
    if (opts.q) sp.set("q", opts.q);
    if (opts.hal && opts.hal > 1) sp.set("hal", String(opts.hal));
    const s = sp.toString();
    return s ? `${basePath}?${s}` : basePath;
  };

  return (
    <div>
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <ul className="flex flex-wrap gap-4" aria-label="Kategori">
          {GRID_TABS.map((tab) => {
            const active = tab.slug === category;
            return (
              <li key={tab.slug}>
                <Link
                  href={href({ kategori: tab.slug })}
                  aria-current={active ? "true" : undefined}
                  className={`inline-flex h-9 min-w-[104px] items-center justify-center rounded-[10px] border-2 border-primary px-5 text-sm font-medium transition-colors ${
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
            className="h-9 w-full rounded-[6px] bg-[#e4e4e4] pr-4 pl-10 text-sm text-ink outline-none placeholder:text-muted focus:ring-2 focus:ring-primary"
          />
        </form>
      </div>

      {result.items.length ? (
        <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {result.items.map((post) => (
            <PostCard key={post.slug} post={post} />
          ))}
        </div>
      ) : (
        <p className="mt-12 text-center text-body-soft">Tidak ada publikasi yang cocok.</p>
      )}

      <Pagination
        page={result.page}
        totalPages={result.totalPages}
        hrefFor={(n) => href({ hal: n, q: query || undefined })}
      />
    </div>
  );
}
