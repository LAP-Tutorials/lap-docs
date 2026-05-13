import Image from "next/image";

import PopularArticles from "./PopularArticles";
import { Button } from "./ui/button";
import magazineCover from "@/public/logos/LAP-Logo-Color.png";
import { getPublishedArticles } from "@/lib/content";
import { SITE_NAME } from "@/lib/seo";

type PopularArticle = {
  id: string;
  title: string;
  slug: string;
  authorName: string;
  popularity: boolean;
  publish: boolean;
  date: string;
  popularityRank?: number;
};

async function getPopularArticles(): Promise<PopularArticle[]> {
  try {
    const articles = await getPublishedArticles();

    return articles
      .filter((article) => article.popularity)
      .sort(
        (a, b) =>
          (a.popularityRank ?? Number.MAX_SAFE_INTEGER) -
            (b.popularityRank ?? Number.MAX_SAFE_INTEGER) ||
          b.date.getTime() - a.date.getTime(),
      )
      .map((article) => ({
        id: article.id,
        title: article.title,
        slug: article.slug,
        authorName: article.authorName || "Unknown Team Member",
        popularity: article.popularity,
        publish: article.publish,
        date: article.date.toISOString(),
        popularityRank: article.popularityRank,
      }));
  } catch (error) {
    console.error("Error fetching popular articles:", error);
    return [];
  }
}

export default async function Sidebar() {
  const youtubeChannelUrl =
    "https://www.youtube.com/@lap-tutorials?sub_confirmation=1";

  const popularArticles = await getPopularArticles();

  return (
    <aside>
      <h3 className="uppercase font-semibold mb-2">Subscribe To</h3>
      <p className="text-4xl font-semibold">{SITE_NAME}</p>
      <Image
        className="w-[20rem] pt-8 pb-4"
        src={magazineCover}
        alt={`${SITE_NAME} logo`}
      />
      <Button
        asChild
        className="hover:bg-[#8a2be2] transition ease-in-out duration-300"
      >
        <a href={youtubeChannelUrl} target="_blank" rel="noopener noreferrer">
          Subscribe on YouTube
        </a>
      </Button>
      <PopularArticles initialArticles={popularArticles} />
    </aside>
  );
}
