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
  title: "Privacy Policy",
  description: `Privacy Policy for ${SITE_NAME}`,
  alternates: {
    canonical: absoluteUrl("/privacy-policy"),
  },
  openGraph: {
    title: `Privacy Policy | ${SITE_NAME}`,
    description: `Privacy Policy for ${SITE_NAME}`,
    url: absoluteUrl("/privacy-policy"),
    siteName: SITE_NAME,
    locale: SITE_LOCALE,
    type: "website",
    images: [
      {
        url: DEFAULT_OG_IMAGE_PATH,
        width: 1200,
        height: 630,
        alt: `${SITE_NAME} privacy policy preview`,
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: `Privacy Policy | ${SITE_NAME}`,
    description: `Privacy Policy for ${SITE_NAME}`,
    images: [DEFAULT_TWITTER_IMAGE_PATH],
  },
};

export default function PrivacyPolicy() {
  const jsonLd = [
    {
      "@context": "https://schema.org",
      "@type": "WebPage",
      name: "Privacy Policy",
      url: absoluteUrl("/privacy-policy"),
      description: `Privacy Policy for ${SITE_NAME}`,
    },
    buildBreadcrumbSchema([
      { name: "Home", path: "/" },
      { name: "Privacy Policy", path: "/privacy-policy" },
    ]),
  ];

  return (
    <main className="flex flex-col min-h-screen max-w-4xl mx-auto px-6 py-12 w-full text-white">
      <JsonLd data={jsonLd} />
      <h1 className="text-4xl font-bold mb-8">Privacy Policy</h1>
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
          1. Introduction
        </h2>
        <p className="mb-4 text-gray-300 leading-relaxed">
          Welcome to L.A.P - Docs. We respect your privacy and are committed to
          protecting your personal data. This privacy policy explains what
          information we collect, how we use it, and the rights you have
          concerning your data when you visit our website.
        </p>
      </section>

      <section className="mb-8">
        <h2 className="text-2xl font-semibold mb-4 text-[#8a2be2]">
          2. The Data We Collect
        </h2>
        <p className="mb-4 text-gray-300 leading-relaxed">
          We only collect data that is necessary to provide you with our
          services and improve your experience on our website. Specifically, we
          collect:
        </p>
        <ul className="list-disc pl-6 mb-4 text-gray-300 space-y-2">
          <li>
            <strong>Usage Data & Analytics:</strong> We use Google Analytics
            solely to collect anonymized information about how you interact with
            our website. This includes your browser type, operating system,
            pages visited, and time spent on those pages, allowing us to monitor
            traffic patterns.
          </li>
        </ul>
        <p className="mb-4 text-gray-300 leading-relaxed">
          We do not require you to create an account to use our website, and we
          do not collect sensitive personal data.
        </p>
      </section>

      <section className="mb-8">
        <h2 className="text-2xl font-semibold mb-4 text-[#8a2be2]">
          3. How We Use Your Data
        </h2>
        <p className="mb-4 text-gray-300 leading-relaxed">
          We use the minimal information we collect for the following purposes:
        </p>
        <ul className="list-disc pl-6 mb-4 text-gray-300 space-y-2">
          <li>
            <strong>To improve our website:</strong> We use analytics data to
            understand how users interact with our site, which helps us improve
            our content, layout, and overall user experience.
          </li>
          <li>
            <strong>To ensure security:</strong> To monitor and protect our
            website from malicious activity.
          </li>
        </ul>
      </section>

      <section className="mb-8">
        <h2 className="text-2xl font-semibold mb-4 text-[#8a2be2]">
          4. Cookies and Tracking Technologies
        </h2>
        <p className="mb-4 text-gray-300 leading-relaxed">
          We use cookies and similar tracking technologies (such as Google
          Analytics tags) to track activity on our service. Cookies are files
          with a small amount of data which may include an anonymous unique
          identifier.
        </p>
        <p className="mb-4 text-gray-300 leading-relaxed">
          You can instruct your browser to refuse all cookies or to indicate
          when a cookie is being sent. However, if you do not accept cookies,
          some portions of our analytics may not function properly, though you
          will still be able to read our documentation.
        </p>
      </section>

      <section className="mb-8">
        <h2 className="text-2xl font-semibold mb-4 text-[#8a2be2]">
          5. Third-Party Services
        </h2>
        <p className="mb-4 text-gray-300 leading-relaxed">
          We do not sell, trade, or otherwise transfer your personally
          identifiable information to outside parties. However, we do share data
          with trusted third-party service providers who assist us in operating
          our website, such as Google Analytics for traffic analysis. These
          parties agree to keep this information confidential.
        </p>
      </section>

      <section className="mb-8">
        <h2 className="text-2xl font-semibold mb-4 text-[#8a2be2]">
          6. Your Rights
        </h2>
        <p className="mb-4 text-gray-300 leading-relaxed">
          Depending on your location, you may have the right to request access
          to the personal data we hold about you, request corrections, or
          request deletion of your data. To exercise these rights, please
          contact us directly.
        </p>
      </section>

      <section className="mb-8">
        <h2 className="text-2xl font-semibold mb-4 text-[#8a2be2]">
          7. Contact Us
        </h2>
        <p className="mb-4 text-gray-300 leading-relaxed">
          If you have any questions about this Privacy Policy, please contact us
          via email at{" "}
          <a
            href="mailto:contact@lap.onl?subject=Privacy%20Policy%20Inquiry"
            className="text-[#8a2be2] hover:underline"
          >
            contact@lap.onl
          </a>
          .
        </p>
      </section>
    </main>
  );
}
