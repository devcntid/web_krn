"use client";

import { FileText, Film, Search } from "lucide-react";
import Form from "next/form";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useId, useRef, useState } from "react";

import { deleteMediaAction, getMediaDetailAction, updateMediaAction } from "@/app/admin/(panel)/media/actions";
import { ConfirmDialog } from "@/components/admin/ConfirmDialog";
import { PageHeader } from "@/components/admin/PageHeader";
import { useToast } from "@/components/admin/Toast";
import { mediaUrl } from "@/lib/media";
import { formatBytes, mediaKindOf } from "@/lib/media-upload";
import type { MediaDetail, MediaItem, MediaUsage } from "@/types/admin-media";

import { MediaDropzone } from "./MediaDropzone";

type Filters = { q: string; jenis: string; folder: string; alt: boolean };

const BASE = "/admin/media/";
const num = new Intl.NumberFormat("id-ID");
const monthFmt = new Intl.DateTimeFormat("id-ID", { timeZone: "Asia/Jakarta", month: "long", year: "numeric" });
const field =
  "min-h-11 rounded-admin border border-admin-field bg-white px-3 text-sm font-semibold text-admin-ink focus-visible:outline-2 focus-visible:outline-primary";
const ghostBtn =
  "inline-flex min-h-11 items-center justify-center rounded-lg border border-admin-field bg-white px-3 text-[13px] font-bold text-admin-ink hover:bg-admin-canvas focus-visible:outline-2 focus-visible:outline-primary disabled:opacity-50";

function query(filters: Filters, patch: Partial<Filters & { page: number }>): string {
  const f = { ...filters, ...patch };
  const q = new URLSearchParams();
  if (f.q) q.set("q", f.q);
  if (f.jenis) q.set("jenis", f.jenis);
  if (f.folder) q.set("folder", f.folder);
  if (f.alt) q.set("alt", "kosong");
  if (patch.page && patch.page > 1) q.set("page", String(patch.page));
  const s = q.toString();
  return s ? `${BASE}?${s}` : BASE;
}

/** Pratinjau kecil sebuah media: gambar, atau ikon untuk PDF/video. */
function Thumb({ item, sizes }: { item: MediaItem; sizes: string }) {
  const kind = mediaKindOf(item.mime);
  if (kind === "image") return <Image src={mediaUrl(item.url)} alt="" fill sizes={sizes} className="object-cover" />;
  const Icon = kind === "video" ? Film : FileText;
  return (
    <span className="absolute inset-0 flex flex-col items-center justify-center gap-1 text-admin-text">
      <Icon aria-hidden="true" size={28} />
      <span className="text-[11px] font-extrabold uppercase">{kind === "video" ? "Video" : kind === "pdf" ? "PDF" : "File"}</span>
    </span>
  );
}

/** Pustaka Media (artboard "A6"): grid, filter, unggah seret-lepas, dan panel detail. */
export function MediaLibrary({
  items,
  total,
  page,
  pages,
  filters,
  overview,
  canManage,
  loadDetail = getMediaDetailAction,
}: {
  items: MediaItem[];
  total: number;
  page: number;
  pages: number;
  filters: Filters;
  overview: { total: number; noAlt: number; folders: string[] };
  canManage: boolean;
  /** Pemuat detail (bawaan: server action); bisa diganti untuk pengujian. */
  loadDetail?: (id: number) => Promise<MediaDetail | null>;
}) {
  const router = useRouter();
  const fileInput = useRef<HTMLInputElement | null>(null);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  // Unggahan baru ditampilkan di depan grid sampai daftar dari server dimuat ulang.
  const [fresh, setFresh] = useState<MediaItem[]>([]);

  const shown = [...fresh.filter((f) => !items.some((i) => i.id === f.id)), ...items];
  const submit = (e: React.ChangeEvent<HTMLSelectElement>) => e.currentTarget.form?.requestSubmit();
  const folderLabel = (f: string) => f.replace("/", " / ");

  return (
    <>
      <PageHeader
        title="Pustaka Media"
        description={`${num.format(overview.total)} file · gambar disajikan otomatis sebagai WebP/AVIF`}
        actions={
          canManage ? (
            <button
              type="button"
              onClick={() => fileInput.current?.click()}
              className="inline-flex min-h-11 items-center rounded-admin bg-primary px-4.5 text-sm font-extrabold text-white hover:bg-admin-primary-dark focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
            >
              Unggah File
            </button>
          ) : null
        }
      />

      <div className="flex flex-wrap items-center gap-2.5">
        <Form action={BASE} role="search" aria-label="Cari dan saring media" className="flex flex-[999_1_520px] flex-wrap items-center gap-2.5">
          {filters.alt ? <input type="hidden" name="alt" value="kosong" /> : null}
          <div className="relative flex flex-[1_1_260px]">
            <label htmlFor="cari-media" className="sr-only">
              Cari media
            </label>
            <input id="cari-media" type="search" name="q" defaultValue={filters.q} placeholder="Cari nama file atau teks alt…" className={`${field} w-full pr-12 font-medium`} />
            <button type="submit" className="absolute inset-y-0 right-0 flex w-11 items-center justify-center rounded-r-admin text-admin-text hover:text-primary focus-visible:outline-2 focus-visible:outline-primary">
              <Search aria-hidden="true" size={18} />
              <span className="sr-only">Cari</span>
            </button>
          </div>
          <select name="jenis" aria-label="Jenis" defaultValue={filters.jenis} onChange={submit} className={field}>
            <option value="">Semua jenis</option>
            <option value="image">Gambar</option>
            <option value="pdf">PDF</option>
            <option value="video">Video</option>
          </select>
          <select name="folder" aria-label="Folder (tahun / bulan)" defaultValue={filters.folder} onChange={submit} className={field}>
            <option value="">Semua bulan</option>
            {overview.folders.map((f) => (
              <option key={f} value={f}>
                {folderLabel(f)}
              </option>
            ))}
          </select>
        </Form>
        <Link
          href={query(filters, { alt: !filters.alt })}
          aria-current={filters.alt ? "true" : undefined}
          className={`inline-flex min-h-11 items-center rounded-admin border px-3.5 text-[13px] font-bold focus-visible:outline-2 focus-visible:outline-primary ${
            filters.alt ? "border-admin-warn-text bg-admin-warn-text text-white" : "border-admin-field-warn bg-admin-warn-bg text-admin-warn-text"
          }`}
        >
          Tanpa teks alt ({num.format(overview.noAlt)})
        </Link>
        {filters.q || filters.jenis || filters.folder || filters.alt ? (
          <Link href={BASE} className="inline-flex min-h-11 items-center rounded px-2 text-sm font-bold text-primary underline focus-visible:outline-2 focus-visible:outline-primary">
            Hapus filter
          </Link>
        ) : null}
      </div>

      <div className="flex flex-wrap items-start gap-4.5">
        <section aria-label="Daftar media" className="min-w-0 flex-[999_1_520px]">
          {canManage ? (
            <MediaDropzone
              inputRef={fileInput}
              onUploaded={(item) => {
                setFresh((list) => [item, ...list.filter((x) => x.id !== item.id)]);
                setSelectedId(item.id);
                router.refresh();
              }}
            />
          ) : null}

          <p role="status" className="mt-3.5 text-[13px] text-admin-text">
            {num.format(total)} file{total === overview.total ? "" : " cocok dengan filter"} · halaman {page} dari {pages}
          </p>
          {shown.length === 0 ? (
            <p className="mt-3 rounded-xl border border-dashed border-admin-field bg-white p-10 text-center text-sm text-admin-text">Tidak ada media yang cocok.</p>
          ) : (
            <ul className="mt-2.5 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5">
              {shown.map((item) => {
                const on = item.id === selectedId;
                const noAlt = mediaKindOf(item.mime) === "image" && !item.alt.trim();
                return (
                  <li key={item.id}>
                    <button
                      type="button"
                      aria-pressed={on}
                      onClick={() => setSelectedId(on ? null : item.id)}
                      className={`block w-full overflow-hidden rounded-admin border-2 bg-white text-left focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary ${
                        on ? "border-primary" : "border-admin-line hover:border-admin-field"
                      }`}
                    >
                      <span className="relative block aspect-square bg-admin-neutral-bg">
                        <Thumb item={item} sizes="(min-width: 1280px) 180px, 30vw" />
                        {noAlt ? (
                          <span className="absolute top-1.5 right-1.5 rounded bg-accent px-1.5 py-0.5 text-[10px] font-extrabold text-ink">
                            ALT<span className="sr-only"> kosong</span>
                          </span>
                        ) : null}
                      </span>
                      <span className="block truncate px-2 py-1.5 text-[11px] font-semibold text-admin-neutral-text">{item.name}</span>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}

          {pages > 1 ? (
            <nav aria-label="Paginasi media" className="mt-4 flex items-center justify-between gap-3 text-sm text-admin-text">
              {page > 1 ? (
                <Link href={query(filters, { page: page - 1 })} className={ghostBtn}>
                  Sebelumnya
                </Link>
              ) : (
                <span />
              )}
              <span>
                Halaman {page} dari {pages}
              </span>
              {page < pages ? (
                <Link href={query(filters, { page: page + 1 })} className={ghostBtn}>
                  Berikutnya
                </Link>
              ) : (
                <span />
              )}
            </nav>
          ) : null}
        </section>

        {selectedId !== null ? (
          <DetailPanel
            key={selectedId}
            id={selectedId}
            canManage={canManage}
            loadDetail={loadDetail}
            onSaved={(item) => {
              setFresh((list) => list.map((x) => (x.id === item.id ? item : x)));
              router.refresh();
            }}
            onDeleted={() => {
              setFresh((list) => list.filter((x) => x.id !== selectedId));
              setSelectedId(null);
              router.refresh();
            }}
            onClose={() => setSelectedId(null)}
          />
        ) : (
          <aside aria-label="Detail media" className="flex w-full flex-[1_1_300px] rounded-xl border border-dashed border-admin-field bg-white p-6 text-center text-sm text-admin-text lg:max-w-85">
            <p className="m-auto">Pilih file untuk melihat detail, mengisi teks alt, menyalin URL, atau menghapusnya.</p>
          </aside>
        )}
      </div>
    </>
  );
}

function UsageList({ usage }: { usage: MediaUsage[] }) {
  if (!usage.length) return <span>Belum dipakai</span>;
  return (
    <ul className="flex flex-col">
      {usage.slice(0, 8).map((u) => (
        <li key={`${u.kind}:${u.label}`}>
          {u.href ? (
            <Link href={u.href} className="inline-flex min-h-11 items-center font-semibold text-primary underline focus-visible:outline-2 focus-visible:outline-primary">
              {u.label}
            </Link>
          ) : (
            u.label
          )}
        </li>
      ))}
      {usage.length > 8 ? <li className="text-admin-text">… dan {usage.length - 8} lainnya</li> : null}
    </ul>
  );
}

function DetailPanel({
  id,
  canManage,
  loadDetail,
  onSaved,
  onDeleted,
  onClose,
}: {
  id: number;
  canManage: boolean;
  loadDetail: (id: number) => Promise<MediaDetail | null>;
  onSaved: (item: MediaItem) => void;
  onDeleted: () => void;
  onClose: () => void;
}) {
  const toast = useToast();
  const altId = useId();
  const capId = useId();
  const ref = useRef<HTMLElement>(null);
  const [detail, setDetail] = useState<MediaDetail | null>(null);
  const [failed, setFailed] = useState(false);
  const [alt, setAlt] = useState("");
  const [caption, setCaption] = useState("");
  const [busy, setBusy] = useState<"save" | "delete" | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [confirm, setConfirm] = useState(false);

  useEffect(() => {
    let cancelled = false;
    loadDetail(id)
      .then((d) => {
        if (cancelled) return;
        if (!d) {
          setFailed(true);
          return;
        }
        setDetail(d);
        setAlt(d.item.alt);
        setCaption(d.item.caption);
      })
      .catch(() => {
        if (!cancelled) setFailed(true);
      });
    return () => {
      cancelled = true;
    };
  }, [id, loadDetail]);

  // Di layar sempit panel berada di bawah grid — setelah isinya dirender, bawa ke tampilan.
  const loadedId = detail?.item.id;
  useEffect(() => {
    const el = ref.current;
    if (loadedId !== undefined && el && el.getBoundingClientRect().top > window.innerHeight * 0.6) el.scrollIntoView({ block: "start" });
  }, [loadedId]);

  const shell = "flex w-full flex-[1_1_300px] flex-col gap-3 rounded-xl border border-admin-line bg-white p-4.5 lg:sticky lg:top-20 lg:max-w-85";
  if (failed) {
    return (
      <aside ref={ref} aria-label="Detail media" className={shell}>
        <p role="alert" className="text-sm font-semibold text-admin-danger">
          Gagal memuat detail media.
        </p>
        <button type="button" className={ghostBtn} onClick={onClose}>
          Tutup
        </button>
      </aside>
    );
  }
  if (!detail) {
    return (
      <aside ref={ref} aria-label="Detail media" aria-busy="true" className={shell}>
        <p className="py-10 text-center text-sm text-admin-text">Memuat detail…</p>
      </aside>
    );
  }

  const { item, usage } = detail;
  const kind = mediaKindOf(item.mime);
  const isImage = kind === "image";
  const publicUrl = mediaUrl(item.url);
  const changed = alt !== item.alt || caption !== item.caption;
  const altMissing = isImage && !alt.trim();

  const save = async () => {
    setBusy("save");
    setError(null);
    try {
      const result = await updateMediaAction(id, { alt, caption });
      if (result.ok && result.item) {
        setDetail({ ...detail, item: result.item });
        setAlt(result.item.alt);
        setCaption(result.item.caption);
        onSaved(result.item);
        toast.show("Teks alt dan keterangan disimpan.", "success");
      } else if (!result.ok) setError(result.error);
    } catch {
      setError("Gagal menyimpan. Coba lagi.");
    } finally {
      setBusy(null);
    }
  };

  const copy = async () => {
    const absolute = /^https?:\/\//.test(publicUrl) ? publicUrl : `${window.location.origin}${publicUrl}`;
    try {
      await navigator.clipboard.writeText(absolute);
      toast.show("URL disalin.", "success");
    } catch {
      toast.show("Tidak bisa menyalin otomatis. Salin dari tautan Buka file.", "error");
    }
  };

  const remove = async () => {
    setBusy("delete");
    setError(null);
    try {
      const result = await deleteMediaAction(id);
      if (result.ok) {
        toast.show("File dihapus.", "success");
        onDeleted();
        return;
      }
      setError(result.error);
      if (result.usage) setDetail({ ...detail, usage: result.usage });
    } catch {
      setError("Gagal menghapus. Coba lagi.");
    }
    setBusy(null);
    setConfirm(false);
  };

  return (
    <aside ref={ref} aria-label="Detail media" className={shell}>
      <div className="relative aspect-16/10 overflow-hidden rounded-admin bg-admin-neutral-bg">
        {isImage ? <Image src={publicUrl} alt={item.alt} fill sizes="340px" className="object-contain" /> : <Thumb item={item} sizes="340px" />}
      </div>
      <h2 className="text-sm font-extrabold break-all text-admin-ink">{item.name}</h2>
      <dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1.5 text-[13px]">
        <dt className="text-admin-text">Ukuran</dt>
        <dd>
          {item.width && item.height ? `${item.width}×${item.height} px · ` : ""}
          {formatBytes(item.size)}
        </dd>
        <dt className="text-admin-text">Jenis</dt>
        <dd>
          {item.mime} · {item.source === "legacy" ? "migrasi WordPress" : "unggahan baru"}
        </dd>
        <dt className="text-admin-text">Diunggah</dt>
        <dd>
          {monthFmt.format(new Date(detail.uploadedAt))}
          {detail.uploadedBy ? ` · ${detail.uploadedBy}` : ""}
        </dd>
        <dt className="text-admin-text">Dipakai di</dt>
        <dd className="min-w-0">
          <UsageList usage={usage} />
        </dd>
      </dl>

      <div>
        <label htmlFor={altId} className="text-xs font-bold text-admin-text">
          Teks alt{isImage ? " (wajib)" : ""}
        </label>
        <textarea
          id={altId}
          value={alt}
          onChange={(e) => setAlt(e.target.value)}
          rows={3}
          maxLength={300}
          disabled={!canManage}
          required={isImage}
          aria-invalid={altMissing ? true : undefined}
          aria-describedby={`${altId}-help`}
          className="mt-1 w-full rounded-lg border border-admin-field px-2.5 py-2 text-[13px] leading-normal focus-visible:outline-2 focus-visible:outline-primary disabled:bg-admin-canvas"
        />
        <p id={`${altId}-help`} className={`text-xs ${altMissing ? "font-semibold text-admin-warn-text" : "text-admin-text"}`}>
          Jelaskan isi gambar untuk pembaca layar dan mesin pencari.
        </p>
      </div>
      <div>
        <label htmlFor={capId} className="text-xs font-bold text-admin-text">
          Keterangan
        </label>
        <input
          id={capId}
          value={caption}
          onChange={(e) => setCaption(e.target.value)}
          maxLength={500}
          disabled={!canManage}
          className="mt-1 min-h-11 w-full rounded-lg border border-admin-field px-2.5 text-[13px] focus-visible:outline-2 focus-visible:outline-primary disabled:bg-admin-canvas"
        />
      </div>
      {error ? (
        <p role="alert" className="rounded-lg bg-admin-danger-bg p-2.5 text-[13px] font-semibold text-admin-danger">
          {error}
        </p>
      ) : null}

      <div className="flex flex-wrap gap-2">
        {canManage ? (
          <button
            type="button"
            disabled={busy !== null || !changed || altMissing}
            onClick={() => void save()}
            className="min-h-11 flex-1 rounded-lg bg-primary px-3 text-[13px] font-extrabold text-white hover:bg-admin-primary-dark focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary disabled:opacity-50"
          >
            {busy === "save" ? "Menyimpan…" : "Simpan"}
          </button>
        ) : null}
        <button type="button" className={ghostBtn} onClick={() => void copy()}>
          Salin URL
        </button>
        <a href={publicUrl} target="_blank" rel="noopener" className={ghostBtn}>
          Buka file <span aria-hidden="true">&nbsp;↗</span>
          <span className="sr-only"> (tab baru)</span>
        </a>
      </div>
      {canManage ? (
        <>
          <button
            type="button"
            disabled={busy !== null || usage.length > 0}
            aria-describedby={usage.length ? `${capId}-del` : undefined}
            onClick={() => setConfirm(true)}
            className="min-h-11 rounded-lg border border-admin-danger bg-white px-3 text-[13px] font-bold text-admin-danger hover:bg-admin-danger-bg focus-visible:outline-2 focus-visible:outline-admin-danger disabled:opacity-50"
          >
            Hapus file
          </button>
          {usage.length ? (
            <p id={`${capId}-del`} className="text-xs text-admin-text">
              Tidak bisa dihapus selama masih dipakai konten di atas.
            </p>
          ) : null}
        </>
      ) : null}

      <ConfirmDialog
        open={confirm}
        title="Hapus file ini secara permanen?"
        description={
          <>
            <strong className="break-all">{item.name}</strong> dihapus dari penyimpanan dan pustaka media. URL-nya langsung berhenti berfungsi dan tidak dapat dikembalikan.
          </>
        }
        confirmLabel="Hapus file"
        tone="danger"
        busy={busy === "delete"}
        onConfirm={() => void remove()}
        onCancel={() => setConfirm(false)}
      />
    </aside>
  );
}
