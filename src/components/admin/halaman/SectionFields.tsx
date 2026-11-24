"use client";

import { ArrowDown, ArrowUp, Trash2, X } from "lucide-react";
import Image from "next/image";
import { createContext, useContext, useId, useState, type ReactNode } from "react";

import { MediaPicker } from "@/components/admin/publikasi/MediaPicker";
import { RichTextEditor } from "@/components/admin/publikasi/RichTextEditor";
import { mediaUrl } from "@/lib/media";
import { type Field, type Json, type JsonObject, initialData } from "@/lib/section-fields";
import type { MediaChoice } from "@/types/admin-posts";

export type FieldOptions = { categories: readonly { value: string; label: string }[] };

type PickImage = (onSelect: (media: MediaChoice) => void) => void;
const PickerContext = createContext<PickImage | null>(null);
const OptionsContext = createContext<FieldOptions>({ categories: [] });

const input =
  "min-h-11 w-full rounded-lg border border-admin-field bg-white px-3 text-sm text-admin-ink focus-visible:outline-2 focus-visible:outline-primary";
const labelClass = "text-xs font-bold text-admin-text";
const smallBtn =
  "inline-flex min-h-11 items-center justify-center gap-1.5 rounded-lg border border-admin-field bg-white px-3 text-[13px] font-bold text-admin-ink hover:bg-admin-canvas focus-visible:outline-2 focus-visible:outline-primary disabled:opacity-40";
const iconBtn =
  "flex size-11 shrink-0 items-center justify-center rounded-lg border border-admin-field bg-white text-admin-ink hover:bg-admin-canvas focus-visible:outline-2 focus-visible:outline-primary disabled:opacity-40";

const isObject = (v: Json | undefined): v is JsonObject => typeof v === "object" && v !== null && !Array.isArray(v);
const asString = (v: Json | undefined) => (typeof v === "string" ? v : "");
const asArray = (v: Json | undefined): Json[] => (Array.isArray(v) ? v : []);

function move<T>(list: readonly T[], from: number, to: number): T[] {
  const next = [...list];
  const [item] = next.splice(from, 1);
  if (item !== undefined) next.splice(to, 0, item);
  return next;
}

/**
 * Form generik untuk isi satu section, dibangun dari deskripsi field (src/lib/section-fields.ts).
 * Satu MediaPicker dipakai bersama oleh semua field gambar di dalamnya.
 */
export function SectionForm({
  fields,
  value,
  onChange,
  options,
}: {
  fields: readonly Field[];
  value: JsonObject;
  onChange: (value: JsonObject) => void;
  options: FieldOptions;
}) {
  const [picking, setPicking] = useState<{ onSelect: (media: MediaChoice) => void } | null>(null);
  return (
    <OptionsContext.Provider value={options}>
      <PickerContext.Provider value={(onSelect) => setPicking({ onSelect })}>
        <FieldGroup fields={fields} value={value} onChange={onChange} />
        <MediaPicker
          open={picking !== null}
          onClose={() => setPicking(null)}
          onSelect={(media) => {
            picking?.onSelect(media);
            setPicking(null);
          }}
        />
      </PickerContext.Provider>
    </OptionsContext.Provider>
  );
}

function HtmlField({
  label,
  optional,
  help,
  value,
  onChange,
  preset,
}: {
  label: string;
  optional?: boolean;
  help: ReactNode;
  value: string;
  onChange: (value: string) => void;
  preset: "full" | "text";
}) {
  return (
    <div>
      <p className={labelClass}>
        {label}
        {optional ? " (opsional)" : ""}
      </p>
      {help}
      <RichTextEditor
        initialJson={null}
        initialHtml={value.trim() ? value : "<p></p>"}
        editable
        preset={preset}
        ariaLabel={label}
        onChange={({ html }) => onChange(html)}
      />
    </div>
  );
}

function FieldGroup({ fields, value, onChange }: { fields: readonly Field[]; value: JsonObject; onChange: (value: JsonObject) => void }) {
  return (
    <div className="flex flex-col gap-4">
      {fields.map((field) => (
        <FieldInput key={field.name} field={field} value={value[field.name]} onChange={(v) => onChange({ ...value, [field.name]: v })} />
      ))}
    </div>
  );
}

function FieldInput({ field, value, onChange }: { field: Field; value: Json | undefined; onChange: (value: Json) => void }) {
  const id = useId();
  const help = field.help ? (
    <p id={`${id}-help`} className="mt-1 text-xs text-admin-text">
      {field.help}
    </p>
  ) : null;
  const describedBy = field.help ? `${id}-help` : undefined;

  switch (field.kind) {
    case "text":
    case "url":
      return (
        <div>
          <label htmlFor={id} className={labelClass}>
            {field.label}
            {field.optional ? " (opsional)" : ""}
          </label>
          <input
            id={id}
            value={asString(value)}
            onChange={(e) => onChange(e.target.value)}
            required={!field.optional}
            inputMode={field.kind === "url" ? "url" : undefined}
            aria-describedby={describedBy}
            className={`${input} mt-1`}
          />
          {help}
        </div>
      );
    case "html":
      return (
        <HtmlField
          label={field.label}
          optional={field.optional}
          help={help}
          value={asString(value)}
          onChange={onChange}
          preset={field.name === "html" ? "full" : "text"}
        />
      );
    case "textarea":
      return (
        <div>
          <label htmlFor={id} className={labelClass}>
            {field.label}
            {field.optional ? " (opsional)" : ""}
          </label>
          <textarea
            id={id}
            value={asString(value)}
            onChange={(e) => onChange(e.target.value)}
            required={!field.optional}
            rows={3}
            aria-describedby={describedBy}
            className={`${input} mt-1 py-2 leading-normal`}
          />
          {help}
        </div>
      );
    case "number":
      return (
        <div>
          <label htmlFor={id} className={labelClass}>
            {field.label}
          </label>
          <input
            id={id}
            type="number"
            value={typeof value === "number" ? value : ""}
            min={field.min}
            max={field.max}
            step={field.step}
            onChange={(e) => onChange(e.target.value === "" ? null : Number(e.target.value))}
            aria-describedby={describedBy}
            className={`${input} mt-1 max-w-40`}
          />
          {help}
        </div>
      );
    case "select":
      return (
        <div>
          <label htmlFor={id} className={labelClass}>
            {field.label}
          </label>
          <select id={id} value={asString(value)} onChange={(e) => onChange(e.target.value)} className={`${input} mt-1 max-w-72`}>
            {field.options.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
          {help}
        </div>
      );
    case "boolean":
      return (
        <label className="flex min-h-11 items-center gap-2.5 text-sm font-semibold text-admin-ink">
          <input type="checkbox" checked={value === true} onChange={(e) => onChange(e.target.checked)} className="size-4.5 accent-primary" />
          {field.label}
        </label>
      );
    case "image":
      return <ImageField field={field} value={value} onChange={onChange} />;
    case "strings":
      return <StringsField field={field} value={asArray(value)} onChange={onChange} />;
    case "categories":
      return <CategoriesField field={field} value={asArray(value)} onChange={onChange} />;
    case "list":
      return <ListField field={field} value={asArray(value)} onChange={onChange} />;
  }
}

function ImageField({ field, value, onChange }: { field: Extract<Field, { kind: "image" }>; value: Json | undefined; onChange: (value: Json) => void }) {
  const pick = useContext(PickerContext);
  const altId = useId();
  const image = isObject(value) && typeof value.src === "string" ? value : null;
  return (
    <fieldset>
      <legend className={labelClass}>
        {field.label}
        {field.optional ? " (opsional)" : ""}
      </legend>
      <div className="mt-1 flex flex-wrap items-start gap-3">
        {image ? (
          <span className="relative block h-20 w-28 shrink-0 overflow-hidden rounded-lg bg-admin-neutral-bg">
            <Image src={mediaUrl(asString(image.src))} alt="" fill sizes="112px" className="object-contain" />
          </span>
        ) : (
          <span className="flex h-20 w-28 shrink-0 items-center justify-center rounded-lg border border-dashed border-admin-field bg-admin-canvas text-xs font-semibold text-admin-text">
            Belum ada
          </span>
        )}
        <div className="flex min-w-48 flex-1 flex-col gap-2">
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              className={smallBtn}
              onClick={() => pick?.((m) => onChange({ src: m.url, width: m.width ?? 1200, height: m.height ?? 800, alt: m.alt }))}
            >
              {image ? "Ganti gambar" : "Pilih gambar"}
            </button>
            {image && field.optional ? (
              <button type="button" className={smallBtn} onClick={() => onChange(null)}>
                Hapus
              </button>
            ) : null}
          </div>
          {image ? (
            <div>
              <label htmlFor={altId} className={labelClass}>
                Teks alt (kosongkan bila gambar hanya hiasan)
              </label>
              <input id={altId} value={asString(image.alt)} onChange={(e) => onChange({ ...image, alt: e.target.value })} maxLength={300} className={`${input} mt-1`} />
            </div>
          ) : null}
        </div>
      </div>
      {field.help ? <p className="mt-1 text-xs text-admin-text">{field.help}</p> : null}
    </fieldset>
  );
}

function StringsField({ field, value, onChange }: { field: Extract<Field, { kind: "strings" }>; value: Json[]; onChange: (value: Json) => void }) {
  const set = (i: number, v: string) => onChange(value.map((x, j) => (j === i ? v : x)));
  return (
    <fieldset>
      <legend className={labelClass}>{field.label}</legend>
      <ul className="mt-1 flex flex-col gap-2">
        {value.map((item, i) => (
          // Kunci indeks: daftar teks polos tanpa identitas; fokus tetap di kotak yang sama saat mengetik.
          <li key={i} className="flex items-start gap-2">
            {field.multiline ? (
              <textarea
                aria-label={`${field.label} ${i + 1}`}
                value={asString(item)}
                onChange={(e) => set(i, e.target.value)}
                rows={2}
                className={`${input} py-2 leading-normal`}
              />
            ) : (
              <input aria-label={`${field.label} ${i + 1}`} value={asString(item)} onChange={(e) => set(i, e.target.value)} className={input} />
            )}
            <button type="button" className={iconBtn} disabled={i === 0} onClick={() => onChange(move(value, i, i - 1))}>
              <ArrowUp aria-hidden="true" size={16} />
              <span className="sr-only">
                Naikkan {field.itemLabel} {i + 1}
              </span>
            </button>
            <button type="button" className={iconBtn} onClick={() => onChange(value.filter((_, j) => j !== i))}>
              <X aria-hidden="true" size={16} />
              <span className="sr-only">
                Hapus {field.itemLabel} {i + 1}
              </span>
            </button>
          </li>
        ))}
      </ul>
      <button type="button" className={`${smallBtn} mt-2`} onClick={() => onChange([...value, ""])}>
        + Tambah {field.itemLabel}
      </button>
      {field.help ? <p className="mt-1 text-xs text-admin-text">{field.help}</p> : null}
    </fieldset>
  );
}

function CategoriesField({ field, value, onChange }: { field: Extract<Field, { kind: "categories" }>; value: Json[]; onChange: (value: Json) => void }) {
  const { categories } = useContext(OptionsContext);
  const id = useId();
  const selected = value.filter((v): v is string => typeof v === "string");
  const name = (slug: string) => categories.find((c) => c.value === slug)?.label ?? slug;
  return (
    <fieldset>
      <legend className={labelClass}>{field.label}</legend>
      <ul className="mt-1 flex flex-wrap gap-2">
        {selected.map((slug) => (
          <li key={slug} className="inline-flex min-h-11 items-center rounded-full bg-admin-ok-bg pl-3.5 text-[13px] font-bold text-admin-primary-dark">
            {name(slug)}
            <button
              type="button"
              onClick={() => onChange(selected.filter((s) => s !== slug))}
              className="flex size-11 items-center justify-center rounded-full hover:bg-white/70 focus-visible:outline-2 focus-visible:outline-primary"
            >
              <X aria-hidden="true" size={14} />
              <span className="sr-only">Hapus kategori {name(slug)}</span>
            </button>
          </li>
        ))}
        {selected.length === 0 ? <li className="flex min-h-11 items-center text-[13px] text-admin-text">Semua kategori (publikasi terbaru).</li> : null}
      </ul>
      <label htmlFor={id} className="sr-only">
        Tambah kategori sumber
      </label>
      <select id={id} value="" onChange={(e) => e.target.value && onChange([...selected, e.target.value])} className={`${input} mt-2 max-w-72`}>
        <option value="">+ Tambah kategori…</option>
        {categories
          .filter((c) => !selected.includes(c.value))
          .map((c) => (
            <option key={c.value} value={c.value}>
              {c.label}
            </option>
          ))}
      </select>
      {field.help ? <p className="mt-1 text-xs text-admin-text">{field.help}</p> : null}
    </fieldset>
  );
}

function ListField({ field, value, onChange }: { field: Extract<Field, { kind: "list" }>; value: Json[]; onChange: (value: Json) => void }) {
  // Butir yang baru ditambahkan langsung terbuka; butir lama tertutup agar daftar panjang tetap ringkas.
  const [opened, setOpened] = useState<number | null>(null);
  return (
    <fieldset className="rounded-xl border border-admin-line p-3">
      <legend className="px-1 text-xs font-extrabold tracking-wide text-admin-text uppercase">
        {field.label} ({value.length})
      </legend>
      {field.help ? <p className="mb-2 text-xs text-admin-text">{field.help}</p> : null}
      <ol className="flex flex-col gap-2">
        {value.map((item, i) => {
          const obj = isObject(item) ? item : {};
          const heading = (field.titleField && asString(obj[field.titleField]).trim()) || `${field.itemLabel} ${i + 1}`;
          return (
            // Kunci indeks: butir tidak punya ID; urutan diubah lewat tombol, bukan seret.
            <li key={i} className="rounded-lg border border-admin-line bg-admin-row-hover">
              <details
                open={opened === i}
                onToggle={(e) => {
                  // Baca `open` sekarang: currentTarget sudah null saat updater state dijalankan.
                  const isOpen = e.currentTarget.open;
                  setOpened((cur) => (isOpen ? i : cur === i ? null : cur));
                }}
              >
                <summary className="flex min-h-11 cursor-pointer items-center gap-2 rounded-lg px-3 text-sm font-bold text-admin-ink focus-visible:outline-2 focus-visible:outline-primary">
                  <span className="text-admin-text">{i + 1}.</span>
                  <span className="min-w-0 flex-1 truncate">{heading}</span>
                </summary>
                <div className="border-t border-admin-line p-3">
                  <FieldGroup fields={field.fields} value={obj} onChange={(v) => onChange(value.map((x, j) => (j === i ? v : x)))} />
                  <div className="mt-3 flex flex-wrap gap-2 border-t border-admin-line pt-3">
                    <button
                      type="button"
                      className={smallBtn}
                      disabled={i === 0}
                      onClick={() => {
                        onChange(move(value, i, i - 1));
                        setOpened(i - 1);
                      }}
                    >
                      <ArrowUp aria-hidden="true" size={14} /> Naikkan
                    </button>
                    <button
                      type="button"
                      className={smallBtn}
                      disabled={i === value.length - 1}
                      onClick={() => {
                        onChange(move(value, i, i + 1));
                        setOpened(i + 1);
                      }}
                    >
                      <ArrowDown aria-hidden="true" size={14} /> Turunkan
                    </button>
                    <button
                      type="button"
                      className={`${smallBtn} border-admin-danger text-admin-danger`}
                      onClick={() => {
                        onChange(value.filter((_, j) => j !== i));
                        setOpened(null);
                      }}
                    >
                      <Trash2 aria-hidden="true" size={14} /> Hapus {field.itemLabel}
                    </button>
                  </div>
                </div>
              </details>
            </li>
          );
        })}
      </ol>
      <button
        type="button"
        className={`${smallBtn} mt-2`}
        onClick={() => {
          onChange([...value, initialData(field.fields)]);
          setOpened(value.length);
        }}
      >
        + Tambah {field.itemLabel}
      </button>
    </fieldset>
  );
}
