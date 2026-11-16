import Image from "next/image";

import type { MediaRef } from "@/types/content";
import { mediaUrl } from "@/lib/media";

type PageHeroProps = {
  title: string;
  /** Teks kecil di bawah judul (opsional). */
  subtitle?: string;
  image?: MediaRef | null;
  /** Tinggi hero: "post" = template post (±743px), "page" = fullwidth header halaman, "medium"/"compact" = halaman khusus (600px/520px, artboard 04–09). */
  size?: "post" | "page" | "medium" | "compact";
  /** Lebar blok judul: "wide" = 90% (template Divi), "container" = sejajar container-site. */
  width?: "wide" | "container";
  overlay?: number;
};

/**
 * Hero dengan gambar latar + overlay gelap (Divi fullwidth header / section
 * template post). Judul selalu H1 — satu-satunya H1 di halaman.
 */
export function PageHero({ title, subtitle, image, size = "page", width = "wide", overlay = 0.61 }: PageHeroProps) {
  const height = {
    post: "min-h-[520px] lg:min-h-[743px]",
    page: "min-h-[420px] lg:min-h-[707px]",
    medium: "min-h-[380px] lg:min-h-[600px]",
    compact: "min-h-[340px] lg:min-h-[520px]",
  }[size];
  return (
    <section className={`relative flex items-end bg-[#666] ${height}`}>
      {image && (
        <Image
          src={mediaUrl(image.src)}
          alt={image.alt}
          fill
          preload
          sizes="100vw"
          className="object-cover"
        />
      )}
      <div className="absolute inset-0" style={{ backgroundColor: `rgba(0,0,0,${overlay})` }} aria-hidden />
      <div className={`relative pt-32 pb-12 ${width === "container" ? "container-site lg:pb-16" : "mx-auto w-[90%] lg:pb-[68px]"}`}>
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
