import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";

type PaginationProps = {
  page: number;
  totalPages: number;
  /** Membuat URL untuk nomor halaman tertentu. */
  hrefFor: (page: number) => string;
};

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
  if (totalPages <= 1) return null;
  const base =
    "flex size-10 items-center justify-center rounded-[6px] border border-primary text-sm font-semibold transition-colors";
  return (
    <nav aria-label="Navigasi halaman" className="mt-12 flex flex-wrap items-center justify-center gap-2">
      {page > 1 ? (
        <Link href={hrefFor(page - 1)} className={`${base} text-primary hover:bg-primary hover:text-white`} aria-label="Sebelumnya">
          <ChevronLeft className="size-4" />
        </Link>
      ) : (
        <span className={`${base} cursor-not-allowed text-primary opacity-40`} aria-hidden>
          <ChevronLeft className="size-4" />
        </span>
      )}
      {pageList(page, totalPages).map((n, i) =>
        n === "…" ? (
          <span key={`dots-${i}`} className="px-1 text-body-soft">
            …
          </span>
        ) : (
          <Link
            key={n}
            href={hrefFor(n)}
            aria-current={n === page ? "page" : undefined}
            className={`${base} ${n === page ? "bg-primary text-white" : "text-primary hover:bg-primary hover:text-white"}`}
          >
            {n}
          </Link>
        ),
      )}
      {page < totalPages ? (
        <Link href={hrefFor(page + 1)} className={`${base} text-primary hover:bg-primary hover:text-white`} aria-label="Berikutnya">
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
