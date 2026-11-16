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
  titleEn: string;
};

export type EditorStat = { value: string; label: string; labelEn: string };

export type EditorTestimonial = {
  id: string;
  name: string;
  photo: string;
  visible: boolean;
  quote: string;
  quoteEn: string;
  role: string;
  roleEn: string;
};

export type HomeEditorData = {
  slidesDesktop: EditorSlide[];
  slidesMobile: EditorSlide[];
  mapHeading: string;
  mapHeadingEn: string;
  stats: EditorStat[];
  videoUrl: string;
  videoTitle: string;
  videoTitleEn: string;
  testimonials: EditorTestimonial[];
};

export type HomeEditorState = { data: HomeEditorData; hasDraft: boolean };
export type HomeSaveResult = { ok: true } | { ok: false; error: string };
