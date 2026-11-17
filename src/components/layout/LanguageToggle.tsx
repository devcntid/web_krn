"use client";

import { usePathname } from "next/navigation";

import { LOCALES, localeFromPathname, stripLocale } from "@/i18n/config";
import { getDictionary } from "@/i18n/dictionaries";

const NAMES = { id: "Bahasa Indonesia", en: "English" } as const;

/**
 * Pengalih bahasa ID | EN. Menaut ke halaman yang sama di bahasa lain
 * (URL Indonesia tanpa prefiks, Inggris di bawah /en/). Parameter query tidak dibawa.
 * Memakai <a> biasa (muat halaman penuh): berpindah bahasa mengganti seluruh pohon
 * layout [lang], dan prefetch lintas-bahasa lewat next/link menghasilkan 404.
 */
export function LanguageToggle({ className = "" }: { className?: string }) {
  const pathname = usePathname();
  const current = localeFromPathname(pathname);
  const bare = stripLocale(pathname);
  const t = getDictionary(current);

  return (
    <nav aria-label={t.shell.languageLabel} className={className}>
      <ul className="flex items-center overflow-hidden rounded-[5px] border border-primary text-[13px] font-semibold">
        {LOCALES.map((locale) => {
          const active = locale === current;
          return (
            <li key={locale}>
              <a
                href={locale === "en" ? `/en${bare}` : bare}
                hrefLang={locale}
                lang={locale}
                aria-label={NAMES[locale]}
                aria-current={active ? "true" : undefined}
                className={`flex min-h-11 min-w-11 items-center justify-center px-2 uppercase transition-colors lg:min-h-[34px] lg:min-w-[34px] ${
                  active ? "bg-primary text-white" : "bg-white text-ink hover:bg-primary/10"
                }`}
              >
                {locale}
              </a>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
