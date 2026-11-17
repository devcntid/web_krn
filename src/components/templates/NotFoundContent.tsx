import { NotFoundLogger } from "@/components/content/NotFoundLogger";
import { Link } from "@/i18n/Link";

import { getDictionary } from "@/i18n/dictionaries";
import { getLocale } from "@/i18n/request";
import { SearchForm } from "@/components/ui/SearchForm";

/** Isi halaman 404 situs publik (tanpa kerangka) — artboard "11 · 404". */
export function NotFoundContent() {
  const t = getDictionary(getLocale()).notFound;
  return (
    <section className="flex min-h-[600px] items-center justify-center px-6 pt-32 pb-16 text-center lg:min-h-[740px] lg:pt-40 lg:pb-20">
      <NotFoundLogger />
      <div className="flex w-full max-w-[560px] flex-col items-center gap-4">
        <p className="text-[88px] leading-none font-extrabold text-primary italic lg:text-[120px]">404</p>
        <h1 className="text-[30px] leading-[1.2] font-bold lg:text-[40px]">{t.title}</h1>
        <p className="text-base leading-[1.6] text-body">
          {t.body}
        </p>
        <SearchForm id="cari-404" label={t.searchLabel} className="mt-2 w-full" />
        <div className="mt-2 flex flex-wrap justify-center gap-3">
          <Link
            href="/"
            className="inline-flex min-h-11 items-center rounded-[6px] bg-primary px-6 py-3 text-sm font-semibold text-white transition-opacity hover:opacity-90"
          >
            {t.backHome}
          </Link>
          <Link
            href="/berita/"
            className="inline-flex min-h-11 items-center rounded-full border-2 border-primary px-6 py-2.5 text-sm font-semibold text-primary transition-colors hover:bg-primary hover:text-white"
          >
            {t.seeNews}
          </Link>
        </div>
      </div>
    </section>
  );
}
