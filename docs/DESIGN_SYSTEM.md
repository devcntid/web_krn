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

## Admin CMS (B4)
Admin memakai font Manrope (`font-manrope`) dan token `admin-*` di `@theme` (globals.css), diambil dari artboard `design/Admin*.dc.html`:
- Sidebar: `admin-sidebar` #0F2E2A (latar sidebar & panel kiri login), `admin-sidebar-raised` #2C5A52 (avatar), `admin-sidebar-text` #D6E6E2, `admin-sidebar-muted` #9FBFB8, `admin-sidebar-label` #8FB1AA (label grup), `admin-sidebar-dot` #4F7D75, `admin-hero-text` #C4DAD5. Item aktif: `primary` + titik `accent`; badge review: `accent` teks hitam.
- Kanvas & teks: `admin-canvas` #F5F7F6, `admin-ink` #10201D, `admin-text` #55615E, `admin-text-soft` #6B7774 (≥4.5:1 di putih), `admin-field` #CFD6D4 (border input/tombol), `admin-line` #E2E7E5 (pemisah), `admin-row-hover` #FAFBFB, `admin-primary-dark` #004D43 (hover primer).
- Status (StatusBadge): Terbit `admin-ok-bg`/`admin-primary-dark`, Review `admin-warn-bg`/`admin-warn-text`, Draf `admin-neutral-bg`/`admin-neutral-text`, Terjadwal `admin-info-bg`/`admin-info-text`, Sampah `admin-danger-bg`/`admin-danger`.
- Bentuk: `rounded-admin` 10px (input, tombol, kartu), `shadow-admin-card`.
- Breakpoint: sidebar tetap di ≥1024px (`lg`), di bawahnya drawer.
- Komponen bersama (`src/components/admin/`): AdminShell, AdminSidebar, PageHeader, Card, StatusBadge, DataTable, EmptyState, ConfirmDialog, Toast.
