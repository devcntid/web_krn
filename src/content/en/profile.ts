/** Profil — terjemahan bahasa Inggris. DRAF (16 Nov 2026): perlu ditinjau. */
import * as id from "../profile";

export const profileHero = id.profileHero;
export const profileAbout = {
  ...id.profileAbout,
  heading: { lead: "What is", strong: "Relawan Nusantara?" },
  body: "Relawan Nusantara is a humanitarian organization that serves as a bridge of kindness in responding to humanitarian issues, especially for vulnerable groups and communities affected by disasters and emergencies.",
};
export const profileVision = {
  heading: "Vision",
  lines: ["A trustworthy and professional humanitarian organization built on", "public generosity, bringing kindness to all"],
};
export const profileMission = {
  heading: "Mission",
  items: [
    "Strengthen the organization's management with a spirit of agility and global impact.",
    "Develop partnerships, humanitarian networks, and public participation.",
    "Make the most of resources and flagship programs that benefit humanity.",
  ],
};
export const profileTransparency = {
  ...id.profileTransparency,
  heading: "Transparency & Legal Standing",
  description:
    "Relawan Nusantara has received an Unqualified Opinion on its 2021 – 2025 financial statements, in accordance with Indonesian Financial Accounting Standards",
  links: [
    { ...id.profileTransparency.links[0], title: "Financial Audits", description: "Relawan Nusantara is audited regularly by an independent public accounting firm.", cta: "View reports" },
    { ...id.profileTransparency.links[1], title: "Legal Standing", description: "Relawan Nusantara understands and complies with the laws of the Republic of Indonesia, and fulfils every licensing requirement.", cta: "View documents" },
    { ...id.profileTransparency.links[2], title: "e-Report", description: "Take a closer look at how each of these efforts came to life. We have gathered them into one report for you to explore.", cta: "Open e-Report" },
  ],
};
export const seo = { title: "About Relawan Nusantara", description: "What is Relawan Nusantara? Our profile, vision, and mission as a humanitarian organization." };
