"use client";

import { useEffect } from "react";

import type { SiteSettings } from "@/lib/site-settings-schema";

type Snippet = SiteSettings["codes"]["snippets"][number];
type Place = "header" | "body" | "footer";

function markup(snippet: Snippet): string {
  const code = snippet.code.trim();
  if (!code) return "";
  if (snippet.kind === "css") {
    const safe = code.replace(/<\/style/gi, "<\\/style");
    return /^\s*<style[\s>]/i.test(safe) ? safe : `<style>${safe}</style>`;
  }
  if (snippet.kind === "javascript") {
    const safe = code.replace(/<\/script/gi, "<\\/script");
    return /^\s*<script[\s>]/i.test(safe) ? safe : `<script>${safe}</script>`;
  }
  return code;
}

/** Salin simpul dari HTML. Tag script harus dibuat ulang agar benar-benar dijalankan. */
function realize(html: string, marker: string): HTMLElement[] {
  const tpl = document.createElement("template");
  tpl.innerHTML = html;
  const nodes: HTMLElement[] = [];
  for (const node of tpl.content.childNodes) {
    if (!(node instanceof HTMLElement)) continue;
    if (node instanceof HTMLScriptElement) {
      const script = document.createElement("script");
      for (const attr of node.attributes) script.setAttribute(attr.name, attr.value);
      script.text = node.text;
      script.dataset.siteCode = marker;
      nodes.push(script);
      continue;
    }
    node.dataset.siteCode = marker;
    nodes.push(node);
  }
  return nodes;
}

function insertSnippets(list: Snippet[]): HTMLElement[] {
  const inserted: HTMLElement[] = [];
  const buckets: Record<Place, HTMLElement[]> = { header: [], body: [], footer: [] };
  for (const snippet of list) {
    const html = markup(snippet);
    if (!html) continue;
    for (const place of ["header", "body", "footer"] as const) {
      if (!snippet[place]) continue;
      buckets[place].push(...realize(html, `${snippet.id}-${place}`));
    }
  }
  document.head.append(...buckets.header);
  document.body.prepend(...buckets.body);
  document.body.append(...buckets.footer);
  inserted.push(...buckets.header, ...buckets.body, ...buckets.footer);
  return inserted;
}

/** Pasang kode pengaturan situs di header, awal body, atau akhir body. Tidak dipakai di admin. */
export function SiteCode({ snippets }: { snippets: Snippet[] }) {
  const key = JSON.stringify(snippets);
  useEffect(() => {
    const list = JSON.parse(key) as Snippet[];
    let inserted: HTMLElement[] = [];
    let idleId = 0;
    let timeoutId = 0;
    const run = () => {
      inserted = insertSnippets(list);
    };
    // Tunda sampai idle / setelah load agar tidak bersaing dengan LCP beranda.
    const schedule = () => {
      const ric = window.requestIdleCallback;
      if (typeof ric === "function") idleId = ric.call(window, run, { timeout: 2500 });
      else timeoutId = window.setTimeout(run, 1);
    };
    if (document.readyState === "complete") schedule();
    else window.addEventListener("load", schedule, { once: true });
    return () => {
      window.removeEventListener("load", schedule);
      if (idleId && typeof window.cancelIdleCallback === "function") window.cancelIdleCallback(idleId);
      if (timeoutId) window.clearTimeout(timeoutId);
      for (const node of inserted) node.remove();
    };
  }, [key]);
  return null;
}
