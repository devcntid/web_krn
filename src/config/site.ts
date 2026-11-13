/**
 * Konfigurasi global situs — sumber tunggal untuk identitas brand,
 * navigasi, kontak, dan tautan sosial. Nilai disalin dari WordPress existing
 * (audit 13 Nov 2026).
 */

export const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ?? "https://relawannusantara.org";

export const site = {
  name: "Relawan Nusantara",
  tagline: "Berawal dari Kepedulian, Bergerak Menjadi Jembatan Kebaikan",
  description:
    "Relawan Nusantara adalah lembaga kemanusiaan yang berperan sebagai jembatan kebaikan dalam merespons berbagai isu kemanusiaan, khususnya bagi kelompok rentan.",
  locale: "id_ID",
  logo: {
    src: "/wp-content/uploads/2026/05/logo-rn.png",
    width: 150,
    height: 34,
  },
  donateUrl: "/campaign",
} as const;

export type NavItem = {
  label: string;
  href?: string;
  children?: { label: string; href: string }[];
};

export const mainNav: NavItem[] = [
  { label: "Beranda", href: "/" },
  {
    label: "Tentang Kami",
    children: [
      { label: "Profil Relawan Nusantara", href: "/profil-relawan-nusantara/" },
      { label: "Audit Keuangan", href: "/audit-keuangan/" },
      { label: "Legalitas", href: "/asas-legalitas/" },
    ],
  },
  {
    label: "Program Kami",
    children: [
      { label: "Aksi Kemanusiaan", href: "/aksi-kemanusiaan/" },
      { label: "Lingkungan", href: "/lingkungan/" },
      { label: "Pendidikan", href: "/pendidikan/" },
      { label: "Ekonomi", href: "/ekonomi/" },
    ],
  },
  {
    label: "Publikasi",
    children: [
      { label: "Artikel", href: "/artikel/" },
      { label: "Berita", href: "/berita/" },
      { label: "e-Report", href: "/e-report/" },
    ],
  },
  { label: "Kemitraan", href: "/kemitraan/" },
];

export const footerNav = [
  { label: "Beranda", href: "/" },
  { label: "Tentang Kami", href: "/profil-relawan-nusantara/" },
  { label: "Program", href: "/pr0gram-kami/" },
  { label: "Kemitraan", href: "/kemitraan/" },
  {
    label: "Whistleblower",
    href: "https://docs.google.com/forms/d/e/1FAIpQLSe5B82vKQGgwkpqWGVr_z0JosWNKFp12FRTU4aunIUADiNGYg/viewform",
    external: true,
  },
] as const;

export const contact = {
  phoneDisplay: "+62 853-5341-5664 (WA Only)",
  whatsapp: "6285353415664",
  email: "admin@relawannusantara.org",
  address:
    "Ruko Magna Commercial Blok MB 50-52, Summarecon, Bandung, Kota Bandung, Jawa Barat 40295",
} as const;

export const whatsappUrl = `https://api.whatsapp.com/send?phone=${contact.whatsapp}`;

export const socials = [
  { name: "Instagram", href: "https://www.instagram.com/relawan.nusantara/" },
  { name: "Facebook", href: "https://www.facebook.com/Nusantara.Relawan" },
  { name: "YouTube", href: "https://www.youtube.com/channel/UCEASRLqRaXarpVI91pmHupA" },
  { name: "Threads", href: "https://www.threads.com/@relawan.nusantara" },
  { name: "LinkedIn", href: "https://id.linkedin.com/company/relawan-nusantara" },
  { name: "TikTok", href: "https://www.tiktok.com/@relawan.nusantara" },
] as const;

export const floatingContact = {
  label: "Tanya Saffa",
  image: "/wp-content/uploads/2026/09/Saffa.png",
  href: whatsappUrl,
} as const;
