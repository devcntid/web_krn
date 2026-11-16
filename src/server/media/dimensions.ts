import "server-only";

export type Dimensions = { width: number; height: number };

const ascii = (b: Uint8Array, start: number, length: number) => String.fromCharCode(...b.subarray(start, start + length));
const u16be = (b: Uint8Array, o: number) => ((b[o] ?? 0) << 8) | (b[o + 1] ?? 0);
const u16le = (b: Uint8Array, o: number) => (b[o] ?? 0) | ((b[o + 1] ?? 0) << 8);
const u24le = (b: Uint8Array, o: number) => (b[o] ?? 0) | ((b[o + 1] ?? 0) << 8) | ((b[o + 2] ?? 0) << 16);
const u32be = (b: Uint8Array, o: number) => (((b[o] ?? 0) << 24) | ((b[o + 1] ?? 0) << 16) | ((b[o + 2] ?? 0) << 8) | (b[o + 3] ?? 0)) >>> 0;

/**
 * Dimensi gambar dari byte awal file (PNG, GIF, JPEG, WebP, AVIF) tanpa pustaka tambahan.
 * Mengembalikan null bila format tidak dikenali atau header belum lengkap.
 */
export function readImageDimensions(bytes: Uint8Array): Dimensions | null {
  const b = bytes;
  if (b.length < 24) return null;
  const ok = (d: Dimensions) => (d.width > 0 && d.height > 0 && d.width < 65536 && d.height < 65536 ? d : null);

  // PNG: tanda tangan 8 byte, lalu chunk IHDR (lebar & tinggi u32 BE)
  if (b[0] === 0x89 && ascii(b, 1, 3) === "PNG") return ok({ width: u32be(b, 16), height: u32be(b, 20) });

  // GIF: "GIF87a"/"GIF89a", lalu lebar & tinggi u16 LE
  if (ascii(b, 0, 3) === "GIF") return ok({ width: u16le(b, 6), height: u16le(b, 8) });

  // WebP: RIFF….WEBP + chunk VP8 / VP8L / VP8X
  if (ascii(b, 0, 4) === "RIFF" && ascii(b, 8, 4) === "WEBP" && b.length >= 30) {
    const chunk = ascii(b, 12, 4);
    if (chunk === "VP8X") return ok({ width: u24le(b, 24) + 1, height: u24le(b, 27) + 1 });
    if (chunk === "VP8L") {
      const bits = (b[21] ?? 0) | ((b[22] ?? 0) << 8) | ((b[23] ?? 0) << 16) | ((b[24] ?? 0) << 24);
      return ok({ width: (bits & 0x3fff) + 1, height: ((bits >> 14) & 0x3fff) + 1 });
    }
    if (chunk === "VP8 ") return ok({ width: u16le(b, 26) & 0x3fff, height: u16le(b, 28) & 0x3fff });
    return null;
  }

  // JPEG: telusuri segmen sampai penanda SOF (C0–CF kecuali C4, C8, CC)
  if (b[0] === 0xff && b[1] === 0xd8) {
    let o = 2;
    while (o + 9 < b.length) {
      if (b[o] !== 0xff) {
        o++;
        continue;
      }
      const marker = b[o + 1] ?? 0;
      if (marker === 0xff) {
        o++;
        continue;
      }
      if (marker >= 0xc0 && marker <= 0xcf && marker !== 0xc4 && marker !== 0xc8 && marker !== 0xcc) {
        return ok({ width: u16be(b, o + 7), height: u16be(b, o + 5) });
      }
      if (marker === 0xd8 || (marker >= 0xd0 && marker <= 0xd7) || marker === 0x01) {
        o += 2;
        continue;
      }
      o += 2 + u16be(b, o + 2);
    }
    return null;
  }

  // AVIF/HEIF: kotak "ispe" (image spatial extents) di dalam meta
  if (ascii(b, 4, 4) === "ftyp") {
    for (let o = 12; o + 16 < b.length; o++) {
      if (b[o] === 0x69 && b[o + 1] === 0x73 && b[o + 2] === 0x70 && b[o + 3] === 0x65) {
        return ok({ width: u32be(b, o + 8), height: u32be(b, o + 12) });
      }
    }
  }
  return null;
}

/** Ambil byte awal sebuah URL (Range) lalu baca dimensinya; null bila gagal. */
export async function fetchImageDimensions(url: string, maxBytes = 512 * 1024): Promise<Dimensions | null> {
  try {
    const res = await fetch(url, { headers: { Range: `bytes=0-${maxBytes - 1}` }, cache: "no-store" });
    if (!res.ok || !res.body) return null;
    // Server yang mengabaikan Range mengirim seluruh file — baca secukupnya saja.
    const reader = res.body.getReader();
    const chunks: Uint8Array[] = [];
    let total = 0;
    while (total < maxBytes) {
      const { done, value } = await reader.read();
      if (done || !value) break;
      chunks.push(value);
      total += value.length;
    }
    void reader.cancel().catch(() => undefined);
    const bytes = new Uint8Array(Math.min(total, maxBytes));
    let offset = 0;
    for (const c of chunks) {
      const part = c.subarray(0, bytes.length - offset);
      bytes.set(part, offset);
      offset += part.length;
      if (offset >= bytes.length) break;
    }
    return readImageDimensions(bytes);
  } catch {
    return null;
  }
}
