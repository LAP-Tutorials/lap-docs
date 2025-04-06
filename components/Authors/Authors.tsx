"use client";

import { collection, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase";
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

// Function to shuffle an array
const shuffleArray = (array: any[]) => {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
};

export default function Authors() {
  const [authors, setAuthors] = useState<AuthorType[]>([]);

  useEffect(() => {
    const authorsCollection = collection(db, "authors");

    // Set up the listener
    const unsubscribe = onSnapshot(authorsCollection, (snapshot) => {
      const data: AuthorType[] = snapshot.docs.map((doc) => {
        const authorData = doc.data() as AuthorType;
        return {
          ...authorData,
          id: doc.id,
        };
      });

      // Shuffle the authors and select the first 4
      const shuffledAuthors = shuffleArray(data);
      setAuthors(shuffledAuthors.slice(0, 4));
    });

    // Cleanup the listener on unmount
    return () => unsubscribe();
  }, []);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 mb-48 max-w-[95rem] w-full mx-auto">
      {authors.map((author) => (
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
