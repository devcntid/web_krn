"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import type { AdminPageItem } from "@/types/admin-pages";

const BADGE = {
  published: { label: "Terbit", className: "bg-admin-ok-bg text-admin-primary-dark" },
  draft: { label: "Draf", className: "bg-admin-neutral-bg text-admin-neutral-text" },
  redirect: { label: "Redirect", className: "bg-admin-neutral-bg text-admin-neutral-text" },
  system: { label: "Otomatis", className: "bg-admin-info-bg text-admin-info-text" },
} as const;

/** Daftar halaman (hierarki lewat indentasi path) dengan status; halaman aktif disorot. */
export function PageList({ items }: { items: readonly AdminPageItem[] }) {
  const pathname = usePathname();
  return (
    <nav aria-label="Daftar halaman" className="max-h-[75vh] w-full flex-[1_1_300px] overflow-y-auto rounded-xl border border-admin-line bg-white p-2.5 lg:max-w-90">
      <ul>
        {items.map((p) => {
          const href = p.path === "new-beranda" ? "/admin/beranda/" : `/admin/halaman/${p.id}/`;
          const active = pathname.replace(/\/$/, "") === `/admin/halaman/${p.id}`;
          const badge = p.kind === "system" ? BADGE.system : p.redirected ? BADGE.redirect : p.status === "published" ? BADGE.published : BADGE.draft;
          const depth = p.path.split("/").length - 1;
          return (
            <li key={p.id}>
              <Link
                href={href}
                aria-current={active ? "page" : undefined}
                className={`flex min-h-11 items-center justify-between gap-2.5 rounded-admin px-3 py-2 text-admin-ink focus-visible:outline-2 focus-visible:outline-primary ${
                  active ? "bg-admin-ok-bg" : "hover:bg-admin-row-hover"
                }`}
              >
                <span className="min-w-0" style={{ paddingLeft: depth * 16 }}>
                  <span className="block truncate text-sm font-extrabold">{p.path === "new-beranda" ? "Beranda" : p.title || "(tanpa judul)"}</span>
                  <span className="block truncate text-xs text-admin-text">/{p.path === "new-beranda" ? "" : `${p.path}/`}</span>
                </span>
                <span className={`shrink-0 rounded-full px-2 py-0.5 text-[11px] font-extrabold ${badge.className}`}>{badge.label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
