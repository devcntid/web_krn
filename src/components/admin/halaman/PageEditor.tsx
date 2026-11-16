"use client";

import { DndContext, type DragEndEvent, PointerSensor, closestCenter, useSensor, useSensors } from "@dnd-kit/core";
import { SortableContext, arrayMove, useSortable, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Eye, EyeOff, GripVertical, Trash2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useId, useState } from "react";

import { savePageAction } from "@/app/admin/(panel)/halaman/actions";
import { ConfirmDialog } from "@/components/admin/ConfirmDialog";
import { Dialog } from "@/components/admin/Dialog";
import { SORT_INSTRUCTIONS, arrowStep, moveById } from "@/components/admin/sortable";
import { useToast } from "@/components/admin/Toast";
import { type JsonObject, SECTION_DEFS, initialData, sectionDef, sectionSummary } from "@/lib/section-fields";
import type { PageTemplate, SectionIssue } from "@/server/sections";
import type { EditorPage, EditorSection, PageStatus } from "@/types/admin-pages";

import { type FieldOptions, SectionForm } from "./SectionFields";

const TEMPLATE_LABEL: Record<PageTemplate, string> = {
  generic: "Generik (hero kecil + teks)",
  sections: "Section",
  "sections-muted": "Section, latar abu muda",
};

const ghostBtn =
  "inline-flex min-h-11 items-center justify-center rounded-admin border border-admin-field bg-white px-3.5 text-[13px] font-bold text-admin-ink hover:bg-admin-canvas focus-visible:outline-2 focus-visible:outline-primary disabled:opacity-50";
const primaryBtn =
  "inline-flex min-h-11 items-center justify-center rounded-admin bg-primary px-4 text-[13px] font-extrabold text-white hover:bg-admin-primary-dark focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary disabled:opacity-60";
const field =
  "min-h-11 w-full rounded-lg border border-admin-field bg-white px-3 text-sm text-admin-ink focus-visible:outline-2 focus-visible:outline-primary";
const labelClass = "text-xs font-bold text-admin-text";

const typeLabel = (type: string) => {
  const def = sectionDef(type);
  return def ? (def.family === def.label ? def.label : `${def.family} · ${def.label}`) : type;
};

/** Editor halaman berbasis section (artboard "A4 · Halaman & Section"). */
export function PageEditor({ page, options, isStaticRoute }: { page: EditorPage; options: FieldOptions; isStaticRoute: boolean }) {
  const router = useRouter();
  const toast = useToast();
  const dndId = useId();
  const titleId = useId();
  const statusId = useId();
  const templateId = useId();
  const seoTitleId = useId();
  const seoDescId = useId();

  const [title, setTitle] = useState(page.title);
  const [status, setStatus] = useState<PageStatus>(page.status === "published" ? "published" : "draft");
  const [template, setTemplate] = useState<PageTemplate>(page.template);
  const [seoTitle, setSeoTitle] = useState(page.seoTitle);
  const [seoDescription, setSeoDescription] = useState(page.seoDescription);
  const [sections, setSections] = useState<EditorSection[]>(page.sections);

  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState(false);
  const [issues, setIssues] = useState<SectionIssue[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState<string | null>(null);
  const [removing, setRemoving] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);

  const [announce, setAnnounce] = useState("");
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 4 } }));


  useEffect(() => {
    if (!dirty) return;
    const warn = (e: BeforeUnloadEvent) => e.preventDefault();
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty]);

  const touch = () => {
    setDirty(true);
    setError(null);
  };
  const updateSections = (next: EditorSection[]) => {
    setSections(next);
    setIssues([]);
    touch();
  };

  const onDragEnd = ({ active, over }: DragEndEvent) => {
    if (!over || active.id === over.id) return;
    const from = sections.findIndex((s) => s.id === active.id);
    const to = sections.findIndex((s) => s.id === over.id);
    if (from >= 0 && to >= 0) updateSections(arrayMove(sections, from, to));
  };

  const addSection = (type: string) => {
    const def = sectionDef(type);
    if (!def) return;
    const section: EditorSection = { id: crypto.randomUUID(), type, visible: true, data: initialData(def.fields) };
    updateSections([...sections, section]);
    setAdding(false);
    setEditing(section.id);
  };

  const save = async () => {
    setSaving(true);
    setError(null);
    try {
      const result = await savePageAction({ id: page.id, title, status, template, seoTitle, seoDescription, sections });
      if (result.ok) {
        setDirty(false);
        setIssues([]);
        toast.show("Halaman disimpan.", "success");
        router.refresh();
      } else {
        setError(result.error);
        setIssues(result.issues ?? []);
        toast.show(result.error, "error");
      }
    } catch {
      toast.show("Gagal menyimpan. Periksa koneksi lalu coba lagi.", "error");
    } finally {
      setSaving(false);
    }
  };

  const preview = () => {
    if (dirty) toast.show("Pratinjau menampilkan versi tersimpan terakhir. Simpan dulu untuk melihat perubahan terbaru.", "info");
    window.open(`/api/preview/?page=${page.id}`, "_blank");
  };

  const editingSection = sections.find((s) => s.id === editing);
  const removingSection = sections.find((s) => s.id === removing);
  const families = [...new Set(SECTION_DEFS.map((d) => d.family))];
  const available = template === "generic" ? SECTION_DEFS.filter((d) => d.type === "richtext") : SECTION_DEFS;

  return (
    <section aria-labelledby={`${titleId}-h`} className="min-w-0 flex-[999_1_520px] rounded-xl border border-admin-line bg-white p-5 sm:p-[22px]">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="min-w-0">
          <h2 id={`${titleId}-h`} className="text-xl font-extrabold text-admin-ink">
            {title || "(tanpa judul)"}
          </h2>
          <p className="mt-0.5 text-[13px] break-all text-admin-text">
            /{page.path}/ · Tata letak: {TEMPLATE_LABEL[template]}
            {dirty ? <span className="font-semibold text-admin-warn-text"> · Ada perubahan belum disimpan</span> : null}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {page.status === "published" ? (
            <Link href={`/${page.path}/`} target="_blank" rel="noopener" className={ghostBtn}>
              Lihat <span aria-hidden="true">&nbsp;↗</span>
              <span className="sr-only"> halaman publik (tab baru)</span>
            </Link>
          ) : null}
          <button type="button" className={ghostBtn} onClick={preview}>
            Pratinjau
          </button>
          <button type="button" className={primaryBtn} disabled={saving} onClick={() => void save()}>
            {saving ? "Menyimpan…" : "Simpan"}
          </button>
        </div>
      </div>

      {isStaticRoute ? (
        <p role="note" className="mt-4 rounded-admin bg-admin-info-bg p-3 text-[13px] font-semibold text-admin-info-text">
          Halaman ini punya alamat tetap di situs. Urutan, isi, dan tampil/sembunyi section langsung berlaku di halaman publik setelah disimpan.
        </p>
      ) : null}
      {page.dropped > 0 ? (
        <p role="alert" className="mt-4 rounded-admin border border-admin-field-warn bg-admin-warn-bg p-3 text-[13px] font-semibold text-admin-warn-text">
          {page.dropped} section tersimpan tidak dikenali dan tidak ditampilkan di sini. Menyimpan halaman akan menghapusnya.
        </p>
      ) : null}
      {error ? (
        <p role="alert" className="mt-4 rounded-admin border border-admin-danger bg-admin-danger-bg p-3 text-sm font-semibold text-admin-danger">
          {error}
        </p>
      ) : null}

      <details className="mt-4 rounded-xl border border-admin-line">
        <summary className="flex min-h-11 cursor-pointer items-center px-4 text-sm font-extrabold text-admin-ink focus-visible:outline-2 focus-visible:outline-primary">
          Pengaturan halaman (judul, status, tata letak, SEO)
        </summary>
        <div className="grid gap-4 border-t border-admin-line p-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label htmlFor={titleId} className={labelClass}>
              Judul halaman
            </label>
            <input
              id={titleId}
              value={title}
              maxLength={200}
              onChange={(e) => {
                setTitle(e.target.value);
                touch();
              }}
              className={`${field} mt-1`}
            />
          </div>
          <div>
            <label htmlFor={statusId} className={labelClass}>
              Status
            </label>
            <select
              id={statusId}
              value={status}
              onChange={(e) => {
                setStatus(e.target.value === "published" ? "published" : "draft");
                touch();
              }}
              aria-describedby={`${statusId}-help`}
              className={`${field} mt-1`}
            >
              <option value="published">Terbit</option>
              <option value="draft">Draf (tidak tampil di situs)</option>
            </select>
            <p id={`${statusId}-help`} className="mt-1 text-xs text-admin-text">
              Halaman berstatus Draf mengembalikan 404 bagi pengunjung.
            </p>
          </div>
          <div>
            <label htmlFor={templateId} className={labelClass}>
              Tata letak
            </label>
            <select
              id={templateId}
              value={template}
              onChange={(e) => {
                const next = (Object.keys(TEMPLATE_LABEL) as PageTemplate[]).find((t) => t === e.target.value);
                if (next) {
                  setTemplate(next);
                  touch();
                }
              }}
              className={`${field} mt-1`}
            >
              {(Object.keys(TEMPLATE_LABEL) as PageTemplate[]).map((t) => (
                <option key={t} value={t}>
                  {TEMPLATE_LABEL[t]}
                </option>
              ))}
            </select>
          </div>
          <div className="sm:col-span-2">
            <label htmlFor={seoTitleId} className={`${labelClass} flex justify-between gap-3`}>
              Judul SEO <span className={seoTitle.length > 60 ? "text-admin-warn-text" : ""}>{seoTitle.length}/60</span>
            </label>
            <input
              id={seoTitleId}
              value={seoTitle}
              maxLength={200}
              placeholder={`${title} - Relawan Nusantara`}
              onChange={(e) => {
                setSeoTitle(e.target.value);
                touch();
              }}
              className={`${field} mt-1`}
            />
          </div>
          <div className="sm:col-span-2">
            <label htmlFor={seoDescId} className={`${labelClass} flex justify-between gap-3`}>
              Meta description <span className={seoDescription.length > 160 ? "text-admin-warn-text" : ""}>{seoDescription.length}/160</span>
            </label>
            <textarea
              id={seoDescId}
              value={seoDescription}
              maxLength={500}
              rows={3}
              onChange={(e) => {
                setSeoDescription(e.target.value);
                touch();
              }}
              className={`${field} mt-1 py-2 leading-normal`}
            />
          </div>
        </div>
      </details>

      <p role="status" aria-live="polite" className="sr-only" data-sort-status>
        {announce}
      </p>
      <DndContext
        id={dndId}
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={onDragEnd}
        accessibility={{ screenReaderInstructions: SORT_INSTRUCTIONS }}
      >
        <SortableContext items={sections.map((s) => s.id)} strategy={verticalListSortingStrategy}>
          <ol className="mt-4.5 flex flex-col gap-2.5" aria-label="Section halaman, berurutan">
            {sections.map((s, i) => (
              <SectionRow
                key={s.id}
                section={s}
                index={i}
                issues={issues.filter((x) => x.index === i)}
                onMove={(step) => {
                  const moved = moveById(sections, s.id, step);
                  if (!moved) return;
                  updateSections(moved.list);
                  setAnnounce(`Section ${typeLabel(s.type)} dipindah ke posisi ${moved.position} dari ${sections.length}.`);
                }}
                onEdit={() => setEditing(s.id)}
                onToggle={() => updateSections(sections.map((x) => (x.id === s.id ? { ...x, visible: !x.visible } : x)))}
                onRemove={() => setRemoving(s.id)}
              />
            ))}
          </ol>
        </SortableContext>
      </DndContext>
      {sections.length === 0 ? <p className="mt-4 rounded-admin bg-admin-canvas p-4 text-center text-sm text-admin-text">Belum ada section. Tambahkan section pertama di bawah.</p> : null}

      <button
        type="button"
        aria-expanded={adding}
        onClick={() => setAdding((v) => !v)}
        className="mt-3 min-h-12 w-full rounded-xl border border-dashed border-admin-sidebar-muted bg-white px-4 py-2 text-sm font-bold text-admin-neutral-text hover:border-primary hover:text-primary focus-visible:outline-2 focus-visible:outline-primary"
      >
        + Tambah section{template === "generic" ? " (Teks bebas)" : " (Hero, Teks 2 kolom, Kartu program, Grid publikasi, Testimoni, Accordion, Logo mitra, CTA)"}
      </button>
      {adding ? (
        <div className="mt-2 rounded-xl border border-admin-line bg-admin-row-hover p-4">
          {families.map((family) => {
            const defs = available.filter((d) => d.family === family);
            if (!defs.length) return null;
            return (
              <div key={family} className="mb-3 last:mb-0">
                <h3 className="text-xs font-extrabold tracking-wide text-admin-text uppercase">{family}</h3>
                <ul className="mt-1.5 grid gap-2 sm:grid-cols-2">
                  {defs.map((d) => (
                    <li key={d.type}>
                      <button
                        type="button"
                        onClick={() => addSection(d.type)}
                        className="flex min-h-11 w-full flex-col items-start rounded-lg border border-admin-field bg-white px-3 py-2 text-left hover:border-primary focus-visible:outline-2 focus-visible:outline-primary"
                      >
                        <span className="text-sm font-bold text-admin-ink">{d.label}</span>
                        <span className="text-xs text-admin-text">{d.description}</span>
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </div>
      ) : null}

      <Dialog open={editingSection !== undefined} title={editingSection ? `Edit section: ${typeLabel(editingSection.type)}` : "Edit section"} onClose={() => setEditing(null)} size="xl">
        {editingSection ? (
          <SectionDialogBody
            key={editingSection.id}
            section={editingSection}
            options={options}
            onCancel={() => setEditing(null)}
            onApply={(next) => {
              updateSections(sections.map((x) => (x.id === next.id ? next : x)));
              setEditing(null);
            }}
          />
        ) : null}
      </Dialog>
      <ConfirmDialog
        open={removingSection !== undefined}
        title="Hapus section ini?"
        description={removingSection ? `${typeLabel(removingSection.type)} akan dihapus dari halaman saat Anda menekan Simpan. Untuk menyembunyikan sementara, pakai tombol tampil/sembunyi.` : undefined}
        confirmLabel="Hapus section"
        tone="danger"
        onConfirm={() => {
          updateSections(sections.filter((x) => x.id !== removing));
          setRemoving(null);
        }}
        onCancel={() => setRemoving(null)}
      />
    </section>
  );
}

function SectionRow({
  section,
  index,
  issues,
  onMove,
  onEdit,
  onToggle,
  onRemove,
}: {
  section: EditorSection;
  index: number;
  issues: SectionIssue[];
  onMove: (step: -1 | 1) => void;
  onEdit: () => void;
  onToggle: () => void;
  onRemove: () => void;
}) {
  const { attributes, listeners, setNodeRef, setActivatorNodeRef, transform, transition, isDragging } = useSortable({ id: section.id });
  const def = sectionDef(section.type);
  const label = typeLabel(section.type);
  const iconBtn =
    "flex size-11 shrink-0 items-center justify-center rounded-lg border border-admin-field bg-white text-admin-ink hover:bg-admin-canvas focus-visible:outline-2 focus-visible:outline-primary";

  return (
    <li
      ref={setNodeRef}
      style={{ transform: CSS.Translate.toString(transform), transition }}
      className={`rounded-xl border bg-admin-row-hover ${issues.length ? "border-admin-danger" : "border-admin-line"} ${isDragging ? "relative z-10 shadow-admin-card" : ""} ${section.visible ? "" : "opacity-70"}`}
    >
      <div className="flex flex-wrap items-center gap-x-3 gap-y-2 px-3 py-2.5 sm:px-4">
        <button
          ref={setActivatorNodeRef}
          type="button"
          {...attributes}
          {...listeners}
          onKeyDown={(e) => {
            const step = arrowStep(e);
            if (!step) return;
            e.preventDefault();
            onMove(step);
          }}
          aria-label={`Geser section ${index + 1}: ${label}`}
          className="flex size-11 shrink-0 cursor-grab touch-none items-center justify-center rounded-lg text-admin-sidebar-muted hover:bg-admin-neutral-bg hover:text-admin-ink focus-visible:outline-2 focus-visible:outline-primary active:cursor-grabbing"
        >
          <GripVertical aria-hidden="true" size={18} />
        </button>
        <span aria-hidden="true" className="flex size-8.5 shrink-0 items-center justify-center rounded-lg bg-admin-ok-bg text-[13px] font-extrabold text-primary">
          {index + 1}
        </span>
        <span className="min-w-40 flex-1">
          <span className="block text-[15px] font-extrabold text-admin-ink">
            {label}
            {section.visible ? null : <span className="ml-2 rounded-full bg-admin-neutral-bg px-2 py-0.5 text-[11px] font-bold text-admin-neutral-text">Tersembunyi</span>}
            {section.en ? <span className="ml-2 rounded-full bg-admin-info-bg px-2 py-0.5 text-[11px] font-bold text-admin-info-text">EN</span> : null}
          </span>
          <span className="block text-[13px] text-admin-text">{def ? sectionSummary(def, section.data) : "Tipe section tidak dikenal"}</span>
        </span>
        <span className="flex gap-2">
          <button type="button" onClick={onEdit} className="min-h-11 rounded-lg border border-admin-field bg-white px-3.5 text-[13px] font-bold text-admin-ink hover:bg-admin-canvas focus-visible:outline-2 focus-visible:outline-primary">
            Edit<span className="sr-only"> section {index + 1}: {label}</span>
          </button>
          <button type="button" onClick={onToggle} aria-pressed={!section.visible} className={iconBtn}>
            {section.visible ? <Eye aria-hidden="true" size={18} /> : <EyeOff aria-hidden="true" size={18} />}
            <span className="sr-only">
              Sembunyikan section {index + 1}: {label}
            </span>
          </button>
          <button type="button" onClick={onRemove} className={`${iconBtn} text-admin-danger`}>
            <Trash2 aria-hidden="true" size={18} />
            <span className="sr-only">
              Hapus section {index + 1}: {label}
            </span>
          </button>
        </span>
      </div>
      {issues.length ? (
        <ul className="border-t border-admin-danger px-4 py-2 text-[13px] font-semibold text-admin-danger">
          {issues.slice(0, 6).map((issue, i) => (
            <li key={`${issue.locale}:${issue.path}:${i}`}>
              {issue.locale === "en" ? "[English] " : ""}
              {issue.path ? `${issue.path}: ` : ""}
              {issue.message}
            </li>
          ))}
          {issues.length > 6 ? <li>… dan {issues.length - 6} lainnya</li> : null}
        </ul>
      ) : null}
    </li>
  );
}

/** Isi dialog edit: form generik untuk isi Indonesia dan (opsional) versi Inggris. */
function SectionDialogBody({
  section,
  options,
  onApply,
  onCancel,
}: {
  section: EditorSection;
  options: FieldOptions;
  onApply: (section: EditorSection) => void;
  onCancel: () => void;
}) {
  const def = sectionDef(section.type);
  const [data, setData] = useState<JsonObject>(section.data);
  const [en, setEn] = useState<JsonObject | undefined>(section.en);
  const [lang, setLang] = useState<"id" | "en">("id");

  if (!def) return <p className="text-sm text-admin-text">Tipe section ini tidak dikenal dan tidak bisa diedit.</p>;

  const tab = (value: "id" | "en", label: string) => (
    <button
      type="button"
      role="tab"
      aria-selected={lang === value}
      onClick={() => setLang(value)}
      className={`min-h-11 border-b-[3px] px-3.5 text-sm font-bold focus-visible:outline-2 focus-visible:outline-primary ${
        lang === value ? "border-primary text-primary" : "border-transparent text-admin-neutral-text hover:text-primary"
      }`}
    >
      {label}
    </button>
  );

  return (
    // Bukan <form>: MediaPicker di dalamnya punya form sendiri (form bersarang tidak sah).
    <div className="flex flex-col gap-4">
      <p className="text-[13px] text-admin-text">{def.description}</p>
      <div role="tablist" aria-label="Bahasa isi section" className="flex gap-1.5 border-b border-admin-line">
        {tab("id", "Indonesia")}
        {tab("en", en ? "English" : "English (belum ada)")}
      </div>

      {lang === "id" ? (
        <SectionForm fields={def.fields} value={data} onChange={setData} options={options} />
      ) : en ? (
        <>
          <p className="rounded-admin bg-admin-info-bg p-3 text-[13px] font-semibold text-admin-info-text">
            Versi Inggris tampil di /en/. Struktur dan gambarnya terpisah dari versi Indonesia — perubahan di satu bahasa tidak otomatis mengubah bahasa lain.
          </p>
          <SectionForm fields={def.fields} value={en} onChange={setEn} options={options} />
          <button type="button" onClick={() => setEn(undefined)} className={`${ghostBtn} self-start border-admin-danger text-admin-danger`}>
            Hapus versi Inggris (kembali memakai isi Indonesia)
          </button>
        </>
      ) : (
        <div className="rounded-admin bg-admin-canvas p-4 text-sm text-admin-text">
          <p>Section ini belum punya versi Inggris; halaman /en/ menampilkan isi Indonesia.</p>
          <button type="button" onClick={() => setEn(structuredClone(data))} className={`${ghostBtn} mt-3`}>
            Salin isi Indonesia untuk diterjemahkan
          </button>
        </div>
      )}

      <div className="sticky -bottom-5 -mx-5 -mb-5 flex flex-col-reverse gap-2 border-t border-admin-line bg-white p-5 sm:flex-row sm:justify-end">
        <button type="button" onClick={onCancel} className={ghostBtn}>
          Batal
        </button>
        <button
          type="button"
          className={primaryBtn}
          onClick={() => onApply({ id: section.id, type: section.type, visible: section.visible, data, ...(en ? { en } : {}) })}
        >
          Terapkan
        </button>
      </div>
    </div>
  );
}
