import { getDictionary } from "@/i18n/dictionaries";
import { getLocale } from "@/i18n/request";
import { Link } from "@/i18n/Link";
import { ChevronLeft, ChevronRight } from "lucide-react";

type PaginationProps = {
  page: number;
  totalPages: number;
  /** Membuat URL untuk nomor halaman tertentu. */
  hrefFor: (page: number) => string;
};

/** Halaman yang dirender harus bilangan bulat. Pecahan membuat `page - 1` jadi 1.2000000000000002. */
function wholePage(page: number, total: number): number {
  if (!Number.isInteger(page) || page < 1) return 1;
  return Math.min(page, total);
}

/** Daftar halaman dengan ellipsis: 1 2 3 … 14 15 (seperti `pkp-pagination`). */
function pageList(page: number, total: number): (number | "…")[] {
  const set = new Set([1, 2, total - 1, total, page - 1, page, page + 1]);
  const pages = [...set].filter((n) => n >= 1 && n <= total).sort((a, b) => a - b);
  const out: (number | "…")[] = [];
  pages.forEach((n, i) => {
    if (i > 0 && n - pages[i - 1] > 1) out.push("…");
    out.push(n);
  });
  return out;
}

export function Pagination({ page, totalPages, hrefFor }: PaginationProps) {
  const total = Number.isInteger(totalPages) && totalPages > 0 ? totalPages : 1;
  const current = wholePage(page, total);
  if (total <= 1) return null;
  const t = getDictionary(getLocale()).common;
  const base =
    "flex size-11 items-center justify-center rounded-[6px] border border-primary text-sm font-semibold transition-colors";
  return (
    <nav aria-label={t.pagination} className="mt-12 flex flex-wrap items-center justify-center gap-2">
      {current > 1 ? (
        <Link href={hrefFor(current - 1)} className={`${base} text-primary hover:bg-primary hover:text-white`} aria-label={t.previous}>
          <ChevronLeft className="size-4" />
        </Link>
      ) : (
        <span className={`${base} cursor-not-allowed text-primary opacity-40`} aria-hidden>
          <ChevronLeft className="size-4" />
        </span>
      )}
      {pageList(current, total).map((n, i) =>
        n === "…" ? (
          <span key={`dots-${i}`} className="px-1 text-body-soft">
            …
          </span>
        ) : (
          <Link
            key={n}
            href={hrefFor(n)}
            aria-current={n === current ? "page" : undefined}
            className={`${base} ${n === current ? "bg-primary text-white" : "text-primary hover:bg-primary hover:text-white"}`}
          >
            {n}
          </Link>
        ),
      )}
      {current < total ? (
        <Link href={hrefFor(current + 1)} className={`${base} text-primary hover:bg-primary hover:text-white`} aria-label={t.next}>
          <ChevronRight className="size-4" />
        </Link>
      ) : (
        <span className={`${base} cursor-not-allowed text-primary opacity-40`} aria-hidden>
          <ChevronRight className="size-4" />
        </span>
      )}
    </nav>
  );
}
