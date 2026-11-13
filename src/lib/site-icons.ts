import "server-only";

import fs from "node:fs";
import path from "node:path";

import type { Metadata } from "next";

type IconLink = { rel: string; href: string; sizes?: string };

/** Ikon situs hasil ekspor (content/site.json) → metadata.icons. */
export function siteIcons(): Metadata["icons"] {
  const file = path.join(process.cwd(), "content", "site.json");
  if (!fs.existsSync(file)) return undefined;
  const { icons = [] } = JSON.parse(fs.readFileSync(file, "utf8")) as { icons?: IconLink[] };
  return {
    icon: icons.filter((i) => i.rel === "icon").map((i) => ({ url: i.href, sizes: i.sizes })),
    apple: icons.filter((i) => i.rel === "apple-touch-icon").map((i) => ({ url: i.href, sizes: i.sizes })),
  };
}
