/**
 * Data /e-report/ — tautan flipbook dan sampul diambil dari halaman WordPress yang
 * masih online (HTML ekspor di content/pages/e-report.json kehilangan kartu laporannya).
 * Urutan dan pengelompokan per tahun sama dengan halaman asli. Sejak B11 datanya di tabel database (dikelola di /admin/laporan); file ini hanya
 * sumber awal `npm run db:seed:transparency` dan tidak lagi dibaca halaman publik.
 *
 * JUDUL: halaman asli hanya menampilkan gambar sampul tanpa teks judul maupun alt.
 * Judul di sini dibaca dari tulisan pada sampul; bila sampul tidak memuat periode,
 * periode diambil dari slug tautan/nama file sampul. Mohon dicek ulang.
 *
 * TEMA: filter dari artboard "09 · e-Report" (tidak ada di halaman asli); pengelompokan
 * ditentukan dari judul. Laporan tanpa tema hanya muncul di "Semua".
 */

import type { MediaRef } from "@/types/content";

const U = "/wp-content/uploads";

export const reportThemes = [
  { slug: "palestina", label: "Palestina" },
  { slug: "kurban-zakat", label: "Kurban & Zakat" },
  { slug: "penyaluran-bulanan", label: "Penyaluran Bulanan" },
] as const;

export type ReportTheme = (typeof reportThemes)[number]["slug"];

export type Report = {
  year: number;
  title: string;
  /** Flipbook (hflip/Heyzine) — dibuka di tab baru. */
  url: string;
  cover: MediaRef;
  themes: ReportTheme[];
};

export const reportsPage = {
  /** Halaman asli tidak punya gambar hero; dipakai latar bagian "Laporan Penyaluran" di beranda. */
  hero: { src: `${U}/2026/06/image-57.jpg`, width: 1440, height: 496, alt: "" } satisfies MediaRef,
  /**
   * Meta description Rank Math halaman asli kosong. Kalimat ini verbatim dari bagian
   * "Laporan Penyaluran" di beranda (src/content/home.ts → reportCta.description).
   */
  description:
    "Lihat lebih dekat bagaimana setiap upaya ini terwujud, kami merangkumnya dalam satu laporan yang bisa Sahabat telusuri.",
};

const cover = (file: string, width = 1414, height = 2000): MediaRef => ({ src: `${U}/${file}`, width, height, alt: "" });
const BULANAN: ReportTheme[] = ["penyaluran-bulanan"];
const PALESTINA: ReportTheme[] = ["palestina"];

/** Terbaru dulu, sama seperti halaman asli. */
export const reports: Report[] = [
  // ---------- 2026 ----------
  { year: 2026, title: "Asap Belum Reda, Kehidupan Harus Tetap Terjaga (Oktober 2026)", url: "https://relawannusantara.hflip.co/october.2026", cover: cover("2026/11/Cover-e-report.png"), themes: BULANAN },
  { year: 2026, title: "Kebaikan yang Terus Bergerak (Agustus–September 2026)", url: "https://relawannusantara.hflip.co/september.2026", cover: cover("2026/10/Agustus-September-2026.jpg.jpeg"), themes: BULANAN },
  { year: 2026, title: "Setiap Kehidupan Berharga (Juli 2026)", url: "https://relawannusantara.hflip.co/e-report.july", cover: cover("2026/08/Juli-2026.png"), themes: BULANAN },
  { year: 2026, title: "Mengetuk Pintu Muharram (Juni 2026)", url: "https://relawannusantara.hflip.co/e-report.juni#page/1", cover: cover("2026/07/Juni-2026.png"), themes: BULANAN },
  { year: 2026, title: "Merangkai Kebahagiaan di Bulan Pengorbanan (Mei 2026)", url: "https://relawannusantara.hflip.co/e-report.mei", cover: cover("2026/06/Mei-2026.png"), themes: BULANAN },
  { year: 2026, title: "Solidaritas Kemanusiaan Melintasi Segala Batas (April 2026)", url: "https://relawannusantara.hflip.co/e-report.april", cover: cover("2026/05/April-2026.png"), themes: BULANAN },
  { year: 2026, title: "Jejak Kebaikan di Senja Ramadan dan Fajar Idulfitri (Maret 2026)", url: "https://relawannusantara.hflip.co/e-report.march", cover: cover("2026/05/Maret-2026.png"), themes: BULANAN },
  { year: 2026, title: "Nafas Kemanusiaan dan Cahaya Ramadan (Februari 2026)", url: "https://relawannusantara.hflip.co/e-report.february", cover: cover("2026/03/Februari-2026.png"), themes: BULANAN },
  { year: 2026, title: "Menjaga Hidup, Menghangatkan Harapan (Januari 2026)", url: "https://relawannusantara.hflip.co/e-report.january", cover: cover("2026/03/Januari-2026.png"), themes: BULANAN },

  // ---------- 2025 ----------
  { year: 2025, title: "Menjaga Nyala Harapan di Tengah Luka Dunia — Annual Impact Story Report 2025", url: "https://relawannusantara.hflip.co/annualreport.2025", cover: cover("2026/02/Jejak-Kebaikan.png"), themes: [] },
  { year: 2025, title: "Bergerak Bersama Merawat Indonesia (November 2025)", url: "https://relawannusantara.hflip.co/november.report", cover: cover("2026/07/November-2025.png"), themes: BULANAN },
  { year: 2025, title: "Mengalirkan Harapan, Menyemai Kebaikan (Oktober 2025)", url: "https://relawannusantara.hflip.co/october.report#page/1", cover: cover("2025/11/Screenshot-2025-11-06-101253.png", 399, 566), themes: BULANAN },
  { year: 2025, title: "Memulihkan Alam, Menguatkan Kemanusiaan (September 2025)", url: "https://bitly.cx/LaporanPenyaluranRN", cover: cover("2025/10/Screenshot-2025-10-09-153333.png", 399, 565), themes: BULANAN },
  { year: 2025, title: "Ketika Merdeka Menemukan Maknanya di Senyum Pelosok Nusantara dan Palestina", url: "https://heyzine.com/flip-book/7000b7f484.html", cover: cover("2025/09/Screenshot-2025-09-08-094222.png", 437, 626), themes: BULANAN },
  { year: 2025, title: "Monthly Report July 2025", url: "https://heyzine.com/flip-book/ff57d3adaa.html#page/1", cover: cover("2025/08/Screenshot-2025-08-07-094142.png", 400, 563), themes: BULANAN },
  { year: 2025, title: "Laporan Program Penyaluran Air Bersih untuk Palestina", url: "https://heyzine.com/flip-book/a092ff1e5a.html#page/1", cover: cover("2025/07/Screenshot-2025-07-23-164043.png", 435, 616), themes: PALESTINA },
  { year: 2025, title: "Laporan Program Penyaluran Bantuan Pembangunan Masjid Tahfidz Al-Bahjah Saung Balong", url: "https://heyzine.com/flip-book/LaporanPenyaluranRNxAlbahjah", cover: cover("2025/07/Screenshot-2025-07-11-154235.png", 550, 778), themes: [] },
  { year: 2025, title: "Laporan Penyaluran Juni 2025", url: "https://heyzine.com/flip-book/LaporanPenyaluranJuni2025", cover: cover("2025/07/Laporan-Penyaluran-Juni-2025.png"), themes: BULANAN },
  { year: 2025, title: "Laporan Program Zakat Kemanusiaan Palestina", url: "https://heyzine.com/flip-book/reportzakatkemanusiaanpalestina", cover: cover("2025/07/Screenshot-2025-07-10-161838.png", 513, 727), themes: ["palestina", "kurban-zakat"] },
  { year: 2025, title: "Laporan Program Kurban Terbaik 1446 H", url: "https://heyzine.com/flip-book/ReportKurban1446H", cover: cover("2025/07/Screenshot-2025-07-10-161822.png", 514, 725), themes: ["kurban-zakat"] },
  { year: 2025, title: "e-Report Penyaluran Iqra Al-Quran", url: "https://heyzine.com/flip-book/e-reportPenyaluranIqraAlquran", cover: cover("2025/07/report-penyaluran-iqra-quran.png"), themes: [] },
  { year: 2025, title: "Laporan Penyaluran Ramadhan untuk Palestina 1446 H / 2025 M", url: "https://heyzine.com/flip-book/b2a8e318ca.html", cover: cover("2025/07/laporan-penyaluran-ramadhan-untuk-palestina.png"), themes: PALESTINA },

  // ---------- 2024 ----------
  { year: 2024, title: "Laporan Penyaluran Bantuan untuk Palestina Januari – Oktober 2024", url: "https://heyzine.com/flip-book/Aksinyatauntukpalestina", cover: cover("2025/07/Screenshot-2025-07-10-163113.png", 548, 775), themes: PALESTINA },
  { year: 2024, title: "Laporan Penyaluran Edisi November 2024", url: "https://heyzine.com/flip-book/LaporanPenyaluranProgramEdisiNovember2024", cover: cover("2025/07/Screenshot-2025-07-10-163244.png", 547, 774), themes: BULANAN },
  { year: 2024, title: "Laporan Penyaluran Bantuan untuk Palestina September 2024", url: "https://heyzine.com/flip-book/LaporanPenyaluranBantuanUntukPalestinaSeptember2024", cover: cover("2025/07/Screenshot-2025-07-10-163425.png", 572, 813), themes: PALESTINA },
  { year: 2024, title: "Laporan Penyaluran Bantuan untuk Palestina Mei – Agustus 2024", url: "https://heyzine.com/flip-book/PengirimanBantuanKemanusiaanPalestina", cover: cover("2025/07/Screenshot-2025-07-10-163619.png", 550, 779), themes: PALESTINA },
  { year: 2024, title: "Laporan Penyaluran Program Ramadhan 1445 H", url: "https://heyzine.com/flip-book/LaporanRamadhan1445H", cover: cover("2025/07/Screenshot-2025-07-10-163751.png", 552, 777), themes: [] },
  { year: 2024, title: "Laporan Penyaluran Bantuan untuk Palestina Mei – Juni 2024", url: "https://heyzine.com/flip-book/LaporanPenyaluranPalestina", cover: cover("2025/07/Screenshot-2025-07-10-163911.png", 550, 778), themes: PALESTINA },
  { year: 2024, title: "Laporan Penyaluran Bantuan untuk Palestina: Mengukir Kebahagiaan Palestina", url: "https://heyzine.com/flip-book/MengukirKebahagianditanahPalestina", cover: cover("2025/07/Screenshot-2025-07-10-164054.png", 575, 813), themes: PALESTINA },
  { year: 2024, title: "Laporan Penyaluran Bantuan Sarana Pendidikan", url: "https://heyzine.com/flip-book/LaporanBantuanSaranaPendidikan", cover: cover("2025/07/Screenshot-2025-07-10-164217.png", 552, 781), themes: [] },
];
