import { PageHero } from "@/components/sections/PageHero";
import { GRID_TABS, PostGrid, type GridTab } from "@/components/sections/PostGrid";

const HERO_IMAGE = {
  src: "/wp-content/uploads/2026/06/Clean-Water.jpg",
  width: 1920,
  height: 1080,
  alt: "Anak-anak Gaza bergembira saat kegiatan bantuan Relawan Nusantara",
};

export type ListingSearchParams = Promise<{ kategori?: string; q?: string; hal?: string }>;

/** Halaman /artikel/ dan /berita/: hero + "Kilas Perjuangan dari Nusantara" + grid. */
export async function PublicationListing({
  title,
  basePath,
  defaultCategory,
  searchParams,
}: {
  title: string;
  basePath: string;
  defaultCategory: GridTab;
  searchParams: ListingSearchParams;
}) {
  const sp = await searchParams;
  const category = (GRID_TABS.find((t) => t.slug === sp.kategori)?.slug ?? defaultCategory) as GridTab;

  return (
    <>
      <PageHero title={title} image={HERO_IMAGE} overlay={0.2} />
      <section className="bg-surface-alt py-12 lg:py-16">
        <div className="container-site">
          <h2 className="text-[30px] leading-[1.1] font-extrabold lg:text-[45px]">Kilas Perjuangan dari Nusantara</h2>
          <p className="mt-3 text-base text-body">
            Cerita tentang langkah-langkah kecil dari Nusantara yang menjadi kekuatan besar bagi kemanusiaan
          </p>
          <div className="mt-10">
            <PostGrid
              basePath={basePath}
              category={category}
              defaultCategory={defaultCategory}
              page={Number(sp.hal) || 1}
              query={sp.q ?? ""}
            />
          </div>
        </div>
      </section>
    </>
  );
}
