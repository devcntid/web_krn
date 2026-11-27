"use client";

import { DndContext, DragOverlay, PointerSensor, useDraggable, useDroppable, useSensor, useSensors, type DragEndEvent, type DragStartEvent } from "@dnd-kit/core";
import { ArrowLeft, Copy, GripVertical, Monitor, Redo2, Smartphone, Tablet, Trash2, Undo2 } from "lucide-react";
import Link from "next/link";
import { Fragment, useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";

import { savePageAction } from "@/app/admin/(panel)/halaman/actions";
import { MediaPicker } from "@/components/admin/publikasi/MediaPicker";
import { useToast } from "@/components/admin/Toast";
import { VisualNodeView } from "@/components/site/sections/VisualSection";
import {
  VISUAL_LABEL,
  VISUAL_TYPES,
  hiddenOn,
  type Box,
  type Device,
  type VisualNode,
  type VisualStyle,
  type VisualType,
  cloneNode,
  createNode,
  findNode,
  insertNode,
  locateNode,
  moveNode,
  parseVisualNodes,
  removeNode,
  updateNode,
} from "@/lib/visual-page";
import type { EditorPage } from "@/types/admin-pages";
import type { MediaChoice } from "@/types/admin-posts";

const field = "min-h-10 w-full rounded-md border border-white/15 bg-white/10 px-2 text-sm text-white";
const quiet = "min-h-10 rounded-md px-3 text-sm font-bold text-white/90 hover:bg-white/10 focus-visible:outline-2 focus-visible:outline-white";

type History = VisualNode[][];

function readNodes(page: EditorPage): { id: string; nodes: VisualNode[] } {
  const section = page.sections.find((item) => item.type === "visual");
  const raw = section?.data && "nodes" in section.data ? section.data.nodes : [];
  return { id: section?.id ?? crypto.randomUUID(), nodes: parseVisualNodes(raw).nodes };
}

export function VisualBuilder({ page, allowCustomJs = false }: { page: EditorPage; allowCustomJs?: boolean }) {
  const initial = useMemo(() => readNodes(page), [page]);
  const toast = useToast();
  const [title, setTitle] = useState(page.title);
  const [status, setStatus] = useState<"draft" | "published">(page.status === "published" ? "published" : "draft");
  const [nodes, setNodes] = useState<VisualNode[]>(initial.nodes);
  const [past, setPast] = useState<History>([]);
  const [future, setFuture] = useState<History>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [device, setDevice] = useState<Device>("desktop");
  const [sidebar, setSidebar] = useState(true);
  const [tab, setTab] = useState<"content" | "style" | "advanced">("content");
  const [panel, setPanel] = useState<"elements" | "edit">("elements");
  const [overId, setOverId] = useState<string | null>(null);
  const [dragging, setDragging] = useState<string | null>(null);
  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState(false);
  const [picker, setPicker] = useState<{ id: string; mode: "image" | "gallery" } | null>(null);
  const ready = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );
  const nodesRef = useRef(nodes);
  const titleRef = useRef(title);
  const statusRef = useRef(status);
  const dragged = useRef(false);
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }));
  useEffect(() => {
    nodesRef.current = nodes;
    titleRef.current = title;
    statusRef.current = status;
  }, [nodes, title, status]);

  const commit = (recipe: (current: VisualNode[]) => VisualNode[]) => {
    const current = nodesRef.current;
    const next = recipe(current);
    if (next === current) return;
    nodesRef.current = next;
    setPast((items) => [...items.slice(-40), current]);
    setFuture([]);
    setNodes(next);
    setDirty(true);
  };

  const undo = () => {
    setPast((items) => {
      const previous = items.at(-1);
      if (!previous) return items;
      setFuture((queue) => [nodesRef.current, ...queue]);
      nodesRef.current = previous;
      setNodes(previous);
      setDirty(true);
      return items.slice(0, -1);
    });
  };
  const redo = () => {
    setFuture((items) => {
      const next = items[0];
      if (!next) return items;
      setPast((queue) => [...queue, nodesRef.current]);
      nodesRef.current = next;
      setNodes(next);
      setDirty(true);
      return items.slice(1);
    });
  };

  const save = async (nextStatus: "draft" | "published", manual: boolean) => {
    const snapshot = nodesRef.current;
    const titleSnap = titleRef.current.trim();
    if (!titleSnap) {
      if (manual) toast.show("Judul halaman wajib diisi.", "error");
      return;
    }
    setSaving(true);
    try {
      const result = await savePageAction({
        id: page.id,
        title: titleSnap,
        status: nextStatus,
        template: page.template === "generic" ? "sections" : page.template,
        seoTitle: page.seoTitle,
        seoDescription: page.seoDescription,
        sections: [{ id: initial.id, type: "visual", visible: true, data: { nodes: snapshot } }],
      });
      if (!result.ok) {
        if (manual) toast.show(result.error, "error");
        return;
      }
      setStatus(nextStatus);
      statusRef.current = nextStatus;
      if (nodesRef.current === snapshot && titleRef.current.trim() === titleSnap) setDirty(false);
      if (manual) toast.show(nextStatus === "published" ? "Halaman diterbitkan." : "Draf disimpan.", "success");
    } catch {
      if (manual) toast.show("Gagal menyimpan halaman.", "error");
    } finally {
      setSaving(false);
    }
  };

  useEffect(() => {
    if (!dirty || saving) return;
    const timer = window.setTimeout(() => void save(statusRef.current, false), 2000);
    return () => window.clearTimeout(timer);
    // save memakai ref terbaru; sengaja tidak masuk dependensi.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dirty, nodes, title, saving]);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      const meta = event.metaKey || event.ctrlKey;
      if (meta && event.key.toLowerCase() === "z") {
        event.preventDefault();
        if (event.shiftKey) redo();
        else undo();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const selected = selectedId ? findNode(nodes, selectedId) : null;

  const dropTarget = (id: string) => {
    if (id.startsWith("slot:")) {
      const [, parent, index] = id.split(":");
      return { parentId: parent === "root" ? null : parent, index: Number(index) };
    }
    return locateNode(nodesRef.current, id);
  };

  const onDragEnd = (event: DragEndEvent) => {
    const active = String(event.active.id);
    const over = event.over ? String(event.over.id) : null;
    setDragging(null);
    setOverId(null);
    window.setTimeout(() => {
      dragged.current = false;
    }, 0);
    if (!over) return;
    const target = dropTarget(over);
    if (!target || Number.isNaN(target.index)) return;
    if (active.startsWith("palette:")) {
      const type = active.slice("palette:".length) as VisualType;
      if (!VISUAL_TYPES.includes(type)) return;
      const node = createNode(type);
      commit((current) => insertNode(current, target.parentId, target.index, node));
      setSelectedId(node.id);
      setTab("content");
      setPanel("edit");
      return;
    }
    commit((current) => moveNode(current, active, target.parentId, target.index));
  };

  const addAtSelection = (type: VisualType) => {
    const node = createNode(type);
    const parent = selected?.type === "container" ? selected.id : selectedId ? locateNode(nodes, selectedId)?.parentId ?? null : null;
    const index = selected?.type === "container" ? (selected.children?.length ?? 0) : selectedId ? (locateNode(nodes, selectedId)?.index ?? 0) + 1 : nodes.length;
    commit((current) => insertNode(current, parent, index, node));
    setSelectedId(node.id);
    setTab("content");
    setPanel("edit");
  };

  const patch = (id: string, recipe: (node: VisualNode) => VisualNode) => commit((current) => updateNode(current, id, recipe));

  const chooseMedia = (media: MediaChoice) => {
    if (!picker) return;
    const image = { src: media.url, width: media.width ?? 0, height: media.height ?? 0, alt: media.alt };
    patch(picker.id, (node) => {
      if (picker.mode === "image" && node.type === "image") return { ...node, content: image };
      if (picker.mode === "gallery" && node.type === "gallery") return { ...node, content: { ...node.content, images: [...node.content.images, image].slice(0, 12) } };
      return node;
    });
    setPicker(null);
  };

  const frame = device === "tablet" ? "w-[768px]" : device === "mobile" ? "w-[390px]" : "w-full max-w-[1140px]";

  if (!ready) return <div className="fixed inset-0 z-[55] grid place-items-center bg-[#ecebe6] text-sm">Memuat editor…</div>;

  return (
    <DndContext
      sensors={sensors}
      onDragStart={(event: DragStartEvent) => {
        dragged.current = true;
        setDragging(String(event.active.id));
      }}
      onDragOver={(event) => setOverId(event.over ? String(event.over.id) : null)}
      onDragCancel={() => {
        dragged.current = false;
        setDragging(null);
        setOverId(null);
      }}
      onDragEnd={onDragEnd}
    >
      <div className="fixed inset-0 z-[55] flex flex-col bg-[#ecebe6] text-[#1f1e17]">
        <header className="flex h-14 shrink-0 items-center gap-2 border-b border-black/10 bg-[#1f2a28] px-3 text-white">
          <Link href="/admin/halaman/" className={`${quiet} inline-flex items-center gap-1`}>
            <ArrowLeft size={16} aria-hidden /> Halaman
          </Link>
          <input
            aria-label="Judul halaman"
            value={title}
            onChange={(event) => {
              setTitle(event.target.value);
              titleRef.current = event.target.value;
              setDirty(true);
            }}
            className="min-w-0 flex-1 bg-transparent px-2 text-sm font-bold outline-none"
          />
          <button type="button" className={quiet} aria-label="Urungkan" disabled={!past.length} onClick={undo}>
            <Undo2 size={16} />
          </button>
          <button type="button" className={quiet} aria-label="Ulangi" disabled={!future.length} onClick={redo}>
            <Redo2 size={16} />
          </button>
          <div className="flex rounded-md bg-white/10 p-0.5">
            {(
              [
                ["desktop", Monitor, "Desktop"],
                ["tablet", Tablet, "Tablet"],
                ["mobile", Smartphone, "Ponsel"],
              ] as const
            ).map(([value, Icon, label]) => (
              <button key={value} type="button" aria-label={label} aria-pressed={device === value} className={`grid size-9 place-items-center rounded ${device === value ? "bg-white text-[#1f2a28]" : "text-white"}`} onClick={() => setDevice(value)}>
                <Icon size={16} />
              </button>
            ))}
          </div>
          <button type="button" className={quiet} onClick={() => window.open(`/api/preview/?page=${page.id}`, "_blank")}>
            Pratinjau
          </button>
          <button type="button" className={quiet} disabled={saving} onClick={() => void save("draft", true)}>
            Simpan draf
          </button>
          <button type="button" className="min-h-10 rounded-md bg-[#0d7a68] px-3 text-sm font-extrabold text-white disabled:opacity-60" disabled={saving} onClick={() => void save("published", true)}>
            Terbitkan
          </button>
          <button type="button" className={quiet} aria-pressed={sidebar} onClick={() => setSidebar((open) => !open)}>
            Panel
          </button>
        </header>
        <div className="flex min-h-0 flex-1">
          {sidebar ? (
            <aside className="flex w-[300px] shrink-0 flex-col border-r border-black/10 bg-[#243330] text-white">
              {selected && panel === "edit" ? (
                <>
                  <div className="flex items-center gap-2 border-b border-white/10 px-3 py-2">
                    <button type="button" className={quiet} onClick={() => setPanel("elements")}>
                      Elemen
                    </button>
                    <strong className="min-w-0 flex-1 truncate text-sm">{VISUAL_LABEL[selected.type]}</strong>
                    <button type="button" className={quiet} aria-label="Duplikat" onClick={() => {
                      const copy = cloneNode(selected);
                      const place = locateNode(nodes, selected.id);
                      if (!place) return;
                      commit((current) => insertNode(current, place.parentId, place.index + 1, copy));
                      setSelectedId(copy.id);
                      setPanel("edit");
                    }}>
                      <Copy size={15} />
                    </button>
                    <button type="button" className={quiet} aria-label="Hapus" onClick={() => {
                      commit((current) => removeNode(current, selected.id).nodes);
                      setSelectedId(null);
                    }}>
                      <Trash2 size={15} />
                    </button>
                  </div>
                  <div className="flex border-b border-white/10">
                    {(["content", "style", "advanced"] as const).map((item) => (
                      <button key={item} type="button" className={`min-h-10 flex-1 text-xs font-bold uppercase ${tab === item ? "bg-white/10" : ""}`} onClick={() => setTab(item)}>
                        {item === "content" ? "Isi" : item === "style" ? "Gaya" : "Lanjutan"}
                      </button>
                    ))}
                  </div>
                  <div className="min-h-0 flex-1 overflow-y-auto p-3">
                    <DeviceSettings
                      device={device}
                      hidden={selected.style.hidden}
                      onDevice={setDevice}
                      onHidden={(target, hide) =>
                        patch(selected.id, (current) => {
                          const hidden = { ...(current.style.hidden ?? {}) };
                          if (hide) hidden[target] = true;
                          else delete hidden[target];
                          return { ...current, style: { ...current.style, hidden: Object.keys(hidden).length ? hidden : undefined } } as VisualNode;
                        })
                      }
                    />
                    {device !== "desktop" ? <p className="mb-3 text-xs text-white/70">Nilai kosong di Gaya dan Lanjutan mengikuti perangkat yang lebih besar.</p> : null}
                    <Inspector node={selected} tab={tab} device={device} allowCustomJs={allowCustomJs} onPatch={(recipe) => patch(selected.id, recipe)} onPick={(mode) => setPicker({ id: selected.id, mode })} />
                  </div>
                </>
              ) : (
                <div className="min-h-0 flex-1 overflow-y-auto p-3">
                  <p className="mb-3 text-xs text-white/70">Seret elemen ke kanvas, atau klik untuk menambah.</p>
                  <ul className="grid grid-cols-2 gap-2">
                    {VISUAL_TYPES.map((type) => (
                      <PaletteItem key={type} type={type} onAdd={() => { if (!dragged.current) addAtSelection(type); }} />
                    ))}
                  </ul>
                </div>
              )}
            </aside>
          ) : null}
          <main className="min-w-0 flex-1 overflow-auto p-6" onClick={() => setSelectedId(null)}>
            <div className={`mx-auto min-h-[70vh] bg-white shadow ${frame}`} onClick={(event) => event.stopPropagation()}>
              <Branch
                parentId={null}
                nodes={nodes}
                device={device}
                selectedId={selectedId}
                overId={overId}
                onSelect={(id) => {
                  setSelectedId(id);
                  setTab("content");
                  setPanel("edit");
                }}
                onText={(id, value) =>
                  patch(id, (node) => {
                    if (node.type === "heading") return { ...node, content: { ...node.content, text: value.slice(0, 300) } };
                    if (node.type === "text") return { ...node, content: { ...node.content, html: value.slice(0, 20_000) } };
                    return node;
                  })
                }
              />
            </div>
            <p className="mx-auto mt-3 max-w-[1140px] text-center text-xs text-neutral-500">{saving ? "Menyimpan…" : dirty ? "Perubahan belum disimpan" : "Tersimpan"} · {status === "published" ? "Terbit" : "Draf"}</p>
          </main>
        </div>
      </div>
      <DragOverlay>{dragging ? <div className="rounded bg-[#0d7a68] px-3 py-2 text-sm font-bold text-white">{dragging.startsWith("palette:") ? VISUAL_LABEL[dragging.slice(8) as VisualType] : "Pindahkan"}</div> : null}</DragOverlay>
      <MediaPicker open={picker !== null} onClose={() => setPicker(null)} onSelect={chooseMedia} />
    </DndContext>
  );
}

function PaletteItem({ type, onAdd }: { type: VisualType; onAdd: () => void }) {
  const { attributes, listeners, setNodeRef } = useDraggable({ id: `palette:${type}`, data: { type } });
  return (
    <li>
      <button ref={setNodeRef} type="button" className="flex min-h-16 w-full flex-col items-center justify-center rounded-md border border-white/15 bg-white/5 text-xs font-bold hover:bg-white/10" onClick={onAdd} {...listeners} {...attributes}>
        {VISUAL_LABEL[type]}
      </button>
    </li>
  );
}

function DropSlot({ id, active, tall }: { id: string; active: boolean; tall: boolean }) {
  const { setNodeRef } = useDroppable({ id });
  return <div ref={setNodeRef} className={`${tall ? "min-h-28" : "min-h-3"} ${active ? "bg-[#0d7a68]" : "bg-transparent"}`} />;
}

function Branch({
  parentId,
  nodes,
  device,
  selectedId,
  overId,
  onSelect,
  onText,
}: {
  parentId: string | null;
  nodes: VisualNode[];
  device: Device;
  selectedId: string | null;
  overId: string | null;
  onSelect: (id: string) => void;
  onText: (id: string, value: string) => void;
}) {
  const key = parentId ?? "root";
  const body = (
    <>
      {nodes.map((node, index) => (
        <Fragment key={node.id}>
          <DropSlot id={`slot:${key}:${index}`} active={overId === `slot:${key}:${index}`} tall={false} />
          <CanvasNode node={node} device={device} selectedId={selectedId} overId={overId} onSelect={onSelect} onText={onText} />
        </Fragment>
      ))}
      <DropSlot id={`slot:${key}:${nodes.length}`} active={overId === `slot:${key}:${nodes.length}`} tall={nodes.length === 0} />
    </>
  );
  if (parentId) return body;
  return <div className="min-h-[70vh] p-4">{body}</div>;
}

function CanvasNode({
  node,
  device,
  selectedId,
  overId,
  onSelect,
  onText,
}: {
  node: VisualNode;
  device: Device;
  selectedId: string | null;
  overId: string | null;
  onSelect: (id: string) => void;
  onText: (id: string, value: string) => void;
}) {
  const { attributes, listeners, setNodeRef } = useDraggable({ id: node.id });
  const selected = selectedId === node.id;
  const concealed = hiddenOn(node.style.hidden, device);
  return (
    <div ref={setNodeRef} className={`relative ${concealed ? "opacity-40" : ""} ${selected ? "outline outline-2 outline-[#0d7a68]" : "hover:outline hover:outline-1 hover:outline-[#0d7a68]/50"}`} onClick={(event) => { event.stopPropagation(); onSelect(node.id); }}>
      {concealed ? <span className="absolute top-1 right-1 z-10 rounded bg-[#1f2a28] px-1.5 py-0.5 text-[10px] font-bold text-white">Tersembunyi</span> : null}
      {selected ? (
        <button type="button" className="absolute -top-3 left-1 z-10 grid size-6 cursor-grab place-items-center rounded bg-[#0d7a68] text-white" aria-label="Pindahkan elemen" {...listeners} {...attributes}>
          <GripVertical size={14} />
        </button>
      ) : null}
      <VisualNodeView node={node} device={device} editable={selected && (node.type === "heading" || node.type === "text")} showPlaceholder onText={(value) => onText(node.id, value)}>
        {node.type === "container" ? (
          <Branch parentId={node.id} nodes={node.children ?? []} device={device} selectedId={selectedId} overId={overId} onSelect={onSelect} onText={onText} />
        ) : null}
      </VisualNodeView>
    </div>
  );
}

const DEVICE_LABEL: Record<Device, string> = { desktop: "Desktop", tablet: "Tablet", mobile: "Ponsel" };

function DeviceSettings({
  device,
  hidden,
  onDevice,
  onHidden,
}: {
  device: Device;
  hidden: VisualStyle["hidden"];
  onDevice: (device: Device) => void;
  onHidden: (device: Device, hide: boolean) => void;
}) {
  return (
    <fieldset className="mb-3 border-b border-white/10 pb-3">
      <legend className="text-xs font-bold">Tampilan</legend>
      <div className="mt-2 grid grid-cols-3 gap-1">
        {(Object.keys(DEVICE_LABEL) as Device[]).map((value) => (
          <button key={value} type="button" aria-pressed={device === value} className={`min-h-9 rounded text-xs font-bold ${device === value ? "bg-white text-[#1f2a28]" : "bg-white/10"}`} onClick={() => onDevice(value)}>
            {DEVICE_LABEL[value]}
          </button>
        ))}
      </div>
      <label className="mt-2 flex min-h-9 items-center gap-2 text-xs font-bold">
        <input type="checkbox" checked={!hiddenOn(hidden, device)} onChange={(event) => onHidden(device, !event.target.checked)} />
        Tampilkan di {DEVICE_LABEL[device]}
      </label>
    </fieldset>
  );
}

function Inspector({
  node,
  tab,
  device,
  allowCustomJs,
  onPatch,
  onPick,
}: {
  node: VisualNode;
  tab: "content" | "style" | "advanced";
  device: Device;
  allowCustomJs: boolean;
  onPatch: (recipe: (node: VisualNode) => VisualNode) => void;
  onPick: (mode: "image" | "gallery") => void;
}) {
  const style = node.style;
  const setStyle = (next: VisualStyle) => onPatch((current) => ({ ...current, style: next }) as VisualNode);
  if (tab === "content") {
    if (node.type === "heading") {
      return (
        <div className="flex flex-col gap-3">
          <label className="text-xs font-bold">Teks
            <input className={`${field} mt-1`} value={node.content.text} onChange={(event) => onPatch((current) => current.type === "heading" ? { ...current, content: { ...current.content, text: event.target.value } } : current)} />
          </label>
          <label className="text-xs font-bold">Level
            <select className={`${field} mt-1`} value={node.content.level} onChange={(event) => onPatch((current) => current.type === "heading" ? { ...current, content: { ...current.content, level: event.target.value as "h1" | "h2" | "h3" | "h4" } } : current)}>
              <option value="h1">H1</option>
              <option value="h2">H2</option>
              <option value="h3">H3</option>
              <option value="h4">H4</option>
            </select>
          </label>
        </div>
      );
    }
    if (node.type === "code") {
      const clip = (value: string) => value.slice(0, 20_000);
      return (
        <div className="flex flex-col gap-3">
          <p className="text-xs text-white/70">Berlaku di pratinjau dan halaman terbit. Tidak dijalankan di dalam editor.</p>
          <label className="text-xs font-bold">CSS
            <textarea className={`${field} mt-1 min-h-36 font-mono`} spellCheck={false} value={node.content.css} onChange={(event) => onPatch((current) => current.type === "code" ? { ...current, content: { ...current.content, css: clip(event.target.value) } } : current)} />
          </label>
          {allowCustomJs ? (
            <label className="text-xs font-bold">JavaScript
              <textarea className={`${field} mt-1 min-h-36 font-mono`} spellCheck={false} value={node.content.javascript} onChange={(event) => onPatch((current) => current.type === "code" ? { ...current, content: { ...current.content, javascript: clip(event.target.value) } } : current)} />
            </label>
          ) : (
            <p className="rounded-md bg-white/10 px-2 py-2 text-xs text-white/80">
              JavaScript kustom hanya dapat diubah oleh Super Admin. CSS tetap dapat disunting.
              {node.content.javascript.trim() ? " Skrip yang sudah tersimpan tetap berjalan di situs." : ""}
            </p>
          )}
        </div>
      );
    }
    if (node.type === "text" || node.type === "html") {
      return (
        <label className="text-xs font-bold">{node.type === "html" ? "HTML" : "Teks"}
          <textarea className={`${field} mt-1 min-h-40 font-mono`} value={node.content.html} onChange={(event) => onPatch((current) => current.type === node.type ? { ...current, content: { html: event.target.value } } : current)} />
        </label>
      );
    }
    if (node.type === "image") {
      return (
        <div className="flex flex-col gap-3">
          <button type="button" className="min-h-10 rounded-md bg-white/10 text-sm font-bold" onClick={() => onPick("image")}>{node.content.src ? "Ganti gambar" : "Pilih gambar"}</button>
          <label className="text-xs font-bold">Teks alt
            <input className={`${field} mt-1`} value={node.content.alt} onChange={(event) => onPatch((current) => current.type === "image" ? { ...current, content: { ...current.content, alt: event.target.value } } : current)} />
          </label>
        </div>
      );
    }
    if (node.type === "button") {
      return (
        <div className="flex flex-col gap-3">
          <label className="text-xs font-bold">Label
            <input className={`${field} mt-1`} value={node.content.label} onChange={(event) => onPatch((current) => current.type === "button" ? { ...current, content: { ...current.content, label: event.target.value } } : current)} />
          </label>
          <label className="text-xs font-bold">Tautan
            <input className={`${field} mt-1`} value={node.content.href} onChange={(event) => onPatch((current) => current.type === "button" ? { ...current, content: { ...current.content, href: event.target.value } } : current)} />
          </label>
        </div>
      );
    }
    if (node.type === "video") {
      return (
        <label className="text-xs font-bold">URL YouTube
          <input className={`${field} mt-1`} value={node.content.url} placeholder="https://" onChange={(event) => onPatch((current) => current.type === "video" ? { ...current, content: { url: event.target.value } } : current)} />
        </label>
      );
    }
    if (node.type === "gallery") {
      return (
        <div className="flex flex-col gap-3">
          <label className="text-xs font-bold">Kolom
            <select className={`${field} mt-1`} value={node.content.columns} onChange={(event) => onPatch((current) => current.type === "gallery" ? { ...current, content: { ...current.content, columns: Number(event.target.value) as 2 | 3 | 4 } } : current)}>
              <option value={2}>2</option>
              <option value={3}>3</option>
              <option value={4}>4</option>
            </select>
          </label>
          <button type="button" className="min-h-10 rounded-md bg-white/10 text-sm font-bold" onClick={() => onPick("gallery")}>Tambah gambar</button>
          <ul className="space-y-1 text-xs">
            {node.content.images.map((image, index) => (
              <li key={`${image.src}-${index}`} className="flex items-center justify-between gap-2">
                <span className="truncate">{image.alt || image.src}</span>
                <button type="button" className={quiet} onClick={() => onPatch((current) => current.type === "gallery" ? { ...current, content: { ...current.content, images: current.content.images.filter((_, i) => i !== index) } } : current)}>Hapus</button>
              </li>
            ))}
          </ul>
        </div>
      );
    }
    if (node.type === "icon") {
      return (
        <label className="text-xs font-bold">Ikon
          <select className={`${field} mt-1`} value={node.content.name} onChange={(event) => onPatch((current) => current.type === "icon" ? { ...current, content: { name: event.target.value as typeof node.content.name } } : current)}>
            <option value="heart">Hati</option>
            <option value="star">Bintang</option>
            <option value="check">Centang</option>
            <option value="arrow">Panah</option>
            <option value="pin">Pin</option>
            <option value="users">Orang</option>
          </select>
        </label>
      );
    }
    if (node.type === "container") {
      return <p className="text-sm text-white/80">Seret elemen ke dalam kontainer ini, atau klik elemen di daftar saat kontainer ini dipilih.</p>;
    }
    return <p className="text-sm text-white/70">Elemen ini tidak punya isi teks.</p>;
  }

  if (tab === "style") {
    return (
      <div className="flex flex-col gap-3">
        <Color label="Warna teks" value={style.color ?? ""} onChange={(color) => setStyle({ ...style, color: color || undefined })} />
        <Color label="Latar" value={style.background ?? ""} onChange={(background) => setStyle({ ...style, background: background || undefined })} />
        <label className="text-xs font-bold">Font
          <select className={`${field} mt-1`} value={style.fontFamily ?? "inherit"} onChange={(event) => setStyle({ ...style, fontFamily: event.target.value as VisualStyle["fontFamily"] })}>
            <option value="inherit">Bawaan</option>
            <option value="sans">Sans</option>
            <option value="serif">Serif</option>
          </select>
        </label>
        <label className="text-xs font-bold">Ketebalan
          <select className={`${field} mt-1`} value={style.fontWeight ?? "400"} onChange={(event) => setStyle({ ...style, fontWeight: event.target.value as VisualStyle["fontWeight"] })}>
            <option value="400">Biasa</option>
            <option value="600">Semibold</option>
            <option value="700">Bold</option>
            <option value="800">Ekstra bold</option>
          </select>
        </label>
        <Num label="Ukuran huruf" value={style.fontSize?.[device]} onChange={(value) => setStyle(setResponsive(style, "fontSize", device, value))} />
        <Choice label="Rata teks" value={style.textAlign?.[device] ?? ""} options={["", "left", "center", "right"]} names={["Ikut", "Kiri", "Tengah", "Kanan"]} onChange={(value) => setStyle(setResponsive(style, "textAlign", device, value === "" ? undefined : (value as "left" | "center" | "right")))} />
        {node.type === "container" ? (
          <>
            <Choice label="Arah" value={style.direction?.[device] ?? ""} options={["", "column", "row"]} names={["Ikut", "Kolom", "Baris"]} onChange={(value) => setStyle(setResponsive(style, "direction", device, value === "" ? undefined : (value as "column" | "row")))} />
            <Choice label="Perataan utama" value={style.justify?.[device] ?? ""} options={["", "start", "center", "end", "between"]} names={["Ikut", "Awal", "Tengah", "Akhir", "Rata"]} onChange={(value) => setStyle(setResponsive(style, "justify", device, value === "" ? undefined : (value as "start")))} />
            <Choice label="Perataan silang" value={style.align?.[device] ?? ""} options={["", "start", "center", "end", "stretch"]} names={["Ikut", "Awal", "Tengah", "Akhir", "Rentang"]} onChange={(value) => setStyle(setResponsive(style, "align", device, value === "" ? undefined : (value as "start")))} />
            <Num label="Jarak" value={style.gap?.[device]} onChange={(value) => setStyle(setResponsive(style, "gap", device, value))} />
          </>
        ) : null}
        <Color label="Warna garis" value={style.borderColor ?? ""} onChange={(borderColor) => setStyle({ ...style, borderColor: borderColor || undefined })} />
        <Num label="Tebal garis" value={style.borderWidth} onChange={(borderWidth) => setStyle({ ...style, borderWidth })} />
        <Num label="Lengkung sudut" value={style.borderRadius} onChange={(borderRadius) => setStyle({ ...style, borderRadius })} />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      <label className="text-xs font-bold">Lebar
        <input className={`${field} mt-1`} value={style.width?.[device] ?? ""} placeholder="100% atau 320px" onChange={(event) => setStyle(setResponsive(style, "width", device, event.target.value || undefined))} />
      </label>
      <label className="text-xs font-bold">Tinggi
        <input className={`${field} mt-1`} value={style.height?.[device] ?? ""} placeholder="auto atau 40px" onChange={(event) => setStyle(setResponsive(style, "height", device, event.target.value || undefined))} />
      </label>
      <BoxFields label="Padding" value={style.padding?.[device]} onChange={(value) => setStyle(setResponsive(style, "padding", device, value))} />
      <BoxFields label="Margin" value={style.margin?.[device]} onChange={(value) => setStyle(setResponsive(style, "margin", device, value))} />
      <label className="text-xs font-bold">Kelas CSS
        <input className={`${field} mt-1`} value={style.className ?? ""} onChange={(event) => setStyle({ ...style, className: event.target.value || undefined })} />
      </label>
    </div>
  );
}

function setResponsive<K extends "fontSize" | "textAlign" | "width" | "height" | "padding" | "margin" | "direction" | "justify" | "align" | "gap">(
  style: VisualStyle,
  key: K,
  device: Device,
  value: NonNullable<VisualStyle[K]>[Device] | undefined,
): VisualStyle {
  const current = { ...(style[key] ?? {}) } as NonNullable<VisualStyle[K]>;
  if (value === undefined || value === "") delete current[device];
  else current[device] = value as never;
  return { ...style, [key]: Object.keys(current).length ? current : undefined };
}

function Color({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  return (
    <label className="text-xs font-bold">{label}
      <span className="mt-1 flex gap-2">
        <input type="color" aria-label={label} value={/^#[0-9a-fA-F]{6}$/.test(value) ? value : "#000000"} onChange={(event) => onChange(event.target.value)} className="size-10 bg-transparent" />
        <input className={field} value={value} onChange={(event) => onChange(event.target.value)} />
      </span>
    </label>
  );
}

function Num({ label, value, onChange }: { label: string; value: number | undefined; onChange: (value: number | undefined) => void }) {
  return (
    <label className="text-xs font-bold">{label}
      <input type="number" className={`${field} mt-1`} value={value ?? ""} onChange={(event) => onChange(event.target.value === "" ? undefined : Number(event.target.value))} />
    </label>
  );
}

function Choice({ label, value, options, names, onChange }: { label: string; value: string; options: string[]; names: string[]; onChange: (value: string) => void }) {
  return (
    <label className="text-xs font-bold">{label}
      <select className={`${field} mt-1`} value={value} onChange={(event) => onChange(event.target.value)}>
        {options.map((option, index) => (
          <option key={option || "inherit"} value={option}>{names[index]}</option>
        ))}
      </select>
    </label>
  );
}

function BoxFields({ label, value, onChange }: { label: string; value: Box | undefined; onChange: (value: Box | undefined) => void }) {
  const box = value ?? { top: 0, right: 0, bottom: 0, left: 0 };
  const set = (side: keyof Box, next: number) => onChange({ ...box, [side]: next });
  return (
    <fieldset className="text-xs font-bold">
      <legend>{label}</legend>
      <div className="mt-1 grid grid-cols-4 gap-1">
        {(["top", "right", "bottom", "left"] as const).map((side) => (
          <input key={side} aria-label={`${label} ${side}`} type="number" className={field} value={box[side]} onChange={(event) => set(side, Number(event.target.value))} />
        ))}
      </div>
    </fieldset>
  );
}
