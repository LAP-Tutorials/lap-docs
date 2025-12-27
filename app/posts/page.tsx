import Articles from "@/components/Articles/Articles";
import Loading from "@/components/Articles/loading";
import PageTitle from "@/components/PageTitle";
import { Suspense } from "react";
import type { Metadata } from "next";
import JsonLd from "@/components/JsonLd";

export const metadata: Metadata = {
  title: "Posts",
  description: "Browse our latest articles, tutorials, and guides.",
  openGraph: {
    title: "Posts | L.A.P Docs",
    description: "Browse our latest articles, tutorials, and guides.",
    url: "https://lap-docs.netlify.app/posts",
    siteName: "L.A.P Docs",
    type: "website",
    images: "https://lap-docs.netlify.app/og-image.png",
  },
  twitter: {
    card: "summary_large_image",
    title: "Posts | L.A.P Docs",
    description: "Browse our latest articles, tutorials, and guides.",
    images: "https://lap-docs.netlify.app/twitter-image.png",
  },
};

export default function MagazinePage() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: "L.A.P Posts",
    description: "Browse our latest articles, tutorials, and guides.",
    url: "https://lap-docs.netlify.app/posts",
  };

  return (
    <main className="flex flex-col min-h-screen max-w-[95rem] w-full mx-auto px-4 lg:pt-0 sm:pt-4 xs:pt-2 lg:pb-4 md:pb-4 sm:pb-2 xs:pb-2">
      <JsonLd data={jsonLd} />
      <PageTitle
        className="sr-only"
        imgSrc="/images/titles/Magazine.svg"
        imgAlt="The word 'Magazine' in bold, uppercase lettering"
      >
        Posts
      </PageTitle>
      <Suspense fallback={<Loading />}>
        <Articles />
      </Suspense>
    </main>
  );
}
