"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useId, useState } from "react";

import { createPageAction } from "@/app/admin/(panel)/halaman/actions";
import { useToast } from "@/components/admin/Toast";
import { slugify } from "@/lib/slug";

const field =
  "min-h-11 w-full rounded-lg border border-admin-field bg-white px-3 text-sm text-admin-ink focus-visible:outline-2 focus-visible:outline-primary";
const labelClass = "text-xs font-bold text-admin-text";

/** Form "+ Halaman Baru": judul, alamat, dan (opsional) halaman induk. Halaman dibuat sebagai draf. */
export function NewPageForm({ parents, siteHost }: { parents: readonly { path: string; title: string }[]; siteHost: string }) {
  const router = useRouter();
  const toast = useToast();
  const titleId = useId();
  const slugId = useId();
  const parentId = useId();
  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [slugAuto, setSlugAuto] = useState(true);
  const [parent, setParent] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<{ message: string; field?: "title" | "slug" } | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const result = await createPageAction({ title, slug, parentPath: parent });
      if (result.ok) {
        toast.show("Halaman dibuat sebagai draf.", "success");
        router.push(`/admin/halaman/${result.id}/`);
        return;
      }
      setError({ message: result.error, field: result.field });
    } catch {
      setError({ message: "Gagal membuat halaman. Coba lagi." });
    }
    setBusy(false);
  };

  return (
    <section aria-labelledby={`${titleId}-h`} className="min-w-0 flex-[999_1_520px] rounded-xl border border-admin-line bg-white p-5 sm:p-[22px]">
      <h2 id={`${titleId}-h`} className="text-xl font-extrabold text-admin-ink">
        Halaman baru
      </h2>
      <p className="mt-0.5 text-[13px] text-admin-text">Halaman dibuat sebagai draf dengan satu section Hero. Alamat tidak bisa diubah setelah dibuat.</p>
      <form onSubmit={submit} className="mt-5 flex max-w-xl flex-col gap-4">
        <div>
          <label htmlFor={titleId} className={labelClass}>
            Judul
          </label>
          <input
            id={titleId}
            value={title}
            required
            maxLength={200}
            aria-invalid={error?.field === "title" ? true : undefined}
            onChange={(e) => {
              setTitle(e.target.value);
              if (slugAuto) setSlug(slugify(e.target.value));
            }}
            className={`${field} mt-1`}
          />
        </div>
        <div>
          <label htmlFor={parentId} className={labelClass}>
            Halaman induk (opsional)
          </label>
          <select id={parentId} value={parent} onChange={(e) => setParent(e.target.value)} className={`${field} mt-1`}>
            <option value="">— Tanpa induk (halaman utama)</option>
            {parents.map((p) => (
              <option key={p.path} value={p.path}>
                {p.title} (/{p.path}/)
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor={slugId} className={labelClass}>
            Alamat
          </label>
          <input
            id={slugId}
            value={slug}
            required
            maxLength={100}
            aria-invalid={error?.field === "slug" ? true : undefined}
            aria-describedby={`${slugId}-help`}
            onChange={(e) => {
              setSlug(e.target.value.toLowerCase().replace(/\s+/g, "-"));
              setSlugAuto(false);
            }}
            className={`${field} mt-1`}
          />
          <p id={`${slugId}-help`} className="mt-1 text-xs break-all text-admin-text">
            {siteHost}/{parent ? `${parent}/` : ""}
            <strong className="text-admin-ink">{slug || "…"}</strong>/
          </p>
        </div>
        {error ? (
          <p role="alert" className="rounded-admin border border-admin-danger bg-admin-danger-bg p-3 text-sm font-semibold text-admin-danger">
            {error.message}
          </p>
        ) : null}
        <div className="flex flex-wrap gap-2">
          <button
            type="submit"
            disabled={busy}
            className="min-h-11 rounded-admin bg-primary px-4.5 text-sm font-extrabold text-white hover:bg-admin-primary-dark focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary disabled:opacity-60"
          >
            {busy ? "Membuat…" : "Buat halaman"}
          </button>
          <Link
            href="/admin/halaman/"
            className="inline-flex min-h-11 items-center rounded-admin border border-admin-field bg-white px-4 text-sm font-bold text-admin-ink hover:bg-admin-canvas focus-visible:outline-2 focus-visible:outline-primary"
          >
            Batal
          </Link>
        </div>
      </form>
    </section>
  );
}
