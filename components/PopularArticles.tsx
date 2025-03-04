"use client";

import { useEffect, useState } from "react";
import { collection, onSnapshot, query, where, orderBy } from "firebase/firestore";
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
};

export default function PopularArticles() {
  const [popularArticles, setPopularArticles] = useState<Article[]>([]);
  
  useEffect(() => {
    // Firestore Query: Get popular articles sorted by popularity
    const articlesQuery = query(
      collection(db, "articles"),
      where("popularity", "==", true),  
      orderBy("popularity", "asc")  
    );

    const unsubscribe = onSnapshot(articlesQuery, (snapshot) => {
      const articles: Article[] = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Article[];

      setPopularArticles(articles);
    });

    return () => unsubscribe();
  }, []);

  return (
    <article>
      <h2 className="uppercase font-semibold mt-16 mb-8">Most Popular</h2>
      {popularArticles.map((article, index) => (
        <article key={article.id}>
          <div className="grid grid-cols-[0fr_1fr] gap-8">
            <p className="text-2xl font-semibold">{`0${index + 1}`}</p>
            <article className="flex flex-col gap-4">
              <h3 className="text-2xl font-semibold">
                <Link href={`/magazine/${article.slug}`}>{article.title}</Link>
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
