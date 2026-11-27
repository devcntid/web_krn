import Image from "next/image";
import dynamic from "next/dynamic";
import { ArrowDown } from "lucide-react";

import { pageLabels } from "@/content/localized";
import { getLocale } from "@/i18n/request";
import { getHomeContent } from "@/lib/home";
import { mediaUrl } from "@/lib/media";
import { activeSlides } from "@/server/home";

/** Embla di-code-split agar JS carousel tidak membebani LCP beranda. */
const Carousel = dynamic(() => import("@/components/ui/Carousel").then((m) => m.Carousel));

/**
 * Hero beranda: slider desktop (5:3, link kampanye) & slider mobile (potret) terpisah, seperti Smart Slider 3.
 * `sizes` memakai 1px untuk slider yang tersembunyi agar preload tidak mengunduh banner ukuran penuh
 * milik breakpoint lain.
 * Slide dari `settings.home` (/admin/beranda); hanya yang sedang dalam jadwal tayang yang dirender.
 */
export async function HeroSlider() {
  const c = await getHomeContent(getLocale());
  const desktop = activeSlides(c.heroSlidesDesktop);
  const mobile = activeSlides(c.heroSlidesMobile);
  return (
    <section aria-label={pageLabels(getLocale()).featuredCampaigns}>
      <div className="relative hidden md:block">
        <Carousel label={pageLabels(getLocale()).featuredCampaigns} autoplayMs={5000} arrows="side">
          {desktop.map((slide, i) => (
            <a key={slide.id} href={slide.href} className="relative block aspect-[1193/620] w-full">
              <Image
                src={mediaUrl(slide.image)}
                alt={slide.title}
                fill
                preload={i === 0}
                fetchPriority={i === 0 ? "high" : "auto"}
                sizes="(min-width: 768px) 100vw, 1px"
                className="object-cover"
              />
            </a>
          ))}
        </Carousel>
        {/* Penanda scroll: tengah bawah slider, menggulir ke section intro di bawahnya. */}
        <a
          href="#jelajah"
          className="absolute bottom-6 left-1/2 z-10 hidden min-h-11 -translate-x-1/2 items-center gap-2.5 rounded-lg px-2 text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.6)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white lg:flex xl:bottom-10"
        >
          <span aria-hidden className="flex h-[38px] w-[22px] justify-center overflow-hidden rounded-full border-[1.5px] border-white pt-1.5">
            <ArrowDown className="scroll-cue-arrow size-3" strokeWidth={2.5} />
          </span>
          <span className="text-xs leading-[1.3] font-extralight">
            {(getLocale() === "en" ? ["Scroll", "to", "Explore"] : ["Scroll", "Untuk", "Eksplorasi"]).map((word) => (
              <span key={word} className="block">
                {word}
              </span>
            ))}
          </span>
        </a>
      </div>
      <div className="pt-[60px] md:hidden">
        <Carousel label={pageLabels(getLocale()).featuredCampaigns} autoplayMs={5000} arrows="none" dots>
          {mobile.map((slide, i) => {
            const image = (
              <Image
                src={mediaUrl(slide.image)}
                alt={slide.title || `Kampanye Relawan Nusantara ${i + 1}`}
                fill
                preload={i === 0}
                fetchPriority={i === 0 ? "high" : "auto"}
                sizes="(min-width: 768px) 1px, 100vw"
                className="object-cover"
              />
            );
            // Slide mobile lama tanpa tautan; bila diisi di admin, seluruh slide menjadi tautan.
            return slide.href ? (
              <a key={slide.id} href={slide.href} className="relative block aspect-[1080/1350] w-full">
                {image}
              </a>
            ) : (
              <div key={slide.id} className="relative aspect-[1080/1350] w-full">
                {image}
              </div>
            );
          })}
        </Carousel>
      </div>
    </section>
  );
}
