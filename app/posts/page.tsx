import Articles from "@/components/Articles/Articles";
import Loading from "@/components/Articles/loading";
import PageTitle from "@/components/PageTitle";
import { Suspense } from "react";
import type { Metadata } from "next";
import JsonLd from "@/components/JsonLd";
import { db } from "@/lib/firebase";
import {
  DEFAULT_OG_IMAGE_PATH,
  DEFAULT_TWITTER_IMAGE_PATH,
  SITE_LOCALE,
  SITE_NAME,
  absoluteUrl,
  buildBreadcrumbSchema,
} from "@/lib/seo";
import { collection, getDocs, query, orderBy } from "firebase/firestore";

export const metadata: Metadata = {
  title: "Posts",
  description: "Browse the latest L.A.P - Docs articles, tutorials, and guides.",
  keywords: ["Articles", "Tutorials", "Guides", "Tech Blog", "L.A.P Posts"],
  openGraph: {
    title: `Posts | ${SITE_NAME}`,
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
    title: `Posts | ${SITE_NAME}`,
    description: "Browse the latest L.A.P - Docs articles, tutorials, and guides.",
    images: [DEFAULT_TWITTER_IMAGE_PATH],
  },
  alternates: {
    canonical: absoluteUrl("/posts"),
  },
};

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
  publish: boolean;
}

async function getArticles() {
  try {
    // Fetch articles, ordered by date descending
    const articlesQuery = query(
      collection(db, "articles"),
      orderBy("date", "desc"),
    );
    const articlesSnapshot = await getDocs(articlesQuery);

    // Fetch authors
    const authorsSnapshot = await getDocs(collection(db, "authors"));
    // Create a map for faster lookup
    const authorsMap = new Map(
      authorsSnapshot.docs.map((doc) => [doc.id, doc.data().name]),
    );

    const withAuthors = articlesSnapshot.docs
      .map((doc) => {
        const data = doc.data();
        let dateResult = "No date";

        if (data.date) {
          if (data.date.toDate) {
            dateResult = data.date.toDate().toLocaleDateString("en-US", {
              year: "numeric",
              month: "long",
              day: "numeric",
            });
          } else if (
            typeof data.date === "string" ||
            data.date instanceof Date
          ) {
            dateResult = new Date(data.date).toLocaleDateString("en-US", {
              year: "numeric",
              month: "long",
              day: "numeric",
            });
          }
        }

        return {
          id: doc.id,
          title: data.title || "",
          label: data.label || "",
          date: dateResult,
          img: data.img || "",
          imgAlt: data.imgAlt || "",
          slug: data.slug || "",
          description: data.description || "",
          read: data.read || "",
          authorUID: data.authorUID || "",
          authorName: authorsMap.get(data.authorUID) || "Unknown Author",
          publish: data.publish || false,
        } as Article;
      })
      // Filter out unpublished
      .filter((article) => article.publish === true);

    return withAuthors;
  } catch (error) {
    console.error("Error fetching data:", error);
    return [];
  }
}

export default async function MagazinePage() {
  const articles = await getArticles();

  const pageUrl = absoluteUrl("/posts");
  const jsonLd = [
    {
      "@context": "https://schema.org",
      "@type": "CollectionPage",
      name: "Posts",
      description: "Browse the latest L.A.P - Docs articles, tutorials, and guides.",
      url: pageUrl,
      isPartOf: {
        "@type": "WebSite",
        name: SITE_NAME,
        url: absoluteUrl("/"),
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
        imgAlt="The word 'Magazine' in bold, uppercase lettering"
      >
        Posts
      </PageTitle>
      <Suspense fallback={<Loading />}>
        <Articles initialArticles={articles} />
      </Suspense>
    </main>
  );
}

export const revalidate = 60;
