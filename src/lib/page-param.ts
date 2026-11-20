/**
 * Nomor halaman dari query string (?hal=, ?page=, ?muat=, ?halaman=).
 *
 * Hanya digit utuh, tanpa tanda, titik, atau eksponen. `Number("2.2")` lolos
 * sebagai 2.2 dan `page - 1` menjadi 1.2000000000000002; `Number("2e2")`
 * menjadi 200; `parseInt("2abc")` berhenti di 2. Semuanya ditolak di sini.
 * String yang terlalu panjang tidak diubah ke Number sama sekali, supaya
 * OFFSET SQL tidak menerima nilai di luar bilangan bulat aman.
 */
export const MAX_PAGE_PARAM = 10_000;

export function parsePageParam(value: unknown, fallback = 1, max = MAX_PAGE_PARAM): number {
  const raw = Array.isArray(value) ? value[0] : value;
  if (typeof raw !== "string" || !/^[1-9]\d{0,8}$/.test(raw)) return fallback;
  const n = Number(raw);
  if (!Number.isSafeInteger(n) || n < 1 || n > max) return fallback;
  return n;
}
