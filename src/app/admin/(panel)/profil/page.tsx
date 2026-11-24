import type { Metadata } from "next";

import { ProfileForm } from "@/components/admin/profil/ProfileForm";
import { ROLE_LABEL } from "@/components/admin/nav";
import { requireUser } from "@/server/permissions";
import { ownProfile } from "@/server/users-service";

export const metadata: Metadata = { title: "Profil" };

/** Profil akun yang sedang masuk. Semua peran boleh mengubah nama dan password sendiri. */
export default async function ProfilePage() {
  const user = await requireUser();
  const profile = await ownProfile(user);
  return <ProfileForm profile={{ ...profile, roleLabel: ROLE_LABEL[profile.role] }} />;
}
