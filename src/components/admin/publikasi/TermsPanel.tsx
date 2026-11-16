"use client";

import { X } from "lucide-react";
import { useEffect, useId, useState } from "react";

import { searchTagsAction } from "@/app/admin/(panel)/publikasi/actions";
import type { CategoryOption, TagRef } from "@/types/admin-posts";

const chip = "inline-flex min-h-11 items-center rounded-full pl-3.5 text-[13px] font-bold";
const chipBtn =
  "flex size-11 items-center justify-center rounded-full hover:bg-white/70 focus-visible:outline-2 focus-visible:outline-primary";
const field =
  "min-h-11 w-full rounded-lg border border-admin-field bg-white px-2.5 text-[13px] font-medium text-admin-ink focus-visible:outline-2 focus-visible:outline-primary";

/** Panel "Kategori & Tag": chip terpilih, pilih kategori, cari/tambah tag. */
export function TermsPanel({
  className,
  titleClassName,
  readOnly,
  categories,
  categoryIds,
  onCategories,
  tags,
  onTags,
  newTags,
  onNewTags,
}: {
  className: string;
  titleClassName: string;
  readOnly: boolean;
  categories: readonly CategoryOption[];
  categoryIds: number[];
  onCategories: (ids: number[]) => void;
  tags: TagRef[];
  onTags: (tags: TagRef[]) => void;
  /** Tag baru (belum ada di database) — dibuat saat disimpan. */
  newTags: string[];
  onNewTags: (names: string[]) => void;
}) {
  const catId = useId();
  const tagId = useId();
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState<TagRef[]>([]);

  useEffect(() => {
    const term = query.trim();
    if (term.length < 2) return;
    let cancelled = false;
    const timer = setTimeout(() => {
      searchTagsAction(term)
        .then((found) => {
          if (!cancelled) setSuggestions(found);
        })
        .catch(() => undefined);
    }, 250);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [query]);

  const selected = categoryIds.map((id) => categories.find((c) => c.id === id)).filter((c): c is CategoryOption => Boolean(c));
  const available = categories.filter((c) => !categoryIds.includes(c.id));
  const visibleSuggestions = query.trim().length >= 2 ? suggestions.filter((s) => !tags.some((t) => t.id === s.id)) : [];

  const addTag = (tag: TagRef) => {
    if (!tags.some((t) => t.id === tag.id)) onTags([...tags, tag]);
    setQuery("");
  };
  const addTyped = () => {
    const name = query.trim().replace(/\s+/g, " ");
    if (!name) return;
    const same = (a: string) => a.toLowerCase() === name.toLowerCase();
    const existing = suggestions.find((s) => same(s.name));
    if (existing) addTag(existing);
    else if (!newTags.some(same) && !tags.some((t) => same(t.name))) onNewTags([...newTags, name]);
    setQuery("");
  };

  return (
    <section className={className}>
      <h2 className={titleClassName}>Kategori &amp; Tag</h2>

      <h3 className="mt-3 text-xs font-bold text-admin-text">Kategori</h3>
      <ul className="mt-1.5 flex flex-wrap gap-2">
        {selected.map((c) => (
          <li key={c.id} className={`${chip} bg-admin-ok-bg text-admin-primary-dark ${readOnly ? "pr-3.5" : ""}`}>
            {c.name}
            {!readOnly ? (
              <button type="button" className={chipBtn} onClick={() => onCategories(categoryIds.filter((id) => id !== c.id))}>
                <X aria-hidden="true" size={14} />
                <span className="sr-only">Hapus kategori {c.name}</span>
              </button>
            ) : null}
          </li>
        ))}
        {selected.length === 0 ? <li className="text-[13px] text-admin-text">Belum ada kategori.</li> : null}
      </ul>
      {!readOnly ? (
        <>
          <label htmlFor={catId} className="sr-only">
            Tambah kategori
          </label>
          <select
            id={catId}
            value=""
            onChange={(e) => {
              const id = Number.parseInt(e.target.value, 10);
              if (Number.isInteger(id)) onCategories([...categoryIds, id]);
            }}
            className={`${field} mt-2`}
          >
            <option value="">+ Tambah kategori…</option>
            {available.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </>
      ) : null}

      <h3 className="mt-4 text-xs font-bold text-admin-text">Tag</h3>
      <ul className="mt-1.5 flex flex-wrap gap-2">
        {tags.map((t) => (
          <li key={t.id} className={`${chip} bg-admin-neutral-bg text-admin-neutral-text ${readOnly ? "pr-3.5" : ""}`}>
            {t.name}
            {!readOnly ? (
              <button type="button" className={chipBtn} onClick={() => onTags(tags.filter((x) => x.id !== t.id))}>
                <X aria-hidden="true" size={14} />
                <span className="sr-only">Hapus tag {t.name}</span>
              </button>
            ) : null}
          </li>
        ))}
        {newTags.map((name) => (
          <li key={`new:${name}`} className={`${chip} bg-admin-info-bg text-admin-info-text`}>
            {name}&nbsp;<span className="font-semibold">(baru)</span>
            <button type="button" className={chipBtn} onClick={() => onNewTags(newTags.filter((n) => n !== name))}>
              <X aria-hidden="true" size={14} />
              <span className="sr-only">Hapus tag {name}</span>
            </button>
          </li>
        ))}
        {tags.length + newTags.length === 0 ? <li className="text-[13px] text-admin-text">Belum ada tag.</li> : null}
      </ul>
      {!readOnly ? (
        <div className="mt-2">
          <label htmlFor={tagId} className="sr-only">
            Cari atau tambah tag
          </label>
          <div className="flex gap-2">
            <input
              id={tagId}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === ",") {
                  e.preventDefault();
                  addTyped();
                }
              }}
              maxLength={80}
              placeholder="Cari atau ketik tag, lalu Enter"
              className={field}
            />
            <button
              type="button"
              onClick={addTyped}
              disabled={!query.trim()}
              className="min-h-11 rounded-lg border border-admin-field bg-white px-3 text-[13px] font-bold hover:bg-admin-canvas focus-visible:outline-2 focus-visible:outline-primary disabled:opacity-50"
            >
              Tambah
            </button>
          </div>
          {visibleSuggestions.length ? (
            <ul aria-label="Saran tag" className="mt-1.5 flex flex-wrap gap-1.5">
              {visibleSuggestions.map((s) => (
                <li key={s.id}>
                  <button
                    type="button"
                    onClick={() => addTag(s)}
                    className="min-h-11 rounded-full border border-admin-field bg-white px-3 text-[13px] font-semibold hover:border-primary focus-visible:outline-2 focus-visible:outline-primary"
                  >
                    + {s.name}
                  </button>
                </li>
              ))}
            </ul>
          ) : null}
        </div>
      ) : null}
    </section>
  );
}
