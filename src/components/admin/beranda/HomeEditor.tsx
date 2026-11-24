"use client";

import { DndContext, type DragEndEvent, PointerSensor, closestCenter, useSensor, useSensors } from "@dnd-kit/core";
import { SortableContext, arrayMove, rectSortingStrategy, useSortable, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical } from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useId, useState } from "react";

import { discardHomeDraftAction, publishHomeAction, saveHomeDraftAction } from "@/app/admin/(panel)/beranda/actions";
import { ConfirmDialog } from "@/components/admin/ConfirmDialog";
import { LangFlag, LangText } from "@/components/admin/LangFlag";
import { Dialog } from "@/components/admin/Dialog";
import { PageHeader } from "@/components/admin/PageHeader";
import { SORT_INSTRUCTIONS, arrowStep, moveById } from "@/components/admin/sortable";
import { useToast } from "@/components/admin/Toast";
import { MediaPicker } from "@/components/admin/publikasi/MediaPicker";
import { RichTextEditor } from "@/components/admin/publikasi/RichTextEditor";
import { mediaUrl } from "@/lib/media";
import { paragraphsToHtml, visibleText } from "@/lib/rich-text";
import { youtubeId } from "@/lib/youtube";
import type { MediaChoice } from "@/types/admin-posts";
import type { EditorSlide, EditorTestimonial, HomeEditorData } from "@/types/admin-home";

type Device = "desktop" | "mobile";
type BannerLang = "id" | "en";

const card = "rounded-xl border border-admin-line bg-white p-5 sm:p-[22px]";
const h2 = "text-lg font-extrabold text-admin-ink";
const labelClass = "text-xs font-bold text-admin-text";
const field =
  "min-h-11 w-full rounded-admin border border-admin-field bg-white px-3 text-sm text-admin-ink focus-visible:outline-2 focus-visible:outline-primary";
const ghostBtn =
  "inline-flex min-h-11 items-center justify-center rounded-admin border border-admin-field bg-white px-4 text-sm font-bold text-admin-ink hover:bg-admin-canvas focus-visible:outline-2 focus-visible:outline-primary disabled:opacity-50";
const primaryBtn =
  "inline-flex min-h-11 items-center justify-center rounded-admin bg-primary px-4.5 text-sm font-extrabold text-white hover:bg-admin-primary-dark focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary disabled:opacity-60";
const smallBtn =
  "inline-flex min-h-11 items-center justify-center rounded-lg border border-admin-field bg-white px-3 text-[13px] font-bold text-admin-ink hover:bg-admin-canvas focus-visible:outline-2 focus-visible:outline-primary";
const handleBtn =
  "flex size-11 shrink-0 cursor-grab touch-none items-center justify-center rounded-lg text-admin-sidebar-muted hover:bg-admin-neutral-bg hover:text-admin-ink focus-visible:outline-2 focus-visible:outline-primary active:cursor-grabbing";

const dateFmt = new Intl.DateTimeFormat("id-ID", { timeZone: "Asia/Jakarta", day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
const wib = (value: string) => new Date(`${value}:00+07:00`);

/** Keterangan jadwal tayang satu slide + statusnya terhadap `now`. */
function slideWindow(s: EditorSlide, now: number): { text: string; state: "active" | "upcoming" | "ended" } {
  const start = s.startsAt ? wib(s.startsAt) : null;
  const end = s.endsAt ? wib(s.endsAt) : null;
  const state = end && end.getTime() <= now ? "ended" : start && start.getTime() > now ? "upcoming" : "active";
  const text = !start && !end ? "Selalu" : `${start ? dateFmt.format(start) : "sekarang"} – ${end ? dateFmt.format(end) : "tanpa batas"}`;
  return { text, state };
}

/** Kelola Beranda (artboard "A5"): slider kampanye, Jejak Sebaran Kebaikan, video, dan testimoni. */
export function HomeEditor({ initial, hasDraft: initialDraft }: { initial: HomeEditorData; hasDraft: boolean }) {
  const router = useRouter();
  const toast = useToast();
  const slideDndId = useId();
  const testiDndId = useId();
  const headingId = useId();
  const headingEnId = useId();
  const videoId = useId();
  const videoTitleId = useId();
  const videoTitleEnId = useId();

  const [data, setData] = useState(initial);
  const [hasDraft, setHasDraft] = useState(initialDraft);
  const [dirty, setDirty] = useState(false);
  const [busy, setBusy] = useState<"preview" | "publish" | "discard" | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [device, setDevice] = useState<Device>("desktop");
  const [bannerLang, setBannerLang] = useState<BannerLang>("id");
  const [slideDialog, setSlideDialog] = useState<{ device: Device; lang: BannerLang; slide: EditorSlide; isNew: boolean } | null>(null);
  const [testiDialog, setTestiDialog] = useState<{ item: EditorTestimonial; isNew: boolean } | null>(null);
  const [confirm, setConfirm] = useState<{ kind: "slide"; device: Device; lang: BannerLang; id: string } | { kind: "testimonial"; id: string } | { kind: "discard" } | null>(null);
  const [now] = useState(() => Date.now());

  const [announce, setAnnounce] = useState("");
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 4 } }));

  useEffect(() => {
    if (!dirty) return;
    const warn = (e: BeforeUnloadEvent) => e.preventDefault();
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty]);

  const update = (patch: Partial<HomeEditorData>) => {
    setData((d) => ({ ...d, ...patch }));
    setDirty(true);
    setError(null);
  };
  const slideKey = (d: Device, lang: BannerLang) =>
    lang === "id" ? (d === "desktop" ? "slidesDesktop" : "slidesMobile") : d === "desktop" ? "slidesDesktopEn" : "slidesMobileEn";
  const slides = data[slideKey(device, bannerLang)];

  const reorder = <T extends { id: string }>(list: T[], { active, over }: DragEndEvent): T[] | null => {
    if (!over || active.id === over.id) return null;
    const from = list.findIndex((x) => x.id === active.id);
    const to = list.findIndex((x) => x.id === over.id);
    return from >= 0 && to >= 0 ? arrayMove(list, from, to) : null;
  };

  const preview = async () => {
    setBusy("preview");
    const tab = window.open("about:blank", "_blank");
    try {
      const result = await saveHomeDraftAction(data);
      if (!result.ok) {
        tab?.close();
        setError(result.error);
        toast.show(result.error, "error");
        return;
      }
      setHasDraft(true);
      setDirty(false);
      if (tab) tab.location.href = "/api/preview/?home=1";
      else window.open("/api/preview/?home=1", "_self");
    } catch {
      tab?.close();
      toast.show("Gagal menyimpan draf untuk pratinjau. Coba lagi.", "error");
    } finally {
      setBusy(null);
    }
  };

  const publish = async () => {
    setBusy("publish");
    try {
      const result = await publishHomeAction(data);
      if (result.ok) {
        setDirty(false);
        setHasDraft(false);
        setError(null);
        toast.show("Perubahan beranda diterbitkan.", "success");
        router.refresh();
      } else {
        setError(result.error);
        toast.show(result.error, "error");
      }
    } catch {
      toast.show("Gagal menerbitkan. Periksa koneksi lalu coba lagi.", "error");
    } finally {
      setBusy(null);
    }
  };

  const discard = async () => {
    setBusy("discard");
    try {
      await discardHomeDraftAction();
      // Muat ulang agar isian kembali ke versi yang sedang terbit.
      setDirty(false);
      window.location.reload();
    } catch {
      toast.show("Gagal membuang draf. Coba lagi.", "error");
      setBusy(null);
      setConfirm(null);
    }
  };

  const confirmCopy =
    confirm?.kind === "slide"
      ? { title: "Hapus slide ini?", description: "Slide dihapus dari slider saat perubahan diterbitkan.", label: "Hapus slide" }
      : confirm?.kind === "testimonial"
        ? { title: "Hapus testimoni ini?", description: "Untuk menyembunyikan sementara, cukup hilangkan centang Tampil.", label: "Hapus testimoni" }
        : { title: "Buang draf beranda?", description: "Semua perubahan yang belum diterbitkan dibuang; isian kembali ke versi yang sedang terbit.", label: "Buang draf" };

  const onConfirm = () => {
    if (!confirm) return;
    if (confirm.kind === "discard") {
      void discard();
      return;
    }
    if (confirm.kind === "slide") {
      const key = slideKey(confirm.device, confirm.lang);
      update({ [key]: data[key].filter((s) => s.id !== confirm.id) });
    }
    else update({ testimonials: data.testimonials.filter((t) => t.id !== confirm.id) });
    setConfirm(null);
  };

  const videoOk = youtubeId(data.videoUrl) !== null;

  return (
    <>
      <PageHeader
        title="Kelola Beranda"
        description="Banner Indonesia dan English, teks, pilar, publikasi, testimoni, dan laporan."
        actions={
          <>
            {hasDraft ? (
              <button type="button" className={ghostBtn} disabled={busy !== null} onClick={() => setConfirm({ kind: "discard" })}>
                Buang draf
              </button>
            ) : null}
            <button type="button" className={ghostBtn} disabled={busy !== null} onClick={() => void preview()}>
              {busy === "preview" ? "Menyiapkan…" : "Pratinjau"}
            </button>
            <button type="button" className={primaryBtn} disabled={busy !== null} onClick={() => void publish()}>
              {busy === "publish" ? "Menerbitkan…" : "Terbitkan Perubahan"}
            </button>
          </>
        }
      />

      <p role="status" className={`-mt-3 text-[13px] font-semibold ${dirty || hasDraft ? "text-admin-warn-text" : "text-admin-text"}`}>
        {dirty
          ? "Ada perubahan yang belum disimpan. Pratinjau menyimpannya sebagai draf; Terbitkan Perubahan menayangkannya."
          : hasDraft
            ? "Menampilkan draf yang belum diterbitkan. Beranda publik masih versi sebelumnya."
            : "Sesuai dengan beranda yang sedang terbit."}
      </p>
      {error ? (
        <p role="alert" className="rounded-admin border border-admin-danger bg-admin-danger-bg p-3 text-sm font-semibold text-admin-danger">
          {error}
        </p>
      ) : null}
      <p role="status" aria-live="polite" className="sr-only" data-sort-status>
        {announce}
      </p>

      <section className={card} aria-labelledby={`${headingId}-intro`}>
        <h2 id={`${headingId}-intro`} className={h2}>
          Teks pembuka
        </h2>
        <p className="mt-1 text-[13px] text-admin-text">Judul dan paragraf di bawah slider. Paragraf memakai editor visual.</p>
        <div className="mt-3.5 grid gap-3 sm:grid-cols-2">
          <div>
            <label htmlFor={`${headingId}-eye`} className={labelClass}>
              Baris kecil
            </label>
            <input id={`${headingId}-eye`} value={data.introEyebrow} onChange={(e) => update({ introEyebrow: e.target.value })} className={`${field} mt-1`} />
          </div>
          <div>
            <label htmlFor={`${headingId}-eye-en`} className={labelClass}>
              <LangText text="Baris kecil (English)" />
            </label>
            <input id={`${headingId}-eye-en`} value={data.introEyebrowEn} onChange={(e) => update({ introEyebrowEn: e.target.value })} className={`${field} mt-1`} />
          </div>
          <div>
            <label htmlFor={`${headingId}-lead`} className={labelClass}>
              Judul
            </label>
            <input id={`${headingId}-lead`} value={data.introHeading} onChange={(e) => update({ introHeading: e.target.value })} className={`${field} mt-1 font-semibold`} />
          </div>
          <div>
            <label htmlFor={`${headingId}-lead-en`} className={labelClass}>
              <LangText text="Judul (English)" />
            </label>
            <input id={`${headingId}-lead-en`} value={data.introHeadingEn} onChange={(e) => update({ introHeadingEn: e.target.value })} className={`${field} mt-1`} />
          </div>
        </div>
        <div className="mt-4 grid gap-4 lg:grid-cols-2">
          <div>
            <p className={labelClass}>Paragraf</p>
            <RichTextEditor initialJson={null} initialHtml={data.introHtml} editable preset="text" ariaLabel="Paragraf teks pembuka" onChange={({ html }) => update({ introHtml: html })} />
          </div>
          <div>
            <p className={`${labelClass} inline-flex items-center gap-1.5`}><LangText text="Paragraf (English)" /></p>
            <RichTextEditor initialJson={null} initialHtml={data.introHtmlEn} editable preset="text" ariaLabel="Paragraf teks pembuka bahasa Inggris" onChange={({ html }) => update({ introHtmlEn: html })} />
          </div>
        </div>
      </section>

      {/* ---------- Slider kampanye ---------- */}
      <section className={card} aria-labelledby={`${slideDndId}-h`}>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 id={`${slideDndId}-h`} className={h2}>
            Slider kampanye
          </h2>
          <div className="flex flex-wrap gap-2">
            <div role="tablist" aria-label="Bahasa banner" className="flex rounded-admin bg-admin-canvas p-1">
              {(["id", "en"] as const).map((lang) => (
                <button
                  key={lang}
                  type="button"
                  role="tab"
                  aria-selected={bannerLang === lang}
                  onClick={() => setBannerLang(lang)}
                  className={`min-h-11 rounded-lg px-3.5 text-[13px] focus-visible:outline-2 focus-visible:outline-primary ${
                    bannerLang === lang ? "bg-white font-extrabold text-admin-ink shadow-sm" : "font-bold text-admin-text"
                  }`}
                >
                  <LangFlag lang={lang} />
                </button>
              ))}
            </div>
            <div role="tablist" aria-label="Perangkat" className="flex rounded-admin bg-admin-canvas p-1">
            {(["desktop", "mobile"] as const).map((d) => (
              <button
                key={d}
                type="button"
                role="tab"
                aria-selected={device === d}
                onClick={() => setDevice(d)}
                className={`min-h-11 rounded-lg px-3.5 text-[13px] focus-visible:outline-2 focus-visible:outline-primary ${
                  device === d ? "bg-white font-extrabold text-admin-ink shadow-sm" : "font-bold text-admin-text"
                }`}
              >
                {d === "desktop" ? "Desktop" : "Mobile"} ({data[slideKey(d, bannerLang)].length})
              </button>
            ))}
            </div>
          </div>
        </div>
        <p className="mt-1 text-[13px] text-admin-text">
          {bannerLang === "id" ? "Banner bahasa Indonesia. " : "Banner bahasa English. Jika dikosongkan saat terbit, situs English memakai banner Indonesia. "}
          {device === "desktop" ? "Lanskap (±1193×620) untuk layar ≥768px." : "Potret (1080×1350) untuk ponsel. Judul dan tautan opsional."}
        </p>

        <DndContext
          id={`${slideDndId}-${bannerLang}-${device}`}
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={(e) => {
            const next = reorder(slides, e);
            if (next) update({ [slideKey(device, bannerLang)]: next });
          }}
          accessibility={{ screenReaderInstructions: SORT_INSTRUCTIONS }}
        >
          <SortableContext items={slides.map((s) => s.id)} strategy={rectSortingStrategy}>
            <ol className="mt-4 grid gap-3.5 sm:grid-cols-2 xl:grid-cols-4" aria-label={`Slide ${device}, berurutan`}>
              {slides.map((s, i) => (
                <SlideCard
                  key={s.id}
                  slide={s}
                  index={i}
                  device={device}
                  now={now}
                  onMove={(step) => {
                    const moved = moveById(slides, s.id, step);
                    if (!moved) return;
                    update({ [slideKey(device, bannerLang)]: moved.list });
                    setAnnounce(`Slide ${s.title || "tanpa judul"} dipindah ke posisi ${moved.position} dari ${slides.length}.`);
                  }}
                  onEdit={() => setSlideDialog({ device, lang: bannerLang, slide: s, isNew: false })}
                  onRemove={() => setConfirm({ kind: "slide", device, lang: bannerLang, id: s.id })}
                />
              ))}
            </ol>
          </SortableContext>
        </DndContext>
        {slides.length === 0 ? <p className="mt-4 rounded-admin bg-admin-canvas p-4 text-center text-sm text-admin-text">Belum ada slide {device}.</p> : null}
        <button
          type="button"
          onClick={() =>
            setSlideDialog({ device, lang: bannerLang, isNew: true, slide: { id: crypto.randomUUID(), image: "", href: "", startsAt: "", endsAt: "", title: "" } })
          }
          className="mt-3 min-h-11 rounded-admin border border-dashed border-admin-sidebar-muted bg-white px-3.5 text-[13px] font-bold text-admin-neutral-text hover:border-primary hover:text-primary focus-visible:outline-2 focus-visible:outline-primary"
        >
          + Tambah slide
        </button>
      </section>

      <div className="grid gap-5 lg:grid-cols-2">
        {/* ---------- Jejak Sebaran Kebaikan + video ---------- */}
        <section className={card} aria-labelledby={`${headingId}-h`}>
          <h2 id={`${headingId}-h`} className={h2}>
            Jejak Sebaran Kebaikan
          </h2>
          <p className="mt-1 text-[13px] text-admin-text">Gambar English yang dikosongkan memakai gambar Indonesia.</p>
          <div className="mt-3.5 grid gap-3 sm:grid-cols-2">
            <ImagePick
              label="Gambar peta (Indonesia)"
              value={data.mapImage}
              onPick={(m) => update({ mapImage: m.url, mapWidth: m.width || data.mapWidth, mapHeight: m.height || data.mapHeight, mapAlt: data.mapAlt || m.alt })}
            />
            <ImagePick
              label="Gambar peta (English)"
              value={data.mapImageEn}
              onPick={(m) => update({ mapImageEn: m.url, mapWidthEn: m.width || data.mapWidthEn || data.mapWidth, mapHeightEn: m.height || data.mapHeightEn || data.mapHeight })}
              onClear={() => update({ mapImageEn: "" })}
            />
          </div>
          <div className="mt-3.5 grid gap-3 sm:grid-cols-2">
            <div>
              <label htmlFor={`${headingId}-alt`} className={labelClass}>
                Teks alt peta
              </label>
              <input id={`${headingId}-alt`} value={data.mapAlt} onChange={(e) => update({ mapAlt: e.target.value })} className={`${field} mt-1`} />
            </div>
            <div>
              <label htmlFor={`${headingId}-alt-en`} className={labelClass}>
                <LangText text="Teks alt peta (English)" />
              </label>
              <input id={`${headingId}-alt-en`} value={data.mapAltEn} onChange={(e) => update({ mapAltEn: e.target.value })} className={`${field} mt-1`} />
            </div>
          </div>
          <div className="mt-3.5 grid gap-3 sm:grid-cols-2">
            <div>
              <label htmlFor={headingId} className={labelClass}>
                Judul panel
              </label>
              <input id={headingId} value={data.mapHeading} onChange={(e) => update({ mapHeading: e.target.value })} className={`${field} mt-1 font-semibold`} />
            </div>
            <div>
              <label htmlFor={headingEnId} className={labelClass}>
                <LangText text="Judul panel (English)" />
              </label>
              <input id={headingEnId} value={data.mapHeadingEn} onChange={(e) => update({ mapHeadingEn: e.target.value })} className={`${field} mt-1`} />
            </div>
          </div>
          <ul className="mt-3 grid gap-3 sm:grid-cols-2">
            {data.stats.map((st, i) => {
              const set = (patch: Partial<typeof st>) => update({ stats: data.stats.map((x, j) => (j === i ? { ...x, ...patch } : x)) });
              return (
                <li key={i} className="rounded-admin border border-admin-line p-3">
                  <fieldset className="min-w-0">
                    <legend className="sr-only">Statistik {i + 1}</legend>
                    <label className={labelClass}>
                      Angka
                      <input value={st.value} onChange={(e) => set({ value: e.target.value })} className={`${field} mt-1 text-base font-extrabold`} />
                    </label>
                    <label className={`${labelClass} mt-2 block`}>
                      Label
                      <input value={st.label} onChange={(e) => set({ label: e.target.value })} className={`${field} mt-1`} />
                    </label>
                    <label className={`${labelClass} mt-2 block`}>
                      <LangText text="Label (English)" />
                      <input value={st.labelEn} onChange={(e) => set({ labelEn: e.target.value })} className={`${field} mt-1`} />
                    </label>
                    <div className="mt-2 grid min-w-0 gap-3 sm:grid-cols-2">
                      <ImagePick label="Ikon (Indonesia)" value={st.icon} onPick={(m) => set({ icon: m.url })} />
                      <ImagePick label="Ikon (English)" value={st.iconEn} onPick={(m) => set({ iconEn: m.url })} onClear={() => set({ iconEn: "" })} />
                    </div>
                  </fieldset>
                </li>
              );
            })}
          </ul>

          <h3 className="mt-5 text-sm font-extrabold text-admin-ink">Video unggulan (YouTube)</h3>
          <label htmlFor={videoId} className={`${labelClass} mt-2 block`}>
            URL video
          </label>
          <input
            id={videoId}
            value={data.videoUrl}
            onChange={(e) => update({ videoUrl: e.target.value })}
            inputMode="url"
            aria-invalid={videoOk ? undefined : true}
            aria-describedby={`${videoId}-help`}
            className={`${field} mt-1`}
          />
          <p id={`${videoId}-help`} className={`mt-1 text-xs ${videoOk ? "text-admin-text" : "font-semibold text-admin-danger"}`}>
            {videoOk ? "Contoh: https://www.youtube.com/watch?v=… atau https://youtu.be/…" : "URL ini bukan tautan video YouTube yang dikenali."}
          </p>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <div>
              <label htmlFor={videoTitleId} className={labelClass}>
                Judul video (untuk pembaca layar)
              </label>
              <input id={videoTitleId} value={data.videoTitle} onChange={(e) => update({ videoTitle: e.target.value })} className={`${field} mt-1`} />
            </div>
            <div>
              <label htmlFor={videoTitleEnId} className={labelClass}>
                <LangText text="Judul video (English)" />
              </label>
              <input id={videoTitleEnId} value={data.videoTitleEn} onChange={(e) => update({ videoTitleEn: e.target.value })} className={`${field} mt-1`} />
            </div>
          </div>
        </section>

        {/* ---------- Testimoni ---------- */}
        <section className={card} aria-labelledby={`${testiDndId}-h`}>
          <div className="flex items-center justify-between gap-3">
            <h2 id={`${testiDndId}-h`} className={h2}>
              Testimoni
            </h2>
            <button
              type="button"
              className={smallBtn}
              onClick={() => setTestiDialog({ isNew: true, item: { id: crypto.randomUUID(), name: "", photo: "", photoEn: "", visible: true, quote: "", quoteEn: "", role: "", roleEn: "" } })}
            >
              + Tambah
            </button>
          </div>
          <p className="mt-1 text-[13px] text-admin-text">Judul bagian dan daftar kutipan. Daftar ini juga dipakai halaman Kemitraan.</p>
          <div className="mt-3.5 grid gap-3 sm:grid-cols-2">
            <div>
              <label htmlFor={`${testiDndId}-h1`} className={labelClass}>
                Judul bagian
              </label>
              <input id={`${testiDndId}-h1`} value={data.testimonialsHeading} onChange={(e) => update({ testimonialsHeading: e.target.value })} className={`${field} mt-1`} />
            </div>
            <div>
              <label htmlFor={`${testiDndId}-h1e`} className={labelClass}>
                <LangText text="Judul bagian (English)" />
              </label>
              <input id={`${testiDndId}-h1e`} value={data.testimonialsHeadingEn} onChange={(e) => update({ testimonialsHeadingEn: e.target.value })} className={`${field} mt-1`} />
            </div>
            <div>
              <label htmlFor={`${testiDndId}-d`} className={labelClass}>
                Deskripsi
              </label>
              <textarea id={`${testiDndId}-d`} value={data.testimonialsDescription} onChange={(e) => update({ testimonialsDescription: e.target.value })} rows={3} className={`${field} mt-1 py-2 leading-normal`} />
            </div>
            <div>
              <label htmlFor={`${testiDndId}-de`} className={labelClass}>
                <LangText text="Deskripsi (English)" />
              </label>
              <textarea id={`${testiDndId}-de`} value={data.testimonialsDescriptionEn} onChange={(e) => update({ testimonialsDescriptionEn: e.target.value })} rows={3} className={`${field} mt-1 py-2 leading-normal`} />
            </div>
          </div>
          <DndContext
            id={testiDndId}
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={(e) => {
              const next = reorder(data.testimonials, e);
              if (next) update({ testimonials: next });
            }}
            accessibility={{ screenReaderInstructions: SORT_INSTRUCTIONS }}
          >
            <SortableContext items={data.testimonials.map((t) => t.id)} strategy={verticalListSortingStrategy}>
              <ol className="mt-3.5 flex flex-col gap-2.5" aria-label="Testimoni, berurutan">
                {data.testimonials.map((t, i) => (
                  <TestimonialRow
                    key={t.id}
                    item={t}
                    index={i}
                    onMove={(step) => {
                      const moved = moveById(data.testimonials, t.id, step);
                      if (!moved) return;
                      update({ testimonials: moved.list });
                      setAnnounce(`Testimoni ${t.name} dipindah ke posisi ${moved.position} dari ${data.testimonials.length}.`);
                    }}
                    onEdit={() => setTestiDialog({ item: t, isNew: false })}
                    onRemove={() => setConfirm({ kind: "testimonial", id: t.id })}
                    onToggle={(visible) => update({ testimonials: data.testimonials.map((x) => (x.id === t.id ? { ...x, visible } : x)) })}
                  />
                ))}
              </ol>
            </SortableContext>
          </DndContext>
          {data.testimonials.length === 0 ? <p className="mt-4 rounded-admin bg-admin-canvas p-4 text-center text-sm text-admin-text">Belum ada testimoni.</p> : null}
        </section>
      </div>

      <section className={card} aria-labelledby={`${headingId}-pillars`}>
        <h2 id={`${headingId}-pillars`} className={h2}>
          Pilar program
        </h2>
        <div className="mt-3.5 grid gap-3 sm:grid-cols-2">
          <Field label="Judul baris 1" value={data.pillarsHeading1} onChange={(pillarsHeading1) => update({ pillarsHeading1 })} />
          <Field label="Judul baris 1 (English)" value={data.pillarsHeading1En} onChange={(pillarsHeading1En) => update({ pillarsHeading1En })} />
          <Field label="Judul baris 2" value={data.pillarsHeading2} onChange={(pillarsHeading2) => update({ pillarsHeading2 })} />
          <Field label="Judul baris 2 (English)" value={data.pillarsHeading2En} onChange={(pillarsHeading2En) => update({ pillarsHeading2En })} />
          <Field label="Teks tombol" value={data.pillarsCtaLabel} onChange={(pillarsCtaLabel) => update({ pillarsCtaLabel })} />
          <Field label="Teks tombol (English)" value={data.pillarsCtaLabelEn} onChange={(pillarsCtaLabelEn) => update({ pillarsCtaLabelEn })} />
          <Field label="Tautan tombol" value={data.pillarsCtaHref} onChange={(pillarsCtaHref) => update({ pillarsCtaHref })} />
        </div>
        <ul className="mt-4 grid gap-3 lg:grid-cols-2">
          {data.pillars.map((item, i) => {
            const set = (patch: Partial<typeof item>) => update({ pillars: data.pillars.map((x, j) => (j === i ? { ...x, ...patch } : x)) });
            return (
              <li key={item.href || i} className="rounded-admin border border-admin-line p-3">
                <p className="text-sm font-extrabold text-admin-ink">Kartu {i + 1}</p>
                <div className="mt-2 grid gap-3 sm:grid-cols-2">
                  <ImagePick label="Gambar (Indonesia)" value={item.image} onPick={(m) => set({ image: m.url })} />
                  <ImagePick label="Gambar (English)" value={item.imageEn} onPick={(m) => set({ imageEn: m.url })} onClear={() => set({ imageEn: "" })} />
                </div>
                <div className="mt-3 grid gap-3">
                  <Field label="Judul" value={item.title} onChange={(title) => set({ title })} />
                  <Field label="Judul (English)" value={item.titleEn} onChange={(titleEn) => set({ titleEn })} />
                  <Field label="Deskripsi" value={item.description} onChange={(description) => set({ description })} multiline />
                  <Field label="Deskripsi (English)" value={item.descriptionEn} onChange={(descriptionEn) => set({ descriptionEn })} multiline />
                  <Field label="Tautan" value={item.href} onChange={(href) => set({ href })} />
                </div>
              </li>
            );
          })}
        </ul>
      </section>

      <section className={card} aria-labelledby={`${headingId}-pubs`}>
        <h2 id={`${headingId}-pubs`} className={h2}>
          Publikasi
        </h2>
        <p className="mt-1 text-[13px] text-admin-text">Kartu berita diambil otomatis. Yang diatur di sini judul, tombol, dan jumlah kartu.</p>
        <div className="mt-3.5 grid gap-3 sm:grid-cols-2">
          <Field label="Judul" value={data.publicationsHeading} onChange={(publicationsHeading) => update({ publicationsHeading })} />
          <Field label="Judul (English)" value={data.publicationsHeadingEn} onChange={(publicationsHeadingEn) => update({ publicationsHeadingEn })} />
          <Field label="Teks tombol" value={data.publicationsCtaLabel} onChange={(publicationsCtaLabel) => update({ publicationsCtaLabel })} />
          <Field label="Teks tombol (English)" value={data.publicationsCtaLabelEn} onChange={(publicationsCtaLabelEn) => update({ publicationsCtaLabelEn })} />
          <Field label="Tautan tombol" value={data.publicationsCtaHref} onChange={(publicationsCtaHref) => update({ publicationsCtaHref })} />
          <div>
            <label htmlFor={`${headingId}-count`} className={labelClass}>
              Jumlah kartu
            </label>
            <input
              id={`${headingId}-count`}
              type="number"
              min={1}
              max={12}
              value={data.publicationsCount}
              onChange={(e) => update({ publicationsCount: Number(e.target.value) })}
              className={`${field} mt-1`}
            />
          </div>
        </div>
      </section>

      <section className={card} aria-labelledby={`${headingId}-report`}>
        <h2 id={`${headingId}-report`} className={h2}>
          Laporan penyaluran
        </h2>
        <p className="mt-1 text-[13px] text-admin-text">Gambar English yang dikosongkan memakai gambar Indonesia.</p>
        <div className="mt-3.5 grid gap-3 sm:grid-cols-2">
          <ImagePick label="Gambar latar (Indonesia)" value={data.reportBackground} onPick={(m) => update({ reportBackground: m.url })} />
          <ImagePick label="Gambar latar (English)" value={data.reportBackgroundEn} onPick={(m) => update({ reportBackgroundEn: m.url })} onClear={() => update({ reportBackgroundEn: "" })} />
        </div>
        <div className="mt-3.5 grid gap-3 sm:grid-cols-2">
          <Field label="Judul" value={data.reportHeading} onChange={(reportHeading) => update({ reportHeading })} />
          <Field label="Judul (English)" value={data.reportHeadingEn} onChange={(reportHeadingEn) => update({ reportHeadingEn })} />
          <Field label="Deskripsi" value={data.reportDescription} onChange={(reportDescription) => update({ reportDescription })} multiline />
          <Field label="Deskripsi (English)" value={data.reportDescriptionEn} onChange={(reportDescriptionEn) => update({ reportDescriptionEn })} multiline />
          <Field label="Teks tombol" value={data.reportCtaLabel} onChange={(reportCtaLabel) => update({ reportCtaLabel })} />
          <Field label="Teks tombol (English)" value={data.reportCtaLabelEn} onChange={(reportCtaLabelEn) => update({ reportCtaLabelEn })} />
          <Field label="Tautan tombol" value={data.reportCtaHref} onChange={(reportCtaHref) => update({ reportCtaHref })} />
        </div>
      </section>

      <Dialog open={slideDialog !== null} title={slideDialog?.isNew ? "Tambah slide" : "Edit slide"} onClose={() => setSlideDialog(null)}>
        {slideDialog ? (
          <SlideForm
            key={slideDialog.slide.id}
            slide={slideDialog.slide}
            device={slideDialog.device}
            onCancel={() => setSlideDialog(null)}
            onApply={(next) => {
              const key = slideKey(slideDialog.device, slideDialog.lang);
              update({ [key]: slideDialog.isNew ? [...data[key], next] : data[key].map((s) => (s.id === next.id ? next : s)) });
              setSlideDialog(null);
            }}
          />
        ) : null}
      </Dialog>
      <Dialog open={testiDialog !== null} title={testiDialog?.isNew ? "Tambah testimoni" : "Edit testimoni"} onClose={() => setTestiDialog(null)} size="xl">
        {testiDialog ? (
          <TestimonialForm
            key={testiDialog.item.id}
            item={testiDialog.item}
            onCancel={() => setTestiDialog(null)}
            onApply={(next) => {
              update({ testimonials: testiDialog.isNew ? [...data.testimonials, next] : data.testimonials.map((t) => (t.id === next.id ? next : t)) });
              setTestiDialog(null);
            }}
          />
        ) : null}
      </Dialog>
      <ConfirmDialog
        open={confirm !== null}
        title={confirmCopy.title}
        description={confirmCopy.description}
        confirmLabel={confirmCopy.label}
        tone="danger"
        busy={busy === "discard"}
        onConfirm={onConfirm}
        onCancel={() => setConfirm(null)}
      />
    </>
  );
}

const STATE_BADGE = {
  active: null,
  upcoming: { label: "Terjadwal", className: "bg-admin-info-bg text-admin-info-text" },
  ended: { label: "Berakhir", className: "bg-admin-neutral-bg text-admin-neutral-text" },
} as const;

function SlideCard({ slide, index, device, now, onMove, onEdit, onRemove }: { slide: EditorSlide; index: number; device: Device; now: number; onMove: (step: -1 | 1) => void; onEdit: () => void; onRemove: () => void }) {
  const { attributes, listeners, setNodeRef, setActivatorNodeRef, transform, transition, isDragging } = useSortable({ id: slide.id });
  const name = slide.title || `Slide ${index + 1}`;
  const win = slideWindow(slide, now);
  const badge = STATE_BADGE[win.state];
  return (
    <li
      ref={setNodeRef}
      style={{ transform: CSS.Translate.toString(transform), transition }}
      className={`flex flex-col overflow-hidden rounded-xl border border-admin-line bg-white ${isDragging ? "relative z-10 shadow-admin-card" : ""} ${win.state === "ended" ? "opacity-70" : ""}`}
    >
      <div className={`relative bg-admin-neutral-bg ${device === "desktop" ? "aspect-5/3" : "aspect-4/5"}`}>
        <Image src={mediaUrl(slide.image)} alt="" fill sizes="(min-width: 1280px) 280px, 45vw" className="object-cover" />
        <span aria-hidden="true" className="absolute top-2 left-2 flex size-6 items-center justify-center rounded-md bg-admin-sidebar text-xs font-extrabold text-white">
          {index + 1}
        </span>
        <button
          ref={setActivatorNodeRef}
          type="button"
          {...attributes}
          {...listeners}
          onKeyDown={(e) => {
            const step = arrowStep(e);
            if (!step) return;
            e.preventDefault();
            onMove(step);
          }}
          aria-label={`Geser slide ${index + 1}: ${name}`}
          className={`${handleBtn} absolute top-1 right-1 bg-white/90 text-admin-ink`}
        >
          <GripVertical aria-hidden="true" size={18} />
        </button>
      </div>
      <div className="flex flex-1 flex-col p-3">
        <p className="text-sm font-extrabold text-admin-ink">
          {slide.title || <span className="font-semibold text-admin-text">(tanpa judul)</span>}
          {badge ? <span className={`ml-2 rounded-full px-2 py-0.5 text-[11px] font-bold ${badge.className}`}>{badge.label}</span> : null}
        </p>
        <p className="mt-1 truncate text-xs text-admin-text">{slide.href || "Tanpa tautan"}</p>
        <p className="mt-2 flex-1 text-xs text-admin-text">Tayang: {win.text}</p>
        <div className="mt-2.5 flex gap-2">
          <button type="button" className={`${smallBtn} flex-1`} onClick={onEdit}>
            Edit<span className="sr-only"> slide {index + 1}: {name}</span>
          </button>
          <button type="button" className={`${smallBtn} flex-1 border-admin-danger text-admin-danger`} onClick={onRemove}>
            Hapus<span className="sr-only"> slide {index + 1}: {name}</span>
          </button>
        </div>
      </div>
    </li>
  );
}

function TestimonialRow({ item, index, onMove, onEdit, onRemove, onToggle }: { item: EditorTestimonial; index: number; onMove: (step: -1 | 1) => void; onEdit: () => void; onRemove: () => void; onToggle: (visible: boolean) => void }) {
  const { attributes, listeners, setNodeRef, setActivatorNodeRef, transform, transition, isDragging } = useSortable({ id: item.id });
  return (
    <li
      ref={setNodeRef}
      style={{ transform: CSS.Translate.toString(transform), transition }}
      className={`flex flex-wrap items-center gap-x-3 gap-y-1 rounded-xl border border-admin-line bg-white px-2.5 py-2 ${isDragging ? "relative z-10 shadow-admin-card" : ""} ${item.visible ? "" : "opacity-70"}`}
    >
      <button
        ref={setActivatorNodeRef}
        type="button"
        {...attributes}
        {...listeners}
        onKeyDown={(e) => {
            const step = arrowStep(e);
            if (!step) return;
            e.preventDefault();
            onMove(step);
          }}
        aria-label={`Geser testimoni ${index + 1}: ${item.name}`}
        className={handleBtn}
      >
        <GripVertical aria-hidden="true" size={18} />
      </button>
      <Image src={mediaUrl(item.photo)} alt="" width={40} height={40} className="size-10 shrink-0 rounded-full bg-admin-neutral-bg object-cover" />
      <span className="min-w-32 flex-1">
        <span className="block text-sm font-extrabold text-admin-ink">{item.name}</span>
        <span className="block text-xs text-admin-text">{item.role || "—"}</span>
      </span>
      <label className="flex min-h-11 items-center gap-1.5 text-xs font-bold text-admin-ink">
        <input type="checkbox" checked={item.visible} onChange={(e) => onToggle(e.target.checked)} className="size-4.5 accent-primary" />
        Tampil<span className="sr-only">kan testimoni {item.name}</span>
      </label>
      <button type="button" className={smallBtn} onClick={onEdit}>
        Edit<span className="sr-only"> testimoni {item.name}</span>
      </button>
      <button type="button" className={`${smallBtn} border-admin-danger text-admin-danger`} onClick={onRemove}>
        Hapus<span className="sr-only"> testimoni {item.name}</span>
      </button>
    </li>
  );
}

/** Tombol pilih gambar + pratinjau; teks alt dari pustaka dipakai sebagai judul bawaan bila judul kosong. */
function ImagePick({ label, value, round = false, onPick, onClear }: { label: string; value: string; round?: boolean; onPick: (media: MediaChoice) => void; onClear?: () => void }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="min-w-0">
      <p className={`${labelClass} inline-flex items-center gap-1.5`}>{typeof label === "string" ? <LangText text={label} /> : label}</p>
      <div className="mt-1 flex w-full min-w-0 flex-col items-start gap-2">
        {value ? (
          <span className={`relative block overflow-hidden bg-admin-neutral-bg ${round ? "size-16 rounded-full" : "h-20 w-full max-w-32 rounded-lg"}`}>
            <Image src={mediaUrl(value)} alt="" fill sizes="128px" className="object-cover" />
          </span>
        ) : (
          <span className={`flex items-center justify-center border border-dashed border-admin-field bg-admin-canvas text-xs font-semibold text-admin-text ${round ? "size-16 rounded-full" : "h-20 w-full max-w-32 rounded-lg"}`}>
            Belum ada
          </span>
        )}
        <span className="flex w-full min-w-0 flex-col items-stretch gap-2">
          <button type="button" className={smallBtn} onClick={() => setOpen(true)}>
            {value ? "Ganti gambar" : "Pilih gambar"}
          </button>
          {onClear && value ? (
            <button type="button" className={`${smallBtn} whitespace-normal text-left`} onClick={onClear}>
              <LangText text="Pakai gambar Indonesia" />
            </button>
          ) : null}
        </span>
      </div>
      <MediaPicker
        open={open}
        onClose={() => setOpen(false)}
        onSelect={(m) => {
          setOpen(false);
          onPick(m);
        }}
      />
    </div>
  );
}

function Field({ label, value, onChange, multiline = false }: { label: string; value: string; onChange: (value: string) => void; multiline?: boolean }) {
  const id = useId();
  return (
    <div>
      <label htmlFor={id} className={`${labelClass} inline-flex items-center gap-1.5`}>
        {typeof label === "string" ? <LangText text={label} /> : label}
      </label>
      {multiline ? (
        <textarea id={id} value={value} onChange={(e) => onChange(e.target.value)} rows={3} className={`${field} mt-1 py-2 leading-normal`} />
      ) : (
        <input id={id} value={value} onChange={(e) => onChange(e.target.value)} className={`${field} mt-1`} />
      )}
    </div>
  );
}

function FormFooter({ onCancel, onApply, disabled }: { onCancel: () => void; onApply: () => void; disabled: boolean }) {
  return (
    <div className="mt-1 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
      <button type="button" className={ghostBtn} onClick={onCancel}>
        Batal
      </button>
      <button type="button" className={primaryBtn} disabled={disabled} onClick={onApply}>
        Terapkan
      </button>
    </div>
  );
}

function SlideForm({ slide, device, onApply, onCancel }: { slide: EditorSlide; device: Device; onApply: (slide: EditorSlide) => void; onCancel: () => void }) {
  const [s, setS] = useState(slide);
  const id = useId();
  const need = device === "desktop";
  const hrefOk = !s.href.trim() || /^(\/(?!\/)|https:\/\/)/.test(s.href.trim());
  const rangeOk = !s.startsAt || !s.endsAt || wib(s.endsAt) > wib(s.startsAt);
  const ready = Boolean(s.image) && (!need || (s.title.trim() && s.href.trim())) && hrefOk && rangeOk;
  return (
    <div className="flex flex-col gap-4">
      <ImagePick label={need ? "Banner (lanskap)" : "Banner (potret)"} value={s.image} onPick={(m) => setS((x) => ({ ...x, image: m.url, title: x.title || m.alt }))} />
      <div>
        <label htmlFor={`${id}-t`} className={labelClass}>
          Judul kampanye / teks alt{need ? "" : " (opsional)"}
        </label>
        <input id={`${id}-t`} value={s.title} onChange={(e) => setS({ ...s, title: e.target.value })} maxLength={200} className={`${field} mt-1`} />
      </div>
      <div>
        <label htmlFor={`${id}-h`} className={labelClass}>
          Tautan{need ? "" : " (opsional)"}
        </label>
        <input
          id={`${id}-h`}
          value={s.href}
          onChange={(e) => setS({ ...s, href: e.target.value })}
          inputMode="url"
          placeholder="/campaign/…?source=webbanner"
          aria-invalid={hrefOk ? undefined : true}
          aria-describedby={`${id}-hh`}
          className={`${field} mt-1`}
        />
        <p id={`${id}-hh`} className={`mt-1 text-xs ${hrefOk ? "text-admin-text" : "font-semibold text-admin-danger"}`}>
          Diawali / (halaman situs atau aplikasi donasi) atau https://.
        </p>
      </div>
      <fieldset>
        <legend className={labelClass}>Jadwal tayang (WIB) — kosongkan untuk tayang terus</legend>
        <div className="mt-1 grid gap-3 sm:grid-cols-2">
          <label className={labelClass}>
            Mulai
            <input type="datetime-local" value={s.startsAt} onChange={(e) => setS({ ...s, startsAt: e.target.value })} className={`${field} mt-1`} />
          </label>
          <label className={labelClass}>
            Selesai
            <input type="datetime-local" value={s.endsAt} onChange={(e) => setS({ ...s, endsAt: e.target.value })} aria-invalid={rangeOk ? undefined : true} className={`${field} mt-1`} />
          </label>
        </div>
        {rangeOk ? null : (
          <p role="alert" className="mt-1 text-xs font-semibold text-admin-danger">
            Selesai tayang harus setelah mulai tayang.
          </p>
        )}
      </fieldset>
      <FormFooter onCancel={onCancel} onApply={() => onApply(s)} disabled={!ready} />
    </div>
  );
}

function TestimonialForm({ item, onApply, onCancel }: { item: EditorTestimonial; onApply: (item: EditorTestimonial) => void; onCancel: () => void }) {
  const [t, setT] = useState(item);
  const id = useId();
  const ready = Boolean(t.photo && t.name.trim() && visibleText(t.quote));
  return (
    <div className="flex flex-col gap-4">
      <div className="grid gap-3 sm:grid-cols-2">
        <ImagePick label="Foto (Indonesia)" value={t.photo} round onPick={(m) => setT((x) => ({ ...x, photo: m.url }))} />
        <ImagePick label="Foto (English)" value={t.photoEn} round onPick={(m) => setT((x) => ({ ...x, photoEn: m.url }))} onClear={() => setT((x) => ({ ...x, photoEn: "" }))} />
      </div>
      <div>
        <label htmlFor={`${id}-n`} className={labelClass}>
          Nama
        </label>
        <input id={`${id}-n`} value={t.name} onChange={(e) => setT({ ...t, name: e.target.value })} maxLength={120} className={`${field} mt-1`} />
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label htmlFor={`${id}-r`} className={labelClass}>
            Peran
          </label>
          <input id={`${id}-r`} value={t.role} onChange={(e) => setT({ ...t, role: e.target.value })} maxLength={160} className={`${field} mt-1`} />
        </div>
        <div>
          <label htmlFor={`${id}-re`} className={labelClass}>
            <LangText text="Peran (English, opsional)" />
          </label>
          <input id={`${id}-re`} value={t.roleEn} onChange={(e) => setT({ ...t, roleEn: e.target.value })} maxLength={160} className={`${field} mt-1`} />
        </div>
      </div>
      <div>
        <p className={labelClass}>Kutipan</p>
        <RichTextEditor initialJson={null} initialHtml={paragraphsToHtml(item.quote ? [item.quote] : [])} editable preset="text" ariaLabel="Kutipan testimoni" onChange={({ html }) => setT((x) => ({ ...x, quote: html }))} />
      </div>
      <div>
        <p className={`${labelClass} inline-flex items-center gap-1.5`}><LangText text="Kutipan (English, opsional)" /></p>
        <RichTextEditor initialJson={null} initialHtml={paragraphsToHtml(item.quoteEn ? [item.quoteEn] : [])} editable preset="text" ariaLabel="Kutipan testimoni bahasa Inggris" onChange={({ html }) => setT((x) => ({ ...x, quoteEn: html }))} />
      </div>
      <label className="flex min-h-11 items-center gap-2.5 text-sm font-semibold text-admin-ink">
        <input type="checkbox" checked={t.visible} onChange={(e) => setT({ ...t, visible: e.target.checked })} className="size-4.5 accent-primary" />
        Tampilkan di situs
      </label>
      <FormFooter onCancel={onCancel} onApply={() => onApply(t)} disabled={!ready} />
    </div>
  );
}
