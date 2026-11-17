import { getDictionary } from "@/i18n/dictionaries";
import { getLocale } from "@/i18n/request";
import { whatsappHref } from "@/lib/site-settings-schema";
import { getSiteSettings } from "@/server/site-settings";

/**
 * Bar bawah lengket di halaman post (mobile saja, artboard "M3 · Detail Post").
 * Tombol melayang "Tanya Saffa" disembunyikan di halaman post agar tidak
 * bertumpuk — lihat aturan `[data-template="post"]` di globals.css.
 * /campaign dilayani aplikasi donasi terpisah, jadi memakai <a> biasa.
 */
export async function PostStickyBar() {
  const t = getDictionary(getLocale()).common;
  const { contact, integrations } = await getSiteSettings();
  return (
    <div
      role="region"
      aria-label={t.quickActions}
      className="post-sticky-bar fixed inset-x-0 bottom-0 z-40 flex gap-2.5 border-t border-border bg-white px-4 pt-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] shadow-[0_-4px_16px_rgba(0,0,0,0.06)] md:hidden"
    >
      {integrations.showSaffa && (
      <a
        href={whatsappHref(contact.whatsapp)}
        target="_blank"
        rel="noopener noreferrer"
        className="flex h-[46px] flex-1 items-center justify-center rounded-lg border-2 border-primary text-sm font-semibold text-primary"
      >
        {t.askSaffa}
      </a>
      )}
      <a
        href={integrations.donateUrl}
        className="flex h-[46px] flex-[1.4] items-center justify-center rounded-lg bg-accent text-sm font-bold text-ink"
      >
        {t.donateNow}
      </a>
    </div>
  );
}
