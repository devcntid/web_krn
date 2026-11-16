import type { Metadata } from "next";

import { NotFoundContent } from "@/components/templates/NotFoundContent";

export const metadata: Metadata = {
  title: "Halaman tidak ditemukan",
  robots: { index: false },
};

/** 404 untuk notFound() yang dipanggil route publik — kerangka berasal dari layout (site). */
export default function NotFound() {
  return <NotFoundContent />;
}
