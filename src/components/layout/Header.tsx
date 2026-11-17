"use client";

import Image from "next/image";
import { Link } from "@/i18n/Link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { ChevronDown, Menu, Search, X } from "lucide-react";

import { menuLabel, type PublicShellSettings } from "@/lib/site-settings-schema";
import { DonateButton } from "@/components/ui/DonateButton";
import { getDictionary } from "@/i18n/dictionaries";
import { useLocale } from "@/i18n/Link";
import { LanguageToggle } from "@/components/layout/LanguageToggle";
import { MobileMenu } from "@/components/layout/MobileMenu";
import { SearchOverlay } from "@/components/layout/SearchOverlay";
import { mediaUrl } from "@/lib/media";

type HeaderProps = {
  /** Identitas, menu, dan tombol dari /admin/pengaturan (dibaca SiteShell di server). */
  shell: PublicShellSettings;
};

/**
 * Replikasi header Divi Theme Builder: kartu putih melayang (fixed, top 20px,
 * lebar container 1080px, radius 10px). Dropdown desktop murni CSS (hover +
 * focus-within) agar tetap bisa diakses keyboard. Menu mobile: MobileMenu.
 */
export function Header({ shell }: HeaderProps) {
  const pathname = usePathname();
  const locale = useLocale();
  const t = getDictionary(locale);
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [lastPath, setLastPath] = useState(pathname);
  const headerRef = useRef<HTMLElement>(null);
  const toggleRef = useRef<HTMLButtonElement>(null);

  /** Tutup menu mobile dan kembalikan fokus ke tombol menu. */
  // Tanpa useCallback: React Compiler sudah memoisasi fungsi ini.
  const closeMobile = () => {
    setMobileOpen(false);
    toggleRef.current?.focus();
  };

  // Tutup menu mobile saat pindah halaman (pola "adjust state during render").
  if (pathname !== lastPath) {
    setLastPath(pathname);
    setMobileOpen(false);
  }

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header ref={headerRef} className="fixed inset-x-0 top-0 z-50 lg:top-5">
      <div
        className={`container-site flex h-[60px] items-center justify-between bg-white px-4 transition-[border-color] max-lg:!w-full lg:h-[76px] lg:rounded-[10px] lg:border lg:px-5 ${
          scrolled ? "border-border" : "border-transparent"
        }`}
      >
        <Link href="/" aria-label={`${shell.name} — ${t.shell.homeAria}`} className="shrink-0">
          <Image
            src={mediaUrl(shell.logo.src)}
            alt={shell.name}
            width={shell.logo.width}
            height={shell.logo.height}
            preload
            className="h-[26px] w-auto lg:h-[34px]"
          />
        </Link>

        {/* Navigasi desktop */}
        <nav aria-label={t.header.mainMenu} className="hidden h-full lg:block">
          <ul className="flex h-full items-center gap-[22px]">
            {shell.menu.map((item) => (
              <li key={item.label} className="group relative flex h-full items-center">
                {item.children.length ? (
                  <>
                    <button
                      type="button"
                      aria-haspopup="true"
                      className="flex items-center gap-1 text-base font-semibold text-ink transition-opacity group-focus-within:opacity-70 group-hover:opacity-70"
                    >
                      {menuLabel(item, locale, t.nav)}
                      <ChevronDown aria-hidden className="size-4" strokeWidth={2.5} />
                    </button>
                    <ul className="invisible absolute top-full left-0 w-60 border-t-[3px] border-primary bg-white py-5 opacity-0 shadow-[0_2px_5px_rgba(0,0,0,0.1)] transition-[opacity,visibility] duration-200 group-focus-within:visible group-focus-within:opacity-100 group-hover:visible group-hover:opacity-100">
                      {item.children.map((child) => (
                        <li key={child.href}>
                          <Link
                            href={child.href}
                            className="block px-5 py-1.5 text-sm leading-7 font-semibold text-ink transition-opacity hover:opacity-70"
                          >
                            {menuLabel(child, locale, t.nav)}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </>
                ) : (
                  <Link
                    href={item.href || "/"}
                    className="text-base font-semibold text-ink transition-opacity hover:opacity-70"
                  >
                    {menuLabel(item, locale, t.nav)}
                  </Link>
                )}
              </li>
            ))}
            <li>
              <button
                type="button"
                aria-label={t.header.search}
                onClick={() => setSearchOpen(true)}
                className="flex items-center text-ink transition-opacity hover:opacity-70"
              >
                <Search className="size-[18px]" strokeWidth={2} />
              </button>
            </li>
          </ul>
        </nav>

        <div className="flex items-center gap-1.5 lg:gap-3">
          <LanguageToggle className="max-lg:hidden" />
          <DonateButton href={shell.donateUrl} label={t.header.donate} />
          <button
            ref={toggleRef}
            type="button"
            className="flex size-11 items-center justify-center text-ink lg:hidden"
            aria-label={mobileOpen ? t.header.closeMenu : t.header.openMenu}
            aria-expanded={mobileOpen}
            aria-controls="mobile-menu"
            onClick={() => setMobileOpen((v) => !v)}
          >
            {mobileOpen ? <X className="size-7" /> : <Menu className="size-7" />}
          </button>
        </div>
      </div>

      {mobileOpen && <MobileMenu id="mobile-menu" shell={shell} onClose={closeMobile} headerRef={headerRef} />}

      <SearchOverlay open={searchOpen} onClose={() => setSearchOpen(false)} />
    </header>
  );
}
