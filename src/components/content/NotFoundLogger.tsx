"use client";

import { useEffect } from "react";

import { logNotFound } from "@/app/(site)/not-found-actions";

/**
 * Mencatat 404 ke /admin/seo. Dijalankan di browser (halaman 404 bisa disajikan dari cache,
 * jadi pencatatan di server saat render tidak andal). Sekali per path per sesi tab.
 */
export function NotFoundLogger() {
  useEffect(() => {
    const path = window.location.pathname;
    const key = `nf:${path}`;
    try {
      if (sessionStorage.getItem(key)) return;
      sessionStorage.setItem(key, "1");
    } catch {
      // sessionStorage diblokir: tetap catat.
    }
    void logNotFound(path).catch(() => undefined);
  }, []);
  return null;
}
