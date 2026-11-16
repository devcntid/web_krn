/**
 * Konten /kemitraan/ ("Jaringan Kebaikan") — VERBATIM dari halaman WordPress
 * (content/pages/kemitraan.json). Jangan ditulis ulang.
 */

import type { MediaRef } from "@/types/content";

const U = "/wp-content/uploads";

export const partnershipHero = {
  /** Latar fullwidth header Divi halaman asli. */
  image: { src: `${U}/2026/08/Rectangle-7098-1.jpg`, width: 1440, height: 661, alt: "" } satisfies MediaRef,
};

export const partnershipSteps = {
  heading: "Aksi Nyata untuk Berkolaborasi",
  items: [
    {
      title: "Assessment",
      icon: `${U}/2026/10/ICON-SET-RN-Assessment-2.png`,
      description:
        "Tahap memahami kondisi masyarakat dengan mengidentifikasi kebutuhan, masalah, potensi, sumber daya, serta aktor sosial melalui observasi, wawancara, survei, dan FGD",
    },
    {
      title: "Planning",
      icon: `${U}/2026/10/ICON-SET-RN-Planning-2.png`,
      description:
        "Tahap menyusun tujuan, strategi, kegiatan, sumber daya, dan indikator keberhasilan berdasarkan hasil assessment dengan melibatkan masyarakat",
    },
    {
      title: "Implementation",
      icon: `${U}/2026/10/ICON-SET-RN-Implementation-2.png`,
      description:
        "Tahap menjalankan program di lapangan melalui koordinasi bersama tim, mitra, dan masyarakat, disertai monitoring serta dokumentasi",
    },
    {
      title: "Amplification",
      icon: `${U}/2026/10/ICON-SET-RN-Amplification-2.png`,
      description:
        "Tahap memperluas dampak program melalui penyebarluasan hasil, pengembangan praktik baik, replikasi, penguatan kapasitas lokal, dan keberlanjutan program",
    },
  ],
  /** Ikon asli 161×161. */
  iconSize: 161,
};

export const partnershipWhy = {
  heading: "Mengapa Berkolaborasi dengan Kami?",
  image: { src: `${U}/2026/10/Kemitraan.png`, width: 510, height: 670, alt: "" } satisfies MediaRef,
  items: [
    {
      title: "Dekat dengan Masyarakat dan Tepat Sasaran",
      description: "Memastikan program dan menjawab kebutuhan nyata masyarakat serta menjangkau penerima manfaat yang tepat",
    },
    {
      title: "Profesional dan Akuntabel",
      description: "Program dikelola secara terstruktur dengan proses pelaksanaan, dokumentasi dan pelaporan yang transparan",
    },
    {
      title: "Dampak Nyata dan Terukur",
      description: "Hasil yang mudah terpantau dan terevaluasi dalam setiap kolaborasi",
    },
  ],
};

/** Daftar testimoninya sama dengan beranda (src/content/home.ts → testimonials.items). */
export const partnershipTestimonials = {
  heading: "Bersama Menebar Dampak",
  description:
    "Cerita, pengalaman, dan kesan dari para donatur, mitra, penerima manfaat, serta relawan yang telah menjadi bagian dari perjalanan menghadirkan manfaat.",
};

export const partnershipStories = {
  heading: "Cerita Berdampak",
  /** Slug kategori WordPress untuk carousel. */
  category: "kemitraan",
  count: 6,
  /** Tab "Kemitraan" di halaman Berita. */
  href: "/berita/?kategori=kemitraan",
};

export const partnershipPartners = {
  heading: "Dari niat baik menjadi aksi nyata, ratusan gerakan telah tumbuh bersama kami",
  description: "Cerita tentang langkah-langkah kecil dari Nusantara yang menjadi kekuatan besar bagi kemanusiaan",
};

/**
 * Logo mitra, urutan sama dengan halaman asli. Di WordPress teks alt-nya keliru
 * (15 logo pertama semuanya "SKKMigas", sisanya kosong), jadi `name` di sini
 * diturunkan dari nama file logo — mohon dicek ulang.
 */
export const partnerLogos: { name: string; src: string }[] = [
  { name: "SKK Migas", src: `${U}/2026/08/1.-Logo_of_SKK_Migas.svg_.webp` },
  { name: "BenihBaik", src: `${U}/2026/09/2.-benih-baik-scaled.png` },
  { name: "PELNI", src: `${U}/2026/09/3.-pelni.png` },
  { name: "BYOND by BSI", src: `${U}/2026/08/4.-BYOND_by_BSI.svg_-scaled.webp` },
  { name: "LaunchGood", src: `${U}/2026/08/5.-launchgood-logo-png_seeklogo-613614.png` },
  { name: "Pelindo", src: `${U}/2026/08/6.-Pelindo.png` },
  { name: "Kitabisa", src: `${U}/2026/09/7.-kitabisa.png` },
  { name: "Jejak Amanah Peduli", src: `${U}/2026/09/8.-jejak-amanah-peduli-scaled.png` },
  { name: "EMP", src: `${U}/2026/09/9.-emp-SKK.png` },
  { name: "BSI Maslahat", src: `${U}/2026/08/10.-bsi-maslahat.webp` },
  { name: "IFG", src: `${U}/2026/08/11.-logo-IFG.png` },
  { name: "Muamalat DIN", src: `${U}/2026/09/12.-muamalat_din.png` },
  { name: "DT Peduli", src: `${U}/2026/08/13.-dt-peduli.png` },
  { name: "Torch", src: `${U}/2026/08/14.-TORCH-LOGO-01-scaled.png` },
  { name: "YBM PLN", src: `${U}/2026/08/15.-ybm-pln.png` },
  { name: "Wakaf Salman", src: `${U}/2026/09/16.-wakaf-salman.png` },
  { name: "LAZ Al Irsyad", src: `${U}/2026/08/17.-laz-al-irsyad-scaled.png` },
  { name: "BMM", src: `${U}/2026/08/18.-BMM.png` },
  { name: "Telkomsat", src: `${U}/2026/08/19.-LOGO_TELKOMSAT_DISCOVER_NEW_HORIZONS.png` },
  { name: "Bazma", src: `${U}/2026/09/20.-bazma.png` },
  { name: "Scooterist Bogor", src: `${U}/2026/08/21.-Logo-Scooterist-Bogor-scaled.png` },
  { name: "Darul Hikam", src: `${U}/2026/09/22.-darul-hikam.png` },
  { name: "LAZNAS AQL", src: `${U}/2026/08/23.-laznas-aql-scaled.png` },
  { name: "Penebar Kebajikan", src: `${U}/2026/08/24.-penebar-kebajikan.png` },
  { name: "Teras Dakwah", src: `${U}/2026/09/25.-teras-dkawah.png` },
  { name: "Bank Syariah Indonesia", src: `${U}/2026/08/26.-Bank_Syariah_Indonesia.svg_.webp` },
  { name: "Bank Muamalat", src: `${U}/2026/08/27.-bank-muamalat.png` },
  { name: "OCBC", src: `${U}/2026/08/28.-Logo-ocbc.svg_.webp` },
  { name: "OCBC NISP Syariah", src: `${U}/2026/08/29.-OCBC-NISP-Syariah-1.png` },
];

export const partnershipCta = {
  heading: "Mari Berkolaborasi",
  description: "Karena perubahan tidak terjadi hanya karena kita peduli, namun ketika kita memilih untuk bergerak.",
  /** Label tombol dari artboard "08 · Kemitraan"; tujuannya email kemitraan di halaman asli. */
  buttonLabel: "Hubungi Tim Kemitraan",
  phone: { label: "TELEPON", display: "+62 853-5333-7438", href: "tel:+6285353337438" },
  email: { label: "EMAIL", display: "partnership@relawannusantara.org", href: "mailto:partnership@relawannusantara.org" },
  /** Peta Google yang disematkan di halaman asli. */
  map: {
    title: "Lokasi kantor Relawan Nusantara di Google Maps",
    src: "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d4316.253900579558!2d107.68644867540252!3d-6.958045368124426!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x2e68e93ffb150d0d%3A0xbd4a94a81bc22dfa!2sRelawan%20Nusantara!5e1!3m2!1sen!2sid!4v1787017853570!5m2!1sen!2sid",
  },
};
