import type { Metadata } from "next";

export const metadata: Metadata = {
  title: { default: "Admin", template: "%s - Admin" },
  robots: { index: false, follow: false },
};

/** Kerangka minimal admin (B3). Shell lengkap dibangun di B4. */
export default function AdminLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <div className="min-h-screen bg-surface-alt px-4 py-10 font-manrope text-body">{children}</div>;
}
