import type { PostSummary } from "@/types/content";
import { PostCard } from "@/components/cards/PostCard";
import { Pagination } from "@/components/navigation/Pagination";

type ArchiveTemplateProps = {
  /** Label kecil di atas judul, mis. "Kategori". */
  eyebrow: string;
  title: string;
  description?: string;
  posts: PostSummary[];
  page: number;
  totalPages: number;
  hrefFor: (page: number) => string;
};

/** Arsip kategori / tag / hasil pencarian. */
export function ArchiveTemplate({ eyebrow, title, description, posts, page, totalPages, hrefFor }: ArchiveTemplateProps) {
  return (
    <div className="bg-surface-alt pt-32 pb-16 lg:pt-40">
      <div className="container-site">
        <p className="text-sm font-semibold tracking-wide text-primary uppercase">{eyebrow}</p>
        <h1 className="mt-2 text-[32px] leading-[1.15] font-bold lg:text-[45px]">{title}</h1>
        {description && <p className="mt-3 max-w-2xl text-body">{description}</p>}

        {posts.length ? (
          <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {posts.map((post) => (
              <PostCard key={post.slug} post={post} />
            ))}
          </div>
        ) : (
          <p className="mt-10 text-body-soft">Belum ada publikasi.</p>
        )}

        <Pagination page={page} totalPages={totalPages} hrefFor={hrefFor} />
      </div>
    </div>
  );
}
