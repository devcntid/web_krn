"use client";

import { X } from "lucide-react";
import { useEffect, useId, useRef } from "react";

/**
 * Dialog modal umum berbasis <dialog>.showModal() (fokus terkunci, Esc menutup, fokus kembali
 * ke pemicu). Untuk konfirmasi ya/tidak pakai ConfirmDialog.
 */
export function Dialog({
  open,
  title,
  onClose,
  size = "md",
  children,
}: {
  open: boolean;
  title: string;
  onClose: () => void;
  size?: "md" | "xl";
  children: React.ReactNode;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const returnTo = useRef<HTMLElement | null>(null);
  const titleId = useId();

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) {
      returnTo.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
      dialog.showModal();
    } else if (!open && dialog.open) {
      dialog.close();
    }
  }, [open]);

  return (
    <dialog
      ref={ref}
      aria-labelledby={titleId}
      onCancel={(e) => {
        // Di React, `cancel`/`close` dari dialog yang bersarang (mis. MediaPicker di dalam dialog
        // edit) ikut naik ke dialog luar — abaikan agar Esc hanya menutup dialog teratas.
        if (e.target !== e.currentTarget) return;
        e.preventDefault();
        onClose();
      }}
      onClose={(e) => {
        if (e.target === e.currentTarget) returnTo.current?.focus();
      }}
      className={`m-auto max-h-[calc(100dvh-32px)] w-[calc(100%-32px)] flex-col rounded-2xl bg-white p-0 text-admin-ink shadow-admin-card backdrop:bg-admin-ink/50 open:flex ${
        size === "xl" ? "max-w-4xl" : "max-w-lg"
      }`}
    >
      <div className="flex items-center justify-between gap-3 border-b border-admin-line py-2 pr-2 pl-5">
        <h2 id={titleId} className="text-lg font-extrabold">
          {title}
        </h2>
        <button
          type="button"
          onClick={onClose}
          aria-label="Tutup"
          className="flex size-11 items-center justify-center rounded-lg text-admin-text hover:bg-admin-canvas focus-visible:outline-2 focus-visible:outline-primary"
        >
          <X aria-hidden="true" size={18} />
        </button>
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto p-5">{open ? children : null}</div>
    </dialog>
  );
}
