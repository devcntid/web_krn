# DESIGN_SYSTEM

Sumber: computed styles relawannusantara.org (Divi), 13 Nov 2026. Token didefinisikan di `src/app/globals.css` (`@theme`).

## Warna
| Token Tailwind | Nilai | Pemakaian |
|---|---|---|
| `primary` | #006659 | Hijau brand: tombol sekunder, tab aktif, panel statistik, bar footer, border dropdown |
| `primary-600` | #01997F | Dot carousel aktif |
| `primary-400` | #2CA395 | Aksen dekoratif (kontras di atas putih < 4.5:1, jangan untuk teks kecil) |
| `primary-500` | #1E7F73 | Peran pada testimoni (varian lolos kontras 4.5:1, dari kanvas desain) |
| `accent` | #F4A62A | Tombol Donasi, CTA "Buka E-Report" |
| `accent-soft` | #EEC044 | Tombol "Mari Berdonasi" |
| `cream` | #F8F7F0 | Background footer |
| `surface-muted` | #D5D5D5 | Kotak kutipan testimoni |
| `surface-alt` | #F2F6F8 | Background listing publikasi/arsip |
| `border` | #DBDBDB | Garis header saat scroll |
| `ink` / `ink-900` | #000 / #1D1D18 | Heading |
| `body`, `body-strong`, `body-soft` | #444 / #333 / #666 | Teks |
| `muted` | #A5A49A | Teks footer, meta |
| `muted-strong` | #77756B | Teks abu di atas putih (deskripsi testimoni), kontras ≥4.5:1 |
| (literal) | #F05E22 | Border titik-titik kotak asal dana |
| (literal) | #F1B51C | Tanggal footer |

## Tipografi
- **Poppins** (200–800, italic 700/800) — font utama. **Manrope** (400–700) — footer.
- Self-hosted via `next/font/local` (`src/fonts`, lisensi OFL) → tanpa request ke Google Fonts.

| Elemen | Spesifikasi |
|---|---|
| Display (intro) | 45px / 1.0 / 800 italic |
| H2 section | 28–36px / 700 |
| H1 hero post | 54px / 1.2 / 700 putih |
| Menu | 16px / 600; dropdown 14px / 600, lebar 240px, border-top 3px primary |
| Body post | 14px / 23.8px, justify |
| Tombol | 13–16px / 600–700 |

## Bentuk & layout
- Container: 80% maks 1080px (`container-site`); 90% di ≤980px. Template post & footer: 90% lebar penuh.
- Header: fixed, top 20px, tinggi 76px, radius 10px, padding 0 20px (mobile: bar 60px penuh).
- Radius: tombol 5–8px, kartu 10px, gambar publikasi/video 20px, CTA & tombol outline pill.
- Shadow kartu: `0 2px 18px rgba(0,0,0,.08)`; dropdown `0 2px 5px rgba(0,0,0,.1)`.
- Breakpoint: `md` 768, `lg` 1024 (menu desktop muncul), `xl` 1280.

## Komponen
Header, MobileMenu, SearchOverlay, Footer, FloatingContact ("Tanya Saffa"), DonateButton (accent/primary), PageHero, PostCard, RelatedPostCard, Carousel (Embla), Pagination, PostGrid (tab+search), ArchiveTemplate, RichContent (`.wp-content`), DonationCta, YouTubeFacade, SocialIcons.
