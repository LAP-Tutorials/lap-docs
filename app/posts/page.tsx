import Articles from "@/components/Articles/Articles";
import Loading from "@/components/Articles/loading";
import PageTitle from "@/components/PageTitle";
import { Suspense } from "react";
import type { Metadata } from "next";
import JsonLd from "@/components/JsonLd";
import { buildTopicSummaries, getPublishedArticles } from "@/lib/content";
import {
  DEFAULT_OG_IMAGE_PATH,
  DEFAULT_TWITTER_IMAGE_PATH,
  SITE_LOCALE,
  SITE_NAME,
  SITE_WEBSITE_ID,
  absoluteUrl,
  buildBreadcrumbSchema,
} from "@/lib/seo";

export const metadata: Metadata = {
  title: "Tutorial Posts",
  description: "Browse the latest L.A.P - Docs articles, tutorials, and guides.",
  openGraph: {
    title: `Tutorial Posts | ${SITE_NAME}`,
    description: "Browse the latest L.A.P - Docs articles, tutorials, and guides.",
    url: absoluteUrl("/posts"),
    siteName: SITE_NAME,
    type: "website",
    locale: SITE_LOCALE,
    images: [
      {
        url: DEFAULT_OG_IMAGE_PATH,
        width: 1200,
        height: 630,
        alt: `${SITE_NAME} posts preview`,
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: `Tutorial Posts | ${SITE_NAME}`,
    description: "Browse the latest L.A.P - Docs articles, tutorials, and guides.",
    images: [DEFAULT_TWITTER_IMAGE_PATH],
  },
  alternates: {
    canonical: absoluteUrl("/posts"),
  },
};

export const dynamic = "force-dynamic";

interface Article {
  id: string;
  title: string;
  label: string;
  date: string;
  img: string;
  imgAlt: string;
  slug: string;
  description: string;
  read: string;
  authorUID: string;
  authorName?: string;
  topicPath: string;
  publish: boolean;
}

async function getArticles() {
  try {
    const articles = await getPublishedArticles();
    return {
      articles: articles.map((article) => ({
        id: article.id,
        title: article.title,
        label: article.label,
        date: article.date.toISOString(),
        img: article.img,
        imgAlt: article.imgAlt,
        slug: article.slug,
        description: article.description,
        read: article.read,
        authorUID: article.authorUID,
        authorName: article.authorName,
        topicPath: article.topicPath,
        publish: article.publish,
      })),
      topics: buildTopicSummaries(articles),
    };
  } catch (error) {
    console.error("Error fetching data:", error);
    return { articles: [], topics: [] };
  }
}

export default async function MagazinePage() {
  const { articles, topics } = await getArticles();

  const pageUrl = absoluteUrl("/posts");
  const jsonLd = [
    {
      "@context": "https://schema.org",
      "@type": "CollectionPage",
      name: "Tutorial Posts",
      description: "Browse the latest L.A.P - Docs articles, tutorials, and guides.",
      url: pageUrl,
      isPartOf: {
        "@id": SITE_WEBSITE_ID,
      },
    },
    buildBreadcrumbSchema([
      { name: "Home", path: "/" },
      { name: "Posts", path: "/posts" },
    ]),
  ];

  return (
    <main className="flex flex-col min-h-screen max-w-[95rem] w-full mx-auto px-4 lg:pt-0 sm:pt-4 xs:pt-2 lg:pb-4 md:pb-4 sm:pb-2 xs:pb-2">
      <JsonLd data={jsonLd} />
      <PageTitle
        className="sr-only"
        imgSrc="/images/titles/Magazine.svg"
        imageWidth={1520}
        imageHeight={215}
        decorative
      >
        Tutorial Posts
      </PageTitle>
      <Suspense fallback={<Loading />}>
        <Articles initialArticles={articles} topics={topics} />
      </Suspense>
    </main>
  );
}

