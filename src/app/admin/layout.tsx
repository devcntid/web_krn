import type { Metadata } from "next";

export const metadata: Metadata = {
  title: { default: "Admin", template: "%s - Admin" },
  robots: { index: false, follow: false },
};

/** Akar admin: hanya font & warna dasar. Shell (sidebar) ada di (panel)/layout.tsx; login tanpa shell. */
export default function AdminLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <div data-admin-root className="min-h-screen bg-admin-canvas font-manrope text-admin-ink">
      {children}
    </div>
  );
}
