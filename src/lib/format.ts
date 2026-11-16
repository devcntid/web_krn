/** Format tanggal mengikuti tampilan WordPress existing. */

const MONTHS_EN = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];
const MONTHS_SHORT = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

function parts(iso: string) {
  // Tanggal WP sudah dalam zona Asia/Jakarta (field `date`), jadi baca apa adanya.
  const [y, m, d] = iso.slice(0, 10).split("-").map(Number);
  return { y, m: m - 1, d };
}

function ordinal(n: number) {
  const s = ["th", "st", "nd", "rd"];
  const v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
}

/** "November 11th, 2026" — carousel publikasi beranda & sidebar post. */
export function formatDateLong(iso: string) {
  const { y, m, d } = parts(iso);
  return `${MONTHS_EN[m]} ${ordinal(d)}, ${y}`;
}

/** "21 Oct, 2026" — kartu grid artikel/berita. */
export function formatDateCard(iso: string) {
  const { y, m, d } = parts(iso);
  return `${String(d).padStart(2, "0")} ${MONTHS_SHORT[m]}, ${y}`;
}

/** "Nov 11, 2026" — footer publikasi. */
export function formatDateShort(iso: string) {
  const { y, m, d } = parts(iso);
  return `${MONTHS_SHORT[m]} ${String(d).padStart(2, "0")}, ${y}`;
}

/** Kategori jenis publikasi; "blog" adalah kategori induk teknis WordPress dan tidak ditampilkan. */
const TYPE_CATEGORIES = ["berita", "artikel"];
const HIDDEN_CATEGORIES = ["blog"];

/** Label kategori kartu: jenis · topik pertama, mis. "Berita · Sudan". */
export function postCategoryLabel(post: { categories: { slug: string; name: string }[] }): string {
  const cats = post.categories.filter((c) => !HIDDEN_CATEGORIES.includes(c.slug));
  const type = cats.find((c) => TYPE_CATEGORIES.includes(c.slug));
  const topic = cats.find((c) => !TYPE_CATEGORIES.includes(c.slug));
  return [type?.name, topic?.name].filter((n): n is string => Boolean(n)).join(" · ");
}
