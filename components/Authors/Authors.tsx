"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";

// Define the structure of an author
type AuthorType = {
  id: string;
  slug: string;
  name: string;
  avatar: string;
  imgAlt: string;
  job: string;
  city: string;
};

// Function to shuffle an array (moved to inside component or utility if needed, but here we will just use it on mount to avoid hydration mismatch if we really want shuffle)
// Actually, better to just display them. Randomness on every refresh is okay if done in useEffect, but for SSR we want content to be stable.
// Taking first 4.

interface AuthorsProps {
  initialAuthors: AuthorType[];
}

export default function Authors({ initialAuthors }: AuthorsProps) {
  // If we really want random, we must do it in useEffect to match server HTML first, then update (causing a flicker).
  // OR we pass a random seed/order from server.
  // For now, let's just display the initialAuthors passed in.
  // The server can pass a specific set or random set.

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 mb-48 max-w-[95rem] w-full mx-auto">
      {initialAuthors.map((author) => (
        <article
          className="flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-8 md:gap-12 p-4 md:p-8 border border-white"
          key={author.id}
        >
          <Link href={`/team/${author.slug}`}>
            <Image
              className="w-[9.375rem] h-[9.375rem] object-cover rounded-full hover:scale-105 transition"
              src={author.avatar || "/default-avatar.png"}
              alt={author.imgAlt}
              width={150}
              height={150}
              sizes="150px"
            />
          </Link>
          <article>
            <p className="heading3-title mb-4">
              <Link href={`/team/${author.slug}`}>{author.name}</Link>
            </p>
            <div className="flex gap-8">
              <span className="flex">
                <p className="font-semibold pr-2">Job:</p>
                <p className="">{author.job}</p>
              </span>
              <span className="flex">
                <p className="font-semibold pr-2">Country:</p>
                <p className="">{author.city}</p>
              </span>
            </div>
          </article>
        </article>
      ))}
    </div>
  );
}
