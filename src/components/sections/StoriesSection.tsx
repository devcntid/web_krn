import { getDictionary } from "@/i18n/dictionaries";
import { getLocale } from "@/i18n/request";
import { Link } from "@/i18n/Link";

import type { PostSummary } from "@/types/content";
import { PostCard } from "@/components/cards/PostCard";
import { Carousel } from "@/components/ui/Carousel";

type StoriesSectionProps = {
  posts: PostSummary[];
  /** Label carousel untuk pembaca layar. */
  label: string;
  /** Tujuan tombol "Lihat Semua Cerita". */
  href: string;
  heading?: string;
  /** Tampilkan ringkasan di kartu (default: tidak). */
  showExcerpt?: boolean;
};

/** "Cerita Berdampak": carousel kartu publikasi dengan panah kanan-bawah (artboard 04 · Pilar Program). */
export function StoriesSection({ posts, label, href, heading, showExcerpt = false }: StoriesSectionProps) {
  if (!posts.length) return null;
  const t = getDictionary(getLocale()).common;
  return (
    <section className="py-12 md:py-[72px]">
      <div className="container-site">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <h2 className="text-[28px] font-bold md:text-[36px]">{heading ?? t.impactStories}</h2>
          <Link
            href={href}
            className="inline-flex min-h-11 items-center rounded-full border-2 border-primary px-[18px] py-2 text-[15px] font-medium text-primary transition-colors hover:bg-primary hover:text-white"
          >
            {t.seeAllStories}
          </Link>
        </div>
        <div className="mt-7 md:mt-9">
          <Carousel
            label={label}
            arrows="bottom-right"
            loop={false}
            slideClassName="basis-full sm:basis-1/2 lg:basis-1/3 pl-6 pb-5 pt-1"
            gapClassName="-ml-6"
          >
            {posts.map((post) => (
              <div key={post.slug} className="h-full px-1">
                <PostCard post={post} showExcerpt={showExcerpt} />
              </div>
            ))}
          </Carousel>
        </div>
      </div>
    </section>
  );
}
