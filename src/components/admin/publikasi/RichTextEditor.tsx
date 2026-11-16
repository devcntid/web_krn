"use client";

import type { JSONContent } from "@tiptap/core";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { memo, useId, useState } from "react";

import type { MediaChoice } from "@/types/admin-posts";

import { MediaPicker } from "./MediaPicker";
import { ContentImage, ContentLink, Details, DetailsSummary, Embed, youtubeEmbedUrl } from "./extensions";

export type EditorContentValue = { json: unknown; html: string };

type Panel = { kind: "link" | "button" | "video"; url: string; text: string; error?: string };

const PANEL_COPY: Record<Panel["kind"], { title: string; url: string; text?: string; submit: string }> = {
  link: { title: "Tautan", url: "URL tautan (kosongkan untuk menghapus tautan)", submit: "Terapkan" },
  button: { title: "Tombol", url: "URL tujuan tombol", text: "Teks tombol", submit: "Sisipkan tombol" },
  video: { title: "Video YouTube", url: "URL video YouTube", text: "Judul video (untuk pembaca layar)", submit: "Sisipkan video" },
};

function isDoc(value: unknown): value is JSONContent {
  return typeof value === "object" && value !== null && (value as { type?: unknown }).type === "doc";
}

const toolBtn =
  "min-h-11 min-w-11 rounded-lg px-2.5 text-[13px] font-extrabold text-admin-ink hover:bg-admin-neutral-bg focus-visible:outline-2 focus-visible:outline-primary disabled:opacity-40 aria-pressed:bg-admin-ok-bg aria-pressed:text-admin-primary-dark";
const input =
  "min-h-11 w-full rounded-admin border border-admin-field bg-white px-3 text-sm focus-visible:outline-2 focus-visible:outline-primary";

/**
 * Editor isi publikasi (Tiptap). Blok: paragraf, H2/H3, daftar, kutipan, gambar (MediaPicker,
 * alt wajib), tombol, video YouTube, accordion. `onChange` hanya dipanggil saat pengguna
 * mengubah isi — bukan saat konten awal dimuat.
 */
export const RichTextEditor = memo(function RichTextEditor({
  initialJson,
  initialHtml,
  editable,
  onChange,
}: {
  initialJson: unknown;
  initialHtml: string;
  editable: boolean;
  onChange: (value: EditorContentValue) => void;
}) {
  const [panel, setPanel] = useState<Panel | null>(null);
  const [picking, setPicking] = useState(false);
  const urlId = useId();
  const textId = useId();
  const altId = useId();

  const editor = useEditor({
    immediatelyRender: false,
    shouldRerenderOnTransaction: true,
    editable,
    extensions: [
      StarterKit.configure({ heading: { levels: [2, 3, 4, 5] }, link: false }),
      ContentLink,
      ContentImage,
      Embed,
      Details,
      DetailsSummary,
    ],
    content: isDoc(initialJson) ? initialJson : initialHtml,
    editorProps: {
      attributes: {
        "aria-label": "Isi publikasi",
        role: "textbox",
        "aria-multiline": "true",
        class:
          "wp-content min-h-80 font-sans text-[15px] leading-[1.75] text-ink outline-none [&_.ProseMirror-selectednode]:outline-2 [&_.ProseMirror-selectednode]:outline-offset-2 [&_.ProseMirror-selectednode]:outline-primary [&_img]:h-auto [&_img]:max-w-full [&_img]:rounded-md [&_summary]:cursor-text",
      },
    },
    onUpdate: ({ editor: e }) => onChange({ json: e.getJSON(), html: e.getHTML() }),
  });

  if (!editor) {
    return <div className="mt-5 min-h-96 rounded-admin bg-admin-canvas" aria-busy="true" aria-label="Memuat editor" />;
  }

  const openPanel = (kind: Panel["kind"]) => {
    const href = kind === "link" ? String(editor.getAttributes("link").href ?? "") : "";
    setPanel({ kind, url: href, text: "" });
  };

  const submitPanel = (e: React.FormEvent) => {
    e.preventDefault();
    if (!panel) return;
    const url = panel.url.trim();
    const text = panel.text.trim();
    const fail = (error: string) => setPanel({ ...panel, error });

    if (panel.kind === "link") {
      if (!url) editor.chain().focus().extendMarkRange("link").unsetLink().run();
      else if (!/^(https?:\/\/|\/|mailto:|tel:)/.test(url)) return fail("URL harus diawali https://, /, mailto:, atau tel:.");
      else if (editor.state.selection.empty && !editor.isActive("link")) {
        editor
          .chain()
          .focus()
          .insertContent({ type: "text", text: url, marks: [{ type: "link", attrs: { href: url } }] })
          .run();
      } else if (editor.isActive("link")) {
        // Ubah URL tautan/tombol yang ada tanpa menghilangkan penanda tombol.
        editor.chain().focus().extendMarkRange("link").updateAttributes("link", { href: url }).run();
      } else editor.chain().focus().setLink({ href: url }).run();
    } else if (panel.kind === "button") {
      if (!/^(https?:\/\/|\/)/.test(url)) return fail("URL tombol harus diawali https:// atau /.");
      if (!text) return fail("Teks tombol wajib diisi.");
      editor
        .chain()
        .focus()
        .insertContent({
          type: "paragraph",
          content: [{ type: "text", text, marks: [{ type: "link", attrs: { href: url, "data-button": "true" } }] }],
        })
        .run();
    } else {
      const src = youtubeEmbedUrl(url);
      if (!src) return fail("Masukkan URL video YouTube yang valid.");
      if (!text) return fail("Judul video wajib diisi.");
      // Paragraf kosong sesudahnya menaruh kursor di luar blok video (paragraf kosong dibuang saat disimpan).
      editor
        .chain()
        .focus()
        .insertContent([{ type: "embed", attrs: { src, title: text } }, { type: "paragraph" }])
        .run();
    }
    setPanel(null);
  };

  const insertImage = (media: MediaChoice) => {
    setPicking(false);
    editor
      .chain()
      .focus()
      .insertContent([{ type: "image", attrs: { src: media.url, alt: media.alt, width: media.width, height: media.height } }, { type: "paragraph" }])
      .run();
  };

  const insertAccordion = () =>
    editor
      .chain()
      .focus()
      .insertContent({
        type: "details",
        content: [{ type: "detailsSummary", content: [{ type: "text", text: "Judul accordion" }] }, { type: "paragraph" }],
      })
      .run();

  const tools: { label: string; glyph: string; active?: boolean; disabled?: boolean; run: () => void }[] = [
    { label: "Paragraf", glyph: "¶", active: editor.isActive("paragraph"), run: () => editor.chain().focus().setParagraph().run() },
    { label: "Heading 2", glyph: "H2", active: editor.isActive("heading", { level: 2 }), run: () => editor.chain().focus().toggleHeading({ level: 2 }).run() },
    { label: "Heading 3", glyph: "H3", active: editor.isActive("heading", { level: 3 }), run: () => editor.chain().focus().toggleHeading({ level: 3 }).run() },
    { label: "Tebal", glyph: "B", active: editor.isActive("bold"), run: () => editor.chain().focus().toggleBold().run() },
    { label: "Miring", glyph: "I", active: editor.isActive("italic"), run: () => editor.chain().focus().toggleItalic().run() },
    { label: "Tautan", glyph: "Link", active: editor.isActive("link"), run: () => openPanel("link") },
    { label: "Daftar berbutir", glyph: "• List", active: editor.isActive("bulletList"), run: () => editor.chain().focus().toggleBulletList().run() },
    { label: "Daftar bernomor", glyph: "1. List", active: editor.isActive("orderedList"), run: () => editor.chain().focus().toggleOrderedList().run() },
    { label: "Kutipan", glyph: "“ ”", active: editor.isActive("blockquote"), run: () => editor.chain().focus().toggleBlockquote().run() },
    { label: "Gambar", glyph: "Img", run: () => setPicking(true) },
    { label: "Tombol", glyph: "Btn", run: () => openPanel("button") },
    { label: "Video YouTube", glyph: "Video", run: () => openPanel("video") },
    { label: "Accordion", glyph: "Acc", active: editor.isActive("details"), run: insertAccordion },
    { label: "Urungkan", glyph: "↶", disabled: !editor.can().undo(), run: () => editor.chain().focus().undo().run() },
    { label: "Ulangi", glyph: "↷", disabled: !editor.can().redo(), run: () => editor.chain().focus().redo().run() },
  ];

  const imageSelected = editor.isActive("image");
  const copy = panel ? PANEL_COPY[panel.kind] : null;

  return (
    <div className="mt-5">
      {editable ? (
        <div className="sticky top-16 z-20 rounded-admin border border-admin-line bg-admin-row-hover">
          <div role="toolbar" aria-label="Format teks" className="flex flex-wrap gap-1 p-1.5">
            {tools.map((t) => (
              <button
                key={t.label}
                type="button"
                aria-label={t.label}
                title={t.label}
                aria-pressed={t.active === undefined ? undefined : t.active}
                disabled={t.disabled}
                // Fokus tetap di editor saat tombol diklik, sehingga ketikan berikutnya tidak hilang.
                onMouseDown={(e) => e.preventDefault()}
                onClick={t.run}
                className={toolBtn}
              >
                <span aria-hidden="true">{t.glyph}</span>
              </button>
            ))}
          </div>

          {panel && copy ? (
            <form onSubmit={submitPanel} aria-label={copy.title} className="flex flex-wrap items-end gap-2.5 border-t border-admin-line p-3">
              <div className="min-w-52 flex-[2]">
                <label htmlFor={urlId} className="text-xs font-bold text-admin-text">
                  {copy.url}
                </label>
                <input
                  id={urlId}
                  autoFocus
                  value={panel.url}
                  onChange={(e) => setPanel({ ...panel, url: e.target.value, error: undefined })}
                  placeholder="https://…"
                  aria-invalid={panel.error ? true : undefined}
                  className={`${input} mt-1`}
                />
              </div>
              {copy.text ? (
                <div className="min-w-44 flex-1">
                  <label htmlFor={textId} className="text-xs font-bold text-admin-text">
                    {copy.text}
                  </label>
                  <input id={textId} value={panel.text} onChange={(e) => setPanel({ ...panel, text: e.target.value, error: undefined })} className={`${input} mt-1`} />
                </div>
              ) : null}
              <button type="submit" className="min-h-11 rounded-admin bg-primary px-4 text-sm font-extrabold text-white hover:bg-admin-primary-dark focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary">
                {copy.submit}
              </button>
              <button type="button" onClick={() => setPanel(null)} className="min-h-11 rounded-admin border border-admin-field bg-white px-4 text-sm font-bold focus-visible:outline-2 focus-visible:outline-primary">
                Batal
              </button>
              {panel.error ? (
                <p role="alert" className="w-full text-[13px] font-semibold text-admin-danger">
                  {panel.error}
                </p>
              ) : null}
            </form>
          ) : null}

          {imageSelected ? (
            <div className="flex flex-wrap items-center gap-2.5 border-t border-admin-line p-3">
              <label htmlFor={altId} className="text-xs font-bold text-admin-text">
                Teks alt gambar terpilih
              </label>
              <input
                id={altId}
                value={String(editor.getAttributes("image").alt ?? "")}
                onChange={(e) => editor.commands.updateAttributes("image", { alt: e.target.value })}
                maxLength={300}
                aria-invalid={String(editor.getAttributes("image").alt ?? "").trim() ? undefined : true}
                className={`${input} min-w-52 flex-1`}
              />
            </div>
          ) : null}
        </div>
      ) : null}

      <div className="mt-5">
        <EditorContent editor={editor} />
      </div>

      <MediaPicker open={picking} title="Sisipkan gambar" onClose={() => setPicking(false)} onSelect={insertImage} />
    </div>
  );
});
