import { Card } from "@/components/admin/Card";
import type { Ga4Summary } from "@/server/ga4";

const num = new Intl.NumberFormat("id-ID");
const dayFmt = new Intl.DateTimeFormat("id-ID", { day: "numeric", month: "short", timeZone: "UTC" });
const longFmt = new Intl.DateTimeFormat("id-ID", { weekday: "long", day: "numeric", month: "long", timeZone: "UTC" });

/** Kartu "Pengunjung 30 hari": grafik batang sesi harian (satu seri, hijau brand) + tiga angka. */
export function VisitorsCard({ data }: { data: Ga4Summary }) {
  const stats: [string, number | null][] =
    data.status === "ok"
      ? [
          ["Sesi", data.sessions],
          ["Klik Donasi", data.donateClicks],
          ["Klik WhatsApp", data.whatsappClicks],
        ]
      : [
          ["Sesi", null],
          ["Klik Donasi", null],
          ["Klik WhatsApp", null],
        ];

  return (
    <Card title="Pengunjung 30 hari" actions={<span className="text-xs text-admin-text">Sumber: Google Analytics 4</span>}>
      {data.status === "ok" ? (
        <SessionsChart daily={data.daily} />
      ) : (
        <p className="flex h-[220px] flex-col items-center justify-center gap-1 rounded-admin border border-dashed border-admin-field bg-admin-canvas px-4 text-center text-[13px] font-semibold text-admin-text">
          {data.status === "unconfigured" ? (
            <>
              <span>Google Analytics 4 belum dihubungkan.</span>
              <span className="font-normal">Isi GA4_PROPERTY_ID, GA4_CLIENT_EMAIL, dan GA4_PRIVATE_KEY di environment (lihat .env.example).</span>
            </>
          ) : (
            <>
              <span>Data GA4 gagal dimuat.</span>
              <span className="font-normal break-words">{data.message}</span>
            </>
          )}
        </p>
      )}
      <dl className="mt-4 grid grid-cols-3 gap-3">
        {stats.map(([label, value]) => (
          <div key={label}>
            <dt className="text-xs text-admin-text">{label}</dt>
            <dd className="mt-0.5 text-lg font-extrabold text-admin-ink">
              {value === null ? (
                <>
                  <span aria-hidden="true">—</span>
                  <span className="sr-only">Belum ada data</span>
                </>
              ) : (
                num.format(value)
              )}
            </dd>
          </div>
        ))}
      </dl>
    </Card>
  );
}

const H = 180;
const PAD_TOP = 8;

function SessionsChart({ daily }: { daily: { date: string; sessions: number }[] }) {
  const max = Math.max(1, ...daily.map((d) => d.sessions));
  // Skala atas dibulatkan agar garis bantu jatuh di angka rapi.
  const step = 10 ** Math.floor(Math.log10(max));
  const top = Math.ceil(max / step) * step;
  const n = daily.length;
  const slot = 100 / n;
  const label = (iso: string) => dayFmt.format(new Date(`${iso}T00:00:00Z`));
  return (
    <figure>
      <div className="relative h-[220px]">
        {/* Garis bantu & label sumbu (resesif). */}
        <div className="pointer-events-none absolute inset-x-0 top-0" style={{ height: H }} aria-hidden="true">
          {[1, 0.5, 0].map((f) => (
            <div key={f} className="absolute inset-x-0 flex -translate-y-1/2 items-center gap-2" style={{ top: PAD_TOP + (1 - f) * (H - PAD_TOP) }}>
              <span className="w-8 shrink-0 text-right text-[11px] leading-4 text-admin-text">{num.format(Math.round(top * f))}</span>
              <span className={`h-px flex-1 ${f === 0 ? "bg-admin-field" : "bg-admin-line"}`} />
            </div>
          ))}
        </div>
        <div className="absolute top-0 right-0 left-10 flex items-end" style={{ height: H }} role="img" aria-label={`Sesi harian 30 hari terakhir, tertinggi ${num.format(max)} sesi`}>
          {daily.map((d) => {
            const h = d.sessions ? Math.max(2, (d.sessions / top) * (H - PAD_TOP)) : 0;
            return (
              <div key={d.date} className="group relative flex h-full items-end justify-center px-px" style={{ width: `${slot}%` }}>
                <div className="w-full max-w-6 rounded-t bg-primary transition-opacity group-hover:opacity-80" style={{ height: h }} />
                {/* Tooltip per batang; seluruh kolom menjadi area hover. */}
                <div className="pointer-events-none absolute bottom-full left-1/2 z-10 mb-1 hidden -translate-x-1/2 rounded-md bg-admin-sidebar px-2 py-1 text-[11px] whitespace-nowrap text-white shadow-admin-card group-hover:block">
                  {longFmt.format(new Date(`${d.date}T00:00:00Z`))}: <b>{num.format(d.sessions)}</b> sesi
                </div>
              </div>
            );
          })}
        </div>
        <div className="absolute right-0 bottom-0 left-10 flex justify-between text-[11px] text-admin-text" aria-hidden="true">
          <span>{label(daily[0]!.date)}</span>
          <span>{label(daily[Math.floor(n / 2)]!.date)}</span>
          <span>{label(daily[n - 1]!.date)}</span>
        </div>
      </div>
      <table className="sr-only">
        <caption>Sesi harian 30 hari terakhir</caption>
        <thead>
          <tr>
            <th scope="col">Tanggal</th>
            <th scope="col">Sesi</th>
          </tr>
        </thead>
        <tbody>
          {daily.map((d) => (
            <tr key={d.date}>
              <td>{longFmt.format(new Date(`${d.date}T00:00:00Z`))}</td>
              <td>{num.format(d.sessions)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </figure>
  );
}
