import Authors from "@/components/Authors/Authors";
import LatestPosts from "@/components/LatestPosts/LatestPosts";
import NewsLoading from "@/components/NewsTicker/loading";
import AuthorsLoading from "@/components/Authors/loading";
import NewsTicker from "@/components/NewsTicker/NewsTicker";
import PageTitle from "@/components/PageTitle";
import Subheading from "@/components/Subheading";
import { Suspense } from "react";
import type { Metadata } from "next";
import JsonLd from "@/components/JsonLd";
import { db } from "@/lib/firebase";
import {
  collection,
  getDocs,
  query,
  orderBy,
  limit,
  Timestamp,
} from "firebase/firestore";

export const metadata: Metadata = {
  title: "L.A.P Docs | Home",
  description:
    "Simplified text documents about everything made on the L.A.P - tutorials youtube channel",
  openGraph: {
    title: "L.A.P Docs | Home",
    description:
      "Simplified text documents about everything made on the L.A.P - tutorials youtube channel",
    url: "https://lap-docs.netlify.app/",
    siteName: "L.A.P Docs",
    type: "website",
    locale: "en_US",
    images: "https://lap-docs.netlify.app/og-image.png",
  },
  twitter: {
    card: "summary_large_image",
    title: "L.A.P Docs",
    description:
      "Simplified text documents about everything made on the L.A.P - tutorials youtube channel",
    images: "https://lap-docs.netlify.app/twitter-image.png",
  },
};

type Article = {
  id: string;
  title: string;
  slug: string;
  description: string;
  authorName: string;
  date: string | Timestamp;
  read: string;
  label: string;
  img: string;
  imgAlt: string;
  publish: boolean;
};

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
    // Fetch latest articles
    const articlesQuery = query(
      collection(db, "articles"),
      orderBy("date", "desc"),
      limit(7)
    );
    const articlesSnapshot = await getDocs(articlesQuery);

    // Fetch authors for mapping names
    const authorsSnapshot = await getDocs(collection(db, "authors"));
    const authorsMap = new Map(
      authorsSnapshot.docs.map((d) => [d.id, d.data().name])
    );

    const articles: Article[] = articlesSnapshot.docs
      .map((doc) => {
        const data = doc.data();
        return {
          id: doc.id,
          title: data.title || "",
          slug: data.slug || "",
          description: data.description || "",
          authorName:
            data.authorName ||
            authorsMap.get(data.authorUID) ||
            "Unknown Author",
          // Ensure date is a string. If it's a Timestamp, convert. If string, keep. Else current date.
          date:
            data.date instanceof Timestamp
              ? data.date.toDate().toISOString()
              : typeof data.date === "string"
              ? data.date
              : new Date().toISOString(),
          read: data.read || "",
          label: data.label || "",
          img: data.img || "",
          imgAlt: data.imgAlt || "",
          publish: data.publish || false,
        } as Article;
      })
      .filter((a) => a.publish === true);

    // Fetch all authors for the authors section - explicitly pick fields
    const allAuthors = authorsSnapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        slug: data.slug || "",
        name: data.name || "",
        avatar: data.avatar || "",
        imgAlt: data.imgAlt || "",
        job: data.job || "",
        city: data.city || "",
      };
    });

    // Shuffle authors
    const shuffledAuthors = [...allAuthors]
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

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "L.A.P Docs",
    url: "https://lap-docs.netlify.app/",
    potentialAction: {
      "@type": "SearchAction",
      target: "https://lap-docs.netlify.app/search?q={search_term_string}",
      "query-input": "required name=search_term_string",
    },
  };

  return (
    <main className="flex flex-col min-h-screen max-w-[95rem] w-full mx-auto px-4 lg:pt-0 sm:pt-4 xs:pt-2 lg:pb-4 md:pb-4 sm:pb-2 xs:pb-2">
      <JsonLd data={jsonLd} />
      <PageTitle
        className="sr-only"
        imgSrc="/images/titles/lap-docs.svg"
        imgAlt="The words 'L.A.P Docs' in bold uppercase lettering"
      >
        L.A.P Docs
      </PageTitle>

      <Suspense fallback={<NewsLoading />}>
        <NewsTicker />
      </Suspense>

      <LatestPosts initialPosts={articles} />

      <Subheading className="text-subheading" url="/team" linkText="Full Team">
        Team
      </Subheading>

      <Suspense fallback={<AuthorsLoading />}>
        <Authors initialAuthors={shuffledAuthors} />
      </Suspense>
    </main>
  );
}
