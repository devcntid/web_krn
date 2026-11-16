"use client";

import Image from "next/image";
import { useEffect, useId, useState, useTransition } from "react";

import { searchMediaAction } from "@/app/admin/(panel)/publikasi/actions";
import { Dialog } from "@/components/admin/Dialog";
import { MediaDropzone } from "@/components/admin/media/MediaDropzone";
import { mediaUrl } from "@/lib/media";
import type { MediaChoice, MediaPage } from "@/types/admin-posts";

const btn =
  "min-h-11 rounded-admin border border-admin-field bg-white px-4 text-sm font-bold text-admin-ink hover:bg-admin-canvas focus-visible:outline-2 focus-visible:outline-primary disabled:opacity-50";

/**
 * Pemilih gambar dari pustaka media (modal). Teks alt WAJIB diisi sebelum gambar bisa dipakai;
 * bawaan diambil dari pustaka. Gambar baru bisa diunggah langsung di sini (butuh hak "Unggah media").
 */
export function MediaPicker({
  open,
  title = "Pilih gambar",
  onClose,
  onSelect,
}: {
  open: boolean;
  title?: string;
  onClose: () => void;
  onSelect: (media: MediaChoice) => void;
}) {
  return (
    <Dialog open={open} title={title} onClose={onClose} size="xl">
      <PickerBody onSelect={onSelect} />
    </Dialog>
  );
}

/** Isi modal; di-mount hanya saat terbuka sehingga state-nya selalu mulai bersih. */
function PickerBody({ onSelect }: { onSelect: (media: MediaChoice) => void }) {
  const [query, setQuery] = useState("");
  const [applied, setApplied] = useState({ q: "", page: 1 });
  const [data, setData] = useState<MediaPage | null>(null);
  const [failed, setFailed] = useState(false);
  const [selected, setSelected] = useState<MediaChoice | null>(null);
  const [alt, setAlt] = useState("");
  const [loading, startTransition] = useTransition();
  const altId = useId();
  const searchId = useId();

  useEffect(() => {
    let cancelled = false;
    startTransition(async () => {
      try {
        const result = await searchMediaAction(applied.q, applied.page);
        if (!cancelled) {
          setData(result);
          setFailed(false);
        }
      } catch {
        if (!cancelled) setFailed(true);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [applied]);

  const pages = data ? Math.max(1, Math.ceil(data.total / data.pageSize)) : 1;

  return (
    <div className="flex flex-col gap-4">
      <form
        role="search"
        onSubmit={(e) => {
          e.preventDefault();
          setApplied({ q: query, page: 1 });
        }}
        className="flex gap-2"
      >
        <label htmlFor={searchId} className="sr-only">
          Cari gambar
        </label>
        <input
          id={searchId}
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Cari nama file atau teks alt…"
          className="min-h-11 flex-1 rounded-admin border border-admin-field bg-white px-3 text-sm focus-visible:outline-2 focus-visible:outline-primary"
        />
        <button type="submit" className={btn}>
          Cari
        </button>
      </form>

      <MediaDropzone
        compact
        onUploaded={(item) => {
          if (!item.mime.startsWith("image/")) return;
          const choice = { id: item.id, url: item.url, alt: item.alt, width: item.width, height: item.height };
          // Tampilkan unggahan baru di depan dan langsung pilih; teks alt tetap wajib diisi.
          setData((d) => (d ? { ...d, items: [choice, ...d.items.filter((x) => x.id !== choice.id)], total: d.total + 1 } : d));
          setSelected(choice);
          setAlt(choice.alt);
        }}
      />

      {failed ? (
        <p role="alert" className="rounded-admin bg-admin-danger-bg p-3 text-sm font-semibold text-admin-danger">
          Gagal memuat pustaka media. Coba lagi.
        </p>
      ) : null}

      <div aria-busy={loading} className={loading ? "opacity-60" : ""}>
        {data && data.items.length === 0 ? (
          <p className="py-10 text-center text-sm text-admin-text">Tidak ada gambar yang cocok.</p>
        ) : (
          <ul className="grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-6">
            {(data?.items ?? []).map((m) => {
              const on = selected?.id === m.id;
              return (
                <li key={m.id}>
                  <button
                    type="button"
                    aria-pressed={on}
                    onClick={() => {
                      setSelected(m);
                      setAlt(m.alt);
                    }}
                    className={`relative block aspect-4/3 w-full overflow-hidden rounded-lg border-2 bg-admin-neutral-bg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary ${
                      on ? "border-primary" : "border-transparent hover:border-admin-field"
                    }`}
                  >
                    <Image src={mediaUrl(m.url)} alt={m.alt || "Gambar tanpa teks alt"} fill sizes="160px" className="object-cover" />
                  </button>
                </li>
              );
            })}
          </ul>
        )}
        {!data && !failed ? <p className="py-10 text-center text-sm text-admin-text">Memuat pustaka media…</p> : null}
      </div>

      {data && pages > 1 ? (
        <div className="flex items-center justify-between gap-3 text-sm text-admin-text">
          <button type="button" className={btn} disabled={applied.page <= 1 || loading} onClick={() => setApplied((a) => ({ ...a, page: a.page - 1 }))}>
            Sebelumnya
          </button>
          <span>
            Halaman {applied.page} dari {pages}
          </span>
          <button type="button" className={btn} disabled={applied.page >= pages || loading} onClick={() => setApplied((a) => ({ ...a, page: a.page + 1 }))}>
            Berikutnya
          </button>
        </div>
      ) : null}

      {selected ? (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (alt.trim()) onSelect({ ...selected, alt: alt.trim() });
          }}
          className="sticky -bottom-5 -mx-5 -mb-5 flex flex-wrap items-end gap-3 border-t border-admin-line bg-white p-5"
        >
          <div className="min-w-56 flex-1">
            <label htmlFor={altId} className="text-xs font-bold text-admin-text">
              Teks alt (wajib) — jelaskan isi gambar untuk pembaca layar
            </label>
            <input
              id={altId}
              value={alt}
              onChange={(e) => setAlt(e.target.value)}
              required
              maxLength={300}
              className="mt-1 min-h-11 w-full rounded-admin border border-admin-field px-3 text-sm focus-visible:outline-2 focus-visible:outline-primary"
            />
          </div>
          <button
            type="submit"
            disabled={!alt.trim()}
            className="min-h-11 rounded-admin bg-primary px-4.5 text-sm font-extrabold text-white hover:bg-admin-primary-dark focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary disabled:opacity-50"
          >
            Pakai gambar
          </button>
        </form>
      ) : null}
    </div>
  );
}
