import { describe, expect, it } from "vitest";

import { autoExcerpt, plainText, sanitizeContentHtml } from "@/server/content/sanitize";

describe("sanitizeContentHtml", () => {
  it("membuang script, handler event, dan javascript:", () => {
    const out = sanitizeContentHtml('<p onclick="x()">Halo<script>alert(1)</script></p><a href="javascript:alert(1)">klik</a><img src="x.png" onerror="alert(1)">');
    expect(out).not.toMatch(/script|onclick|onerror|javascript:/i);
    expect(out).toContain("<p>Halo</p>");
  });

  it("H1 konten diturunkan jadi H2 (satu H1 per halaman)", () => {
    expect(sanitizeContentHtml("<h1>Judul</h1>")).toBe("<h2>Judul</h2>");
  });

  it("tautan domain sendiri jadi relatif; tautan luar diberi target & rel", () => {
    expect(sanitizeContentHtml('<p><a href="https://relawannusantara.org/berita/">x</a></p>')).toBe('<p><a href="/berita/">x</a></p>');
    const ext = sanitizeContentHtml('<p><a href="https://example.org">x</a></p>');
    expect(ext).toContain('target="_blank"');
    expect(ext).toContain('rel="noopener noreferrer"');
  });

  it("iframe hanya dari host yang diizinkan", () => {
    expect(sanitizeContentHtml('<iframe src="https://www.youtube.com/embed/abc"></iframe>')).toContain("youtube.com/embed/abc");
    expect(sanitizeContentHtml('<iframe src="https://evil.example/x"></iframe>')).not.toContain("evil.example");
  });

  it("gambar diberi loading=lazy; paragraf kosong dibuang", () => {
    expect(sanitizeContentHtml('<p></p><img src="/a.png" alt="a">')).toBe('<img src="/a.png" alt="a" loading="lazy" />');
  });

  it("<li><p>…</p></li> dari editor kembali ke <li>…</li>", () => {
    expect(sanitizeContentHtml("<ul><li><p>satu</p></li></ul>")).toBe("<ul><li>satu</li></ul>");
  });
});

describe("plainText & autoExcerpt", () => {
  it("teks polos tanpa tag", () => {
    expect(plainText("<p>Halo&nbsp;<b>dunia</b></p>")).toBe("Halo dunia");
  });
  it("ringkasan dipotong di batas kata dengan elipsis", () => {
    const ex = autoExcerpt(`<p>${"kata ".repeat(60)}</p>`, 50);
    expect(ex.endsWith("…")).toBe(true);
    expect(ex.length).toBeLessThanOrEqual(51);
  });
});
