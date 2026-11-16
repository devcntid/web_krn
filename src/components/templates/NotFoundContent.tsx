import Link from "next/link";

import { SearchForm } from "@/components/ui/SearchForm";

/** Isi halaman 404 situs publik (tanpa kerangka) — artboard "11 · 404". */
export function NotFoundContent() {
  return (
    <section className="flex min-h-[600px] items-center justify-center px-6 pt-32 pb-16 text-center lg:min-h-[740px] lg:pt-40 lg:pb-20">
      <div className="flex w-full max-w-[560px] flex-col items-center gap-4">
        <p className="text-[88px] leading-none font-extrabold text-primary italic lg:text-[120px]">404</p>
        <h1 className="text-[30px] leading-[1.2] font-bold lg:text-[40px]">Halaman tidak ditemukan</h1>
        <p className="text-base leading-[1.6] text-body">
          Halaman yang Sahabat cari mungkin sudah dipindahkan. Coba cari publikasi kami atau kembali ke beranda.
        </p>
        <SearchForm id="cari-404" label="Cari publikasi" className="mt-2 w-full" />
        <div className="mt-2 flex flex-wrap justify-center gap-3">
          <Link
            href="/"
            className="inline-flex min-h-11 items-center rounded-[6px] bg-primary px-6 py-3 text-sm font-semibold text-white transition-opacity hover:opacity-90"
          >
            Kembali ke Beranda
          </Link>
          <Link
            href="/berita/"
            className="inline-flex min-h-11 items-center rounded-full border-2 border-primary px-6 py-2.5 text-sm font-semibold text-primary transition-colors hover:bg-primary hover:text-white"
          >
            Lihat Berita
          </Link>
        </div>
      </div>
    </section>
  );
}
