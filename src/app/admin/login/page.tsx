import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { auth, googleEnabled } from "@/server/auth";
import { getPendingEnrollment } from "@/server/auth/enrollment";

import {
  beginTotpEnrollment,
  cancelLogin,
  loginWithGoogle,
  loginWithPassword,
  verifyTotpCode,
} from "./actions";

export const metadata: Metadata = { title: "Masuk" };

const ERRORS: Record<string, string> = {
  credentials:
    "Email atau kata sandi salah, atau terlalu banyak percobaan. Coba lagi nanti.",
  totp: "Kode verifikasi tidak valid atau terlalu banyak percobaan.",
  AccessDenied: "Akun Google ini tidak memiliki akses ke admin.",
};

const label = "flex flex-col gap-1.5 text-[13px] font-bold text-admin-ink";
const field =
  "h-11.5 w-full rounded-admin border border-admin-field bg-white px-3.5 text-[15px] font-medium text-admin-ink focus-visible:border-primary focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-primary";
const focusRing =
  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary";
const primaryBtn = `h-12 w-full rounded-admin bg-primary px-4 text-[15px] font-extrabold text-white hover:bg-admin-primary-dark ${focusRing}`;
const secondaryBtn = `h-12 w-full rounded-admin border border-admin-field bg-white px-4 text-[15px] font-bold text-admin-ink hover:bg-admin-canvas ${focusRing}`;
const note = "text-sm text-admin-text";

type Props = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function LoginPage({ searchParams }: Props) {
  const params = await searchParams;
  const rawCallback =
    typeof params.callbackUrl === "string" ? params.callbackUrl : "";
  const callbackUrl =
    /^\/admin(\/|$)/.test(rawCallback) && !rawCallback.startsWith("//")
      ? rawCallback
      : "/admin/";
  const errorKey = typeof params.error === "string" ? params.error : "";
  const error = errorKey
    ? (ERRORS[errorKey] ?? "Gagal masuk. Coba lagi.")
    : null;

  const user = (await auth())?.user;
  if (user?.mfaPassed) redirect(callbackUrl);

  const pending =
    user && !user.totpEnrolled ? await getPendingEnrollment(user.id) : null;

  return (
    <div className="flex min-h-screen flex-wrap bg-admin-canvas">
      <section
        aria-label="Relawan Nusantara Admin CMS"
        className="flex flex-[1_1_520px] flex-col justify-between gap-10 bg-admin-sidebar p-6 text-white sm:p-10 lg:p-16"
      >
        <p className="flex items-center gap-3">
          <span
            aria-hidden="true"
            className="flex size-11 items-center justify-center rounded-admin bg-primary font-extrabold"
          >
            RN
          </span>
          <span className="text-lg font-extrabold">
            Relawan Nusantara · Admin CMS
          </span>
        </p>
        <div>
          <p className="font-sans text-3xl leading-tight font-extrabold italic sm:text-[44px]">
            Bergerak Menjadi Jembatan Kebaikan
          </p>
          <p className="mt-4.5 max-w-115 text-[17px] leading-relaxed text-admin-hero-text">
            Kelola publikasi, halaman, media, dan laporan transparansi Relawan
            Nusantara dari satu tempat.
          </p>
        </div>
        <p className="hidden text-[13px] text-admin-sidebar-label sm:block">
          © {new Date().getFullYear()} Yayasan Komite Relawan Nusantara
        </p>
      </section>
      <main className="flex flex-[1_1_480px] items-center justify-center px-4 py-12 sm:px-6">
        <div className="flex w-full max-w-100 flex-col gap-4.5 rounded-2xl bg-white p-6 shadow-admin-card sm:p-10">
          <div>
            <h1 className="text-[26px] font-extrabold text-admin-ink">
              {user ? "Verifikasi dua langkah" : "Masuk"}
            </h1>
            <p className="mt-1.5 text-sm text-admin-text">
              {user
                ? "Masukkan kode dari aplikasi autentikator Anda."
                : "Gunakan akun yang diberikan Super Admin."}
            </p>
          </div>
          {error && (
            <p
              role="alert"
              className="rounded-admin border border-admin-danger bg-admin-danger-bg p-3 text-sm font-semibold text-admin-danger"
            >
              {error}
            </p>
          )}

          {!user && (
            <>
              <form
                action={loginWithPassword}
                className="flex flex-col gap-4.5"
              >
                <input type="hidden" name="callbackUrl" value={callbackUrl} />
                <label className={label}>
                  Email
                  <input
                    name="email"
                    type="email"
                    autoComplete="username"
                    required
                    className={field}
                  />
                </label>
                <label className={label}>
                  Kata sandi
                  <input
                    name="password"
                    type="password"
                    autoComplete="current-password"
                    required
                    className={field}
                  />
                </label>
                <button type="submit" className={primaryBtn}>
                  Masuk
                </button>
              </form>
              {googleEnabled && (
                <>
                  <p
                    aria-hidden="true"
                    className="flex items-center gap-2.5 text-xs text-admin-text-soft"
                  >
                    <span className="h-px flex-1 bg-admin-line" />
                    atau
                    <span className="h-px flex-1 bg-admin-line" />
                  </p>
                  <form action={loginWithGoogle}>
                    <input
                      type="hidden"
                      name="callbackUrl"
                      value={callbackUrl}
                    />
                    <button type="submit" className={secondaryBtn}>
                      Masuk dengan Google Workspace
                    </button>
                  </form>
                </>
              )}
            </>
          )}

          {user && user.totpEnrolled && (
            <form action={verifyTotpCode} className="flex flex-col gap-4.5">
              <input type="hidden" name="callbackUrl" value={callbackUrl} />
              <label className={label}>
                Kode 6 digit dari aplikasi autentikator
                <input
                  name="code"
                  inputMode="numeric"
                  pattern="[0-9 ]{6,7}"
                  autoComplete="one-time-code"
                  required
                  className={field}
                />
              </label>
              <button type="submit" className={primaryBtn}>
                Verifikasi
              </button>
            </form>
          )}

          {user && !user.totpEnrolled && (
            <div className="flex flex-col gap-4.5">
              <p className={note}>
                Peran Anda wajib memakai verifikasi dua langkah (TOTP).
                Daftarkan aplikasi autentikator terlebih dahulu.
              </p>
              {pending ? (
                <>
                  <p className={note}>
                    Tambahkan akun baru di aplikasi autentikator dengan kunci
                    berikut, lalu masukkan kode yang muncul:
                  </p>
                  <p className="break-all rounded-admin bg-admin-canvas p-3 font-mono text-sm text-admin-ink">
                    {pending.secret}
                  </p>
                  <p className={note}>
                    <a
                      href={pending.uri}
                      className="inline-flex min-h-11 items-center font-bold text-primary underline hover:text-admin-primary-dark"
                    >
                      Buka di aplikasi autentikator
                    </a>
                  </p>
                  <form
                    action={verifyTotpCode}
                    className="flex flex-col gap-4.5"
                  >
                    <input
                      type="hidden"
                      name="callbackUrl"
                      value={callbackUrl}
                    />
                    <label className={label}>
                      Kode 6 digit
                      <input
                        name="code"
                        inputMode="numeric"
                        pattern="[0-9 ]{6,7}"
                        autoComplete="one-time-code"
                        required
                        className={field}
                      />
                    </label>
                    <button type="submit" className={primaryBtn}>
                      Aktifkan &amp; masuk
                    </button>
                  </form>
                </>
              ) : (
                <form action={beginTotpEnrollment}>
                  <input type="hidden" name="callbackUrl" value={callbackUrl} />
                  <button type="submit" className={primaryBtn}>
                    Buat kunci 2FA
                  </button>
                </form>
              )}
            </div>
          )}

          {user && (
            <form action={cancelLogin}>
              <button type="submit" className={secondaryBtn}>
                Batal &amp; keluar
              </button>
            </form>
          )}
          <p className="text-center text-xs text-admin-text-soft">
            Dilindungi verifikasi dua langkah (2FA).
          </p>
        </div>
      </main>
    </div>
  );
}
