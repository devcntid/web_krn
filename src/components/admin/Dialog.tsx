"use client";

import { X } from "lucide-react";
import { useEffect, useId, useRef, useSyncExternalStore } from "react";
import { createPortal } from "react-dom";

const onClient = () => true;
const onServer = () => false;
const subscribe = () => () => {};

/**
 * Dialog modal umum berbasis <dialog>.showModal() (fokus terkunci, Esc menutup, fokus kembali
 * ke pemicu). Untuk konfirmasi ya/tidak pakai ConfirmDialog.
 * Dirender ke document.body agar tidak bersarang di dialog atau form lain.
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
  const openRef = useRef(open);
  const filePicker = useRef(false);
  const titleId = useId();
  const portaled = useSyncExternalStore(subscribe, onClient, onServer);
  openRef.current = open;

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) {
      returnTo.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
      dialog.showModal();
    } else if (!open && dialog.open) {
      dialog.close();
    }
  }, [open, portaled]);

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;

    const armFilePicker = (event: Event) => {
      const target = event.target;
      if (!(target instanceof Element)) return;
      const owned = target instanceof HTMLInputElement && target.type === "file" ? target : target.closest("label")?.querySelector('input[type="file"]');
      if (!(owned instanceof HTMLInputElement)) return;
      filePicker.current = true;
      const release = () => window.setTimeout(() => {
        filePicker.current = false;
      }, 400);
      owned.addEventListener("change", release, { once: true });
      owned.addEventListener("cancel", release, { once: true });
    };

    let blurAt = 0;
    const onBlur = () => {
      blurAt = Date.now();
    };
    const onFocus = () => {
      if (!filePicker.current || Date.now() - blurAt < 300) return;
      window.setTimeout(() => {
        filePicker.current = false;
      }, 500);
    };

    const onCancel = (event: Event) => {
      event.preventDefault();
      event.stopPropagation();
    };

    const onKeyDown = (event: KeyboardEvent) => {
      const inside = event.target instanceof Node && dialog.contains(event.target);
      if (event.key !== "Escape" || !inside) return;
      event.preventDefault();
      event.stopPropagation();
      if (filePicker.current) return;
      onClose();
    };

    const onNativeClose = () => {
      if (openRef.current && filePicker.current) dialog.showModal();
    };

    dialog.addEventListener("pointerdown", armFilePicker, true);
    dialog.addEventListener("cancel", onCancel);
    dialog.addEventListener("keydown", onKeyDown);
    dialog.addEventListener("close", onNativeClose);
    window.addEventListener("blur", onBlur);
    window.addEventListener("focus", onFocus);
    return () => {
      dialog.removeEventListener("pointerdown", armFilePicker, true);
      dialog.removeEventListener("cancel", onCancel);
      dialog.removeEventListener("keydown", onKeyDown);
      dialog.removeEventListener("close", onNativeClose);
      window.removeEventListener("blur", onBlur);
      window.removeEventListener("focus", onFocus);
    };
  }, [onClose, portaled]);

  const node = (
    <dialog
      ref={ref}
      aria-labelledby={titleId}
      onClose={(event) => {
        if (event.target === event.currentTarget && !filePicker.current) returnTo.current?.focus();
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

  if (!portaled) return node;
  return createPortal(node, document.body);
}
