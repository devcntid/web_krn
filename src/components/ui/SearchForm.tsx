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
export function SearchForm({ id, label, defaultValue, placeholder = "Cari publikasi…", className = "" }: SearchFormProps) {
  return (
    <form action="/" method="get" role="search" className={`flex gap-2.5 sm:gap-3 ${className}`}>
      <label htmlFor={id} className="sr-only">
        {label}
      </label>
      <input
        id={id}
        name="s"
        type="search"
        defaultValue={defaultValue}
        placeholder={placeholder}
        className="h-12 min-w-0 flex-1 rounded-lg border border-border bg-white px-4 text-[15px] text-ink placeholder:text-body-soft"
      />
      <button
        type="submit"
        className="h-12 shrink-0 rounded-lg bg-primary px-5 text-[15px] font-semibold text-white transition-opacity hover:opacity-90 sm:px-6"
      >
        Cari
      </button>
    </form>
  );
}
