"use client";

import { useEffect, useState } from "react";
import {
  collection,
  onSnapshot,
  query,
  where,
  Timestamp,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Separator } from "@radix-ui/react-separator";
import Link from "next/link";

// Define the structure of an article
type Article = {
  id: string;
  title: string;
  slug: string;
  authorName: string;
  popularity: boolean;
  publish: boolean;
  date: string | Timestamp;
  popularityRank?: number;
};

interface PopularArticlesProps {
  initialArticles?: Article[];
}

export default function PopularArticles({
  initialArticles = [],
}: PopularArticlesProps) {
  const [popularArticles, setPopularArticles] =
    useState<Article[]>(initialArticles);

  useEffect(() => {
    // Keep the live query on one indexed field, then filter and rank locally.
    // This avoids requiring a composite index for the public sidebar.
    const articlesQuery = query(
      collection(db, "articles"),
      where("publish", "==", true),
    );

    const unsubscribe = onSnapshot(
      articlesQuery,
      (snapshot) => {
        const articles: Article[] = snapshot.docs
          .map((doc) => {
            const data = doc.data();
            return {
              id: doc.id,
              title: data.title || "",
              slug: data.slug || "",
              authorName: data.authorName || "Unknown Team Member",
              popularity: data.popularity || false,
              publish: data.publish || false,
              date:
                data.date instanceof Timestamp
                  ? data.date
                  : (data.date ?? new Date().toISOString()),
              popularityRank: data.popularityRank,
            } as Article;
          })
          .filter((article) => article.popularity)
          .sort(
            (left, right) =>
              (left.popularityRank ?? Number.MAX_SAFE_INTEGER) -
                (right.popularityRank ?? Number.MAX_SAFE_INTEGER) ||
              left.title.localeCompare(right.title),
          );

        setPopularArticles(articles);
      },
      (error) => {
        console.error("Error listening to popular articles:", error);
      },
    );

    return () => unsubscribe();
  }, []);

  // Only render the section if there are articles to show
  if (popularArticles.length === 0) {
    return null; // Don't render empty "Most Popular" heading
  }

  return (
    <article className="mb-9">
      <h2 className="uppercase font-semibold mt-16 mb-8">Most Popular</h2>
      {popularArticles.map((article, index) => (
        <article key={article.id}>
          <div className="grid grid-cols-[0fr_1fr] gap-8">
            <p className="text-2xl font-semibold">{`0${index + 1}`}</p>
            <article className="flex flex-col gap-4">
              <h3 className="text-2xl font-semibold">
                <Link href={`/posts/${article.slug}`}>{article.title}</Link>
              </h3>
              <span className="flex gap-2">
                <p className="font-semibold">Author:</p>
                <p>{article.authorName}</p>
              </span>
            </article>
          </div>
          {index < popularArticles.length - 1 && (
            <Separator className="border border-white my-6" />
          )}
        </article>
      ))}
    </article>
  );
}
