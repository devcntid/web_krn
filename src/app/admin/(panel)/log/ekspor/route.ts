import { activityCsv, parseActivityFilters } from "@/server/activity-log";
import { requireAbility } from "@/server/permissions";

/** GET /admin/log/ekspor/?… — CSV sesuai filter yang sedang dipakai di /admin/log. */
export async function GET(request: Request) {
  await requireAbility("system.manage");
  const params = Object.fromEntries(new URL(request.url).searchParams);
  const csv = await activityCsv(parseActivityFilters(params));
  const stamp = new Date(Date.now() + 7 * 3_600_000).toISOString().slice(0, 10);
  return new Response(csv, {
    headers: {
      "content-type": "text/csv; charset=utf-8",
      "content-disposition": `attachment; filename="log-aktivitas-${stamp}.csv"`,
      "cache-control": "no-store",
    },
  });
}
