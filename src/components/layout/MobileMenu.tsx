"use client";

import { useEffect, useId, useRef, useState } from "react";
import { Minus, Plus, Search } from "lucide-react";

import { floatingContact, mainNav } from "@/config/site";
import { localePath } from "@/i18n/config";
import { getDictionary } from "@/i18n/dictionaries";
import { Link, useLocale } from "@/i18n/Link";
import { LanguageToggle } from "@/components/layout/LanguageToggle";

type MobileMenuProps = {
  id: string;
  onClose: () => void;
  /** Elemen <header> pembungkus: batas kunci fokus (bar atas + panel menu). */
  headerRef: React.RefObject<HTMLElement | null>;
};

const FOCUSABLE = 'a[href], button:not([disabled]), input:not([disabled]), [tabindex]:not([tabindex="-1"])';

/**
 * Menu mobile (artboard "M2 · Menu"): kotak cari, accordion per grup (satu grup
 * terbuka sekaligus), dan tautan "Tanya Saffa". Selama terbuka: konten di luar
 * header dibuat inert, gulir halaman dikunci, Tab berputar di dalam header, dan
 * Esc menutup. Komponen ini hanya dirender saat menu terbuka.
 */
export function MobileMenu({ id, onClose, headerRef }: MobileMenuProps) {
  const [openGroup, setOpenGroup] = useState<string | null>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const uid = useId();
  const locale = useLocale();
  const t = getDictionary(locale);

  useEffect(() => {
    const header = headerRef.current;
    if (!header) return;

    // Kunci: semua saudara <header> (main, footer, tombol melayang) tidak bisa difokus/dibaca.
    const siblings = [...(header.parentElement?.children ?? [])].filter(
      (el): el is HTMLElement => el instanceof HTMLElement && el !== header && !["SCRIPT", "STYLE", "LINK"].includes(el.tagName),
    );
    const alreadyInert = siblings.filter((el) => el.inert);
    siblings.forEach((el) => (el.inert = true));
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    panelRef.current?.focus();

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
        return;
      }
      if (e.key !== "Tab") return;
      const items = [...header.querySelectorAll<HTMLElement>(FOCUSABLE)].filter((el) => el.offsetParent !== null);
      if (!items.length) return;
      const first = items[0];
      const last = items[items.length - 1];
      const active = document.activeElement;
      if (e.shiftKey && (active === first || active === panelRef.current)) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && active === last) {
        e.preventDefault();
        first.focus();
      }
    };
    document.addEventListener("keydown", onKey);

    // Bila layar melebar ke tampilan desktop, menu mobile ditutup.
    const desktop = window.matchMedia("(min-width: 1024px)");
    const onDesktop = () => desktop.matches && onClose();
    desktop.addEventListener("change", onDesktop);

    return () => {
      document.removeEventListener("keydown", onKey);
      desktop.removeEventListener("change", onDesktop);
      siblings.forEach((el) => (el.inert = alreadyInert.includes(el)));
      document.body.style.overflow = previousOverflow;
    };
  }, [headerRef, onClose]);

  return (
    <div
      id={id}
      ref={panelRef}
      tabIndex={-1}
      className="flex h-[calc(100dvh-60px)] flex-col border-t-[3px] border-primary bg-white outline-none lg:hidden"
    >
      {/* Form GET biasa: halaman dimuat ulang ke /?s=…, jadi menu tertutup dengan sendirinya. */}
      <form action={localePath("/", locale)} method="get" role="search" className="flex shrink-0 gap-2 p-4">
        <label htmlFor={`${uid}-cari`} className="sr-only">
          {t.common.search}
        </label>
        <input
          id={`${uid}-cari`}
          name="s"
          type="search"
          placeholder={t.mobileMenu.searchPlaceholder}
          className="h-11 min-w-0 flex-1 rounded-lg border border-border px-3.5 text-sm text-ink placeholder:text-body-soft"
        />
        <button type="submit" aria-label={t.common.search} className="flex size-11 shrink-0 items-center justify-center rounded-lg bg-primary text-white">
          <Search aria-hidden className="size-5" />
        </button>
      </form>

      <nav aria-label={t.mobileMenu.label} className="min-h-0 flex-1 overflow-y-auto">
        <ul>
          {mainNav.map((item, i) => {
            const expanded = openGroup === item.label;
            const groupId = `${uid}-grup-${i}`;
            return (
              <li key={item.label} className="border-b border-border/60">
                {item.children ? (
                  <>
                    <button
                      type="button"
                      aria-expanded={expanded}
                      aria-controls={groupId}
                      onClick={() => setOpenGroup(expanded ? null : item.label)}
                      className="flex min-h-[52px] w-full items-center justify-between px-5 text-left text-base font-semibold text-ink"
                    >
                      {t.nav[item.label] ?? item.label}
                      {expanded ? (
                        <Minus aria-hidden className="size-5 text-primary" />
                      ) : (
                        <Plus aria-hidden className="size-5 text-primary" />
                      )}
                    </button>
                    <ul id={groupId} hidden={!expanded} className="bg-surface-alt pb-2">
                      {item.children.map((child) => (
                        <li key={child.href}>
                          <Link
                            href={child.href}
                            onClick={onClose}
                            className="flex min-h-11 items-center px-9 py-2.5 text-[15px] font-medium text-ink"
                          >
                            {t.nav[child.label] ?? child.label}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </>
                ) : (
                  <Link
                    href={item.href ?? "/"}
                    onClick={onClose}
                    className="flex min-h-[52px] items-center px-5 text-base font-semibold text-ink"
                  >
                    {t.nav[item.label] ?? item.label}
                  </Link>
                )}
              </li>
            );
          })}
        </ul>
      </nav>

      <div className="flex shrink-0 items-center justify-between gap-3 border-t border-border/60 px-5 pt-2 pb-[calc(1rem+env(safe-area-inset-bottom))]">
      <p className="text-[13px] text-body">
        {t.mobileMenu.needHelp}{" "}
        <a
          href={floatingContact.href}
          target="_blank"
          rel="noopener noreferrer"
          className="ml-1 inline-flex min-h-11 items-center font-semibold text-primary underline-offset-4 hover:underline"
        >
          {floatingContact.label} {t.mobileMenu.askVia}
        </a>
      </p>
      <LanguageToggle />
      </div>
    </div>
  );
}
