import { Node, mergeAttributes } from "@tiptap/core";
import Link from "@tiptap/extension-link";

import { youtubeId } from "@/lib/youtube";

/*
 * Node & mark tambahan editor publikasi. HTML yang dihasilkan sengaja memakai bentuk yang
 * sama dengan konten hasil ekspor WordPress (lihat src/lib/html-whitelist.ts), sehingga post
 * lama bisa dibuka di editor dan post baru dirender RichContent tanpa aturan baru:
 *   gambar    → <img src alt width height>
 *   tombol    → <a data-button="true" href>
 *   video     → <iframe src title allow allowfullscreen>
 *   accordion → <details><summary>…</summary>…</details>
 */

/** Gambar sebagai blok. Teks alt wajib diisi lewat MediaPicker. */
export const ContentImage = Node.create({
  name: "image",
  group: "block",
  atom: true,
  draggable: true,
  selectable: true,
  addAttributes() {
    return {
      src: { default: null },
      alt: { default: "" },
      width: { default: null },
      height: { default: null },
    };
  },
  parseHTML() {
    return [{ tag: "img[src]" }];
  },
  renderHTML({ HTMLAttributes }) {
    return ["img", mergeAttributes(HTMLAttributes)];
  },
});

/** Video sematan (YouTube). Di editor dirender lewat node view agar bisa dipilih/dihapus dengan klik. */
export const Embed = Node.create({
  name: "embed",
  group: "block",
  atom: true,
  draggable: true,
  selectable: true,
  addAttributes() {
    return { src: { default: null }, title: { default: null } };
  },
  parseHTML() {
    return [{ tag: "iframe[src]" }];
  },
  renderHTML({ HTMLAttributes }) {
    return [
      "iframe",
      mergeAttributes(HTMLAttributes, {
        allow: "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share",
        allowfullscreen: "true",
      }),
    ];
  },
  addNodeView() {
    return ({ node }) => {
      const dom = document.createElement("div");
      dom.className = "my-4 overflow-hidden rounded-lg bg-admin-neutral-bg";
      const iframe = document.createElement("iframe");
      iframe.src = String(node.attrs.src ?? "");
      iframe.title = String(node.attrs.title ?? "Video");
      iframe.loading = "lazy";
      iframe.className = "pointer-events-none block aspect-video w-full border-0";
      dom.append(iframe);
      return { dom };
    };
  },
});

export const DetailsSummary = Node.create({
  name: "detailsSummary",
  content: "inline*",
  defining: true,
  selectable: false,
  parseHTML() {
    return [{ tag: "summary" }];
  },
  renderHTML() {
    return ["summary", 0];
  },
});

/** Accordion. Selalu terbuka di editor (atribut `open` dibuang sanitizer saat disimpan). */
export const Details = Node.create({
  name: "details",
  group: "block",
  content: "detailsSummary block*",
  defining: true,
  parseHTML() {
    return [{ tag: "details" }];
  },
  renderHTML() {
    return ["details", { open: "" }, 0];
  },
});

/**
 * Tautan; `data-button="true"` menjadikannya tombol (gaya .wp-content a[data-button]).
 * Tombol hasil ekspor WordPress banyak yang tidak membawa href (<a data-button="true">Teks</a>);
 * aturan parse kedua mempertahankannya sebagai tombol agar tidak berubah jadi teks biasa saat
 * post lama diedit — URL-nya bisa dilengkapi lewat tombol "Tautan" di toolbar.
 */
export const ContentLink = Link.extend({
  parseHTML() {
    return [...(this.parent?.() ?? []), { tag: "a[data-button]:not([href])" }];
  },
  addAttributes() {
    return {
      ...this.parent?.(),
      "data-button": {
        default: null,
        parseHTML: (element: HTMLElement) => (element.getAttribute("data-button") ? "true" : null),
        renderHTML: (attributes: Record<string, unknown>) => (attributes["data-button"] ? { "data-button": "true" } : {}),
      },
    };
  },
}).configure({
  openOnClick: false,
  autolink: true,
  // target/rel untuk tautan eksternal ditambahkan sanitizer server, sama seperti ekspor WordPress.
  HTMLAttributes: { target: null, rel: null, class: null },
});

/** URL sematan dari berbagai bentuk URL YouTube; null bila bukan URL YouTube. */
export function youtubeEmbedUrl(input: string): string | null {
  const id = youtubeId(input);
  return id ? `https://www.youtube.com/embed/${id}` : null;
}

/** Tag di HTML lama yang belum punya padanan di editor (akan hilang bila badan tulisan diedit). */
export function unsupportedTags(html: string): string[] {
  const names: Record<string, string> = { table: "tabel", figcaption: "keterangan gambar", sub: "subskrip", sup: "superskrip", mark: "sorotan", h6: "heading 6" };
  return Object.entries(names)
    .filter(([tag]) => new RegExp(`<${tag}[\\s>]`, "i").test(html))
    .map(([, label]) => label);
}
