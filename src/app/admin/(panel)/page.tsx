import type { Metadata } from "next";
import Link from "next/link";

import { Card } from "@/components/admin/Card";
import { PageHeader } from "@/components/admin/PageHeader";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { VisitorsCard } from "@/components/admin/dashboard/VisitorsCard";
import { getGa4Summary } from "@/server/ga4";
import { type Ability, can, requireUser } from "@/server/permissions";
import {
  getDashboardSummary,
  getDashboardTodos,
  listRecentPosts,
} from "@/server/repos/dashboard";

export const metadata: Metadata = { title: "Dashboard" };

const TZ = "Asia/Jakarta";
const num = new Intl.NumberFormat("id-ID");
const todayFmt = new Intl.DateTimeFormat("id-ID", {
  timeZone: TZ,
  weekday: "long",
  day: "numeric",
  month: "long",
  year: "numeric",
});
const rowDateFmt = new Intl.DateTimeFormat("id-ID", {
  timeZone: TZ,
  day: "2-digit",
  month: "short",
  year: "numeric",
});

const textLink =
  "inline-flex min-h-11 items-center rounded px-1 text-[13px] font-bold text-primary hover:text-admin-primary-dark focus-visible:outline-2 focus-visible:outline-primary";

type Todo = {
  tag: string;
  tagClass: string;
  text: string;
  href: string;
  /** Kemampuan untuk membuka halaman tujuan; null = semua peran. */
  ability: Ability | null;
};

/** Dasbor admin (artboard "A1 · Dashboard"). */
export default async function AdminDashboard() {
  const user = await requireUser();
  const [summary, todo, recent, visitors] = await Promise.all([
    getDashboardSummary(),
    getDashboardTodos(),
    listRecentPosts(5),
    getGa4Summary(),
  ]);

  const kpis = [
    {
      label: "Publikasi",
      value: num.format(summary.posts.total),
      note: `Artikel ${num.format(summary.posts.artikel)} · Berita ${num.format(summary.posts.berita)}`,
    },
    {
      label: "Halaman",
      value: num.format(summary.pages.total),
      note: `${num.format(summary.pages.published)} terbit · ${num.format(summary.pages.draft)} draf`,
    },
    {
      label: "File media",
      value: num.format(summary.media.total),
      note: `${num.format(summary.media.legacy)} hasil migrasi · ${num.format(summary.media.blob)} unggahan baru`,
    },
    {
      label: "Kategori / Tag",
      value: `${num.format(summary.taxonomy.categories)} / ${num.format(summary.taxonomy.tags)}`,
      note: `${num.format(summary.taxonomy.unusedTags)} tag tanpa publikasi`,
    },
  ];

  const todos: Todo[] = [
    {
      tag: "REVIEW",
      tagClass: "bg-admin-warn-bg text-admin-warn-text",
      text: `${num.format(todo.review)} publikasi menunggu review`,
      href: "/admin/publikasi/?status=review",
      ability: null,
    },
    {
      tag: "SEO",
      tagClass: "bg-admin-info-bg text-admin-info-text",
      text: `${num.format(todo.missingDescription)} publikasi tanpa meta description`,
      href: "/admin/seo/",
      ability: "seo.manage",
    },
    {
      tag: "MEDIA",
      tagClass: "bg-admin-danger-bg text-admin-danger",
      text: `${num.format(todo.missingAlt)} gambar tanpa teks alt`,
      href: "/admin/media/?alt=kosong",
      ability: "media.manage",
    },
    {
      tag: "404",
      tagClass: "bg-admin-neutral-bg text-admin-neutral-text",
      text: `${num.format(todo.unresolved404)} URL lama tanpa redirect`,
      href: "/admin/seo/",
      ability: "seo.manage",
    },
  ];

  return (
    <>
      <PageHeader
        title={`Selamat datang, ${user.name ?? user.email}`}
        description={todayFmt.format(new Date())}
        actions={
          <>
            {can(user, "draft.write") ? (
              <Link
                href="/admin/publikasi/baru/"
                className="inline-flex min-h-11 items-center rounded-admin bg-primary px-4.5 text-sm font-extrabold text-white hover:bg-admin-primary-dark focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
              >
                + Tulis Publikasi
              </Link>
            ) : null}
            <Link
              href="/"
              target="_blank"
              rel="noopener"
              className="inline-flex min-h-11 items-center rounded-admin border border-admin-field bg-white px-4.5 text-sm font-bold text-admin-ink hover:bg-admin-row-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
            >
              Lihat Situs <span aria-hidden="true">&nbsp;↗</span>
              <span className="sr-only"> (tab baru)</span>
            </Link>
          </>
        }
      />

      <section aria-label="Ringkasan konten">
        <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {kpis.map((k) => (
            <div
              key={k.label}
              className="flex flex-col rounded-xl border border-admin-line bg-white p-5"
            >
              <dt className="text-[13px] font-bold text-admin-text">
                {k.label}
              </dt>
              <dd className="mt-2 text-[32px] leading-tight font-extrabold text-admin-ink">
                {k.value}
              </dd>
              <dd className="mt-1 text-xs text-admin-text">{k.note}</dd>
            </div>
          ))}
        </dl>
      </section>

      <div className="grid gap-5 lg:grid-cols-[1.6fr_1fr]">
        <VisitorsCard data={visitors} />

        <Card title="Menunggu tindakan">
          <ul className="flex flex-col gap-2.5">
            {todos.map((t) => (
              <li
                key={t.tag}
                className="flex items-center gap-3 rounded-admin bg-admin-canvas px-3 py-1"
              >
                <span
                  className={`rounded-md px-2 py-1 text-[11px] font-extrabold ${t.tagClass}`}
                >
                  {t.tag}
                </span>
                <span className="flex-1 py-2 text-sm font-semibold text-admin-ink">
                  {t.text}
                </span>
                {t.ability === null || can(user, t.ability) ? (
                  <Link href={t.href} className={textLink}>
                    Buka
                    <span className="sr-only">: {t.text}</span>
                  </Link>
                ) : null}
              </li>
            ))}
          </ul>
        </Card>
      </div>

      <Card
        title="Publikasi terbaru"
        actions={
          <Link href="/admin/publikasi/" className={textLink}>
            Lihat semua<span className="sr-only"> publikasi</span>
          </Link>
        }
      >
        {recent.length === 0 ? (
          <p className="py-6 text-center text-sm text-admin-text">
            Belum ada publikasi.
          </p>
        ) : (
          <div className="relative overflow-x-auto">
            <table className="w-full min-w-[680px] border-collapse text-sm">
              <caption className="sr-only">Lima publikasi terbaru</caption>
              <thead>
                <tr className="text-left text-xs tracking-[.06em] text-admin-text uppercase">
                  {["Judul", "Kategori", "Penulis", "Status", "Tanggal"].map(
                    (h) => (
                      <th
                        key={h}
                        scope="col"
                        className="px-2 py-2.5 font-extrabold"
                      >
                        {h}
                      </th>
                    ),
                  )}
                </tr>
              </thead>
              <tbody>
                {recent.map((p) => (
                  <tr key={p.id} className="border-t border-admin-line">
                    <th scope="row" className="px-2 py-1 text-left font-bold">
                      <Link
                        href={`/admin/publikasi/${p.id}/`}
                        className="inline-flex min-h-11 items-center rounded text-admin-ink hover:text-primary focus-visible:outline-2 focus-visible:outline-primary"
                      >
                        {p.title}
                      </Link>
                    </th>
                    <td className="px-2 py-3">{p.category ?? "—"}</td>
                    <td className="px-2 py-3">{p.author ?? "—"}</td>
                    <td className="px-2 py-3">
                      <StatusBadge status={p.status} />
                    </td>
                    <td className="px-2 py-3 whitespace-nowrap text-admin-text">
                      {p.publishedAt ? rowDateFmt.format(p.publishedAt) : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </>
  );
}
