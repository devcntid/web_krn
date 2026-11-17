"use client";

import { Check, Minus } from "lucide-react";
import { useRouter } from "next/navigation";
import { useId, useState } from "react";

import { changeRoleAction, deleteUserAction, inviteUserAction, resetTotpAction, revokeInviteAction, setDisabledAction } from "@/app/admin/(panel)/pengguna/actions";
import { ConfirmDialog } from "@/components/admin/ConfirmDialog";
import { Dialog } from "@/components/admin/Dialog";
import { PageHeader } from "@/components/admin/PageHeader";
import { useToast } from "@/components/admin/Toast";
import type { AbilityRow, AdminUser, PendingInvite, UserRole, UsersResult } from "@/types/admin-users";

const ROLE_LABEL: Record<UserRole, string> = { super_admin: "Super Admin", editor: "Editor", penulis: "Penulis", kontributor: "Kontributor", viewer: "Viewer" };
const ROLES = Object.keys(ROLE_LABEL) as UserRole[];
const dateFmt = new Intl.DateTimeFormat("id-ID", { timeZone: "Asia/Jakarta", day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
const card = "rounded-xl border border-admin-line bg-white";
const field = "min-h-11 w-full rounded-admin border border-admin-field bg-white px-3 text-sm text-admin-ink focus-visible:outline-2 focus-visible:outline-primary";
const labelClass = "text-xs font-bold text-admin-text";
const primaryBtn =
  "inline-flex min-h-11 items-center justify-center rounded-admin bg-primary px-4.5 text-sm font-extrabold text-white hover:bg-admin-primary-dark focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary disabled:opacity-60";
const ghostBtn =
  "inline-flex min-h-11 items-center justify-center rounded-admin border border-admin-field bg-white px-3.5 text-sm font-bold text-admin-ink hover:bg-admin-canvas focus-visible:outline-2 focus-visible:outline-primary disabled:opacity-50";
const linkBtn = "inline-flex min-h-11 items-center rounded px-1.5 text-[13px] font-bold text-primary hover:text-admin-primary-dark focus-visible:outline-2 focus-visible:outline-primary disabled:text-admin-text disabled:opacity-60";

type Confirm = { title: string; description: string; label: string; danger: boolean; run: () => Promise<UsersResult> };

/** Pengguna & Peran (artboard "A10"). Hanya Super Admin. */
export function UsersManager({ users, invites, matrix }: { users: AdminUser[]; invites: PendingInvite[]; matrix: AbilityRow[] }) {
  const router = useRouter();
  const toast = useToast();
  const [inviting, setInviting] = useState(false);
  const [confirm, setConfirm] = useState<Confirm | null>(null);
  const [busy, setBusy] = useState(false);
  const activeSupers = users.filter((u) => u.role === "super_admin" && !u.disabled).length;

  const run = async (p: Promise<UsersResult>) => {
    setBusy(true);
    try {
      const result = await p;
      toast.show(result.ok ? result.message : result.error, result.ok ? "success" : "error");
      if (result.ok) router.refresh();
      return result;
    } catch {
      toast.show("Gagal. Coba lagi.", "error");
      return null;
    } finally {
      setBusy(false);
    }
  };
  const lastSuper = (u: AdminUser) => u.role === "super_admin" && !u.disabled && activeSupers <= 1;

  return (
    <>
      <PageHeader
        title="Pengguna & Peran"
        description="Atur siapa yang bisa menulis, meninjau, dan menerbitkan."
        actions={
          <button type="button" className={primaryBtn} onClick={() => setInviting(true)}>
            + Undang Pengguna
          </button>
        }
      />

      <section aria-labelledby="users-h" className={`${card} overflow-hidden`}>
        <h2 id="users-h" className="border-b border-admin-line px-4.5 py-3 text-[17px] font-extrabold text-admin-ink">
          Pengguna ({users.length})
        </h2>
        <div className="relative overflow-x-auto">
          <table className="w-full min-w-[860px] border-collapse text-sm">
            <caption className="sr-only">Pengguna admin, peran, status 2FA, dan aktivitas terakhir</caption>
            <thead>
              <tr className="text-left text-xs tracking-[.06em] text-admin-text uppercase">
                {["Pengguna", "Peran", "2FA", "Terakhir aktif"].map((h) => (
                  <th key={h} scope="col" className="px-4.5 py-3 font-extrabold">
                    {h}
                  </th>
                ))}
                <th scope="col" className="px-4.5 py-3 text-right font-extrabold">
                  Kelola
                </th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id} className={`border-t border-admin-line ${u.disabled ? "bg-admin-canvas text-admin-text" : "hover:bg-admin-row-hover"}`}>
                  <th scope="row" className="px-4.5 py-2 text-left">
                    <span className="block font-extrabold text-admin-ink">
                      {u.name || "(tanpa nama)"}
                      {u.isSelf ? <span className="ml-2 text-xs font-semibold text-admin-text">(Anda)</span> : null}
                      {u.disabled ? <span className="ml-2 rounded-full bg-admin-neutral-bg px-2 py-0.5 text-[11px] font-bold text-admin-neutral-text">Nonaktif</span> : null}
                    </span>
                    <span className="block text-xs font-normal break-all text-admin-text">{u.email}</span>
                  </th>
                  <td className="px-4.5 py-1">
                    <label className="sr-only" htmlFor={`role-${u.id}`}>
                      Peran {u.email}
                    </label>
                    <select
                      id={`role-${u.id}`}
                      value={u.role}
                      disabled={busy || u.disabled}
                      onChange={(e) => {
                        const role = e.target.value as UserRole;
                        if (lastSuper(u) && role !== "super_admin") {
                          toast.show("Tidak bisa menurunkan peran Super Admin aktif terakhir.", "error");
                          e.target.value = u.role;
                          return;
                        }
                        void run(changeRoleAction(u.id, role));
                      }}
                      className="min-h-11 rounded-admin border border-admin-field bg-white px-2.5 text-sm font-semibold focus-visible:outline-2 focus-visible:outline-primary disabled:bg-admin-canvas"
                    >
                      {ROLES.map((r) => (
                        <option key={r} value={r}>
                          {ROLE_LABEL[r]}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="px-4.5 py-2">
                    {u.totpEnabled ? (
                      <span className="rounded-full bg-admin-ok-bg px-2.5 py-1 text-xs font-extrabold text-admin-primary-dark">Aktif</span>
                    ) : u.totpRequired ? (
                      <span className="rounded-full bg-admin-warn-bg px-2.5 py-1 text-xs font-extrabold text-admin-warn-text">Wajib, belum daftar</span>
                    ) : (
                      <span className="text-xs text-admin-text">Tidak wajib</span>
                    )}
                  </td>
                  <td className="px-4.5 py-2 whitespace-nowrap text-admin-text">{u.lastActiveAt ? dateFmt.format(new Date(u.lastActiveAt)) : "Belum pernah"}</td>
                  <td className="px-4.5 py-1 text-right whitespace-nowrap">
                    <button
                      type="button"
                      className={linkBtn}
                      disabled={busy || !u.totpEnabled}
                      onClick={() => setConfirm({ title: `Reset 2FA ${u.email}?`, description: "Aplikasi autentikatornya tidak berlaku lagi; ia mendaftarkan ulang saat masuk berikutnya.", label: "Reset 2FA", danger: false, run: () => resetTotpAction(u.id) })}
                    >
                      Reset 2FA<span className="sr-only"> {u.email}</span>
                    </button>
                    {u.disabled ? (
                      <button type="button" className={linkBtn} disabled={busy} onClick={() => void run(setDisabledAction(u.id, false))}>
                        Aktifkan<span className="sr-only"> {u.email}</span>
                      </button>
                    ) : (
                      <button
                        type="button"
                        className={linkBtn}
                        disabled={busy || u.isSelf || lastSuper(u)}
                        title={lastSuper(u) ? "Super Admin aktif terakhir" : undefined}
                        onClick={() => setConfirm({ title: `Nonaktifkan ${u.email}?`, description: "Ia langsung keluar dari admin dan tidak bisa masuk sampai diaktifkan lagi.", label: "Nonaktifkan", danger: true, run: () => setDisabledAction(u.id, true) })}
                      >
                        Nonaktifkan<span className="sr-only"> {u.email}</span>
                      </button>
                    )}
                    <button
                      type="button"
                      className={`${linkBtn} text-admin-danger`}
                      disabled={busy || u.isSelf || lastSuper(u)}
                      onClick={() => setConfirm({ title: `Hapus ${u.email}?`, description: "Akun dihapus permanen. Konten yang ditulisnya tetap ada tanpa nama penulis. Untuk sementara, pilih Nonaktifkan.", label: "Hapus pengguna", danger: true, run: () => deleteUserAction(u.id) })}
                    >
                      Hapus<span className="sr-only"> {u.email}</span>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {activeSupers <= 1 ? <p className="border-t border-admin-line px-4.5 py-2 text-xs text-admin-text">Super Admin aktif terakhir tidak bisa diturunkan, dinonaktifkan, atau dihapus.</p> : null}
      </section>

      {invites.length ? (
        <section aria-labelledby="inv-h" className={`${card} p-4.5`}>
          <h2 id="inv-h" className="text-[17px] font-extrabold text-admin-ink">
            Undangan tertunda
          </h2>
          <ul className="mt-3 flex flex-col gap-2">
            {invites.map((i) => (
              <li key={i.id} className="flex flex-wrap items-center gap-x-3 rounded-admin border border-admin-line px-3 py-1 text-sm">
                <span className="min-w-0 flex-1 font-bold break-all">{i.email}</span>
                <span>{ROLE_LABEL[i.role]}</span>
                <span className={`text-xs ${i.expired ? "font-semibold text-admin-danger" : "text-admin-text"}`}>
                  {i.expired ? "Kedaluwarsa" : `Berlaku s.d. ${dateFmt.format(new Date(i.expiresAt))}`}
                </span>
                <button type="button" className={`${linkBtn} text-admin-danger`} disabled={busy} onClick={() => void run(revokeInviteAction(i.id))}>
                  Batalkan<span className="sr-only"> undangan {i.email}</span>
                </button>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <section aria-labelledby="matrix-h" className={`${card} overflow-hidden`}>
        <div className="border-b border-admin-line px-4.5 py-3">
          <h2 id="matrix-h" className="text-[17px] font-extrabold text-admin-ink">
            Matriks hak akses
          </h2>
          <p className="text-[13px] text-admin-text">Hanya baca — diatur di kode (src/server/roles.ts). Super Admin & Editor wajib 2FA.</p>
        </div>
        <div className="relative overflow-x-auto">
          <table className="w-full min-w-[640px] border-collapse text-sm">
            <caption className="sr-only">Kemampuan per peran</caption>
            <thead>
              <tr className="text-xs tracking-[.06em] text-admin-text uppercase">
                <th scope="col" className="px-4.5 py-3 text-left font-extrabold">
                  Kemampuan
                </th>
                {ROLES.map((r) => (
                  <th key={r} scope="col" className="px-2 py-3 text-center font-extrabold">
                    {ROLE_LABEL[r]}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {matrix.map((row) => (
                <tr key={row.key} className="border-t border-admin-line">
                  <th scope="row" className="px-4.5 py-2.5 text-left font-bold">
                    {row.label}
                  </th>
                  {ROLES.map((r) => (
                    <td key={r} className="px-2 py-2.5 text-center">
                      {row.roles[r] ? <Check aria-label="Ya" size={18} className="inline text-primary" /> : <Minus aria-label="Tidak" size={18} className="inline text-admin-field" />}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <Dialog open={inviting} title="Undang pengguna" onClose={() => setInviting(false)}>
        {inviting ? <InviteForm onInvite={(email, role) => run(inviteUserAction(email, role))} onClose={() => setInviting(false)} /> : null}
      </Dialog>
      <ConfirmDialog
        open={confirm !== null}
        title={confirm?.title ?? ""}
        description={confirm?.description}
        confirmLabel={confirm?.label}
        tone={confirm?.danger ? "danger" : "primary"}
        busy={busy}
        onConfirm={async () => {
          if (confirm) await run(confirm.run());
          setConfirm(null);
        }}
        onCancel={() => setConfirm(null)}
      />
    </>
  );
}

function InviteForm({ onInvite, onClose }: { onInvite: (email: string, role: UserRole) => Promise<UsersResult | null>; onClose: () => void }) {
  const id = useId();
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<UserRole>("penulis");
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<UsersResult | null>(null);
  const [copied, setCopied] = useState(false);

  if (result?.ok && result.link) {
    return (
      <div className="flex flex-col gap-3">
        <p role="status" className="rounded-admin bg-admin-ok-bg p-3 text-sm font-semibold text-admin-primary-dark">
          {result.message}
        </p>
        <label htmlFor={`${id}-l`} className={labelClass}>
          Tautan undangan (berlaku 72 jam, sekali pakai)
        </label>
        <input id={`${id}-l`} readOnly value={result.link} onFocus={(e) => e.currentTarget.select()} className={`${field} font-mono text-xs`} />
        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <button type="button" className={ghostBtn} onClick={onClose}>
            Selesai
          </button>
          <button
            type="button"
            className={primaryBtn}
            onClick={async () => {
              try {
                await navigator.clipboard.writeText(result.link ?? "");
                setCopied(true);
              } catch {
                setCopied(false);
              }
            }}
          >
            {copied ? "Tersalin" : "Salin tautan"}
          </button>
        </div>
      </div>
    );
  }

  return (
    <form
      onSubmit={async (e) => {
        e.preventDefault();
        setBusy(true);
        setResult(await onInvite(email, role));
        setBusy(false);
      }}
      className="flex flex-col gap-4"
    >
      <div>
        <label htmlFor={`${id}-e`} className={labelClass}>
          Email
        </label>
        <input id={`${id}-e`} type="email" value={email} onChange={(e) => setEmail(e.target.value)} required maxLength={200} autoComplete="off" className={`${field} mt-1`} />
      </div>
      <div>
        <label htmlFor={`${id}-r`} className={labelClass}>
          Peran
        </label>
        <select id={`${id}-r`} value={role} onChange={(e) => setRole(e.target.value as UserRole)} className={`${field} mt-1`}>
          {ROLES.map((r) => (
            <option key={r} value={r}>
              {ROLE_LABEL[r]}
            </option>
          ))}
        </select>
        {role === "super_admin" || role === "editor" ? <p className="mt-1 text-xs text-admin-text">Peran ini wajib mendaftarkan 2FA saat masuk pertama.</p> : null}
      </div>
      {result && !result.ok ? (
        <p role="alert" className="rounded-admin bg-admin-danger-bg p-3 text-sm font-semibold text-admin-danger">
          {result.error}
        </p>
      ) : null}
      <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        <button type="button" className={ghostBtn} onClick={onClose}>
          Batal
        </button>
        <button type="submit" className={primaryBtn} disabled={busy}>
          {busy ? "Membuat…" : "Buat undangan"}
        </button>
      </div>
    </form>
  );
}
