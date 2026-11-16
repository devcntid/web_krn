"use client";

import { LogOut, Menu, X } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";

import type { ShellNavGroup, ShellUser } from "./nav";
import { ToastProvider } from "./Toast";

type Props = {
  nav: ShellNavGroup[];
  user: ShellUser;
  logoutAction: () => Promise<void>;
  children: React.ReactNode;
};

const DRAWER_ID = "admin-sidebar";
const DESKTOP = "(min-width: 1024px)";

function isActive(pathname: string, href: string): boolean {
  const norm = (p: string) => (p.endsWith("/") ? p : `${p}/`);
  if (href === "/admin/") return norm(pathname) === "/admin/";
  return norm(pathname).startsWith(norm(href));
}

function initials(name: string): string {
  const parts = name
    .replace(/@.*/, "")
    .split(/[\s._-]+/)
    .filter(Boolean);
  return ((parts[0]?.[0] ?? "") + (parts[1]?.[0] ?? "")).toUpperCase() || "?";
}

/**
 * Kerangka admin: sidebar tetap di ≥1024px, drawer modal di bawahnya
 * (fokus masuk ke drawer, Esc menutup, konten lain `inert`, scroll body dikunci, tutup saat navigasi).
 */
export function AdminShell({ nav, user, logoutAction, children }: Props) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const toggleRef = useRef<HTMLButtonElement>(null);
  const drawerRef = useRef<HTMLElement>(null);

  const close = useCallback(() => setOpen(false), []);

  // Tutup saat navigasi (pathname berubah).
  const [lastPath, setLastPath] = useState(pathname);
  if (lastPath !== pathname) {
    setLastPath(pathname);
    setOpen(false);
  }

  useEffect(() => {
    if (!open) return;
    const mq = window.matchMedia(DESKTOP);
    const toggle = toggleRef.current;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    drawerRef.current?.querySelector<HTMLElement>("a, button")?.focus();

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        close();
        return;
      }
      if (e.key !== "Tab" || !drawerRef.current) return;
      // Jebakan fokus di dalam drawer.
      const nodes = drawerRef.current.querySelectorAll<HTMLElement>(
        "a[href], button:not([disabled])",
      );
      const first = nodes[0];
      const last = nodes[nodes.length - 1];
      if (!first || !last) return;
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };
    const onMq = () => mq.matches && setOpen(false);
    document.addEventListener("keydown", onKey);
    mq.addEventListener("change", onMq);
    return () => {
      document.body.style.overflow = prevOverflow;
      // Kembalikan fokus ke tombol menu setelah konten tidak lagi `inert`.
      requestAnimationFrame(() => toggle?.focus());
      document.removeEventListener("keydown", onKey);
      mq.removeEventListener("change", onMq);
    };
  }, [open, close]);

  return (
    <ToastProvider>
      <div className="min-h-screen lg:flex">
        <a
          href="#admin-main"
          className="sr-only z-50 rounded-admin bg-white px-4 py-3 font-bold text-admin-ink focus:not-sr-only focus:fixed focus:top-2 focus:left-2"
        >
          Lewati ke konten
        </a>

        {open && (
          <div
            aria-hidden="true"
            className="fixed inset-0 z-40 bg-admin-ink/50 lg:hidden"
            onClick={close}
          />
        )}

        <aside
          id={DRAWER_ID}
          ref={drawerRef}
          aria-label="Menu admin"
          {...(open ? { role: "dialog", "aria-modal": true } : {})}
          className={`fixed inset-y-0 left-0 z-50 flex w-66 max-w-[85vw] flex-col overflow-y-auto bg-admin-sidebar px-3.5 py-5 text-admin-sidebar-text transition-transform duration-200 motion-reduce:transition-none lg:sticky lg:top-0 lg:z-auto lg:h-screen lg:max-w-none lg:shrink-0 lg:translate-x-0 lg:visible ${
            open ? "translate-x-0" : "invisible -translate-x-full"
          }`}
        >
          <div className="flex items-center gap-2.5 px-2 pt-1.5 pb-5">
            <span
              aria-hidden="true"
              className="flex size-8.5 items-center justify-center rounded-lg bg-primary text-[13px] font-extrabold text-white"
            >
              RN
            </span>
            <span className="flex-1">
              <span className="block text-[15px] font-extrabold text-white">
                Relawan Nusantara
              </span>
              <span className="block text-xs text-admin-sidebar-muted">
                Admin CMS
              </span>
            </span>
            <button
              type="button"
              onClick={close}
              aria-label="Tutup menu"
              className="flex size-11 items-center justify-center rounded-lg text-white hover:bg-admin-sidebar-raised focus-visible:outline-2 focus-visible:outline-accent lg:hidden"
            >
              <X aria-hidden="true" size={20} />
            </button>
          </div>

          <nav aria-label="Navigasi admin" className="flex flex-col gap-0.5">
            {nav.map((group) => (
              <div key={group.label}>
                <p className="mx-2.5 mt-3.5 mb-1.5 text-[11px] font-bold tracking-widest text-admin-sidebar-label uppercase">
                  {group.label}
                </p>
                <ul className="flex flex-col gap-0.5">
                  {group.items.map((it) => {
                    const active = isActive(pathname, it.href);
                    return (
                      <li key={it.key}>
                        <Link
                          href={it.href}
                          aria-current={active ? "page" : undefined}
                          className={`flex min-h-11 items-center gap-3 rounded-lg px-3 text-sm font-semibold focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-accent ${
                            active
                              ? "bg-primary text-white"
                              : "text-admin-sidebar-text hover:bg-white/5 hover:text-white"
                          }`}
                        >
                          <span
                            aria-hidden="true"
                            className={`size-2 rounded-xs ${active ? "bg-accent" : "bg-admin-sidebar-dot"}`}
                          />
                          <span className="flex-1">{it.label}</span>
                          {it.badge ? (
                            <span className="rounded-full bg-accent px-2 py-0.5 text-[11px] font-extrabold text-ink">
                              {it.badge}
                              <span className="sr-only"> menunggu review</span>
                            </span>
                          ) : null}
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </div>
            ))}
          </nav>

          <div className="mt-auto flex items-center gap-2.5 border-t border-white/10 px-2.5 pt-3.5">
            <span
              aria-hidden="true"
              className="flex size-9 shrink-0 items-center justify-center rounded-full bg-admin-sidebar-raised text-[13px] font-bold text-white"
            >
              {initials(user.name)}
            </span>
            <span className="min-w-0 flex-1">
              <span
                className="block truncate text-[13px] font-bold text-white"
                title={user.email}
              >
                {user.name}
              </span>
              <span className="block text-xs text-admin-sidebar-muted">
                {user.roleLabel}
              </span>
            </span>
            <form action={logoutAction}>
              <button
                type="submit"
                aria-label="Keluar"
                title="Keluar"
                className="flex size-11 items-center justify-center rounded-lg text-admin-sidebar-text hover:bg-admin-sidebar-raised hover:text-white focus-visible:outline-2 focus-visible:outline-accent"
              >
                <LogOut aria-hidden="true" size={18} />
              </button>
            </form>
          </div>
        </aside>

        <div inert={open || undefined} className="flex min-w-0 flex-1 flex-col">
          <header className="sticky top-0 z-30 flex min-h-16 items-center gap-3 border-b border-admin-line bg-white px-4 sm:px-6 lg:px-9">
            <button
              ref={toggleRef}
              type="button"
              onClick={() => setOpen(true)}
              aria-expanded={open}
              aria-controls={DRAWER_ID}
              aria-label="Buka menu"
              className="-ml-2 flex size-11 items-center justify-center rounded-lg text-admin-ink hover:bg-admin-canvas focus-visible:outline-2 focus-visible:outline-primary lg:hidden"
            >
              <Menu aria-hidden="true" size={22} />
            </button>
            <span className="font-extrabold lg:hidden">Admin CMS</span>
            <span className="ml-auto flex items-center gap-2">
              <a
                href="/"
                target="_blank"
                rel="noopener"
                className="flex min-h-11 items-center rounded-admin border border-admin-field bg-white px-4 text-sm font-bold text-admin-ink hover:border-primary focus-visible:outline-2 focus-visible:outline-primary"
              >
                Lihat Situs <span aria-hidden="true">&nbsp;↗</span>
                <span className="sr-only"> (tab baru)</span>
              </a>
            </span>
          </header>
          <main
            id="admin-main"
            tabIndex={-1}
            className="flex flex-1 flex-col gap-6 px-4 pt-7 pb-12 outline-none sm:px-6 lg:px-9"
          >
            {children}
          </main>
        </div>
      </div>
    </ToastProvider>
  );
}
