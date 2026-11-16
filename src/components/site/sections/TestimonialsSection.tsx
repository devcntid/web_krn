import { TestimonialCarousel } from "@/components/sections/TestimonialCarousel";
import { homeContent } from "@/content/localized";
import type { SectionData } from "@/server/sections";

import type { SectionContext } from "./types";

/** Judul + carousel testimoni. Tanpa butir sendiri, memakai daftar testimoni beranda. */
export function TestimonialsSection({ data, ctx }: { data: SectionData<"testimonials">; ctx: SectionContext }) {
  const items = data.items.length
    ? data.items.map((t) => ({ quote: t.quote, name: t.name, role: t.role, photo: t.photo.src }))
    : homeContent(ctx.locale).testimonials.items;
  return (
    <section className="pb-12 md:pb-20">
      <div className="container-site text-center">
        <h2 className="text-[30px] leading-[1.15] font-bold md:text-[40px] lg:text-[45px]">{data.heading}</h2>
        <p className="mx-auto mt-2 max-w-[860px] text-base leading-[1.5] text-ink">{data.description}</p>
      </div>
      <div className="container-site mt-7">
        <TestimonialCarousel items={items} />
      </div>
    </section>
  );
}
