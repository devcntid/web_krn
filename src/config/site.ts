/**
 * Konfigurasi global situs.
 *
 * Sejak B14, identitas, kontak, tautan sosial, menu utama, integrasi, dan tombol melayang
 * dikelola di /admin/pengaturan (tabel `settings`, dibaca lewat getSiteSettings() di
 * src/server/site-settings.ts). Nilai di bawah hanya FALLBACK — dipakai bila baris settings
 * belum ada atau rusak. Nilai disalin dari WordPress existing (audit 13 Nov 2026).
 * Komponen publik tidak boleh membaca `siteDefaults` langsung.
 */

import { DEFAULT_DOCUMENT_TITLE, type SiteSettings } from "@/lib/site-settings-schema";

export const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ?? "https://relawannusantara.org";

/** Metadata statis yang tidak dikelola admin. Nama situs di sini = fallback untuk metadata SEO. */
export const site = {
  name: "Relawan Nusantara",
  description:
    "Relawan Nusantara adalah lembaga kemanusiaan yang berperan sebagai jembatan kebaikan dalam merespons berbagai isu kemanusiaan, khususnya bagi kelompok rentan.",
  locale: "id_ID",
} as const;

/** Foto "Tanya Saffa" (tidak dikelola admin). */
export const SAFFA_IMAGE = "/wp-content/uploads/2026/09/Saffa.png";

export const siteDefaults: SiteSettings = {
  identity: {
    name: site.name,
    documentTitle: DEFAULT_DOCUMENT_TITLE,
    tagline: "Berawal dari Kepedulian, Bergerak Menjadi Jembatan Kebaikan",
    logo: { src: "/wp-content/uploads/2026/05/logo-rn.png", width: 150, height: 34 },
    favicon: "",
  },
  contact: {
    whatsapp: "6285353415664",
    phoneDisplay: "+62 853-5341-5664 (WA Only)",
    email: "admin@relawannusantara.org",
    address: "Ruko Magna Commercial Blok MB 50-52, Summarecon, Bandung, Kota Bandung, Jawa Barat 40295",
  },
  socials: [
    { platform: "Instagram", href: "https://www.instagram.com/relawan.nusantara/" },
    { platform: "Facebook", href: "https://www.facebook.com/Nusantara.Relawan" },
    { platform: "YouTube", href: "https://www.youtube.com/channel/UCEASRLqRaXarpVI91pmHupA" },
    { platform: "Threads", href: "https://www.threads.com/@relawan.nusantara" },
    { platform: "LinkedIn", href: "https://id.linkedin.com/company/relawan-nusantara" },
    { platform: "TikTok", href: "https://www.tiktok.com/@relawan.nusantara" },
  ],
  menu: [
    { label: "Beranda", labelEn: "", href: "/", children: [] },
    {
      label: "Tentang Kami",
      labelEn: "",
      href: "",
      children: [
        { label: "Profil Relawan Nusantara", labelEn: "", href: "/profil-relawan-nusantara/" },
        { label: "Audit Keuangan", labelEn: "", href: "/audit-keuangan/" },
        { label: "Legalitas", labelEn: "", href: "/asas-legalitas/" },
      ],
    },
    {
      label: "Program Kami",
      labelEn: "",
      href: "",
      children: [
        { label: "Aksi Kemanusiaan", labelEn: "", href: "/aksi-kemanusiaan/" },
        { label: "Lingkungan", labelEn: "", href: "/lingkungan/" },
        { label: "Pendidikan", labelEn: "", href: "/pendidikan/" },
        { label: "Ekonomi", labelEn: "", href: "/ekonomi/" },
      ],
    },
    {
      label: "Publikasi",
      labelEn: "",
      href: "",
      children: [
        { label: "Artikel", labelEn: "", href: "/artikel/" },
        { label: "Berita", labelEn: "", href: "/berita/" },
        { label: "e-Report", labelEn: "", href: "/e-report/" },
      ],
    },
    { label: "Kemitraan", labelEn: "", href: "/kemitraan/", children: [] },
  ],
  integrations: {
    ga4Id: process.env.NEXT_PUBLIC_GA_ID ?? "",
    metaPixelId: process.env.NEXT_PUBLIC_META_PIXEL_ID ?? "",
    donateUrl: "/campaign",
    showSaffa: true,
    maintenance: false,
  },
  reading: { frontPage: "new-beranda" },
  codes: { snippets: [] },
};

/** Menu footer "Eksplor" (belum dikelola admin). */
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
