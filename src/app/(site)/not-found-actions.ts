"use server";

import { headers } from "next/headers";

import { recordNotFound } from "@/server/not-found-log";

/** Dipanggil halaman 404 di browser: catat path yang tidak ditemukan (bot diabaikan). */
export async function logNotFound(path: string): Promise<void> {
  if (typeof path !== "string") return;
  const h = await headers();
  try {
    await recordNotFound(path, h.get("user-agent") ?? "");
  } catch (error) {
    console.error("logNotFound gagal", error);
  }
}
