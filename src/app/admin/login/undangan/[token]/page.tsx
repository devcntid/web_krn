import type { Metadata } from "next";
import Link from "next/link";

import { AcceptInviteForm } from "@/components/admin/pengguna/AcceptInviteForm";
import { findValidInvite } from "@/server/users-service";

export const metadata: Metadata = { title: "Terima undangan", robots: { index: false, follow: false } };

const ROLE_LABEL: Record<string, string> = { super_admin: "Super Admin", editor: "Editor", penulis: "Penulis", kontributor: "Kontributor", viewer: "Viewer" };

/** Halaman publik terima undangan (/admin/login/* tidak butuh sesi). Token sekali pakai, berlaku 72 jam. */
export default async function UndanganPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const invite = await findValidInvite(token);
  return (
    <main className="flex min-h-screen items-center justify-center px-4 py-12">
      <div className="flex w-full max-w-110 flex-col gap-4.5 rounded-2xl bg-white p-6 shadow-admin-card sm:p-10">
        <h1 className="text-[26px] font-extrabold text-admin-ink">{invite ? "Buat akun Anda" : "Undangan tidak berlaku"}</h1>
        {invite ? (
          <>
            <p className="text-sm text-admin-text">
              Anda diundang ke Admin CMS Relawan Nusantara sebagai <strong className="text-admin-ink">{ROLE_LABEL[invite.role] ?? invite.role}</strong> dengan email{" "}
              <strong className="break-all text-admin-ink">{invite.email}</strong>.
            </p>
            <AcceptInviteForm token={token} email={invite.email} needsTotp={invite.role === "super_admin" || invite.role === "editor"} />
          </>
        ) : (
          <>
            <p className="text-sm text-admin-text">Tautan ini sudah kedaluwarsa, sudah dipakai, atau dibatalkan. Minta Super Admin mengirim undangan baru.</p>
            <Link href="/admin/login/" className="inline-flex min-h-11 items-center justify-center rounded-admin bg-primary px-4.5 text-sm font-extrabold text-white hover:bg-admin-primary-dark focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary">
              Ke halaman masuk
            </Link>
          </>
        )}
      </div>
    </main>
  );
}
