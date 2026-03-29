import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import JsonLd from "@/components/JsonLd";
import PostNavigation from "@/components/PostNavigation";
import SocialSharing from "@/components/SocialSharing";
import {
  getAuthorBySlug,
  getPublishedArticles,
  getPublishedArticlesForAuthor,
} from "@/lib/content";
import {
  SITE_LOCALE,
  SITE_NAME,
  SITE_WEBSITE_ID,
  absoluteUrl,
  buildBreadcrumbSchema,
  buildPublisherSchema,
} from "@/lib/seo";
import {
  RiDiscordFill,
  RiFacebookFill,
  RiGithubFill,
  RiInstagramLine,
  RiLink,
  RiLinkedinFill,
  RiPatreonFill,
  RiTiktokFill,
  RiTwitterFill,
  RiYoutubeFill,
} from "react-icons/ri";

type RouteParams = {
  author: string;
};

export const dynamic = "force-dynamic";

function buildAuthorSummary(name: string, job: string, city: string) {
  const role = job || "team member";
  const cityText = city ? ` based in ${city}` : "";
  return `${name} is a ${role} on the ${SITE_NAME} team${cityText}.`;
}

function buildAuthorBody(name: string, city: string) {
  const cityText = city ? ` Based in ${city},` : "";
  return `${cityText} ${name} contributes to ${SITE_NAME} by supporting tutorials, documentation, and the broader learning experience for the community.`.trim();
}

const SOCIAL_ICONS: Record<string, any> = {
  youtube: RiYoutubeFill,
  github: RiGithubFill,
  instagram: RiInstagramLine,
  twitter: RiTwitterFill,
  tiktok: RiTiktokFill,
  patreon: RiPatreonFill,
  facebook: RiFacebookFill,
  linkedin: RiLinkedinFill,
  discord: RiDiscordFill,
  link: RiLink,
};

export async function generateMetadata({
  params,
}: {
  params: Promise<RouteParams>;
}): Promise<Metadata> {
  const { author } = await params;
  const authorData = await getAuthorBySlug(author);

  if (!authorData) {
    return {
      title: `Team Member Not Found | ${SITE_NAME}`,
      description: "The requested team member could not be found.",
      robots: {
        index: false,
        follow: false,
      },
    };
  }

  const authorUrl = absoluteUrl(`/team/${authorData.slug}`);
  const authorDescription =
    authorData.biography.summary ||
    buildAuthorSummary(authorData.name, authorData.job, authorData.city);

  return {
    title: authorData.name,
    description: authorDescription,
    alternates: {
      canonical: authorUrl,
    },
    openGraph: {
      title: authorData.name,
      description: authorDescription,
      url: authorUrl,
      siteName: SITE_NAME,
      locale: SITE_LOCALE,
      images: [
        {
          url: absoluteUrl(authorData.avatar),
          alt: authorData.imgAlt || authorData.name,
        },
      ],
      type: "profile",
    },
    twitter: {
      card: "summary_large_image",
      title: authorData.name,
      description: authorDescription,
      images: [absoluteUrl(authorData.avatar)],
    },
  };
}

export default async function AuthorPage({
  params,
}: {
  params: Promise<RouteParams>;
}) {
  const { author } = await params;
  const authorData = await getAuthorBySlug(author);

  if (!authorData) {
    notFound();
  }

  const authoredArticles = await getPublishedArticlesForAuthor(authorData.uid);
  const fallbackArticles =
    authoredArticles.length === 0 ? await getPublishedArticles(4) : [];
  const displayArticles =
    authoredArticles.length > 0 ? authoredArticles : fallbackArticles;
  const authorSummary =
    authorData.biography.summary ||
    buildAuthorSummary(authorData.name, authorData.job, authorData.city);
  const authorBody =
    authorData.biography.body ||
    buildAuthorBody(authorData.name, authorData.city);

  const socialLinks = Object.entries(authorData.socials)
    .filter(([, url]) => url)
    .map(([platform, url]) => ({
      href: url,
      ariaLabel: `Visit ${authorData.name}'s ${platform} page`,
      Icon: SOCIAL_ICONS[platform.toLowerCase()] || RiGithubFill,
    }));

  const authorUrl = absoluteUrl(`/team/${authorData.slug}`);
  const latestModified =
    authoredArticles[0]?.updatedAt || authorData.updatedAt || new Date();
  const jsonLd = [
    {
      "@context": "https://schema.org",
      "@type": "ProfilePage",
      url: authorUrl,
      dateModified: latestModified.toISOString(),
      mainEntity: {
        "@type": "Person",
        "@id": `${authorUrl}#person`,
        name: authorData.name,
        jobTitle: authorData.job,
        image: absoluteUrl(authorData.avatar),
        description: authorSummary,
        url: authorUrl,
        sameAs: socialLinks.map((link) => link.href),
        worksFor: buildPublisherSchema(),
        hasPart: authoredArticles.map((article) => ({
          "@type": "BlogPosting",
          headline: article.title,
          url: absoluteUrl(`/posts/${article.slug}`),
        })),
      },
      isPartOf: {
        "@id": SITE_WEBSITE_ID,
      },
    },
    buildBreadcrumbSchema([
      { name: "Home", path: "/" },
      { name: "Team", path: "/team" },
      { name: authorData.name, path: `/team/${authorData.slug}` },
    ]),
  ];

  return (
    <main className="max-w-[95rem] w-full mx-auto px-4 sm:pt-4 xs:pt-2 lg:pb-4 md:pb-4 sm:pb-2 xs:pb-2">
      <JsonLd data={jsonLd} />
      <PostNavigation href="/team">TEAM</PostNavigation>

      <article className="max-w-[75rem] w-full mx-auto grid lg:grid-cols-[300px_680px] gap-8 md:gap-6 justify-around">
        <div className="w-fit">
          <img
            src={authorData.avatar || "/default-avatar.png"}
            alt={authorData.imgAlt || authorData.name}
            className="w-full max-w-[300px] h-auto rounded-full"
            width={300}
            height={300}
            loading="eager"
            decoding="async"
          />
          {socialLinks.length > 0 && (
            <div className="flex justify-between border-t border-white mt-12 pt-6">
              <p className="uppercase font-semibold text-lg">Follow:</p>
              <SocialSharing links={socialLinks} />
            </div>
          )}
        </div>

        <article>
          <h1 className="text-subheading pb-2">{authorData.name}</h1>
          <p className="text-blog-summary pb-12 text-white/50">{authorData.job}</p>
          <p className="text-blog-summary pb-12">{authorSummary}</p>
          <p className="text-blog-body">{authorBody}</p>
        </article>
      </article>

      <div className="pb-12 md:pb-48">
        <h2 className="text-blog-subheading mt-[9.5rem] pt-12 pb-12 md:pb-24">
          {authoredArticles.length > 0
            ? `Posts by ${authorData.name}`
            : `Latest Posts on ${SITE_NAME}`}
        </h2>
        {authoredArticles.length === 0 ? (
          <p className="pb-8 text-white/70">
            {authorData.name} does not have published posts on the site yet, so
            we are showing the latest docs below.
          </p>
        ) : null}
        <AuthorArticles articles={displayArticles} />
      </div>
    </main>
  );
}

function AuthorArticles({
  articles,
}: {
  articles: Awaited<ReturnType<typeof getPublishedArticles>>;
}) {
  if (articles.length === 0) {
    return (
      <div className="p-8 text-center">
        <p className="font-medium">No posts found for this team member</p>
      </div>
    );
  }

  const postsToShow = articles.slice(0, 4);

  return (
    <div className="grid md:grid-cols-2">
      {postsToShow.map((article) => (
        <article
          className="flex flex-col sm:flex-row items-start sm:items-center gap-4 md:gap-12 p-8 border border-white"
          key={article.id}
        >
          <Link href={`/posts/${article.slug}`} className="flex-shrink-0">
            <img
              className="h-[100%] w-[100%] sm:h-[150px] sm:w-[100%] object-cover hover:scale-105 transition-transform"
              src={article.img}
              alt={article.imgAlt}
              width={320}
              height={180}
              loading="lazy"
              decoding="async"
            />
          </Link>
          <div>
            <p className="heading3-title pb-2 sm:pb-4">
              <Link
                href={`/posts/${article.slug}`}
                className="hover:text-white transition-colors"
              >
                {article.title}
              </Link>
            </p>
            <div className="flex flex-wrap gap-2 sm:gap-4">
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
              <Link
                href={article.topicPath}
                className="flex items-center hover:text-white/80 transition-colors"
              >
                <p className="font-semibold pr-2">Category:</p>
                <span className="text-white">{article.label}</span>
              </Link>
            </div>
          </div>
        </article>
      ))}
    </div>
  );
}
