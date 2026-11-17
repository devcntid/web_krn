"use client";

import { DndContext, type DragEndEvent, PointerSensor, closestCenter, useSensor, useSensors } from "@dnd-kit/core";
import { SortableContext, arrayMove, useSortable, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { ArrowLeft, ArrowRight, GripVertical, Plus, Trash2 } from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useId, useState, useTransition } from "react";

import { saveSiteSettingsAction } from "@/app/admin/(panel)/pengaturan/actions";
import { Card } from "@/components/admin/Card";
import { PageHeader } from "@/components/admin/PageHeader";
import { SORT_INSTRUCTIONS, arrowStep, moveById } from "@/components/admin/sortable";
import { useToast } from "@/components/admin/Toast";
import { MediaPicker } from "@/components/admin/publikasi/MediaPicker";
import { mediaUrl } from "@/lib/media";
import { type MenuItem, SOCIAL_PLATFORMS, type SiteSettings, siteSettingsSchema } from "@/lib/site-settings-schema";

const labelClass = "text-xs font-bold text-admin-text";
const field =
  "mt-1 min-h-11 w-full rounded-admin border border-admin-field bg-white px-3 text-sm text-admin-ink focus-visible:outline-2 focus-visible:outline-primary";
const primaryBtn =
  "inline-flex min-h-11 items-center justify-center rounded-admin bg-primary px-4.5 text-sm font-extrabold text-white hover:bg-admin-primary-dark focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary disabled:opacity-60";
const smallBtn =
  "inline-flex min-h-11 items-center justify-center gap-1.5 rounded-lg border border-admin-field bg-white px-3 text-[13px] font-bold text-admin-ink hover:bg-admin-canvas focus-visible:outline-2 focus-visible:outline-primary disabled:opacity-40";
const iconBtn =
  "flex size-11 shrink-0 items-center justify-center rounded-lg text-admin-text hover:bg-admin-neutral-bg hover:text-admin-ink focus-visible:outline-2 focus-visible:outline-primary disabled:opacity-30";
const handleBtn =
  "flex size-11 shrink-0 cursor-grab touch-none items-center justify-center rounded-lg text-admin-sidebar-muted hover:bg-admin-neutral-bg hover:text-admin-ink focus-visible:outline-2 focus-visible:outline-primary active:cursor-grabbing";

/** Butir menu datar untuk editor: level 0 = menu utama, 1 = sub-menu dari menu utama di atasnya. */
type FlatItem = { id: string; label: string; labelEn: string; href: string; level: 0 | 1 };

let seq = 0;
const newId = () => `m${++seq}`;

function flatten(menu: MenuItem[]): FlatItem[] {
  return menu.flatMap((m) => [
    { id: newId(), label: m.label, labelEn: m.labelEn, href: m.href, level: 0 as const },
    ...m.children.map((c) => ({ id: newId(), label: c.label, labelEn: c.labelEn, href: c.href, level: 1 as const })),
  ]);
}

/** Susun kembali pohon menu. Butir pertama selalu menu utama; induk yang punya sub-menu tidak memakai tautan. */
function toTree(flat: FlatItem[]): MenuItem[] {
  const out: MenuItem[] = [];
  for (const f of flat) {
    const parent = out[out.length - 1];
    if (f.level === 1 && parent) parent.children.push({ label: f.label, labelEn: f.labelEn, href: f.href });
    else out.push({ label: f.label, labelEn: f.labelEn, href: f.href, children: [] });
  }
  return out.map((m) => (m.children.length ? { ...m, href: "" } : m));
}

/** Kelompokkan menjadi blok [menu utama, ...sub-menunya]. */
function toBlocks(flat: FlatItem[]): FlatItem[][] {
  const blocks: FlatItem[][] = [];
  for (const f of flat) {
    if (f.level === 1 && blocks.length) blocks[blocks.length - 1]!.push(f);
    else blocks.push([f]);
  }
  return blocks;
}

/**
 * Pindahkan butir `id` ke posisi butir `overId` (seret) atau satu langkah (keyboard).
 * Menu utama berpindah satu blok utuh bersama sub-menunya sehingga tidak pernah "mencuri"
 * sub-menu grup lain; sub-menu berpindah satu butir (bisa pindah ke grup lain).
 */
function moveItem(flat: FlatItem[], id: string, target: { step: -1 | 1 } | { overId: string }): FlatItem[] | null {
  const item = flat.find((x) => x.id === id);
  if (!item) return null;
  if (item.level === 1) {
    if ("step" in target) return moveById(flat, id, target.step)?.list ?? null;
    const from = flat.indexOf(item);
    const to = flat.findIndex((x) => x.id === target.overId);
    return to < 0 ? null : arrayMove(flat, from, to);
  }
  const blocks = toBlocks(flat);
  const from = blocks.findIndex((b) => b[0]!.id === id);
  const to = "step" in target ? from + target.step : blocks.findIndex((b) => b.some((x) => x.id === target.overId));
  if (to < 0 || to >= blocks.length || to === from) return null;
  return arrayMove(blocks, from, to).flat();
}

export function SettingsForm({ initial }: { initial: SiteSettings }) {
  const router = useRouter();
  const toast = useToast();
  const [pending, startTransition] = useTransition();
  const [identity, setIdentity] = useState(initial.identity);
  const [contact, setContact] = useState(initial.contact);
  const [socials, setSocials] = useState<Record<string, string>>(() => Object.fromEntries(initial.socials.map((s) => [s.platform, s.href])));
  const [menu, setMenu] = useState<FlatItem[]>(() => flatten(initial.menu));
  const [integrations, setIntegrations] = useState(initial.integrations);
  const [error, setError] = useState("");
  const [dirty, setDirty] = useState(false);

  const touch = <T,>(set: (v: T) => void) => (v: T) => {
    set(v);
    setDirty(true);
  };

  const build = (): SiteSettings => ({
    identity,
    contact,
    // Urutan tetap mengikuti urutan platform; URL kosong = tidak ditampilkan.
    socials: SOCIAL_PLATFORMS.filter((p) => socials[p]?.trim()).map((p) => ({ platform: p, href: socials[p]!.trim() })),
    menu: toTree(menu),
    integrations,
  });

  const save = () => {
    const data = build();
    const parsed = siteSettingsSchema.safeParse(data);
    if (!parsed.success) {
      const msg = parsed.error.issues[0]?.message ?? "Data tidak sah";
      setError(msg);
      toast.show(msg, "error");
      return;
    }
    setError("");
    startTransition(async () => {
      const result = await saveSiteSettingsAction(parsed.data);
      if (!result.ok) {
        setError(result.error);
        toast.show(result.error, "error");
        return;
      }
      setDirty(false);
      toast.show(result.changed.length ? "Pengaturan disimpan. Situs publik sudah memakai nilai baru." : "Tidak ada perubahan.", "success");
      router.refresh();
    });
  };

  return (
    <div className="space-y-5">
      <PageHeader
        title="Pengaturan Situs"
        description="Identitas, kontak, menu, integrasi, dan tombol melayang."
        actions={
          <button type="button" className={primaryBtn} onClick={save} disabled={pending}>
            {pending ? "Menyimpan…" : "Simpan"}
          </button>
        }
      />
      {error ? (
        <p role="alert" className="rounded-admin border border-admin-danger bg-white px-4 py-3 text-sm font-semibold text-admin-danger">
          {error}
        </p>
      ) : dirty ? (
        <p className="text-sm font-semibold text-admin-text">Ada perubahan yang belum disimpan.</p>
      ) : null}

      <div className="grid gap-5 xl:grid-cols-2">
        <IdentityCard value={identity} onChange={touch(setIdentity)} />
        <ContactCard value={contact} onChange={touch(setContact)} socials={socials} onSocials={touch(setSocials)} />
        <MenuCard items={menu} onChange={touch(setMenu)} />
        <IntegrationsCard value={integrations} onChange={touch(setIntegrations)} />
      </div>
    </div>
  );
}

/* ---------- Identitas ---------- */

function IdentityCard({ value, onChange }: { value: SiteSettings["identity"]; onChange: (v: SiteSettings["identity"]) => void }) {
  const id = useId();
  return (
    <Card title="Identitas" className="min-w-0">
      <div className="space-y-4">
        <div>
          <label htmlFor={`${id}-name`} className={labelClass}>
            Nama situs
          </label>
          <input id={`${id}-name`} className={field} value={value.name} maxLength={80} onChange={(e) => onChange({ ...value, name: e.target.value })} />
        </div>
        <div>
          <label htmlFor={`${id}-tagline`} className={labelClass}>
            Tagline
          </label>
          <input id={`${id}-tagline`} className={field} value={value.tagline} maxLength={200} onChange={(e) => onChange({ ...value, tagline: e.target.value })} />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <ImagePick
            label="Logo (SVG/PNG)"
            src={value.logo.src}
            wide
            onPick={(m) => onChange({ ...value, logo: { src: m.url, width: m.width ?? value.logo.width, height: m.height ?? value.logo.height } })}
          />
          <ImagePick
            label="Favicon"
            src={value.favicon}
            hint="Kosong = ikon bawaan. Gunakan gambar persegi ≥192px."
            onPick={(m) => onChange({ ...value, favicon: m.url })}
            onClear={value.favicon ? () => onChange({ ...value, favicon: "" }) : undefined}
          />
        </div>
      </div>
    </Card>
  );
}

function ImagePick({
  label,
  src,
  wide,
  hint,
  onPick,
  onClear,
}: {
  label: string;
  src: string;
  wide?: boolean;
  hint?: string;
  onPick: (m: { url: string; width: number | null; height: number | null }) => void;
  onClear?: () => void;
}) {
  const [open, setOpen] = useState(false);
  return (
    <div className="min-w-0">
      <p className={labelClass}>{label}</p>
      <div className="mt-1 flex flex-wrap items-center gap-3">
        <span className={`relative flex shrink-0 items-center justify-center overflow-hidden rounded-lg border border-admin-line bg-admin-canvas ${wide ? "h-14 w-36" : "size-14"}`}>
          {src ? (
            <Image src={mediaUrl(src)} alt="" fill sizes="144px" className="object-contain p-1.5" />
          ) : (
            <span className="text-xs font-semibold text-admin-text">Bawaan</span>
          )}
        </span>
        <button type="button" className={smallBtn} onClick={() => setOpen(true)}>
          Ganti<span className="sr-only"> {label}</span>
        </button>
        {onClear ? (
          <button type="button" className={smallBtn} onClick={onClear}>
            Hapus<span className="sr-only"> {label}</span>
          </button>
        ) : null}
      </div>
      {hint ? <p className="mt-1 text-xs text-admin-text">{hint}</p> : null}
      <MediaPicker
        open={open}
        title={`Pilih ${label.toLowerCase()}`}
        onClose={() => setOpen(false)}
        onSelect={(m) => {
          setOpen(false);
          onPick(m);
        }}
      />
    </div>
  );
}

/* ---------- Kontak & sosial ---------- */

function ContactCard({
  value,
  onChange,
  socials,
  onSocials,
}: {
  value: SiteSettings["contact"];
  onChange: (v: SiteSettings["contact"]) => void;
  socials: Record<string, string>;
  onSocials: (v: Record<string, string>) => void;
}) {
  const id = useId();
  return (
    <Card title="Kontak & Sosial" className="min-w-0">
      <div className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor={`${id}-wa`} className={labelClass}>
              WhatsApp (angka, kode negara)
            </label>
            <input
              id={`${id}-wa`}
              className={field}
              inputMode="numeric"
              value={value.whatsapp}
              placeholder="6285…"
              onChange={(e) => onChange({ ...value, whatsapp: e.target.value.replace(/[^\d]/g, "") })}
            />
          </div>
          <div>
            <label htmlFor={`${id}-wad`} className={labelClass}>
              Teks nomor di footer
            </label>
            <input id={`${id}-wad`} className={field} value={value.phoneDisplay} maxLength={60} onChange={(e) => onChange({ ...value, phoneDisplay: e.target.value })} />
          </div>
        </div>
        <div>
          <label htmlFor={`${id}-email`} className={labelClass}>
            Email
          </label>
          <input id={`${id}-email`} type="email" className={field} value={value.email} onChange={(e) => onChange({ ...value, email: e.target.value })} />
        </div>
        <div>
          <label htmlFor={`${id}-addr`} className={labelClass}>
            Alamat
          </label>
          <textarea
            id={`${id}-addr`}
            rows={3}
            className={`${field} py-2`}
            value={value.address}
            maxLength={300}
            onChange={(e) => onChange({ ...value, address: e.target.value })}
          />
        </div>
        <fieldset className="min-w-0">
          <legend className={labelClass}>Tautan sosial (kosongkan untuk menyembunyikan)</legend>
          <div className="mt-1 space-y-2">
            {SOCIAL_PLATFORMS.map((p) => (
              <div key={p} className="flex items-center gap-3">
                <label htmlFor={`${id}-${p}`} className="w-20 shrink-0 text-sm font-semibold text-admin-ink">
                  {p}
                </label>
                <input
                  id={`${id}-${p}`}
                  type="url"
                  className={`${field} mt-0 min-w-0`}
                  placeholder="https://"
                  value={socials[p] ?? ""}
                  onChange={(e) => onSocials({ ...socials, [p]: e.target.value })}
                />
              </div>
            ))}
          </div>
        </fieldset>
      </div>
    </Card>
  );
}

/* ---------- Menu navigasi ---------- */

function MenuCard({ items, onChange }: { items: FlatItem[]; onChange: (v: FlatItem[]) => void }) {
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 4 } }));
  const hintId = useId();
  const [announce, setAnnounce] = useState("");
  const [editing, setEditing] = useState<string | null>(null);

  const update = (id: string, patch: Partial<FlatItem>) => onChange(items.map((x) => (x.id === id ? { ...x, ...patch } : x)));
  const normalize = (list: FlatItem[]) => list.map((x, i) => (i === 0 && x.level === 1 ? { ...x, level: 0 as const } : x));

  const onDragEnd = (e: DragEndEvent) => {
    if (!e.over || e.active.id === e.over.id) return;
    const next = moveItem(items, String(e.active.id), { overId: String(e.over.id) });
    if (next) onChange(normalize(next));
  };

  const move = (id: string, step: -1 | 1) => {
    const next = moveItem(items, id, { step });
    if (!next) return;
    const fixed = normalize(next);
    onChange(fixed);
    const i = fixed.findIndex((x) => x.id === id);
    const parent = fixed.slice(0, i).findLast((x) => x.level === 0);
    setAnnounce(`Dipindah ke posisi ${i + 1} dari ${fixed.length}${fixed[i]!.level === 1 && parent ? `, sub-menu ${parent.label}` : ""}.`);
  };

  return (
    <Card
      title="Menu navigasi"
      className="min-w-0"
      actions={
        <button
          type="button"
          className={smallBtn}
          onClick={() => {
            const item: FlatItem = { id: newId(), label: "Menu baru", labelEn: "", href: "/", level: 0 };
            onChange([...items, item]);
            setEditing(item.id);
          }}
        >
          <Plus aria-hidden size={16} /> Tambah menu
        </button>
      }
    >
      <p id={hintId} className="mb-3 text-xs text-admin-text">
        Seret untuk mengurutkan. Tombol panah kanan menjadikan butir sub-menu dari menu utama di atasnya. Menu utama yang punya sub-menu tampil sebagai dropdown
        (tautannya diabaikan). {SORT_INSTRUCTIONS.draggable}
      </p>
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
        <SortableContext items={items.map((x) => x.id)} strategy={verticalListSortingStrategy}>
          <ul className="space-y-1.5">
            {items.map((item, i) => {
              const hasChildren = item.level === 0 && items[i + 1]?.level === 1;
              return (
                <MenuRow
                  key={item.id}
                  item={item}
                  hasChildren={hasChildren}
                  canIndent={i > 0 && item.level === 0 && !hasChildren}
                  hintId={hintId}
                  editing={editing === item.id}
                  onEdit={() => setEditing(editing === item.id ? null : item.id)}
                  onMove={(step) => move(item.id, step)}
                  onChange={(patch) => update(item.id, patch)}
                  onRemove={() => {
                    // Hapus induk → sub-menunya naik menjadi menu utama.
                    const next = items.filter((x) => x.id !== item.id);
                    if (item.level === 0) for (let j = i; j < next.length && next[j]!.level === 1; j++) next[j] = { ...next[j]!, level: 0 };
                    onChange(normalize(next));
                  }}
                />
              );
            })}
          </ul>
        </SortableContext>
      </DndContext>
      <p className="sr-only" aria-live="polite">
        {announce}
      </p>
    </Card>
  );
}

function MenuRow({
  item,
  hasChildren,
  canIndent,
  hintId,
  editing,
  onEdit,
  onMove,
  onChange,
  onRemove,
}: {
  item: FlatItem;
  hasChildren: boolean;
  canIndent: boolean;
  hintId: string;
  editing: boolean;
  onEdit: () => void;
  onMove: (step: -1 | 1) => void;
  onChange: (patch: Partial<FlatItem>) => void;
  onRemove: () => void;
}) {
  const { attributes, listeners, setNodeRef, setActivatorNodeRef, transform, transition, isDragging } = useSortable({ id: item.id });
  const id = useId();
  return (
    <li
      ref={setNodeRef}
      style={{ transform: CSS.Translate.toString(transform), transition }}
      className={`rounded-xl border border-admin-line bg-white ${item.level ? "ml-6" : ""} ${isDragging ? "relative z-10 shadow-admin-card" : ""}`}
    >
      <div className="flex items-center gap-1 px-1.5 py-1">
        <button
          ref={setActivatorNodeRef}
          type="button"
          {...attributes}
          {...listeners}
          aria-describedby={hintId}
          onKeyDown={(e) => {
            const step = arrowStep(e);
            if (!step || e.key === "ArrowLeft" || e.key === "ArrowRight") return;
            e.preventDefault();
            onMove(step);
          }}
          aria-label={`Geser menu ${item.label}`}
          className={handleBtn}
        >
          <GripVertical aria-hidden size={18} />
        </button>
        <button type="button" onClick={onEdit} aria-expanded={editing} className="min-h-11 min-w-0 flex-1 rounded-lg px-1.5 text-left hover:bg-admin-canvas focus-visible:outline-2 focus-visible:outline-primary">
          <span className="block truncate text-sm font-extrabold text-admin-ink">{item.label || "(tanpa label)"}</span>
          <span className="block truncate font-mono text-xs text-admin-text">{hasChildren ? "— dropdown" : item.href}</span>
        </button>
        {item.level ? (
          <button type="button" className={iconBtn} onClick={() => onChange({ level: 0 })} aria-label={`Jadikan ${item.label} menu utama`} title="Jadikan menu utama">
            <ArrowLeft aria-hidden size={18} />
          </button>
        ) : (
          <button type="button" className={iconBtn} disabled={!canIndent} onClick={() => onChange({ level: 1 })} aria-label={`Jadikan ${item.label} sub-menu`} title="Jadikan sub-menu">
            <ArrowRight aria-hidden size={18} />
          </button>
        )}
        <button type="button" className={`${iconBtn} hover:text-admin-danger`} onClick={onRemove} aria-label={`Hapus menu ${item.label}`} title="Hapus">
          <Trash2 aria-hidden size={18} />
        </button>
      </div>
      {editing ? (
        <div className="grid gap-3 border-t border-admin-line p-3 sm:grid-cols-2">
          <div>
            <label htmlFor={`${id}-l`} className={labelClass}>
              Label
            </label>
            <input id={`${id}-l`} className={field} value={item.label} maxLength={60} onChange={(e) => onChange({ label: e.target.value })} />
          </div>
          <div>
            <label htmlFor={`${id}-le`} className={labelClass}>
              Label Inggris (opsional)
            </label>
            <input id={`${id}-le`} className={field} value={item.labelEn} maxLength={60} onChange={(e) => onChange({ labelEn: e.target.value })} />
          </div>
          {!hasChildren ? (
            <div className="sm:col-span-2">
              <label htmlFor={`${id}-h`} className={labelClass}>
                Tautan (/path/ atau https://)
              </label>
              <input id={`${id}-h`} className={`${field} font-mono`} value={item.href} onChange={(e) => onChange({ href: e.target.value })} />
            </div>
          ) : null}
        </div>
      ) : null}
    </li>
  );
}

/* ---------- Integrasi & tombol ---------- */

function IntegrationsCard({ value, onChange }: { value: SiteSettings["integrations"]; onChange: (v: SiteSettings["integrations"]) => void }) {
  const id = useId();
  return (
    <Card title="Integrasi & tombol" className="min-w-0">
      <div className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor={`${id}-ga`} className={labelClass}>
              Google Analytics 4
            </label>
            <input
              id={`${id}-ga`}
              className={`${field} font-mono`}
              placeholder="G-XXXXXXXXXX"
              value={value.ga4Id}
              onChange={(e) => onChange({ ...value, ga4Id: e.target.value.toUpperCase() })}
            />
          </div>
          <div>
            <label htmlFor={`${id}-px`} className={labelClass}>
              Meta Pixel
            </label>
            <input
              id={`${id}-px`}
              className={`${field} font-mono`}
              inputMode="numeric"
              placeholder="ID angka"
              value={value.metaPixelId}
              onChange={(e) => onChange({ ...value, metaPixelId: e.target.value.replace(/[^\d]/g, "") })}
            />
          </div>
        </div>
        <div>
          <label htmlFor={`${id}-don`} className={labelClass}>
            Tautan tombol Donasi
          </label>
          <input id={`${id}-don`} className={`${field} font-mono`} value={value.donateUrl} onChange={(e) => onChange({ ...value, donateUrl: e.target.value })} />
          <p className="mt-1 text-xs text-admin-text">Bawaan /campaign (aplikasi donasi).</p>
        </div>
        <Toggle
          label="Tampilkan tombol “Tanya Saffa” (WhatsApp)"
          checked={value.showSaffa}
          onChange={(v) => onChange({ ...value, showSaffa: v })}
        />
        <Toggle
          label={`Mode perawatan ${value.maintenance ? "aktif" : "nonaktif"}`}
          description="Saat aktif, pengunjung melihat halaman “Sedang dalam perawatan” (HTTP 503). Admin yang sedang masuk tetap melihat situs. Berlaku dalam ±30 detik."
          checked={value.maintenance}
          danger
          onChange={(v) => onChange({ ...value, maintenance: v })}
        />
      </div>
    </Card>
  );
}

function Toggle({ label, description, checked, danger, onChange }: { label: string; description?: string; checked: boolean; danger?: boolean; onChange: (v: boolean) => void }) {
  const id = useId();
  return (
    <div className="flex items-start justify-between gap-4 rounded-xl border border-admin-line px-4 py-3">
      <div className="min-w-0">
        <label htmlFor={id} className="text-sm font-bold text-admin-ink">
          {label}
        </label>
        {description ? <p className="mt-0.5 text-xs text-admin-text">{description}</p> : null}
      </div>
      <button
        id={id}
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className="flex min-h-11 shrink-0 items-center focus-visible:outline-none [&:focus-visible>span]:outline-2 [&:focus-visible>span]:outline-offset-2 [&:focus-visible>span]:outline-primary"
      >
        <span className={`relative h-6 w-11 rounded-full transition-colors ${checked ? (danger ? "bg-admin-danger" : "bg-primary") : "bg-admin-field"}`}>
          <span className={`absolute top-0.5 left-0.5 size-5 rounded-full bg-white shadow transition-transform ${checked ? "translate-x-5" : ""}`} />
        </span>
      </button>
    </div>
  );
}
