/**
 * Dokumen Visual Builder (section `visual` di pages.sections).
 * Halaman lama tetap memakai tipe section yang sudah ada; pohon ini hanya untuk halaman
 * yang dibuat lewat Visual Builder.
 */

export const VISUAL_TYPES = ["container", "heading", "text", "image", "button", "video", "gallery", "divider", "spacer", "icon", "html", "code"] as const;
export type VisualType = (typeof VISUAL_TYPES)[number];

export const ICON_NAMES = ["heart", "star", "check", "arrow", "pin", "users"] as const;
export type IconName = (typeof ICON_NAMES)[number];

export type Device = "desktop" | "tablet" | "mobile";
export type Align = "left" | "center" | "right";
export type FlexDir = "row" | "column";
export type FlexPos = "start" | "center" | "end" | "between" | "stretch";

export type Box = { top: number; right: number; bottom: number; left: number };
export type Responsive<T> = { desktop?: T; tablet?: T; mobile?: T };

export type VisualStyle = {
  color?: string;
  background?: string;
  fontFamily?: "inherit" | "sans" | "serif";
  fontSize?: Responsive<number>;
  fontWeight?: "400" | "600" | "700" | "800";
  textAlign?: Responsive<Align>;
  width?: Responsive<string>;
  height?: Responsive<string>;
  minHeight?: Responsive<number>;
  padding?: Responsive<Box>;
  margin?: Responsive<Box>;
  borderWidth?: number;
  borderColor?: string;
  borderRadius?: number;
  direction?: Responsive<FlexDir>;
  justify?: Responsive<FlexPos>;
  align?: Responsive<FlexPos>;
  gap?: Responsive<number>;
  className?: string;
  /** `true` menyembunyikan elemen di perangkat itu. Perangkat lain tetap tampil. */
  hidden?: { desktop?: true; tablet?: true; mobile?: true };
};

export type MediaNode = { src: string; width: number; height: number; alt: string };

export type VisualContent = {
  container: Record<string, never>;
  heading: { text: string; level: "h1" | "h2" | "h3" | "h4" };
  text: { html: string };
  image: MediaNode;
  button: { label: string; href: string };
  video: { url: string };
  gallery: { columns: 2 | 3 | 4; images: MediaNode[] };
  divider: Record<string, never>;
  spacer: Record<string, never>;
  icon: { name: IconName };
  html: { html: string };
  code: { css: string; javascript: string };
};

export type VisualNode = {
  [K in VisualType]: { id: string; type: K; content: VisualContent[K]; style: VisualStyle; children?: VisualNode[] };
}[VisualType];

export const VISUAL_LABEL: Record<VisualType, string> = {
  container: "Kontainer",
  heading: "Judul",
  text: "Teks",
  image: "Gambar",
  button: "Tombol",
  video: "Video",
  gallery: "Galeri",
  divider: "Garis",
  spacer: "Spasi",
  icon: "Ikon",
  html: "HTML",
  code: "Kode kustom",
};

const HEX = /^#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/;
const SIZE = /^(?:auto|\d{1,4}(?:px|%))$/;
const CLASS_NAME = /^[a-zA-Z0-9_-](?:[a-zA-Z0-9_ -]{0,78}[a-zA-Z0-9_-])?$/;
const MAX_NODES = 120;
const MAX_DEPTH = 6;

export function createNode(type: VisualType): VisualNode {
  const id = crypto.randomUUID();
  switch (type) {
    case "container":
      return { id, type, content: {}, style: { direction: { desktop: "column" }, gap: { desktop: 16 }, padding: { desktop: { top: 8, right: 8, bottom: 8, left: 8 } } }, children: [] };
    case "heading":
      return { id, type, content: { text: "Judul", level: "h2" }, style: { fontSize: { desktop: 32 }, fontWeight: "700" } };
    case "text":
      return { id, type, content: { html: "<p>Tulis teks di sini.</p>" }, style: { fontSize: { desktop: 16 } } };
    case "image":
      return { id, type, content: { src: "", width: 0, height: 0, alt: "" }, style: { width: { desktop: "100%" } } };
    case "button":
      return { id, type, content: { label: "Selengkapnya", href: "/" }, style: { background: "#006659", color: "#ffffff", borderRadius: 8, padding: { desktop: { top: 12, right: 22, bottom: 12, left: 22 } } } };
    case "video":
      return { id, type, content: { url: "" }, style: {} };
    case "gallery":
      return { id, type, content: { columns: 3, images: [] }, style: { gap: { desktop: 12 } } };
    case "divider":
      return { id, type, content: {}, style: { borderColor: "#d9d9d4", borderWidth: 1 } };
    case "spacer":
      return { id, type, content: {}, style: { height: { desktop: "40px" } } };
    case "icon":
      return { id, type, content: { name: "heart" }, style: { color: "#006659", fontSize: { desktop: 32 } } };
    case "html":
      return { id, type, content: { html: "<p>HTML</p>" }, style: {} };
    case "code":
      return { id, type, content: { css: "", javascript: "" }, style: {} };
  }
}

export function cloneNode(node: VisualNode): VisualNode {
  const copy = structuredClone(node);
  const renew = (item: VisualNode): VisualNode => ({
    ...item,
    id: crypto.randomUUID(),
    children: item.children?.map(renew),
  });
  return renew(copy);
}

export function findNode(nodes: VisualNode[], id: string): VisualNode | null {
  for (const node of nodes) {
    if (node.id === id) return node;
    if (node.children) {
      const found = findNode(node.children, id);
      if (found) return found;
    }
  }
  return null;
}

export function containsNode(node: VisualNode, id: string): boolean {
  if (node.id === id) return true;
  return node.children?.some((child) => containsNode(child, id)) ?? false;
}

export function locateNode(nodes: VisualNode[], id: string, parentId: string | null = null): { parentId: string | null; index: number } | null {
  for (let index = 0; index < nodes.length; index++) {
    if (nodes[index].id === id) return { parentId, index };
    if (nodes[index].children) {
      const found = locateNode(nodes[index].children ?? [], id, nodes[index].id);
      if (found) return found;
    }
  }
  return null;
}

export function updateNode(nodes: VisualNode[], id: string, recipe: (node: VisualNode) => VisualNode): VisualNode[] {
  return nodes.map((node) => {
    if (node.id === id) return recipe(node);
    if (!node.children) return node;
    return { ...node, children: updateNode(node.children, id, recipe) };
  });
}

export function insertNode(nodes: VisualNode[], parentId: string | null, index: number, node: VisualNode): VisualNode[] {
  if (parentId === null) {
    const next = nodes.slice();
    next.splice(Math.max(0, Math.min(index, next.length)), 0, node);
    return next;
  }
  return nodes.map((item) => {
    if (item.id === parentId && item.type === "container") {
      const children = (item.children ?? []).slice();
      children.splice(Math.max(0, Math.min(index, children.length)), 0, node);
      return { ...item, children };
    }
    if (!item.children) return item;
    return { ...item, children: insertNode(item.children, parentId, index, node) };
  });
}

export function removeNode(nodes: VisualNode[], id: string): { nodes: VisualNode[]; removed: VisualNode | null } {
  let removed: VisualNode | null = null;
  const walk = (list: VisualNode[]): VisualNode[] => {
    const next: VisualNode[] = [];
    for (const item of list) {
      if (item.id === id) {
        removed = item;
        continue;
      }
      next.push(item.children ? { ...item, children: walk(item.children) } : item);
    }
    return next;
  };
  return { nodes: walk(nodes), removed };
}

/** Pindahkan simpul. Menolak jika kontainer dijatuhkan ke dalam dirinya sendiri. */
export function moveNode(nodes: VisualNode[], id: string, parentId: string | null, index: number): VisualNode[] {
  const origin = locateNode(nodes, id);
  const { nodes: without, removed } = removeNode(nodes, id);
  if (!removed || !origin) return nodes;
  if (parentId && containsNode(removed, parentId)) return nodes;
  let dest = index;
  if (origin.parentId === parentId && origin.index < index) dest -= 1;
  return insertNode(without, parentId, dest, removed);
}

export function hiddenOn(hidden: VisualStyle["hidden"], device: Device): boolean {
  return hidden?.[device] === true;
}

function shownDisplay(node: VisualNode): string {
  if (node.type === "container") return "flex";
  if (node.type === "button") return "inline-block";
  if (node.type === "icon") return "inline-flex";
  return "block";
}

/** Aturan sembunyi/tampil per perangkat. Tablet tidak mewarisi status desktop. */
function visibilityRules(node: VisualNode): string {
  const hidden = node.style.hidden;
  const desktop = hidden?.desktop === true;
  const tablet = hidden?.tablet === true;
  const mobile = hidden?.mobile === true;
  if (!desktop && !tablet && !mobile) return "";
  const id = `[data-vn="${node.id}"]`;
  const show = shownDisplay(node);
  const rules: string[] = [];
  if (desktop) rules.push(`${id}{display:none !important}`);
  if (tablet !== desktop) rules.push(`@media (max-width:1024px){${id}{display:${tablet ? "none" : show} !important}}`);
  if (mobile !== tablet) rules.push(`@media (max-width:767px){${id}{display:${mobile ? "none" : show} !important}}`);
  return rules.join("");
}

function layerValue<T>(value: Responsive<T> | undefined, device: Device): T | undefined {
  if (!value) return undefined;
  if (device === "mobile") return value.mobile ?? value.tablet ?? value.desktop;
  if (device === "tablet") return value.tablet ?? value.desktop;
  return value.desktop;
}

function boxCss(box: Box | undefined): string | undefined {
  if (!box) return undefined;
  return `${box.top}px ${box.right}px ${box.bottom}px ${box.left}px`;
}

const JUSTIFY: Record<FlexPos, string> = { start: "flex-start", center: "center", end: "flex-end", between: "space-between", stretch: "stretch" };

export type CssMap = Record<string, string | number>;

/** Gaya yang dipakai canvas untuk satu perangkat (tablet mewarisi desktop, mobile mewarisi tablet). */
export function resolvedCss(node: VisualNode, device: Device): CssMap {
  const style = node.style;
  const css: CssMap = {};
  if (style.color && HEX.test(style.color)) css.color = style.color;
  if (style.background && HEX.test(style.background)) css.background = style.background;
  if (style.fontFamily === "serif") css.fontFamily = "Georgia, 'Times New Roman', serif";
  if (style.fontFamily === "sans") css.fontFamily = "Manrope, sans-serif";
  if (style.fontWeight) css.fontWeight = style.fontWeight;
  const size = layerValue(style.fontSize, device);
  if (size) css.fontSize = size;
  const align = layerValue(style.textAlign, device);
  if (align) css.textAlign = align;
  const width = layerValue(style.width, device);
  if (width && SIZE.test(width)) css.width = width;
  const height = layerValue(style.height, device);
  if (height && SIZE.test(height)) css.height = height;
  const minHeight = layerValue(style.minHeight, device);
  if (minHeight) css.minHeight = minHeight;
  const padding = boxCss(layerValue(style.padding, device));
  if (padding) css.padding = padding;
  const margin = boxCss(layerValue(style.margin, device));
  if (margin) css.margin = margin;
  if (style.borderRadius !== undefined) css.borderRadius = style.borderRadius;
  if (node.type === "container") {
    css.display = "flex";
    css.flexWrap = "wrap";
    css.flexDirection = layerValue(style.direction, device) ?? "column";
    const justify = layerValue(style.justify, device);
    if (justify) css.justifyContent = JUSTIFY[justify];
    const alignItems = layerValue(style.align, device);
    if (alignItems && alignItems !== "between") css.alignItems = JUSTIFY[alignItems];
    const gap = layerValue(style.gap, device);
    if (gap !== undefined) css.gap = gap;
  }
  if (node.type === "divider") {
    css.border = "none";
    css.borderTop = `${style.borderWidth ?? 1}px solid ${style.borderColor && HEX.test(style.borderColor) ? style.borderColor : "#d9d9d4"}`;
    css.width = layerValue(style.width, device) ?? "100%";
  } else if (style.borderWidth && style.borderWidth > 0) {
    css.border = `${style.borderWidth}px solid ${style.borderColor && HEX.test(style.borderColor) ? style.borderColor : "#d9d9d4"}`;
  }
  if (node.type === "button") {
    css.display = "inline-block";
    css.textDecoration = "none";
  }
  if (node.type === "image" && !css.width) css.width = "100%";
  if (node.type === "spacer" && !css.height) css.height = "40px";
  return css;
}

function decl(css: CssMap): string {
  return Object.entries(css)
    .map(([key, value]) => {
      const prop = key.replace(/[A-Z]/g, (letter) => `-${letter.toLowerCase()}`);
      const printed = typeof value === "number" && !["fontWeight", "font-weight", "opacity", "zIndex"].includes(key) ? `${value}px` : String(value);
      return `${prop}:${printed}`;
    })
    .join(";");
}

function diffCss(node: VisualNode, device: "tablet" | "mobile"): CssMap {
  const style = node.style;
  const css: CssMap = {};
  const take = <T>(value: Responsive<T> | undefined, apply: (item: T) => void) => {
    const own = value?.[device];
    if (own !== undefined) apply(own);
  };
  take(style.fontSize, (item) => (css.fontSize = item));
  take(style.textAlign, (item) => (css.textAlign = item));
  take(style.width, (item) => {
    if (SIZE.test(item)) css.width = item;
  });
  take(style.height, (item) => {
    if (SIZE.test(item)) css.height = item;
  });
  take(style.minHeight, (item) => (css.minHeight = item));
  take(style.padding, (item) => {
    const box = boxCss(item);
    if (box) css.padding = box;
  });
  take(style.margin, (item) => {
    const box = boxCss(item);
    if (box) css.margin = box;
  });
  if (node.type === "container") {
    take(style.direction, (item) => (css.flexDirection = item));
    take(style.justify, (item) => (css.justifyContent = JUSTIFY[item]));
    take(style.align, (item) => {
      if (item !== "between") css.alignItems = JUSTIFY[item];
    });
    take(style.gap, (item) => (css.gap = item));
  }
  return css;
}

/** CSS publik: desktop sebagai dasar, tablet ≤1024px, mobile ≤767px. */
export function visualCss(nodes: VisualNode[]): string {
  const rules: string[] = [];
  const walk = (list: VisualNode[]) => {
    for (const node of list) {
      const base = decl(resolvedCss(node, "desktop"));
      if (base) rules.push(`[data-vn="${node.id}"]{${base}}`);
      const tablet = decl(diffCss(node, "tablet"));
      if (tablet) rules.push(`@media (max-width:1024px){[data-vn="${node.id}"]{${tablet}}}`);
      const mobile = decl(diffCss(node, "mobile"));
      if (mobile) rules.push(`@media (max-width:767px){[data-vn="${node.id}"]{${mobile}}}`);
      const visibility = visibilityRules(node);
      if (visibility) rules.push(visibility);
      if (node.children) walk(node.children);
    }
  };
  walk(nodes);
  return rules.join("");
}

export type VisualIssue = { path: (string | number)[]; message: string };

function numberIn(value: unknown, min: number, max: number): number | null {
  return typeof value === "number" && Number.isFinite(value) && value >= min && value <= max ? value : null;
}

function readBox(value: unknown): Box | null {
  if (!value || typeof value !== "object") return null;
  const box = value as Record<string, unknown>;
  const top = numberIn(box.top, -400, 400);
  const right = numberIn(box.right, -400, 400);
  const bottom = numberIn(box.bottom, -400, 400);
  const left = numberIn(box.left, -400, 400);
  if (top === null || right === null || bottom === null || left === null) return null;
  return { top, right, bottom, left };
}

function readResponsive<T>(value: unknown, read: (item: unknown) => T | null): Responsive<T> | undefined {
  if (!value || typeof value !== "object") return undefined;
  const source = value as Record<string, unknown>;
  const out: Responsive<T> = {};
  for (const device of ["desktop", "tablet", "mobile"] as const) {
    if (source[device] === undefined) continue;
    const parsed = read(source[device]);
    if (!parsed) return undefined;
    out[device] = parsed;
  }
  return out;
}

function readStyle(value: unknown): { style: VisualStyle } | { error: string } {
  if (value === undefined) return { style: {} };
  if (!value || typeof value !== "object" || Array.isArray(value)) return { error: "Gaya tidak sah" };
  const source = value as Record<string, unknown>;
  const style: VisualStyle = {};
  if (source.color !== undefined) {
    if (typeof source.color !== "string" || !HEX.test(source.color)) return { error: "Warna teks tidak sah" };
    style.color = source.color;
  }
  if (source.background !== undefined) {
    if (typeof source.background !== "string" || !HEX.test(source.background)) return { error: "Warna latar tidak sah" };
    style.background = source.background;
  }
  if (source.fontFamily !== undefined) {
    if (source.fontFamily !== "inherit" && source.fontFamily !== "sans" && source.fontFamily !== "serif") return { error: "Font tidak sah" };
    style.fontFamily = source.fontFamily;
  }
  if (source.fontWeight !== undefined) {
    if (source.fontWeight !== "400" && source.fontWeight !== "600" && source.fontWeight !== "700" && source.fontWeight !== "800") return { error: "Ketebalan huruf tidak sah" };
    style.fontWeight = source.fontWeight;
  }
  if (source.borderColor !== undefined) {
    if (typeof source.borderColor !== "string" || !HEX.test(source.borderColor)) return { error: "Warna garis tidak sah" };
    style.borderColor = source.borderColor;
  }
  const borderWidth = source.borderWidth === undefined ? undefined : numberIn(source.borderWidth, 0, 20);
  if (source.borderWidth !== undefined && borderWidth === null) return { error: "Tebal garis tidak sah" };
  if (borderWidth !== undefined && borderWidth !== null) style.borderWidth = borderWidth;
  const radius = source.borderRadius === undefined ? undefined : numberIn(source.borderRadius, 0, 80);
  if (source.borderRadius !== undefined && radius === null) return { error: "Lengkung sudut tidak sah" };
  if (radius !== undefined && radius !== null) style.borderRadius = radius;
  if (source.className !== undefined) {
    if (typeof source.className !== "string" || (source.className !== "" && !CLASS_NAME.test(source.className))) return { error: "Kelas CSS tidak sah" };
    if (source.className) style.className = source.className;
  }
  if (source.hidden !== undefined) {
    if (!source.hidden || typeof source.hidden !== "object" || Array.isArray(source.hidden)) return { error: "Tampilan perangkat tidak sah" };
    const flags = source.hidden as Record<string, unknown>;
    const hidden: NonNullable<VisualStyle["hidden"]> = {};
    for (const device of ["desktop", "tablet", "mobile"] as const) {
      if (flags[device] === undefined) continue;
      if (flags[device] !== true) return { error: "Tampilan perangkat tidak sah" };
      hidden[device] = true;
    }
    if (Object.keys(hidden).length) style.hidden = hidden;
  }
  const fontSize = source.fontSize === undefined ? undefined : readResponsive(source.fontSize, (item) => numberIn(item, 8, 120));
  if (source.fontSize !== undefined && !fontSize) return { error: "Ukuran huruf tidak sah" };
  if (fontSize) style.fontSize = fontSize;
  const textAlign = source.textAlign === undefined ? undefined : readResponsive(source.textAlign, (item) => (item === "left" || item === "center" || item === "right" ? item : null));
  if (source.textAlign !== undefined && !textAlign) return { error: "Perataan teks tidak sah" };
  if (textAlign) style.textAlign = textAlign;
  const width = source.width === undefined ? undefined : readResponsive(source.width, (item) => (typeof item === "string" && SIZE.test(item) ? item : null));
  if (source.width !== undefined && !width) return { error: "Lebar tidak sah" };
  if (width) style.width = width;
  const height = source.height === undefined ? undefined : readResponsive(source.height, (item) => (typeof item === "string" && SIZE.test(item) ? item : null));
  if (source.height !== undefined && !height) return { error: "Tinggi tidak sah" };
  if (height) style.height = height;
  const minHeight = source.minHeight === undefined ? undefined : readResponsive(source.minHeight, (item) => numberIn(item, 0, 1200));
  if (source.minHeight !== undefined && !minHeight) return { error: "Tinggi minimum tidak sah" };
  if (minHeight) style.minHeight = minHeight;
  const padding = source.padding === undefined ? undefined : readResponsive(source.padding, readBox);
  if (source.padding !== undefined && !padding) return { error: "Padding tidak sah" };
  if (padding) style.padding = padding;
  const margin = source.margin === undefined ? undefined : readResponsive(source.margin, readBox);
  if (source.margin !== undefined && !margin) return { error: "Margin tidak sah" };
  if (margin) style.margin = margin;
  const direction = source.direction === undefined ? undefined : readResponsive(source.direction, (item) => (item === "row" || item === "column" ? item : null));
  if (source.direction !== undefined && !direction) return { error: "Arah kontainer tidak sah" };
  if (direction) style.direction = direction;
  const flexPos = (item: unknown) => (item === "start" || item === "center" || item === "end" || item === "between" || item === "stretch" ? item : null);
  const justify = source.justify === undefined ? undefined : readResponsive(source.justify, flexPos);
  if (source.justify !== undefined && !justify) return { error: "Perataan utama tidak sah" };
  if (justify) style.justify = justify;
  const align = source.align === undefined ? undefined : readResponsive(source.align, flexPos);
  if (source.align !== undefined && !align) return { error: "Perataan silang tidak sah" };
  if (align) style.align = align;
  const gap = source.gap === undefined ? undefined : readResponsive(source.gap, (item) => numberIn(item, 0, 200));
  if (source.gap !== undefined && !gap) return { error: "Jarak antar elemen tidak sah" };
  if (gap) style.gap = gap;
  return { style };
}

function readMedia(value: unknown): MediaNode | null {
  if (!value || typeof value !== "object") return null;
  const media = value as Record<string, unknown>;
  const width = numberIn(media.width, 0, 8000);
  const height = numberIn(media.height, 0, 8000);
  if (typeof media.src !== "string" || media.src.length > 1000 || width === null || height === null) return null;
  if (typeof media.alt !== "string" || media.alt.length > 300) return null;
  if (media.src && !/^(https:\/\/|\/)/.test(media.src)) return null;
  return { src: media.src, width, height, alt: media.alt };
}

function readContent(type: VisualType, value: unknown): { content: VisualContent[VisualType] } | { error: string } {
  const source = value && typeof value === "object" && !Array.isArray(value) ? (value as Record<string, unknown>) : {};
  switch (type) {
    case "container":
    case "divider":
    case "spacer":
      return { content: {} };
    case "heading": {
      const text = typeof source.text === "string" ? source.text.slice(0, 300) : "Judul";
      const level = source.level === "h1" || source.level === "h2" || source.level === "h3" || source.level === "h4" ? source.level : "h2";
      return { content: { text, level } };
    }
    case "text":
    case "html": {
      if (typeof source.html !== "string" || source.html.length > 20_000) return { error: "Isi teks terlalu panjang" };
      return { content: { html: source.html } };
    }
    case "code": {
      const css = typeof source.css === "string" ? source.css : "";
      const javascript = typeof source.javascript === "string" ? source.javascript : "";
      if (css.length > 20_000) return { error: "CSS terlalu panjang" };
      if (javascript.length > 20_000) return { error: "JavaScript terlalu panjang" };
      return { content: { css, javascript } };
    }
    case "image": {
      const media = readMedia(source);
      if (!media) return { error: "Gambar tidak sah" };
      return { content: media };
    }
    case "button": {
      const label = typeof source.label === "string" ? source.label.slice(0, 120) : "Tombol";
      if (typeof source.href !== "string" || source.href.length < 1 || source.href.length > 2000) return { error: "Tautan tombol wajib diisi" };
      return { content: { label, href: source.href } };
    }
    case "video": {
      if (typeof source.url !== "string" || source.url.length > 500) return { error: "URL video tidak sah" };
      if (source.url && !/^https:\/\//.test(source.url)) return { error: "URL video harus diawali https://" };
      return { content: { url: source.url } };
    }
    case "gallery": {
      const columns = source.columns === 2 || source.columns === 4 ? source.columns : 3;
      if (!Array.isArray(source.images) || source.images.length > 12) return { error: "Galeri paling banyak 12 gambar" };
      const images: MediaNode[] = [];
      for (const image of source.images) {
        const media = readMedia(image);
        if (!media || !media.src) return { error: "Gambar galeri tidak sah" };
        images.push(media);
      }
      return { content: { columns, images } };
    }
    case "icon": {
      const name = ICON_NAMES.find((item) => item === source.name) ?? "heart";
      return { content: { name } };
    }
  }
}

export function parseVisualNodes(raw: unknown): { nodes: VisualNode[]; issues: VisualIssue[] } {
  const issues: VisualIssue[] = [];
  const nodes: VisualNode[] = [];
  let count = 0;
  if (!Array.isArray(raw)) return { nodes, issues: [{ path: [], message: "Daftar elemen harus berupa larik" }] };

  const walk = (list: unknown[], depth: number, path: (string | number)[]): VisualNode[] => {
    const parsed: VisualNode[] = [];
    list.forEach((item, index) => {
      const here = [...path, index];
      count += 1;
      if (count > MAX_NODES) {
        issues.push({ path: here, message: `Paling banyak ${MAX_NODES} elemen` });
        return;
      }
      if (!item || typeof item !== "object") {
        issues.push({ path: here, message: "Elemen tidak sah" });
        return;
      }
      const source = item as Record<string, unknown>;
      if (typeof source.id !== "string" || source.id.length < 1 || source.id.length > 64) issues.push({ path: [...here, "id"], message: "ID elemen tidak sah" });
      if (typeof source.type !== "string" || !VISUAL_TYPES.includes(source.type as VisualType)) {
        issues.push({ path: [...here, "type"], message: "Jenis elemen tidak dikenal" });
        return;
      }
      const type = source.type as VisualType;
      if (depth > MAX_DEPTH) issues.push({ path: here, message: "Kontainer bersarang terlalu dalam" });
      const content = readContent(type, source.content);
      if ("error" in content) issues.push({ path: [...here, "content"], message: content.error });
      const style = readStyle(source.style);
      if ("error" in style) issues.push({ path: [...here, "style"], message: style.error });
      let children: VisualNode[] | undefined;
      if (type === "container") {
        if (source.children !== undefined && !Array.isArray(source.children)) issues.push({ path: [...here, "children"], message: "Isi kontainer tidak sah" });
        children = walk(Array.isArray(source.children) ? source.children : [], depth + 1, [...here, "children"]);
      } else if (source.children !== undefined) {
        issues.push({ path: [...here, "children"], message: "Hanya kontainer yang boleh berisi elemen lain" });
      }
      if ("error" in content || "error" in style || typeof source.id !== "string") return;
      parsed.push({ id: source.id, type, content: content.content, style: style.style, ...(children ? { children } : {}) } as VisualNode);
    });
    return parsed;
  };

  nodes.push(...walk(raw, 1, []));
  const ids = new Set<string>();
  const dup = (list: VisualNode[]) => {
    for (const node of list) {
      if (ids.has(node.id)) issues.push({ path: ["id"], message: "Ada elemen dengan ID ganda" });
      ids.add(node.id);
      if (node.children) dup(node.children);
    }
  };
  dup(nodes);
  return { nodes: issues.length ? [] : nodes, issues };
}

export function isVisualPage(sections: readonly { type: string }[]): boolean {
  return sections.length > 0 && sections.every((section) => section.type === "visual");
}
