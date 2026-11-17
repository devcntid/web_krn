# Autentikasi & otorisasi Admin (B3)

Auth.js v5 (`next-auth@5.0.0-beta.32`, peer dependency `next ^16`, `react ^19`) — konfigurasi di
`src/server/auth/index.ts`, route `src/app/api/auth/[...nextauth]/route.ts`, proteksi di `src/proxy.ts`.

## Strategi sesi: JWT (menyimpang dari "session database" di B3)
Auth.js menolak Credentials dengan strategi `database` (`UnsupportedStrategy: Signing in with credentials only
supported if JWT strategy is enabled`, `@auth/core/lib/utils/assert.js`). Maka sesi memakai **JWT terenkripsi di cookie**
(httpOnly), dan agar tetap bisa dicabut:

- Callback `jwt` membaca ulang baris `users` **di setiap request** (proxy & `auth()`): peran baru berlaku di request
  berikutnya; `disabled_at` terisi atau baris terhapus → sesi langsung dihapus.
- Idle timeout 2 jam (`session.maxAge`), batas umur absolut 8 jam sejak login (`authAt`) — ditegakkan sendiri karena
  Auth.js memperpanjang JWT tiap akses.
- Konsekuensi: tidak ada daftar sesi aktif per pengguna, dan ganti password **tidak** mengeluarkan sesi lain (sampai
  maksimal 8 jam). Untuk paksa keluar: isi `disabled_at`, atau ganti `AUTH_SECRET` (semua sesi + 2FA tersimpan harus
  daftar ulang bila TOTP_ENCRYPTION_KEY tidak di-set). Tabel `sessions`/`accounts` belum dipakai.

## Login
- **Credentials**: email + password argon2id (m=19 MiB, t=2, p=1). Pesan gagal generik; email tak dikenal tetap
  menjalankan verifikasi hash tiruan (waktu respons setara).
- **Google**: hanya bila `AUTH_GOOGLE_ID/SECRET` di-set. Wajib `email_verified`, domain = `ALLOWED_EMAIL_DOMAIN` persis,
  dan **sudah ada baris aktif di `users`** dengan email itu. Pengguna Google tanpa baris **ditolak** (tidak dibuat
  otomatis, bahkan sebagai `viewer`) — akun dibuat Super Admin (B13 / `admin:create`), agar tidak ada akses yang
  muncul tanpa keputusan admin. Tanpa `ALLOWED_EMAIL_DOMAIN` semua login Google ditolak.
- **Rate limit** (Postgres, `auth_attempts`): 5 gagal/15 menit per email, 20/15 menit per IP (`x-forwarded-for`),
  5 kode TOTP salah/15 menit per pengguna.

## 2FA (TOTP, otplib v13)
Wajib untuk `super_admin` & `editor`. Setelah password/Google, token berstatus `mfa=false`; proxy, `requireUser()`
dan halaman admin menolaknya. Kode dikirim lewat `unstable_update({ totpCode })` dan **diverifikasi di callback
`jwt` di server** (payload update dari klien tidak bisa menyetel `mfa` sendiri). Toleransi ±30 detik, time step
terakhir disimpan (`totp_last_step`) sehingga kode tidak bisa dipakai ulang. Rahasia disimpan AES-256-GCM dengan kunci
HKDF dari `TOTP_ENCRYPTION_KEY` atau `AUTH_SECRET`. Pendaftaran pertama dilakukan di /admin/login setelah password
benar (`totp_enabled_at` terisi saat kode pertama valid). Reset 2FA pengguna: kosongkan `totp_secret`,
`totp_enabled_at`, `totp_last_step` (UI di B13).

## Otorisasi
`src/server/roles.ts` = matriks peran (playbook "Peran & hak akses"); `src/server/permissions.ts` mengekspor
`can(user, ability)`, `getCurrentUser()`, `requireUser()` (redirect ke /admin/login), `requireAbility(ability)`
(melempar `ForbiddenError`). Setiap server action/route admin wajib memanggilnya — proxy hanya lapisan pertama.

## Super Admin pertama
`npm run admin:create -- --email nama@domain.org --name "Nama"` (password diminta tanpa ditampilkan, min. 12
karakter, atau via env `ADMIN_PASSWORD`). Menulis ke database di `DATABASE_URL`.

## Pengguna & undangan (B13)
`/admin/pengguna` (hanya Super Admin): undang via email → baris `invitations` (token acak 32 byte, disimpan sebagai
hash SHA-256, berlaku 72 jam, sekali pakai). Tautan `/admin/login/undangan/<token>/` membuat akun (nama + password)
dengan peran dari undangan; 2FA didaftarkan saat login pertama untuk peran wajib 2FA. Email dikirim lewat Resend bila
`RESEND_API_KEY` + `EMAIL_FROM` di-set; tanpa itu Super Admin menyalin tautan. Super Admin aktif terakhir tidak bisa
diturunkan, dinonaktifkan, atau dihapus; tidak ada yang bisa menonaktifkan/menghapus akunnya sendiri.
