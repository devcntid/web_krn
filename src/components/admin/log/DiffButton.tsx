"use client";

import { useState, useTransition } from "react";

import { getActivityDiffAction } from "@/app/admin/(panel)/log/actions";
import { Dialog } from "@/components/admin/Dialog";

const btn =
  "inline-flex min-h-11 shrink-0 items-center justify-center rounded-lg border border-admin-field bg-white px-3 text-[13px] font-bold text-admin-ink hover:bg-admin-canvas focus-visible:outline-2 focus-visible:outline-primary";

type Diff = Record<string, unknown>;

const show = (v: unknown) => (v === null || v === undefined || v === "" ? "—" : typeof v === "string" ? v : JSON.stringify(v, null, 2));

/** Tombol "Lihat" → dialog sebelum/sesudah per kolom. Bentuk diff: { kolom: [lama, baru] } atau nilai bebas. */
export function DiffButton({ id, summary }: { id: number; summary: string }) {
  const [open, setOpen] = useState(false);
  const [diff, setDiff] = useState<Diff | null | undefined>(undefined);
  const [failed, setFailed] = useState(false);
  const [pending, start] = useTransition();

  const openDialog = () => {
    setOpen(true);
    if (diff !== undefined) return;
    setFailed(false);
    start(async () => {
      try {
        setDiff(await getActivityDiffAction(id));
      } catch {
        setFailed(true);
      }
    });
  };

  return (
    <>
      <button type="button" className={btn} onClick={openDialog}>
        Lihat<span className="sr-only"> perubahan: {summary}</span>
      </button>
      <Dialog open={open} title="Detail perubahan" onClose={() => setOpen(false)} size="xl">
        <p className="mb-4 text-sm text-admin-text">{summary}</p>
        {failed ? (
          <p role="alert" className="text-sm font-semibold text-admin-danger">
            Gagal memuat detail. Tutup lalu coba lagi.
          </p>
        ) : pending || diff === undefined ? (
          <p className="text-sm font-semibold text-admin-text">Memuat…</p>
        ) : !diff ? (
          <p className="text-sm text-admin-text">Tidak ada detail perubahan.</p>
        ) : (
          <div className="space-y-4">
            {Object.entries(diff).map(([key, value]) => {
              const pair = Array.isArray(value) && value.length === 2 ? (value as [unknown, unknown]) : null;
              return (
                <section key={key} className="min-w-0 rounded-xl border border-admin-line">
                  <h3 className="border-b border-admin-line px-3 py-2 font-mono text-xs font-bold text-admin-ink">{key}</h3>
                  {pair ? (
                    <div className="grid min-w-0 sm:grid-cols-2">
                      <div className="min-w-0 border-admin-line p-3 max-sm:border-b sm:border-r">
                        <p className="mb-1 text-[11px] font-extrabold tracking-wide text-admin-danger uppercase">Sebelum</p>
                        <pre className="max-h-72 overflow-auto rounded-lg bg-admin-danger-bg/50 p-2 text-xs break-words whitespace-pre-wrap text-admin-ink">{show(pair[0])}</pre>
                      </div>
                      <div className="min-w-0 p-3">
                        <p className="mb-1 text-[11px] font-extrabold tracking-wide text-admin-primary-dark uppercase">Sesudah</p>
                        <pre className="max-h-72 overflow-auto rounded-lg bg-admin-ok-bg/60 p-2 text-xs break-words whitespace-pre-wrap text-admin-ink">{show(pair[1])}</pre>
                      </div>
                    </div>
                  ) : (
                    <pre className="max-h-72 overflow-auto p-3 text-xs break-words whitespace-pre-wrap text-admin-ink">{show(value)}</pre>
                  )}
                </section>
              );
            })}
          </div>
        )}
      </Dialog>
    </>
  );
}
