import { getAllPosts } from "@/lib/content";
import type { Post } from "@/types/content";
import { PageHero } from "@/components/sections/PageHero";
import { RichContent } from "@/components/content/RichContent";
import { RelatedPostCard } from "@/components/cards/PostCard";
import { DonationCta } from "@/components/sections/DonationCta";
import { PostStickyBar } from "@/components/sections/PostStickyBar";

/** Sidebar "Kisah Lainnya": 3 post terbaru selain post ini. */
function relatedPosts(slug: string) {
  return getAllPosts()
    .filter((p) => p.slug !== slug)
    .slice(0, 3);
}

/** Replikasi Divi Theme Builder body template untuk single post. */
export function PostTemplate({ post }: { post: Post }) {
  const related = relatedPosts(post.slug);
  return (
    <article data-template="post">
      <PageHero title={post.title} image={post.featuredImage} size="post" width="narrow" />

      <div className="mx-auto grid w-[90%] max-w-[1080px] gap-10 py-8 md:gap-12 md:py-12 lg:grid-cols-[696fr_319fr] lg:gap-[59px]">
        <RichContent html={post.html} className="text-[15px] leading-[1.7] text-ink lg:text-[14px] lg:leading-[23.8px]" />

        <aside aria-labelledby="kisah-lainnya">
          <h2 id="kisah-lainnya" className="text-xl font-bold text-ink">
            Kisah Lainnya
          </h2>
          <div className="mt-6 space-y-10">
            {related.map((p) => (
              <RelatedPostCard key={p.slug} post={p} />
            ))}
          </div>
        </aside>
      </div>

      <DonationCta />
      <PostStickyBar />
    </article>
  );
}
