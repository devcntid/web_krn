import { type Section, localizedData } from "@/server/sections";

import { AccordionDocs, AccordionText } from "./AccordionSections";
import { CardsDocs, CardsLinks, CardsPillars, CardsPrograms, CardsStats, CardsSteps } from "./CardSections";
import { CtaBanner, CtaCards, CtaContact } from "./CtaSections";
import { HeroSection } from "./HeroSection";
import { LogosSection } from "./LogosSection";
import { PostsSection } from "./PostsSection";
import { ReportsSection } from "./ReportsSection";
import { RichtextSection } from "./RichtextSection";
import { TestimonialsSection } from "./TestimonialsSection";
import { TextAlternating, TextEmbed, TextListImage, TextTagline, TextVision } from "./TextSections";
import type { SectionContext } from "./types";

/** Render satu section sesuai tipenya, dengan isi untuk bahasa halaman saat ini. */
export function SectionRenderer({ section, ctx }: { section: Section; ctx: SectionContext }) {
  switch (section.type) {
    case "hero":
      return <HeroSection data={localizedData(section, ctx.locale)} ctx={ctx} />;
    case "text-tagline":
      return <TextTagline data={localizedData(section, ctx.locale)} />;
    case "text-embed":
      return <TextEmbed data={localizedData(section, ctx.locale)} />;
    case "text-vision":
      return <TextVision data={localizedData(section, ctx.locale)} />;
    case "text-alternating":
      return <TextAlternating data={localizedData(section, ctx.locale)} />;
    case "text-list-image":
      return <TextListImage data={localizedData(section, ctx.locale)} />;
    case "cards-stats":
      return <CardsStats data={localizedData(section, ctx.locale)} />;
    case "cards-programs":
      return <CardsPrograms data={localizedData(section, ctx.locale)} />;
    case "cards-pillars":
      return <CardsPillars data={localizedData(section, ctx.locale)} />;
    case "cards-links":
      return <CardsLinks data={localizedData(section, ctx.locale)} />;
    case "cards-steps":
      return <CardsSteps data={localizedData(section, ctx.locale)} />;
    case "cards-docs":
      return <CardsDocs data={localizedData(section, ctx.locale)} />;
    case "posts":
      return <PostsSection data={localizedData(section, ctx.locale)} />;
    case "testimonials":
      return <TestimonialsSection data={localizedData(section, ctx.locale)} ctx={ctx} />;
    case "accordion-docs":
      return <AccordionDocs data={localizedData(section, ctx.locale)} ctx={ctx} />;
    case "accordion":
      return <AccordionText data={localizedData(section, ctx.locale)} ctx={ctx} />;
    case "logos":
      return <LogosSection data={localizedData(section, ctx.locale)} />;
    case "cta-banner":
      return <CtaBanner data={localizedData(section, ctx.locale)} />;
    case "cta-cards":
      return <CtaCards data={localizedData(section, ctx.locale)} />;
    case "cta-contact":
      return <CtaContact data={localizedData(section, ctx.locale)} />;
    case "reports":
      return <ReportsSection data={localizedData(section, ctx.locale)} ctx={ctx} />;
    case "richtext":
      return <RichtextSection data={localizedData(section, ctx.locale)} ctx={ctx} />;
  }
}
