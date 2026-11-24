import "server-only";

import { eq } from "drizzle-orm";

import { paragraphsToHtml, splitStoredParagraphs, visibleText } from "@/lib/rich-text";
import { youtubeId } from "@/lib/youtube";
import { sanitizeContentHtml } from "./content/sanitize";
import type { EditorSlide, HomeEditorData, HomeEditorState, HomeSaveResult } from "@/types/admin-home";
import { logActivity } from "./activity";
import { getDb, schema } from "./db";
import { HOME_DRAFT_KEY, HOME_KEY, type HomeSettings, type HomeSlide, homeSettingsSchema, readHomeSettings } from "./home";
import type { AuthUser } from "./permissions";

const { settings } = schema;

const WIB_MS = 7 * 60 * 60 * 1000;
const toWibInput = (iso: string | null) => (iso ? new Date(new Date(iso).getTime() + WIB_MS).toISOString().slice(0, 16) : "");

class HomeError extends Error {}

function storedParagraphs(html: string): string[] {
  const clean = sanitizeContentHtml(html);
  if (!visibleText(clean)) return [];
  return splitStoredParagraphs(clean).filter((p) => visibleText(p));
}

function storedInline(html: string, max: number): string {
  const parts = storedParagraphs(html);
  const value = parts.length <= 1 ? (parts[0] ?? "") : sanitizeContentHtml(html);
  if (value.length > max) throw new HomeError("Teks terlalu panjang.");
  return value;
}

function fromWibInput(value: string, what: string): string | null {
  if (!value) return null;
  const date = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(value) ? new Date(`${value}:00+07:00`) : new Date(Number.NaN);
  if (Number.isNaN(date.getTime())) throw new HomeError(`${what}: format tanggal tidak dikenali.`);
  return date.toISOString();
}

function toSlides(list: HomeSlide[]): EditorSlide[] {
  return list.map((s) => ({
    id: s.id,
    image: s.image,
    href: s.href,
    startsAt: toWibInput(s.startsAt),
    endsAt: toWibInput(s.endsAt),
    title: s.title,
  }));
}

/** Bentuk tersimpan { id, en } → model editor. Banner tiap bahasa berdiri sendiri. */
function toEditor(home: HomeSettings): HomeEditorData {
  return {
    slidesDesktop: toSlides(home.id.heroSlidesDesktop),
    slidesMobile: toSlides(home.id.heroSlidesMobile),
    slidesDesktopEn: toSlides(home.en.heroSlidesDesktop),
    slidesMobileEn: toSlides(home.en.heroSlidesMobile),
    introEyebrow: home.id.intro.eyebrow,
    introEyebrowEn: home.en.intro.eyebrow,
    introHeading: home.id.intro.heading,
    introHeadingEn: home.en.intro.heading,
    introHtml: paragraphsToHtml(home.id.intro.paragraphs),
    introHtmlEn: paragraphsToHtml(home.en.intro.paragraphs),
    mapImage: home.id.impactMap.image.src,
    mapWidth: home.id.impactMap.image.width,
    mapHeight: home.id.impactMap.image.height,
    mapImageEn: home.en.impactMap.image.src,
    mapWidthEn: home.en.impactMap.image.width,
    mapHeightEn: home.en.impactMap.image.height,
    mapAlt: home.id.impactMap.alt,
    mapAltEn: home.en.impactMap.alt,
    mapHeading: home.id.impactMap.heading,
    mapHeadingEn: home.en.impactMap.heading,
    stats: home.id.impactMap.stats.map((s, i) => ({
      value: s.value,
      label: s.label,
      labelEn: home.en.impactMap.stats[i]?.label ?? "",
      icon: s.icon,
      iconEn: home.en.impactMap.stats[i]?.icon ?? "",
    })),
    videoUrl: `https://www.youtube.com/watch?v=${home.id.featuredVideo.youtubeId}`,
    videoTitle: home.id.featuredVideo.title,
    videoTitleEn: home.en.featuredVideo.title,
    pillarsHeading1: home.id.pillars.heading[0] ?? "",
    pillarsHeading2: home.id.pillars.heading[1] ?? "",
    pillarsHeading1En: home.en.pillars.heading[0] ?? "",
    pillarsHeading2En: home.en.pillars.heading[1] ?? "",
    pillarsCtaLabel: home.id.pillars.cta.label,
    pillarsCtaLabelEn: home.en.pillars.cta.label,
    pillarsCtaHref: home.id.pillars.cta.href,
    pillars: home.id.pillars.items.map((item, i) => {
      const en = home.en.pillars.items[i];
      return {
        title: item.title,
        titleEn: en?.title ?? "",
        description: item.description,
        descriptionEn: en?.description ?? "",
        href: item.href,
        image: item.image,
        imageEn: en?.image ?? "",
      };
    }),
    publicationsHeading: home.id.publications.heading,
    publicationsHeadingEn: home.en.publications.heading,
    publicationsCtaLabel: home.id.publications.cta.label,
    publicationsCtaLabelEn: home.en.publications.cta.label,
    publicationsCtaHref: home.id.publications.cta.href,
    publicationsCount: home.id.publications.count,
    testimonialsHeading: home.id.testimonials.heading,
    testimonialsHeadingEn: home.en.testimonials.heading,
    testimonialsDescription: home.id.testimonials.description,
    testimonialsDescriptionEn: home.en.testimonials.description,
    testimonials: home.id.testimonials.items.map((t) => {
      const en = home.en.testimonials.items.find((e) => e.id === t.id);
      return { id: t.id, name: t.name, photo: t.photo, photoEn: en?.photo ?? "", visible: t.visible, quote: t.quote, quoteEn: en?.quote ?? "", role: t.role, roleEn: en?.role ?? "" };
    }),
    reportHeading: home.id.reportCta.heading,
    reportHeadingEn: home.en.reportCta.heading,
    reportDescription: home.id.reportCta.description,
    reportDescriptionEn: home.en.reportCta.description,
    reportCtaLabel: home.id.reportCta.cta.label,
    reportCtaLabelEn: home.en.reportCta.cta.label,
    reportCtaHref: home.id.reportCta.cta.href,
    reportBackground: home.id.reportCta.background,
    reportBackgroundEn: home.en.reportCta.background,
  };
}

const safeHref = (href: string) => /^(\/(?!\/)|https:\/\/)/.test(href);

const textOr = (en: string, id: string) => en.trim() || id;

/**
 * Terapkan isian editor ke konten tersimpan.
 * Teks Inggris yang dikosongkan memakai teks Indonesia. Banner English yang kosong memakai banner Indonesia.
 */
function applyEditor(base: HomeSettings, data: HomeEditorData): HomeSettings {
  const ids = new Set<string>();
  const slides = (list: EditorSlide[], label: string, desktop: boolean): HomeSlide[] => {
    if (list.length > 12) throw new HomeError(`${label}: maksimal 12 slide.`);
    const seen = new Set<string>();
    return list.map((s, i) => {
      const what = `${label} ${i + 1}`;
      const id = s.id.trim();
      if (!id || seen.has(id)) throw new HomeError(`${what}: ID slide ganda. Muat ulang halaman lalu coba lagi.`);
      seen.add(id);
      const title = s.title.trim();
      const href = s.href.trim();
      if (!s.image.trim()) throw new HomeError(`${what}: gambar wajib dipilih.`);
      if (desktop && !title) throw new HomeError(`${what}: judul wajib diisi (menjadi teks alt gambar).`);
      if (desktop && !href) throw new HomeError(`${what}: tautan wajib diisi.`);
      if (href && !safeHref(href)) throw new HomeError(`${what}: tautan harus diawali / atau https://.`);
      const startsAt = fromWibInput(s.startsAt, `${what} (mulai tayang)`);
      const endsAt = fromWibInput(s.endsAt, `${what} (selesai tayang)`);
      if (startsAt && endsAt && endsAt <= startsAt) throw new HomeError(`${what}: selesai tayang harus setelah mulai tayang.`);
      return { id, image: s.image.trim(), href, startsAt, endsAt, title };
    });
  };
  const desktop = slides(data.slidesDesktop, "Banner Indonesia desktop", true);
  const mobile = slides(data.slidesMobile, "Banner Indonesia mobile", false);
  const desktopEn = slides(data.slidesDesktopEn, "Banner English desktop", true);
  const mobileEn = slides(data.slidesMobileEn, "Banner English mobile", false);

  const eyebrow = data.introEyebrow.trim();
  const heading = data.introHeading.trim();
  if (!eyebrow) throw new HomeError("Teks pembuka: baris kecil wajib diisi.");
  if (!heading) throw new HomeError("Teks pembuka: judul wajib diisi.");
  const introId = storedParagraphs(data.introHtml);
  const introEn = storedParagraphs(data.introHtmlEn);
  if (!introId.length) throw new HomeError("Teks pembuka: paragraf wajib diisi.");

  const video = youtubeId(data.videoUrl);
  if (!video) throw new HomeError("Video unggulan: masukkan URL video YouTube yang valid.");
  const videoTitle = data.videoTitle.trim();
  if (!videoTitle) throw new HomeError("Video unggulan: judul video wajib diisi (untuk pembaca layar).");

  const mapHeading = data.mapHeading.trim();
  const mapAlt = data.mapAlt.trim();
  if (!mapHeading) throw new HomeError("Jejak Sebaran Kebaikan: judul panel wajib diisi.");
  if (!mapAlt) throw new HomeError("Jejak Sebaran Kebaikan: teks alt peta wajib diisi.");
  if (!data.mapImage.trim()) throw new HomeError("Jejak Sebaran Kebaikan: gambar peta wajib dipilih.");
  if (data.stats.length < 1 || data.stats.length > 8) throw new HomeError("Jejak Sebaran Kebaikan: isi 1 sampai 8 statistik.");
  const stats = data.stats.map((s, i) => {
    const value = s.value.trim();
    const label = s.label.trim();
    const icon = s.icon.trim();
    if (!value || !label || !icon) throw new HomeError(`Statistik ${i + 1}: angka, label, dan ikon wajib diisi.`);
    return { id: { value, label, icon }, en: { value, label: textOr(s.labelEn, label), icon: textOr(s.iconEn, icon) } };
  });

  const pillarsHeading1 = data.pillarsHeading1.trim();
  const pillarsHeading2 = data.pillarsHeading2.trim();
  const pillarsCtaLabel = data.pillarsCtaLabel.trim();
  const pillarsCtaHref = data.pillarsCtaHref.trim();
  if (!pillarsHeading1 || !pillarsHeading2) throw new HomeError("Pilar program: kedua baris judul wajib diisi.");
  if (!pillarsCtaLabel) throw new HomeError("Pilar program: teks tombol wajib diisi.");
  if (!safeHref(pillarsCtaHref)) throw new HomeError("Pilar program: tautan tombol harus diawali / atau https://.");
  if (data.pillars.length < 1 || data.pillars.length > 8) throw new HomeError("Pilar program: isi 1 sampai 8 kartu.");
  const pillars = data.pillars.map((item, i) => {
    const title = item.title.trim();
    const description = item.description.trim();
    const href = item.href.trim();
    if (!title || !description) throw new HomeError(`Pilar ${i + 1}: judul dan deskripsi wajib diisi.`);
    if (!item.image.trim()) throw new HomeError(`Pilar ${i + 1}: gambar wajib dipilih.`);
    if (!safeHref(href)) throw new HomeError(`Pilar ${i + 1}: tautan harus diawali / atau https://.`);
    const image = item.image.trim();
    return {
      id: { href, image, title, description },
      en: { href, image: textOr(item.imageEn, image), title: textOr(item.titleEn, title), description: textOr(item.descriptionEn, description) },
    };
  });

  const publicationsHeading = data.publicationsHeading.trim();
  const publicationsCtaLabel = data.publicationsCtaLabel.trim();
  const publicationsCtaHref = data.publicationsCtaHref.trim();
  if (!publicationsHeading) throw new HomeError("Publikasi: judul wajib diisi.");
  if (!publicationsCtaLabel) throw new HomeError("Publikasi: teks tombol wajib diisi.");
  if (!safeHref(publicationsCtaHref)) throw new HomeError("Publikasi: tautan tombol harus diawali / atau https://.");
  if (!Number.isInteger(data.publicationsCount) || data.publicationsCount < 1 || data.publicationsCount > 12) {
    throw new HomeError("Publikasi: jumlah kartu harus 1 sampai 12.");
  }

  const testimonialsHeading = data.testimonialsHeading.trim();
  if (!testimonialsHeading) throw new HomeError("Testimoni: judul wajib diisi.");

  const reportHeading = data.reportHeading.trim();
  const reportDescription = data.reportDescription.trim();
  const reportCtaLabel = data.reportCtaLabel.trim();
  const reportCtaHref = data.reportCtaHref.trim();
  if (!reportHeading || !reportDescription) throw new HomeError("Laporan penyaluran: judul dan deskripsi wajib diisi.");
  if (!reportCtaLabel) throw new HomeError("Laporan penyaluran: teks tombol wajib diisi.");
  if (!safeHref(reportCtaHref)) throw new HomeError("Laporan penyaluran: tautan tombol harus diawali / atau https://.");
  if (!data.reportBackground.trim()) throw new HomeError("Laporan penyaluran: gambar latar wajib dipilih.");

  if (data.testimonials.length > 30) throw new HomeError("Testimoni: maksimal 30 butir.");
  const testimonials = data.testimonials.map((t, i) => {
    const what = `Testimoni ${i + 1}`;
    const id = t.id.trim();
    if (!id || ids.has(id)) throw new HomeError(`${what}: ID ganda. Muat ulang halaman lalu coba lagi.`);
    ids.add(id);
    const name = t.name.trim();
    const quote = storedInline(t.quote, 4_000);
    const role = t.role.trim();
    if (!name) throw new HomeError(`${what}: nama wajib diisi.`);
    if (!visibleText(quote)) throw new HomeError(`${what}: kutipan wajib diisi.`);
    if (!t.photo.trim()) throw new HomeError(`${what}: foto wajib dipilih.`);
    const photo = t.photo.trim();
    const quoteEn = storedInline(t.quoteEn, 4_000);
    return {
      id: { id, name, photo, visible: t.visible, quote, role },
      en: { id, name, photo: textOr(t.photoEn, photo), visible: t.visible, quote: visibleText(quoteEn) ? quoteEn : quote, role: t.roleEn.trim() || role },
    };
  });

  const build = (locale: "id" | "en") => ({
    ...base[locale],
    heroSlidesDesktop: locale === "id" || desktopEn.length === 0 ? desktop : desktopEn,
    heroSlidesMobile: locale === "id" || mobileEn.length === 0 ? mobile : mobileEn,
    intro: {
      ...base[locale].intro,
      eyebrow: locale === "id" ? eyebrow : textOr(data.introEyebrowEn, eyebrow),
      heading: locale === "id" ? heading : textOr(data.introHeadingEn, heading),
      paragraphs: locale === "id" || !introEn.length ? introId : introEn,
    },
    featuredVideo: { youtubeId: video, title: locale === "id" ? videoTitle : textOr(data.videoTitleEn, videoTitle) },
    impactMap: {
      ...base[locale].impactMap,
      image:
        locale === "id" || !data.mapImageEn.trim()
          ? { src: data.mapImage.trim(), width: data.mapWidth, height: data.mapHeight }
          : { src: data.mapImageEn.trim(), width: data.mapWidthEn, height: data.mapHeightEn },
      alt: locale === "id" ? mapAlt : textOr(data.mapAltEn, mapAlt),
      heading: locale === "id" ? mapHeading : textOr(data.mapHeadingEn, mapHeading),
      stats: stats.map((s) => s[locale]),
    },
    pillars: {
      heading:
        locale === "id"
          ? [pillarsHeading1, pillarsHeading2]
          : [textOr(data.pillarsHeading1En, pillarsHeading1), textOr(data.pillarsHeading2En, pillarsHeading2)],
      cta: { label: locale === "id" ? pillarsCtaLabel : textOr(data.pillarsCtaLabelEn, pillarsCtaLabel), href: pillarsCtaHref },
      items: pillars.map((item) => item[locale]),
    },
    publications: {
      heading: locale === "id" ? publicationsHeading : textOr(data.publicationsHeadingEn, publicationsHeading),
      cta: { label: locale === "id" ? publicationsCtaLabel : textOr(data.publicationsCtaLabelEn, publicationsCtaLabel), href: publicationsCtaHref },
      count: data.publicationsCount,
    },
    testimonials: {
      heading: locale === "id" ? testimonialsHeading : textOr(data.testimonialsHeadingEn, testimonialsHeading),
      description: locale === "id" ? data.testimonialsDescription.trim() : textOr(data.testimonialsDescriptionEn, data.testimonialsDescription.trim()),
      items: testimonials.map((t) => t[locale]),
    },
    reportCta: {
      heading: locale === "id" ? reportHeading : textOr(data.reportHeadingEn, reportHeading),
      description: locale === "id" ? reportDescription : textOr(data.reportDescriptionEn, reportDescription),
      cta: { label: locale === "id" ? reportCtaLabel : textOr(data.reportCtaLabelEn, reportCtaLabel), href: reportCtaHref },
      background: locale === "id" ? data.reportBackground.trim() : textOr(data.reportBackgroundEn, data.reportBackground.trim()),
    },
  });
  const parsed = homeSettingsSchema.safeParse({ id: build("id"), en: build("en") });
  if (!parsed.success) {
    const issue = parsed.error.issues[0];
    throw new HomeError(`Isian tidak sah (${issue?.path.join(".")}: ${issue?.message}).`);
  }
  return parsed.data;
}

/** Isian awal /admin/beranda: salinan kerja bila ada, selain itu yang sedang terbit. */
export async function getHomeEditorState(): Promise<HomeEditorState | null> {
  const [draft, published] = await Promise.all([readHomeSettings(HOME_DRAFT_KEY), readHomeSettings(HOME_KEY)]);
  const current = draft ?? published;
  return current ? { data: toEditor(current), hasDraft: draft !== null } : null;
}

async function upsert(key: string, value: HomeSettings, userId: string): Promise<void> {
  await getDb().insert(settings).values({ key, value, updatedBy: userId }).onConflictDoUpdate({ target: settings.key, set: { value, updatedBy: userId } });
}

async function build(data: HomeEditorData): Promise<HomeSettings | HomeSaveResult> {
  const base = await readHomeSettings(HOME_KEY);
  if (!base) return { ok: false, error: "Konten beranda belum ada di database. Jalankan npm run db:seed:home." };
  try {
    return applyEditor(base, data);
  } catch (error) {
    if (error instanceof HomeError) return { ok: false, error: error.message };
    throw error;
  }
}

/** Simpan salinan kerja (untuk Pratinjau). Tidak mengubah beranda publik. */
export async function saveHomeDraft(user: AuthUser, data: HomeEditorData): Promise<HomeSaveResult> {
  const next = await build(data);
  if ("ok" in next) return next;
  await upsert(HOME_DRAFT_KEY, next, user.id);
  await logActivity({ userId: user.id, action: "draft", entity: "settings", entityId: HOME_DRAFT_KEY, summary: "Menyimpan draf beranda untuk pratinjau" });
  return { ok: true };
}

/** Terbitkan: tulis ke settings.home, hapus salinan kerja, catat log. Pemanggil menyegarkan cache. */
export async function publishHome(user: AuthUser, data: HomeEditorData): Promise<HomeSaveResult> {
  const next = await build(data);
  if ("ok" in next) return next;
  const before = await readHomeSettings(HOME_KEY);
  await upsert(HOME_KEY, next, user.id);
  await getDb().delete(settings).where(eq(settings.key, HOME_DRAFT_KEY));
  const count = (h: HomeSettings | null) =>
    h ? { slideDesktop: h.id.heroSlidesDesktop.length, slideMobile: h.id.heroSlidesMobile.length, testimoni: h.id.testimonials.items.length, video: h.id.featuredVideo.youtubeId, statistik: h.id.impactMap.stats.map((s) => s.value) } : null;
  await logActivity({ userId: user.id, action: "publish", entity: "settings", entityId: HOME_KEY, summary: "Menerbitkan perubahan beranda", diff: { before: count(before), after: count(next) } });
  return { ok: true };
}

/** Buang salinan kerja; editor kembali ke versi yang sedang terbit. */
export async function discardHomeDraft(user: AuthUser): Promise<void> {
  const removed = await getDb().delete(settings).where(eq(settings.key, HOME_DRAFT_KEY)).returning({ key: settings.key });
  if (removed.length) await logActivity({ userId: user.id, action: "discard", entity: "settings", entityId: HOME_DRAFT_KEY, summary: "Membuang draf beranda" });
}
