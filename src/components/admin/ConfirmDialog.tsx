"use client";

import { useEffect, useId, useRef } from "react";

type Props = {
  open: boolean;
  title: string;
  description?: React.ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  tone?: "primary" | "danger";
  busy?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
};

/**
 * Dialog konfirmasi modal berbasis <dialog>.showModal(): latar di luar dialog otomatis inert
 * (fokus terkunci di dialog), Esc membatalkan, dan fokus dikembalikan ke elemen pemicu saat ditutup.
 */
export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel = "Ya, lanjutkan",
  cancelLabel = "Batal",
  tone = "primary",
  busy = false,
  onConfirm,
  onCancel,
}: Props) {
  const ref = useRef<HTMLDialogElement>(null);
  const cancelRef = useRef<HTMLButtonElement>(null);
  const returnTo = useRef<HTMLElement | null>(null);
  const titleId = useId();
  const descId = useId();

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) {
      returnTo.current =
        document.activeElement instanceof HTMLElement
          ? document.activeElement
          : null;
      dialog.showModal();
      cancelRef.current?.focus();
    } else if (!open && dialog.open) {
      dialog.close();
    }
  }, [open]);

  return (
    <dialog
      ref={ref}
      aria-labelledby={titleId}
      aria-describedby={description ? descId : undefined}
      onCancel={(e) => {
        e.preventDefault();
        if (!busy) onCancel();
      }}
      onClose={() => returnTo.current?.focus()}
      className="m-auto w-[calc(100%-32px)] max-w-md rounded-2xl bg-white p-0 text-admin-ink shadow-admin-card backdrop:bg-admin-ink/50"
    >
      <div className="flex flex-col gap-3 p-6">
        <h2 id={titleId} className="text-lg font-extrabold">
          {title}
        </h2>
        {description ? (
          <div id={descId} className="text-sm text-admin-text">
            {description}
          </div>
        ) : null}
        <div className="mt-3 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <button
            ref={cancelRef}
            type="button"
            onClick={onCancel}
            disabled={busy}
            className="min-h-11 rounded-admin border border-admin-field bg-white px-4 text-sm font-bold hover:bg-admin-canvas focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={busy}
            aria-busy={busy || undefined}
            className={`min-h-11 rounded-admin px-4 text-sm font-extrabold text-white focus-visible:outline-2 focus-visible:outline-offset-2 disabled:opacity-70 ${
              tone === "danger"
                ? "bg-admin-danger hover:brightness-95 focus-visible:outline-admin-danger"
                : "bg-primary hover:bg-admin-primary-dark focus-visible:outline-primary"
            }`}
          >
            {busy ? "Memproses…" : confirmLabel}
          </button>
        </div>
      </div>
    </dialog>
  );
}
