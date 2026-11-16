"use server";

import { AuthError } from "next-auth";
import { redirect } from "next/navigation";

import { auth, signIn, signOut, unstable_update } from "@/server/auth";
import { startTotpEnrollment } from "@/server/auth/enrollment";
import { requiresTotp } from "@/server/permissions";

/** Hanya path internal admin yang boleh menjadi tujuan setelah login (cegah open redirect). */
function safeCallback(value: FormDataEntryValue | null): string {
  const v = typeof value === "string" ? value : "";
  return /^\/admin(\/|$)/.test(v) && !v.startsWith("//") && !v.includes("\\") ? v : "/admin/";
}

function loginUrl(params: Record<string, string>): string {
  return `/admin/login/?${new URLSearchParams(params).toString()}`;
}

export async function loginWithPassword(formData: FormData) {
  const callbackUrl = safeCallback(formData.get("callbackUrl"));
  try {
    await signIn("credentials", {
      email: formData.get("email"),
      password: formData.get("password"),
      redirectTo: loginUrl({ callbackUrl }),
    });
  } catch (error) {
    // Pesan generik: tidak membedakan email tak dikenal, password salah, akun nonaktif, atau rate limit.
    if (error instanceof AuthError) redirect(loginUrl({ error: "credentials", callbackUrl }));
    throw error;
  }
}

export async function loginWithGoogle(formData: FormData) {
  await signIn("google", { redirectTo: loginUrl({ callbackUrl: safeCallback(formData.get("callbackUrl")) }) });
}

export async function verifyTotpCode(formData: FormData) {
  const callbackUrl = safeCallback(formData.get("callbackUrl"));
  const code = String(formData.get("code") ?? "").replace(/\s/g, "");
  if (!(await auth())?.user) redirect(loginUrl({ callbackUrl }));
  const session = await unstable_update({ totpCode: code });
  if (session?.user?.mfaPassed) redirect(callbackUrl);
  redirect(loginUrl({ error: "totp", callbackUrl }));
}

export async function beginTotpEnrollment(formData: FormData) {
  const callbackUrl = safeCallback(formData.get("callbackUrl"));
  const user = (await auth())?.user;
  if (user && requiresTotp(user.role) && !user.totpEnrolled && user.email) {
    await startTotpEnrollment(user.id, user.email);
  }
  redirect(loginUrl({ callbackUrl }));
}

export async function cancelLogin() {
  await signOut({ redirectTo: "/admin/login/" });
}
