import formatString from "@/app/functions/formatString";
import Link from "next/link";
import Image from "next/image";
import { db } from "@/lib/firebase";
import { collection, getDocs, orderBy } from "firebase/firestore";

type AuthorType = {
  uid: string;
  name: string;
  job: string;
  city: string;
  avatar: string;
  imgAlt: string;
  slug: string;
};

export default async function AuthorsList() {
  // Fetch authors from Firestore
  const querySnapshot = await getDocs(
    collection(db, "authors")
  );
  
  const authors = querySnapshot.docs.map(doc => ({
    uid: doc.id,
    ...doc.data()
  })) as AuthorType[];

  return (
    <div className="flex flex-col max-w-[95rem] w-full mx-auto py-8 lg:pt-24 lg:pb-48">
      {authors.map((author, index) => (
        <div key={author.uid}>
          <article className="flex flex-col md:flex-row justify-between md:items-center gap-2 md:gap-0">
            <div className="flex flex-col md:flex-row md:items-center gap-2 md:gap-16">
              <Image
                className="h-[9.375rem] w-[9.375rem]"
                src={author.avatar}
                alt={author.imgAlt}
                width={150}
                height={150}
              />
              <h2 className="heading3-title">{author.name}</h2>
            </div>
            <div className="flex flex-col lg:flex-row gap-2 lg:gap-24">
              <div className="flex gap-2">
                <p className="font-semibold">Job</p>
                <p>{author.job}</p>
              </div>
              <div className="flex gap-2">
                <p className="font-semibold">City</p>
                <p>{author.city}</p>
              </div>
              <Link
                className="flex gap-2"
                href={`authors/${author.slug}`}
              >
                <span className="uppercase font-semibold">About</span>
                <img
                  src="/icons/ri_arrow-right-line.svg"
                  alt="An arrow pointing right"
                />
              </Link>
            </div>
          </article>
          {index < authors.length - 1 && (
            <div className="border border-black my-6" />
          )}
        </div>
      ))}
    </div>
  );
}