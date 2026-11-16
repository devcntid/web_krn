/* eslint-disable @next/next/no-html-link-for-pages -- /donasi dilayani aplikasi donasi terpisah, bukan route aplikasi ini */
import Image from "next/image";
import { mediaUrl } from "@/lib/media";

/** CTA di akhir template post: "Jadilah Bagian Aksi Kemanusiaan" → /donasi/programs. */
export function DonationCta() {
  return (
    <section className="mx-auto grid w-[90%] max-w-[1080px] items-center gap-10 py-12 md:grid-cols-2">
      <div>
        <h2 className="text-[28px] leading-[1.2] font-bold text-ink lg:text-[34px]">
          Jadilah Bagian Aksi Kemanusiaan
        </h2>
        <p className="mt-4 text-base leading-[1.5] text-ink">
          Setiap bantuan Anda menghadirkan harapan, melindungi mereka yang rentan, dan membantu masyarakat
          terdampak untuk kembali bangkit.
        </p>
        <a
          href="/donasi/programs"
          className="mt-8 inline-block rounded-[6px] bg-accent-soft px-5 py-3 text-[13px] font-semibold text-ink transition-opacity hover:opacity-90"
        >
          Mari Berdonasi
        </a>
      </div>
      <a href="/donasi/programs" className="relative block aspect-[507/285]" aria-label="Mari Berdonasi">
        <Image
          src={mediaUrl("/wp-content/uploads/2026/10/bantuan-nebulizer-oksigen-petugas-bpbd-karhutla-relawan-nusantara.jpg")}
          alt="Relawan Nusantara memberikan bantuan nebulizer dan oksigen kepada petugas BPBD saat karhutla"
          fill
          sizes="(min-width: 768px) 45vw, 90vw"
          className="object-cover"
        />
      </a>
    </section>
  );
}
