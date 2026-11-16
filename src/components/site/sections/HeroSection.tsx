import { PageHero } from "@/components/sections/PageHero";
import type { SectionData } from "@/server/sections";

import type { SectionContext } from "./types";

/** Hero halaman (gambar latar + judul H1). Judul kosong = judul halaman. */
export function HeroSection({ data, ctx }: { data: SectionData<"hero">; ctx: SectionContext }) {
  return (
    <PageHero
      title={data.title || ctx.title}
      eyebrow={data.eyebrow || undefined}
      subtitle={data.subtitle || undefined}
      image={data.image}
      size={data.size}
      width="container"
      overlay={data.overlay}
    />
  );
}
