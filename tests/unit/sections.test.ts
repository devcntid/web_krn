import { describe, expect, it } from "vitest";

import { SECTION_TYPES, localizedData, parseSections } from "@/server/sections";

describe("sections (Zod)", () => {
  it("menerima section sah dan mengisi nilai bawaan", () => {
    const { sections, issues } = parseSections([{ id: "a", type: "hero", data: {} }]);
    expect(issues).toEqual([]);
    expect(sections[0]).toMatchObject({ id: "a", type: "hero", visible: true, data: { title: "", size: "page", overlay: 0.4, image: null } });
  });

  it("tipe tak dikenal dilaporkan dan tidak ikut", () => {
    const { sections, issues } = parseSections([{ id: "a", type: "tidak-ada", data: {} }]);
    expect(sections).toEqual([]);
    expect(issues[0]).toMatchObject({ index: 0, path: "type" });
  });

  it("data tidak sah dilaporkan per jalur", () => {
    const { sections, issues } = parseSections([{ id: "a", type: "text-tagline", data: { heading: "" } }]);
    expect(sections).toEqual([]);
    expect(issues.map((i) => i.path).sort()).toEqual(["body", "heading"]);
  });

  it("nilai di luar rentang ditolak (overlay hero ≤ 0.9)", () => {
    expect(parseSections([{ id: "a", type: "hero", data: { overlay: 2 } }]).issues[0]?.path).toBe("overlay");
  });

  it("section lama tanpa id diberi id stabil", () => {
    expect(parseSections([{ type: "hero", data: {} }]).sections[0]?.id).toBe("s1");
  });

  it("terjemahan Inggris tidak sah dilaporkan dengan locale en, versi Indonesia tetap", () => {
    const { sections, issues } = parseSections([{ id: "a", type: "text-tagline", data: { heading: "H", body: "B" }, en: { heading: "" } }]);
    expect(sections).toHaveLength(1);
    expect(issues.every((i) => i.locale === "en")).toBe(true);
  });

  it("localizedData jatuh ke Indonesia bila belum diterjemahkan", () => {
    const { sections } = parseSections([{ id: "a", type: "text-tagline", data: { heading: "Halo", body: "B" } }]);
    expect(localizedData(sections[0]!, "en")).toMatchObject({ heading: "Halo" });
  });

  it("bukan array → kosong", () => {
    expect(parseSections("x")).toEqual({ sections: [], issues: [] });
  });

  it("26 tipe section terdaftar", () => {
    expect(SECTION_TYPES.length).toBe(26);
  });
});
