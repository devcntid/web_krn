import { localePath } from "@/i18n/config";
import { getDictionary } from "@/i18n/dictionaries";
import { getLocale } from "@/i18n/request";

type SearchFormProps = {
  /** id unik input (satu halaman bisa memuat lebih dari satu form cari). */
  id: string;
  label: string;
  defaultValue?: string;
  placeholder?: string;
  className?: string;
};

/**
 * Form cari di dalam halaman. GET ke "/?s=…" — URL pencarian WordPress yang
 * dipertahankan (di-rewrite ke /search). Tanpa JavaScript.
 */
export function SearchForm({ id, label, defaultValue, placeholder, className = "" }: SearchFormProps) {
  const locale = getLocale();
  const t = getDictionary(locale);
  return (
    <form action={localePath("/", locale)} method="get" role="search" className={`flex gap-2.5 sm:gap-3 ${className}`}>
      <label htmlFor={id} className="sr-only">
        {label}
      </label>
      <input
        id={id}
        name="s"
        type="search"
        defaultValue={defaultValue}
        placeholder={placeholder ?? t.common.searchPlaceholder}
        className="h-12 min-w-0 flex-1 rounded-lg border border-border bg-white px-4 text-[15px] text-ink placeholder:text-body-soft"
      />
      <button
        type="submit"
        className="h-12 shrink-0 rounded-lg bg-primary px-5 text-[15px] font-semibold text-white transition-opacity hover:opacity-90 sm:px-6"
      >
        {t.common.search}
      </button>
    </form>
  );
}
