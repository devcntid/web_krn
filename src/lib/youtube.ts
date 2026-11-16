/** Ambil ID video dari berbagai bentuk URL YouTube (watch, youtu.be, embed, shorts, live); null bila bukan URL YouTube. */
export function youtubeId(input: string): string | null {
  let url: URL;
  try {
    url = new URL(input.trim());
  } catch {
    return null;
  }
  const host = url.hostname.replace(/^www\.|^m\./, "");
  let id: string | null = null;
  if (host === "youtu.be") id = url.pathname.slice(1).split("/")[0] ?? null;
  else if (host === "youtube.com" || host === "youtube-nocookie.com") {
    if (url.pathname === "/watch") id = url.searchParams.get("v");
    else id = url.pathname.match(/^\/(?:embed|shorts|live)\/([^/?]+)/)?.[1] ?? null;
  }
  return id && /^[\w-]{6,20}$/.test(id) ? id : null;
}
