/* eslint-disable @next/next/no-html-link-for-pages -- /donasi dilayani aplikasi donasi terpisah, bukan route aplikasi ini */
import { getDictionary } from "@/i18n/dictionaries";
import { getLocale } from "@/i18n/request";
import Image from "next/image";
import { mediaUrl } from "@/lib/media";

/** CTA di akhir template post: "Jadilah Bagian Aksi Kemanusiaan" → /donasi/programs. */
export function DonationCta() {
  const t = getDictionary(getLocale()).post;
  return (
    <section className="mx-auto grid w-[90%] max-w-[1080px] items-center gap-10 py-12 md:grid-cols-2">
      <div>
        <h2 className="text-[28px] leading-[1.2] font-bold text-ink lg:text-[34px]">
          {t.ctaHeading}
        </h2>
        <p className="mt-4 text-base leading-[1.5] text-ink">
          {t.ctaBody}
        </p>
        <a
          href="/donasi/programs"
          className="mt-8 inline-block rounded-[6px] bg-accent-soft px-5 py-3 text-[13px] font-semibold text-ink transition-opacity hover:opacity-90"
        >
          {t.ctaButton}
        </a>
      </div>
      <a href="/donasi/programs" className="relative block aspect-[507/285]" aria-label={t.ctaButton}>
        <Image
          src={mediaUrl("/wp-content/uploads/2026/10/bantuan-nebulizer-oksigen-petugas-bpbd-karhutla-relawan-nusantara.jpg")}
          alt={t.ctaImageAlt}
          fill
          sizes="(min-width: 768px) 45vw, 90vw"
          className="object-cover"
        />
      </a>
    </section>
  );
}
