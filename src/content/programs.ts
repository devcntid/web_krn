/**
 * Konten /pr0gram-kami/ dan dua halaman anaknya — VERBATIM dari halaman WordPress
 * (content/pages/pr0gram-kami.json, pr0gram-kami__kerelawanan.json, pr0gram-kami__kebencanaan.json).
 * Slug "pr0gram-kami" (dengan angka nol) dipertahankan.
 */

import type { MediaRef } from "@/types/content";
import { img, pillars, sharedCta, type Pillar } from "@/content/pillars";

/* ---------- /pr0gram-kami/ ---------- */

export const programKami = {
  path: "pr0gram-kami",
  /** Latar fullwidth header Divi halaman asli. */
  hero: img("2026/08/Program-Kami.jpeg", 1600, 1063),

  approach: {
    heading: "Gerak Cepat Relawan, Bagi Nusantara",
    /** Tiga baris gambar + teks berselang-seling, urutan sama dengan halaman asli. */
    items: [
      {
        title: "Himpun dan Salurkan Bantuan Segera",
        paragraphs: [
          "Relawan Nusantara mengajak masyarakat untuk ikut ambil bagian melalui donasi dan dukungan nyata.",
          "Amanah yang terkumpul kemudian disalurkan kepada mereka yang membutuhkan, baik dalam bentuk bantuan darurat maupun program kebermanfaatan lain.",
        ],
        image: img("2026/08/Himpun-dan-Salurkan-Bantuan-Segera.jpeg", 1600, 898),
      },
      {
        title: "Respons Cepat Untuk Kemanusiaan",
        paragraphs: [
          "Menjangkau, merespons, dan menangani kebutuhan mendesak.",
          "Kami hadir di berbagai situasi untuk memberikan bantuan yang cepat, terarah, dan sesuai dengan kondisi yang dihadapi masyarakat.",
        ],
        image: img("2026/08/Respons-Cepat-Untuk-Kemanusiaan-scaled.jpg", 1920, 2560),
      },
      {
        title: "Kolaborasi Menguatkan Masyarakat",
        paragraphs: [
          "Kita membangun program berkelanjutan yang mendorong masyarakat menjadi lebih kuat, mandiri, dan berdaya.",
          "Melalui kolaborasi yang terarah, setiap inisiatif dihadirkan untuk menciptakan dampak nyata dan perubahan positif bagi kehidupan masyarakat.",
        ],
        image: img("2026/08/Kolaborasi-Menguatkan-Masyarakat.jpeg", 1600, 898),
      },
    ] satisfies { title: string; paragraphs: string[]; image: MediaRef }[],
  },

  pillars: {
    /** Dua baris seperti aslinya (dipisah <br>). */
    heading: ["Peduli untuk Sesama", "Bergerak serempak Nusantara"],
    /** Label tautan di halaman asli ("Read More …"). */
    linkLabel: "Read More",
    /**
     * Deskripsi di halaman ini BERBEDA dari deskripsi di halaman pilar masing-masing
     * (kecuali Pendidikan & Ekonomi). Tautan asli /pr0gram-kami/<pilar> dialihkan (301)
     * ke /<pilar>/, jadi di sini langsung ke tujuan akhirnya.
     */
    items: [
      {
        title: "Aksi Kemanusiaan",
        href: "/aksi-kemanusiaan/",
        image: img("2026/06/Clean-Water.jpg", 662, 320),
        description:
          "Pilar Aksi Kemanusiaan merupakan komitmen Relawan Nusantara dalam memberikan respons cepat, tepat, dan terkoordinasi terhadap berbagai bencana, konflik, serta krisis kemanusiaan di Indonesia maupun dunia. Melalui kolaborasi pentahelix pilar ini berfokus pada support bantuan penyelamatan jiwa, pemenuhan kebutuhan dasar, perlindungan kelompok rentan, serta pemulihan kehidupan masyarakat terdampak secara berkelanjutan.",
      },
      {
        title: "Lingkungan",
        href: "/lingkungan/",
        image: img("2026/06/Eco-Hope-1.jpg", 661, 315),
        description:
          "Peduli Lingkungan merupakan komitmen Relawan Nusantara dalam menjaga kelestarian alam dan meningkatkan kesadaran masyarakat terhadap pentingnya lingkungan yang sehat dan berkelanjutan. Melalui kegiatan rehabilitasi ekosistem, penghijauan, pengelolaan sampah, konservasi sumber daya alam, serta edukasi lingkungan, pilar ini bertujuan menciptakan lingkungan yang lebih hijau, tangguh terhadap perubahan iklim, dan memberikan manfaat bagi generasi mendatang.",
      },
      {
        title: "Pendidikan",
        href: "/pendidikan/",
        image: img("2026/06/Health-For-All.jpg", 663, 322),
        description: pillars.pendidikan.description,
      },
      {
        title: "Ekonomi",
        href: "/ekonomi/",
        image: img("2026/06/Eco-Hope.jpg", 662, 315),
        description: pillars.ekonomi.description,
      },
    ],
  },

  /** Halaman asli menampilkan 6 publikasi terbaru. */
  stories: { count: 6, href: "/berita/" },

  cta: {
    heading: sharedCta.heading,
    description: sharedCta.description,
    /**
     * Di halaman asli kedua tombol ber-href kosong (tautan mati). Tujuan di bawah
     * dipilih agar tombol berfungsi: halaman Kemitraan dan aplikasi donasi.
     */
    cards: [
      { label: "Jadi Mitra Kebaikan", href: "/kemitraan/", external: false, image: img("2026/08/Jadi-Mitra-Kebaikan-scaled.jpg", 2560, 1437) },
      { label: "Donasi Sekarang", href: "/donasi/programs", external: true, image: img("2026/08/Donasi-Sekarang-scaled.png", 1810, 2560) },
    ],
  },
};

/* ---------- /pr0gram-kami/kerelawanan/ & /pr0gram-kami/kebencanaan/ ---------- */

/**
 * Di WordPress kedua halaman ini adalah salinan templat Aksi Kemanusiaan: tagline,
 * deskripsi, program, dan CTA sama; yang berbeda hanya judul. Empat "angka" di bawah
 * memakai kalimat CTA sebagai teks pengisi di halaman asli — disalin apa adanya.
 */
const FILLER =
  "Setiap bantuan Anda menghadirkan harapan, melindungi mereka yang rentan, dan membantu masyarakat terdampak untuk kembali bangkit.";

const aksi = pillars["aksi-kemanusiaan"];

const subProgramBase = {
  parent: { name: "Program Kami", path: "/pr0gram-kami/" },
  eyebrow: "Program Kami",
  hero: aksi.hero,
  tagline: aksi.tagline,
  description: aksi.description,
  stats: [
    { title: "72 Relawan", description: FILLER },
    { title: "10++ Kota", description: FILLER },
    { title: "8.234 Dampak", description: FILLER },
    { title: "3 Program Unggulan", description: FILLER },
  ],
  programsHeading: aksi.programsHeading,
  programs: aksi.programs.map((p) =>
    p.title === "SIGAP" ? { ...p, title: "SIGAP (Siaga Generasi Aman dan Peduli Bencana)" } : p,
  ),
  cta: { ...aksi.cta, href: "/donasi/programs?category=Kemanusiaan" },
} satisfies Partial<Pillar>;

export const subPrograms: Record<"kerelawanan" | "kebencanaan", Pillar> = {
  kerelawanan: {
    ...subProgramBase,
    path: "pr0gram-kami/kerelawanan",
    title: "Kerelawanan",
    /** Kategori "relawan" masih kosong → carousel memakai publikasi terbaru. */
    storyCategories: ["relawan"],
    storiesHref: "/berita/",
  },
  kebencanaan: {
    ...subProgramBase,
    path: "pr0gram-kami/kebencanaan",
    title: "Kebencanaan",
    storyCategories: ["kebencanaan", "bencana", "karhutla"],
    storiesHref: "/category/kebencanaan/",
  },
};
