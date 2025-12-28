"use client";

import { Button } from "../ui/button";
import { useState } from "react";
import Link from "next/link";
import Loading from "./loading";

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

interface Author {
  uid: string;
  name: string;
}

interface ArticlesProps {
  initialArticles: Article[];
}

export default function Articles({ initialArticles }: ArticlesProps) {
  const [labels, setLabels] = useState<string[]>([]);
  const [selectedLabel, setSelectedLabel] = useState("All");
  const [searchTerm, setSearchTerm] = useState("");
  // Determine loading state: if initialArticles is empty, we might assume loading or empty state.
  // Actually, for SSR, we can assume data is ready.
  // Unless we want a suspense boundary higher up.
  // Let's just use initialArticles directly.

  // Extract unique labels
  useState(() => {
    const uniqueLabels = Array.from(
      new Set(initialArticles.map((a) => a.label))
    );
    setLabels(["All", ...uniqueLabels]);
  });

  // First filter by label, then by search term (title OR description)
  const filtered = initialArticles
    .filter((a) =>
      selectedLabel === "All" ? true : a.label === selectedLabel
    )
    .filter((a) =>
      a.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      a.description.toLowerCase().includes(searchTerm.toLowerCase())
    );

  return (
    <div className="max-w-[95rem] w-full mx-auto">
      {/* --- Search Bar --- */}
      <div className="my-6 ">
        <input
          type="text"
          placeholder="Search posts..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full md:w-1/2 px-4 py-2 border border-white bg-transparent text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-white transition"
        />
      </div>

      {/* --- Category Filters --- */}
      <div className="flex flex-wrap justify-between items-center gap-2 md:gap-0 mb-6">
        <p className="font-semibold uppercase">Categories</p>
        <div className="flex flex-wrap gap-2">
          {labels.map((label, i) => (
            <Button
              key={i}
              onClick={() => setSelectedLabel(label)}
              className={`
                px-3 py-2 border rounded-full transition ease-in-out duration-300
                ${
                  label === selectedLabel
                    ? "bg-white text-black"
                    : "bg-transparent text-white border-white hover:bg-white hover:text-black"
                }
              `}
            >
              {label}
            </Button>
          ))}
        </div>
      </div>

      {/* --- Articles Grid --- */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-48">
        {filtered.map((article) => (
          <article className="border border-white p-8" key={article.id}>
            <div className="flex items-center justify-between">
              <time dateTime={article.date}>{article.date}</time>
              <span className="px-3 py-2 border border-white rounded-full uppercase">
                {article.label}
              </span>
            </div>
            <Link href={`/posts/${article.slug}`}>
              <img
                src={article.img}
                alt={article.imgAlt}
                className="w-full my-8 hover:scale-105 transition"
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
        {filtered.length === 0 && (
          <p className="col-span-full text-center text-gray-400">
            No articles found.
          </p>
        )}
      </div>
    </div>
  );
}
