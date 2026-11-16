import { getDictionary } from "@/i18n/dictionaries";
import { getLocale } from "@/i18n/request";

/** Keterangan di versi Inggris untuk konten yang belum diterjemahkan (isi tetap bahasa Indonesia). */
export function TranslationNotice({ className = "" }: { className?: string }) {
  const locale = getLocale();
  if (locale !== "en") return null;
  return (
    <p role="note" className={`rounded-lg border border-border bg-surface-alt px-4 py-3 text-sm text-body-strong ${className}`}>
      {getDictionary(locale).common.notTranslated}
    </p>
  );
}
