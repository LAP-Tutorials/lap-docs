import Image from "next/image";
import NewsletterSignUp from "./NewsletterSignUp";
import PopularArticles from "./PopularArticles";
import { Button } from "./ui/button";
import magazineCover from "@/public/logos/LAP-Logo-Color.png";
import { db } from "@/lib/firebase";
import {
  collection,
  getDocs,
  query,
  where,
  orderBy,
  Timestamp,
} from "firebase/firestore";

type PopularArticle = {
  id: string;
  title: string;
  slug: string;
  authorName: string;
  popularity: boolean;
  publish: boolean;
  date: string;
  popularityRank?: number;
};

async function getPopularArticles(): Promise<PopularArticle[]> {
  try {
    // Fetch authors for mapping names
    const authorsSnapshot = await getDocs(collection(db, "authors"));
    const authorsMap = new Map(
      authorsSnapshot.docs.map((d) => [d.id, d.data().name])
    );

    const articlesQuery = query(
      collection(db, "articles"),
      where("popularity", "==", true),
      where("publish", "==", true),
      orderBy("popularityRank", "asc")
    );

    const snapshot = await getDocs(articlesQuery);

    return snapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        title: data.title || "",
        slug: data.slug || "",
        authorName:
          data.authorName || authorsMap.get(data.authorUID) || "Unknown Author",
        popularity: data.popularity || false,
        publish: data.publish || false,
        date:
          data.date instanceof Timestamp
            ? data.date.toDate().toISOString()
            : typeof data.date === "string"
            ? data.date
            : new Date().toISOString(),
      };
    });
  } catch (error) {
    console.error("Error fetching popular articles:", error);
    return [];
  }
}

export default async function Sidebar() {
  const youtubeChannelUrl =
    "https://www.youtube.com/@lap-tutorials?sub_confirmation=1";

  const popularArticles = await getPopularArticles();

  return (
    <aside>
      <h3 className="uppercase font-semibold mb-2">Subscribe To</h3>
      <p className="text-4xl font-semibold">L.A.P - Tutorials</p>
      <Image
        className="w-[20rem] pt-8 pb-4"
        src={magazineCover}
        alt="A cool and simple logo of L.A.P - Tutorials"
      />
      <Button
        asChild
        className="hover:bg-[#8a2be2] transition ease-in-out duration-300"
      >
        <a href={youtubeChannelUrl} target="_blank" rel="noopener noreferrer">
          Subscribe on YouTube
        </a>
      </Button>
      <PopularArticles initialArticles={popularArticles} />
    </aside>
  );
}
