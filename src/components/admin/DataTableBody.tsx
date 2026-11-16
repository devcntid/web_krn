"use client";

import { useEffect, useMemo, useRef, useState, useTransition } from "react";

import { ConfirmDialog } from "./ConfirmDialog";
import { type ToastTone, useToast } from "./Toast";

export type BulkAction = {
  value: string;
  label: string;
  tone?: "primary" | "danger";
  /** Bila diisi, minta konfirmasi lewat ConfirmDialog sebelum menjalankan aksi. */
  confirm?: { title: string; description?: string; confirmLabel?: string };
  /** Bila diisi, aksi butuh pilihan tambahan (mis. kategori tujuan) yang dikirim sebagai `option`. */
  options?: readonly { value: string; label: string }[];
  optionLabel?: string;
};
/** Aksi massal boleh mengembalikan pesan sendiri untuk toast (mis. jumlah yang dilewati). */
export type BulkActionResult = void | { message: string; tone?: ToastTone };
export type ColumnMeta = {
  key: string;
  align: "left" | "right" | "center";
  className?: string;
};
type Header = {
  key: string;
  node: React.ReactNode;
  ariaSort: "ascending" | "descending" | "none" | undefined;
};

const ALIGN = {
  left: "text-left",
  right: "text-right",
  center: "text-center",
} as const;

/** Bagian klien DataTable: menerima sel yang SUDAH dirender di server; mengurus pilih baris & aksi massal. */
export function DataTableBody({
  caption,
  headers,
  columns,
  rows,
  bulkActions,
  bulkAction,
}: {
  caption: string;
  headers: Header[];
  columns: ColumnMeta[];
  rows: { id: string; cells: React.ReactNode[] }[];
  bulkActions: readonly BulkAction[];
  bulkAction?: (formData: FormData) => Promise<BulkActionResult>;
}) {
  const selectable = bulkActions.length > 0 && Boolean(bulkAction);
  const [selected, setSelected] = useState<ReadonlySet<string>>(new Set());
  const [pending, setPending] = useState<BulkAction | null>(null);
  const [options, setOptions] = useState<Readonly<Record<string, string>>>({});
  const [busy, startTransition] = useTransition();
  const toast = useToast();
  const allRef = useRef<HTMLInputElement>(null);

  const ids = useMemo(() => rows.map((r) => r.id), [rows]);
  // Halaman/urutan berganti → buang pilihan yang tidak lagi tampil.
  const visibleSelected = ids.filter((id) => selected.has(id));
  const all = visibleSelected.length === ids.length && ids.length > 0;
  const some = visibleSelected.length > 0 && !all;

  useEffect(() => {
    if (allRef.current) allRef.current.indeterminate = some;
  }, [some]);

  const toggle = (id: string) =>
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const run = (action: BulkAction) => {
    if (!bulkAction) return;
    const chosen = visibleSelected;
    startTransition(async () => {
      const fd = new FormData();
      fd.set("action", action.value);
      if (action.options) fd.set("option", options[action.value] ?? "");
      for (const id of chosen) fd.append("ids", id);
      try {
        const result = await bulkAction(fd);
        if (result) toast.show(result.message, result.tone ?? "success");
        else
          toast.show(
            `${action.label}: ${chosen.length} item diproses.`,
            "success",
          );
        if (!result || result.tone !== "error") setSelected(new Set());
      } catch {
        toast.show(`${action.label} gagal. Coba lagi.`, "error");
      } finally {
        setPending(null);
      }
    });
  };

  return (
    <>
      {selectable && visibleSelected.length > 0 ? (
        <div className="flex flex-wrap items-center gap-2 border-b border-admin-line bg-admin-ok-bg px-4 py-2">
          <p
            className="mr-auto text-sm font-bold text-admin-primary-dark"
            aria-live="polite"
          >
            {visibleSelected.length} dipilih
          </p>
          {bulkActions.map((a) => (
            <span key={a.value} className="flex items-center gap-1.5">
              {a.options ? (
                <select
                  aria-label={a.optionLabel ?? a.label}
                  value={options[a.value] ?? ""}
                  onChange={(e) =>
                    setOptions((prev) => ({
                      ...prev,
                      [a.value]: e.target.value,
                    }))
                  }
                  className="min-h-11 max-w-44 rounded-admin border border-admin-field bg-white px-2 text-sm font-semibold text-admin-ink focus-visible:outline-2 focus-visible:outline-primary"
                >
                  <option value="">{a.optionLabel ?? "Pilih…"}</option>
                  {a.options.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>
              ) : null}
            <button
              type="button"
              disabled={busy || (a.options ? !options[a.value] : false)}
              onClick={() => (a.confirm ? setPending(a) : run(a))}
              className={`min-h-11 rounded-admin border bg-white px-3 text-sm font-bold focus-visible:outline-2 focus-visible:outline-primary disabled:opacity-60 ${
                a.tone === "danger"
                  ? "border-admin-danger text-admin-danger"
                  : "border-admin-field text-admin-ink"
              }`}
            >
              {a.label}
            </button>
            </span>
          ))}
          <button
            type="button"
            onClick={() => setSelected(new Set())}
            className="min-h-11 rounded-admin px-3 text-sm font-bold text-admin-text underline focus-visible:outline-2 focus-visible:outline-primary"
          >
            Batalkan pilihan
          </button>
        </div>
      ) : null}
      <div className="relative overflow-x-auto">
        <table className="w-full min-w-[640px] border-collapse text-sm">
          <caption className="sr-only">{caption}</caption>
          <thead className="bg-admin-canvas text-xs font-bold tracking-wide text-admin-text uppercase">
            <tr>
              {selectable ? (
                <th scope="col" className="w-12 px-4">
                  <label className="flex size-11 items-center justify-center">
                    <input
                      ref={allRef}
                      type="checkbox"
                      checked={all}
                      onChange={() =>
                        setSelected(all ? new Set() : new Set(ids))
                      }
                      className="size-4.5 accent-primary"
                    />
                    <span className="sr-only">
                      Pilih semua baris di halaman ini
                    </span>
                  </label>
                </th>
              ) : null}
              {headers.map((h, i) => (
                <th
                  key={h.key}
                  scope="col"
                  aria-sort={h.ariaSort}
                  className={`px-4 py-1 ${ALIGN[columns[i]?.align ?? "left"]}`}
                >
                  {h.node}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => {
              const on = selected.has(r.id);
              return (
                <tr
                  key={r.id}
                  className={`border-t border-admin-line ${on ? "bg-admin-ok-bg/50" : "hover:bg-admin-row-hover"}`}
                >
                  {selectable ? (
                    <td className="px-4">
                      <label className="flex size-11 items-center justify-center">
                        <input
                          type="checkbox"
                          checked={on}
                          onChange={() => toggle(r.id)}
                          className="size-4.5 accent-primary"
                        />
                        <span className="sr-only">Pilih baris {r.id}</span>
                      </label>
                    </td>
                  ) : null}
                  {r.cells.map((cell, i) => (
                    <td
                      key={columns[i]?.key ?? i}
                      className={`px-4 py-3 text-admin-ink ${ALIGN[columns[i]?.align ?? "left"]} ${columns[i]?.className ?? ""}`}
                    >
                      {cell}
                    </td>
                  ))}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <ConfirmDialog
        open={pending !== null}
        title={pending?.confirm?.title ?? ""}
        description={pending?.confirm?.description}
        confirmLabel={pending?.confirm?.confirmLabel ?? pending?.label}
        tone={pending?.tone}
        busy={busy}
        onConfirm={() => pending && run(pending)}
        onCancel={() => setPending(null)}
      />
    </>
  );
}
