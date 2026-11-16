"use server";

import { draftMode } from "next/headers";
import { redirect } from "next/navigation";

/** Keluar dari mode pratinjau (Draft Mode) dan kembali ke daftar publikasi admin. */
export async function exitPreview() {
  (await draftMode()).disable();
  redirect("/admin/publikasi/");
}
