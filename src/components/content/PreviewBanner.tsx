import { exitPreview } from "@/app/(site)/preview-actions";

/** Bilah penanda mode pratinjau (Draft Mode) — hanya tampil untuk admin yang membuka pratinjau. */
export function PreviewBanner({ status }: { status?: string }) {
  return (
    <aside
      aria-label="Mode pratinjau"
      className="fixed inset-x-0 bottom-0 z-50 flex flex-wrap items-center justify-center gap-x-4 gap-y-1 bg-ink-900 px-4 py-2 text-sm text-white"
    >
      <p>
        <strong>Mode pratinjau</strong> — halaman ini belum tentu terbit{status ? ` (status: ${status})` : ""} dan tidak terlihat pengunjung.
      </p>
      <form action={exitPreview}>
        <button type="submit" className="min-h-11 rounded-btn border border-white px-4 font-bold hover:bg-white hover:text-ink-900 focus-visible:outline-2 focus-visible:outline-accent">
          Keluar dari pratinjau
        </button>
      </form>
    </aside>
  );
}
