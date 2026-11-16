/**
 * Konten /audit-keuangan/ — VERBATIM dari halaman WordPress
 * (content/pages/audit-keuangan.json, ID halaman "Audit Keuangan").
 * Tautan dokumen diambil dari iframe Google Drive di tiap toggle halaman asli
 * (ekspor HTML membuang atribut src iframe). Nanti pindah ke database (prompt B11).
 */

const U = "/wp-content/uploads";

export const auditHero = {
  /** Latar fullwidth header Divi halaman asli. */
  image: { src: `${U}/2026/06/Rectangle-7098-3-1.jpg`, width: 1440, height: 661, alt: "" },
};

export const auditIntro = {
  /** Dua baris seperti aslinya (dipisah <br>). */
  heading: ["Komitmen terhadap", "Transparansi dan Akuntabilitas"],
  paragraphs: [
    "Relawan Nusantara secara berkala melaksanakan audit keuangan oleh Kantor Akuntan Publik (KAP) independen.",
    "Audit ini tidak hanya dilakukan untuk memenuhi ketentuan regulasi yang berlaku, tetapi juga untuk memastikan bahwa seluruh pengelolaan keuangan telah dilaksanakan secara wajar, transparan, dan sesuai dengan standar akuntansi yang berlaku di Indonesia.",
  ],
  /** Dari artboard "06 · Audit Keuangan"; faktanya sama dengan teks predikat WTP di footer. */
  badge: "Opini WTP · 2021 – 2025",
};

export type AuditReport = {
  year: number;
  /** Judul toggle di halaman asli. */
  title: string;
  /** ID berkas PDF di Google Drive. */
  driveFileId: string;
};

/** Terbaru dulu (2025 → 2021), sama seperti halaman asli. */
export const auditReports: AuditReport[] = [
  { year: 2025, title: "Tahun 2025", driveFileId: "1SJ28U4QTsRhDDyjvj0Sjw-JXfotr3r4e" },
  { year: 2024, title: "Tahun 2024", driveFileId: "1_nAVFWhZpO1F_Fdidush6bifV101VtpD" },
  { year: 2023, title: "Tahun 2023", driveFileId: "1Cu1IWQkSh6h7KkGIJQKEd1rRBZKXl2I_" },
  { year: 2022, title: "Tahun 2022", driveFileId: "15pS4v7Tw-BAkDAnUzdeSHAbW9g6wubZB" },
  { year: 2021, title: "Tahun 2021", driveFileId: "1gSNeBUYz4Qagb_KinPfwcv2UIB7qOUFO" },
];

/** Pratinjau tersemat — URL yang sama dengan iframe di halaman asli. */
export const auditPreviewUrl = (r: AuditReport) => `https://drive.google.com/file/d/${r.driveFileId}/preview?usp=embed_googleplus`;

/** Halaman dokumen di Google Drive (tombol "Lihat PDF"). */
export const auditPdfUrl = (r: AuditReport) => `https://drive.google.com/file/d/${r.driveFileId}/view`;
