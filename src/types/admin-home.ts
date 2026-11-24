/** Tipe bersama server ↔ klien untuk /admin/beranda (tanpa kode server). */

export type EditorSlide = {
  id: string;
  /** URL Blob atau path lama /wp-content/uploads/… */
  image: string;
  href: string;
  /** Jadwal tayang sebagai nilai <input type="datetime-local"> dalam WIB; "" = tanpa batas. */
  startsAt: string;
  endsAt: string;
  title: string;
};

export type EditorStat = { value: string; label: string; labelEn: string; icon: string; iconEn: string };

export type EditorPillar = {
  title: string;
  titleEn: string;
  description: string;
  descriptionEn: string;
  href: string;
  image: string;
  imageEn: string;
};

export type EditorTestimonial = {
  id: string;
  name: string;
  photo: string;
  photoEn: string;
  visible: boolean;
  quote: string;
  quoteEn: string;
  role: string;
  roleEn: string;
};

export type HomeEditorData = {
  /** Banner Indonesia. */
  slidesDesktop: EditorSlide[];
  slidesMobile: EditorSlide[];
  /** Banner English. Kosong saat disimpan memakai banner Indonesia. */
  slidesDesktopEn: EditorSlide[];
  slidesMobileEn: EditorSlide[];
  /** Baris kecil di atas judul intro. */
  introEyebrow: string;
  introEyebrowEn: string;
  introHeading: string;
  introHeadingEn: string;
  /** HTML editor visual; disimpan kembali sebagai paragraf. */
  introHtml: string;
  introHtmlEn: string;
  mapImage: string;
  mapWidth: number;
  mapHeight: number;
  /** Kosong = memakai gambar peta Indonesia. */
  mapImageEn: string;
  mapWidthEn: number;
  mapHeightEn: number;
  mapAlt: string;
  mapAltEn: string;
  mapHeading: string;
  mapHeadingEn: string;
  stats: EditorStat[];
  videoUrl: string;
  videoTitle: string;
  videoTitleEn: string;
  pillarsHeading1: string;
  pillarsHeading2: string;
  pillarsHeading1En: string;
  pillarsHeading2En: string;
  pillarsCtaLabel: string;
  pillarsCtaLabelEn: string;
  pillarsCtaHref: string;
  pillars: EditorPillar[];
  publicationsHeading: string;
  publicationsHeadingEn: string;
  publicationsCtaLabel: string;
  publicationsCtaLabelEn: string;
  publicationsCtaHref: string;
  publicationsCount: number;
  testimonialsHeading: string;
  testimonialsHeadingEn: string;
  testimonialsDescription: string;
  testimonialsDescriptionEn: string;
  testimonials: EditorTestimonial[];
  reportHeading: string;
  reportHeadingEn: string;
  reportDescription: string;
  reportDescriptionEn: string;
  reportCtaLabel: string;
  reportCtaLabelEn: string;
  reportCtaHref: string;
  reportBackground: string;
  /** Kosong = memakai gambar latar Indonesia. */
  reportBackgroundEn: string;
};

export type HomeEditorState = { data: HomeEditorData; hasDraft: boolean };
export type HomeSaveResult = { ok: true } | { ok: false; error: string };
