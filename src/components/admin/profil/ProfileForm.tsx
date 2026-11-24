"use client";

import { useRouter } from "next/navigation";
import { useId, useState, useTransition } from "react";

import { updateProfileAction } from "@/app/admin/(panel)/profil/actions";
import { Card } from "@/components/admin/Card";
import { PageHeader } from "@/components/admin/PageHeader";
import { useToast } from "@/components/admin/Toast";

const labelClass = "text-xs font-bold text-admin-text";
const field =
  "mt-1 min-h-11 w-full rounded-admin border border-admin-field bg-white px-3 text-sm text-admin-ink focus-visible:outline-2 focus-visible:outline-primary disabled:bg-admin-canvas";
const primaryBtn =
  "inline-flex min-h-11 items-center justify-center rounded-admin bg-primary px-4.5 text-sm font-extrabold text-white hover:bg-admin-primary-dark focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary disabled:opacity-60";

export function ProfileForm({
  profile,
}: {
  profile: { name: string; email: string; roleLabel: string; hasPassword: boolean; totpEnabled: boolean };
}) {
  const id = useId();
  const router = useRouter();
  const toast = useToast();
  const [pending, startTransition] = useTransition();
  const [name, setName] = useState(profile.name);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const mismatch = confirmPassword.length > 0 && confirmPassword !== newPassword;

  const save = () => {
    if (mismatch) return;
    setError("");
    startTransition(async () => {
      const result = await updateProfileAction({ name, currentPassword, newPassword, confirmPassword });
      if (!result.ok) {
        setError(result.error);
        toast.show(result.error, "error");
        return;
      }
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      toast.show(result.message, "success");
      router.refresh();
    });
  };

  return (
    <div className="space-y-5">
      <PageHeader
        title="Profil"
        description="Nama dan password akun Anda. Email serta peran hanya bisa diubah oleh Super Admin."
        actions={
          <button type="button" className={primaryBtn} onClick={save} disabled={pending || mismatch}>
            {pending ? "Menyimpan…" : "Simpan"}
          </button>
        }
      />
      {error ? (
        <p role="alert" className="rounded-admin border border-admin-danger bg-white px-4 py-3 text-sm font-semibold text-admin-danger">
          {error}
        </p>
      ) : null}

      <div className="grid gap-5 xl:grid-cols-2">
        <Card title="Akun">
          <div className="space-y-4">
            <div>
              <label htmlFor={`${id}-name`} className={labelClass}>
                Nama
              </label>
              <input id={`${id}-name`} value={name} onChange={(event) => setName(event.target.value)} required maxLength={120} autoComplete="name" className={field} />
            </div>
            <div>
              <label htmlFor={`${id}-email`} className={labelClass}>
                Email
              </label>
              <input id={`${id}-email`} value={profile.email} readOnly autoComplete="username" className={field} />
            </div>
            <div>
              <p className={labelClass}>Peran</p>
              <p className="mt-1 text-sm font-bold text-admin-ink">{profile.roleLabel}</p>
            </div>
            <p className="text-sm text-admin-text">Verifikasi dua langkah: {profile.totpEnabled ? "aktif" : "belum aktif"}.</p>
          </div>
        </Card>

        <Card title="Password">
          <div className="space-y-4">
            <p className="text-sm text-admin-text">
              {profile.hasPassword
                ? "Kosongkan bila Anda hanya mengubah nama. Password baru minimal 12 karakter."
                : "Akun ini belum punya password. Isi password baru bila Anda juga ingin masuk dengan email."}
            </p>
            {profile.hasPassword ? (
              <div>
                <label htmlFor={`${id}-current`} className={labelClass}>
                  Password saat ini
                </label>
                <input
                  id={`${id}-current`}
                  type="password"
                  value={currentPassword}
                  onChange={(event) => setCurrentPassword(event.target.value)}
                  autoComplete="current-password"
                  maxLength={200}
                  className={field}
                />
              </div>
            ) : null}
            <div>
              <label htmlFor={`${id}-new`} className={labelClass}>
                Password baru
              </label>
              <input
                id={`${id}-new`}
                type="password"
                value={newPassword}
                onChange={(event) => setNewPassword(event.target.value)}
                autoComplete="new-password"
                minLength={newPassword ? 12 : undefined}
                maxLength={200}
                className={field}
              />
            </div>
            <div>
              <label htmlFor={`${id}-confirm`} className={labelClass}>
                Ulangi password baru
              </label>
              <input
                id={`${id}-confirm`}
                type="password"
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
                autoComplete="new-password"
                aria-invalid={mismatch ? true : undefined}
                aria-describedby={mismatch ? `${id}-mismatch` : undefined}
                maxLength={200}
                className={field}
              />
              {mismatch ? (
                <p id={`${id}-mismatch`} className="mt-1 text-xs font-semibold text-admin-danger">
                  Password tidak sama.
                </p>
              ) : null}
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
