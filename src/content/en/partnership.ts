/** Kemitraan — terjemahan bahasa Inggris. DRAF (16 Nov 2026): perlu ditinjau. */
import * as id from "../partnership";

export const partnershipHero = id.partnershipHero;
const stepText = [
  "The stage of understanding community conditions by identifying needs, problems, potential, resources, and social actors through observation, interviews, surveys, and focus group discussions.",
  "The stage of setting goals, strategies, activities, resources, and success indicators based on the assessment results, with community involvement.",
  "The stage of running the program in the field through coordination with the team, partners, and the community, accompanied by monitoring and documentation.",
  "The stage of widening the program's impact by sharing results, developing good practices, replication, strengthening local capacity, and ensuring sustainability.",
];
export const partnershipSteps = {
  ...id.partnershipSteps,
  heading: "Real Action for Collaboration",
  items: id.partnershipSteps.items.map((item, i) => ({ ...item, description: stepText[i] ?? item.description })),
};
export const partnershipWhy = {
  ...id.partnershipWhy,
  heading: "Why Collaborate with Us?",
  items: [
    { title: "Close to Communities and Well-Targeted", description: "Ensuring programs answer the real needs of communities and reach the right beneficiaries." },
    { title: "Professional and Accountable", description: "Programs are managed in a structured way, with transparent implementation, documentation, and reporting." },
    { title: "Real and Measurable Impact", description: "Results that are easy to monitor and evaluate in every collaboration." },
  ],
};
export const partnershipTestimonials = {
  heading: "Spreading Impact Together",
  description: "Stories, experiences, and impressions from donors, partners, beneficiaries, and volunteers who have been part of the journey of bringing benefit to others.",
};
export const partnershipStories = { ...id.partnershipStories, heading: "Stories of Impact" };
export const partnershipPartners = {
  heading: "From good intentions to real action, hundreds of movements have grown with us",
  description: "Stories of small steps from across Indonesia that become a great force for humanity",
};
export const partnerLogos = id.partnerLogos;
export const partnershipCta = {
  ...id.partnershipCta,
  heading: "Let's Collaborate",
  description: "Because change does not happen simply because we care, but when we choose to act.",
  buttonLabel: "Contact the Partnership Team",
  phone: { ...id.partnershipCta.phone, label: "PHONE" },
  email: { ...id.partnershipCta.email, label: "EMAIL" },
  map: { ...id.partnershipCta.map, title: "Relawan Nusantara office location on Google Maps" },
};
export const labels = { title: "Network of Kindness", partnersAria: "Relawan Nusantara partners", storiesAria: "Partnership stories of impact" };
export const seo = { title: "Network of Kindness", description: "Partner with Relawan Nusantara: assessment, planning, implementation, and amplification for real and measurable impact." };
