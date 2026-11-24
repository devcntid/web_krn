import Image from "next/image";

import { mediaUrl } from "@/lib/media";
import { hasMarkup } from "@/lib/rich-text";
import { Carousel } from "@/components/ui/Carousel";

export type Testimonial = { quote: string; name: string; role: string; photo: string };

/** Carousel testimoni (kotak kutipan abu + foto, nama, peran) dengan titik navigasi — dipakai beranda & Kemitraan. */
export function TestimonialCarousel({ items }: { items: Testimonial[] }) {
  return (
    <Carousel label="Testimoni" arrows="none" dots autoplayMs={7000} slideClassName="basis-full md:basis-1/3 pl-5" gapClassName="-ml-5">
      {items.map((t) => (
        <figure key={t.name} className="flex h-full flex-col text-left">
          <blockquote className="flex flex-1 items-center bg-surface-muted p-3 text-sm leading-[1.7] text-body-strong italic md:text-[15px] md:leading-[1.75]">
            <QuoteText quote={t.quote} />
          </blockquote>
          <figcaption className="mt-3.5 flex items-center gap-3.5 px-[10px] md:mt-[22px]">
            <Image src={mediaUrl(t.photo)} alt={t.name} width={60} height={60} className="size-[60px] shrink-0 rounded-full object-cover" />
            <span>
              <span className="block text-sm leading-[1.4] text-body">{t.name}</span>
              <span className="block text-sm leading-[1.4] font-bold text-primary-500">{t.role}</span>
            </span>
          </figcaption>
        </figure>
      ))}
    </Carousel>
  );
}

function QuoteText({ quote }: { quote: string }) {
  if (!hasMarkup(quote)) return <p>“{quote}”</p>;
  const inner = quote.match(/^<p>([\s\S]*)<\/p>$/i)?.[1];
  if (inner && !/<(?:p|ul|ol|div|h[1-6]|blockquote)\b/i.test(inner)) {
    return <p dangerouslySetInnerHTML={{ __html: `“${inner}”` }} />;
  }
  return <div className="not-italic [&_p]:m-0" dangerouslySetInnerHTML={{ __html: quote }} />;
}
