"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { ChevronDown, Menu, Search, X } from "lucide-react";

import { mainNav, site } from "@/config/site";
import { DonateButton } from "@/components/ui/DonateButton";
import { SearchOverlay } from "@/components/layout/SearchOverlay";
import { mediaUrl } from "@/lib/media";

type HeaderProps = {
  /** Template post WordPress memakai tombol Donasi hijau. */
  donateVariant?: "accent" | "primary";
};

/**
 * Replikasi header Divi Theme Builder: kartu putih melayang (fixed, top 20px,
 * lebar container 1080px, radius 10px). Dropdown desktop murni CSS (hover +
 * focus-within) agar tetap bisa diakses keyboard.
 */
export function Header({ donateVariant = "accent" }: HeaderProps) {
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [lastPath, setLastPath] = useState(pathname);

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
    <header className="fixed inset-x-0 top-0 z-50 lg:top-5">
      <div
        className={`container-site flex h-[60px] items-center justify-between bg-white px-4 transition-[border-color] max-lg:!w-full lg:h-[76px] lg:rounded-[10px] lg:border lg:px-5 ${
          scrolled ? "border-border" : "border-transparent"
        }`}
      >
        <Link href="/" aria-label={`${site.name} — Beranda`} className="shrink-0">
          <Image
            src={mediaUrl(site.logo.src)}
            alt={site.name}
            width={site.logo.width}
            height={site.logo.height}
            preload
            className="h-[26px] w-auto lg:h-[34px]"
          />
        </Link>

        {/* Navigasi desktop */}
        <nav aria-label="Menu utama" className="hidden h-full lg:block">
          <ul className="flex h-full items-center gap-[22px]">
            {mainNav.map((item) => (
              <li key={item.label} className="group relative flex h-full items-center">
                {item.children ? (
                  <>
                    <button
                      type="button"
                      aria-haspopup="true"
                      className="flex items-center gap-1 text-base font-semibold text-ink transition-opacity group-focus-within:opacity-70 group-hover:opacity-70"
                    >
                      {item.label}
                      <ChevronDown aria-hidden className="size-4" strokeWidth={2.5} />
                    </button>
                    <ul className="invisible absolute top-full left-0 w-60 border-t-[3px] border-primary bg-white py-5 opacity-0 shadow-[0_2px_5px_rgba(0,0,0,0.1)] transition-[opacity,visibility] duration-200 group-focus-within:visible group-focus-within:opacity-100 group-hover:visible group-hover:opacity-100">
                      {item.children.map((child) => (
                        <li key={child.href}>
                          <Link
                            href={child.href}
                            className="block px-5 py-1.5 text-sm leading-7 font-semibold text-ink transition-opacity hover:opacity-70"
                          >
                            {child.label}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </>
                ) : (
                  <Link
                    href={item.href ?? "/"}
                    className="text-base font-semibold text-ink transition-opacity hover:opacity-70"
                  >
                    {item.label}
                  </Link>
                )}
              </li>
            ))}
            <li>
              <button
                type="button"
                aria-label="Cari"
                onClick={() => setSearchOpen(true)}
                className="flex items-center text-ink transition-opacity hover:opacity-70"
              >
                <Search className="size-[18px]" strokeWidth={2} />
              </button>
            </li>
          </ul>
        </nav>

        <div className="flex items-center gap-3">
          <DonateButton variant={donateVariant} />
          <button
            type="button"
            className="text-ink lg:hidden"
            aria-label={mobileOpen ? "Tutup menu" : "Buka menu"}
            aria-expanded={mobileOpen}
            aria-controls="mobile-menu"
            onClick={() => setMobileOpen((v) => !v)}
          >
            {mobileOpen ? <X className="size-7" /> : <Menu className="size-7" />}
          </button>
        </div>
      </div>

      {/* Menu mobile: daftar penuh, submenu langsung tampil (sesuai Divi) */}
      {mobileOpen && (
        <nav
          id="mobile-menu"
          aria-label="Menu mobile"
          className="max-h-[calc(100dvh-60px)] overflow-y-auto border-t-[3px] border-primary bg-white shadow-[0_2px_5px_rgba(0,0,0,0.1)] lg:hidden"
        >
          <ul className="py-2 text-center">
            {mainNav.map((item) => (
              <li key={item.label}>
                {item.href ? (
                  <Link href={item.href} className="block px-5 py-2.5 text-sm font-semibold text-ink">
                    {item.label}
                  </Link>
                ) : (
                  <span className="block bg-black/[0.03] px-5 py-2.5 text-sm font-semibold text-ink">
                    {item.label}
                  </span>
                )}
                {item.children && (
                  <ul>
                    {item.children.map((child) => (
                      <li key={child.href}>
                        <Link href={child.href} className="block px-5 py-2 text-sm font-medium text-ink">
                          {child.label}
                        </Link>
                      </li>
                    ))}
                  </ul>
                )}
              </li>
            ))}
          </ul>
        </nav>
      )}

      <SearchOverlay open={searchOpen} onClose={() => setSearchOpen(false)} />
    </header>
  );
}
