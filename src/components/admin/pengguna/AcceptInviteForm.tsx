"use client";

import Link from "next/link";
import { useId, useState } from "react";

import { acceptInviteAction } from "@/app/admin/login/undangan/[token]/actions";

const field = "min-h-11 w-full rounded-admin border border-admin-field bg-white px-3 text-sm text-admin-ink focus-visible:outline-2 focus-visible:outline-primary";
const labelClass = "text-xs font-bold text-admin-text";

export function AcceptInviteForm({ token, email, needsTotp }: { token: string; email: string; needsTotp: boolean }) {
  const id = useId();
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const mismatch = confirm.length > 0 && confirm !== password;

  if (done) {
    return (
      <div className="flex flex-col gap-3">
        <p role="status" className="rounded-admin bg-admin-ok-bg p-3 text-sm font-semibold text-admin-primary-dark">
          Akun dibuat.{needsTotp ? " Saat masuk pertama, Anda akan diminta memindai kode QR untuk verifikasi dua langkah." : ""}
        </p>
        <Link href="/admin/login/" className="inline-flex min-h-11 items-center justify-center rounded-admin bg-primary px-4.5 text-sm font-extrabold text-white hover:bg-admin-primary-dark focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary">
          Masuk sekarang
        </Link>
      </div>
    );
  }

  return (
    <form
      onSubmit={async (e) => {
        e.preventDefault();
        if (mismatch) return;
        setBusy(true);
        setError(null);
        try {
          const result = await acceptInviteAction(token, name, password);
          if (result.ok) setDone(true);
          else setError(result.error);
        } catch {
          setError("Gagal membuat akun. Coba lagi.");
        } finally {
          setBusy(false);
        }
      }}
      className="flex flex-col gap-3.5"
    >
      <input type="email" autoComplete="username" value={email} readOnly hidden />
      <div>
        <label htmlFor={`${id}-n`} className={labelClass}>
          Nama lengkap
        </label>
        <input id={`${id}-n`} value={name} onChange={(e) => setName(e.target.value)} required maxLength={120} autoComplete="name" className={`${field} mt-1`} />
      </div>
      <div>
        <label htmlFor={`${id}-p`} className={labelClass}>
          Password (minimal 12 karakter)
        </label>
        <input id={`${id}-p`} type="password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={12} maxLength={200} autoComplete="new-password" className={`${field} mt-1`} />
      </div>
      <div>
        <label htmlFor={`${id}-c`} className={labelClass}>
          Ulangi password
        </label>
        <input id={`${id}-c`} type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} required autoComplete="new-password" aria-invalid={mismatch ? true : undefined} aria-describedby={mismatch ? `${id}-m` : undefined} className={`${field} mt-1`} />
        {mismatch ? (
          <p id={`${id}-m`} className="mt-1 text-xs font-semibold text-admin-danger">
            Password tidak sama.
          </p>
        ) : null}
      </div>
      {error ? (
        <p role="alert" className="rounded-admin border border-admin-danger bg-admin-danger-bg p-3 text-sm font-semibold text-admin-danger">
          {error}
        </p>
      ) : null}
      <button type="submit" disabled={busy || mismatch} className="min-h-11 rounded-admin bg-primary px-4.5 text-sm font-extrabold text-white hover:bg-admin-primary-dark focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary disabled:opacity-60">
        {busy ? "Membuat akun…" : "Buat akun"}
      </button>
    </form>
  );
}
