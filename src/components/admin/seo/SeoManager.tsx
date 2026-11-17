"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useId, useState } from "react";

import { clearNotFoundAction, deleteRedirectAction, saveRedirectAction, syncRedirectsAction } from "@/app/admin/(panel)/seo/actions";
import { ConfirmDialog } from "@/components/admin/ConfirmDialog";
import { Dialog } from "@/components/admin/Dialog";
import { PageHeader } from "@/components/admin/PageHeader";
import { useToast } from "@/components/admin/Toast";
import type { AdminRedirect, NotFoundEntry, RedirectInput, SeoHealth, SeoResult } from "@/types/admin-seo";

const num = new Intl.NumberFormat("id-ID");
const dateFmt = new Intl.DateTimeFormat("id-ID", { timeZone: "Asia/Jakarta", day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
const card = "rounded-xl border border-admin-line bg-white";
const labelClass = "text-xs font-bold text-admin-text";
const field = "min-h-11 w-full rounded-admin border border-admin-field bg-white px-3 text-sm text-admin-ink focus-visible:outline-2 focus-visible:outline-primary";
const primaryBtn =
  "inline-flex min-h-11 items-center justify-center rounded-admin bg-primary px-4.5 text-sm font-extrabold text-white hover:bg-admin-primary-dark focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary disabled:opacity-60";
const ghostBtn =
  "inline-flex min-h-11 items-center justify-center rounded-admin border border-admin-field bg-white px-3.5 text-sm font-bold text-admin-ink hover:bg-admin-canvas focus-visible:outline-2 focus-visible:outline-primary disabled:opacity-50";
const linkBtn = "inline-flex min-h-11 items-center rounded px-1.5 text-[13px] font-bold text-primary hover:text-admin-primary-dark focus-visible:outline-2 focus-visible:outline-primary";

const CODE_STYLE: Record<number, string> = { 301: "bg-admin-ok-bg text-admin-primary-dark", 302: "bg-admin-info-bg text-admin-info-text", 410: "bg-admin-neutral-bg text-admin-neutral-text" };

/** SEO & Redirect (artboard "A9"): kesehatan SEO, CRUD redirect, dan log 404. */
export function SeoManager({ health, redirects, notFound }: { health: SeoHealth; redirects: AdminRedirect[]; notFound: NotFoundEntry[] }) {
  const router = useRouter();
  const toast = useToast();
  const [form, setForm] = useState<{ id: number | null; input: RedirectInput } | null>(null);
  const [remove, setRemove] = useState<AdminRedirect | null>(null);
  const [busy, setBusy] = useState(false);

  const report = (result: SeoResult) => {
    if (!result.ok) toast.show(result.error, "error");
    else {
      toast.show(result.message, "success");
      if (result.warning) toast.show(result.warning, "info");
      router.refresh();
    }
    return result.ok;
  };
  const run = async (p: Promise<SeoResult>) => {
    setBusy(true);
    try {
      return report(await p);
    } catch {
      toast.show("Gagal. Coba lagi.", "error");
      return false;
    } finally {
      setBusy(false);
    }
  };

  const cards = [
    { label: "Publikasi tanpa meta description", value: health.postsNoDescription, ok: health.postsNoDescription === 0, href: "/admin/publikasi/" },
    { label: "Publikasi dengan H1 ganda (H1 di isi)", value: health.postsWithH1, ok: health.postsWithH1 === 0, href: "/admin/publikasi/" },
    { label: "Gambar tanpa teks alt", value: health.mediaNoAlt, ok: health.mediaNoAlt === 0, href: "/admin/media/?alt=kosong" },
    { label: "Halaman tanpa meta description", value: health.pagesNoDescription, ok: health.pagesNoDescription === 0, href: "/admin/halaman/" },
  ];
  const dynamic = redirects.filter((r) => !r.isStatic);

  return (
    <>
      <PageHeader
        title="SEO & Redirect"
        description="Kesehatan SEO situs, pengalihan URL lama, dan log 404."
        actions={
          <button type="button" className={primaryBtn} onClick={() => setForm({ id: null, input: { source: "", destination: "", statusCode: 301, note: "" } })}>
            + Tambah Redirect
          </button>
        }
      />

      <section aria-label="Kesehatan SEO">
        <ul className="grid gap-3.5 sm:grid-cols-2 xl:grid-cols-5">
          {cards.map((c) => (
            <li key={c.label} className={`${card} flex flex-col p-4.5`}>
              <p className="text-[13px] font-bold text-admin-text">{c.label}</p>
              <p className={`mt-1.5 text-[28px] leading-tight font-extrabold ${c.ok ? "text-admin-primary-dark" : "text-admin-warn-text"}`}>{num.format(c.value)}</p>
              <Link href={c.href} className={`${linkBtn} -ml-1.5 mt-auto self-start`}>
                {c.ok ? "Lihat" : "Perbaiki"}
                <span className="sr-only">: {c.label}</span>
              </Link>
            </li>
          ))}
          <li className={`${card} flex flex-col p-4.5`}>
            <p className="text-[13px] font-bold text-admin-text">Status sitemap</p>
            <p className="mt-1.5 text-[28px] leading-tight font-extrabold text-admin-primary-dark">{num.format(health.sitemap.urls)} URL</p>
            <p className="text-xs text-admin-text">
              {num.format(health.sitemap.posts)} publikasi · {num.format(health.sitemap.categories)} kategori · {num.format(health.sitemap.english)} versi Inggris
            </p>
            <a href="/sitemap.xml" target="_blank" rel="noopener" className={`${linkBtn} -ml-1.5 mt-auto self-start`}>
              Buka sitemap.xml<span className="sr-only"> (tab baru)</span>
            </a>
          </li>
        </ul>
      </section>

      <section aria-labelledby="redirect-h" className={`${card} overflow-hidden`}>
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-admin-line px-4.5 py-3">
          <div>
            <h2 id="redirect-h" className="text-[17px] font-extrabold text-admin-ink">
              Redirect
            </h2>
            <p className={`text-[13px] ${health.edgeConfig ? "text-admin-text" : "font-semibold text-admin-warn-text"}`}>
              {health.edgeConfig
                ? `${dynamic.length} redirect dinamis (Edge Config) · ${redirects.length - dynamic.length} statis di kode`
                : "Edge Config belum dikonfigurasi: redirect dinamis tersimpan tetapi belum aktif di situs (kecuali arsip kategori/tag)."}
            </p>
          </div>
          <button type="button" className={ghostBtn} disabled={busy || !health.edgeConfig} onClick={() => void run(syncRedirectsAction())}>
            Sinkronkan ulang
          </button>
        </div>
        <div className="relative overflow-x-auto">
          <table className="w-full min-w-[760px] border-collapse text-sm">
            <caption className="sr-only">Daftar redirect</caption>
            <thead>
              <tr className="text-left text-xs tracking-[.06em] text-admin-text uppercase">
                {["Dari", "Ke", "Kode", "Catatan"].map((h) => (
                  <th key={h} scope="col" className="px-4.5 py-3 font-extrabold first:pl-4.5">
                    {h}
                  </th>
                ))}
                <th scope="col" className="px-4.5 py-3">
                  <span className="sr-only">Aksi</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {redirects.map((r) => (
                <tr key={r.id} className="border-t border-admin-line hover:bg-admin-row-hover">
                  <th scope="row" className="max-w-64 px-4.5 py-2 text-left font-bold break-all">
                    {r.source}
                  </th>
                  <td className="max-w-64 px-4.5 py-2 break-all text-admin-text">{r.statusCode === 410 ? "— (dihapus)" : r.destination}</td>
                  <td className="px-4.5 py-2">
                    <span className={`rounded-full px-2.5 py-1 text-xs font-extrabold ${CODE_STYLE[r.statusCode] ?? CODE_STYLE[301]}`}>{r.statusCode}</span>
                  </td>
                  <td className="px-4.5 py-2 text-[13px] text-admin-text">
                    {r.isStatic ? <span className="mr-1.5 rounded-full bg-admin-neutral-bg px-2 py-0.5 text-[11px] font-bold text-admin-neutral-text">Statis</span> : null}
                    {r.note}
                  </td>
                  <td className="px-4.5 py-1 text-right whitespace-nowrap">
                    {r.isStatic ? (
                      <span className="text-xs text-admin-text">diatur di kode</span>
                    ) : (
                      <>
                        <button type="button" className={linkBtn} onClick={() => setForm({ id: r.id, input: { source: r.source, destination: r.destination, statusCode: r.statusCode, note: r.note } })}>
                          Edit<span className="sr-only"> {r.source}</span>
                        </button>
                        <button type="button" className={`${linkBtn} text-admin-danger`} onClick={() => setRemove(r)}>
                          Hapus<span className="sr-only"> {r.source}</span>
                        </button>
                      </>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section aria-labelledby="nf-h" className={`${card} overflow-hidden`}>
        <div className="border-b border-admin-line px-4.5 py-3">
          <h2 id="nf-h" className="text-[17px] font-extrabold text-admin-ink">
            Log 404 terbaru
          </h2>
          <p className="text-[13px] text-admin-text">URL yang dicari pengunjung tapi tidak ditemukan — buat redirect langsung dari sini. Bot diabaikan.</p>
        </div>
        {notFound.length === 0 ? (
          <p className="p-8 text-center text-sm text-admin-text">Belum ada 404 yang tercatat (atau semuanya sudah dialihkan).</p>
        ) : (
          <div className="relative overflow-x-auto">
            <table className="w-full min-w-[640px] border-collapse text-sm">
              <caption className="sr-only">URL 404 tanpa redirect, paling sering dulu</caption>
              <thead>
                <tr className="text-left text-xs tracking-[.06em] text-admin-text uppercase">
                  <th scope="col" className="px-4.5 py-3 font-extrabold">
                    Path
                  </th>
                  <th scope="col" className="px-2 py-3 text-right font-extrabold">
                    Hits
                  </th>
                  <th scope="col" className="px-4.5 py-3 font-extrabold">
                    Terakhir
                  </th>
                  <th scope="col" className="px-4.5 py-3">
                    <span className="sr-only">Aksi</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {notFound.map((n) => (
                  <tr key={n.path} className="border-t border-admin-line hover:bg-admin-row-hover">
                    <th scope="row" className="max-w-80 px-4.5 py-2 text-left font-bold break-all">
                      {n.path}
                    </th>
                    <td className="px-2 py-2 text-right tabular-nums">{num.format(n.hits)}</td>
                    <td className="px-4.5 py-2 whitespace-nowrap text-admin-text">{dateFmt.format(new Date(n.lastSeen))}</td>
                    <td className="px-4.5 py-1 text-right whitespace-nowrap">
                      <button type="button" className={linkBtn} onClick={() => setForm({ id: null, input: { source: n.path, destination: "", statusCode: 301, note: `Dari log 404 (${n.hits} hit)` } })}>
                        Buat redirect<span className="sr-only"> untuk {n.path}</span>
                      </button>
                      <button type="button" className={`${linkBtn} text-admin-text`} disabled={busy} onClick={() => void run(clearNotFoundAction(n.path))}>
                        Abaikan<span className="sr-only"> {n.path}</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <Dialog open={form !== null} title={form?.id ? "Edit redirect" : "Tambah redirect"} onClose={() => setForm(null)}>
        {form ? (
          <RedirectForm
            key={`${form.id}:${form.input.source}`}
            initial={form.input}
            onCancel={() => setForm(null)}
            onSave={async (input) => {
              setBusy(true);
              try {
                const result = await saveRedirectAction(form.id, input);
                if (report(result)) setForm(null);
                return result;
              } finally {
                setBusy(false);
              }
            }}
          />
        ) : null}
      </Dialog>
      <ConfirmDialog
        open={remove !== null}
        title="Hapus redirect ini?"
        description={remove ? `${remove.source} tidak lagi dialihkan dan akan menampilkan 404 bila halamannya tidak ada.` : undefined}
        confirmLabel="Hapus redirect"
        tone="danger"
        busy={busy}
        onConfirm={async () => {
          if (remove) await run(deleteRedirectAction(remove.id));
          setRemove(null);
        }}
        onCancel={() => setRemove(null)}
      />
    </>
  );
}

function RedirectForm({ initial, onSave, onCancel }: { initial: RedirectInput; onSave: (input: RedirectInput) => Promise<SeoResult>; onCancel: () => void }) {
  const id = useId();
  const [v, setV] = useState(initial);
  const [error, setError] = useState<{ message: string; field?: string } | null>(null);
  const [busy, setBusy] = useState(false);
  const gone = v.statusCode === 410;
  return (
    <form
      onSubmit={async (e) => {
        e.preventDefault();
        setBusy(true);
        setError(null);
        try {
          const result = await onSave(v);
          if (!result.ok) setError({ message: result.error, field: result.field });
        } finally {
          setBusy(false);
        }
      }}
      className="flex flex-col gap-4"
    >
      <div>
        <label htmlFor={`${id}-s`} className={labelClass}>
          Dari URL (path lama)
        </label>
        <input id={`${id}-s`} value={v.source} onChange={(e) => setV({ ...v, source: e.target.value })} required placeholder="/halaman-lama/" aria-invalid={error?.field === "source" ? true : undefined} className={`${field} mt-1`} />
      </div>
      <fieldset>
        <legend className={labelClass}>Kode</legend>
        <div className="mt-1 flex flex-wrap gap-x-5">
          {[
            [301, "301 · Permanen"],
            [302, "302 · Sementara"],
            [410, "410 · Sudah dihapus"],
          ].map(([code, label]) => (
            <label key={code} className="flex min-h-11 items-center gap-2 text-sm font-semibold">
              <input type="radio" name={`${id}-c`} checked={v.statusCode === code} onChange={() => setV({ ...v, statusCode: Number(code) })} className="size-4.5 accent-primary" />
              {label}
            </label>
          ))}
        </div>
      </fieldset>
      {gone ? (
        <p className="rounded-admin bg-admin-neutral-bg p-3 text-[13px] text-admin-neutral-text">410 memberi tahu mesin pencari bahwa halaman sengaja dihapus permanen; tidak perlu tujuan.</p>
      ) : (
        <div>
          <label htmlFor={`${id}-d`} className={labelClass}>
            Ke URL (path baru atau https://…)
          </label>
          <input id={`${id}-d`} value={v.destination} onChange={(e) => setV({ ...v, destination: e.target.value })} required placeholder="/halaman-baru/" aria-invalid={error?.field === "destination" ? true : undefined} className={`${field} mt-1`} />
        </div>
      )}
      <div>
        <label htmlFor={`${id}-n`} className={labelClass}>
          Catatan (opsional)
        </label>
        <input id={`${id}-n`} value={v.note} onChange={(e) => setV({ ...v, note: e.target.value })} maxLength={300} className={`${field} mt-1`} />
      </div>
      {error ? (
        <p role="alert" className="rounded-admin bg-admin-danger-bg p-3 text-sm font-semibold text-admin-danger">
          {error.message}
        </p>
      ) : null}
      <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        <button type="button" className={ghostBtn} onClick={onCancel}>
          Batal
        </button>
        <button type="submit" className={primaryBtn} disabled={busy}>
          {busy ? "Menyimpan…" : "Simpan"}
        </button>
      </div>
    </form>
  );
}
