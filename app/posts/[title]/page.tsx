import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import ArticleContent from "@/components/ArticleContent";
import AuthorCard from "@/components/AuthorCard";
import JsonLd from "@/components/JsonLd";
import PostNavigation from "@/components/PostNavigation";
import Subheading from "@/components/Subheading";
import { getPublishedArticleBySlug, getPublishedArticles } from "@/lib/content";
import { processMarkdown } from "@/lib/markdown";
import {
  SITE_LOCALE,
  SITE_NAME,
  absoluteUrl,
  buildBreadcrumbSchema,
  buildPublisherSchema,
} from "@/lib/seo";

type RouteParams = {
  title: string;
};

export const dynamic = "force-dynamic";

function buildKeywords(
  articleTitle: string,
  articleDescription: string,
  label: string,
) {
  const stopWords = new Set([
    "a",
    "an",
    "the",
    "and",
    "or",
    "but",
    "is",
    "are",
    "of",
    "to",
    "in",
    "on",
    "for",
    "with",
    "at",
    "by",
    "from",
    "up",
    "about",
    "into",
    "over",
    "after",
  ]);

  const extractKeywords = (text: string) =>
    text
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, "")
      .split(/\s+/)
      .filter((word) => word.length > 2 && !stopWords.has(word));

  return Array.from(
    new Set([
      label,
      "Technology",
      "Tutorials",
      SITE_NAME,
      ...extractKeywords(articleTitle),
      ...extractKeywords(articleDescription),
    ]),
  );
}

export async function generateMetadata({
  params,
}: {
  params: Promise<RouteParams>;
}): Promise<Metadata> {
  const { title } = await params;
  const article = await getPublishedArticleBySlug(title);

  if (!article) {
    return {
      title: "Article Not Found",
      description: "The requested article could not be found.",
      robots: {
        index: false,
        follow: false,
      },
    };
  }

  const articleUrl = absoluteUrl(`/posts/${article.slug}`);
  const articleImage = absoluteUrl(article.img);
  const generatedOgImage = absoluteUrl(
    `/posts/${article.slug}/opengraph-image`,
  );
  const authorUrl = article.author?.slug
    ? absoluteUrl(`/team/${article.author.slug}`)
    : undefined;

  return {
    title: article.title,
    description: article.description || `Read this article on ${SITE_NAME}.`,
    authors: [{ name: article.authorName, url: authorUrl }],
    creator: article.authorName,
    publisher: SITE_NAME,
    category: article.label || "Tutorials",
    alternates: {
      canonical: articleUrl,
    },
    openGraph: {
      title: article.title,
      description: article.description,
      url: articleUrl,
      siteName: SITE_NAME,
      locale: SITE_LOCALE,
      type: "article",
      publishedTime: article.date.toISOString(),
      modifiedTime: article.updatedAt.toISOString(),
      authors: [article.authorName],
      images: [
        {
          url: articleImage,
          alt: article.imgAlt || article.title,
        },
        {
          url: generatedOgImage,
          width: 1200,
          height: 630,
          alt: `${article.title} on ${SITE_NAME}`,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: article.title,
      description: article.description,
      images: [articleImage],
    },
  };
}

export default async function ArticleDetails({
  params,
}: {
  params: Promise<RouteParams>;
}) {
  const { title } = await params;
  const article = await getPublishedArticleBySlug(title);

  if (!article) {
    notFound();
  }

  const processedHtml = await processMarkdown(article.content || "");
  const articleUrl = absoluteUrl(`/posts/${article.slug}`);
  const articleImages = Array.from(
    new Set(
      [
        article.img ? absoluteUrl(article.img) : null,
        absoluteUrl(`/posts/${article.slug}/opengraph-image`),
      ].filter((value): value is string => Boolean(value)),
    ),
  );
  const latestArticles = (await getPublishedArticles())
    .filter((entry) => entry.id !== article.id)
    .slice(0, 3);

  const jsonLd: Array<Record<string, unknown>> = [
    {
      "@context": "https://schema.org",
      "@type": "BlogPosting",
      headline: article.title,
      description: article.description,
      image: articleImages,
      datePublished: article.date.toISOString(),
      dateModified: article.updatedAt.toISOString(),
      articleSection: article.label || undefined,
      keywords: buildKeywords(
        article.title,
        article.description,
        article.label,
      ),
      inLanguage: "en-US",
      author: {
        "@type": "Person",
        "@id": article.author?.slug
          ? `${absoluteUrl(`/team/${article.author.slug}`)}#person`
          : `${articleUrl}#author`,
        name: article.authorName,
        url: article.author?.slug
          ? absoluteUrl(`/team/${article.author.slug}`)
          : undefined,
      },
      publisher: buildPublisherSchema(),
      mainEntityOfPage: {
        "@type": "WebPage",
        "@id": articleUrl,
      },
    },
    buildBreadcrumbSchema([
      { name: "Home", path: "/" },
      { name: "Posts", path: "/posts" },
      { name: article.title, path: `/posts/${article.slug}` },
    ]),
  ];

  if (article.video) {
    jsonLd.push({
      "@context": "https://schema.org",
      "@type": "VideoObject",
      name: article.title,
      description: article.description,
      thumbnailUrl: [article.video.thumbnailUrl || absoluteUrl(article.img)],
      uploadDate: article.date.toISOString(),
      contentUrl: article.video.url,
      embedUrl: article.video.embedUrl,
      potentialAction: {
        "@type": "WatchAction",
        target: article.video.url,
      },
    });
  }

  return (
    <main className="max-w-[95rem] w-full mx-auto px-4 md:pt-8 sm:pt-4 xs:pt-2 lg:pb-4 md:pb-4 sm:pb-2 xs:pb-2">
      <JsonLd data={jsonLd} />
      <PostNavigation href="/posts">POSTS</PostNavigation>

      <article className="grid md:grid-cols-2 gap-6 md:gap-10 pb-6 md:pb-24 items-start">
        <div>
          <h1 className="text-subtitle">{article.title}</h1>
        </div>

        <div className="flex flex-col gap-6 md:gap-8">
          <Link
            href={article.topicPath}
            className="px-3 py-2 border border-white rounded-full w-fit h-fit hover:bg-white hover:text-black transition ml-auto"
          >
            <span className="uppercase">{article.label}</span>
          </Link>
          <p>{article.description}</p>
          <div className="flex flex-col sm:flex-row md:items-center gap-2 sm:gap-6">
            <span className="flex flex-wrap">
              <p className="font-semibold pr-2">Author:</p>
              {article.author?.slug ? (
                <Link
                  href={`/team/${article.author.slug}`}
                  className="hover:underline"
                >
                  {article.authorName}
                </Link>
              ) : (
                <p>{article.authorName}</p>
              )}
            </span>
            <span className="flex flex-wrap">
              <p className="font-semibold pr-2">Published:</p>
              <time dateTime={article.date.toISOString()}>
                {article.date.toLocaleDateString("en-US", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </time>
            </span>

            <span className="flex flex-wrap items-center">
              <p className="font-semibold pr-2">Read:</p>
              <p>{article.read}</p>
            </span>
            {article.video ? (
              <a
                href={article.video.url}
                target="_blank"
                rel="noopener noreferrer"
                className="px-3 py-2 border border-white rounded-full w-fit h-fit hover:bg-white hover:text-black transition"
              >
                Watch Source Video
              </a>
            ) : null}
          </div>
        </div>
      </article>

      <div className="relative w-full h-auto aspect-[16/9]">
        <Image
          src={article.img}
          alt={article.imgAlt}
          fill
          sizes="(min-width: 768px) 768px, 100vw"
          className="object-cover w-full h-auto"
        />
      </div>

      <div className="w-full">
        <ArticleContent htmlContent={processedHtml} />
      </div>

      {article.author ? (
        <div className="pt-10 pb-20">
          <Subheading
            className="text-subheading"
            url={`/team/${article.author.slug}`}
            linkText="Check out"
          >
            Author
          </Subheading>
          <AuthorCard authorData={article.author} />
        </div>
      ) : null}

      <div>
        <Subheading className="text-subheading" url="/posts" linkText="See all">
          Latest Posts
        </Subheading>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3  mb-12 md:mb-48">
          {latestArticles.map((entry) => (
            <article className="border border-white p-8" key={entry.id}>
              <div className="flex items-center justify-between gap-4">
                <time dateTime={entry.date.toISOString()}>
                  {entry.date.toLocaleDateString("en-US", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </time>
                <Link
                  href={entry.topicPath}
                  className="px-3 py-2 border border-white rounded-full hover:bg-white hover:text-black transition"
                >
                  <span className="uppercase">{entry.label}</span>
                </Link>
              </div>
              <Link href={`/posts/${entry.slug}`}>
                <Image
                  className="w-full my-8 hover:scale-105 transition-transform"
                  src={entry.img}
                  alt={entry.imgAlt}
                  width={800}
                  height={450}
                />
              </Link>
              <h2 className="heading3-title mb-3">
                <Link href={`/posts/${entry.slug}`}>{entry.title}</Link>
              </h2>
              <p className="mt-3 mb-12">{entry.description}</p>
              <div className="flex flex-wrap gap-4">
                <span className="flex">
                  <p className="font-semibold pr-2">Author</p>
                  <p>{entry.authorName}</p>
                </span>
                <span className="flex">
                  <p className="font-semibold pr-2">Duration</p>
                  <p>{entry.read}</p>
                </span>
              </div>
            </article>
          ))}
        </div>
      </div>
    </main>
  );
}
