"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";

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
  topicPath: string;
  publish: boolean;
}

interface TopicLink {
  label: string;
  slug: string;
  path: string;
  count: number;
}

interface ArticlesProps {
  initialArticles: Article[];
  topics: TopicLink[];
  activeTopicSlug?: string;
}

export default function Articles({
  initialArticles,
  topics,
  activeTopicSlug,
}: ArticlesProps) {
  const [searchTerm, setSearchTerm] = useState("");

  const filtered = initialArticles.filter(
    (article) =>
      article.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      article.description.toLowerCase().includes(searchTerm.toLowerCase()),
  );
  const isAllTopics = !activeTopicSlug;

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
          <Link
            href="/posts"
            className={`
              px-3 py-2 border rounded-full transition ease-in-out duration-300
              ${
                isAllTopics
                  ? "bg-white text-black border-white"
                  : "bg-transparent text-white border-white hover:bg-white hover:text-black"
              }
            `}
          >
            All
          </Link>
          {topics.map((topic) => (
            <Link
              key={topic.slug}
              href={topic.path}
              className={`
                px-3 py-2 border rounded-full transition ease-in-out duration-300
                ${
                  topic.slug === activeTopicSlug
                    ? "bg-white text-black"
                    : "bg-transparent text-white border-white hover:bg-white hover:text-black"
                }
              `}
            >
              {topic.label}
            </Link>
          ))}
        </div>
      </div>

      {/* --- Articles Grid --- */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-48">
        {filtered.map((article) => (
          <article className="border border-white p-8" key={article.id}>
            <div className="flex items-center justify-between">
              <time dateTime={article.date}>
                {new Date(article.date).toLocaleDateString("en-US", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </time>
              <Link
                href={article.topicPath}
                className="px-3 py-2 border border-white rounded-full uppercase hover:bg-white hover:text-black transition"
              >
                {article.label}
              </Link>
            </div>
            <Link href={`/posts/${article.slug}`}>
              <Image
                src={article.img}
                alt={article.imgAlt}
                width={800}
                height={450}
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
