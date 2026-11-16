import { siFacebook, siInstagram, siThreads, siTiktok, siYoutube } from "simple-icons";

import { socials } from "@/config/site";

const paths: Record<string, string> = {
  Instagram: siInstagram.path,
  Facebook: siFacebook.path,
  YouTube: siYoutube.path,
  Threads: siThreads.path,
  TikTok: siTiktok.path,
  // simple-icons tidak lagi menyediakan LinkedIn — path glyph disalin langsung.
  LinkedIn:
    "M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z",
};

/** Ikon sosial bulat hitam seperti footer existing. */
export function SocialIcons({ className = "" }: { className?: string }) {
  return (
    <ul className={`flex flex-wrap items-center gap-2 ${className}`}>
      {socials.map((s) => {
        const d = paths[s.name];
        return (
          <li key={s.name}>
            <a
              href={s.href}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={s.name}
              className="flex size-[30px] items-center justify-center rounded-full bg-ink text-white transition-opacity hover:opacity-80"
            >
              <svg viewBox="0 0 24 24" aria-hidden className="size-4 fill-current">
                <path d={d} />
              </svg>
            </a>
          </li>
        );
      })}
    </ul>
  );
}
