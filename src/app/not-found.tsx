import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Halaman tidak ditemukan",
  robots: { index: false },
};

export default function NotFound() {
  return (
    <section className="container-site flex min-h-[70vh] flex-col items-center justify-center pt-32 pb-20 text-center">
      <p className="text-sm font-semibold tracking-wide text-primary uppercase">404</p>
      <h1 className="mt-3 text-[32px] font-bold lg:text-[45px]">Halaman tidak ditemukan</h1>
      <p className="mt-4 max-w-md text-body">
        Halaman yang Sahabat cari mungkin sudah dipindahkan. Coba cari publikasi kami atau kembali ke beranda.
      </p>
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <Link href="/" className="rounded-[6px] bg-primary px-6 py-3 text-sm font-semibold text-white">
          Kembali ke Beranda
        </Link>
        <Link href="/berita/" className="rounded-full border-2 border-primary px-6 py-3 text-sm font-semibold text-primary">
          Lihat Berita
        </Link>
      </div>
    </section>
  );
}
