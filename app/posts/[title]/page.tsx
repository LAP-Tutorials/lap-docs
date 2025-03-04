import { db } from "@/lib/firebase";
import { collection, query, where, getDocs, orderBy, limit } from "firebase/firestore";
import PostNavigation from "@/components/PostNavigation";
import SocialSharing from "@/components/SocialSharing";
import Subheading from "@/components/Subheading";
import Link from "next/link";

import { RiInstagramLine, RiTwitterFill, RiYoutubeFill, RiGithubFill, RiTiktokFill, RiPatreonFill } from "react-icons/ri";


interface Article {
  id: string;
  title: string;
  slug: string;
  content: any[];
  date: Date;
  read: string;
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
  params: { title: string };
}) {
  try {
    const articlesRef = collection(db, "articles");
    const q = query(articlesRef, where("slug", "==", params.title));
    const snapshot = await getDocs(q);

    if (snapshot.empty) {
      return { title: "Article Not Found | L.A.P" };
    }

    const articleData = snapshot.docs[0].data();
    return {
      title: `${articleData.title} | L.A.P`,
    };
  } catch (error) {
    return {
      title: "Error Loading Article | L.A.P",
    };
  }
}

export default async function ArticleDetails({
  params,
}: {
  params: { title: string };
}) {
  try {
    // Get main article
    const articlesRef = collection(db, "articles");
    const articleQuery = query(
      articlesRef,
      where("slug", "==", params.title)
    );
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
      ...articleData,
      date: articleData.date?.toDate(),
      authorName: authorData.name || "Unknown Author",
      authorAvatar: authorData.avatar || "/default-avatar.png",
      content: articleData.content.map(contentItem => ({
        ...contentItem,
        ...(contentItem.date && { date: contentItem.date.toDate() })
      })),
      authorUID: articleData.authorUID
    };

    // Get latest articles (excluding current)
    const latestSnapshot = await getDocs(
      query(
        collection(db, "articles"),
        orderBy("date", "desc"),
        limit(4)
      )
    );

    const latestArticles = latestSnapshot.docs
      .map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          date: data.date?.toDate(),
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
      .filter(article => article.id !== processedArticle.id)
      .slice(0, 3);

    return (
      <main className="max-w-[95rem] w-full mx-auto px-4 md:pt-8 sm:pt-4 xs:pt-2 lg:pb-4 md:pb-4 sm:pb-2 xs:pb-2">
        <PostNavigation href="/posts">POSTS</PostNavigation>

        <article className="grid md:grid-cols-2 gap-6 md:gap-6 pb-6 md:pb-24">
          <h2 className="text-subtitle">{processedArticle.title}</h2>
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
            src={processedArticle.content[0].img}
            alt={processedArticle.imgAlt}
            className="w-full h-auto"
          />
        </div>

        <article className="flex flex-col md:flex-row gap-6 md:gap-16 max-w-[62.5rem] w-full mx-auto mt-6 md:mt-24 mb-10">
          <div className="flex flex-col w-fit">
            <div className="flex gap-4 items-center">
              <img
                className="w-[5rem] h-[5rem] rounded-full object-cover"
                src={processedArticle.authorAvatar}
                alt={authorData.imgAlt || "Author avatar"}
              />
              <p className="text-[2rem] font-semibold">{processedArticle.authorName}</p>
            </div>

            <div className="flex flex-col gap-4 pt-8">
              <div className="flex flex-wrap justify-between">
                <p className="font-semibold">Date</p>
                <time dateTime={processedArticle.date.toISOString()}>
                  {processedArticle.date.toLocaleDateString("en-US", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </time>
              </div>
              <div className="flex flex-wrap justify-between">
                <p className="font-semibold">Read</p>
                <p>{processedArticle.read}</p>
              </div>
              {/* <div className="flex flex-wrap justify-between">
                <p className="flex font-semibold">Share</p>
                <SocialSharing
                                links={[
                                  {
                                    href: "https://www.youtube.com/@lap-tutorials",
                                    ariaLabel: "Visit our YouTube channel",
                                    Icon: RiYoutubeFill,
                                  },
                                  {
                                    href: "https://github.com/LAP-Tutorials",
                                    ariaLabel: "Visit our GitHub page",
                                    Icon: RiGithubFill,
                                  },
                                  {
                                    href: "https://www.instagram.com/lap.mgmt.team/",
                                    ariaLabel: "Visit our Instagram page",
                                    Icon: RiInstagramLine,
                                  },
                                  {
                                    href: "https://x.com/lap_mgmt",
                                    ariaLabel: "Visit our X page",
                                    Icon: RiTwitterFill,
                                  },
                                  {
                                    href: "https://www.tiktok.com/@lap_mgmt",
                                    ariaLabel: "Visit our TikTok page",
                                    Icon: RiTiktokFill,
                                  },
                                  {
                                    href: "http://patreon.com/lap_mgmt",
                                    ariaLabel: "Visit our GitHub page",
                                    Icon: RiPatreonFill,
                                  },
                                ]}
                              />
              </div> */}
            </div>
          </div>

          <div className="lg:w-3/4">
            <p className="text-xl font-medium">
              {processedArticle.content[0].summary}
            </p>
            <p className="my-6 whitespace-pre-line">
              {processedArticle.content[1]?.section1}
            </p>
            
            {processedArticle.content[2]?.quote && (
              <div className="border-t-2 border-b-2 border-black my-6 py-12">
                <p className="text-blog-quote mb-6">
                  &ldquo;{processedArticle.content[2].quote[0]}
                </p>
                <p>{processedArticle.content[2].quote[1]}</p>
              </div>
            )}

            {processedArticle.content[3]?.summary2 && (
              <p className="text-xl font-medium mb-6">
                {processedArticle.content[3].summary2}
              </p>
            )}

            {processedArticle.content[4]?.section2 && (
              <p className="whitespace-pre-line">
                {processedArticle.content[4].section2}
              </p>
            )}
          </div>
        </article>

        <div>
          <Subheading
            className="text-subheading"
            url="/posts"
            linkText="See all"
          >
            Latest Posts
          </Subheading>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 border border-white border-collapse mb-12 md:mb-48">
            {latestArticles.map((article) => (
              <article
                className="border border-white p-8"
                key={article.id}
              >
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
                  <Link href={`/posts/${article.slug}`}>
                    {article.title}
                  </Link>
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