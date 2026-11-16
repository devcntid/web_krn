/** Pilar Program — terjemahan bahasa Inggris. DRAF (16 Nov 2026): perlu ditinjau. */
import { pillars as id, sharedCta as idCta, type Pillar, type PillarSlug } from "../pillars";

export const sharedCta = {
  ...idCta,
  heading: "Let's Set Kindness in Motion",
  description: "Every contribution matters. Together with us, you can help bring real change to communities through action, care, and sustained support.",
  label: "Donate Now",
};

type Text = { title: string; tagline: string; description: string; programsHeading: string; programs: [string, string][]; cta?: { heading: string; description: string } };

const text: Record<PillarSlug, Text> = {
  "aksi-kemanusiaan": {
    title: "Humanitarian Action",
    tagline: "Overcoming Crisis, Restoring Lives",
    description:
      "The Humanitarian Action pillar is Relawan Nusantara's commitment to responding to disasters, conflicts, and humanitarian crises quickly, accurately, and in a coordinated way. Through pentahelix collaboration, this pillar focuses on saving lives, meeting basic needs, protecting vulnerable groups, and helping communities recover sustainably.",
    programsHeading: "Featured Programs",
    programs: [
      ["SIGAP", "Education for schoolchildren to build preparedness, mitigation skills, and awareness in facing and reducing disaster risk."],
      ["Disaster Response", "Rapid assistance through the deployment of volunteers, logistics, and psychosocial support to meet the basic needs of disaster-affected communities."],
      ["Health Assistance", "Health services including free check-ups, healthy-living education, distribution of vitamins or medical equipment, and public health campaigns."],
      ["Global Humanitarian Action", "Delivering aid to communities affected by conflict and crisis around the world with trusted partners, in line with regulations, sharia principles, and Indonesia's national interest."],
    ],
    cta: { heading: "Be Part of Humanitarian Action", description: "Every contribution you make brings hope, protects the vulnerable, and helps affected communities get back on their feet." },
  },
  lingkungan: {
    title: "Environment",
    tagline: "Brave to Protect, Committed to Preserve",
    description:
      "Through collaboration with communities, volunteers, government, and the private sector, the Environmental Care pillar promotes an environment that is clean, green, and resilient to climate change.",
    programsHeading: "Programs",
    programs: [
      ["Planting the Future", "A sustainable greening program in coastal areas, planting trees together with communities and volunteers to restore ecosystems and create greener coasts."],
      ["Tree Planting", "Environmental rehabilitation through planting productive, conservation, and greening trees in forests, watersheds, coastal areas, schools, and green open spaces."],
      ["Clean Up", "A shared movement to keep the environment clean through clean-up actions in public spaces, rivers, beaches, and public facilities."],
    ],
  },
  pendidikan: {
    title: "Education",
    tagline: "Lighting Up Hope, Opening the Way to the Future",
    description:
      "The Education pillar focuses on improving access to and the quality of education for children and underprivileged communities by providing learning resources, repairing learning facilities, and developing capacity and skills, to help raise a generation that is bright, independent, and competitive.",
    programsHeading: "Programs",
    programs: [
      ["School Supplies Assistance", "This program helps children from low-income families obtain proper learning supplies so they can study at their best without being held back by financial constraints."],
      ["School Renovation", "The School Renovation program repairs educational facilities to create a learning environment that is safe, comfortable, and supportive of the learning process."],
      ["Books for Remote Areas", "The Books for Remote Areas program improves access to quality reading for children in frontier, outermost, and disadvantaged regions through book distribution and reading corners, nurturing a culture of literacy from an early age."],
      ["Shoes for the Children of the Archipelago", "The Sepatu Anak Nusantara (SAN) program provides proper shoes for underprivileged children in frontier, outermost, and disadvantaged regions so they can learn comfortably, safely, and with confidence."],
    ],
  },
  ekonomi: {
    title: "Economic Empowerment",
    tagline: "Building Self-Reliance, Achieving Prosperity",
    description:
      "This pillar aims to help communities grow more independent and empowered through sustainable economic strengthening. The program opens access to business opportunities, improves skills, and supports people in developing their potential with sound planning and continuous mentoring.",
    programsHeading: "Programs",
    programs: [
      ["Small Businesses Moving Up", "UMKM Naik Kelas empowers small business owners to improve product quality, expand their markets, and grow their businesses independently and sustainably."],
      ["Empowered Without Limits", "This program supports the economic independence of people with disabilities by developing their skills and potential so they can create, run businesses, and earn their own income."],
      ["Digital Small Businesses", "This program supports business growth through capital, Smart-Gerobak carts, QRIS payments, and digital bookkeeping apps so small business owners can manage their businesses more professionally."],
      ["Buy Out and Share", "Borong Berbagi supports community businesses by buying their products to share with those in need, driving the local economy while spreading benefit."],
    ],
  },
};

const translate = (slug: PillarSlug): Pillar => {
  const p = id[slug];
  const t = text[slug];
  return {
    ...p,
    title: t.title,
    tagline: t.tagline,
    description: t.description,
    programsHeading: t.programsHeading,
    programs: p.programs.map((program, i) => ({ ...program, title: t.programs[i]?.[0] ?? program.title, description: t.programs[i]?.[1] ?? program.description })),
    cta: { ...p.cta, ...(t.cta ?? { heading: sharedCta.heading, description: sharedCta.description }), label: sharedCta.label },
  };
};

export const pillars: Record<PillarSlug, Pillar> = {
  "aksi-kemanusiaan": translate("aksi-kemanusiaan"),
  lingkungan: translate("lingkungan"),
  pendidikan: translate("pendidikan"),
  ekonomi: translate("ekonomi"),
};

export const labels = { eyebrow: "Program Pillar" };
