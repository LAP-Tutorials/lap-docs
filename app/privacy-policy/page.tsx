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
  alternates: { canonical: absoluteUrl("/privacy-policy") },
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

const sectionClass = "mb-8";
const headingClass = "text-2xl font-semibold mb-4 text-[#8a2ae3]";
const paragraphClass = "mb-4 text-gray-300 leading-relaxed";
const listClass = "list-disc pl-6 mb-4 text-gray-300 space-y-2";

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
        Last updated: September 1, 2026 (version 2026-09-01)
      </p>

      <section className={sectionClass}>
        <h2 className={headingClass}>1. Who We Are and What This Covers</h2>
        <p className={paragraphClass}>
          L.A.P - Docs is operated by the L.A.P Team (&quot;L.A.P&quot;,
          &quot;we&quot;, &quot;us&quot;, or &quot;our&quot;). This policy
          explains how we handle personal data when you visit lap.onl, create a
          reader account, use community features, or contact us. The L.A.P Team
          is responsible for the processing described in this policy. You can
          contact us at contact@lap.onl.
        </p>
        <p className={paragraphClass}>
          You can read published documentation without creating an account. An
          account is required for community features such as posting and
          managing comments.
        </p>
      </section>

      <section className={sectionClass}>
        <h2 className={headingClass}>2. Information We Handle</h2>
        <ul className={listClass}>
          <li>
            <strong>Account and profile information:</strong> email address,
            display name, public handle, profile picture, authentication
            provider, account dates, and records showing acceptance of our
            Terms and Community Guidelines. Your handle, display name, profile
            picture, and content attribution may be visible publicly.
          </li>
          <li>
            <strong>Community information:</strong> comments, replies,
            reactions, reports, uploaded comment images, notification settings,
            and moderation actions or warnings.
          </li>
          <li>
            <strong>Security and device information:</strong> the public IP
            address observed by our server, user agent, platform, language,
            timezone, screen size and color depth, processor-core count,
            approximate device memory, and touch capability. We create a random
            identifier for this browser installation and store it in local
            storage. Our server stores a SHA-256 hash of that identifier and a
            keyed HMAC of normalized browser characteristics. These hashes are
            identifiers used for abuse prevention; they do not make the related
            data anonymous. Limited recent IP, device, and fingerprint history
            may be associated with an account.
          </li>
          <li>
            <strong>App integrity and request information:</strong> our
            security service may process interaction, browser, device, and
            network signals to distinguish legitimate requests from automated
            or abusive traffic. Hosting and server providers may also receive
            request details such as IP address, requested URL, user agent,
            timestamp, and error information in technical logs.
          </li>
          <li>
            <strong>Optional analytics:</strong> if you accept analytics, Google
            Analytics may process page URLs, referral information, browser and
            device details, approximate location derived from IP address,
            interactions, timestamps, and analytics identifiers. We configure
            the site not to use Google advertising signals or ad
            personalization. We do not describe this data as anonymous.
          </li>
          <li>
            <strong>Translation information:</strong> when automatic
            translation is enabled, a translation is requested, or a moderator
            translates content for review, the text and requested language are
            sent to a translation provider. The provider also receives normal
            network request information.
          </li>
          <li>
            <strong>Messages:</strong> if you contact us, we receive the contact
            details and contents you choose to provide.
          </li>
        </ul>
      </section>

      <section className={sectionClass}>
        <h2 className={headingClass}>3. Why We Use This Information</h2>
        <p className={paragraphClass}>We use information to:</p>
        <ul className={listClass}>
          <li>provide accounts, comments, reactions, translations, and notifications;</li>
          <li>publish and attribute community content;</li>
          <li>authenticate users and maintain account preferences;</li>
          <li>
            detect spam, fraud, ban evasion, account misuse, and other security
            or Community Guidelines violations;
          </li>
          <li>review reports, moderate content, handle appeals, and resolve disputes;</li>
          <li>
            understand and improve site use through analytics only when you
            have accepted analytics;
          </li>
          <li>operate, debug, and protect the site; and</li>
          <li>comply with law and establish, exercise, or defend legal claims.</li>
        </ul>
        <p className={paragraphClass}>
          Where a law requires a legal basis, we rely as appropriate on your
          consent for optional analytics; performance of our agreement or steps
          you request for account and community features; our legitimate
          interests in operating, securing, and improving the service; and
          compliance with legal obligations. If your local law uses different
          grounds, we process information only on a ground permitted there.
        </p>
      </section>

      <section className={sectionClass}>
        <h2 className={headingClass}>4. Cookies and Local Storage</h2>
        <p className={paragraphClass}>
          The site uses cookies and similar browser storage that are necessary
          for authentication, security and app-integrity checks, fraud
          prevention, language and interface preferences, service-worker
          operation, and remembering your privacy choice. The random browser
          installation identifier described above is also stored locally.
          Blocking or clearing necessary storage may sign you out, reset
          preferences, or prevent community features from working.
        </p>
        <p className={paragraphClass}>
          Google Analytics does not load unless you choose &quot;Accept
          analytics&quot;. Declining analytics does not prevent you from
          reading the site or using account features. You can reopen Privacy
          settings at the bottom of the site to change or withdraw your
          analytics choice. Withdrawal stops future Analytics loading on this
          site, but does not erase data already processed; you may contact us
          about deletion rights.
        </p>
      </section>

      <section className={sectionClass}>
        <h2 className={headingClass}>5. When Information Is Shared</h2>
        <p className={paragraphClass}>
          We do not sell or rent personal data. We share information only as
          needed for the purposes described here, including with:
        </p>
        <ul className={listClass}>
          <li>
            <strong>Google Firebase and Google Cloud:</strong> authentication,
            database, server functions, file storage, app-integrity checks, and
            related infrastructure;
          </li>
          <li>
            <strong>Google Analytics:</strong> optional traffic measurement
            after you accept analytics;
          </li>
          <li>
            <strong>Hosting and delivery providers:</strong> serving the site,
            security, logs, and performance;
          </li>
          <li>
            <strong>Google Translate or MyMemory:</strong> comment text and
            language information when translation is used; and
          </li>
          <li>
            <strong>Authorities or other parties:</strong> when reasonably
            necessary to comply with law, respond to valid legal process,
            protect users or the public, enforce our terms, or defend rights.
          </li>
        </ul>
        <p className={paragraphClass}>
          Some articles contain YouTube videos. When a page includes an embedded
          video, your browser may connect directly to YouTube or Google and send
          device and network information under their own privacy terms, even if
          you do not play the video. External links and third-party content are
          governed by the third party&apos;s policies.
        </p>
      </section>

      <section className={sectionClass}>
        <h2 className={headingClass}>6. International Processing</h2>
        <p className={paragraphClass}>
          L.A.P and its service providers may process information in countries
          other than your own. Privacy protections can differ between
          countries. Where transfer safeguards are legally required, we rely on
          safeguards made available by the relevant provider and any other
          mechanism required for the transfer. Contact us if you want more
          information about a transfer that applies to you.
        </p>
      </section>

      <section className={sectionClass}>
        <h2 className={headingClass}>7. How Long We Keep Information</h2>
        <p className={paragraphClass}>
          We keep information only for the service, security, moderation, and
          legal purposes described above. Current application retention rules
          include:
        </p>
        <ul className={listClass}>
          <li>account and profile information while the account remains active;</li>
          <li>
            comments and replies until deleted or no longer needed; after
            account deletion they may remain with the author replaced by a
            deleted-user label so conversations remain coherent;
          </li>
          <li>inactive browser-installation registry records for about 90 days;</li>
          <li>flagged IP security records for about 180 days;</li>
          <li>administrative audit records for about 365 days; and</li>
          <li>community report records for about 730 days.</li>
        </ul>
        <p className={paragraphClass}>
          A limited recent device, fingerprint, and IP history may remain with
          an active account, and ban or warning records may remain while needed
          to enforce a restriction or protect the service. Google Analytics
          event data follows the retention period configured in the Analytics
          property; that administrative setting is not contained in the site
          code. Provider logs, backups, and translation data follow the relevant
          provider&apos;s retention rules. We may retain information longer when
          required by law, a dispute, or a security investigation, and may keep
          aggregated information that no longer identifies a person.
        </p>
      </section>

      <section className={sectionClass}>
        <h2 className={headingClass}>8. Account Deletion and Your Rights</h2>
        <p className={paragraphClass}>
          You can update some account information and delete an eligible reader
          account through the site. Account deletion removes the authentication
          account, private profile information, profile uploads, notifications,
          warnings, device subrecords, and reaction records handled by the
          deletion process. Comments and replies may be retained in anonymized
          form as described above. Reports, audit entries, logs, backups, and
          security records may remain until their retention period expires or
          while legally necessary. If self-service deletion is unavailable,
          including for a restricted account, contact us.
        </p>
        <p className={paragraphClass}>
          Depending on where you live, you may have rights to access, correct,
          delete, or receive a copy of your personal data; object to or restrict
          processing; withdraw consent; and complain to your local data
          protection authority. These rights can have lawful exceptions. Email
          contact@lap.onl to make a request. We may need to verify your identity
          before acting on it.
        </p>
      </section>

      <section className={sectionClass}>
        <h2 className={headingClass}>9. Automated Security Checks and Appeals</h2>
        <p className={paragraphClass}>
          Automated checks compare account, browser-installation, fingerprint,
          and network signals to detect abuse. A browser installation associated
          with an enforced restriction may be blocked from community access.
          Fingerprint or network similarities are risk signals and can be
          reviewed by moderators; a shared IP address is not intended to be the
          sole basis for blocking everyone on that network. Contact us if you
          believe a restriction is incorrect and want human review.
        </p>
      </section>

      <section className={sectionClass}>
        <h2 className={headingClass}>10. Children</h2>
        <p className={paragraphClass}>
          L.A.P - Docs is a general-audience service and is not directed to
          children under 13. Do not create an account if you are under 13. If
          the law where you live requires a higher age or parental permission
          to use community features, you must meet that requirement. If we learn
          that we collected a child&apos;s personal data unlawfully, we will take
          reasonable steps to delete it. A parent or guardian can contact us.
        </p>
      </section>

      <section className={sectionClass}>
        <h2 className={headingClass}>11. Security</h2>
        <p className={paragraphClass}>
          We use technical and organizational measures intended to protect
          personal data, including access controls, security rules, hashing,
          app-integrity checks, moderation controls, and retention limits. No
          internet service can guarantee complete security. Please protect your
          account and tell us promptly if you suspect misuse.
        </p>
      </section>

      <section className={sectionClass}>
        <h2 className={headingClass}>12. Changes to This Policy</h2>
        <p className={paragraphClass}>
          We may update this policy when the service, providers, or legal
          requirements change. We will post the revised date and, when a change
          materially affects how we use personal data, provide additional
          notice where reasonably possible or legally required.
        </p>
      </section>

      <section className={sectionClass}>
        <h2 className={headingClass}>13. Contact</h2>
        <p className={paragraphClass}>
          For privacy questions, rights requests, or security appeals, email{" "}
          <a
            href="mailto:contact@lap.onl?subject=Privacy%20Request"
            className="text-[#8a2ae3] hover:underline"
          >
            contact@lap.onl
          </a>
          . Include enough information for us to understand the request, but do
          not send passwords or unnecessary sensitive information.
        </p>
      </section>
    </main>
  );
}
