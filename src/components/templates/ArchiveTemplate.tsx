import { getDictionary } from "@/i18n/dictionaries";
import { getLocale } from "@/i18n/request";
import { Link } from "@/i18n/Link";

import type { PostSummary, Term } from "@/types/content";
import { PostCard } from "@/components/cards/PostCard";
import { Breadcrumb, type Crumb } from "@/components/navigation/Breadcrumb";
import { Pagination } from "@/components/navigation/Pagination";
import { SearchForm } from "@/components/ui/SearchForm";

type ArchiveTemplateProps = {
  /** Label kecil di atas judul, mis. "Kategori". */
  eyebrow: string;
  title: string;
  /** Kalimat di bawah judul (deskripsi kategori atau jumlah hasil). */
  description?: string;
  breadcrumb: Crumb[];
  /** Isi awal kotak cari (halaman pencarian). */
  query?: string;
  /** Chip "Kategori terkait". */
  relatedCategories?: Term[];
  posts: PostSummary[];
  emptyMessage?: string;
  page: number;
  totalPages: number;
  hrefFor: (page: number) => string;
};

/** Arsip kategori / tag / hasil pencarian — artboard "10 · Kategori / Pencarian". */
export function ArchiveTemplate({
  eyebrow,
  title,
  description,
  breadcrumb,
  query,
  relatedCategories = [],
  posts,
  emptyMessage,
  page,
  totalPages,
  hrefFor,
}: ArchiveTemplateProps) {
  const t = getDictionary(getLocale());
  return (
    <div className="bg-surface-alt pt-28 pb-16 md:pb-[88px] lg:pt-[170px]">
      <div className="container-site">
        <Breadcrumb items={breadcrumb} />
        <p className="mt-3 text-sm font-semibold tracking-[0.08em] text-primary uppercase md:mt-5">{eyebrow}</p>
        <h1 className="mt-2 text-[32px] leading-[1.15] font-bold lg:text-[45px]">{title}</h1>
        {description && <p className="mt-2.5 max-w-3xl text-base text-body">{description}</p>}

        <SearchForm id="arsip-cari" label={t.common.keyword} defaultValue={query} className="mt-6 max-w-[640px] md:mt-7" />

        {relatedCategories.length > 0 && (
          <div className="mt-5 flex flex-wrap items-center gap-2.5">
            <span id="kategori-terkait" className="text-[13px] text-body">
              {t.archive.related}
            </span>
            <ul aria-labelledby="kategori-terkait" className="contents">
              {relatedCategories.map((term) => (
                <li key={term.id}>
                  <Link
                    href={`/category/${term.path}/`}
                    className="inline-flex min-h-11 items-center rounded-full border border-border bg-white px-3.5 text-[13px] text-ink transition-colors hover:border-primary hover:text-primary"
                  >
                    {term.name} ({term.count})
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        )}

        {posts.length ? (
          <div className="mt-8 grid gap-5 sm:grid-cols-2 md:mt-9 lg:grid-cols-3">
            {posts.map((post) => (
              <PostCard key={post.slug} post={post} headingTag="h2" showCategory showExcerpt={false} />
            ))}
          </div>
        ) : (
          <p className="mt-10 text-body">{emptyMessage ?? t.archive.empty}</p>
        )}

        <Pagination page={page} totalPages={totalPages} hrefFor={hrefFor} />
      </div>
    </div>
  );
}
