"use client";

import { useEffect, useState } from "react";
import { Timestamp } from "firebase/firestore";
import Sidebar from "../Sidebar";
import { Separator } from "@radix-ui/react-separator";
import Link from "next/link";
import Loading from "./loading";
import Image from "next/image";

// Define the structure of an article
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

// Function to convert Firestore Timestamp or ISO string to a readable date
const formatDate = (date: string | Timestamp) => {
  let parsedDate: Date;

  if (date instanceof Timestamp) {
    parsedDate = date.toDate(); // Convert Firestore Timestamp to JavaScript Date
  } else {
    parsedDate = new Date(date); // Convert ISO string to JavaScript Date
  }

  return parsedDate.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
};

interface LatestPostsProps {
  initialPosts: Article[];
}

export default function LatestPosts({ initialPosts }: LatestPostsProps) {
  // If initialPosts are passed, just use them.
  // We can also just render them directly.
  // We need to sort them here if they aren't already sorted, but let's assume parent passes sorted.

  const articles = initialPosts;

  if (articles.length === 0) return <p>No articles available.</p>;

  const latestArticle = articles[0]; // Get the latest article
  const remainingArticles = articles.slice(1, 7); // Only get the next 6 latest articles

  return (
    <>
      <div className="flex flex-col-reverse sm:flex-col gap-6 md:gap-12 py-6 md:py-10 max-w-[95rem] w-full mx-auto">
        <article className="flex flex-col-reverse sm:flex-col gap-6 md:gap-12">
          <article className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-12">
            <h2 className="text-subtitle">
              <Link href={`/posts/${latestArticle.slug}`}>
                {latestArticle.title}
              </Link>
            </h2>
            <article className="flex flex-col gap-2">
              <p>{latestArticle.description}</p>
              <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-2">
                <div className="flex flex-col sm:flex-row gap-2 sm:gap-6">
                  <span className="flex flex-wrap">
                    <p className="font-semibold pr-2">Author</p>
                    <p>{latestArticle.authorName}</p>
                  </span>
                  <span className="flex flex-wrap">
                    <p className="font-semibold pr-2">Date</p>
                    <time dateTime={latestArticle.date.toString()}>
                      {formatDate(latestArticle.date)}
                    </time>
                  </span>
                  <span className="flex flex-wrap">
                    <p className="font-semibold pr-2">Read</p>
                    <p>{latestArticle.read}</p>
                  </span>
                </div>
                <span className="px-3 py-2 border border-white rounded-full w-fit">
                  <p className="uppercase">{latestArticle.label}</p>
                </span>
              </div>
            </article>
          </article>
          <div>
            <Image
              className="w-full object-cover"
              // Use fallback image if latestArticle.img is empty
              src={latestArticle.img || "/default-avatar.png"}
              alt={latestArticle.imgAlt || "Article image"}
              width={1488}
              height={992}
              priority
              sizes="(max-width: 768px) 100vw, 50vw"
            />
          </div>
        </article>
      </div>

      <div className="flex flex-col lg:flex-row gap-6 lg:gap-12 xl:gap-24">
        <div className="lg:w-3/4">
          {remainingArticles.map((article, index) => (
            <article className="mb-6" key={article.id}>
              <article className="grid md:grid-cols-[0fr_1fr] gap-6 sm:gap-12">
                <Link
                  href={`/posts/${article.slug}`}
                  className="h-70 md:w-[27rem]"
                >
                  <Image
                    className="w-full h-full object-cover hover:scale-105 transition"
                    src={article.img || "/default-avatar.png"}
                    alt={article.imgAlt}
                    width={1280}
                    height={720}
                    sizes="(max-width: 768px) 100vw, 30vw"
                  />
                </Link>
                <article className="flex flex-col justify-between">
                  <div className="mb-4">
                    <h3 className="heading3-title mb-3">
                      <Link href={`/posts/${article.slug}`}>
                        {article.title}
                      </Link>
                    </h3>
                    <p>{article.description}</p>
                  </div>
                  <div className="flex flex-col sm:flex-row gap-4 justify-between sm:items-center">
                    <div className="flex flex-col sm:flex-row gap-2 sm:gap-6">
                      <span className="flex flex-wrap">
                        <p className="font-semibold pr-2">Author</p>
                        <p>{article.authorName}</p>
                      </span>
                      <span className="flex flex-wrap">
                        <p className="font-semibold pr-2">Date</p>
                        <time dateTime={article.date.toString()}>
                          {formatDate(article.date)}
                        </time>
                      </span>
                      <span className="flex flex-wrap">
                        <p className="font-semibold pr-2">Read</p>
                        <p>{article.read}</p>
                      </span>
                    </div>
                    <span className="px-3 py-2 border border-white rounded-full w-fit">
                      <p className="uppercase">{article.label}</p>
                    </span>
                  </div>
                </article>
              </article>
              {index < remainingArticles.length - 1 && (
                <Separator className="border border-white my-6" />
              )}
            </article>
          ))}
        </div>
        <div className="lg:w-1/4">
          <Sidebar />
        </div>
      </div>
    </>
  );
}
