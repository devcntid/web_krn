/**
 * Tombol "Donasi" → tautan dari /admin/pengaturan (bawaan /campaign, aplikasi donasi terpisah). Pakai <a> biasa,
 * bukan next/link, karena /campaign bukan bagian dari aplikasi ini. Selalu kuning (accent) di semua template.
 */
export function DonateButton({ href, label = "Donasi" }: { href: string; label?: string }) {
  return (
    <a
      href={href}
      className="donate-btn inline-flex items-center rounded-[5px] bg-accent px-5 py-[7px] text-[13px] leading-[22px] font-bold text-ink transition-opacity hover:opacity-90"
    >
      {label}
    </a>
  );
}
