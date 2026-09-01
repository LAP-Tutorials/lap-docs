import type { Metadata } from "next";
import Link from "next/link";
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
  alternates: { canonical: absoluteUrl("/terms-of-service") },
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

const sectionClass = "mb-8";
const headingClass = "text-2xl font-semibold mb-4 text-[#8a2ae3]";
const paragraphClass = "mb-4 text-gray-300 leading-relaxed";
const listClass = "list-disc pl-6 mb-4 text-gray-300 space-y-2";

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
        Last updated: September 1, 2026 (version 2026-09-01)
      </p>

      <section className={sectionClass}>
        <h2 className={headingClass}>1. Who We Are and Acceptance</h2>
        <p className={paragraphClass}>
          L.A.P - Docs at lap.onl is operated by the L.A.P Team (&quot;L.A.P&quot;,
          &quot;we&quot;, &quot;us&quot;, or &quot;our&quot;). These Terms govern
          your use of the site, reader accounts, and community features. By using
          the site you agree to these Terms. When you create an account, you must
          actively accept the version presented to you. If you do not agree, do
          not create an account or use the community features. Contact us at
          contact@lap.onl.
        </p>
        <p className={paragraphClass}>
          Our{" "}
          <Link href="/privacy-policy" className="text-[#8a2ae3] hover:underline">
            Privacy Policy
          </Link>{" "}
          explains how we handle personal data. The{" "}
          <Link
            href="/community-guidelines"
            className="text-[#8a2ae3] hover:underline"
          >
            Community Guidelines
          </Link>{" "}
          form part of these Terms for community participation.
        </p>
      </section>

      <section className={sectionClass}>
        <h2 className={headingClass}>2. Eligibility</h2>
        <p className={paragraphClass}>
          You must be at least 13 to create an account. If the law where you live
          requires a higher minimum age or parental permission, you may use an
          account only after meeting that requirement. If you accept these Terms
          for an organization, you confirm that you have authority to bind it.
        </p>
      </section>

      <section className={sectionClass}>
        <h2 className={headingClass}>3. Documentation Is Informational</h2>
        <p className={paragraphClass}>
          L.A.P - Docs provides technical documentation, tutorials, examples,
          and community discussion for educational and informational purposes.
          Technology changes and examples may contain errors or become outdated.
          Review commands and code before using them, keep backups, test in a
          safe environment, and obtain professional advice when the consequences
          are significant. The content is not legal, financial, medical, or
          other regulated professional advice.
        </p>
      </section>

      <section className={sectionClass}>
        <h2 className={headingClass}>4. Accounts</h2>
        <ul className={listClass}>
          <li>Provide accurate information and keep your sign-in method secure.</li>
          <li>Use one account only for yourself unless we authorize otherwise.</li>
          <li>Do not sell, transfer, impersonate, or share control of an account.</li>
          <li>Tell us promptly if you believe an account has been compromised.</li>
          <li>
            You are responsible for activity performed through your account to
            the extent permitted by law.
          </li>
        </ul>
        <p className={paragraphClass}>
          Public handles are unique, must meet our format rules, and may not
          impersonate L.A.P, its team, or another person. We may reclaim or
          change a handle when reasonably necessary to address impersonation,
          infringement, security, or technical problems.
        </p>
      </section>

      <section className={sectionClass}>
        <h2 className={headingClass}>5. Community Conduct and Moderation</h2>
        <p className={paragraphClass}>
          Follow the Community Guidelines and all applicable laws. Do not post
          unlawful, threatening, hateful, harassing, deceptive, invasive,
          sexually exploitative, infringing, malicious, spam, or
          privacy-violating content. Do not manipulate reactions, evade
          restrictions, scrape protected data, interfere with security, probe
          the service without permission, or use automated access that burdens
          the site.
        </p>
        <p className={paragraphClass}>
          We may review reports and remove, limit, label, translate for review,
          or preserve content; issue warnings; restrict a browser installation;
          or suspend or terminate an account when reasonably necessary to
          enforce these Terms, protect people or the service, comply with law,
          or investigate abuse. Decisions can use automated risk signals but may
          be reviewed by a moderator. Contact us if you believe a decision is
          incorrect.
        </p>
      </section>

      <section className={sectionClass}>
        <h2 className={headingClass}>6. Your Content</h2>
        <p className={paragraphClass}>
          You keep any ownership rights you have in comments, replies, and
          images you submit. You give L.A.P a non-exclusive, worldwide,
          royalty-free licence to host, store, reproduce, format, display,
          distribute within the service, translate, moderate, and otherwise use
          that content only as needed to operate, secure, and improve L.A.P -
          Docs. We may allow our service providers to exercise those rights on
          our behalf.
        </p>
        <p className={paragraphClass}>
          This licence ends when your content is deleted, except for content
          retained in anonymized public discussions, backups, moderation or
          legal records, and copies lawfully made by others before deletion. You
          confirm that you have the rights and permissions needed to submit the
          content and grant this licence. Do not upload confidential information
          or personal data you are not authorized to disclose.
        </p>
      </section>

      <section className={sectionClass}>
        <h2 className={headingClass}>7. L.A.P Content and Code Examples</h2>
        <p className={paragraphClass}>
          Unless a page states otherwise, L.A.P owns or licenses the site design,
          branding, original articles, documentation, and other non-user
          content. You may access and print that content for personal reference,
          quote reasonable portions with attribution, and link to our pages. You
          may not republish substantial portions, remove rights notices, present
          our work as your own, or sell our content as a substitute for the site
          without permission.
        </p>
        <p className={paragraphClass}>
          Unless a tutorial or accompanying licence says otherwise, L.A.P-owned
          code snippets may be copied, modified, and used in personal or
          commercial projects without attribution and without warranty. This
          permission does not override a licence attached to third-party code,
          packages, trademarks, images, or other materials. You are responsible
          for checking and following third-party licences.
        </p>
      </section>

      <section className={sectionClass}>
        <h2 className={headingClass}>8. Third-Party Services and Links</h2>
        <p className={paragraphClass}>
          The site may rely on or link to third-party platforms, repositories,
          videos, packages, tools, hosting, authentication, translation, and
          analytics services. Their terms, licences, availability, and privacy
          practices are controlled by them. A link or integration does not by
          itself mean that L.A.P endorses every statement, product, or practice
          of the third party.
        </p>
      </section>

      <section className={sectionClass}>
        <h2 className={headingClass}>9. Availability and Changes to the Service</h2>
        <p className={paragraphClass}>
          We may maintain, update, add, remove, or discontinue features for
          security, legal, technical, editorial, or operational reasons. We do
          not promise that the service, any account feature, or any particular
          article will always be available, uninterrupted, secure, or
          error-free. Where reasonably possible, we will give appropriate notice
          of a material discontinuation that significantly affects active
          account holders.
        </p>
      </section>

      <section className={sectionClass}>
        <h2 className={headingClass}>10. Warranties</h2>
        <p className={paragraphClass}>
          To the fullest extent permitted by applicable law, the service and
          content are provided &quot;as is&quot; and &quot;as available&quot;
          without promises that they are accurate, complete, current, fit for a
          particular purpose, or non-infringing. Nothing in these Terms excludes
          a warranty or consumer right that applicable law says cannot be
          excluded.
        </p>
      </section>

      <section className={sectionClass}>
        <h2 className={headingClass}>11. Limitation of Liability</h2>
        <p className={paragraphClass}>
          To the fullest extent permitted by applicable law, L.A.P and its
          contributors will not be liable for indirect, incidental, special,
          consequential, or punitive loss, or for lost profits, revenue, data,
          goodwill, or business opportunity, arising from your use of or
          inability to use the service. This limitation does not exclude or
          limit liability that cannot lawfully be excluded, including liability
          for fraud or fraudulent misrepresentation, wilful misconduct, or death
          or personal injury caused by negligence where applicable law prohibits
          that exclusion. Your mandatory consumer rights remain unaffected.
        </p>
      </section>

      <section className={sectionClass}>
        <h2 className={headingClass}>12. Suspension, Termination, and Deletion</h2>
        <p className={paragraphClass}>
          You may stop using the service at any time and may delete an eligible
          reader account using the available account controls. We may suspend or
          terminate access for a material or repeated breach, a serious security
          risk, unlawful conduct, or when required by law. When appropriate, we
          will consider the seriousness, context, and history of the conduct and
          may provide notice or an opportunity to appeal. Urgent action may be
          taken without advance notice to prevent harm.
        </p>
        <p className={paragraphClass}>
          Sections that by their nature should survive termination—including
          content licences for material lawfully retained, intellectual property,
          disclaimers, liability limits, and dispute provisions—will survive.
          Account deletion and retained content are described in the Privacy
          Policy.
        </p>
      </section>

      <section className={sectionClass}>
        <h2 className={headingClass}>13. Changes to These Terms</h2>
        <p className={paragraphClass}>
          We may update these Terms for legal, security, technical, operational,
          or service changes. The page will show the new date and version. If a
          change materially reduces account-holder rights or creates a
          significant new obligation, we will provide reasonable additional
          notice where practical and request renewed acceptance where required.
          Changes apply prospectively from their stated effective date. If you
          do not agree with updated Terms, stop using community features and
          delete your account where available.
        </p>
      </section>

      <section className={sectionClass}>
        <h2 className={headingClass}>
          14. Mandatory Law, Disputes, and General Terms
        </h2>
        <p className={paragraphClass}>
          Nothing in these Terms takes away rights you have under mandatory law.
          If a dispute arises, contact us first so we can try to resolve it
          informally. You may also use any court, regulator, or dispute process
          available to you under applicable law. If a provision is found
          unenforceable, it will be limited or removed only to the extent needed
          and the remaining provisions will continue. A delay in enforcing a
          provision is not a waiver of it.
        </p>
      </section>

      <section className={sectionClass}>
        <h2 className={headingClass}>15. Contact</h2>
        <p className={paragraphClass}>
          Questions, permissions, notices, and appeals can be sent to{" "}
          <a
            href="mailto:contact@lap.onl?subject=Terms%20of%20Service"
            className="text-[#8a2ae3] hover:underline"
          >
            contact@lap.onl
          </a>
          .
        </p>
      </section>
    </main>
  );
}
