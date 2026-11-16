import type { Metadata } from "next";

import { Card } from "@/components/admin/Card";
import { PageHeader } from "@/components/admin/PageHeader";
import { ROLE_LABEL } from "@/components/admin/nav";
import { ROLE_ABILITIES, requireUser } from "@/server/permissions";

export const metadata: Metadata = { title: "Dasbor" };

/** Dasbor sementara: identitas pengguna. Dasbor lengkap dibangun di B5. */
export default async function AdminHome() {
  const user = await requireUser();
  const abilities = ROLE_ABILITIES[user.role];
  return (
    <>
      <PageHeader
        title={`Selamat datang, ${user.name ?? user.email}`}
        description="Dasbor lengkap hadir di langkah berikutnya (B5)."
      />
      <Card title="Akun Anda">
        <dl className="grid gap-3 text-sm sm:grid-cols-[max-content_1fr] sm:gap-x-6">
          <dt className="font-bold text-admin-text">Email</dt>
          <dd>{user.email}</dd>
          <dt className="font-bold text-admin-text">Peran</dt>
          <dd>{ROLE_LABEL[user.role]}</dd>
          <dt className="font-bold text-admin-text">Kemampuan</dt>
          <dd>{abilities.length ? abilities.join(", ") : "hanya melihat"}</dd>
        </dl>
      </Card>
    </>
  );
}
