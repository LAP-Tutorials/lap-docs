"use client";

import { useEffect, useState } from "react";
import { collection, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";
import Link from "next/link";
import Image from "next/image";
import { RiArrowRightLine } from "react-icons/ri";
import { Skeleton } from "./ui/skeleton";
import SkeletonCard from "./Authors/SkeletonCard"; // Import the same SkeletonCard used in latest posts

// Define the structure of an author
type AuthorType = {
  uid: string;
  name: string;
  job: string;
  city: string;
  avatar: string;
  imgAlt: string;
  slug: string;
};

export default function AuthorsList() {
  const [authors, setAuthors] = useState<AuthorType[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAuthors = async () => {
      const querySnapshot = await getDocs(collection(db, "authors"));
      const fetchedAuthors = querySnapshot.docs.map((doc) => ({
        ...(doc.data() as Omit<AuthorType, "uid">),
        uid: doc.id,
      }));

      setAuthors(fetchedAuthors);
      setLoading(false);
    };

    fetchAuthors();
  }, []);

  return (
    <div className="flex flex-col max-w-[95rem] w-full mx-auto py-8 lg:pt-24 lg:pb-48">
      {loading ? (
        // Skeleton Loader (Using the same structure as LatestPosts)
        <div className="grid gap-6">
          {[...Array(6)].map((_, index) => (
            <SkeletonCard key={index} />
          ))}
        </div>
      ) : (
        authors.map((author, index) => (
          <div key={author.uid}>
            <article className="flex flex-col md:flex-row justify-between md:items-center gap-4 ml-5">
              <div className="flex flex-col md:flex-row md:items-center gap-4 md:gap-16">
                {/* Ensure image has a transparent background */}
                <Link href={`authors/${author.slug}`}>
                <Image
                  className="h-[9.375rem] w-[9.375rem] object-cover rounded-full bg-transparent"
                  src={author.avatar}
                  alt={author.imgAlt}
                  width={150}
                  height={150}
                />
                </Link>
                <Link href={`authors/${author.slug}`}>
                  <h2 className="text-2xl font-semibold">{author.name}</h2>
                </Link>
              </div>
              <div className="flex flex-col lg:flex-row gap-4 lg:gap-24">
                <div className="flex gap-2">
                  <p className="font-semibold">Job:</p>
                  <p>{author.job}</p>
                </div>
                <div className="flex gap-2">
                  <p className="font-semibold">City:</p>
                  <p>{author.city}</p>
                </div>
                <Link
                  className="flex items-center gap-2 text-white hover:text-[#8a2be2] transition ease-in-out duration-300"
                  href={`authors/${author.slug}`}
                >
                  <span className="uppercase font-semibold">About</span>
                  <RiArrowRightLine className="text-2xl" />
                </Link>
              </div>
            </article>
            {index < authors.length - 1 && <div className="border border-gray-300 my-10" />}
          </div>
        ))
      )}
    </div>
  );
}
