/**
 * Merapikan HTML halaman WordPress hasil ekspor untuk GenericPageTemplate.
 * HTML sudah disanitasi & dinormalkan saat ekspor (scripts/export-wp.ts), jadi
 * pola di bawah aman dicocokkan dengan regex. Teks konten tidak diubah.
 */
export function prepareLegacyHtml(html: string, pageTitle: string): string {
  const plain = (s: string) => s.replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim().toLowerCase();
  let out = html.trim();

  // 1) Judul/paragraf pembuka yang sama dengan judul halaman (sudah menjadi H1 di hero).
  const lead = out.match(/^<(h[2-4]|p)[^>]*>([\s\S]*?)<\/\1>/);
  if (lead && plain(lead[2]) === plain(pageTitle)) out = out.slice(lead[0].length);

  // 2) iframe tanpa src (sumbernya tidak lolos whitelist ekspor) → hanya kotak kosong.
  out = out.replace(/<iframe(?![^>]*\ssrc=)[^>]*>\s*<\/iframe>/g, "");

  // 3) Deretan gambar berurutan (kolom Divi yang diratakan) → grid galeri.
  out = out.replace(/(?:<img\b[^>]*>\s*){2,}/g, (run) => `<div class="wp-gallery">${run.trim()}</div>\n`);

  // 4) Sisa modul blog Divi yang tidak punya tujuan di situs ini: tautan arsip penulis
  //    (/author/…) dijadikan teks biasa; tautan pagination (/…/page/N/) dibuang.
  out = out.replace(/<a\b[^>]*href="\/author\/[^"]*"[^>]*>([\s\S]*?)<\/a>/g, "$1");
  out = out.replace(/<a\b[^>]*href="\/[^"]*\/page\/\d+\/[^"]*"[^>]*>[\s\S]*?<\/a>\s*/g, "");

  return out.trim();
}
