import { getDictionary } from "@/i18n/dictionaries";
import { getLocale } from "@/i18n/request";

/** Keterangan di versi Inggris untuk konten yang belum diterjemahkan (isi tetap bahasa Indonesia). */
/**
 * `translation`: undefined = belum diterjemahkan, "draft" = terjemahan belum ditinjau,
 * "reviewed" = final (tanpa keterangan).
 */
export function TranslationNotice({ className = "", translation }: { className?: string; translation?: "draft" | "reviewed" }) {
  const locale = getLocale();
  if (locale !== "en" || translation === "reviewed") return null;
  return (
    <p role="note" className={`rounded-lg border border-border bg-surface-alt px-4 py-3 text-sm text-body-strong ${className}`}>
      {translation === "draft" ? getDictionary(locale).common.draftTranslation : getDictionary(locale).common.notTranslated}
    </p>
  );
}
