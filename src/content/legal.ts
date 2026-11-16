/**
 * Konten /asas-legalitas/ — VERBATIM dari halaman WordPress
 * (content/pages/asas-legalitas.json). Nanti pindah ke database (prompt B11).
 *
 * Koreksi salah ketik yang jelas (teks asli → di sini):
 *  1. Dokumen 1: "22 Mel 2014" → "22 Mei 2014" (dokumen 2 menulis "22 Mei 2014").
 *  2. Dokumen 3: "Magister Kenotarisan" → "Magister Kenotariatan" (ejaan gelar di dokumen 1).
 *  3. Dokumen 6: "pennyelenggaraan" → "penyelenggaraan" (ejaan di dokumen 7).
 * Tidak diubah karena tidak pasti: nomor "TU.01.02/0607-Dinsos/l/2024" (huruf "l" mungkin
 * angka romawi "I") dan variasi tanda baca/spasi lainnya.
 */

const U = "/wp-content/uploads";

export const legalHero = {
  /** Latar fullwidth header Divi halaman asli. */
  image: { src: `${U}/2026/06/Rectangle-7098-1-1.jpg`, width: 1440, height: 661, alt: "" },
};

export const legalIntro =
  "Relawan Nusantara memahami dan mematuhi segala peraturan yang ada di negara Republik Indonesia sehingga segala syarat perizinan kami perhatikan dan penuhi.";

export type LegalDoc = {
  /** Label jenis dokumen (dari artboard "07 · Asas Legalitas"; memakai istilah di teks dokumen). */
  kind: string;
  /** Teks dokumen dari halaman asli. */
  text: string;
};

/** Urutan sama dengan daftar bernomor di halaman asli. */
export const legalDocs: LegalDoc[] = [
  {
    kind: "Akta Pendirian",
    text: "Akta Pendirian dan Anggaran Dasar tanggal 22 Mei 2014 nomor 12 yang dibuat di hadapan Notaris Muhammad Juania, Sarjana Hukum, Magister Kenotariatan.",
  },
  {
    kind: "SK Pendirian",
    text: "SK Pendirian Yayasan Komite Relawan Nusantara: AHU-01733.50.10.2014 yang dibuat pada tanggal 22 Mei 2014.",
  },
  {
    kind: "Akta Perubahan",
    text: "Akta Perubahan Terakhir (Akta ke-6) Pernyataan Keputusan Rapat Pembina tanggal 31 Agustus 2022 nomor 07 yang dibuat di hadapan Notaris Yulia Permata Putri, Sarjana Hukum, Magister Kenotariatan.",
  },
  {
    kind: "SK Kemenkumham",
    text: "SK Kemenkumham Akta Perubahan Yayasan Komite Relawan Nusantara (Akta ke-6): AHU-AH.01.06-0037114 yang dibuat pada tanggal 12 September 2022",
  },
  {
    kind: "Domisili",
    text: "Surat Keterangan Domisili Yayasan Komite Relawan Nusantara No. 255/Um/Kel-Anwet/X/2023",
  },
  {
    kind: "LKS Dinsos Kota Bandung",
    text: "Yayasan Komite Relawan Nusantara dalam Penetapan terdaftar sebagai Lembaga Kesejahteraan Sosial (LKS) Dinsos Kota Bandung No.TU.01.02/0607-Dinsos/l/2024 dengan jenis penyelenggaraan Kesos Pelayanan Kesejahteraan Sosial Korban Bencana Alam, Status Lokal, Lingkup Wilayah Kerja Kota Bandung, dengan Tipe C, Masa berlaku 21 Maret 2024 sd. 21 Maret 2025.",
  },
  {
    kind: "LKS Dinsos Provinsi Jawa Barat",
    text: "Yayasan Komite Relawan Nusantara dalam Penetapan terdaftar sebagai Lembaga Kesejahteraan Sosial (LKS) Dinsos Provinsi Jawa Barat No.062/118/PPSKS/17/2024, dengan jenis penyelenggaraan Kesos Pelayanan Kesejahteraan Sosial Bagi Fakir Miskin Luar Panti, Status Pusat, Lingkup Wilayah Kerja Provinsi Jawa Barat dengan Tipe C, Masa Berlaku 4 Juni 2024 sd. 4 Juni 2027",
  },
  {
    kind: "NPWP",
    text: "NPWP Yayasan Komite Relawan Nusantara : 66.245.737.3-429.000",
  },
  {
    kind: "UPZ",
    text: "Yayasan Komite Relawan Nusantara terdaftar sebagai Unit Pengumpulan Zakat (UPZ) berdasarkan Surat Keputusan Ketua Badan Amil Zakat Nasional Provinsi Jawa Barat Nomor 21 Tahun 2025",
  },
];
