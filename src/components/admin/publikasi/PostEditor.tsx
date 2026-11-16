"use client";

import { ArrowLeft } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useEffectEvent, useId, useRef, useState } from "react";

import { savePostAction, trashPostAction } from "@/app/admin/(panel)/publikasi/actions";
import { ConfirmDialog } from "@/components/admin/ConfirmDialog";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { useToast } from "@/components/admin/Toast";
import { mediaUrl } from "@/lib/media";
import { htmlHasImageWithoutAlt } from "@/lib/seo-score";
import { slugProblem, slugify } from "@/lib/slug";
import type {
  CategoryOption,
  ContentStatus,
  EditorPost,
  MediaChoice,
  SaveField,
  SaveIntent,
  SavePostInput,
  TagRef,
  UserOption,
} from "@/types/admin-posts";

import { MediaPicker } from "./MediaPicker";
import { RevisionsDialog } from "./RevisionsDialog";
import { type EditorContentValue, RichTextEditor } from "./RichTextEditor";
import { SeoPanel } from "./SeoPanel";
import { TermsPanel } from "./TermsPanel";
import { unsupportedTags } from "./extensions";

export type EditorPermissions = {
  /** Boleh mengubah post ini sama sekali. */
  canEdit: boolean;
  canPublish: boolean;
  /** Editor/Super Admin: boleh mengganti penulis & reviewer. */
  canReview: boolean;
  /** Boleh mengubah canonical. */
  canSeo: boolean;
  canTrash: boolean;
};

const WIB_OFFSET_MS = 7 * 60 * 60 * 1000;
/** ISO (UTC) → nilai <input type="datetime-local"> dalam WIB. */
const toWibInput = (iso: string | null) => (iso ? new Date(new Date(iso).getTime() + WIB_OFFSET_MS).toISOString().slice(0, 16) : "");
const fromWibInput = (value: string) => new Date(`${value}:00+07:00`);

const timeFmt = new Intl.DateTimeFormat("id-ID", { timeZone: "Asia/Jakarta", hour: "2-digit", minute: "2-digit" });

const panel = "rounded-xl border border-admin-line bg-white p-4.5";
const panelTitle = "text-[15px] font-extrabold text-admin-ink";
const ghostBtn =
  "min-h-11 rounded-admin border border-admin-field bg-white px-4 text-sm font-bold text-admin-ink hover:bg-admin-canvas focus-visible:outline-2 focus-visible:outline-primary disabled:opacity-50";
const primaryBtn =
  "min-h-11 rounded-admin bg-primary px-4.5 text-sm font-extrabold text-white hover:bg-admin-primary-dark focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary disabled:opacity-60";
const field =
  "min-h-11 w-full rounded-lg border border-admin-field bg-white px-2.5 text-[13px] font-medium text-admin-ink focus-visible:outline-2 focus-visible:outline-primary disabled:bg-admin-canvas";

const SAVED_MESSAGE: Record<Exclude<SaveIntent, "autosave">, string> = {
  save: "Perubahan disimpan.",
  review: "Publikasi dikirim ke Review.",
  publish: "Publikasi diterbitkan.",
  schedule: "Publikasi dijadwalkan.",
  draft: "Publikasi dikembalikan ke draf.",
};

/** Editor publikasi (artboard "A3 · Editor Publikasi + SEO"). */
export function PostEditor({
  post,
  categories,
  users,
  perms,
  siteHost,
}: {
  post: EditorPost;
  categories: readonly CategoryOption[];
  users: readonly (UserOption & { reviewer: boolean })[];
  perms: EditorPermissions;
  siteHost: string;
}) {
  const router = useRouter();
  const toast = useToast();
  const titleId = useId();
  const slugId = useId();
  const excerptId = useId();
  const dateId = useId();
  const authorId = useId();
  const reviewerFieldId = useId();

  /* State tersimpan di server */
  const [id, setId] = useState(post.id);
  const [status, setStatus] = useState<ContentStatus>(post.status);
  const [savedAt, setSavedAt] = useState<{ at: string; auto: boolean } | null>(null);

  /* Isian */
  const [title, setTitle] = useState(post.title);
  const [slug, setSlug] = useState(post.slug);
  const [slugAuto, setSlugAuto] = useState(post.id === null);
  const [slugEditing, setSlugEditing] = useState(false);
  const [excerpt, setExcerpt] = useState(post.excerpt);
  const [publishAt, setPublishAt] = useState(toWibInput(post.publishedAt));
  /** Waktu pembanding "masa depan" untuk label Terbitkan/Jadwalkan; disegarkan saat tanggal diubah. */
  const [now, setNow] = useState(() => Date.now());
  const [author, setAuthor] = useState(post.authorId ?? "");
  const [reviewer, setReviewer] = useState(post.reviewerId ?? "");
  const [featured, setFeatured] = useState<MediaChoice | null>(post.featured);
  const [categoryIds, setCategoryIds] = useState<number[]>(post.categoryIds);
  const [tags, setTags] = useState<TagRef[]>(post.tags);
  const [newTags, setNewTags] = useState<string[]>([]);
  const [seoTitle, setSeoTitle] = useState(post.seoTitle);
  const [seoDescription, setSeoDescription] = useState(post.seoDescription);
  const [canonical, setCanonical] = useState(post.canonical);
  const [missingAlt, setMissingAlt] = useState(() => htmlHasImageWithoutAlt(post.contentHtml));

  /* Status UI */
  const [dirty, setDirty] = useState(false);
  const [tick, setTick] = useState(0);
  const [saving, setSaving] = useState<SaveIntent | null>(null);
  const [error, setError] = useState<{ message: string; field?: SaveField } | null>(null);
  const [pickingFeatured, setPickingFeatured] = useState(false);
  const [showRevisions, setShowRevisions] = useState(false);
  const [confirmTrash, setConfirmTrash] = useState(false);
  const [trashing, setTrashing] = useState(false);

  /* Isi editor disimpan di ref: berubah tiap ketikan dan tidak perlu memicu render. */
  const content = useRef<EditorContentValue | null>(null);
  const bodyDirty = useRef(false);
  const version = useRef(0);
  const busy = useRef(false);

  const readOnly = !perms.canEdit;
  const [lossy] = useState(() => (post.contentJson ? [] : unsupportedTags(post.contentHtml)));

  const touch = useCallback(() => {
    version.current += 1;
    setDirty(true);
    setTick((n) => n + 1);
    setError(null);
  }, []);

  const onBodyChange = useCallback(
    (value: EditorContentValue) => {
      content.current = value;
      bodyDirty.current = true;
      setMissingAlt(htmlHasImageWithoutAlt(value.html));
      touch();
    },
    [touch],
  );

  /** Bungkus setter isian agar setiap perubahan menandai form sebagai "belum disimpan". */
  function edit<T>(setter: (value: T) => void) {
    return (value: T) => {
      setter(value);
      touch();
    };
  }

  const onTitle = (value: string) => {
    setTitle(value);
    if (slugAuto) setSlug(slugify(value));
    touch();
  };

  /** Mengembalikan ID publikasi bila tersimpan, null bila gagal. */
  const save = async (intent: SaveIntent): Promise<number | null> => {
    if (busy.current || readOnly) return null;
    if (intent !== "autosave" && !slugAuto) {
      const problem = slug === post.slug ? null : slugProblem(slug);
      if (problem) {
        setError({ message: problem, field: "slug" });
        setSlugEditing(true);
        return null;
      }
    }
    busy.current = true;
    setSaving(intent);
    const sentVersion = version.current;
    const input: SavePostInput = {
      id,
      intent,
      title,
      slug,
      slugAuto,
      excerpt,
      ...(bodyDirty.current && content.current ? { content: content.current } : {}),
      categoryIds,
      tagIds: tags.map((t) => t.id),
      newTags,
      featuredMediaId: featured?.id ?? null,
      featuredAlt: featured?.alt,
      seoTitle,
      seoDescription,
      canonical,
      authorId: author || null,
      reviewerId: reviewer || null,
      publishAt: publishAt || null,
    };
    try {
      const result = await savePostAction(input);
      if (!result.ok) {
        // Simpan otomatis yang gagal tidak mengganggu: pengguna tetap bisa menyimpan manual.
        if (intent !== "autosave" || result.field) setError({ message: result.error, field: result.field });
        if (intent !== "autosave") toast.show(result.error, "error");
        if (result.field === "slug") setSlugEditing(true);
        return null;
      }
      if (id === null) window.history.replaceState(null, "", `/admin/publikasi/${result.id}/`);
      setId(result.id);
      setStatus(result.status);
      setSlug(result.slug);
      if (result.status !== "draft") setSlugAuto(false);
      if (intent !== "autosave") {
        setExcerpt((current) => current || result.excerpt);
        setPublishAt(toWibInput(result.publishedAt));
      }
      setSavedAt({ at: result.savedAt, auto: intent === "autosave" });
      setError(null);
      if (version.current === sentVersion) {
        setDirty(false);
        bodyDirty.current = false;
      }
      if (intent !== "autosave") {
        toast.show(SAVED_MESSAGE[intent], "success");
        router.refresh();
      }
      return result.id;
    } catch {
      if (intent !== "autosave") toast.show("Gagal menyimpan. Periksa koneksi lalu coba lagi.", "error");
      return null;
    } finally {
      busy.current = false;
      setSaving(null);
    }
  };

  /* Simpan otomatis: hanya draf, 4 detik setelah perubahan terakhir. */
  const autosave = useEffectEvent(() => void save("autosave"));
  useEffect(() => {
    if (!dirty || readOnly || status !== "draft" || !title.trim()) return;
    const timer = setTimeout(autosave, 4000);
    return () => clearTimeout(timer);
  }, [dirty, tick, readOnly, status, title]);

  /* Peringatan sebelum meninggalkan halaman dengan perubahan yang belum disimpan. */
  useEffect(() => {
    if (!dirty) return;
    const warn = (e: BeforeUnloadEvent) => e.preventDefault();
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty]);

  const preview = async () => {
    if (id === null && !title.trim()) {
      toast.show("Isi judul dulu untuk melihat pratinjau.", "info");
      return;
    }
    const tab = window.open("about:blank", "_blank");
    let targetId = id;
    if (dirty && status === "draft") {
      targetId = await save("autosave");
      if (targetId === null) {
        tab?.close();
        toast.show("Pratinjau butuh draf yang tersimpan. Periksa isian lalu coba lagi.", "error");
        return;
      }
    } else if (dirty) {
      toast.show("Pratinjau menampilkan versi tersimpan terakhir. Simpan dulu untuk melihat perubahan terbaru.", "info");
    }
    if (targetId === null) {
      tab?.close();
      toast.show("Simpan publikasi dulu untuk melihat pratinjau.", "info");
      return;
    }
    const url = `/api/preview/?id=${targetId}`;
    // Popup diblokir → buka pratinjau di tab ini.
    if (tab) tab.location.href = url;
    else window.open(url, "_self");
  };

  const trash = async () => {
    if (id === null) return;
    setTrashing(true);
    try {
      const result = await trashPostAction(id);
      toast.show(result.message, result.tone);
      if (result.tone !== "error") {
        setDirty(false);
        router.push("/admin/publikasi/");
      }
    } catch {
      toast.show("Gagal memindahkan ke sampah. Coba lagi.", "error");
    } finally {
      setTrashing(false);
      setConfirmTrash(false);
    }
  };

  const future = Boolean(publishAt) && fromWibInput(publishAt).getTime() > now;
  const isBusy = saving !== null;
  const savedLabel = saving
    ? "Menyimpan…"
    : dirty
      ? "Ada perubahan belum disimpan"
      : savedAt
        ? `${savedAt.auto ? "Tersimpan otomatis" : "Tersimpan"} ${timeFmt.format(new Date(savedAt.at))}`
        : "";

  const actions: { intent: SaveIntent; label: string; primary?: boolean }[] = readOnly
    ? []
    : perms.canPublish
      ? status === "published"
        ? [{ intent: "publish", label: "Perbarui", primary: true }]
        : status === "scheduled"
          ? [future ? { intent: "schedule", label: "Perbarui jadwal", primary: true } : { intent: "publish", label: "Terbitkan sekarang", primary: true }]
          : [
              { intent: "save", label: status === "review" ? "Simpan" : "Simpan draf" },
              future ? { intent: "schedule", label: "Jadwalkan", primary: true } : { intent: "publish", label: "Terbitkan", primary: true },
            ]
      : status === "review"
        ? [{ intent: "save", label: "Perbarui", primary: true }]
        : [
            { intent: "save", label: "Simpan draf" },
            { intent: "review", label: "Kirim ke Review", primary: true },
          ];

  const userName = (uid: string) => users.find((u) => u.id === uid)?.name ?? "—";

  return (
    <div className="-mt-2 flex flex-col gap-4.5">
      <header className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-admin-line bg-white px-4 py-3">
        <div className="flex flex-wrap items-center gap-3">
          <Link
            href="/admin/publikasi/"
            aria-label="Kembali ke daftar publikasi"
            className="flex size-11 items-center justify-center rounded-admin border border-admin-field text-admin-ink hover:bg-admin-canvas focus-visible:outline-2 focus-visible:outline-primary"
          >
            <ArrowLeft aria-hidden="true" size={18} />
          </Link>
          <h1 className="text-[13px] font-normal text-admin-text">
            Publikasi / <strong className="font-bold text-admin-ink">{id === null ? "Baru" : "Edit"}</strong>
          </h1>
          <StatusBadge status={status} />
          <span role="status" className="text-xs text-admin-text">
            {savedLabel}
          </span>
        </div>
        <div className="flex flex-wrap gap-2">
          {id !== null && !readOnly ? (
            <button type="button" className={ghostBtn} onClick={() => setShowRevisions(true)}>
              Riwayat revisi
            </button>
          ) : null}
          {status !== "trashed" ? (
            <button type="button" className={ghostBtn} onClick={() => void preview()} disabled={isBusy}>
              Pratinjau
            </button>
          ) : null}
          {actions.map((a) => (
            <button key={a.intent + a.label} type="button" disabled={isBusy} onClick={() => void save(a.intent)} className={a.primary ? primaryBtn : ghostBtn}>
              {saving === a.intent ? "Menyimpan…" : a.label}
            </button>
          ))}
        </div>
      </header>

      {readOnly ? (
        <p role="note" className="rounded-admin border border-admin-field bg-admin-neutral-bg p-3 text-sm font-semibold text-admin-neutral-text">
          {status === "trashed"
            ? "Publikasi ini ada di sampah. Pulihkan dari tab Sampah untuk mengeditnya."
            : "Anda hanya dapat melihat publikasi ini. Peran Anda tidak mengizinkan perubahan."}
        </p>
      ) : null}
      {error && !error.field ? (
        <p role="alert" className="rounded-admin border border-admin-danger bg-admin-danger-bg p-3 text-sm font-semibold text-admin-danger">
          {error.message}
        </p>
      ) : null}

      <div className="flex flex-wrap items-start gap-4.5">
        <section aria-label="Isi publikasi" className="min-w-0 flex-[999_1_520px] rounded-xl border border-admin-line bg-white px-5 py-6 sm:px-9 sm:py-7">
          <label htmlFor={titleId} className="text-xs font-extrabold tracking-[.08em] text-admin-text uppercase">
            Judul
          </label>
          <textarea
            id={titleId}
            value={title}
            onChange={(e) => onTitle(e.target.value.replace(/\n/g, " "))}
            disabled={readOnly}
            rows={2}
            maxLength={300}
            aria-invalid={error?.field === "title" ? true : undefined}
            placeholder="Tulis judul publikasi"
            className="mt-1.5 field-sizing-content w-full resize-none border-0 border-b-2 border-admin-line pt-1.5 pb-3 font-sans text-[28px] leading-tight font-bold text-ink focus:border-primary focus:outline-none"
          />
          {error?.field === "title" ? <p role="alert" className="mt-1 text-[13px] font-semibold text-admin-danger">{error.message}</p> : null}

          <div className="mt-2.5 text-[13px] text-admin-text">
            {slugEditing && !readOnly ? (
              <div className="flex flex-wrap items-center gap-2">
                <label htmlFor={slugId}>Permalink: {siteHost}/</label>
                <input
                  id={slugId}
                  value={slug}
                  onChange={(e) => {
                    setSlug(e.target.value.toLowerCase().replace(/\s+/g, "-"));
                    setSlugAuto(false);
                    touch();
                  }}
                  aria-invalid={error?.field === "slug" ? true : undefined}
                  className={`${field} max-w-md flex-1`}
                />
                <button type="button" className={ghostBtn} onClick={() => setSlugEditing(false)}>
                  Selesai
                </button>
              </div>
            ) : (
              <p className="flex flex-wrap items-center gap-x-1.5">
                <span className="break-all">
                  Permalink: {siteHost}/<strong className="text-admin-ink">{slug || "…"}</strong>/
                </span>
                {!readOnly ? (
                  <button
                    type="button"
                    onClick={() => setSlugEditing(true)}
                    className="inline-flex min-h-11 items-center rounded px-1 font-bold text-primary underline focus-visible:outline-2 focus-visible:outline-primary"
                  >
                    Ubah<span className="sr-only"> permalink</span>
                  </button>
                ) : null}
              </p>
            )}
            {error?.field === "slug" ? <p role="alert" className="mt-1 font-semibold text-admin-danger">{error.message}</p> : null}
            {status === "published" && slug !== post.slug ? (
              <p className="mt-1 text-admin-warn-text">URL lama akan dialihkan (301) ke permalink baru saat disimpan.</p>
            ) : null}
          </div>

          {lossy.length ? (
            <p role="note" className="mt-4 rounded-admin border border-admin-field-warn bg-admin-warn-bg p-3 text-[13px] font-semibold text-admin-warn-text">
              Publikasi lama ini memuat elemen yang belum didukung editor ({lossy.join(", ")}). Isi tidak berubah selama badan
              tulisan tidak diedit; bila diedit lalu disimpan, elemen tersebut hilang.
            </p>
          ) : null}

          <RichTextEditor initialJson={post.contentJson} initialHtml={post.contentHtml} editable={!readOnly} onChange={onBodyChange} />

          <div className="mt-8 border-t border-admin-line pt-5">
            <label htmlFor={excerptId} className="text-xs font-extrabold tracking-[.08em] text-admin-text uppercase">
              Ringkasan
            </label>
            <textarea
              id={excerptId}
              value={excerpt}
              onChange={(e) => edit(setExcerpt)(e.target.value)}
              disabled={readOnly}
              rows={3}
              maxLength={500}
              aria-describedby={`${excerptId}-hint`}
              className={`${field} mt-1.5 py-2 leading-normal`}
            />
            <p id={`${excerptId}-hint`} className="mt-1 text-xs text-admin-text">
              Tampil di kartu publikasi. Kosongkan untuk dibuat otomatis dari paragraf pertama.
            </p>
          </div>
        </section>

        <aside aria-label="Pengaturan publikasi" className="flex max-w-full flex-[1_1_320px] flex-col gap-3.5 lg:max-w-95">
          <section className={panel}>
            <h2 className={panelTitle}>Publikasi</h2>
            <div className="mt-3 flex flex-col gap-3 text-[13px]">
              <p className="flex items-center justify-between gap-3">
                <span className="text-admin-text">Status</span>
                <StatusBadge status={status} />
              </p>
              <div>
                <label htmlFor={dateId} className="text-xs font-bold text-admin-text">
                  Tanggal terbit (WIB)
                </label>
                <input
                  id={dateId}
                  type="datetime-local"
                  value={publishAt}
                  onChange={(e) => {
                    setNow(Date.now());
                    edit(setPublishAt)(e.target.value);
                  }}
                  disabled={readOnly || !perms.canPublish}
                  aria-invalid={error?.field === "publishAt" ? true : undefined}
                  aria-describedby={`${dateId}-hint`}
                  className={`${field} mt-1`}
                />
                {error?.field === "publishAt" ? <p role="alert" className="mt-1 font-semibold text-admin-danger">{error.message}</p> : null}
                <p id={`${dateId}-hint`} className="mt-1 text-xs text-admin-text">
                  {perms.canPublish
                    ? "Kosong = waktu saat diterbitkan. Tanggal di masa depan = Terjadwal."
                    : "Tanggal diatur oleh Editor saat menerbitkan."}
                </p>
              </div>
              {perms.canReview && !readOnly ? (
                <>
                  <div>
                    <label htmlFor={authorId} className="text-xs font-bold text-admin-text">
                      Penulis
                    </label>
                    <select id={authorId} value={author} onChange={(e) => edit(setAuthor)(e.target.value)} className={`${field} mt-1`}>
                      <option value="">— (tanpa penulis)</option>
                      {users.map((u) => (
                        <option key={u.id} value={u.id}>
                          {u.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label htmlFor={reviewerFieldId} className="text-xs font-bold text-admin-text">
                      Reviewer
                    </label>
                    <select id={reviewerFieldId} value={reviewer} onChange={(e) => edit(setReviewer)(e.target.value)} className={`${field} mt-1`}>
                      <option value="">— (belum ada)</option>
                      {users
                        .filter((u) => u.reviewer)
                        .map((u) => (
                          <option key={u.id} value={u.id}>
                            {u.name}
                          </option>
                        ))}
                    </select>
                  </div>
                </>
              ) : (
                <dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-2">
                  <dt className="text-admin-text">Penulis</dt>
                  <dd className="font-bold">{author ? userName(author) : "—"}</dd>
                  <dt className="text-admin-text">Reviewer</dt>
                  <dd className="font-bold">{reviewer ? userName(reviewer) : "—"}</dd>
                </dl>
              )}
              {!readOnly && id !== null ? (
                <div className="flex flex-wrap gap-2 border-t border-admin-line pt-3">
                  {status !== "draft" && (perms.canPublish || status === "review") ? (
                    <button type="button" className={`${ghostBtn} flex-1`} disabled={isBusy} onClick={() => void save("draft")}>
                      Jadikan draf
                    </button>
                  ) : null}
                  {perms.canTrash ? (
                    <button
                      type="button"
                      disabled={isBusy}
                      onClick={() => setConfirmTrash(true)}
                      className="min-h-11 flex-1 rounded-admin border border-admin-danger bg-white px-4 text-sm font-bold text-admin-danger hover:bg-admin-danger-bg focus-visible:outline-2 focus-visible:outline-admin-danger disabled:opacity-50"
                    >
                      Pindahkan ke sampah
                    </button>
                  ) : null}
                </div>
              ) : null}
            </div>
          </section>

          <section className={panel}>
            <h2 className={panelTitle}>Gambar unggulan</h2>
            {featured ? (
              <div className="relative mt-3 aspect-video overflow-hidden rounded-admin bg-admin-neutral-bg">
                <Image src={mediaUrl(featured.url)} alt={featured.alt || "Gambar unggulan tanpa teks alt"} fill sizes="360px" className="object-cover" />
              </div>
            ) : (
              <p className="mt-3 flex aspect-video items-center justify-center rounded-admin border border-dashed border-admin-field bg-admin-canvas px-3 text-center text-xs font-semibold text-admin-text">
                Belum ada gambar unggulan
              </p>
            )}
            {featured ? (
              <p className="mt-2 text-xs text-admin-text">
                Teks alt: <em>{featured.alt || "(kosong)"}</em>
              </p>
            ) : null}
            {!readOnly ? (
              <div className="mt-2.5 flex gap-2">
                <button type="button" className={`${ghostBtn} flex-1`} onClick={() => setPickingFeatured(true)}>
                  {featured ? "Ganti" : "Pilih gambar"}
                </button>
                {featured ? (
                  <button type="button" className={`${ghostBtn} flex-1`} onClick={() => edit(setFeatured)(null)}>
                    Hapus
                  </button>
                ) : null}
              </div>
            ) : null}
          </section>

          <TermsPanel
            className={panel}
            titleClassName={panelTitle}
            readOnly={readOnly}
            categories={categories}
            categoryIds={categoryIds}
            onCategories={edit(setCategoryIds)}
            tags={tags}
            onTags={edit(setTags)}
            newTags={newTags}
            onNewTags={edit(setNewTags)}
          />

          <SeoPanel
            className={panel}
            titleClassName={panelTitle}
            readOnly={readOnly}
            canEditCanonical={perms.canSeo}
            siteHost={siteHost}
            title={title}
            slug={slug}
            excerpt={excerpt}
            seoTitle={seoTitle}
            onSeoTitle={edit(setSeoTitle)}
            seoDescription={seoDescription}
            onSeoDescription={edit(setSeoDescription)}
            canonical={canonical}
            onCanonical={edit(setCanonical)}
            canonicalError={error?.field === "canonical" ? error.message : undefined}
            missingAlt={missingAlt}
          />
        </aside>
      </div>

      <MediaPicker
        open={pickingFeatured}
        title="Pilih gambar unggulan"
        onClose={() => setPickingFeatured(false)}
        onSelect={(m) => {
          setPickingFeatured(false);
          edit(setFeatured)(m);
        }}
      />
      {id !== null ? <RevisionsDialog open={showRevisions} postId={id} dirty={dirty} onClose={() => setShowRevisions(false)} /> : null}
      <ConfirmDialog
        open={confirmTrash}
        title="Pindahkan publikasi ini ke sampah?"
        description={
          status === "published"
            ? "Publikasi akan hilang dari situs. Anda masih bisa memulihkannya dari tab Sampah."
            : "Anda masih bisa memulihkannya dari tab Sampah."
        }
        confirmLabel="Pindahkan ke sampah"
        tone="danger"
        busy={trashing}
        onConfirm={() => void trash()}
        onCancel={() => setConfirmTrash(false)}
      />
    </div>
  );
}
