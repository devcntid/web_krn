import { AdminShell } from "@/components/admin/AdminShell";
import { ROLE_LABEL, navForRole } from "@/components/admin/nav";
import { can, requireUser } from "@/server/permissions";
import { countPostsInReview } from "@/server/repos/admin";

import { logout } from "./actions";

/** Shell admin (sidebar + topbar) untuk semua halaman /admin kecuali /admin/login. */
export default async function PanelLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const user = await requireUser();
  const review = can(user, "content.review") ? await countPostsInReview() : 0;
  const nav = navForRole((ability) => can(user, ability), {
    publikasi: review,
  });
  return (
    <AdminShell
      nav={nav}
      user={{
        name: user.name ?? user.email,
        email: user.email,
        roleLabel: ROLE_LABEL[user.role],
      }}
      logoutAction={logout}
    >
      {children}
    </AdminShell>
  );
}
