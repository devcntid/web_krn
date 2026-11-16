/**
 * Konten empat halaman Pilar Program — VERBATIM dari halaman WordPress
 * (content/pages/<pilar>.json). Jangan ditulis ulang.
 *
 * Gambar hero diambil dari latar fullwidth header halaman asli (CSS Divi, tidak ikut
 * di HTML ekspor). Tidak dibawa dari halaman asli: tombol "Unduh Proposal" (href="#",
 * tautan mati), tombol "Jadi Bagian Kebaikan" (tujuannya sama dengan CTA bawah), dan
 * foto di samping paragraf pembuka (tidak ada di artboard "04 · Pilar Program").
 */

import type { MediaRef } from "@/types/content";

const U = "/wp-content/uploads";

export type PillarSlug = "aksi-kemanusiaan" | "lingkungan" | "pendidikan" | "ekonomi";

export type PillarProgram = {
  title: string;
  description: string;
  image: MediaRef;
};

export type Pillar = {
  /** Path halaman tanpa slash, sama dengan slug WordPress. */
  path: PillarSlug;
  /** Judul halaman (H1). */
  title: string;
  hero: MediaRef;
  /** Tagline (H2 pertama di halaman asli). */
  tagline: string;
  description: string;
  /** Judul bagian program — halaman asli memakai "Program Pilihan" atau "Program". */
  programsHeading: string;
  programs: PillarProgram[];
  /**
   * PEMETAAN KATEGORI "Cerita Berdampak" — slug kategori WordPress (content/categories.json)
   * yang publikasinya ditampilkan di carousel. Ubah di sini bila perlu.
   * (Halaman asli menampilkan 6 publikasi terbaru yang sama di semua pilar.)
   */
  storyCategories: string[];
  /** Tujuan tombol "Lihat Semua Cerita". */
  storiesHref: string;
  cta: {
    heading: string;
    description: string;
    label: string;
    /** Aplikasi donasi (tidak dilayani Next.js) — parameter dipertahankan dari halaman asli. */
    href: string;
  };
};

/** Jumlah publikasi di carousel (sama dengan halaman asli). */
export const PILLAR_STORY_COUNT = 6;
/** Bila kategori terpetakan punya lebih sedikit dari ini, carousel dilengkapi publikasi terbaru. */
export const PILLAR_STORY_MIN = 3;

const sharedCta = {
  heading: "Mari Gerakan Kebaikan",
  description:
    "Setiap kontribusi memiliki arti. Bersama kami, Anda dapat ikut menghadirkan perubahan nyata bagi masyarakat melalui aksi, kepedulian, dan dukungan berkelanjutan.",
  label: "Mari Berdonasi",
};

const img = (file: string, width: number, height: number): MediaRef => ({ src: `${U}/${file}`, width, height, alt: "" });

export const pillars: Record<PillarSlug, Pillar> = {
  "aksi-kemanusiaan": {
    path: "aksi-kemanusiaan",
    title: "Aksi Kemanusiaan",
    hero: img("2026/06/Clean-Water.jpg", 662, 320),
    tagline: "Taklukkan Krisis, Pulihkan Kehidupan",
    description:
      "Pilar Aksi Kemanusiaan merupakan komitmen Relawan Nusantara dalam merespons bencana, konflik, dan krisis kemanusiaan secara cepat, tepat, serta terkoordinasi. Melalui kolaborasi pentahelix, pilar ini berfokus pada penyelamatan jiwa, pemenuhan kebutuhan dasar, perlindungan kelompok rentan, dan pemulihan masyarakat secara berkelanjutan.",
    programsHeading: "Program Pilihan",
    programs: [
      {
        title: "SIGAP",
        description:
          "Edukasi bagi anak sekolah untuk membangun kesiapsiagaan, keterampilan mitigasi, dan kepedulian dalam menghadapi serta mengurangi risiko bencana.",
        image: img("2026/08/P1570746-scaled.jpg", 2560, 1922),
      },
      {
        title: "Respon Bencana",
        description:
          "Layanan cepat melalui pengerahan relawan, logistik, dan dukungan psikososial untuk memenuhi kebutuhan dasar masyarakat terdampak bencana.",
        image: img("2026/08/Respon-Bencana-scaled.jpg", 1810, 2560),
      },
      {
        title: "Bantuan Kesehatan",
        description:
          "Layanan kesehatan berupa pemeriksaan gratis, edukasi hidup sehat, pembagian vitamin atau alat kesehatan, serta kampanye kesehatan masyarakat.",
        image: img("2026/08/Bantuan-Kesehatan.jpg", 1600, 1066),
      },
      {
        title: "Aksi Kemanusiaan Global",
        description:
          "Penyaluran bantuan bagi masyarakat terdampak konflik dan krisis dunia bersama mitra tepercaya dengan prinsip aman regulasi, syar’i, dan NKRI.",
        image: img("2026/08/Aksi-Kemanusiaan-Global.jpg", 1600, 1066),
      },
    ],
    storyCategories: ["kemanusiaan", "bencana", "kebencanaan", "karhutla", "palestina", "sudan", "kesehatan"],
    storiesHref: "/category/kemanusiaan/",
    cta: {
      heading: "Jadilah Bagian Aksi Kemanusiaan",
      description:
        "Setiap bantuan Anda menghadirkan harapan, melindungi mereka yang rentan, dan membantu masyarakat terdampak untuk kembali bangkit.",
      label: "Mari Berdonasi",
      href: "/donasi/programs?category=Kemanusiaan&source=web",
    },
  },

  lingkungan: {
    path: "lingkungan",
    title: "Lingkungan",
    hero: img("2026/08/hero-lingkungan.jpeg", 1599, 899),
    tagline: "Berani Menjaga, Peduli Melestarikan",
    description:
      "Melalui kolaborasi bersama masyarakat, relawan, pemerintah, dan sektor swasta, Pilar Peduli Lingkungan mendorong terciptanya lingkungan yang bersih, hijau, dan tangguh terhadap perubahan iklim.",
    programsHeading: "Program",
    programs: [
      {
        title: "Planting the Future",
        description:
          "Program penghijauan berkelanjutan di kawasan pesisir melalui penanaman pohon bersama masyarakat dan relawan untuk memulihkan ekosistem serta menciptakan pesisir yang lebih hijau.",
        image: img("2026/08/Planting-the-Future.jpg", 1600, 900),
      },
      {
        title: "Penanaman Pohon",
        description:
          "Kegiatan rehabilitasi lingkungan melalui penanaman berbagai jenis pohon produktif, konservasi, dan penghijauan di kawasan hutan, daerah aliran sungai (DAS), pesisir, sekolah, serta ruang terbuka hijau.",
        image: img("2026/08/Penanaman-Pohon.jpg", 1920, 1080),
      },
      {
        title: "Clean Up",
        description:
          "gerakan bersama untuk menjaga kebersihan lingkungan melalui aksi bersih-bersih di berbagai ruang publik, sungai, pantai, dan fasilitas umum.",
        image: img("2026/08/Clean-Up.jpg", 1920, 1080),
      },
    ],
    storyCategories: ["hewan-lingkungan", "air-bersih", "jaga-satwa"],
    storiesHref: "/category/hewan-lingkungan/",
    cta: { ...sharedCta, href: "/donasi/programs?category=Lingkungan&source=web" },
  },

  pendidikan: {
    path: "pendidikan",
    title: "Pendidikan",
    hero: img("2026/09/hero-pendidikan.jpg", 1920, 939),
    tagline: "Nyalakan Harapan, Bukakan Jalan Masa Depan",
    description:
      "Pilar Pendidikan berfokus pada peningkatan akses dan kualitas pendidikan bagi anak-anak dan masyarakat kurang mampu melalui penyediaan sarana pendidikan, perbaikan fasilitas belajar, serta pengembangan kapasitas dan keterampilan untuk mendukung terciptanya generasi yang cerdas, mandiri, dan berdaya saing.",
    programsHeading: "Program",
    programs: [
      {
        title: "Bantuan Perlengkapan Pendidikan",
        description:
          "Program ini membantu anak-anak dari keluarga prasejahtera dan menengah ke bawah mendapatkan perlengkapan belajar yang layak agar dapat belajar lebih optimal tanpa terkendala ekonomi.",
        image: img("2026/08/Bantuan-Perlengkapan-Pendidikan.jpeg", 1280, 720),
      },
      {
        title: "Renovasi Sekolah",
        description:
          "Program Renovasi Sekolah bertujuan memperbaiki fasilitas pendidikan agar tercipta lingkungan belajar yang aman, nyaman, dan mendukung proses pembelajaran.",
        image: img("2026/08/Renovasi-Sekolah-scaled.jpeg", 2560, 1440),
      },
      {
        title: "Buku untuk Pelosok",
        description:
          "Program Donasi Buku untuk Pelosok bertujuan meningkatkan akses bacaan berkualitas bagi anak-anak di daerah 3T melalui distribusi buku dan penyediaan pojok baca untuk menumbuhkan budaya literasi sejak dini.",
        image: img("2026/08/Donasi-buku-untuk-Pelosok.jpeg", 1280, 720),
      },
      {
        title: "Sepatu Anak Nusantara",
        description:
          "Program Sepatu Anak Nusantara (SAN) menyediakan sepatu layak pakai bagi anak-anak prasejahtera di wilayah 3T agar dapat belajar dengan nyaman, aman, dan percaya diri.",
        image: img("2026/08/Sepatu-Anak-Nusantara-scaled.jpg", 1810, 2560),
      },
    ],
    storyCategories: ["sekolah-madrasah"],
    storiesHref: "/category/sekolah-madrasah/",
    cta: { ...sharedCta, href: "/donasi/programs?category=Pendidikan&source=web" },
  },

  ekonomi: {
    path: "ekonomi",
    title: "Ekonomi",
    /** Halaman asli memakai gambar hero yang sama dengan Aksi Kemanusiaan. */
    hero: img("2026/06/Clean-Water.jpg", 662, 320),
    tagline: "Bangun Kemandirian, Wujudkan Kesejahteraan",
    description:
      "Pilar ekonomi ini bertujuan mendorong masyarakat untuk tumbuh lebih mandiri dan berdaya melalui penguatan ekonomi yang berkelanjutan. Program ini hadir untuk membuka akses terhadap peluang usaha, meningkatkan keterampilan, serta mendukung masyarakat dalam mengembangkan potensi yang dimiliki dengan perencanaan yang tepat dan pendampingan yang berkelanjutan",
    programsHeading: "Program",
    programs: [
      {
        title: "UMKM Naik Kelas",
        description:
          "UMKM Naik Kelas bertujuan memberdayakan pelaku usaha kecil untuk meningkatkan kualitas produk, memperluas pasar, dan mengembangkan usaha secara mandiri dan berkelanjutan.",
        image: img("2026/08/UMKM-Naik-Kelas-scaled.jpg", 2560, 1440),
      },
      {
        title: "Difabel Berdaya Tanpa Batas",
        description:
          "Program ini mendukung kemandirian ekonomi penyandang disabilitas melalui pengembangan keterampilan dan potensi agar mampu berkarya, berwirausaha, dan berpenghasilan mandiri.",
        image: img("2026/08/Difabel-Berdaya-Tanpa-Batas-scaled.jpg", 2560, 1440),
      },
      {
        title: "UMKM Digital",
        description:
          "Program ini mendukung pengembangan usaha melalui modal, Smart-Gerobak, QRIS, dan aplikasi pembukuan digital agar pelaku UMKM dapat mengelola usaha lebih profesional.",
        image: img("2026/09/UMKM-Digital-scaled-1.jpg", 246, 138),
      },
      {
        title: "Borong dan Berbagi",
        description:
          "Borong Berbagi mendukung usaha masyarakat dengan membeli produk pelaku usaha untuk dibagikan kepada yang membutuhkan, sehingga menggerakkan ekonomi dan menebar manfaat.",
        image: img("2026/08/Bandung-scaled.jpg", 2560, 1440),
      },
    ],
    /** Kategori "ekonomi" baru berisi 1 publikasi → carousel dilengkapi publikasi terbaru. */
    storyCategories: ["ekonomi"],
    storiesHref: "/category/ekonomi/",
    cta: { ...sharedCta, href: "/donasi/programs?category=Ekonomi&source=web" },
  },
};
