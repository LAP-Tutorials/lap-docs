import Authors from "@/components/Authors/Authors";
import LatestPosts from "@/components/LatestPosts/LatestPosts";
import NewsLoading from "@/components/NewsTicker/loading";
import AuthorsLoading from "@/components/Authors/loading";
import NewsTicker from "@/components/NewsTicker/NewsTicker";
import PageTitle from "@/components/PageTitle";
import Subheading from "@/components/Subheading";
import Sidebar from "@/components/Sidebar";
import { Suspense } from "react";
import type { Metadata } from "next";
import { getAllAuthors, getPublishedArticles } from "@/lib/content";
import {
  DEFAULT_OG_IMAGE_PATH,
  DEFAULT_TWITTER_IMAGE_PATH,
  SITE_DESCRIPTION,
  SITE_LOCALE,
  SITE_NAME,
  SITE_URL,
} from "@/lib/seo";

export const metadata: Metadata = {
  title: SITE_NAME,
  description: SITE_DESCRIPTION,
  openGraph: {
    title: SITE_NAME,
    description: SITE_DESCRIPTION,
    url: SITE_URL,
    siteName: SITE_NAME,
    type: "website",
    locale: SITE_LOCALE,
    images: [
      {
        url: DEFAULT_OG_IMAGE_PATH,
        width: 1200,
        height: 630,
        alt: `${SITE_NAME} homepage preview`,
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: SITE_NAME,
    description: SITE_DESCRIPTION,
    images: [DEFAULT_TWITTER_IMAGE_PATH],
  },
  alternates: {
    canonical: SITE_URL,
  },
};

type Article = {
  id: string;
  title: string;
  slug: string;
  description: string;
  authorName: string;
  date: string;
  read: string;
  label: string;
  img: string;
  imgAlt: string;
  topicPath: string;
  publish: boolean;
};

export const dynamic = "force-dynamic";

type AuthorType = {
  id: string;
  slug: string;
  name: string;
  avatar: string;
  imgAlt: string;
  job: string;
  city: string;
};

async function getData() {
  try {
    const [latestArticles, allAuthors] = await Promise.all([
      getPublishedArticles(7),
      getAllAuthors(),
    ]);

    const articles: Article[] = latestArticles.map((article) => ({
      id: article.id,
      title: article.title,
      slug: article.slug,
      description: article.description,
      authorName: article.authorName,
      date: article.date.toISOString(),
      read: article.read,
      label: article.label,
      img: article.img,
      imgAlt: article.imgAlt,
      topicPath: article.topicPath,
      publish: article.publish,
    }));

    // Shuffle authors
    const shuffledAuthors = [...allAuthors]
      .map((author) => ({
        id: author.docId,
        slug: author.slug,
        name: author.name,
        avatar: author.avatar,
        imgAlt: author.imgAlt,
        job: author.job,
        city: author.city,
      }))
      .sort(() => 0.5 - Math.random())
      .slice(0, 4);

    return { articles, shuffledAuthors };
  } catch (error) {
    console.error("Error fetching home data:", error);
    return { articles: [], shuffledAuthors: [] };
  }
}

export default async function Home() {
  const { articles, shuffledAuthors } = await getData();

  return (
    <main className="flex flex-col min-h-screen max-w-[95rem] w-full mx-auto px-4 lg:pt-0 sm:pt-4 xs:pt-2 lg:pb-4 md:pb-4 sm:pb-2 xs:pb-2">
      <PageTitle
        className="sr-only"
        imgSrc="/images/titles/lap-docs.svg"
        imageWidth={1520}
        imageHeight={216}
        priority
        decorative
      >
        L.A.P - Docs
      </PageTitle>

      <Suspense fallback={<NewsLoading />}>
        <NewsTicker />
      </Suspense>

      <LatestPosts initialPosts={articles} sidebar={<Sidebar />} />

      <Subheading className="text-subheading" url="/team" linkText="Full Team">
        Team
      </Subheading>

      <Suspense fallback={<AuthorsLoading />}>
        <Authors initialAuthors={shuffledAuthors} />
      </Suspense>
    </main>
  );
}

