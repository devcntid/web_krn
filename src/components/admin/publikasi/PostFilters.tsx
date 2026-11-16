"use client";

import { Search } from "lucide-react";
import Form from "next/form";
import Link from "next/link";

type Option = { value: string; label: string };

const field =
  "min-h-11 rounded-admin border border-admin-field bg-white px-3 text-sm font-semibold text-admin-ink focus-visible:outline-2 focus-visible:outline-primary";

/** Cari + filter daftar publikasi. Form GET: semua state ada di URL; select langsung mengirim form. */
export function PostFilters({
  action,
  hidden,
  values,
  categories,
  authors,
  months,
}: {
  action: string;
  /** Parameter yang dipertahankan (status, sort, dir). */
  hidden: Readonly<Record<string, string>>;
  values: { q: string; kategori: string; penulis: string; bulan: string };
  categories: readonly Option[];
  authors: readonly Option[];
  months: readonly Option[];
}) {
  const submit = (e: React.ChangeEvent<HTMLSelectElement>) => e.currentTarget.form?.requestSubmit();
  const active = Boolean(values.q || values.kategori || values.penulis || values.bulan);
  const resetQuery = new URLSearchParams(hidden).toString();

  return (
    <Form action={action} role="search" aria-label="Cari dan saring publikasi" className="flex flex-wrap items-center gap-2.5">
      {Object.entries(hidden).map(([name, value]) => (
        <input key={name} type="hidden" name={name} value={value} />
      ))}
      <div className="relative flex flex-[1_1_280px]">
        <label htmlFor="cari-publikasi" className="sr-only">
          Cari publikasi
        </label>
        <input
          id="cari-publikasi"
          type="search"
          name="q"
          defaultValue={values.q}
          placeholder="Cari judul atau slug…"
          className={`${field} w-full pr-12 font-medium`}
        />
        <button
          type="submit"
          className="absolute inset-y-0 right-0 flex w-11 items-center justify-center rounded-r-admin text-admin-text hover:text-primary focus-visible:outline-2 focus-visible:outline-primary"
        >
          <Search aria-hidden="true" size={18} />
          <span className="sr-only">Cari</span>
        </button>
      </div>
      <select name="kategori" aria-label="Kategori" defaultValue={values.kategori} onChange={submit} className={`${field} max-w-52`}>
        <option value="">Semua kategori</option>
        {categories.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
      <select name="penulis" aria-label="Penulis" defaultValue={values.penulis} onChange={submit} className={`${field} max-w-52`}>
        <option value="">Semua penulis</option>
        {authors.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
      <select name="bulan" aria-label="Bulan" defaultValue={values.bulan} onChange={submit} className={`${field} max-w-52`}>
        <option value="">Semua bulan</option>
        {months.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
      {active ? (
        <Link
          href={resetQuery ? `${action}?${resetQuery}` : action}
          className="inline-flex min-h-11 items-center rounded px-2 text-sm font-bold text-primary underline focus-visible:outline-2 focus-visible:outline-primary"
        >
          Hapus filter
        </Link>
      ) : null}
    </Form>
  );
}
