import Articles from "@/components/Articles/Articles";
import Loading from "@/components/Articles/loading";
import PageTitle from "@/components/PageTitle";
import { Suspense } from "react";
import type { Metadata } from "next";
import JsonLd from "@/components/JsonLd";
import { db } from "@/lib/firebase";
import { collection, getDocs, query, orderBy } from "firebase/firestore";

export const metadata: Metadata = {
  title: "Posts",
  description: "Browse our latest articles, tutorials, and guides.",
  keywords: ["Articles", "Tutorials", "Guides", "Tech Blog", "L.A.P Posts"],
  openGraph: {
    title: "Posts | L.A.P Docs",
    description: "Browse our latest articles, tutorials, and guides.",
    url: "https://lap-docs.netlify.app/posts",
    siteName: "L.A.P Docs",
    type: "website",
    images: "https://lap-docs.netlify.app/og-image.png",
  },
  twitter: {
    card: "summary_large_image",
    title: "Posts | L.A.P Docs",
    description: "Browse our latest articles, tutorials, and guides.",
    images: "https://lap-docs.netlify.app/twitter-image.png",
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
      orderBy("date", "desc")
    );
    const articlesSnapshot = await getDocs(articlesQuery);

    // Fetch authors
    const authorsSnapshot = await getDocs(collection(db, "authors"));
    // Create a map for faster lookup
    const authorsMap = new Map(authorsSnapshot.docs.map(doc => [doc.id, doc.data().name]));

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
             } else if (typeof data.date === "string" || data.date instanceof Date) {
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

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: "L.A.P Posts",
    description: "Browse our latest articles, tutorials, and guides.",
    url: "https://lap-docs.netlify.app/posts",
  };

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
