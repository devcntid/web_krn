import { describe, expect, it } from "vitest";

import { htmlClipboardToText, paragraphsToHtml, plainLines, shouldStripHtmlPaste, splitStoredParagraphs } from "@/lib/rich-text";

describe("paragraf editor beranda", () => {
  it("teks polos bolak-balik tanpa menambah tag", () => {
    const source = ["Dalam setiap isu kemanusiaan, selalu ada hati yang tergerak untuk peduli.", "Kalimat kedua & ketiga."];
    expect(splitStoredParagraphs(paragraphsToHtml(source))).toEqual(source);
  });

  it("menyimpan tebal sebagai HTML", () => {
    expect(splitStoredParagraphs("<p>Ada <strong>tebal</strong></p>")).toEqual(["<p>Ada <strong>tebal</strong></p>"]);
  });

  it("daftar tidak dipecah menjadi paragraf kosong", () => {
    const html = "<p>Pengantar</p><ul><li>Satu</li></ul>";
    expect(splitStoredParagraphs(html)).toEqual([html]);
  });
});

describe("tempelan Word", () => {
  const word = `<html xmlns:o="urn:schemas-microsoft-com:office:office"><head><style>p.MsoNormal{font-family:Calibri}</style></head><body><p class="MsoNormal"><b><span style="font-size:14pt;color:red">Judul</span></b></p><p class="MsoNormal">Paragraf <i>miring</i>.</p></body></html>`;

  it("mengenali HTML luar dan membiarkan salinan dari editor", () => {
    expect(shouldStripHtmlPaste(word)).toBe(true);
    expect(shouldStripHtmlPaste('<p data-pm-slice="1 1 []">tebal</p>')).toBe(false);
    expect(shouldStripHtmlPaste("")).toBe(false);
  });

  it("membuang tag Word menjadi baris polos", () => {
    expect(plainLines(htmlClipboardToText(word))).toEqual(["Judul", "Paragraf miring."]);
  });

  it("menyatukan baris kosong dari Word", () => {
    expect(plainLines("Satu\r\n\r\n\r\nDua \n")).toEqual(["Satu", "Dua"]);
  });
});
