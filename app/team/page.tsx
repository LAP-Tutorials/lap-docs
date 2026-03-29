import AuthorsList from "@/components/AuthorList";
import PageTitle from "@/components/PageTitle";
import { Suspense } from "react";
import Loading from "./loading";
import type { Metadata } from "next";
import JsonLd from "@/components/JsonLd";
import { getAllAuthors } from "@/lib/content";
import {
  DEFAULT_OG_IMAGE_PATH,
  DEFAULT_TWITTER_IMAGE_PATH,
  SITE_LOCALE,
  SITE_NAME,
  SITE_WEBSITE_ID,
  absoluteUrl,
  buildBreadcrumbSchema,
} from "@/lib/seo";

export const metadata: Metadata = {
  title: "Team",
  description: "Meet the team behind L.A.P - Docs.",
  openGraph: {
    title: `Team | ${SITE_NAME}`,
    description: "Meet the team behind L.A.P - Docs.",
    url: absoluteUrl("/team"),
    siteName: SITE_NAME,
    type: "website",
    locale: SITE_LOCALE,
    images: [
      {
        url: DEFAULT_OG_IMAGE_PATH,
        width: 1200,
        height: 630,
        alt: `${SITE_NAME} team preview`,
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: `Team | ${SITE_NAME}`,
    description: "Meet the team behind L.A.P - Docs.",
    images: [DEFAULT_TWITTER_IMAGE_PATH],
  },
  alternates: {
    canonical: absoluteUrl("/team"),
  },
};

export const dynamic = "force-dynamic";

type AuthorType = {
  uid: string;
  name: string;
  job: string;
  city: string;
  avatar: string;
  imgAlt: string;
  slug: string;
};

async function getAuthors() {
  try {
    const authors = await getAllAuthors();
    return authors.map((author) => ({
      uid: author.uid,
      name: author.name,
      job: author.job,
      city: author.city,
      avatar: author.avatar,
      imgAlt: author.imgAlt,
      slug: author.slug,
    }));
  } catch (error) {
    console.error("Error fetching authors:", error);
    return [];
  }
}

export default async function AuthorsPage() {
  const authors = await getAuthors();

  const pageUrl = absoluteUrl("/team");
  const jsonLd = [
    {
      "@context": "https://schema.org",
      "@type": "CollectionPage",
      name: "Team",
      description: "Meet the team behind L.A.P - Docs.",
      url: pageUrl,
      isPartOf: {
        "@id": SITE_WEBSITE_ID,
      },
    },
    buildBreadcrumbSchema([
      { name: "Home", path: "/" },
      { name: "Team", path: "/team" },
    ]),
  ];

  return (
    <main className="flex flex-col min-h-screen max-w-[95rem] w-full mx-auto px-4 lg:pt-0 sm:pt-4 xs:pt-2 lg:pb-4 md:pb-4 sm:pb-2 xs:pb-2">
      <JsonLd data={jsonLd} />
      <PageTitle
        className="sr-only"
        imgSrc="/images/titles/Authors.svg"
        imageWidth={1520}
        imageHeight={231}
        decorative
      >
        Team
      </PageTitle>
      <Suspense fallback={<Loading />}>
        <AuthorsList initialAuthors={authors} />
      </Suspense>
    </main>
  );
}
