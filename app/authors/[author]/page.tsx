import { db } from "@/lib/firebase";
import { collection, query, where, getDocs, orderBy } from "firebase/firestore";
import PostNavigation from "@/components/PostNavigation";
import SocialSharing from "@/components/SocialSharing";
import Link from "next/link";
import {
  RiInstagramLine,
  RiTwitterFill,
  RiYoutubeFill,
  RiGithubFill,
  RiTiktokFill,
  RiPatreonFill,
  RiFacebookFill,
  RiLinkedinFill,
  RiDiscordFill,
} from "react-icons/ri";

type AuthorData = {
  uid: string;
  name: string;
  job: string;
  city: string;
  avatar: string;
  imgAlt: string;
  slug: string;
  biography: { summary: string; body: string };
  socials?: { [key: string]: string }; // Social media map
};

type ArticleData = {
  uid: string;
  title: string;
  img: string;
  date: Date;
  read: string;
  label: string;
  slug: string;
  authorUID: string;
};

// Function to fetch author data
async function getAuthorData(slug: string) {
  try {
    const decodedAuthor = decodeURIComponent(slug);
    const authorsRef = collection(db, "authors");
    const q = query(authorsRef, where("slug", "==", decodedAuthor));
    const authorSnapshot = await getDocs(q);

    if (authorSnapshot.empty) return null;

    const authorData = authorSnapshot.docs[0].data() as AuthorData;

    const articlesQuery = query(
      collection(db, "articles"),
      where("authorUID", "==", authorData.uid),
      orderBy("date", "desc")
    );
    const articlesSnapshot = await getDocs(articlesQuery);

    const articles = articlesSnapshot.docs.map((doc) => ({
      uid: doc.id,
      ...doc.data(),
      date: doc.data().date?.toDate() || new Date(),
    })) as ArticleData[];

    return { author: authorData, articles };
  } catch (error) {
    console.error("Error fetching author details:", error);
    return null;
  }
}

// **Dynamically Map Social Links to Icons**
const SOCIAL_ICONS: { [key: string]: any } = {
  youtube: RiYoutubeFill,
  github: RiGithubFill,
  instagram: RiInstagramLine,
  twitter: RiTwitterFill,
  tiktok: RiTiktokFill,
  patreon: RiPatreonFill,
  facebook: RiFacebookFill,
  linkedin: RiLinkedinFill,
  discord: RiDiscordFill,
};

// **Non-async page component**
export default function Page({ params }: { params: { author: string } }) {
  return <AuthorPage authorSlug={params.author} />;
}

// **Async server component**
async function AuthorPage({ authorSlug }: { authorSlug: string }) {
  const data = await getAuthorData(authorSlug);

  if (!data) {
    return <div className="p-8">Author not found</div>;
  }

  const { author: authorData, articles } = data;

  // **Dynamically Generate Social Media Links**
  const socialLinks = authorData.socials
    ? Object.entries(authorData.socials)
        .filter(([platform, url]) => url) // Remove empty links
        .map(([platform, url]) => ({
          href: url,
          ariaLabel: `Visit ${authorData.name}'s ${platform} page`,
          Icon: SOCIAL_ICONS[platform.toLowerCase()] || RiGithubFill, // Default to GitHub icon if unknown
        }))
    : [];

  return (
    <main className="max-w-[95rem] w-full mx-auto px-4 sm:pt-4 xs:pt-2 lg:pb-4 md:pb-4 sm:pb-2 xs:pb-2">
      <PostNavigation href="/authors">Author</PostNavigation>

      <article className="max-w-[75rem] w-full mx-auto grid lg:grid-cols-[300px_680px] gap-8 md:gap-6 justify-around">
        {/* **Author Profile Section** */}
        <div className="w-fit">
          <img
            src={authorData.avatar}
            alt={authorData.imgAlt}
            className="w-full max-w-[300px] h-auto rounded-full"
          />
          {socialLinks.length > 0 && (
            <div className="flex justify-between border-t border-white mt-12 pt-6">
              <p className="uppercase font-semibold text-lg">Follow:</p>
              <SocialSharing links={socialLinks} />
            </div>
          )}
        </div>

        {/* **Author Biography** */}
        <article>
          <h1 className="text-subheading pb-8">{authorData.name}</h1>
          <p className="text-blog-summary pb-12">{authorData.biography.summary}</p>
          <p className="text-blog-body">{authorData.biography.body}</p>
        </article>
      </article>

      {/* **Author Articles** */}
      <div className="pb-12 md:pb-48">
        <h2 className="text-blog-subheading mt-[9.5rem] pt-12 pb-12 md:pb-24">
          Articles by {authorData.name}
        </h2>
        <AuthorArticles articles={articles} />
      </div>
    </main>
  );
}

// **Component to Render Author’s Articles**
function AuthorArticles({ articles }: { articles: ArticleData[] }) {
  if (articles.length === 0) {
    return (
      <div className="p-8 text-center">
        <p>No articles found for this author</p>
      </div>
    );
  }

  return (
    <div className="grid md:grid-cols-2">
      {articles.map((article) => (
        <article className="flex items-center gap-2 md:gap-12 p-8 border border-white" key={article.uid}>
          <Link href={`/posts/${article.slug}`} className="flex-shrink-0">
            <img
              className="h-[150px] w-[150px] object-cover hover:scale-105 transition-transform"
              src={article.img}
              alt={article.title}
            />
          </Link>

          <div>
            <p className="heading3-title pb-4">
              <Link href={`/posts/${article.slug}`} className="hover:text-white transition-colors">
                {article.title}
              </Link>
            </p>

            <div className="flex flex-wrap gap-4">
              <div className="flex items-center">
                <p className="font-semibold pr-2">Date:</p>
                <time dateTime={article.date.toISOString()} className="text-white">
                  {article.date.toLocaleDateString("en-US", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </time>
              </div>

              <div className="flex items-center">
                <p className="font-semibold pr-2">Category:</p>
                <span className="text-white">{article.label}</span>
              </div>
            </div>
          </div>
        </article>
      ))}
    </div>
  );
}
