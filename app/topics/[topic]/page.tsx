import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import Articles from "@/components/Articles/Articles";
import Loading from "@/components/Articles/loading";
import JsonLd from "@/components/JsonLd";
import {
  type ArticleRecord,
  getPublishedTopicBySlug,
  type TopicSummary,
} from "@/lib/content";
import {
  DEFAULT_OG_IMAGE_PATH,
  DEFAULT_TWITTER_IMAGE_PATH,
  SITE_LOCALE,
  SITE_NAME,
  SITE_WEBSITE_ID,
  absoluteUrl,
  buildBreadcrumbSchema,
} from "@/lib/seo";

type RouteParams = {
  topic: string;
};

export const dynamic = "force-dynamic";

function buildTopicDescription(label: string) {
  return `Browse all ${label} tutorials, guides, and docs on ${SITE_NAME}.`;
}

function mapTopicArticles(articles: ArticleRecord[]) {
  return articles.map((article) => ({
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
  }));
}

function mapTopics(topics: TopicSummary[]) {
  return topics.map((topic) => ({
    label: topic.label,
    slug: topic.slug,
    path: topic.path,
    count: topic.count,
  }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<RouteParams>;
}): Promise<Metadata> {
  const { topic } = await params;
  const data = await getPublishedTopicBySlug(topic);

  if (!data) {
    return {
      title: "Topic Not Found",
      description: "The requested topic could not be found.",
      robots: {
        index: false,
        follow: false,
      },
    };
  }

  const pageUrl = absoluteUrl(data.topic.path);
  const description = buildTopicDescription(data.topic.label);
  const title = `${data.topic.label} Posts`;

  return {
    title,
    description,
    alternates: {
      canonical: pageUrl,
    },
    openGraph: {
      title: `${title} | ${SITE_NAME}`,
      description,
      url: pageUrl,
      siteName: SITE_NAME,
      type: "website",
      locale: SITE_LOCALE,
      images: [
        {
          url: DEFAULT_OG_IMAGE_PATH,
          width: 1200,
          height: 630,
          alt: `${data.topic.label} topic preview`,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: `${title} | ${SITE_NAME}`,
      description,
      images: [DEFAULT_TWITTER_IMAGE_PATH],
    },
  };
}

export default async function TopicPage({
  params,
}: {
  params: Promise<RouteParams>;
}) {
  const { topic } = await params;
  const data = await getPublishedTopicBySlug(topic);

  if (!data) {
    notFound();
  }

  const pageUrl = absoluteUrl(data.topic.path);
  const description = buildTopicDescription(data.topic.label);
  const jsonLd = [
    {
      "@context": "https://schema.org",
      "@type": "CollectionPage",
      name: `${data.topic.label} Posts`,
      description,
      url: pageUrl,
      isPartOf: {
        "@id": SITE_WEBSITE_ID,
      },
    },
    buildBreadcrumbSchema([
      { name: "Home", path: "/" },
      { name: "Posts", path: "/posts" },
      { name: data.topic.label, path: data.topic.path },
    ]),
  ];

  return (
    <main className="flex flex-col min-h-screen max-w-[95rem] w-full mx-auto px-4 lg:pt-0 sm:pt-4 xs:pt-2 lg:pb-4 md:pb-4 sm:pb-2 xs:pb-2">
      <JsonLd data={jsonLd} />
      <header className="py-6 md:py-12">
        <p className="uppercase tracking-[0.2em] text-white/60">Topic</p>
        <h1 className="text-subtitle mt-4">{data.topic.label}</h1>
        <p className="mt-4 max-w-3xl text-white/70">{description}</p>
      </header>
      <Suspense fallback={<Loading />}>
        <Articles
          initialArticles={mapTopicArticles(data.articles)}
          topics={mapTopics(data.topics)}
          activeTopicSlug={data.topic.slug}
        />
      </Suspense>
    </main>
  );
}
