/**
 * Aturan unggah Pustaka Media — dipakai klien (validasi sebelum unggah) dan server
 * (route /api/media/upload menerbitkan token hanya untuk tipe & ukuran ini).
 * SVG sengaja tidak diizinkan: bisa memuat skrip.
 */
export type MediaKind = "image" | "pdf" | "video";

const MB = 1024 * 1024;

export const UPLOAD_TYPES: Readonly<Record<string, { kind: MediaKind; extensions: readonly string[] }>> = {
  "image/jpeg": { kind: "image", extensions: ["jpg", "jpeg"] },
  "image/png": { kind: "image", extensions: ["png"] },
  "image/webp": { kind: "image", extensions: ["webp"] },
  "image/avif": { kind: "image", extensions: ["avif"] },
  "image/gif": { kind: "image", extensions: ["gif"] },
  "application/pdf": { kind: "pdf", extensions: ["pdf"] },
  "video/mp4": { kind: "video", extensions: ["mp4"] },
  "video/webm": { kind: "video", extensions: ["webm"] },
};

export const UPLOAD_MAX_BYTES: Readonly<Record<MediaKind, number>> = { image: 15 * MB, pdf: 30 * MB, video: 100 * MB };

export const UPLOAD_ACCEPT = Object.keys(UPLOAD_TYPES).join(",");
export const UPLOAD_HINT = "JPG, PNG, WebP, AVIF, GIF ≤ 15 MB · PDF ≤ 30 MB · MP4/WebM ≤ 100 MB";

export function mediaKindOf(mime: string): MediaKind | "other" {
  if (mime.startsWith("image/")) return "image";
  if (mime === "application/pdf") return "pdf";
  if (mime.startsWith("video/")) return "video";
  return "other";
}

/** Pesan kesalahan bila file tidak boleh diunggah; null bila boleh. */
export function uploadProblem(file: { type: string; size: number; name: string }): string | null {
  const rule = UPLOAD_TYPES[file.type];
  if (!rule) return "Tipe file tidak didukung.";
  const max = UPLOAD_MAX_BYTES[rule.kind];
  if (file.size > max) return `Ukuran melebihi batas ${Math.round(max / MB)} MB.`;
  if (file.size === 0) return "File kosong.";
  return null;
}

/** Nama file aman untuk URL (huruf kecil, tanpa spasi/karakter khusus) dengan ekstensi sesuai tipe. */
export function uploadFileName(name: string, mime: string): string {
  const rule = UPLOAD_TYPES[mime];
  const dot = name.lastIndexOf(".");
  const rawExt = dot > 0 ? name.slice(dot + 1).toLowerCase() : "";
  const ext = rule?.extensions.includes(rawExt) ? rawExt : (rule?.extensions[0] ?? "bin");
  const base = (dot > 0 ? name.slice(0, dot) : name)
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
  return `${base || "file"}.${ext}`;
}

/** Folder unggahan bulan ini (WIB): media/YYYY/MM. */
export function uploadFolder(now: Date = new Date()): string {
  const wib = new Date(now.getTime() + 7 * 60 * 60 * 1000);
  return `media/${wib.getUTCFullYear()}/${String(wib.getUTCMonth() + 1).padStart(2, "0")}`;
}

/** Pathname yang sah untuk unggahan baru: media/YYYY/MM/nama.ext (ekstensi sesuai tipe). */
export function isValidUploadPath(pathname: string, mime: string): boolean {
  const m = pathname.match(/^media\/\d{4}\/\d{2}\/[a-z0-9]+(?:-[a-z0-9]+)*\.([a-z0-9]+)$/);
  return Boolean(m && UPLOAD_TYPES[mime]?.extensions.includes(m[1] ?? ""));
}

export function formatBytes(bytes: number | null): string {
  if (bytes === null) return "—";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < MB) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / MB).toLocaleString("id-ID", { maximumFractionDigits: 1 })} MB`;
}
