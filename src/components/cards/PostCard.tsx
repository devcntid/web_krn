import Image from "next/image";
import Link from "next/link";
import { CalendarDays } from "lucide-react";

import { formatDateCard, formatDateLong } from "@/lib/format";
import type { PostSummary } from "@/types/content";
import { mediaUrl } from "@/lib/media";

/** Kartu grid Artikel/Berita (`pkp-card`): putih, gambar, judul, excerpt, tanggal + tombol. */
export function PostCard({ post }: { post: PostSummary }) {
  const href = `/${post.slug}/`;
  return (
    <article className="flex flex-col rounded-[10px] bg-white p-4 shadow-card">
      <Link href={href} className="block overflow-hidden rounded-[6px]" tabIndex={-1} aria-hidden>
        <div className="relative aspect-[4/3] bg-surface-alt">
          {post.featuredImage && (
            <Image
              src={mediaUrl(post.featuredImage.src)}
              alt={post.featuredImage.alt || post.title}
              fill
              sizes="(min-width: 1024px) 280px, (min-width: 640px) 45vw, 90vw"
              className="object-cover"
            />
          )}
        </div>
      </Link>
      <h3 className="mt-5 text-lg leading-[1.35] font-extrabold text-ink">
        <Link href={href} className="hover:text-primary">
          {post.title}
        </Link>
      </h3>
      <p className="mt-6 line-clamp-3 text-sm leading-[1.45] text-body-soft">{post.excerpt}</p>
      <div className="mt-auto flex items-center justify-between gap-3 pt-6">
        <time dateTime={post.date} className="flex items-center gap-2 text-xs text-body-soft">
          <CalendarDays aria-hidden className="size-4" />
          {formatDateCard(post.date)}
        </time>
        <Link
          href={href}
          className="rounded-[6px] bg-primary px-4 py-2.5 text-xs font-semibold text-white transition-opacity hover:opacity-90"
        >
          Selengkapnya
        </Link>
      </div>
    </article>
  );
}

/** Kartu sidebar "Kisah Lainnya" di template post (`bua-related-card`). */
export function RelatedPostCard({ post }: { post: PostSummary }) {
  const href = `/${post.slug}/`;
  return (
    <article>
      <Link href={href} className="relative block aspect-[16/9] overflow-hidden bg-surface-alt" tabIndex={-1} aria-hidden>
        {post.featuredImage && (
          <Image src={mediaUrl(post.featuredImage.src)} alt="" fill sizes="320px" className="object-cover" />
        )}
      </Link>
      <h3 className="mt-6 line-clamp-2 text-xl leading-[1.22] font-bold text-ink">
        <Link href={href} className="hover:text-primary">
          {post.title}
        </Link>
      </h3>
      <p className="mt-4 line-clamp-2 text-sm leading-[1.7] text-body-soft">{post.excerpt}</p>
      <div className="mt-6 flex items-center justify-between">
        <time dateTime={post.date} className="text-xs text-body-soft">
          {formatDateLong(post.date)}
        </time>
        <Link
          href={href}
          className="rounded-[8px] bg-primary px-[18px] py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90"
        >
          Selengkapnya
        </Link>
      </div>
    </article>
  );
}
