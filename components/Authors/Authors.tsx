import { collection, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";
import Image from "next/image";
import Link from "next/link";

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

// Function to fetch authors from Firestore
const getAuthors = async (): Promise<AuthorType[]> => {
  const authorsCollection = collection(db, "authors");
  const authorsSnapshot = await getDocs(authorsCollection);

  return authorsSnapshot.docs.map((doc) => {
    const data = doc.data() as AuthorType;
    return {
      ...data,
      id: doc.id,
    };
  });
};

// Function to shuffle an array
const shuffleArray = (array: any[]) => {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
};

export default async function Authors() {
  const data: AuthorType[] = await getAuthors();

  // Shuffle the authors and select the first 4
  const shuffledAuthors = shuffleArray(data);
  const selectedAuthors = shuffledAuthors.slice(0, 4);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 mb-48 max-w-[95rem] w-full mx-auto">
      {selectedAuthors.map((author) => (
        <article
          className="flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-8 md:gap-12 p-4 md:p-8 border border-white"
          key={author.id}
        >
          <Link href={`/authors/${author.slug}`}>
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
              <Link href={`/authors/${author.slug}`}>{author.name}</Link>
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
