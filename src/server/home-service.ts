import "server-only";

import { eq } from "drizzle-orm";

import { youtubeId } from "@/lib/youtube";
import type { EditorSlide, HomeEditorData, HomeEditorState, HomeSaveResult } from "@/types/admin-home";
import { logActivity } from "./activity";
import { getDb, schema } from "./db";
import { HOME_DRAFT_KEY, HOME_KEY, type HomeSettings, type HomeSlide, homeSettingsSchema, readHomeSettings } from "./home";
import type { AuthUser } from "./permissions";

const { settings } = schema;

const WIB_MS = 7 * 60 * 60 * 1000;
const toWibInput = (iso: string | null) => (iso ? new Date(new Date(iso).getTime() + WIB_MS).toISOString().slice(0, 16) : "");

class HomeError extends Error {}

function fromWibInput(value: string, what: string): string | null {
  if (!value) return null;
  const date = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(value) ? new Date(`${value}:00+07:00`) : new Date(Number.NaN);
  if (Number.isNaN(date.getTime())) throw new HomeError(`${what}: format tanggal tidak dikenali.`);
  return date.toISOString();
}

/** Bentuk tersimpan { id, en } → model editor (teks dua bahasa per butir, struktur dipakai bersama). */
function toEditor(home: HomeSettings): HomeEditorData {
  const slides = (id: HomeSlide[], en: HomeSlide[]): EditorSlide[] =>
    id.map((s) => ({
      id: s.id,
      image: s.image,
      href: s.href,
      startsAt: toWibInput(s.startsAt),
      endsAt: toWibInput(s.endsAt),
      title: s.title,
      titleEn: en.find((e) => e.id === s.id)?.title ?? "",
    }));
  return {
    slidesDesktop: slides(home.id.heroSlidesDesktop, home.en.heroSlidesDesktop),
    slidesMobile: slides(home.id.heroSlidesMobile, home.en.heroSlidesMobile),
    mapHeading: home.id.impactMap.heading,
    mapHeadingEn: home.en.impactMap.heading,
    stats: home.id.impactMap.stats.map((s, i) => ({ value: s.value, label: s.label, labelEn: home.en.impactMap.stats[i]?.label ?? "" })),
    videoUrl: `https://www.youtube.com/watch?v=${home.id.featuredVideo.youtubeId}`,
    videoTitle: home.id.featuredVideo.title,
    videoTitleEn: home.en.featuredVideo.title,
    testimonials: home.id.testimonials.items.map((t) => {
      const en = home.en.testimonials.items.find((e) => e.id === t.id);
      return { id: t.id, name: t.name, photo: t.photo, visible: t.visible, quote: t.quote, quoteEn: en?.quote ?? "", role: t.role, roleEn: en?.role ?? "" };
    }),
  };
}

const safeHref = (href: string) => /^(\/(?!\/)|https:\/\/)/.test(href);

/**
 * Terapkan isian editor ke konten tersimpan. Bagian beranda yang tidak dikelola di A5
 * (intro, pilar, publikasi, CTA e-Report, peta) dipertahankan dari `base`.
 * Teks Inggris yang dikosongkan memakai teks Indonesia.
 */
function applyEditor(base: HomeSettings, data: HomeEditorData): HomeSettings {
  const ids = new Set<string>();
  const slides = (list: EditorSlide[], device: "Desktop" | "Mobile") => {
    if (list.length > 12) throw new HomeError(`Slider ${device}: maksimal 12 slide.`);
    return list.map((s, i) => {
      const what = `Slide ${device} ${i + 1}`;
      const id = s.id.trim();
      if (!id || ids.has(id)) throw new HomeError(`${what}: ID slide ganda. Muat ulang halaman lalu coba lagi.`);
      ids.add(id);
      const title = s.title.trim();
      const href = s.href.trim();
      if (!s.image.trim()) throw new HomeError(`${what}: gambar wajib dipilih.`);
      if (device === "Desktop" && !title) throw new HomeError(`${what}: judul wajib diisi (menjadi teks alt gambar).`);
      if (device === "Desktop" && !href) throw new HomeError(`${what}: tautan wajib diisi.`);
      if (href && !safeHref(href)) throw new HomeError(`${what}: tautan harus diawali / atau https://.`);
      const startsAt = fromWibInput(s.startsAt, `${what} (mulai tayang)`);
      const endsAt = fromWibInput(s.endsAt, `${what} (selesai tayang)`);
      if (startsAt && endsAt && endsAt <= startsAt) throw new HomeError(`${what}: selesai tayang harus setelah mulai tayang.`);
      const shared = { id, image: s.image.trim(), href, startsAt, endsAt };
      return { id: { ...shared, title }, en: { ...shared, title: s.titleEn.trim() || title } };
    });
  };
  const desktop = slides(data.slidesDesktop, "Desktop");
  const mobile = slides(data.slidesMobile, "Mobile");

  const video = youtubeId(data.videoUrl);
  if (!video) throw new HomeError("Video unggulan: masukkan URL video YouTube yang valid.");
  const videoTitle = data.videoTitle.trim();
  if (!videoTitle) throw new HomeError("Video unggulan: judul video wajib diisi (untuk pembaca layar).");

  const mapHeading = data.mapHeading.trim();
  if (!mapHeading) throw new HomeError("Jejak Sebaran Kebaikan: judul panel wajib diisi.");
  if (data.stats.length !== base.id.impactMap.stats.length) throw new HomeError("Jumlah angka statistik tidak sesuai. Muat ulang halaman.");
  const stats = data.stats.map((s, i) => {
    const value = s.value.trim();
    const label = s.label.trim();
    if (!value || !label) throw new HomeError(`Statistik ${i + 1}: angka dan label wajib diisi.`);
    const icon = base.id.impactMap.stats[i]?.icon ?? "";
    return { id: { value, label, icon }, en: { value, label: s.labelEn.trim() || label, icon } };
  });

  if (data.testimonials.length > 30) throw new HomeError("Testimoni: maksimal 30 butir.");
  const testimonials = data.testimonials.map((t, i) => {
    const what = `Testimoni ${i + 1}`;
    const id = t.id.trim();
    if (!id || ids.has(id)) throw new HomeError(`${what}: ID ganda. Muat ulang halaman lalu coba lagi.`);
    ids.add(id);
    const name = t.name.trim();
    const quote = t.quote.trim();
    const role = t.role.trim();
    if (!name) throw new HomeError(`${what}: nama wajib diisi.`);
    if (!quote) throw new HomeError(`${what}: kutipan wajib diisi.`);
    if (!t.photo.trim()) throw new HomeError(`${what}: foto wajib dipilih.`);
    const shared = { id, name, photo: t.photo.trim(), visible: t.visible };
    return { id: { ...shared, quote, role }, en: { ...shared, quote: t.quoteEn.trim() || quote, role: t.roleEn.trim() || role } };
  });

  const build = (locale: "id" | "en") => ({
    ...base[locale],
    heroSlidesDesktop: desktop.map((s) => s[locale]),
    heroSlidesMobile: mobile.map((s) => s[locale]),
    featuredVideo: { youtubeId: video, title: locale === "id" ? videoTitle : data.videoTitleEn.trim() || videoTitle },
    impactMap: { ...base[locale].impactMap, heading: locale === "id" ? mapHeading : data.mapHeadingEn.trim() || mapHeading, stats: stats.map((s) => s[locale]) },
    testimonials: { ...base[locale].testimonials, items: testimonials.map((t) => t[locale]) },
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
