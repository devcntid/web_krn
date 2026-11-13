"use client";

import { useEffect, useRef } from "react";
import { X } from "lucide-react";

/**
 * Overlay pencarian seperti Divi: form GET ke "/?s=" (URL WordPress lama
 * dipertahankan; proxy.ts me-rewrite ke /search).
 */
export function SearchOverlay({ open, onClose }: { open: boolean; onClose: () => void }) {
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!open) return;
    inputRef.current?.focus();
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="absolute inset-x-0 top-0 hidden lg:block">
      <form
        action="/"
        method="get"
        role="search"
        className="container-site flex h-[76px] items-center gap-4 rounded-[10px] bg-white px-5"
      >
        <label htmlFor="site-search" className="sr-only">
          Cari
        </label>
        <input
          ref={inputRef}
          id="site-search"
          name="s"
          type="search"
          placeholder="Search …"
          className="h-full flex-1 bg-transparent text-lg font-semibold text-ink outline-none placeholder:text-body-soft"
        />
        <button type="button" onClick={onClose} aria-label="Tutup pencarian" className="text-ink">
          <X className="size-6" />
        </button>
      </form>
    </div>
  );
}
