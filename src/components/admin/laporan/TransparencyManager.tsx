"use client";

import { ArrowDown, ArrowUp } from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Fragment, useId, useState } from "react";

import {
  createReportAction,
  deleteAuditAction,
  deleteLegalDocAction,
  deleteReportAction,
  moveLegalDocAction,
  moveReportAction,
  saveAuditAction,
  saveLegalDocAction,
  setReportVisibleAction,
  updateReportAction,
} from "@/app/admin/(panel)/laporan/actions";
import { ConfirmDialog } from "@/components/admin/ConfirmDialog";
import { Dialog } from "@/components/admin/Dialog";
import { PageHeader } from "@/components/admin/PageHeader";
import { useToast } from "@/components/admin/Toast";
import { MediaDropzone } from "@/components/admin/media/MediaDropzone";
import { MediaPicker } from "@/components/admin/publikasi/MediaPicker";
import { mediaUrl } from "@/lib/media";
import type { AdminAudit, AdminLegalDoc, AdminReport, TransparencyResult } from "@/types/admin-transparency";

const card = "rounded-xl border border-admin-line bg-white";
const h2 = "text-[17px] font-extrabold text-admin-ink";
const labelClass = "text-xs font-bold text-admin-text";
const field =
  "min-h-11 w-full rounded-admin border border-admin-field bg-white px-3 text-sm text-admin-ink focus-visible:outline-2 focus-visible:outline-primary";
const primaryBtn =
  "inline-flex min-h-11 items-center justify-center rounded-admin bg-primary px-4.5 text-sm font-extrabold text-white hover:bg-admin-primary-dark focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary disabled:opacity-60";
const ghostBtn =
  "inline-flex min-h-11 items-center justify-center rounded-admin border border-admin-field bg-white px-3.5 text-sm font-bold text-admin-ink hover:bg-admin-canvas focus-visible:outline-2 focus-visible:outline-primary disabled:opacity-50";
const linkBtn = "inline-flex min-h-11 items-center rounded px-1.5 text-[13px] font-bold text-primary hover:text-admin-primary-dark focus-visible:outline-2 focus-visible:outline-primary";
const iconBtn =
  "flex size-11 shrink-0 items-center justify-center rounded-lg text-admin-ink hover:bg-admin-canvas focus-visible:outline-2 focus-visible:outline-primary disabled:opacity-30";

type Confirm = { title: string; description: string; label: string; run: () => Promise<TransparencyResult> };

/** Jenis sumber laporan dari URL-nya (untuk lencana di tabel). */
function sourceOf(url: string): string {
  if (/heyzine\.com/i.test(url)) return "Heyzine";
  if (/hflip\.co/i.test(url)) return "hflip";
  if (/\.pdf($|\?)/i.test(url)) return "PDF";
  return "Tautan";
}

/** e-Report & Audit (artboard "A8"): laporan penyaluran, audit per tahun, dokumen legalitas. */
export function TransparencyManager({
  reports,
  audits,
  legal,
  themes,
}: {
  reports: AdminReport[];
  audits: AdminAudit[];
  legal: AdminLegalDoc[];
  themes: { slug: string; label: string }[];
}) {
  const router = useRouter();
  const toast = useToast();
  const [reportForm, setReportForm] = useState<AdminReport | "new" | null>(null);
  const [auditForm, setAuditForm] = useState<AdminAudit | "new" | null>(null);
  const [legalForm, setLegalForm] = useState<AdminLegalDoc | "new" | null>(null);
  const [confirm, setConfirm] = useState<Confirm | null>(null);
  const [busy, setBusy] = useState(false);

  const handle = async (promise: Promise<TransparencyResult>) => {
    setBusy(true);
    try {
      const result = await promise;
      toast.show(result.ok ? result.message : result.error, result.ok ? "success" : "error");
      if (result.ok) router.refresh();
      return result.ok;
    } catch {
      toast.show("Gagal menyimpan. Coba lagi.", "error");
      return false;
    } finally {
      setBusy(false);
    }
  };
  const themeLabel = (slug: string) => themes.find((t) => t.slug === slug)?.label ?? slug;
  const years = [...new Set(reports.map((r) => r.year))];

  return (
    <>
      <PageHeader
        title="e-Report & Audit"
        description="Laporan penyaluran (flipbook/PDF), audit tahunan, dan dokumen legalitas."
        actions={
          <button type="button" className={primaryBtn} onClick={() => setReportForm("new")}>
            + Tambah Laporan
          </button>
        }
      />

      <section aria-labelledby="laporan-h" className={`${card} overflow-hidden`}>
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-admin-line px-4.5 py-3">
          <h2 id="laporan-h" className={h2}>
            Laporan Penyaluran
          </h2>
          <p className="text-[13px] text-admin-text">
            {reports.length} laporan · {reports.filter((r) => r.visible).length} tampil di /e-report/
          </p>
        </div>
        <div className="relative overflow-x-auto">
          <table className="w-full min-w-[820px] border-collapse text-sm">
            <caption className="sr-only">Laporan penyaluran per tahun, berurutan seperti di halaman e-Report</caption>
            <thead>
              <tr className="text-left text-xs tracking-[.06em] text-admin-text uppercase">
                <th scope="col" className="px-4.5 py-3 font-extrabold">
                  Judul
                </th>
                <th scope="col" className="px-2 py-3 font-extrabold">
                  Tema
                </th>
                <th scope="col" className="px-2 py-3 font-extrabold">
                  Sumber
                </th>
                <th scope="col" className="px-2 py-3 font-extrabold">
                  Tampil
                </th>
                <th scope="col" className="px-2 py-3 font-extrabold">
                  Urutan
                </th>
                <th scope="col" className="px-4.5 py-3">
                  <span className="sr-only">Aksi</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {years.map((year) => {
                const list = reports.filter((r) => r.year === year);
                return (
                  <Fragment key={year}>
                    <tr className="border-t border-admin-line bg-admin-canvas">
                      <th scope="colgroup" colSpan={6} className="px-4.5 py-2 text-left text-[13px] font-extrabold text-admin-ink">
                        {year}
                      </th>
                    </tr>
                    {list.map((r, i) => (
                      <tr key={r.id} className={`border-t border-admin-line hover:bg-admin-row-hover ${r.visible ? "" : "text-admin-text"}`}>
                        <th scope="row" className="px-4.5 py-1 text-left font-extrabold">
                          <span className="flex items-center gap-3">
                            {r.coverUrl ? (
                              <Image src={mediaUrl(r.coverUrl)} alt="" width={32} height={45} className="h-11 w-8 shrink-0 rounded object-cover" />
                            ) : (
                              <span aria-hidden="true" className="h-11 w-8 shrink-0 rounded bg-admin-neutral-bg" />
                            )}
                            {r.title}
                          </span>
                        </th>
                        <td className="px-2 py-1">{r.themes.length ? r.themes.map(themeLabel).join(", ") : "—"}</td>
                        <td className="px-2 py-1">
                          <span className="rounded-full bg-admin-info-bg px-2.5 py-1 text-xs font-extrabold whitespace-nowrap text-admin-info-text">{sourceOf(r.url)}</span>
                        </td>
                        <td className="px-2 py-1">
                          <label className="flex size-11 items-center justify-center">
                            <input
                              type="checkbox"
                              checked={r.visible}
                              disabled={busy}
                              onChange={(e) => void handle(setReportVisibleAction(r.id, e.target.checked))}
                              className="size-4.5 accent-primary"
                            />
                            <span className="sr-only">Tampilkan {r.title} di situs</span>
                          </label>
                        </td>
                        <td className="px-2 py-1">
                          <span className="flex">
                            <button type="button" className={iconBtn} disabled={busy || i === 0} onClick={() => void handle(moveReportAction(r.id, -1))}>
                              <ArrowUp aria-hidden="true" size={16} />
                              <span className="sr-only">Naikkan {r.title}</span>
                            </button>
                            <button type="button" className={iconBtn} disabled={busy || i === list.length - 1} onClick={() => void handle(moveReportAction(r.id, 1))}>
                              <ArrowDown aria-hidden="true" size={16} />
                              <span className="sr-only">Turunkan {r.title}</span>
                            </button>
                          </span>
                        </td>
                        <td className="px-4.5 py-1 text-right whitespace-nowrap">
                          <a href={r.url} target="_blank" rel="noopener noreferrer" className={linkBtn}>
                            Buka<span className="sr-only"> {r.title} (tab baru)</span>
                          </a>
                          <button type="button" className={linkBtn} onClick={() => setReportForm(r)}>
                            Edit<span className="sr-only"> {r.title}</span>
                          </button>
                          <button
                            type="button"
                            className={`${linkBtn} text-admin-danger`}
                            onClick={() => setConfirm({ title: "Hapus laporan ini?", description: `“${r.title}” dihapus dari daftar e-Report.`, label: "Hapus laporan", run: () => deleteReportAction(r.id) })}
                          >
                            Hapus<span className="sr-only"> {r.title}</span>
                          </button>
                        </td>
                      </tr>
                    ))}
                  </Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
        {reports.length === 0 ? <p className="p-8 text-center text-sm text-admin-text">Belum ada laporan.</p> : null}
      </section>

      <div className="grid gap-5 lg:grid-cols-2">
        <section aria-labelledby="audit-h" className={`${card} min-w-0 p-4.5`}>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 id="audit-h" className={h2}>
              Audit Keuangan
            </h2>
            <button type="button" className={ghostBtn} onClick={() => setAuditForm("new")}>
              + Tahun
            </button>
          </div>
          <ul className="mt-3 flex flex-col gap-2">
            {audits.map((a) => (
              <li key={a.id} className="flex flex-wrap items-center gap-x-3 rounded-admin border border-admin-line px-3 py-1">
                <span className="w-24 font-extrabold">Tahun {a.year}</span>
                <span className="min-w-32 flex-1 text-[13px] text-admin-text">
                  {a.opinion || "Opini belum diisi"} · {a.pdfUrl ? "PDF di Blob" : a.documentUrl ? "Google Drive" : "tanpa dokumen"}
                </span>
                <button type="button" className={linkBtn} onClick={() => setAuditForm(a)}>
                  {a.pdfUrl ? "Ganti PDF" : "Unggah PDF"}
                  <span className="sr-only"> audit {a.year}</span>
                </button>
                <button
                  type="button"
                  className={`${linkBtn} text-admin-danger`}
                  onClick={() => setConfirm({ title: `Hapus audit ${a.year}?`, description: "Tahun ini hilang dari halaman Audit Keuangan. File PDF-nya tetap ada di pustaka media.", label: "Hapus audit", run: () => deleteAuditAction(a.id) })}
                >
                  Hapus<span className="sr-only"> audit {a.year}</span>
                </button>
              </li>
            ))}
          </ul>
          {audits.length === 0 ? <p className="mt-3 text-sm text-admin-text">Belum ada audit.</p> : null}
        </section>

        <section aria-labelledby="legal-h" className={`${card} min-w-0 p-4.5`}>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 id="legal-h" className={h2}>
              Dokumen Legalitas
            </h2>
            <button type="button" className={ghostBtn} onClick={() => setLegalForm("new")}>
              + Dokumen
            </button>
          </div>
          <ol className="mt-3 flex flex-col gap-2 text-sm">
            {legal.map((d, i) => (
              <li key={d.id} className="flex items-center gap-1 rounded-admin border border-admin-line py-0.5 pr-2 pl-1">
                <button type="button" className={iconBtn} disabled={busy || i === 0} onClick={() => void handle(moveLegalDocAction(d.id, -1))}>
                  <ArrowUp aria-hidden="true" size={16} />
                  <span className="sr-only">Naikkan {d.kind}</span>
                </button>
                <button type="button" className={iconBtn} disabled={busy || i === legal.length - 1} onClick={() => void handle(moveLegalDocAction(d.id, 1))}>
                  <ArrowDown aria-hidden="true" size={16} />
                  <span className="sr-only">Turunkan {d.kind}</span>
                </button>
                <span className="min-w-0 flex-1 truncate font-bold">{d.kind}</span>
                {d.kindEn ? <span className="rounded-full bg-admin-info-bg px-2 py-0.5 text-[11px] font-bold text-admin-info-text">EN</span> : null}
                <button type="button" className={linkBtn} onClick={() => setLegalForm(d)}>
                  Edit<span className="sr-only"> {d.kind}</span>
                </button>
                <button
                  type="button"
                  className={`${linkBtn} text-admin-danger`}
                  onClick={() => setConfirm({ title: "Hapus dokumen ini?", description: `“${d.kind}” dihapus dari halaman Asas Legalitas.`, label: "Hapus dokumen", run: () => deleteLegalDocAction(d.id) })}
                >
                  Hapus<span className="sr-only"> {d.kind}</span>
                </button>
              </li>
            ))}
          </ol>
          {legal.length === 0 ? <p className="mt-3 text-sm text-admin-text">Belum ada dokumen.</p> : null}
        </section>
      </div>

      <Dialog open={reportForm !== null} title={reportForm === "new" ? "Tambah laporan" : "Edit laporan"} onClose={() => setReportForm(null)}>
        {reportForm !== null ? (
          <ReportForm
            key={reportForm === "new" ? "new" : reportForm.id}
            report={reportForm === "new" ? null : reportForm}
            themes={themes}
            onCancel={() => setReportForm(null)}
            onSave={async (input) => {
              const done = await handle(reportForm === "new" ? createReportAction(input) : updateReportAction(reportForm.id, input));
              if (done) setReportForm(null);
            }}
          />
        ) : null}
      </Dialog>
      <Dialog open={auditForm !== null} title={auditForm === "new" ? "Tambah audit" : `Audit ${auditForm?.year ?? ""}`} onClose={() => setAuditForm(null)}>
        {auditForm !== null ? (
          <AuditForm
            key={auditForm === "new" ? "new" : auditForm.id}
            audit={auditForm === "new" ? null : auditForm}
            onCancel={() => setAuditForm(null)}
            onSave={async (input) => {
              const done = await handle(saveAuditAction(auditForm === "new" ? null : auditForm.id, input));
              if (done) setAuditForm(null);
            }}
          />
        ) : null}
      </Dialog>
      <Dialog open={legalForm !== null} title={legalForm === "new" ? "Tambah dokumen" : "Edit dokumen"} onClose={() => setLegalForm(null)}>
        {legalForm !== null ? (
          <LegalForm
            key={legalForm === "new" ? "new" : legalForm.id}
            doc={legalForm === "new" ? null : legalForm}
            onCancel={() => setLegalForm(null)}
            onSave={async (input) => {
              const done = await handle(saveLegalDocAction(legalForm === "new" ? null : legalForm.id, input));
              if (done) setLegalForm(null);
            }}
          />
        ) : null}
      </Dialog>
      <ConfirmDialog
        open={confirm !== null}
        title={confirm?.title ?? ""}
        description={confirm?.description}
        confirmLabel={confirm?.label}
        tone="danger"
        busy={busy}
        onConfirm={async () => {
          if (!confirm) return;
          await handle(confirm.run());
          setConfirm(null);
        }}
        onCancel={() => setConfirm(null)}
      />
    </>
  );
}

function Footer({ onCancel, busy, disabled }: { onCancel: () => void; busy: boolean; disabled?: boolean }) {
  return (
    <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
      <button type="button" className={ghostBtn} onClick={onCancel}>
        Batal
      </button>
      <button type="submit" className={primaryBtn} disabled={busy || disabled}>
        {busy ? "Menyimpan…" : "Simpan"}
      </button>
    </div>
  );
}

function ReportForm({
  report,
  themes,
  onSave,
  onCancel,
}: {
  report: AdminReport | null;
  themes: { slug: string; label: string }[];
  onSave: (input: { title: string; year: number; themes: string[]; url: string; coverMediaId: number | null; visible: boolean }) => Promise<void>;
  onCancel: () => void;
}) {
  const id = useId();
  const [v, setV] = useState({
    title: report?.title ?? "",
    year: report?.year ?? new Date().getFullYear(),
    themes: report?.themes ?? [],
    url: report?.url ?? "",
    visible: report?.visible ?? true,
  });
  const [cover, setCover] = useState<{ id: number; url: string } | null>(report?.coverMediaId && report.coverUrl ? { id: report.coverMediaId, url: report.coverUrl } : null);
  const [picking, setPicking] = useState(false);
  const [busy, setBusy] = useState(false);
  const urlOk = /^https:\/\//.test(v.url.trim());

  return (
    <form
      onSubmit={async (e) => {
        e.preventDefault();
        setBusy(true);
        await onSave({ ...v, coverMediaId: cover?.id ?? null });
        setBusy(false);
      }}
      className="flex flex-col gap-4"
    >
      <div>
        <label htmlFor={`${id}-t`} className={labelClass}>
          Judul (seperti tertulis di sampul)
        </label>
        <input id={`${id}-t`} value={v.title} onChange={(e) => setV({ ...v, title: e.target.value })} required maxLength={300} className={`${field} mt-1`} />
      </div>
      <div className="grid gap-3 sm:grid-cols-[8rem_1fr]">
        <div>
          <label htmlFor={`${id}-y`} className={labelClass}>
            Tahun
          </label>
          <input id={`${id}-y`} type="number" min={2000} max={2100} value={v.year} onChange={(e) => setV({ ...v, year: Number(e.target.value) })} required className={`${field} mt-1`} />
        </div>
        <div>
          <label htmlFor={`${id}-u`} className={labelClass}>
            URL Heyzine / hflip / PDF
          </label>
          <input id={`${id}-u`} value={v.url} onChange={(e) => setV({ ...v, url: e.target.value })} inputMode="url" placeholder="https://heyzine.com/flip-book/…" required aria-invalid={v.url && !urlOk ? true : undefined} className={`${field} mt-1`} />
        </div>
      </div>
      <fieldset>
        <legend className={labelClass}>Tema (filter di /e-report/)</legend>
        <div className="mt-1 flex flex-wrap gap-x-4">
          {themes.map((t) => (
            <label key={t.slug} className="flex min-h-11 items-center gap-2 text-sm font-semibold">
              <input
                type="checkbox"
                checked={v.themes.includes(t.slug)}
                onChange={(e) => setV({ ...v, themes: e.target.checked ? [...v.themes, t.slug] : v.themes.filter((x) => x !== t.slug) })}
                className="size-4.5 accent-primary"
              />
              {t.label}
            </label>
          ))}
        </div>
        <p className="text-xs text-admin-text">Tanpa tema, laporan hanya muncul di “Semua”. Daftar tema diatur di section halaman e-Report (menu Halaman).</p>
      </fieldset>
      <div>
        <p className={labelClass}>Sampul</p>
        <div className="mt-1 flex items-center gap-3">
          {cover ? (
            <Image src={mediaUrl(cover.url)} alt="" width={64} height={90} className="h-[90px] w-16 rounded object-cover" />
          ) : (
            <span className="flex h-[90px] w-16 items-center justify-center rounded border border-dashed border-admin-field text-[11px] text-admin-text">Belum ada</span>
          )}
          <button type="button" className={ghostBtn} onClick={() => setPicking(true)}>
            {cover ? "Ganti sampul" : "Pilih sampul"}
          </button>
        </div>
      </div>
      <label className="flex min-h-11 items-center gap-2.5 text-sm font-semibold">
        <input type="checkbox" checked={v.visible} onChange={(e) => setV({ ...v, visible: e.target.checked })} className="size-4.5 accent-primary" />
        Tampilkan di situs
      </label>
      {v.visible && !cover ? <p className="text-[13px] font-semibold text-admin-warn-text">Laporan yang tampil wajib bersampul.</p> : null}
      <Footer onCancel={onCancel} busy={busy} disabled={!urlOk || (v.visible && !cover)} />
      <MediaPicker
        open={picking}
        title="Pilih sampul laporan"
        onClose={() => setPicking(false)}
        onSelect={(m) => {
          setPicking(false);
          setCover({ id: m.id, url: m.url });
        }}
      />
    </form>
  );
}

function AuditForm({ audit, onSave, onCancel }: { audit: AdminAudit | null; onSave: (input: { year: number; opinion: string; documentUrl: string; pdfMediaId: number | null }) => Promise<void>; onCancel: () => void }) {
  const id = useId();
  const [v, setV] = useState({ year: audit?.year ?? new Date().getFullYear(), opinion: audit?.opinion ?? "Wajar Tanpa Pengecualian", documentUrl: audit?.documentUrl ?? "" });
  const [pdf, setPdf] = useState<{ id: number; name: string; url: string } | null>(audit?.pdfMediaId && audit.pdfUrl ? { id: audit.pdfMediaId, name: audit.pdfName ?? "PDF", url: audit.pdfUrl } : null);
  const [busy, setBusy] = useState(false);
  const docOk = !v.documentUrl.trim() || /^https:\/\//.test(v.documentUrl.trim());

  return (
    <form
      onSubmit={async (e) => {
        e.preventDefault();
        setBusy(true);
        await onSave({ ...v, pdfMediaId: pdf?.id ?? null });
        setBusy(false);
      }}
      className="flex flex-col gap-4"
    >
      <div className="grid gap-3 sm:grid-cols-[8rem_1fr]">
        <div>
          <label htmlFor={`${id}-y`} className={labelClass}>
            Tahun
          </label>
          <input id={`${id}-y`} type="number" min={2000} max={2100} value={v.year} onChange={(e) => setV({ ...v, year: Number(e.target.value) })} required className={`${field} mt-1`} />
        </div>
        <div>
          <label htmlFor={`${id}-o`} className={labelClass}>
            Opini auditor
          </label>
          <input id={`${id}-o`} value={v.opinion} onChange={(e) => setV({ ...v, opinion: e.target.value })} maxLength={200} className={`${field} mt-1`} />
        </div>
      </div>
      <fieldset>
        <legend className={labelClass}>PDF laporan audit (disimpan di Vercel Blob)</legend>
        {pdf ? (
          <p className="mt-1 flex flex-wrap items-center gap-2 text-sm">
            <span className="font-semibold break-all">{pdf.name}</span>
            <a href={mediaUrl(pdf.url)} target="_blank" rel="noopener" className={linkBtn}>
              Buka<span className="sr-only"> PDF (tab baru)</span>
            </a>
            <button type="button" className={linkBtn} onClick={() => setPdf(null)}>
              Lepas
            </button>
          </p>
        ) : null}
        <div className="mt-2">
          <MediaDropzone compact only="pdf" onUploaded={(item) => setPdf({ id: item.id, name: item.name, url: item.url })} />
        </div>
        <p className="mt-1 text-xs text-admin-text">PDF yang diunggah menggantikan tautan Google Drive di halaman Audit Keuangan.</p>
      </fieldset>
      <div>
        <label htmlFor={`${id}-d`} className={labelClass}>
          Tautan dokumen (Google Drive) — dipakai bila belum ada PDF
        </label>
        <input id={`${id}-d`} value={v.documentUrl} onChange={(e) => setV({ ...v, documentUrl: e.target.value })} inputMode="url" placeholder="https://drive.google.com/file/d/…/view" aria-invalid={docOk ? undefined : true} className={`${field} mt-1`} />
      </div>
      <Footer onCancel={onCancel} busy={busy} disabled={!docOk || (!pdf && !v.documentUrl.trim())} />
    </form>
  );
}

function LegalForm({ doc, onSave, onCancel }: { doc: AdminLegalDoc | null; onSave: (input: { kind: string; text: string; kindEn: string; textEn: string }) => Promise<void>; onCancel: () => void }) {
  const id = useId();
  const [v, setV] = useState({ kind: doc?.kind ?? "", text: doc?.text ?? "", kindEn: doc?.kindEn ?? "", textEn: doc?.textEn ?? "" });
  const [busy, setBusy] = useState(false);
  return (
    <form
      onSubmit={async (e) => {
        e.preventDefault();
        setBusy(true);
        await onSave(v);
        setBusy(false);
      }}
      className="flex flex-col gap-4"
    >
      <div>
        <label htmlFor={`${id}-k`} className={labelClass}>
          Jenis dokumen
        </label>
        <input id={`${id}-k`} value={v.kind} onChange={(e) => setV({ ...v, kind: e.target.value })} required maxLength={120} placeholder="Akta Pendirian" className={`${field} mt-1`} />
      </div>
      <div>
        <label htmlFor={`${id}-t`} className={labelClass}>
          Teks dokumen
        </label>
        <textarea id={`${id}-t`} value={v.text} onChange={(e) => setV({ ...v, text: e.target.value })} required rows={4} maxLength={2000} className={`${field} mt-1 py-2 leading-normal`} />
      </div>
      <div>
        <label htmlFor={`${id}-ke`} className={labelClass}>
          Jenis dokumen (English, opsional)
        </label>
        <input id={`${id}-ke`} value={v.kindEn} onChange={(e) => setV({ ...v, kindEn: e.target.value })} maxLength={120} className={`${field} mt-1`} />
      </div>
      <div>
        <label htmlFor={`${id}-te`} className={labelClass}>
          Teks dokumen (English, opsional)
        </label>
        <textarea id={`${id}-te`} value={v.textEn} onChange={(e) => setV({ ...v, textEn: e.target.value })} rows={4} maxLength={2000} className={`${field} mt-1 py-2 leading-normal`} />
        <p className="mt-1 text-xs text-admin-text">Kosong = halaman /en/ memakai teks Indonesia.</p>
      </div>
      <Footer onCancel={onCancel} busy={busy} />
    </form>
  );
}
