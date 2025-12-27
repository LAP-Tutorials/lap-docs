import AuthorsList from "@/components/AuthorList";
import PageTitle from "@/components/PageTitle";
import { Suspense } from "react";
import Loading from "./loading";
import type { Metadata } from "next";
import JsonLd from "@/components/JsonLd";

export const metadata: Metadata = {
  title: "Team",
  description: "Meet the dedicated team behind L.A.P Docs.",
  openGraph: {
    title: "Team | L.A.P Docs",
    description: "Meet the dedicated team behind L.A.P Docs.",
    url: "https://lap-docs.netlify.app/team",
    siteName: "L.A.P Docs",
    type: "website",
    images: ["/og-image.png"],
  },
  twitter: {
    card: "summary_large_image",
    title: "Team | L.A.P Docs",
    description: "Meet the dedicated team behind L.A.P Docs.",
    images: ["/twitter-image.png"],
  },
};

export default function AuthorsPage() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: "L.A.P Team",
    description: "Meet the dedicated team behind L.A.P Docs.",
    url: "https://lap-docs.netlify.app/team",
  };

  return (
    <main className="flex flex-col min-h-screen max-w-[95rem] w-full mx-auto px-4 lg:pt-0 sm:pt-4 xs:pt-2 lg:pb-4 md:pb-4 sm:pb-2 xs:pb-2">
      <JsonLd data={jsonLd} />
      <PageTitle
        className="sr-only"
        imgSrc="/images/titles/Authors.svg"
        imgAlt="The word 'Author' in uppercase, bold lettering"
      >
        Authors
      </PageTitle>
      <Suspense fallback={<Loading />}>
        <AuthorsList />
      </Suspense>
    </main>
  );
}
