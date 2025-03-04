"use client";

import { db } from "@/lib/firebase";
import { Button } from "../ui/button";
import { useState, useEffect } from "react";
import { collection, getDocs, query, orderBy } from "firebase/firestore";
import Link from "next/link";
import Loading from "./loading"

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
}

export default function Articles() {
  const [articles, setArticles] = useState<Article[]>([]);
  const [labels, setLabels] = useState<string[]>([]);
  const [selectedLabel, setSelectedLabel] = useState("All");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch articles
        const articlesQuery = query(
          collection(db, "articles"),
          orderBy("date", "desc")
        );
        const articlesSnapshot = await getDocs(articlesQuery);
        
        const articlesData = articlesSnapshot.docs.map(doc => {
          const data = doc.data();
          return {
            id: doc.id,
            ...data,
            date: data.date?.toDate().toLocaleDateString('en-US', {
              year: 'numeric',
              month: 'long',
              day: 'numeric'
            }) || 'No date'
          } as Article;
        });

        // Fetch authors and map to articles
        const authorsSnapshot = await getDocs(collection(db, "authors"));
        const authors = authorsSnapshot.docs.map(doc => ({
          uid: doc.id,
          name: doc.data().name,
          ...doc.data(),
        }));

        const articlesWithAuthors = articlesData.map(article => ({
          ...article,
          authorName: authors.find(a => a.uid === article.authorUID)?.name || "Unknown Author"
        }));

        // Get unique labels
        const uniqueLabels = Array.from(
          new Set(articlesData.map(article => article.label))
        );
        setLabels(["All", ...uniqueLabels]);

        setArticles(articlesWithAuthors);
        setLoading(false);
      } catch (error) {
        console.error("Error fetching data:", error);
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const filteredArticles = selectedLabel === "All" 
    ? articles 
    : articles.filter(article => article.label === selectedLabel);

  if (loading) {
    return <Loading />;
  }

  return (
    <div className="max-w-[95rem] w-full mx-auto">
      <div className="flex flex-wrap justify-between items-center gap-2 md:gap-0 my-6">
        <p className="font-semibold uppercase">Categories</p>
        <div className="flex flex-wrap gap-2">
          {labels.map((label, index) => (
            <Button
              className={`px-3 py-2 bg-[#121212] text-white hover:bg-white hover:text-black border border-white rounded-full transition ease-in-out duration-300 ${
                label === selectedLabel ? "bg-white text-black" : "border-white"
              }`}
              key={index}
              onClick={() => setSelectedLabel(label)}
            >
              {label}
            </Button>
          ))}
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 border-collapse mb-48">
        {filteredArticles.map((article) => (
          <article className="border border-white p-8" key={article.id}>
            <div className="flex items-center justify-between">
              <time dateTime={article.date}>{article.date}</time>
              <span className="px-3 py-2 border border-white rounded-full">
                <p className="uppercase">{article.label}</p>
              </span>
            </div>
            <Link href={`posts/${article.slug}`}>
              <img
                className="w-full my-8 hover:scale-105 transition"
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
  );
}