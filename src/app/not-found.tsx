import type { Metadata } from "next";

import { SiteShell } from "@/components/layout/SiteShell";
import { NotFoundContent } from "@/components/templates/NotFoundContent";

export const metadata: Metadata = {
  title: "Halaman tidak ditemukan",
  robots: { index: false },
};

/**
 * 404 untuk URL yang tidak cocok dengan route mana pun. Dirender di root layout
 * (tanpa kerangka situs), jadi kerangkanya dipasang di sini.
 */
export default function NotFound() {
  return (
    <SiteShell>
      <NotFoundContent />
    </SiteShell>
  );
}
