import { StoriesSection } from "@/components/sections/StoriesSection";
import { getAllPosts, getLatestPosts } from "@/lib/content";
import type { SectionData } from "@/server/sections";
import type { PostSummary } from "@/types/content";

/** Publikasi dari kategori terpilih (kosong = terbaru); dilengkapi publikasi terbaru bila terlalu sedikit. */
async function pickPosts(data: SectionData<"posts">): Promise<PostSummary[]> {
  if (data.categories.length === 0) return getLatestPosts(data.count);
  const stories = (await getAllPosts()).filter((p) => p.categories.some((c) => data.categories.includes(c.slug))).slice(0, data.count);
  if (stories.length >= data.fillMin) return stories;
  const seen = new Set(stories.map((s) => s.slug));
  const filler = (await getLatestPosts(data.count)).filter((p) => !seen.has(p.slug));
  return [...stories, ...filler].slice(0, data.count);
}

/** Grid/carousel publikasi "Cerita Berdampak" dengan sumber kategori. */
export async function PostsSection({ data }: { data: SectionData<"posts"> }) {
  return (
    <StoriesSection posts={await pickPosts(data)} label={data.label} href={data.href} heading={data.heading || undefined} showExcerpt={data.showExcerpt} />
  );
}
