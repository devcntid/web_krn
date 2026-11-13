"use client";

import Image from "next/image";
import { useState } from "react";

/**
 * Facade YouTube: tampilkan thumbnail + tombol play; iframe baru dimuat saat
 * diklik (menghemat ±500KB JS pihak ketiga pada load awal).
 */
export function YouTubeFacade({ id, title }: { id: string; title: string }) {
  const [play, setPlay] = useState(false);
  return (
    <div className="relative aspect-video w-full overflow-hidden rounded-[20px] bg-ink">
      {play ? (
        <iframe
          src={`https://www.youtube-nocookie.com/embed/${id}?autoplay=1&rel=0`}
          title={title}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          className="absolute inset-0 size-full"
        />
      ) : (
        <button type="button" onClick={() => setPlay(true)} className="group absolute inset-0" aria-label={`Putar video: ${title}`}>
          <Image
            src={`https://i.ytimg.com/vi/${id}/maxresdefault.jpg`}
            alt=""
            fill
            sizes="(min-width: 1080px) 1080px, 90vw"
            className="object-cover"
          />
          <span className="absolute top-1/2 left-1/2 flex size-[90px] -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border-[5px] border-white transition-transform group-hover:scale-110">
            <svg viewBox="0 0 24 24" aria-hidden className="ml-1 size-10 fill-white">
              <path d="M8 5v14l11-7z" />
            </svg>
          </span>
        </button>
      )}
    </div>
  );
}
