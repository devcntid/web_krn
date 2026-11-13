import Image from "next/image";

import { heroSlidesDesktop, heroSlidesMobile } from "@/content/home";
import { Carousel } from "@/components/ui/Carousel";
import { mediaUrl } from "@/lib/media";

/** Hero beranda: slider desktop (5:3, link kampanye) & slider mobile (potret) terpisah, seperti Smart Slider 3. */
export function HeroSlider() {
  return (
    <section aria-label="Kampanye pilihan">
      <div className="hidden md:block">
        <Carousel label="Kampanye pilihan" autoplayMs={5000} arrows="side">
          {heroSlidesDesktop.map((slide, i) => (
            <a key={slide.href} href={slide.href} className="relative block aspect-[1193/620] w-full">
              <Image
                src={mediaUrl(slide.image)}
                alt={slide.title}
                fill
                priority={i === 0}
                sizes="100vw"
                className="object-cover"
              />
            </a>
          ))}
        </Carousel>
      </div>
      <div className="pt-[60px] md:hidden">
        <Carousel label="Kampanye pilihan" autoplayMs={5000} arrows="none" dots>
          {heroSlidesMobile.map((src, i) => (
            <div key={src} className="relative aspect-[1080/1350] w-full">
              <Image
                src={mediaUrl(src)}
                alt={`Kampanye Relawan Nusantara ${i + 1}`}
                fill
                priority={i === 0}
                sizes="100vw"
                className="object-cover"
              />
            </div>
          ))}
        </Carousel>
      </div>
    </section>
  );
}
