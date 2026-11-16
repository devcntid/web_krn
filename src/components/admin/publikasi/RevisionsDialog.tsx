"use client";

import { useEffect, useState } from "react";

import { listRevisionsAction, restoreRevisionAction } from "@/app/admin/(panel)/publikasi/actions";
import { Dialog } from "@/components/admin/Dialog";
import { StatusBadge } from "@/components/admin/StatusBadge";
import type { RevisionSummary } from "@/types/admin-posts";

const fmt = new Intl.DateTimeFormat("id-ID", {
  timeZone: "Asia/Jakarta",
  day: "2-digit",
  month: "short",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
});

/** Riwayat revisi (post_revisions) dengan tombol Pulihkan dua langkah. */
export function RevisionsDialog({ open, postId, dirty, onClose }: { open: boolean; postId: number; dirty: boolean; onClose: () => void }) {
  return (
    <Dialog open={open} title="Riwayat revisi" onClose={onClose}>
      <RevisionList postId={postId} dirty={dirty} />
    </Dialog>
  );
}

function RevisionList({ postId, dirty }: { postId: number; dirty: boolean }) {
  const [items, setItems] = useState<RevisionSummary[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [armed, setArmed] = useState<number | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let cancelled = false;
    listRevisionsAction(postId)
      .then((rows) => {
        if (!cancelled) setItems(rows);
      })
      .catch(() => {
        if (!cancelled) setError("Gagal memuat riwayat revisi.");
      });
    return () => {
      cancelled = true;
    };
  }, [postId]);

  const restore = async (revisionId: number) => {
    setBusy(true);
    setError(null);
    try {
      const result = await restoreRevisionAction(postId, revisionId);
      if (result.ok) {
        // Muat ulang agar editor memakai isi hasil pemulihan.
        window.location.reload();
        return;
      }
      setError(result.error ?? "Gagal memulihkan revisi.");
    } catch {
      setError("Gagal memulihkan revisi.");
    }
    setBusy(false);
    setArmed(null);
  };

  return (
    <div className="flex flex-col gap-3">
      <p className="text-[13px] text-admin-text">
        Memulihkan revisi mengganti judul, isi, ringkasan, SEO, gambar unggulan, kategori, dan tag. Status, permalink, dan tanggal
        terbit tidak berubah.
        {dirty ? <strong className="text-admin-warn-text"> Perubahan yang belum disimpan akan hilang.</strong> : null}
      </p>
      {error ? (
        <p role="alert" className="rounded-admin bg-admin-danger-bg p-3 text-sm font-semibold text-admin-danger">
          {error}
        </p>
      ) : null}
      {items === null && !error ? <p className="py-6 text-center text-sm text-admin-text">Memuat…</p> : null}
      {items?.length === 0 ? (
        <p className="py-6 text-center text-sm text-admin-text">Belum ada revisi. Revisi dibuat setiap kali publikasi disimpan.</p>
      ) : null}
      <ol className="flex flex-col gap-2">
        {items?.map((r, i) => (
          <li key={r.id} className="flex flex-wrap items-center gap-3 rounded-admin bg-admin-canvas p-3">
            <div className="min-w-0 flex-1">
              <p className="flex flex-wrap items-center gap-2 text-sm font-bold">
                {fmt.format(new Date(r.createdAt))}
                {r.status ? <StatusBadge status={r.status} /> : null}
                {i === 0 ? <span className="text-xs font-semibold text-admin-text">(terbaru)</span> : null}
              </p>
              <p className="truncate text-[13px] text-admin-text">
                {r.author ?? "Sistem"} · {r.title}
              </p>
            </div>
            {armed === r.id ? (
              <span className="flex gap-2">
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => void restore(r.id)}
                  className="min-h-11 rounded-admin bg-primary px-3 text-sm font-extrabold text-white hover:bg-admin-primary-dark focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary disabled:opacity-60"
                >
                  {busy ? "Memulihkan…" : "Ya, pulihkan"}
                </button>
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => setArmed(null)}
                  className="min-h-11 rounded-admin border border-admin-field bg-white px-3 text-sm font-bold focus-visible:outline-2 focus-visible:outline-primary"
                >
                  Batal
                </button>
              </span>
            ) : (
              <button
                type="button"
                disabled={busy}
                onClick={() => setArmed(r.id)}
                className="min-h-11 rounded-admin border border-admin-field bg-white px-3 text-sm font-bold hover:border-primary focus-visible:outline-2 focus-visible:outline-primary"
              >
                Pulihkan<span className="sr-only"> revisi {fmt.format(new Date(r.createdAt))}</span>
              </button>
            )}
          </li>
        ))}
      </ol>
    </div>
  );
}
