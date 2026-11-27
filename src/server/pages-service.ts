import "server-only";

import { eq, or } from "drizzle-orm";

import { isDonationAppPath } from "@/config/routes";
import { RESERVED_SLUGS } from "@/lib/slug";
import type { CreatePageInput, CreatePageResult, SavePageInput, SavePageResult } from "@/types/admin-pages";
import { logActivity } from "./activity";
import { sanitizeContentHtml } from "./content/sanitize";
import { getDb, schema } from "./db";
import { can, type AuthUser } from "./permissions";
import { SYSTEM_PAGE_PATHS } from "./repos/admin-pages";
import type { VisualNode } from "@/lib/visual-page";
import { PAGE_TEMPLATES, type Section, type SectionIssue, parseSections } from "./sections";

const { pages, posts, redirects } = schema;

const UNSAFE_URL = /^\s*(?:javascript|data|vbscript):/i;
/** Field yang menjadi `src` iframe — wajib https. */
const EMBED_KEYS = new Set(["embedSrc", "mapSrc", "previewUrl"]);

/** Telusuri isi section: tolak skema URL berbahaya di string mana pun dan sematan non-https. */
function urlIssues(value: unknown, path: string, out: { path: string; message: string }[]): void {
  if (typeof value === "string") {
    if (UNSAFE_URL.test(value)) out.push({ path, message: "Skema URL tidak diizinkan" });
    return;
  }
  if (Array.isArray(value)) {
    value.forEach((v, i) => urlIssues(v, `${path}.${i}`, out));
    return;
  }
  if (typeof value === "object" && value !== null) {
    for (const [key, v] of Object.entries(value)) {
      const child = path ? `${path}.${key}` : key;
      if (EMBED_KEYS.has(key) && typeof v === "string" && !/^https:\/\//.test(v.trim())) out.push({ path: child, message: "URL sematan harus diawali https://" });
      urlIssues(v, child, out);
    }
  }
}

type Stored = { id?: unknown; type?: unknown; data?: { html?: unknown; nodes?: unknown }; en?: { html?: unknown } };

/** Ambil JavaScript tersimpan per id node `code` (untuk mempertahankan nilai bila penyimpan tanpa system.manage). */
function storedCodeJs(nodes: unknown): Map<string, string> {
  const map = new Map<string, string>();
  const walk = (list: unknown) => {
    if (!Array.isArray(list)) return;
    for (const item of list) {
      if (!item || typeof item !== "object") continue;
      const node = item as { id?: unknown; type?: unknown; content?: { javascript?: unknown }; children?: unknown };
      if (typeof node.id === "string" && node.type === "code" && typeof node.content?.javascript === "string") {
        map.set(node.id, node.content.javascript);
      }
      walk(node.children);
    }
  };
  walk(nodes);
  return map;
}

/**
 * Sanitasi HTML di section. Richtext yang TIDAK berubah dari versi tersimpan dibiarkan persis
 * (HTML halaman lama hasil ekspor tidak ditulis ulang hanya karena halaman disimpan).
 * JavaScript pada node visual `code` hanya boleh diubah oleh `system.manage`.
 */
function sanitizeSections(sections: Section[], stored: unknown, allowCustomJs: boolean): Section[] {
  const before = new Map<string, Stored>();
  if (Array.isArray(stored)) {
    (stored as Stored[]).forEach((s, i) => before.set(typeof s?.id === "string" ? s.id : `s${i + 1}`, s));
  }
  const cleanHtml = (html: string, previous: unknown) => (html === previous ? html : sanitizeContentHtml(html));
  return sections.map((section) => {
    if (section.type === "richtext") {
      const prev = before.get(section.id);
      const same = prev?.type === "richtext";
      return {
        ...section,
        data: { html: cleanHtml(section.data.html, same ? prev?.data?.html : undefined) },
        ...(section.en ? { en: { html: cleanHtml(section.en.html, same ? prev?.en?.html : undefined) } } : {}),
      };
    }
    if (section.type === "visual") {
      const prev = before.get(section.id);
      const prevJs = !allowCustomJs && prev?.type === "visual" ? storedCodeJs(prev.data?.nodes) : new Map<string, string>();
      const cleanNodes = (list: VisualNode[]): VisualNode[] =>
        list.map((node) => {
          let content = node.content;
          if (node.type === "text" || node.type === "html") {
            content = { ...node.content, html: sanitizeContentHtml(node.content.html) };
          } else if (node.type === "code" && !allowCustomJs) {
            content = { ...node.content, javascript: prevJs.get(node.id) ?? "" };
          }
          return { ...node, content, ...(node.children ? { children: cleanNodes(node.children) } : {}) } as VisualNode;
        });
      return { ...section, data: { nodes: cleanNodes(section.data.nodes) } };
    }
    if (section.type === "accordion") {
      const clean = (d: typeof section.data) => ({ ...d, items: d.items.map((it) => ({ ...it, body: sanitizeContentHtml(it.body) })) });
      return { ...section, data: clean(section.data), ...(section.en ? { en: clean(section.en) } : {}) };
    }
    return section;
  });
}

/** JSON dengan kunci terurut — jsonb tidak menjaga urutan kunci, jadi perbandingan harus mengabaikannya. */
function canonical(value: unknown): string {
  return JSON.stringify(value, (_key, v: unknown) =>
    v && typeof v === "object" && !Array.isArray(v) ? Object.fromEntries(Object.entries(v).sort(([a], [b]) => a.localeCompare(b))) : v,
  );
}

export type SavePageOutcome = { result: SavePageResult; path: string | null; listChanged: boolean };

/** Simpan judul, status, template, SEO, dan daftar section sebuah halaman. Pemanggil sudah memeriksa `pages.manage`. */
export async function savePage(user: AuthUser, input: SavePageInput): Promise<SavePageOutcome> {
  const fail = (error: string, issues?: SectionIssue[]): SavePageOutcome => ({ result: { ok: false, error, issues }, path: null, listChanged: false });

  const title = input.title.trim().replace(/\s+/g, " ");
  if (!title) return fail("Judul halaman wajib diisi.");
  if (title.length > 200) return fail("Judul halaman terlalu panjang (maksimal 200 karakter).");
  if (input.status !== "draft" && input.status !== "published") return fail("Status tidak dikenal.");
  if (!(PAGE_TEMPLATES as readonly string[]).includes(input.template)) return fail("Tata letak tidak dikenal.");
  if (!Array.isArray(input.sections) || input.sections.length > 60) return fail("Daftar section tidak sah.");

  const ids = new Set<string>();
  for (const s of input.sections) {
    if (ids.has(s.id)) return fail("Ada section dengan ID ganda. Muat ulang halaman lalu coba lagi.");
    ids.add(s.id);
  }

  const { sections, issues } = parseSections(input.sections);
  input.sections.forEach((s, index) => {
    for (const [locale, value] of [["id", s.data], ["en", s.en]] as const) {
      const found: { path: string; message: string }[] = [];
      urlIssues(value, "", found);
      for (const f of found) issues.push({ index, type: s.type, locale, ...f });
    }
  });
  if (issues.length) return fail("Beberapa section belum lengkap atau tidak sah. Perbaiki lalu simpan lagi.", issues);
  if (input.template === "generic" && sections.some((s) => s.type !== "richtext")) {
    return fail("Tata letak Generik hanya mendukung section Teks bebas. Pilih tata letak Section untuk tipe lain.");
  }

  return getDb().transaction(async (tx) => {
    const [page] = await tx.select().from(pages).where(eq(pages.id, input.id)).limit(1);
    if (!page || page.status === "trashed") return fail("Halaman tidak ditemukan.");
    if (SYSTEM_PAGE_PATHS.has(page.path)) return fail("Halaman ini dirender otomatis dan tidak disusun dari section.");

    const clean = sanitizeSections(sections, page.sections, can(user, "system.manage"));
    const seoTitle = input.seoTitle.trim().slice(0, 200) || null;
    const seoDescription = input.seoDescription.trim().slice(0, 500) || null;
    await tx.update(pages).set({ title, status: input.status, template: input.template, sections: clean, seoTitle, seoDescription }).where(eq(pages.id, page.id));

    const diff: Record<string, unknown> = {};
    if (page.title !== title) diff.title = [page.title, title];
    if (page.status !== input.status) diff.status = [page.status, input.status];
    if (page.template !== input.template) diff.template = [page.template, input.template];
    if ((page.seoTitle ?? null) !== seoTitle) diff.seoTitle = [page.seoTitle, seoTitle];
    if ((page.seoDescription ?? null) !== seoDescription) diff.seoDescription = [page.seoDescription, seoDescription];
    if (canonical(page.sections) !== canonical(clean)) {
      diff.sections = { before: Array.isArray(page.sections) ? page.sections.length : 0, after: clean.length, types: clean.map((s) => (s.visible ? s.type : `${s.type} (tersembunyi)`)) };
    }
    const action = page.status !== input.status ? (input.status === "published" ? "publish" : "unpublish") : "edit";
    const verb = { publish: "Menerbitkan", unpublish: "Menarik ke draf", edit: "Mengubah" }[action];
    await logActivity({ userId: user.id, action, entity: "page", entityId: page.id, summary: `${verb} halaman “${title}” (/${page.path}/)`, diff }, tx);

    return {
      result: { ok: true as const, savedAt: new Date().toISOString() },
      path: page.path,
      // Judul/status memengaruhi daftar halaman, sitemap, dan breadcrumb halaman anak.
      listChanged: page.title !== title || page.status !== input.status,
    };
  });
}

/** Buat halaman baru (draf, tata letak Section, satu hero). Path anak hanya satu tingkat di bawah halaman yang ada. */
export async function createPage(user: AuthUser, input: CreatePageInput): Promise<CreatePageResult> {
  const title = input.title.trim().replace(/\s+/g, " ");
  if (!title) return { ok: false, error: "Judul wajib diisi.", field: "title" };
  if (title.length > 200) return { ok: false, error: "Judul terlalu panjang (maksimal 200 karakter).", field: "title" };

  const slug = input.slug.trim().toLowerCase();
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug) || slug.length > 100) {
    return { ok: false, error: "Alamat hanya boleh berisi huruf kecil, angka, dan tanda hubung.", field: "slug" };
  }
  const parent = input.parentPath.trim();
  const path = parent ? `${parent}/${slug}` : slug;
  if (isDonationAppPath(path)) return { ok: false, error: "Alamat berawalan campaign, donasi, atau prog dipakai aplikasi donasi.", field: "slug" };
  if (!parent && RESERVED_SLUGS.has(slug)) return { ok: false, error: "Alamat ini sudah dipakai route khusus situs.", field: "slug" };

  return getDb().transaction(async (tx) => {
    if (parent) {
      if (parent.includes("/")) return { ok: false as const, error: "Halaman anak hanya bisa satu tingkat di bawah halaman utama.", field: "slug" as const };
      const [p] = await tx.select({ id: pages.id }).from(pages).where(eq(pages.path, parent)).limit(1);
      if (!p) return { ok: false as const, error: "Halaman induk tidak ditemukan.", field: "slug" as const };
    }
    const [dupPage] = await tx.select({ id: pages.id }).from(pages).where(eq(pages.path, path)).limit(1);
    const [dupPost] = parent ? [] : await tx.select({ id: posts.id }).from(posts).where(eq(posts.slug, slug)).limit(1);
    const [dupRedirect] = await tx
      .select({ id: redirects.id })
      .from(redirects)
      .where(or(eq(redirects.source, `/${path}/`), eq(redirects.source, `/${path}`)))
      .limit(1);
    if (dupPage || dupPost || dupRedirect) return { ok: false as const, error: "Alamat sudah dipakai halaman, publikasi, atau redirect lain.", field: "slug" as const };

    const visual = input.editor === "visual";
    const sections = visual
      ? [{ id: crypto.randomUUID(), type: "visual", visible: true, data: { nodes: [] } }]
      : [{ id: crypto.randomUUID(), type: "hero", visible: true, data: { title: "", eyebrow: "", subtitle: "", image: null, size: "small", overlay: 0.4 } }];
    const [created] = await tx.insert(pages).values({ path, title, template: "sections", sections, status: "draft" }).returning({ id: pages.id });
    if (!created) return { ok: false as const, error: "Gagal membuat halaman." };
    await logActivity({ userId: user.id, action: "create", entity: "page", entityId: created.id, summary: `Membuat halaman “${title}” (/${path}/)` }, tx);
    return { ok: true as const, id: created.id };
  });
}
