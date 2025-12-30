import { db } from "@/lib/firebase";
import {
  collection,
  query,
  where,
  getDocs,
  orderBy,
  limit,
} from "firebase/firestore";
import PostNavigation from "@/components/PostNavigation";
import SocialSharing from "@/components/SocialSharing";
import Subheading from "@/components/Subheading";
import Link from "next/link";
import ArticleContent from "@/components/ArticleContent";
import AuthorCard from "@/components/AuthorCard";
import JsonLd from "@/components/JsonLd";
import type { Metadata } from "next";

import {
  RiInstagramLine,
  RiTwitterFill,
  RiYoutubeFill,
  RiGithubFill,
  RiTiktokFill,
  RiPatreonFill,
} from "react-icons/ri";

import { processMarkdown } from "@/lib/markdown";

interface Article {
  id: string;
  title: string;
  slug: string;
  content: string;
  date: Date;
  read: string;
  publish: boolean;
  label: string;
  img: string;
  imgAlt: string;
  description: string;
  authorUID: string;
  authorName?: string;
  authorAvatar?: string;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ title: string }>;
}): Promise<Metadata> {
  const { title } = await params;
  try {
    const articlesRef = collection(db, "articles");
    const q = query(articlesRef, where("slug", "==", title));
    const snapshot = await getDocs(q);

    if (snapshot.empty) {
      return {
        title: "Article Not Found",
        description: "The requested article could not be found.",
      };
    }

    const articleData = snapshot.docs[0].data();
    const articleTitle = articleData.title || "Untitled Article";
    const articleDescription =
      articleData.description || "Read this article on L.A.P Docs.";
    const articleImage = articleData.img;
    const articleDate = articleData.date
      ? articleData.date.toDate().toISOString()
      : new Date().toISOString();

    // Fetch author name if available
    let authorName = "L.A.P Team";
    if (articleData.authorUID) {
      const authorSnapshot = await getDocs(
        query(
          collection(db, "authors"),
          where("uid", "==", articleData.authorUID)
        )
      );
      if (!authorSnapshot.empty) {
        authorName = authorSnapshot.docs[0].data().name || authorName;
      }
    }

    // Generate keywords from Title and Description
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

    const extractKeywords = (text: string) => {
      return text
        .toLowerCase()
        .replace(/[^a-z0-9\s]/g, "") // Remove bad chars
        .split(/\s+/)
        .filter((word) => word.length > 2 && !stopWords.has(word));
    };

    const titleKeywords = extractKeywords(articleTitle);
    const descKeywords = extractKeywords(articleDescription);
    const uniqueKeywords = Array.from(
      new Set([
        articleData.label,
        "Technology",
        "Tutorials",
        "L.A.P Docs",
        ...titleKeywords,
        ...descKeywords,
      ])
    );

    return {
      title: articleTitle,
      description: articleDescription,
      keywords: uniqueKeywords,
      authors: [{ name: authorName }],
      alternates: {
        canonical: `https://lap-docs.netlify.app/posts/${articleData.slug}`,
      },
      openGraph: {
        title: articleTitle,
        description: articleDescription,
        url: `/posts/${articleData.slug}`,
        siteName: "L.A.P Docs",
        type: "article",
        publishedTime: articleDate,
        authors: [authorName],
        images: articleImage
          ? [
              {
                url: articleImage,
                alt: articleData.imgAlt || articleTitle,
              },
            ]
          : [],
      },
      twitter: {
        card: "summary_large_image",
        title: articleTitle,
        description: articleDescription,
        images: articleImage ? [articleImage] : [],
      },
    };
  } catch (error) {
    return {
      title: "Error Loading Article",
    };
  }
}

export default async function ArticleDetails({
  params,
}: {
  params: Promise<{ title: string }>;
}) {
  const { title } = await params; // Await the params object
  try {
    // Get main article
    const articlesRef = collection(db, "articles");
    const articleQuery = query(articlesRef, where("slug", "==", title));
    const articleSnapshot = await getDocs(articleQuery);

    if (articleSnapshot.empty) {
      return (
        <main className="max-w-[95rem] w-full mx-auto px-4 sm:pt-4 xs:pt-2 lg:pb-4 md:pb-4 sm:pb-2 xs:pb-2">
          <p>Article not found</p>
        </main>
      );
    }

    const articleDoc = articleSnapshot.docs[0];
    const articleData = articleDoc.data();

    // Get author data
    const authorSnapshot = await getDocs(
      query(
        collection(db, "authors"),
        where("uid", "==", articleData.authorUID)
      )
    );

    const authorData = authorSnapshot.docs[0]?.data() || {};

    // Process article content
    const processedArticle: Article = {
      id: articleDoc.id,
      title: articleData.title,
      slug: articleData.slug,
      content: articleData.content,
      date: articleData.date ? articleData.date.toDate() : new Date(),
      read: articleData.read,
      label: articleData.label,
      img: articleData.img,
      imgAlt: articleData.imgAlt,
      description: articleData.description,
      authorUID: articleData.authorUID,
      authorName: authorData.name || "Unknown Author",
      authorAvatar: authorData.avatar || "/default-avatar.png",
      publish: false,
    };

    const processedHtml = await processMarkdown(articleData.content || "");

    // Get latest articles (excluding current)
    const latestSnapshot = await getDocs(
      query(
        collection(db, "articles"),
        where("publish", "==", true),
        orderBy("date", "desc"),
        limit(4)
      )
    );

    const latestArticles = latestSnapshot.docs
      .map((doc) => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          date: data.date ? data.date.toDate() : new Date(),
          authorName: data.authorName || "Unknown Author",
          label: data.label || "No Label",
          slug: data.slug,
          img: data.img || "/default-image.png",
          imgAlt: data.imgAlt || "Article image",
          title: data.title || "Untitled",
          description: data.description || "No description available",
          read: data.read || "Unknown",
        };
      })
      .filter((article) => article.id !== processedArticle.id)
      .slice(0, 3);

    const jsonLd = {
      "@context": "https://schema.org",
      "@type": "Article",
      headline: processedArticle.title,
      description: processedArticle.description,
      image: processedArticle.img ? [processedArticle.img] : [],
      datePublished: processedArticle.date.toISOString(),
      dateModified: processedArticle.date.toISOString(),
      author: {
        "@type": "Person",
        name: processedArticle.authorName,
        url: authorData.slug
          ? `https://lap-docs.netlify.app/team/${authorData.slug}`
          : undefined,
      },
      publisher: {
        "@type": "Organization",
        name: "L.A.P Docs",
        logo: {
          "@type": "ImageObject",
          url: "https://lap-docs.netlify.app/logos/LAP-Logo-Color.png",
        },
      },
      mainEntityOfPage: {
        "@type": "WebPage",
        "@id": `https://lap-docs.netlify.app/posts/${processedArticle.slug}`,
      },
    };

    return (
      <main className="max-w-[95rem] w-full mx-auto px-4 md:pt-8 sm:pt-4 xs:pt-2 lg:pb-4 md:pb-4 sm:pb-2 xs:pb-2">
        <JsonLd data={jsonLd} />
        <PostNavigation href="/posts">POSTS</PostNavigation>

        <article className="grid md:grid-cols-2 gap-6 md:gap-6 pb-6 md:pb-24">
          <h1 className="text-subtitle">{processedArticle.title}</h1>
          <p>{processedArticle.description}</p>
        </article>

        <div className="flex flex-col md:flex-row justify-between gap-6 md:gap-0 mb-8">
          <div className="flex flex-col sm:flex-row md:items-center gap-2 sm:gap-6">
            <span className="flex flex-wrap">
              <p className="font-semibold pr-2">Author:</p>
              <p>{processedArticle.authorName}</p>
            </span>
            <span className="flex flex-wrap">
              <p className="font-semibold pr-2">Date:</p>
              <time dateTime={processedArticle.date.toISOString()}>
                {processedArticle.date.toLocaleDateString("en-US", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </time>
            </span>
            <span className="flex flex-wrap">
              <p className="font-semibold pr-2">Read:</p>
              <p>{processedArticle.read}</p>
            </span>
          </div>
          <span className="px-3 py-2 border border-white rounded-full w-fit h-fit">
            <p className="uppercase">{processedArticle.label}</p>
          </span>
        </div>

        <div>
          <img
            src={processedArticle.img}
            alt={processedArticle.imgAlt}
            className="w-full h-auto"
          />
        </div>

        <div className="w-full">
          <ArticleContent htmlContent={processedHtml} />
        </div>

        <div className="pt-10 pb-20">
          <Subheading
            className="text-subheading"
            url={`/team/${authorData.slug}`}
            linkText="Check out"
          >
            Author
          </Subheading>
          <AuthorCard authorData={authorData} />
        </div>

        <div>
          <Subheading
            className="text-subheading"
            url="/posts"
            linkText="See all"
          >
            Latest Posts
          </Subheading>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3  mb-12 md:mb-48">
            {latestArticles.map((article) => (
              <article className="border border-white p-8" key={article.id}>
                <div className="flex items-center justify-between">
                  <time dateTime={article.date.toISOString()}>
                    {article.date.toLocaleDateString("en-US", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                  </time>
                  <span className="px-3 py-2 border border-white rounded-full">
                    <p className="uppercase">{article.label}</p>
                  </span>
                </div>
                <Link href={`/posts/${article.slug}`}>
                  <img
                    className="w-full my-8 hover:scale-105 transition-transform"
                    src={article.img}
                    alt={article.imgAlt}
                  />
                </Link>
                <h2 className="heading3-title mb-3">
                  <Link href={`/posts/${article.slug}`}>{article.title}</Link>
                </h2>
                <p className="mt-3 mb-12">{article.description}</p>
                <div className="flex flex-wrap gap-4">
                  <span className="flex">
                    <p className="font-semibold pr-2">Author</p>
                    <p>{article.authorName}</p>
                  </span>
                  <span className="flex">
                    <p className="font-semibold pr-2">Duration</p>
                    <p>{article.read}</p>
                  </span>
                </div>
              </article>
            ))}
          </div>
        </div>
      </main>
    );
  } catch (error) {
    console.error("Error fetching article details:", error);
    return (
      <main className="max-w-[95rem] w-full mx-auto px-4 sm:pt-4 xs:pt-2 lg:pb-4 md:pb-4 sm:pb-2 xs:pb-2">
        <p>Error loading article details. Please try again later.</p>
      </main>
    );
  }
}
