import type { Metadata } from "next";
import JsonLd from "@/components/JsonLd";
import {
  DEFAULT_OG_IMAGE_PATH,
  DEFAULT_TWITTER_IMAGE_PATH,
  SITE_LOCALE,
  SITE_NAME,
  absoluteUrl,
  buildBreadcrumbSchema,
} from "@/lib/seo";

export const metadata: Metadata = {
  title: "Terms of Service",
  description: `Terms of Service for ${SITE_NAME}`,
  alternates: {
    canonical: absoluteUrl("/terms-of-service"),
  },
  openGraph: {
    title: `Terms of Service | ${SITE_NAME}`,
    description: `Terms of Service for ${SITE_NAME}`,
    url: absoluteUrl("/terms-of-service"),
    siteName: SITE_NAME,
    locale: SITE_LOCALE,
    type: "website",
    images: [
      {
        url: DEFAULT_OG_IMAGE_PATH,
        width: 1200,
        height: 630,
        alt: `${SITE_NAME} terms of service preview`,
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: `Terms of Service | ${SITE_NAME}`,
    description: `Terms of Service for ${SITE_NAME}`,
    images: [DEFAULT_TWITTER_IMAGE_PATH],
  },
};

export default function TermsOfService() {
  const jsonLd = [
    {
      "@context": "https://schema.org",
      "@type": "WebPage",
      name: "Terms of Service",
      url: absoluteUrl("/terms-of-service"),
      description: `Terms of Service for ${SITE_NAME}`,
    },
    buildBreadcrumbSchema([
      { name: "Home", path: "/" },
      { name: "Terms of Service", path: "/terms-of-service" },
    ]),
  ];

  return (
    <main className="flex flex-col min-h-screen max-w-4xl mx-auto px-6 py-12 w-full text-white">
      <JsonLd data={jsonLd} />
      <h1 className="text-4xl font-bold mb-8">Terms of Service</h1>
      <p className="mb-4 text-gray-300">
        Last updated:{" "}
        {new Date().toLocaleDateString("en-US", {
          month: "long",
          day: "numeric",
          year: "numeric",
        })}
      </p>

      <section className="mb-8">
        <h2 className="text-2xl font-semibold mb-4 text-[#8a2be2]">
          1. Acceptance of Terms
        </h2>
        <p className="mb-4 text-gray-300 leading-relaxed">
          By accessing this website, we assume you accept these terms of service
          in full. Do not continue to use L.A.P - Docs if you do not accept all
          of the terms of service stated on this page. Our site provides
          technical documentation, guides, and tutorials for informational
          purposes.
        </p>
      </section>

      <section className="mb-8">
        <h2 className="text-2xl font-semibold mb-4 text-[#8a2be2]">
          2. Informational Purposes Only
        </h2>
        <p className="mb-4 text-gray-300 leading-relaxed">
          The tutorials, code snippets, and general information provided on
          L.A.P - Docs are for educational and informational purposes only.
          While we strive to keep technical information as accurate and
          up-to-date as possible, technology changes rapidly. We do not
          guarantee the accuracy, completeness, or usefulness of this
          information. Proceeding with our guides is at your own risk.
        </p>
      </section>

      <section className="mb-8">
        <h2 className="text-2xl font-semibold mb-4 text-[#8a2be2]">
          3. License and Use of Content
        </h2>
        <p className="mb-4 text-gray-300 leading-relaxed">
          The documentation, guides, and articles (excluding user-submitted
          comments or third-party code libraries) are the intellectual property
          of L.A.P. You may view and print pages for your own personal,
          non-commercial use.
        </p>
        <p className="mb-4 text-gray-300 leading-relaxed font-semibold">
          You must not:
        </p>
        <ul className="list-disc pl-6 mb-4 text-gray-300 space-y-2">
          <li>
            Republish material from https://lap.onl without proper attribution.
          </li>
          <li>Sell or rent material from https://lap.onl.</li>
          <li>
            Reproduce, duplicate, or copy material from https://lap.onl for
            commercial gain.
          </li>
        </ul>
        <p className="mb-4 text-gray-300 leading-relaxed mt-4">
          Code snippets provided in our tutorials may generally be freely used
          in your own projects unless stated otherwise in the specific tutorial.
        </p>
      </section>

      <section className="mb-8">
        <h2 className="text-2xl font-semibold mb-4 text-[#8a2be2]">
          4. Disclaimer of Warranties
        </h2>
        <p className="mb-4 text-gray-300 leading-relaxed">
          The materials on L.A.P - Docs&apos;s website are provided on an
          &apos;as is&apos; basis. L.A.P makes no warranties, expressed or
          implied, and hereby disclaims and negates all other warranties
          including, without limitation, implied warranties or conditions of
          merchantability, fitness for a particular purpose, or non-infringement
          of intellectual property or other violation of rights.
        </p>
      </section>

      <section className="mb-8">
        <h2 className="text-2xl font-semibold mb-4 text-[#8a2be2]">
          5. Limitations of Liability
        </h2>
        <p className="mb-4 text-gray-300 leading-relaxed">
          In no event shall L.A.P or its contributors be liable for any damages
          (including, without limitation, damages for loss of data or profit,
          server downtime, or due to business interruption) arising out of the
          use or inability to use the materials on L.A.P - Docs&apos;s website
          or out of following any provided tutorials, even if L.A.P or a L.A.P
          authorized representative has been notified orally or in writing of
          the possibility of such damage.
        </p>
      </section>

      <section className="mb-8">
        <h2 className="text-2xl font-semibold mb-4 text-[#8a2be2]">
          6. Links to Third-Party Sites
        </h2>
        <p className="mb-4 text-gray-300 leading-relaxed">
          Our tutorials frequently link to third-party tools, repositories, or
          documentation. L.A.P has not reviewed the totality of these external
          sites and is not responsible for their contents or privacy policies.
          The inclusion of any link does not imply endorsement by L.A.P. Use of
          any linked tool or website is at the user&apos;s own risk.
        </p>
      </section>

      <section className="mb-8">
        <h2 className="text-2xl font-semibold mb-4 text-[#8a2be2]">
          7. Revisions
        </h2>
        <p className="mb-4 text-gray-300 leading-relaxed">
          L.A.P may revise these terms of service for its website at any time
          without notice. By using this website you are agreeing to be bound by
          the then-current version of these terms of service.
        </p>
      </section>
    </main>
  );
}
