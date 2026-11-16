/** Program Kami + halaman anak — terjemahan bahasa Inggris. DRAF (16 Nov 2026): perlu ditinjau. */
import type { Pillar } from "../pillars";
import { programKami as id, subPrograms as idSub } from "../programs";
import { pillars, sharedCta } from "./pillars";

const approachText = [
  { title: "Gather and Deliver Aid Swiftly", paragraphs: ["Relawan Nusantara invites the public to take part through donations and real support.", "The funds entrusted to us are then delivered to those in need, whether as emergency aid or through other beneficial programs."] },
  { title: "Rapid Response for Humanity", paragraphs: ["Reaching, responding to, and handling urgent needs.", "We are present in many situations to provide help that is fast, well-directed, and suited to the conditions communities face."] },
  { title: "Collaboration That Strengthens Communities", paragraphs: ["We build sustainable programs that help communities become stronger, more independent, and more empowered.", "Through focused collaboration, every initiative is designed to create real impact and positive change in people's lives."] },
];

const pillarDescriptions = [
  "The Humanitarian Action pillar is Relawan Nusantara's commitment to providing a fast, accurate, and coordinated response to disasters, conflicts, and humanitarian crises in Indonesia and around the world. Through pentahelix collaboration, this pillar focuses on supporting life-saving aid, meeting basic needs, protecting vulnerable groups, and sustainably restoring the lives of affected communities.",
  "Environmental Care is Relawan Nusantara's commitment to preserving nature and raising public awareness of the importance of a healthy and sustainable environment. Through ecosystem rehabilitation, greening, waste management, conservation of natural resources, and environmental education, this pillar aims to create an environment that is greener, resilient to climate change, and beneficial for future generations.",
  pillars.pendidikan.description,
  pillars.ekonomi.description,
];
const pillarTitles = ["Humanitarian Action", "Environment", "Education", "Economic Empowerment"];

export const programKami = {
  ...id,
  approach: {
    heading: "Volunteers Moving Fast, for the Archipelago",
    items: id.approach.items.map((item, i) => ({ ...item, ...approachText[i] })),
  },
  pillars: {
    ...id.pillars,
    heading: ["Caring for Others", "Moving Together Across the Archipelago"],
    linkLabel: "Read More",
    items: id.pillars.items.map((item, i) => ({ ...item, title: pillarTitles[i] ?? item.title, description: pillarDescriptions[i] ?? item.description })),
  },
  cta: {
    ...id.cta,
    heading: sharedCta.heading,
    description: sharedCta.description,
    cards: id.cta.cards.map((card, i) => ({ ...card, label: ["Become a Partner in Kindness", "Donate Now"][i] ?? card.label })),
  },
};

/** Sama seperti versi Indonesia, dua halaman ini masih berisi teks templat Aksi Kemanusiaan. */
const FILLER = "Every contribution you make brings hope, protects the vulnerable, and helps affected communities get back on their feet.";
const aksi = pillars["aksi-kemanusiaan"];
const statTitles = ["72 Volunteers", "10++ Cities", "8,234 Lives Impacted", "3 Flagship Programs"];

const translateSub = (p: Pillar, title: string): Pillar => ({
  ...p,
  title,
  eyebrow: "Our Programs",
  parent: p.parent ? { ...p.parent, name: "Our Programs" } : undefined,
  tagline: aksi.tagline,
  description: aksi.description,
  stats: statTitles.map((t) => ({ title: t, description: FILLER })),
  programsHeading: aksi.programsHeading,
  programs: aksi.programs.map((program) => (program.title === "SIGAP" ? { ...program, title: "SIGAP (A Generation Prepared, Safe, and Disaster-Aware)" } : program)),
  cta: { ...p.cta, heading: aksi.cta.heading, description: aksi.cta.description, label: aksi.cta.label },
});

export const subPrograms: Record<"kerelawanan" | "kebencanaan", Pillar> = {
  kerelawanan: translateSub(idSub.kerelawanan, "Volunteering"),
  kebencanaan: translateSub(idSub.kebencanaan, "Disaster Management"),
};

export const seo = { title: "Our Programs", description: "Relawan Nusantara invites the public to take part through donations and real support." };
