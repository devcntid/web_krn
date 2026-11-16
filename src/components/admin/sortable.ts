/**
 * Urut ulang lewat keyboard untuk daftar dnd-kit: saat tombol geser terfokus, panah atas/kiri
 * dan bawah/kanan langsung memindahkan butir satu posisi.
 *
 * Sengaja TIDAK memakai KeyboardSensor dnd-kit: sensor itu menggulir halaman saat butir
 * "diangkat" dan memilih tujuan dari koordinat, sehingga pada layar sempit / butir berbeda
 * tinggi satu tekan panah bisa melompat beberapa posisi. Seret dengan mouse/sentuh tetap dnd-kit.
 */
export function arrowStep(event: React.KeyboardEvent): -1 | 0 | 1 {
  if (event.altKey || event.ctrlKey || event.metaKey || event.shiftKey) return 0;
  if (event.key === "ArrowUp" || event.key === "ArrowLeft") return -1;
  if (event.key === "ArrowDown" || event.key === "ArrowRight") return 1;
  return 0;
}

/** Petunjuk untuk pembaca layar (aria-describedby tombol geser). */
export const SORT_INSTRUCTIONS = {
  draggable: "Tekan panah atas atau bawah untuk memindahkan satu posisi, atau seret dengan mouse atau sentuhan.",
};

/** Pindahkan butir ber-`id` sejauh `step`; null bila sudah di ujung. */
export function moveById<T extends { id: string }>(list: readonly T[], id: string, step: -1 | 1): { list: T[]; position: number } | null {
  const from = list.findIndex((x) => x.id === id);
  const to = from + step;
  const item = list[from];
  if (!item || to < 0 || to >= list.length) return null;
  const next = [...list];
  next.splice(from, 1);
  next.splice(to, 0, item);
  return { list: next, position: to + 1 };
}
