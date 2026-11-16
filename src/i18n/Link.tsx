"use client";

import NextLink from "next/link";
import { usePathname } from "next/navigation";
import type { ComponentProps } from "react";

import { localeFromPathname, localePath } from "./config";

/** Bahasa halaman yang sedang dibuka (dari URL) — untuk Client Component. */
export function useLocale() {
  return localeFromPathname(usePathname());
}

/**
 * Pengganti next/link untuk tautan internal situs publik: otomatis menambahkan
 * prefiks /en/ saat halaman dibuka dalam bahasa Inggris.
 */
export function Link({ href, ...props }: ComponentProps<typeof NextLink>) {
  const locale = useLocale();
  return <NextLink href={typeof href === "string" ? localePath(href, locale) : href} {...props} />;
}
