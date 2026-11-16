/**
 * Beranda — terjemahan bahasa Inggris. DRAF (16 Nov 2026): perlu ditinjau tim
 * Relawan Nusantara. Struktur, gambar, dan tautan diwarisi dari ../home.ts.
 */
import * as id from "../home";

const slideTitles = ["72-Hour Disaster Response", "Forest and Land Fire Emergency Response", "Humanitarian Aid for Sudan", "Winter in Palestine"];
export const heroSlidesDesktop = id.heroSlidesDesktop.map((slide, i) => ({ ...slide, title: slideTitles[i] ?? slide.title }));
export const heroSlidesMobile = id.heroSlidesMobile;

export const intro = {
  ...id.intro,
  eyebrow: "It Began with Compassion,",
  heading: "And Grew into a Bridge of Kindness",
  paragraphs: [
    "In every humanitarian crisis, there are always hearts moved to care.",
    "What began as volunteers coming together with the same spirit and mission has become our commitment to serve through a more professional institution, turning that compassion into real action with a wider impact.",
  ],
};

export const featuredVideo = { ...id.featuredVideo, title: "Tears We Could Not Hold Back on Meeting the People of Palestine — Episode 1" };

const statLabels = ["Beneficiaries", "Volunteers Involved", "Partners in Kindness", "Regions Reached"];
export const impactMap = {
  ...id.impactMap,
  alt: "Map of Relawan Nusantara program locations: Palestine, Sudan, Malaysia, and Indonesia",
  heading: "Our Footprint of Kindness 2026",
  stats: id.impactMap.stats.map((s, i) => ({ ...s, label: statLabels[i] ?? s.label })),
};

const pillarText = [
  {
    title: "Humanitarian Action",
    description: "Humanitarian action is not only about delivering aid; it is about being present among communities and answering real needs.",
  },
  {
    title: "Economic Empowerment",
    description: "Self-reliance is born from open opportunity, when a person has room to grow, to create, and to change their own life.",
  },
  {
    title: "Education",
    description: "Lighting up hope in places that are too often overlooked, so that more dreams can find their future.",
  },
  {
    title: "Environment",
    description: "Every life depends on a healthy natural world, so protecting the earth today means protecting the future we will pass on.",
  },
];
export const pillars = {
  ...id.pillars,
  heading: ["From One Shared Intention,", "Many Acts of Kindness Are Born."],
  cta: { ...id.pillars.cta, label: "Get to Know Us" },
  items: id.pillars.items.map((item, i) => ({ ...item, ...pillarText[i] })),
};

export const publications = { ...id.publications, heading: "Publications", cta: { ...id.publications.cta, label: "Follow the Stories" } };

const testimonialText = [
  {
    quote:
      "Thank you to Relawan Nusantara and everyone who gave me the chance to be part of this humanitarian journey. May every act of kindness delivered bring benefit and blessings, and strengthen the hope of the people of Aceh Tamiang to rise and recover fully.",
    role: "Singer",
  },
  {
    quote:
      "Thank you for always being there and caring for ordinary people like us, especially for my child, Ida. May Relawan Nusantara keep growing and help more and more people in need, and may all its volunteers always be granted health, blessings, and ease in every good deed.",
    role: "Beneficiary, Food Program for People with Disabilities",
  },
  { quote: "I am so happy to get new shoes and school supplies, because my old ones were worn out.", role: "Student at MIS Menanga, East Nusa Tenggara" },
  {
    quote:
      "We in the upstream oil and gas industry appreciate Relawan Nusantara for our collaboration in distributing SKK Migas-KKKS aid to disaster survivors in Sumatra (December 2025–January 2026). The team was responsive and on target, reaching remote areas; professional in meeting compliance standards; communicative; and transparent in its reporting.",
    role: "Head of the Community Development Working Group, SKK Migas",
  },
];
export const testimonials = {
  ...id.testimonials,
  heading: "Spreading Impact Together",
  description: "Stories, experiences, and impressions from donors, partners, beneficiaries, and volunteers who have been part of the journey of bringing benefit to others",
  items: id.testimonials.items.map((item, i) => ({ ...item, ...testimonialText[i] })),
};

export const reportCta = {
  ...id.reportCta,
  heading: "Distribution Reports",
  description: "Take a closer look at how each of these efforts came to life. We have gathered them into one report for you to explore.",
  cta: { ...id.reportCta.cta, label: "Open e-Report" },
};

/** Judul & deskripsi SEO beranda versi Inggris. */
export const homeSeo = {
  title: "Relawan Nusantara - A Bridge of Kindness for Humanity",
  description:
    "Relawan Nusantara is a humanitarian organization that serves as a bridge of kindness through humanitarian action, education, economic empowerment, and environmental programs in Indonesia and around the world.",
};
