"use client";

import { upload } from "@vercel/blob/client";
import { useId, useRef, useState } from "react";

import { registerUploadAction } from "@/app/admin/(panel)/media/actions";
import { UPLOAD_ACCEPT, UPLOAD_HINT, uploadFileName, uploadFolder, uploadProblem } from "@/lib/media-upload";
import type { MediaItem } from "@/types/admin-media";

type Job = { key: string; name: string; state: "uploading" | "saving" | "done" | "error"; percent: number; message?: string };

export type MediaDropzoneHandle = { open: () => void };

/**
 * Area unggah (seret & lepas atau pilih file). File dikirim langsung dari browser ke Vercel Blob
 * (@vercel/blob/client) lewat token dari /api/media/upload, lalu dicatat di tabel media.
 */
export function MediaDropzone({
  onUploaded,
  inputRef,
  compact = false,
}: {
  onUploaded: (item: MediaItem) => void;
  /** Ref ke <input type="file"> agar tombol di luar (mis. "Unggah File") bisa membukanya. */
  inputRef?: React.RefObject<HTMLInputElement | null>;
  compact?: boolean;
}) {
  const ownRef = useRef<HTMLInputElement | null>(null);
  const ref = inputRef ?? ownRef;
  const id = useId();
  const [over, setOver] = useState(false);
  const [jobs, setJobs] = useState<Job[]>([]);
  const counter = useRef(0);

  const patch = (key: string, next: Partial<Job>) => setJobs((list) => list.map((j) => (j.key === key ? { ...j, ...next } : j)));

  const send = async (file: File) => {
    const key = `u${counter.current++}`;
    const problem = uploadProblem(file);
    setJobs((list) => [...list.slice(-7), { key, name: file.name, state: problem ? "error" : "uploading", percent: 0, message: problem ?? undefined }]);
    if (problem) return;
    try {
      const blob = await upload(`${uploadFolder()}/${uploadFileName(file.name, file.type)}`, file, {
        access: "public",
        handleUploadUrl: "/api/media/upload/",
        contentType: file.type,
        clientPayload: JSON.stringify({ type: file.type, size: file.size }),
        multipart: file.size > 8 * 1024 * 1024,
        onUploadProgress: ({ percentage }) => patch(key, { percent: Math.round(percentage) }),
      });
      patch(key, { state: "saving", percent: 100 });
      const saved = await registerUploadAction(blob.url);
      if (saved.ok && saved.item) {
        patch(key, { state: "done" });
        onUploaded(saved.item);
      } else patch(key, { state: "error", message: saved.ok ? "Gagal mencatat file." : saved.error });
    } catch (error) {
      const message = error instanceof Error ? error.message : "";
      // Pesan dari route (sesi, peran, tipe) diteruskan apa adanya; selebihnya pesan umum.
      const known = /Sesi|Peran|Tipe|Ukuran|Lokasi|Keterangan|Vercel Blob belum/.exec(message);
      patch(key, { state: "error", message: known ? message.slice(message.indexOf(known[0])) : "Unggah gagal. Periksa koneksi atau konfigurasi Vercel Blob." });
    }
  };

  const add = (files: FileList | null) => {
    if (!files) return;
    for (const file of Array.from(files).slice(0, 20)) void send(file);
  };

  return (
    <div>
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setOver(true);
        }}
        onDragLeave={() => setOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setOver(false);
          add(e.dataTransfer.files);
        }}
        className={`rounded-xl border-2 border-dashed bg-white text-center text-sm text-admin-neutral-text ${compact ? "p-3" : "p-4.5"} ${
          over ? "border-primary bg-admin-ok-bg" : "border-admin-sidebar-muted"
        }`}
      >
        <label htmlFor={id} className="inline-flex min-h-11 cursor-pointer items-center rounded-lg px-2 font-semibold focus-within:outline-2 focus-within:outline-primary">
          <span>
            Seret file ke sini untuk mengunggah, atau <span className="font-extrabold text-primary underline">pilih file</span>
          </span>
          <input
            ref={ref}
            id={id}
            type="file"
            multiple
            accept={UPLOAD_ACCEPT}
            className="sr-only"
            aria-describedby={`${id}-hint`}
            onChange={(e) => {
              add(e.target.files);
              e.target.value = "";
            }}
          />
        </label>
        <p id={`${id}-hint`} className="text-xs text-admin-text">
          {UPLOAD_HINT}
        </p>
      </div>
      {jobs.length ? (
        <ul aria-label="Status unggahan" aria-live="polite" className="mt-2 flex flex-col gap-1.5">
          {jobs.map((j) => (
            <li key={j.key} className="flex flex-wrap items-center gap-x-3 rounded-lg bg-white px-3 py-2 text-[13px]">
              <span className="min-w-0 flex-1 truncate font-semibold text-admin-ink">{j.name}</span>
              {j.state === "uploading" ? (
                <span className="flex items-center gap-2 text-admin-text">
                  <progress value={j.percent} max={100} className="h-1.5 w-24 accent-primary" aria-label={`Mengunggah ${j.name}`} />
                  {j.percent}%
                </span>
              ) : j.state === "saving" ? (
                <span className="text-admin-text">Mencatat…</span>
              ) : j.state === "done" ? (
                <span className="font-bold text-admin-primary-dark">Selesai</span>
              ) : (
                <span className="font-semibold text-admin-danger">{j.message}</span>
              )}
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
