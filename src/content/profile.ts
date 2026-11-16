/**
 * Konten /profil-relawan-nusantara/ — disalin VERBATIM dari halaman WordPress
 * (content/pages/profil-relawan-nusantara.json, ID 259828). Jangan ditulis ulang.
 */

const U = "/wp-content/uploads";

export const profileHero = {
  /** Latar fullwidth header Divi (juga og:image halaman). */
  image: { src: `${U}/2026/06/Rectangle-7098.jpg`, width: 1440, height: 661, alt: "" },
};

export const profileAbout = {
  /** Asli: <p>Apa itu <strong>Relawan Nusantara?</strong></p> */
  heading: { lead: "Apa itu", strong: "Relawan Nusantara?" },
  body: "Relawan Nusantara adalah lembaga kemanusiaan yang berperan sebagai jembatan kebaikan dalam merespons berbagai isu kemanusiaan, khususnya bagi kelompok rentan serta masyarakat yang terdampak bencana dan kondisi darurat.",
  /** Flipbook company profile yang disematkan di halaman asli (iframe "About us"). */
  embed: { src: "https://relawannusantara.hflip.co/compro.2026", title: "About us" },
};

export const profileVision = {
  heading: "Visi",
  /** Dua baris seperti aslinya (dipisah <br>). */
  lines: ["Lembaga kemanusiaan yang amanah dan profesional berbasis kedermawanan", "Masyarakat demi hadirkan kebaikan bagi semesta"],
};

export const profileMission = {
  heading: "Misi",
  items: [
    "Mengokohkan pengelolaan lembaga dengan semangat agility dan berdampak global.",
    "Mengembangkan kolaborasi kemitraan, jaringan kemanusiaan dan partisipasi masyarakat",
    "Mendayagunakan sumber daya dan program unggulan yang bermanfaat bagi kemanusiaan.",
  ],
};

/**
 * Kartu tautan (bagian baru dari artboard "05 · Profil", tidak ada di halaman asli).
 * Deskripsi diambil verbatim dari sumber yang disebut di tiap baris — bukan karangan.
 */
export const profileTransparency = {
  heading: "Transparansi & Legalitas",
  /** Sumber: teks predikat WTP di footer situs. */
  description:
    "Relawan Nusantara telah meraih predikat opini Wajar Tanpa Pengecualian pada laporan keuangan 2021 – 2025 Sesuai Standar Akuntansi Keuangan Indonesia",
  links: [
    {
      title: "Audit Keuangan",
      href: "/audit-keuangan/",
      /** Sumber: paragraf pembuka /audit-keuangan/. */
      description: "Relawan Nusantara secara berkala melaksanakan audit keuangan oleh Kantor Akuntan Publik (KAP) independen.",
      cta: "Lihat laporan",
    },
    {
      title: "Asas Legalitas",
      href: "/asas-legalitas/",
      /** Sumber: paragraf pembuka /asas-legalitas/. */
      description:
        "Relawan Nusantara memahami dan mematuhi segala peraturan yang ada di negara Republik Indonesia sehingga segala syarat perizinan kami perhatikan dan penuhi.",
      cta: "Lihat dokumen",
    },
    {
      title: "e-Report",
      href: "/e-report/",
      /** Sumber: bagian "Laporan Penyaluran" di beranda. */
      description:
        "Lihat lebih dekat bagaimana setiap upaya ini terwujud, kami merangkumnya dalam satu laporan yang bisa Sahabat telusuri.",
      cta: "Buka e-Report",
    },
  ],
};
