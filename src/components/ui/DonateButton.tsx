import { site } from "@/config/site";

/**
 * Tombol "Donasi" → /campaign (aplikasi donasi terpisah). Pakai <a> biasa,
 * bukan next/link, karena /campaign bukan bagian dari aplikasi ini.
 */
export function DonateButton({ variant = "accent" }: { variant?: "accent" | "primary" }) {
  const color = variant === "accent" ? "bg-accent text-ink" : "bg-primary text-white";
  return (
    <a
      href={site.donateUrl}
      data-donate={variant}
      className={`${color} donate-btn inline-flex items-center rounded-[5px] px-5 py-[7px] text-[13px] leading-[22px] font-bold transition-opacity hover:opacity-90`}
    >
      Donasi
    </a>
  );
}
