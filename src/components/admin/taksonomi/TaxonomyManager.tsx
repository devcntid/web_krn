"use client";

import { Search } from "lucide-react";
import Form from "next/form";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Fragment, useEffect, useId, useState } from "react";

import { createTermAction, mergeTermsAction, searchTagTargetsAction, updateTermAction } from "@/app/admin/(panel)/taksonomi/actions";
import { Dialog } from "@/components/admin/Dialog";
import { PageHeader } from "@/components/admin/PageHeader";
import { useToast } from "@/components/admin/Toast";
import { slugify } from "@/lib/slug";
import type { TaxonomyKind, TaxonomyResult, TaxonomyRow, TermInput } from "@/types/admin-taxonomy";

const num = new Intl.NumberFormat("id-ID");
const labelClass = "text-xs font-bold text-admin-text";
const field =
  "min-h-11 w-full rounded-admin border border-admin-field bg-white px-3 text-sm font-semibold text-admin-ink focus-visible:outline-2 focus-visible:outline-primary";
const primaryBtn =
  "inline-flex min-h-11 items-center justify-center rounded-admin bg-primary px-4.5 text-sm font-extrabold text-white hover:bg-admin-primary-dark focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary disabled:opacity-60";
const ghostBtn =
  "inline-flex min-h-11 items-center justify-center rounded-admin border border-admin-field bg-white px-4 text-sm font-bold text-admin-ink hover:bg-admin-canvas focus-visible:outline-2 focus-visible:outline-primary disabled:opacity-50";
const linkBtn =
  "inline-flex min-h-11 items-center rounded px-1.5 text-[13px] font-bold text-primary hover:text-admin-primary-dark focus-visible:outline-2 focus-visible:outline-primary disabled:text-admin-text disabled:no-underline";

type Props = {
  kind: TaxonomyKind;
  rows: TaxonomyRow[];
  /** Semua kategori (untuk pilihan induk & tujuan gabung). */
  categories: TaxonomyRow[];
  totals: { categories: number; tags: number };
  protectedSlugs: readonly string[];
  tagQuery: { q: string; sort: "count" | "name"; page: number; pages: number; total: number };
};

/** Kategori & Tag (artboard "A7"): form tambah, tabel dengan edit inline, dan Gabungkan. */
export function TaxonomyManager({ kind, rows, categories, totals, protectedSlugs, tagQuery }: Props) {
  const router = useRouter();
  const toast = useToast();
  const [editing, setEditing] = useState<number | null>(null);
  const [merging, setMerging] = useState<TaxonomyRow | null>(null);

  const done = (result: TaxonomyResult) => {
    if (result.ok) {
      toast.show(result.message, "success");
      router.refresh();
    }
  };
  const isProtected = (r: TaxonomyRow) => r.kind === "category" && protectedSlugs.includes(r.slug);
  const tabHref = (k: TaxonomyKind) => (k === "category" ? "/admin/taksonomi/" : "/admin/taksonomi/?jenis=tag");
  const tagHref = (patch: Partial<{ q: string; sort: string; page: number }>) => {
    const q = new URLSearchParams({ jenis: "tag" });
    const next = { q: tagQuery.q, sort: tagQuery.sort, page: 1, ...patch };
    if (next.q) q.set("q", next.q);
    if (next.sort !== "count") q.set("urut", next.sort);
    if (next.page > 1) q.set("page", String(next.page));
    return `/admin/taksonomi/?${q.toString()}`;
  };

  return (
    <>
      <PageHeader
        title="Kategori & Tag"
        description={`${num.format(totals.categories)} kategori · ${num.format(totals.tags)} tag. Gabungkan duplikat agar arsip lebih rapi.`}
      />

      <div className="flex flex-wrap items-start gap-4.5">
        <AddForm key={kind} kind={kind} categories={categories} onDone={done} />

        <section aria-label={kind === "category" ? "Daftar kategori" : "Daftar tag"} className="min-w-0 flex-[999_1_520px] overflow-hidden rounded-xl border border-admin-line bg-white">
          <nav aria-label="Jenis istilah" className="border-b border-admin-line px-4">
            <ul className="flex gap-1.5">
              {(["category", "tag"] as const).map((k) => (
                <li key={k}>
                  <Link
                    href={tabHref(k)}
                    aria-current={kind === k ? "page" : undefined}
                    className={`flex min-h-12 items-center border-b-[3px] px-3 text-sm focus-visible:outline-2 focus-visible:outline-primary ${
                      kind === k ? "border-primary font-extrabold text-primary" : "border-transparent font-bold text-admin-neutral-text hover:text-primary"
                    }`}
                  >
                    {k === "category" ? `Kategori (${num.format(totals.categories)})` : `Tag (${num.format(totals.tags)})`}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          {kind === "tag" ? (
            <div className="flex flex-wrap items-center gap-2.5 border-b border-admin-line p-3">
              <Form action="/admin/taksonomi/" role="search" aria-label="Cari tag" className="relative flex flex-[1_1_240px]">
                <input type="hidden" name="jenis" value="tag" />
                {tagQuery.sort !== "count" ? <input type="hidden" name="urut" value={tagQuery.sort} /> : null}
                <label htmlFor="cari-tag" className="sr-only">
                  Cari tag
                </label>
                <input id="cari-tag" type="search" name="q" defaultValue={tagQuery.q} placeholder="Cari nama atau slug tag…" className={`${field} pr-12 font-medium`} />
                <button type="submit" className="absolute inset-y-0 right-0 flex w-11 items-center justify-center text-admin-text hover:text-primary focus-visible:outline-2 focus-visible:outline-primary">
                  <Search aria-hidden="true" size={18} />
                  <span className="sr-only">Cari</span>
                </button>
              </Form>
              <p className="text-[13px] text-admin-text">
                Urut:{" "}
                <Link href={tagHref({ sort: "count" })} aria-current={tagQuery.sort === "count" ? "true" : undefined} className={`${linkBtn} ${tagQuery.sort === "count" ? "underline" : ""}`}>
                  jumlah
                </Link>
                ·
                <Link href={tagHref({ sort: "name" })} aria-current={tagQuery.sort === "name" ? "true" : undefined} className={`${linkBtn} ${tagQuery.sort === "name" ? "underline" : ""}`}>
                  nama
                </Link>
              </p>
            </div>
          ) : null}

          {/* relative: teks sr-only (absolut) di dalam tabel tetap di area gulir, tidak melebarkan halaman. */}
          <div className="relative overflow-x-auto">
            <table className="w-full min-w-[640px] border-collapse text-sm">
              <caption className="sr-only">{kind === "category" ? "Kategori, induk diikuti subkategorinya" : `Tag, ${tagQuery.total} hasil`}</caption>
              <thead>
                <tr className="text-left text-xs tracking-[.06em] text-admin-text uppercase">
                  <th scope="col" className="px-4 py-3 font-extrabold">
                    Nama
                  </th>
                  <th scope="col" className="px-2 py-3 font-extrabold">
                    Slug
                  </th>
                  <th scope="col" className="px-2 py-3 text-right font-extrabold">
                    Jumlah
                  </th>
                  <th scope="col" className="px-4 py-3 text-right font-extrabold">
                    <span className="sr-only">Aksi</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <Fragment key={r.id}>
                    <tr className="border-t border-admin-line hover:bg-admin-row-hover">
                      <th scope="row" className="py-1 pr-2 text-left font-extrabold text-admin-ink" style={{ paddingLeft: 16 + r.depth * 20 }}>
                        {r.depth ? (
                          <span aria-hidden="true" className="mr-1 text-admin-text">
                            └
                          </span>
                        ) : null}
                        {r.name}
                        {isProtected(r) ? <span className="ml-2 rounded-full bg-admin-neutral-bg px-2 py-0.5 text-[11px] font-bold text-admin-neutral-text">Struktur situs</span> : null}
                      </th>
                      <td className="max-w-56 truncate px-2 py-1 text-admin-text" title={r.path}>
                        {r.slug}
                      </td>
                      <td className="px-2 py-1 text-right tabular-nums">{num.format(r.count)}</td>
                      <td className="px-4 py-1 text-right whitespace-nowrap">
                        <a href={r.kind === "category" ? `/category/${r.path}/` : `/tag/${r.slug}/`} target="_blank" rel="noopener" className={linkBtn}>
                          Arsip<span className="sr-only"> {r.name} (tab baru)</span>
                        </a>
                        <span aria-hidden="true" className="text-admin-text">
                          ·
                        </span>
                        <button type="button" aria-expanded={editing === r.id} onClick={() => setEditing(editing === r.id ? null : r.id)} className={linkBtn}>
                          Edit<span className="sr-only"> {r.name}</span>
                        </button>
                        <span aria-hidden="true" className="text-admin-text">
                          ·
                        </span>
                        <button type="button" disabled={isProtected(r)} onClick={() => setMerging(r)} className={linkBtn}>
                          Gabungkan<span className="sr-only"> {r.name}</span>
                        </button>
                      </td>
                    </tr>
                    {editing === r.id ? (
                      <tr className="bg-admin-canvas">
                        <td colSpan={4} className="px-4 py-3">
                          <EditRow
                            row={r}
                            categories={categories}
                            locked={isProtected(r)}
                            onCancel={() => setEditing(null)}
                            onSaved={(result) => {
                              setEditing(null);
                              done(result);
                            }}
                          />
                        </td>
                      </tr>
                    ) : null}
                  </Fragment>
                ))}
              </tbody>
            </table>
          </div>
          {rows.length === 0 ? <p className="p-8 text-center text-sm text-admin-text">Tidak ada istilah yang cocok.</p> : null}

          {kind === "tag" && tagQuery.pages > 1 ? (
            <nav aria-label="Paginasi tag" className="flex items-center justify-between gap-3 border-t border-admin-line px-4 py-2 text-sm text-admin-text">
              {tagQuery.page > 1 ? (
                <Link href={tagHref({ page: tagQuery.page - 1 })} className={ghostBtn}>
                  Sebelumnya
                </Link>
              ) : (
                <span />
              )}
              <span>
                Halaman {tagQuery.page} dari {tagQuery.pages}
              </span>
              {tagQuery.page < tagQuery.pages ? (
                <Link href={tagHref({ page: tagQuery.page + 1 })} className={ghostBtn}>
                  Berikutnya
                </Link>
              ) : (
                <span />
              )}
            </nav>
          ) : null}
        </section>
      </div>

      <Dialog open={merging !== null} title={merging ? `Gabungkan “${merging.name}”` : "Gabungkan"} onClose={() => setMerging(null)}>
        {merging ? (
          <MergeForm
            key={merging.id}
            source={merging}
            categories={categories}
            onCancel={() => setMerging(null)}
            onMerged={(result) => {
              setMerging(null);
              done(result);
            }}
          />
        ) : null}
      </Dialog>
    </>
  );
}

/** Pilihan induk: semua kategori kecuali dirinya & turunannya, berindentasi sesuai kedalaman. */
function ParentSelect({ id, value, onChange, categories, exclude }: { id: string; value: number | null; onChange: (v: number | null) => void; categories: TaxonomyRow[]; exclude?: TaxonomyRow }) {
  const options = categories.filter((c) => !exclude || (c.id !== exclude.id && !c.path.startsWith(`${exclude.path}/`)));
  return (
    <select id={id} value={value ?? ""} onChange={(e) => onChange(e.target.value ? Number(e.target.value) : null)} className={`${field} mt-1`}>
      <option value="">— Tidak ada —</option>
      {options.map((c) => (
        <option key={c.id} value={c.id}>
          {"  ".repeat(c.depth)}
          {c.name}
        </option>
      ))}
    </select>
  );
}

function useTermForm(initial: TermInput, autoSlug: boolean) {
  const [v, setV] = useState(initial);
  const [auto, setAuto] = useState(autoSlug);
  return {
    v,
    setName: (name: string) => setV((x) => ({ ...x, name, slug: auto ? slugify(name) : x.slug })),
    setSlug: (slug: string) => {
      setAuto(false);
      setV((x) => ({ ...x, slug: slug.toLowerCase().replace(/\s+/g, "-") }));
    },
    set: (patch: Partial<TermInput>) => setV((x) => ({ ...x, ...patch })),
    reset: () => {
      setV(initial);
      setAuto(autoSlug);
    },
  };
}

function AddForm({ kind, categories, onDone }: { kind: TaxonomyKind; categories: TaxonomyRow[]; onDone: (r: TaxonomyResult) => void }) {
  const id = useId();
  const form = useTermForm({ name: "", slug: "", parentId: null, description: "" }, true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<{ message: string; field?: string } | null>(null);
  const noun = kind === "category" ? "kategori" : "tag";

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const result = await createTermAction(kind, form.v);
      if (result.ok) {
        form.reset();
        onDone(result);
      } else setError({ message: result.error, field: result.field });
    } catch {
      setError({ message: "Gagal menyimpan. Coba lagi." });
    } finally {
      setBusy(false);
    }
  };

  return (
    <section aria-labelledby={`${id}-h`} className="w-full flex-[1_1_300px] rounded-xl border border-admin-line bg-white p-5 lg:max-w-90">
      <h2 id={`${id}-h`} className="text-[17px] font-extrabold text-admin-ink">
        Tambah {noun}
      </h2>
      <form onSubmit={submit} className="mt-3 flex flex-col gap-3">
        <div>
          <label htmlFor={`${id}-n`} className={labelClass}>
            Nama
          </label>
          <input id={`${id}-n`} value={form.v.name} onChange={(e) => form.setName(e.target.value)} required maxLength={120} aria-invalid={error?.field === "name" ? true : undefined} className={`${field} mt-1`} />
        </div>
        <div>
          <label htmlFor={`${id}-s`} className={labelClass}>
            Slug
          </label>
          <input id={`${id}-s`} value={form.v.slug} onChange={(e) => form.setSlug(e.target.value)} maxLength={100} aria-invalid={error?.field === "slug" ? true : undefined} aria-describedby={`${id}-sh`} className={`${field} mt-1`} />
          <p id={`${id}-sh`} className="mt-1 text-xs break-all text-admin-text">
            Arsip: /{kind === "category" ? `category/${form.v.parentId ? `${categories.find((c) => c.id === form.v.parentId)?.path ?? "…"}/` : ""}` : "tag/"}
            {form.v.slug || "…"}/
          </p>
        </div>
        {kind === "category" ? (
          <div>
            <label htmlFor={`${id}-p`} className={labelClass}>
              Induk
            </label>
            <ParentSelect id={`${id}-p`} value={form.v.parentId} onChange={(parentId) => form.set({ parentId })} categories={categories} />
          </div>
        ) : null}
        <div>
          <label htmlFor={`${id}-d`} className={labelClass}>
            Deskripsi (meta description arsip)
          </label>
          <textarea id={`${id}-d`} value={form.v.description} onChange={(e) => form.set({ description: e.target.value })} rows={3} maxLength={500} className={`${field} mt-1 py-2 leading-normal font-medium`} />
        </div>
        {error ? (
          <p role="alert" className="rounded-admin bg-admin-danger-bg p-2.5 text-[13px] font-semibold text-admin-danger">
            {error.message}
          </p>
        ) : null}
        <button type="submit" disabled={busy} className={primaryBtn}>
          {busy ? "Menyimpan…" : "Tambah"}
        </button>
      </form>
    </section>
  );
}

function EditRow({ row, categories, locked, onCancel, onSaved }: { row: TaxonomyRow; categories: TaxonomyRow[]; locked: boolean; onCancel: () => void; onSaved: (r: TaxonomyResult) => void }) {
  const id = useId();
  const form = useTermForm({ name: row.name, slug: row.slug, parentId: row.parentId, description: row.description }, false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const moved = form.v.slug !== row.slug || form.v.parentId !== row.parentId;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const result = await updateTermAction(row.kind, row.id, form.v);
      if (result.ok) onSaved(result);
      else setError(result.error);
    } catch {
      setError("Gagal menyimpan. Coba lagi.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <form onSubmit={submit} aria-label={`Edit ${row.name}`} className="grid gap-3 sm:grid-cols-2">
      <div>
        <label htmlFor={`${id}-n`} className={labelClass}>
          Nama
        </label>
        <input id={`${id}-n`} autoFocus value={form.v.name} onChange={(e) => form.set({ name: e.target.value })} required maxLength={120} className={`${field} mt-1`} />
      </div>
      <div>
        <label htmlFor={`${id}-s`} className={labelClass}>
          Slug
        </label>
        <input id={`${id}-s`} value={form.v.slug} onChange={(e) => form.setSlug(e.target.value)} disabled={locked} maxLength={100} className={`${field} mt-1 disabled:bg-admin-canvas`} />
      </div>
      {row.kind === "category" ? (
        <div>
          <label htmlFor={`${id}-p`} className={labelClass}>
            Induk
          </label>
          {locked ? (
            <p className="mt-1 text-sm text-admin-text">Tidak bisa diubah (struktur situs).</p>
          ) : (
            <ParentSelect id={`${id}-p`} value={form.v.parentId} onChange={(parentId) => form.set({ parentId })} categories={categories} exclude={row} />
          )}
        </div>
      ) : null}
      <div className={row.kind === "category" ? "" : "sm:col-span-2"}>
        <label htmlFor={`${id}-d`} className={labelClass}>
          Deskripsi (meta description arsip)
        </label>
        <textarea id={`${id}-d`} value={form.v.description} onChange={(e) => form.set({ description: e.target.value })} rows={2} maxLength={500} className={`${field} mt-1 py-2 leading-normal font-medium`} />
      </div>
      {moved ? (
        <p className="text-[13px] font-semibold text-admin-warn-text sm:col-span-2">
          Alamat arsip berubah. Arsip lama akan dialihkan (301) ke alamat baru{row.kind === "category" ? ", termasuk subkategorinya" : ""}.
        </p>
      ) : null}
      {error ? (
        <p role="alert" className="rounded-admin bg-admin-danger-bg p-2.5 text-[13px] font-semibold text-admin-danger sm:col-span-2">
          {error}
        </p>
      ) : null}
      <div className="flex gap-2 sm:col-span-2">
        <button type="submit" disabled={busy} className={primaryBtn}>
          {busy ? "Menyimpan…" : "Simpan"}
        </button>
        <button type="button" onClick={onCancel} className={ghostBtn}>
          Batal
        </button>
      </div>
    </form>
  );
}

function MergeForm({ source, categories, onCancel, onMerged }: { source: TaxonomyRow; categories: TaxonomyRow[]; onCancel: () => void; onMerged: (r: TaxonomyResult) => void }) {
  const id = useId();
  const [target, setTarget] = useState<{ id: number; name: string; archive: string } | null>(null);
  const [query, setQuery] = useState("");
  const [found, setFound] = useState<{ id: number; name: string; slug: string }[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const isCat = source.kind === "category";
  const oldArchive = isCat ? `/category/${source.path}/` : `/tag/${source.slug}/`;

  useEffect(() => {
    if (isCat || query.trim().length < 2) return;
    let cancelled = false;
    const t = setTimeout(() => {
      searchTagTargetsAction(query, source.id)
        .then((r) => {
          if (!cancelled) setFound(r);
        })
        .catch(() => undefined);
    }, 250);
    return () => {
      cancelled = true;
      clearTimeout(t);
    };
  }, [query, isCat, source.id]);

  const merge = async () => {
    if (!target) return;
    setBusy(true);
    setError(null);
    try {
      const result = await mergeTermsAction(source.kind, source.id, target.id);
      if (result.ok) onMerged(result);
      else setError(result.error);
    } catch {
      setError("Gagal menggabungkan. Coba lagi.");
    } finally {
      setBusy(false);
    }
  };

  const options = categories.filter((c) => c.id !== source.id && !c.path.startsWith(`${source.path}/`));

  return (
    <div className="flex flex-col gap-4">
      <p className="text-sm text-admin-text">
        Semua <strong className="text-admin-ink">{num.format(source.count)} publikasi</strong> di “{source.name}” dipindah ke istilah tujuan, arsip <code className="text-admin-ink">{oldArchive}</code> dialihkan (301) ke arsip tujuan, lalu “{source.name}” dihapus.
        {isCat ? " Subkategorinya ikut dipindah ke bawah kategori tujuan." : ""} Tindakan ini tidak dapat dibatalkan.
      </p>
      {isCat ? (
        <div>
          <label htmlFor={`${id}-t`} className={labelClass}>
            Gabungkan ke kategori
          </label>
          <select
            id={`${id}-t`}
            value={target?.id ?? ""}
            onChange={(e) => {
              const c = options.find((x) => x.id === Number(e.target.value));
              setTarget(c ? { id: c.id, name: c.name, archive: `/category/${c.path}/` } : null);
            }}
            className={`${field} mt-1`}
          >
            <option value="">Pilih kategori tujuan…</option>
            {options.map((c) => (
              <option key={c.id} value={c.id}>
                {"  ".repeat(c.depth)}
                {c.name} ({num.format(c.count)})
              </option>
            ))}
          </select>
        </div>
      ) : (
        <div>
          <label htmlFor={`${id}-q`} className={labelClass}>
            Cari tag tujuan
          </label>
          <input id={`${id}-q`} value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Ketik minimal 2 huruf…" className={`${field} mt-1 font-medium`} />
          {found.length ? (
            <ul aria-label="Pilihan tag tujuan" className="mt-2 flex flex-wrap gap-1.5">
              {found.map((t) => (
                <li key={t.id}>
                  <button
                    type="button"
                    aria-pressed={target?.id === t.id}
                    onClick={() => setTarget({ id: t.id, name: t.name, archive: `/tag/${t.slug}/` })}
                    className={`min-h-11 rounded-full border px-3 text-[13px] font-semibold focus-visible:outline-2 focus-visible:outline-primary ${
                      target?.id === t.id ? "border-primary bg-admin-ok-bg text-admin-primary-dark" : "border-admin-field bg-white hover:border-primary"
                    }`}
                  >
                    {t.name}
                  </button>
                </li>
              ))}
            </ul>
          ) : null}
        </div>
      )}
      {target ? (
        <p className="rounded-admin bg-admin-info-bg p-3 text-[13px] font-semibold text-admin-info-text">
          {oldArchive} → {target.archive}
        </p>
      ) : null}
      {error ? (
        <p role="alert" className="rounded-admin bg-admin-danger-bg p-3 text-sm font-semibold text-admin-danger">
          {error}
        </p>
      ) : null}
      <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        <button type="button" onClick={onCancel} className={ghostBtn}>
          Batal
        </button>
        <button
          type="button"
          disabled={!target || busy}
          onClick={() => void merge()}
          className="inline-flex min-h-11 items-center justify-center rounded-admin bg-admin-danger px-4.5 text-sm font-extrabold text-white hover:brightness-95 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-admin-danger disabled:opacity-50"
        >
          {busy ? "Menggabungkan…" : target ? `Gabungkan ke “${target.name}”` : "Gabungkan"}
        </button>
      </div>
    </div>
  );
}
