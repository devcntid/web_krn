/**
 * Konten beranda (front page WordPress "New Beranda", ID 259640) — disalin
 * verbatim dari situs existing. Ubah di sini untuk memperbarui beranda.
 */

const U = "/wp-content/uploads";

/** Smart Slider 3 — slide desktop (link ke kampanye donasi). */
export const heroSlidesDesktop = [
  { title: "Respon 72 Jam", image: `${U}/2026/10/Banner-Donol.png`, href: "/campaign/respon-tanggap-bencana" },
  { title: "Respon Darurat Karhutla", image: `${U}/2026/10/Page-2.png`, href: "/campaign/respon-darurat-karhutla" },
  { title: "Bantuan Kemanusiaan Sudan", image: `${U}/2026/10/Bantu-Kemanusiaan-Sudan.png`, href: "/campaign/sedekah-air-pangan-untuk-sudan" },
  { title: "Musim Dingin Palestina", image: `${U}/2026/10/ORG-2.png`, href: "/campaign/hangatkan-palestina-di-tengah-musim-dingin" },
];

/** Smart Slider 3 — slide mobile (potret 1080×1350, tanpa link). */
export const heroSlidesMobile = [
  `${U}/slider/cache/507371ff7da99849a538a6b46d980d76/relawan.nusantara_1786924838_3965335402746843216_1550744806-1.jpg`,
  `${U}/slider/cache/f4e7ebcf8ea566d17d0521c70a129a3c/relawan.nusantara_1786794302_3964230372631891930_1550744806-1.jpg`,
  `${U}/slider/cache/9588a1b15e38ddb8c263acd2bf1757e0/relawan.nusantara_1786794302_3964230372589926938_1550744806-1.jpg`,
];

export const intro = {
  scrollIcon: `${U}/2025/12/daa07fc7a43e05384617909b52a4ddf9.gif`,
  eyebrow: "Berawal dari Kepedulian,",
  heading: "Bergerak Menjadi Jembatan Kebaikan",
  paragraphs: [
    "Dalam setiap isu kemanusiaan, selalu ada hati yang tergerak untuk peduli.",
    "Berawal dari para relawan yang berkumpul dan memiliki semangat serta misi yang sama, kami berkomitmen untuk hadir melalui lembaga yang lebih profesional, merangkul kepedulian itu menjadi aksi nyata yang berdampak lebih luas.",
  ],
};

export const featuredVideo = {
  youtubeId: "8n2hpUQ_rCo",
  title: "Tangis Tak Tertahankan Saat Bertemu Warga Palestina — Episode 1",
};

export const impactMap = {
  image: { src: `${U}/2026/06/Map-e1782284458578.jpg`, width: 1193, height: 673 },
  alt: "Peta sebaran program Relawan Nusantara: Palestina, Sudan, Malaysia, dan Indonesia",
  heading: "Jejak Sebaran Kebaikan 2026",
  stats: [
    { value: 287507, label: "Penerima Manfaat", icon: `${U}/2026/06/Ellipse-2783.png` },
    { value: 3012, label: "Relawan", icon: `${U}/2026/06/Ellipse-2782.png` },
    { value: 50, label: "Mitra Kebaikan", icon: `${U}/2026/06/Ellipse-2784.png` },
    { value: 109, label: "Jangkauan Wilayah", icon: `${U}/2026/06/Ellipse-2786.png` },
  ],
};

export const pillars = {
  heading: ["Dari Niat Yang Sama,", "Lahir Berbagai Aksi Kebaikan."],
  cta: { label: "Yuk, Kenali Lebih Dekat", href: "/profil-relawan-nusantara/" },
  items: [
    {
      title: "Aksi Kemanusiaan",
      href: "/aksi-kemanusiaan/",
      image: `${U}/2026/06/Clean-Water.jpg`,
      description:
        "Aksi kemanusiaan bukan hanya tentang menyalurkan bantuan, tetapi tentang hadir di tengah masyarakat dan menjawab kebutuhan yang nyata.",
    },
    {
      title: "Ekonomi",
      href: "/ekonomi/",
      image: `${U}/2026/06/Eco-Hope.jpg`,
      description:
        "Kemandirian lahir dari kesempatan yang terbuka, ketika seseorang memiliki ruang untuk tumbuh, berkarya dan mengubah hidupnya sendiri.",
    },
    {
      title: "Pendidikan",
      href: "/pendidikan/",
      image: `${U}/2026/06/Health-For-All.jpg`,
      description:
        "Menyalakan harapan di tempat yang sering luput dari perhatian, agar lebih banyak mimpi menemukan masa depannya.",
    },
    {
      title: "Lingkungan",
      href: "/lingkungan/",
      image: `${U}/2026/06/Eco-Hope-1.jpg`,
      description:
        "Setiap kehidupan bergantung pada alam yang sehat, karena itu menjaga bumi hari ini adalah menjaga masa depan yang akan kita wariskan.",
    },
  ],
};

export const publications = {
  heading: "Publikasi",
  cta: { label: "Ikuti Kisahnya Lebih Lanjut", href: "/berita-3/" },
  count: 6,
};

export const testimonials = {
  heading: "Bersama Menebar Dampak",
  description:
    "Cerita, pengalaman, dan kesan dari para donatur, mitra, penerima manfaat, serta relawan yang telah menjadi bagian dari perjalanan menghadirkan manfaat",
  items: [
    {
      quote:
        "Terima kasih karena selama ini sudah hadir dan peduli kepada masyarakat kecil seperti kami, terutama untuk anak saya, Ida. Semoga Relawan Nusantara semakin maju, semakin banyak membantu orang-orang yang membutuhkan, dan semua relawannya selalu diberikan kesehatan, keberkahan, serta dimudahkan dalam setiap kebaikannya.",
      name: "Ibu Marwah dan Ida Nurmalasari, (7 th)",
      role: "PM Program Pangan Difable",
      photo: `${U}/2026/06/Ibu-Marwah-120x120.jpg`,
    },
    {
      quote: "Senang sekali aku dapet sepatu dan peralatan sekolah baru, karena yang lama sudah rusak.",
      name: "Syafira",
      role: "Siswi MIS Menanga, NTT",
      photo: `${U}/2026/06/syafir-NTT-120x120.jpeg`,
    },
    {
      quote:
        "Kami dari Industri Hulu Migas mengapresiasi Relawan Nusantara atas kolaborasi penyaluran bantuan SKK Migas-KKKS untuk korban bencana di Sumatera (Desember 2025-Januari 2026). Tim sigap, tepat sasaran hingga pelosok, profesional memenuhi standar compliance, komunikatif, dan pelaporannya transparan.",
      name: "Roy Widiartha",
      role: "Kepala Pokja Pengembangan Masyarakat SKK Migas",
      photo: `${U}/2026/06/roy-skk-120x120.jpg`,
    },
    {
      quote:
        "Terima kasih kepada Relawan Nusantara dan seluruh pihak yang telah memberikan kesempatan untuk aku dapat menjadi bagian dari perjalanan kemanusiaan ini. Semoga setiap kebaikan yang disampaikan menjadi manfaat, membawa keberkahan dan menguatkan harapan bagi masyarakat Aceh Tamiang untuk bangkit dan pulih sepenuhnya.",
      name: "Nabilah Ayu",
      role: "Penyanyi",
      photo: `${U}/2026/06/nabilah-120x120.jpg`,
    },
  ],
};

export const reportCta = {
  heading: "Laporan Penyaluran",
  description:
    "Lihat lebih dekat bagaimana setiap upaya ini terwujud, kami merangkumnya dalam satu laporan yang bisa Sahabat telusuri.",
  cta: { label: "Buka E-Report", href: "/e-report/" },
  background: `${U}/2026/06/image-57.jpg`,
};
