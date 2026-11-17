import { describe, expect, it } from "vitest";

import { slugProblem, slugify } from "@/lib/slug";

describe("slugify", () => {
  it("huruf kecil, tanda hubung, tanpa aksen & tanda baca", () => {
    expect(slugify("Bantuan Air Bersih: Warga Gorontalo!")).toBe("bantuan-air-bersih-warga-gorontalo");
    expect(slugify("Café  Résumé — 2026")).toBe("cafe-resume-2026");
    expect(slugify("  --Halo--  ")).toBe("halo");
  });

  it("dipotong di batas kata", () => {
    const s = slugify("satu dua tiga empat lima enam", 15);
    expect(s.length).toBeLessThanOrEqual(15);
    expect(s).toBe("satu-dua-tiga");
  });

  it("string kosong → kosong", () => {
    expect(slugify("!!!")).toBe("");
  });
});

describe("slugProblem", () => {
  it("menerima slug valid", () => {
    expect(slugProblem("paket-makanan-sudan-2026")).toBeNull();
  });

  it.each([
    ["", "wajib"],
    ["Huruf-Besar", "huruf kecil"],
    ["spasi di", "huruf kecil"],
    ["ganda--strip", "huruf kecil"],
    ["a".repeat(121), "terlalu panjang"],
  ])("menolak %j", (slug, msg) => {
    expect(slugProblem(slug)).toMatch(new RegExp(msg, "i"));
  });

  it.each(["campaign", "campaign-ramadan", "donasi", "program-x", "admin", "api", "en", "wp-admin", "category"])("menolak slug milik route/aplikasi donasi: %s", (slug) => {
    expect(slugProblem(slug)).not.toBeNull();
  });
});
