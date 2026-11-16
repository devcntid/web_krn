import type { Metadata } from "next";

import { signOut } from "@/server/auth";
import { ROLE_ABILITIES, requireUser } from "@/server/permissions";

export const metadata: Metadata = { title: "Dasbor" };

const ROLE_LABEL = {
  super_admin: "Super Admin",
  editor: "Editor",
  penulis: "Penulis",
  kontributor: "Kontributor",
  viewer: "Viewer",
} as const;

export default async function AdminHome() {
  const user = await requireUser();

  async function logout() {
    "use server";
    await signOut({ redirectTo: "/admin/login/" });
  }

  return (
    <main className="mx-auto max-w-xl rounded-lg border border-border bg-white p-6">
      <h1 className="text-2xl font-bold text-ink-900">Admin Relawan Nusantara</h1>
      <p className="mt-4">
        Masuk sebagai <strong>{user.name ?? user.email}</strong> ({user.email})
      </p>
      <p className="mt-1">
        Peran: <strong>{ROLE_LABEL[user.role]}</strong>
      </p>
      <p className="mt-1 text-sm text-body-soft">
        Kemampuan: {ROLE_ABILITIES[user.role].length ? ROLE_ABILITIES[user.role].join(", ") : "hanya melihat"}
      </p>
      <form action={logout} className="mt-6">
        <button type="submit" className="min-h-11 rounded-md bg-primary px-4 font-semibold text-white hover:bg-primary-500">
          Keluar
        </button>
      </form>
    </main>
  );
}
