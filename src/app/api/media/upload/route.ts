import { type HandleUploadBody, handleUpload } from "@vercel/blob/client";
import { NextResponse } from "next/server";

import { UPLOAD_MAX_BYTES, UPLOAD_TYPES, isValidUploadPath, uploadFolder } from "@/lib/media-upload";
import { registerUpload } from "@/server/media-service";
import { can, getCurrentUser } from "@/server/permissions";

/**
 * Unggah langsung dari browser ke Vercel Blob (@vercel/blob/client → upload()).
 * Route ini (1) menerbitkan token unggah sekali pakai setelah memeriksa sesi, kemampuan
 * `media.manage`, tipe, ukuran, dan path media/YYYY/MM/; (2) menerima webhook
 * "upload completed" dari Vercel Blob dan mencatat file di tabel media. Webhook tidak sampai ke
 * localhost, jadi klien juga memanggil registerUploadAction setelah unggah (idempoten).
 */
export async function POST(request: Request): Promise<NextResponse> {
  let body: HandleUploadBody;
  try {
    body = (await request.json()) as HandleUploadBody;
  } catch {
    return NextResponse.json({ error: "Permintaan tidak sah." }, { status: 400 });
  }

  // Permintaan token: tolak lebih awal bila belum masuk / tidak berhak, sebelum menyentuh SDK Blob
  // (pemeriksaan yang sama diulang di onBeforeGenerateToken). Webhook "upload completed" tidak
  // membawa sesi — keasliannya diverifikasi handleUpload lewat tanda tangan Vercel Blob.
  if (body.type === "blob.generate-client-token") {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Sesi berakhir. Masuk lagi untuk mengunggah." }, { status: 401 });
    if (!can(user, "media.manage")) return NextResponse.json({ error: "Peran Anda tidak dapat mengunggah media." }, { status: 403 });
    if (!process.env.BLOB_READ_WRITE_TOKEN && !(process.env.VERCEL_OIDC_TOKEN && process.env.BLOB_STORE_ID)) {
      return NextResponse.json({ error: "Vercel Blob belum dikonfigurasi di lingkungan ini (BLOB_READ_WRITE_TOKEN)." }, { status: 503 });
    }
  }

  try {
    const result = await handleUpload({
      request,
      body,
      onBeforeGenerateToken: async (pathname, clientPayload) => {
        const user = await getCurrentUser();
        if (!user) throw new Error("Sesi berakhir. Masuk lagi untuk mengunggah.");
        if (!can(user, "media.manage")) throw new Error("Peran Anda tidak dapat mengunggah media.");

        let meta: { type?: unknown; size?: unknown } = {};
        try {
          meta = JSON.parse(clientPayload ?? "{}") as typeof meta;
        } catch {
          throw new Error("Keterangan file tidak sah.");
        }
        const type = typeof meta.type === "string" ? meta.type : "";
        const rule = UPLOAD_TYPES[type];
        if (!rule) throw new Error("Tipe file tidak didukung.");
        const max = UPLOAD_MAX_BYTES[rule.kind];
        if (typeof meta.size === "number" && meta.size > max) throw new Error("Ukuran file melebihi batas.");
        // Folder harus bulan ini (toleransi pergantian bulan antara klien dan server).
        const folders = [uploadFolder(), uploadFolder(new Date(Date.now() - 86_400_000)), uploadFolder(new Date(Date.now() + 86_400_000))];
        if (!isValidUploadPath(pathname, type) || !folders.some((f) => pathname.startsWith(`${f}/`))) throw new Error("Lokasi unggah tidak sah.");

        return {
          allowedContentTypes: [type],
          maximumSizeInBytes: max,
          addRandomSuffix: true,
          tokenPayload: JSON.stringify({ userId: user.id }),
        };
      },
      onUploadCompleted: async ({ blob, tokenPayload }) => {
        let userId: string | null = null;
        try {
          const parsed = JSON.parse(tokenPayload ?? "{}") as { userId?: unknown };
          userId = typeof parsed.userId === "string" ? parsed.userId : null;
        } catch {
          // tokenPayload ditandatangani Blob; bila tidak terbaca, catat tanpa pengunggah.
        }
        const saved = await registerUpload(userId, blob.url);
        if (!saved.ok) console.error("registerUpload (webhook) gagal:", blob.pathname, saved.error);
      },
    });
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Gagal menyiapkan unggahan." }, { status: 400 });
  }
}
