import { Metadata } from 'next';
import formatString from "@/app/functions/formatString";
import PostNavigation from "@/components/PostNavigation";
import SocialSharing from "@/components/SocialSharing";
import Link from "next/link";
import { db } from "@/lib/firebase";
import { collection, query, where, getDocs, orderBy } from "firebase/firestore";

type AuthorData = {
  uid: string;
  name: string;
  job: string;
  city: string;
  avatar: string;
  imgAlt: string;
  slug: string;
  biography: {
    summary: string;
    body: string;
  };
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

export async function generateMetadata({
  params,
}: {
  params: { author: string };
}): Promise<Metadata> {
  const decodedAuthor = decodeURIComponent(params.author);
  try {
    const authorsRef = collection(db, "authors");
    const q = query(authorsRef, where("slug", "==", decodedAuthor));
    const snapshot = await getDocs(q);

    if (snapshot.empty) {
      return { title: "Author Not Found | L.A.P Docs" };
    }

    const authorData = snapshot.docs[0].data() as AuthorData;
    return {
      title: `${authorData.name} | L.A.P Docs`,
      description: authorData.biography.summary
    };
  } catch (error) {
    return {
      title: "Author Profile | L.A.P Docs"
    };
  }
}

// Function to fetch author data
async function getAuthorData(slug: string) {
  try {
    const decodedAuthor = decodeURIComponent(slug);
    const authorsRef = collection(db, "authors");
    const q = query(authorsRef, where("slug", "==", decodedAuthor));
    const authorSnapshot = await getDocs(q);

    if (authorSnapshot.empty) {
      return null;
    }

    const authorData = authorSnapshot.docs[0].data() as AuthorData;
    const articlesQuery = query(
      collection(db, "articles"),
      where("authorUID", "==", authorData.uid),
      orderBy("date", "desc")
    );
    const articlesSnapshot = await getDocs(articlesQuery);

    const articles = articlesSnapshot.docs.map(doc => ({
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

// Non-async page component
export default function Page({ params }: { params: { author: string } }) {
  return <AuthorPage authorSlug={params.author} />;
}

// Async server component
async function AuthorPage({ authorSlug }: { authorSlug: string }) {
  const data = await getAuthorData(authorSlug);
  
  if (!data) {
    return <div className="p-8">Author not found</div>;
  }
  
  const { author: authorData, articles } = data;

  return (
    <main className="max-w-[95rem] w-full mx-auto px-4 sm:pt-4 xs:pt-2 lg:pb-4 md:pb-4 sm:pb-2 xs:pb-2">
      <PostNavigation href="/authors">Author</PostNavigation>
      
      <article className="max-w-[75rem] w-full mx-auto grid lg:grid-cols-[300px_680px] gap-8 md:gap-6 justify-around">
        {/* Author Profile Section */}
        <div className="w-fit">
          <img
            src={authorData.avatar}
            alt={authorData.imgAlt}
            className="w-full max-w-[300px] h-auto"
          />
          <div className="flex justify-between border-t border-black mt-12 pt-6">
            <p className="uppercase font-semibold text-lg">Follow</p>
            <SocialSharing
              links={[
                {
                  href: "#",
                  ariaLabel: "Visit our Instagram page",
                  src: "/icons/ri_instagram-line.svg",
                  alt: "Instagram logo",
                },
                {
                  href: "#",
                  ariaLabel: "Visit our Twitter page",
                  src: "/icons/ri_twitter-fill.svg",
                  alt: "Twitter logo",
                },
                {
                  href: "#",
                  ariaLabel: "Visit our YouTube page",
                  src: "/icons/ri_youtube-fill.svg",
                  alt: "YouTube logo",
                },
              ]}
            />
          </div>
        </div>

        {/* Author Biography */}
        <article>
          <h1 className="text-subheading pb-8">{authorData.name}</h1>
          <p className="text-blog-summary pb-12">
            {authorData.biography.summary}
          </p>
          <p className="text-blog-body">{authorData.biography.body}</p>
        </article>
      </article>

      {/* Author Articles */}
      <div className="pb-12 md:pb-48">
        <h2 className="text-blog-subheading mt-[9.5rem] pt-12 pb-12 md:pb-24">
          Articles by {authorData.name}
        </h2>
        <AuthorArticles articles={articles} />
      </div>
    </main>
  );
}

function AuthorArticles({ articles }: { articles: ArticleData[] }) {
  if (articles.length === 0) {
    return (
      <div className="p-8 text-center">
        <p>No articles found for this author</p>
      </div>
    );
  }

  return (
    <div className="grid md:grid-cols-2 border border-black border-collapse">
      {articles.map((article) => (
        <article
          className="flex items-center gap-2 md:gap-12 p-8 border border-black"
          key={article.uid}
        >
          <Link href={`/magazine/${article.slug}`} className="flex-shrink-0">
            <img
              className="h-[150px] w-[150px] object-cover hover:scale-105 transition-transform"
              src={article.img}
              alt={article.title}
            />
          </Link>
          
          <div>
            <p className="heading3-title pb-4">
              <Link 
                href={`/magazine/${article.slug}`}
                className="hover:text-gray-600 transition-colors"
              >
                {article.title}
              </Link>
            </p>
            
            <div className="flex flex-wrap gap-4">
              <div className="flex items-center">
                <p className="font-semibold pr-2">Date:</p>
                <time 
                  dateTime={article.date.toISOString()}
                  className="text-gray-600"
                >
                  {article.date.toLocaleDateString("en-US", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </time>
              </div>
              
              <div className="flex items-center">
                <p className="font-semibold pr-2">Category:</p>
                <span className="text-gray-600">
                  {formatString(article.label)}
                </span>
              </div>
            </div>
          </div>
        </article>
      ))}
    </div>
  );
}