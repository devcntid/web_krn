"use client";

import { useId } from "react";

import { SEO_DESCRIPTION_MAX, SEO_LEVEL_LABEL, SEO_TITLE_MAX, type SeoLevel, effectiveSeoTitle, evaluateSeo } from "@/lib/seo-score";

const LEVEL_TEXT: Record<SeoLevel, string> = {
  baik: "text-admin-primary-dark",
  perlu: "text-admin-warn-text",
  kurang: "text-admin-danger",
};
const LEVEL_DOT: Record<SeoLevel, string> = { baik: "bg-admin-seo-good", perlu: "bg-admin-seo-warn", kurang: "bg-admin-danger" };

const base =
  "mt-1 w-full rounded-lg border bg-white px-2.5 text-[13px] font-medium text-admin-ink focus-visible:outline-2 focus-visible:outline-primary disabled:bg-admin-canvas";

const truncate = (text: string, max: number) => (text.length > max ? `${text.slice(0, max - 1).trimEnd()}…` : text);

/** Panel SEO: judul ≤60, deskripsi ≤160 dengan penghitung, pratinjau Google, dan checklist. */
export function SeoPanel({
  className,
  titleClassName,
  readOnly,
  canEditCanonical,
  siteHost,
  title,
  slug,
  excerpt,
  seoTitle,
  onSeoTitle,
  seoDescription,
  onSeoDescription,
  canonical,
  onCanonical,
  canonicalError,
  missingAlt,
}: {
  className: string;
  titleClassName: string;
  readOnly: boolean;
  canEditCanonical: boolean;
  siteHost: string;
  title: string;
  slug: string;
  excerpt: string;
  seoTitle: string;
  onSeoTitle: (value: string) => void;
  seoDescription: string;
  onSeoDescription: (value: string) => void;
  canonical: string;
  onCanonical: (value: string) => void;
  canonicalError?: string;
  missingAlt: boolean;
}) {
  const titleId = useId();
  const descId = useId();
  const canonicalId = useId();

  const shownTitle = effectiveSeoTitle(title || "Judul publikasi", seoTitle);
  const { level, checks } = evaluateSeo({ title, slug, seoTitle, seoDescription, canonical, missingAlt });
  const titleOver = shownTitle.length > SEO_TITLE_MAX;
  const descOver = seoDescription.length > SEO_DESCRIPTION_MAX;

  return (
    <section className={className}>
      <div className="flex items-center justify-between gap-3">
        <h2 className={titleClassName}>SEO</h2>
        <p className={`inline-flex items-center gap-1.5 text-xs font-extrabold ${LEVEL_TEXT[level]}`}>
          <span aria-hidden="true" className={`size-2 rounded-full ${LEVEL_DOT[level]}`} />
          <span className="sr-only">Skor SEO: </span>
          {SEO_LEVEL_LABEL[level]}
        </p>
      </div>

      <label htmlFor={titleId} className="mt-3 flex justify-between gap-3 text-xs font-bold text-admin-text">
        Judul SEO
        <span className={titleOver ? "text-admin-warn-text" : ""}>
          {shownTitle.length}/{SEO_TITLE_MAX}
        </span>
      </label>
      <input
        id={titleId}
        value={seoTitle}
        onChange={(e) => onSeoTitle(e.target.value)}
        disabled={readOnly}
        maxLength={200}
        placeholder={effectiveSeoTitle(title || "Judul publikasi", null)}
        className={`${base} min-h-11 ${titleOver ? "border-admin-field-warn" : "border-admin-field"}`}
      />

      <label htmlFor={descId} className="mt-2.5 flex justify-between gap-3 text-xs font-bold text-admin-text">
        Meta description
        <span className={descOver ? "text-admin-warn-text" : ""}>
          {seoDescription.length}/{SEO_DESCRIPTION_MAX}
        </span>
      </label>
      <textarea
        id={descId}
        value={seoDescription}
        onChange={(e) => onSeoDescription(e.target.value)}
        disabled={readOnly}
        rows={3}
        maxLength={500}
        className={`${base} resize-y py-2 leading-normal ${descOver ? "border-admin-field-warn" : "border-admin-field"}`}
      />

      {canEditCanonical ? (
        <>
          <label htmlFor={canonicalId} className="mt-2.5 block text-xs font-bold text-admin-text">
            Canonical
          </label>
          <input
            id={canonicalId}
            value={canonical}
            onChange={(e) => onCanonical(e.target.value)}
            disabled={readOnly}
            placeholder={`/${slug || "permalink"}/ (URL sendiri)`}
            aria-invalid={canonicalError ? true : undefined}
            className={`${base} min-h-11 border-admin-field`}
          />
          {canonicalError ? (
            <p role="alert" className="mt-1 text-[13px] font-semibold text-admin-danger">
              {canonicalError}
            </p>
          ) : null}
        </>
      ) : null}

      <h3 className="mt-3 mb-1 text-xs font-bold text-admin-text">Pratinjau Google</h3>
      {/* Meniru hasil penelusuran Google: font Arial & token warna --color-google-*. */}
      <div className="rounded-admin border border-admin-line p-3 font-[Arial,sans-serif]">
        <p className="truncate text-xs text-google-url">
          {siteHost} › {truncate(slug || "permalink", 28)}
        </p>
        <p className="mt-1 text-base leading-snug text-google-title">{truncate(shownTitle, SEO_TITLE_MAX)}</p>
        <p className="mt-1 text-[13px] leading-[1.45] text-google-text">
          {truncate(seoDescription.trim() || excerpt.trim() || "Meta description belum diisi.", SEO_DESCRIPTION_MAX)}
        </p>
      </div>

      <ul className="mt-3 flex flex-col gap-1.5 text-[13px]">
        {checks.map((c) => (
          <li key={c.label} className={c.ok ? "text-admin-ink" : "font-semibold text-admin-warn-text"}>
            <span aria-hidden="true">{c.ok ? "✓" : "!"}</span>
            <span className="sr-only">{c.ok ? "Lolos: " : "Perlu perhatian: "}</span> {c.label}
          </li>
        ))}
      </ul>
    </section>
  );
}
