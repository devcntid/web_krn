import { siFacebook, siInstagram, siThreads, siTiktok, siYoutube } from "simple-icons";

import { socials } from "@/config/site";

const paths: Record<string, string | null> = {
  Instagram: siInstagram.path,
  Facebook: siFacebook.path,
  YouTube: siYoutube.path,
  Threads: siThreads.path,
  TikTok: siTiktok.path,
  LinkedIn: null, // simple-icons tidak lagi menyediakan LinkedIn — dirender sebagai teks "in"
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
              {d ? (
                <svg viewBox="0 0 24 24" aria-hidden className="size-4 fill-current">
                  <path d={d} />
                </svg>
              ) : (
                <span aria-hidden className="text-[13px] leading-none font-bold">
                  in
                </span>
              )}
            </a>
          </li>
        );
      })}
    </ul>
  );
}
