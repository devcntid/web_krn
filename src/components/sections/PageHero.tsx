import Image from "next/image";

import type { MediaRef } from "@/types/content";

type PageHeroProps = {
  title: string;
  /** Teks kecil di bawah judul (opsional). */
  subtitle?: string;
  image?: MediaRef | null;
  /** Tinggi hero: "post" = template post (±743px), "page" = fullwidth header halaman. */
  size?: "post" | "page";
  overlay?: number;
};

/**
 * Hero dengan gambar latar + overlay gelap (Divi fullwidth header / section
 * template post). Judul selalu H1 — satu-satunya H1 di halaman.
 */
export function PageHero({ title, subtitle, image, size = "page", overlay = 0.61 }: PageHeroProps) {
  const height = size === "post" ? "min-h-[520px] lg:min-h-[743px]" : "min-h-[420px] lg:min-h-[707px]";
  return (
    <section className={`relative flex items-end bg-[#666] ${height}`}>
      {image && (
        <Image
          src={image.src}
          alt={image.alt}
          fill
          priority
          sizes="100vw"
          className="object-cover"
        />
      )}
      <div className="absolute inset-0" style={{ backgroundColor: `rgba(0,0,0,${overlay})` }} aria-hidden />
      <div className="relative mx-auto w-[90%] pt-32 pb-12 lg:pb-[68px]">
        <h1
          className={`text-white ${
            size === "post" ? "text-[32px] leading-[1.2] lg:text-[54px]" : "text-[40px] leading-[1.1] lg:text-[64px]"
          } font-bold`}
        >
          {title}
        </h1>
        {subtitle && <p className="mt-3 max-w-2xl text-base text-white/90 lg:text-lg">{subtitle}</p>}
      </div>
    </section>
  );
}
