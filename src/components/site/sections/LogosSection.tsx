import Image from "next/image";

import { mediaUrl } from "@/lib/media";
import type { SectionData } from "@/server/sections";

type Logo = SectionData<"logos">["items"][number];

function PartnerLogo({ logo, hidden = false }: { logo: Logo; hidden?: boolean }) {
  return (
    <li aria-hidden={hidden || undefined} className="relative mx-3 h-[72px] w-[150px] shrink-0 rounded-[10px] bg-white md:mx-4">
      <Image src={mediaUrl(logo.image.src)} alt={hidden ? "" : logo.name} fill sizes="150px" className="object-contain p-2.5" />
    </li>
  );
}

/** Logo mitra berjalan (marquee); daftar digandakan agar putarannya mulus. */
export function LogosSection({ data }: { data: SectionData<"logos"> }) {
  return (
    <section className="bg-white py-12 md:py-[72px]">
      <div className="container-site text-center">
        <h2 className="text-[28px] leading-[1.15] font-bold md:text-[36px] lg:text-[45px]">{data.heading}</h2>
        <p className="mt-3 text-base text-ink">{data.description}</p>
      </div>
      <div className="marquee mt-8 overflow-hidden md:mt-10">
        <ul className="marquee-track gap-y-4" aria-label={data.label}>
          {data.items.map((logo) => (
            <PartnerLogo key={logo.image.src} logo={logo} />
          ))}
          {data.items.map((logo) => (
            <PartnerLogo key={`dup-${logo.image.src}`} logo={logo} hidden />
          ))}
        </ul>
      </div>
    </section>
  );
}
