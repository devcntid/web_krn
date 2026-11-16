"use client";

import { Children, useCallback, useEffect, useState } from "react";
import useEmblaCarousel from "embla-carousel-react";
import Autoplay from "embla-carousel-autoplay";
import { ChevronLeft, ChevronRight } from "lucide-react";

type CarouselProps = {
  children: React.ReactNode;
  label: string;
  /** Kelas lebar slide, mis. "basis-full md:basis-1/3". */
  slideClassName?: string;
  gapClassName?: string;
  loop?: boolean;
  autoplayMs?: number;
  arrows?: "none" | "side" | "side-round" | "bottom-right";
  dots?: boolean;
  /** Kelas tambahan tombol panah, mis. "max-md:hidden" atau "[--arrow-top:80px]". */
  arrowsClassName?: string;
  /** Kelas tambahan baris titik, mis. "md:hidden". */
  dotsClassName?: string;
  align?: "start" | "center";
};

/**
 * Carousel ringan (Embla) pengganti Smart Slider 3 / Wow Carousel / Real Testimonials.
 * Aksesibel: region berlabel, tombol berlabel, autoplay berhenti saat interaksi
 * dan dimatikan bila pengguna memilih reduced motion.
 */
export function Carousel({
  children,
  label,
  slideClassName = "basis-full",
  gapClassName = "",
  loop = true,
  autoplayMs,
  arrows = "side",
  dots = false,
  arrowsClassName = "",
  dotsClassName = "",
  align = "start",
}: CarouselProps) {
  const [plugins] = useState(() => {
    const reduce = typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    return autoplayMs && !reduce ? [Autoplay({ delay: autoplayMs, stopOnInteraction: false, stopOnMouseEnter: true })] : [];
  });
  const [emblaRef, embla] = useEmblaCarousel({ loop, align }, plugins);
  const [selected, setSelected] = useState(0);
  const [snaps, setSnaps] = useState<number[]>([]);

  const onSelect = useCallback(() => {
    if (!embla) return;
    setSelected(embla.selectedScrollSnap());
    setSnaps(embla.scrollSnapList());
  }, [embla]);

  useEffect(() => {
    if (!embla) return;
    embla.on("select", onSelect).on("reInit", onSelect);
    return () => {
      embla.off("select", onSelect).off("reInit", onSelect);
    };
  }, [embla, onSelect]);

  const items = Children.toArray(children);

  const arrowBase = "flex items-center justify-center transition-opacity hover:opacity-80";
  const arrowStyle = {
    side: `${arrowBase} absolute top-1/2 z-10 size-10 -translate-y-1/2 text-white/80 drop-shadow`,
    "side-round": `${arrowBase} absolute top-[var(--arrow-top,50%)] z-10 size-[52px] -translate-y-1/2 rounded-full bg-white text-ink shadow-card`,
    "bottom-right": `${arrowBase} size-10 rounded-[6px] bg-primary text-white`,
    none: "",
  }[arrows];

  return (
    <div className="relative" role="region" aria-roledescription="carousel" aria-label={label}>
      <div className="overflow-hidden" ref={emblaRef}>
        <div className={`flex touch-pan-y ${gapClassName}`}>
          {items.map((child, i) => (
            <div
              key={i}
              className={`min-w-0 shrink-0 grow-0 ${slideClassName}`}
              role="group"
              aria-roledescription="slide"
              aria-label={`${i + 1} dari ${items.length}`}
            >
              {child}
            </div>
          ))}
        </div>
      </div>

      {arrows === "side" || arrows === "side-round" ? (
        <>
          <button type="button" aria-label="Sebelumnya" onClick={() => embla?.scrollPrev()} className={`${arrowStyle} ${arrowsClassName} ${arrows === "side-round" ? "left-0 lg:-left-[60px]" : "left-2"}`}>
            <ChevronLeft className="size-7" />
          </button>
          <button type="button" aria-label="Berikutnya" onClick={() => embla?.scrollNext()} className={`${arrowStyle} ${arrowsClassName} ${arrows === "side-round" ? "right-0 lg:-right-[60px]" : "right-2"}`}>
            <ChevronRight className="size-7" />
          </button>
        </>
      ) : null}

      {arrows === "bottom-right" && (
        <div className="mt-5 flex justify-end gap-3">
          <button type="button" aria-label="Sebelumnya" onClick={() => embla?.scrollPrev()} className={arrowStyle}>
            <ChevronLeft className="size-5" />
          </button>
          <button type="button" aria-label="Berikutnya" onClick={() => embla?.scrollNext()} className={arrowStyle}>
            <ChevronRight className="size-5" />
          </button>
        </div>
      )}

      {dots && snaps.length > 1 && (
        <div className={`mt-6 flex justify-center gap-2 ${dotsClassName}`}>
          {snaps.map((_, i) => (
            <button
              key={i}
              type="button"
              aria-label={`Ke slide ${i + 1}`}
              aria-current={i === selected ? "true" : undefined}
              onClick={() => embla?.scrollTo(i)}
              className={`size-3 rounded-full transition-colors ${i === selected ? "bg-primary-600" : "bg-[#cfcfcf]"}`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
