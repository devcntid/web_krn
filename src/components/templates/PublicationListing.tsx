import { getDictionary } from "@/i18n/dictionaries";
import { getLocale } from "@/i18n/request";
import { PageHero } from "@/components/sections/PageHero";
import { GRID_TABS, PostGrid, type GridTab } from "@/components/sections/PostGrid";
import { JsonLd } from "@/components/seo/JsonLd";
import { breadcrumbJsonLd } from "@/lib/seo";

const HERO_IMAGE = {
  src: "/wp-content/uploads/2026/06/Clean-Water.jpg",
  width: 1920,
  height: 1080,
  alt: "Anak-anak Gaza bergembira saat kegiatan bantuan Relawan Nusantara",
};

export type ListingSearchParams = Promise<{ kategori?: string; q?: string; hal?: string; muat?: string }>;

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
  const t = getDictionary(getLocale()).listing;
  const category = (GRID_TABS.find((t) => t.slug === sp.kategori)?.slug ?? defaultCategory) as GridTab;

  return (
    <>
      <PageHero title={t.titles[title] ?? title} image={HERO_IMAGE} overlay={0.2} width="container" />
      <section className="bg-surface-alt py-6 md:py-12 lg:py-16">
        <div className="container-site">
          <h2 className="text-[26px] leading-[1.15] font-extrabold md:text-[30px] md:leading-[1.1] lg:text-[45px]">{t.heading}</h2>
          <p className="mt-3 text-base text-body">
            {t.lead}
          </p>
          <div className="mt-[18px] md:mt-10">
            <PostGrid
              basePath={basePath}
              category={category}
              defaultCategory={defaultCategory}
              page={Number(sp.hal) || 1}
              query={sp.q ?? ""}
              loaded={Number(sp.muat) || 1}
            />
          </div>
        </div>
      </section>
      <JsonLd
        data={breadcrumbJsonLd([
          { name: "Beranda", path: "/" },
          { name: t.titles[title] ?? title, path: basePath },
        ])}
      />
    </>
  );
}
