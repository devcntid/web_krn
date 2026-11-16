import type { Ability, Role } from "@/server/roles";

/** Item menu admin. `ability: null` = semua peran yang sudah masuk boleh melihat. */
export type AdminNavItem = {
  key: string;
  label: string;
  href: string;
  ability: Ability | null;
};
export type AdminNavGroup = { label: string; items: readonly AdminNavItem[] };

/**
 * Menu sidebar (artboard "Komponen · Sidebar Admin"). Kemampuan per item mengikuti matriks
 * "Peran & hak akses" di docs/BUILD_PLAYBOOK.md; halaman placeholder memakai kemampuan yang sama.
 */
export const ADMIN_NAV: readonly AdminNavGroup[] = [
  {
    label: "Ringkasan",
    items: [
      { key: "dashboard", label: "Dashboard", href: "/admin/", ability: null },
    ],
  },
  {
    label: "Konten",
    items: [
      {
        key: "publikasi",
        label: "Publikasi",
        href: "/admin/publikasi/",
        ability: null,
      },
      {
        key: "halaman",
        label: "Halaman",
        href: "/admin/halaman/",
        ability: "pages.manage",
      },
      {
        key: "beranda",
        label: "Kelola Beranda",
        href: "/admin/beranda/",
        ability: "pages.manage",
      },
      {
        key: "media",
        label: "Pustaka Media",
        href: "/admin/media/",
        ability: "media.manage",
      },
      {
        key: "taksonomi",
        label: "Kategori & Tag",
        href: "/admin/taksonomi/",
        ability: "content.review",
      },
      {
        key: "laporan",
        label: "e-Report & Audit",
        href: "/admin/laporan/",
        ability: "compliance.manage",
      },
    ],
  },
  {
    label: "Sistem",
    items: [
      {
        key: "seo",
        label: "SEO & Redirect",
        href: "/admin/seo/",
        ability: "seo.manage",
      },
      {
        key: "pengguna",
        label: "Pengguna & Peran",
        href: "/admin/pengguna/",
        ability: "system.manage",
      },
      {
        key: "pengaturan",
        label: "Pengaturan Situs",
        href: "/admin/pengaturan/",
        ability: "system.manage",
      },
      {
        key: "log",
        label: "Log Aktivitas",
        href: "/admin/log/",
        ability: "system.manage",
      },
    ],
  },
];

export const ROLE_LABEL: Readonly<Record<Role, string>> = {
  super_admin: "Super Admin",
  editor: "Editor",
  penulis: "Penulis",
  kontributor: "Kontributor",
  viewer: "Viewer",
};

/** Data serializable yang dikirim ke AdminShell (Client Component). */
export type ShellNavItem = {
  key: string;
  label: string;
  href: string;
  badge?: number;
};
export type ShellNavGroup = { label: string; items: ShellNavItem[] };
export type ShellUser = { name: string; email: string; roleLabel: string };

/** Saring menu per peran (default-deny: item dengan kemampuan yang tidak dimiliki disembunyikan). */
export function navForRole(
  allowed: (ability: Ability) => boolean,
  badges: Readonly<Record<string, number>> = {},
): ShellNavGroup[] {
  return ADMIN_NAV.map((g) => ({
    label: g.label,
    items: g.items
      .filter((it) => it.ability === null || allowed(it.ability))
      .map((it) => ({
        key: it.key,
        label: it.label,
        href: it.href,
        ...(badges[it.key] ? { badge: badges[it.key] } : {}),
      })),
  })).filter((g) => g.items.length > 0);
}
