import { describe, expect, it } from "vitest";

import { type Ability, type Role, ROLE_ABILITIES, can, requiresTotp } from "@/server/roles";

/** Matriks "Peran & hak akses" di docs/BUILD_PLAYBOOK.md. */
const EXPECTED: Record<Ability, Role[]> = {
  "draft.write": ["super_admin", "editor", "penulis", "kontributor"],
  "content.publish": ["super_admin", "editor", "penulis"],
  "content.review": ["super_admin", "editor"],
  "pages.manage": ["super_admin", "editor"],
  "media.manage": ["super_admin", "editor", "penulis"],
  "compliance.manage": ["super_admin", "editor"],
  "seo.manage": ["super_admin", "editor"],
  "system.manage": ["super_admin"],
};
const ROLES = Object.keys(ROLE_ABILITIES) as Role[];

describe("permissions", () => {
  for (const [ability, allowed] of Object.entries(EXPECTED) as [Ability, Role[]][]) {
    it(`${ability}: hanya ${allowed.join(", ")}`, () => {
      for (const role of ROLES) expect(can({ role }, ability), `${role} → ${ability}`).toBe(allowed.includes(role));
    });
  }

  it("tanpa pengguna tidak punya kemampuan apa pun", () => {
    expect(can(null, "draft.write")).toBe(false);
    expect(can(undefined, "draft.write")).toBe(false);
  });

  it("viewer tidak punya kemampuan", () => {
    expect(ROLE_ABILITIES.viewer).toEqual([]);
  });

  it("2FA wajib hanya untuk Super Admin & Editor", () => {
    expect(ROLES.filter(requiresTotp).sort()).toEqual(["editor", "super_admin"]);
  });
});
