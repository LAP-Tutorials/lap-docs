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
  title: "Community Guidelines",
  description: `Community Guidelines and code of conduct for ${SITE_NAME}`,
  alternates: {
    canonical: absoluteUrl("/community-guidelines"),
  },
  openGraph: {
    title: `Community Guidelines | ${SITE_NAME}`,
    description: `Community Guidelines and code of conduct for ${SITE_NAME}`,
    url: absoluteUrl("/community-guidelines"),
    siteName: SITE_NAME,
    locale: SITE_LOCALE,
    type: "website",
    images: [
      {
        url: DEFAULT_OG_IMAGE_PATH,
        width: 1200,
        height: 630,
        alt: `${SITE_NAME} community guidelines preview`,
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: `Community Guidelines | ${SITE_NAME}`,
    description: `Community Guidelines and code of conduct for ${SITE_NAME}`,
    images: [DEFAULT_TWITTER_IMAGE_PATH],
  },
};

export default function CommunityGuidelines() {
  const jsonLd = [
    {
      "@context": "https://schema.org",
      "@type": "WebPage",
      name: "Community Guidelines",
      url: absoluteUrl("/community-guidelines"),
      description: `Community Guidelines and code of conduct for ${SITE_NAME}`,
    },
    buildBreadcrumbSchema([
      { name: "Home", path: "/" },
      { name: "Community Guidelines", path: "/community-guidelines" },
    ]),
  ];

  return (
    <main className="flex flex-col min-h-screen max-w-4xl mx-auto px-6 py-12 w-full text-white">
      <JsonLd data={jsonLd} />
      <h1 className="text-4xl font-bold mb-3 tracking-tight">Community Guidelines</h1>
      <p className="mb-8 text-sm text-gray-400 font-mono">
        Last updated:{" "}
        {new Date().toLocaleDateString("en-US", {
          month: "long",
          day: "numeric",
          year: "numeric",
        })}
      </p>

      <div className="border border-[#8a2ae3]/40 bg-[#8a2ae3]/10 p-5 mb-10 text-sm leading-relaxed text-gray-200">
        <p className="font-semibold text-white mb-1">Our Core Commitment</p>
        <p>
          At <strong>{SITE_NAME}</strong>, we are building a collaborative, respectful, and insightful
          space for developers, creators, and technology enthusiasts. These guidelines outline the
          standards of behavior expected from everyone participating in our discussions, comments, and
          community spaces.
        </p>
      </div>

      <section className="mb-8">
        <h2 className="text-2xl font-semibold mb-4 text-[#8a2ae3]">
          1. Principles We Encourage
        </h2>
        <ul className="list-disc pl-6 space-y-2 text-gray-300 leading-relaxed">
          <li>
            <strong>Be Respectful and Welcoming:</strong> Treat fellow readers and authors with empathy and courtesy. Disagree with ideas, not individuals.
          </li>
          <li>
            <strong>Share Knowledge & Helpful Insights:</strong> Add value to the discussion by sharing code solutions, personal insights, relevant questions, or constructive feedback.
          </li>
          <li>
            <strong>Keep it Relevant:</strong> Ensure your comments and replies relate to the article or topic being discussed.
          </li>
          <li>
            <strong>Support Beginners:</strong> We all started somewhere. Encourage new developers and answer questions with patience and constructive guidance.
          </li>
        </ul>
      </section>

      <section className="mb-8">
        <h2 className="text-2xl font-semibold mb-4 text-[#8a2ae3]">
          2. Prohibited Behavior & Zero-Tolerance Violations
        </h2>
        <p className="mb-4 text-gray-300 leading-relaxed">
          To maintain a safe environment, the following actions are strictly prohibited and will result
          in immediate moderation action:
        </p>
        <div className="space-y-4 text-gray-300">
          <div className="border-l-2 border-red-500/70 pl-4">
            <h3 className="text-lg font-semibold text-white">A. Harassment, Bullying & Abuse</h3>
            <p className="text-sm mt-1 leading-relaxed">
              Targeted insults, personal attacks, trolling, doxxing (sharing private personal information),
              or persistent unwanted contact toward any community member or author.
            </p>
          </div>

          <div className="border-l-2 border-red-500/70 pl-4">
            <h3 className="text-lg font-semibold text-white">B. Hate Speech & Discrimination</h3>
            <p className="text-sm mt-1 leading-relaxed">
              Any content that attacks, dehumanizes, incites hatred, or promotes discrimination based on
              race, ethnicity, nationality, religion, sexual orientation, gender identity, disability, or age.
            </p>
          </div>

          <div className="border-l-2 border-red-500/70 pl-4">
            <h3 className="text-lg font-semibold text-white">C. Spam, Advertising & Scams</h3>
            <p className="text-sm mt-1 leading-relaxed">
              Automated posting, repetitive comments, unsolicited promotions, affiliate links, cryptocurrency
              schemes, referral farming, or deceptive hyperlinks.
            </p>
          </div>

          <div className="border-l-2 border-red-500/70 pl-4">
            <h3 className="text-lg font-semibold text-white">D. Inappropriate & Explicit Content</h3>
            <p className="text-sm mt-1 leading-relaxed">
              Sexually explicit material, NSFW images, gratuitous violence, gore, or links to harmful websites.
            </p>
          </div>

          <div className="border-l-2 border-red-500/70 pl-4">
            <h3 className="text-lg font-semibold text-white">E. Impersonation & False Identity</h3>
            <p className="text-sm mt-1 leading-relaxed">
              Claiming handles or identities intended to impersonate {SITE_NAME} staff, authors, prominent
              figures, or other community members.
            </p>
          </div>

          <div className="border-l-2 border-red-500/70 pl-4">
            <h3 className="text-lg font-semibold text-white">F. Malicious Code & Vulnerability Exploits</h3>
            <p className="text-sm mt-1 leading-relaxed">
              Posting links to malware, viruses, phishing pages, or exploits designed to harm reader systems or compromise security.
            </p>
          </div>
        </div>
      </section>

      <section className="mb-8">
        <h2 className="text-2xl font-semibold mb-4 text-[#8a2ae3]">
          3. How Reporting Works
        </h2>
        <p className="mb-4 text-gray-300 leading-relaxed">
          If you encounter a comment or user profile that violates these guidelines, you can report it
          directly through the interface:
        </p>
        <ul className="list-disc pl-6 space-y-2 text-gray-300 leading-relaxed mb-4">
          <li>
            <strong>Reporting a Comment:</strong> Click the flag / report icon on the comment or reply, select the violation reason, and optionally provide details.
          </li>
          <li>
            <strong>Reporting a User:</strong> Click on the user&apos;s handle to open their profile modal and click &ldquo;Report User&rdquo;.
          </li>
        </ul>
        <p className="text-sm text-gray-400 leading-relaxed">
          Reports are private and anonymous to other readers. When filed, our Super Admins, Admins, and
          Moderation team receive immediate notifications to review the content and take appropriate action.
        </p>
      </section>

      <section className="mb-8">
        <h2 className="text-2xl font-semibold mb-4 text-[#8a2ae3]">
          4. Moderation & Enforcement Hierarchy
        </h2>
        <p className="mb-4 text-gray-300 leading-relaxed">
          We take a progressive and proportional approach to enforcement depending on the severity and history of violations:
        </p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 my-4">
          <div className="border border-white/15 bg-white/[0.03] p-4">
            <p className="font-semibold text-amber-300 text-sm">1. Warning & Content Hide</p>
            <p className="text-xs text-gray-400 mt-2">
              For minor or first-time infractions, comments may be hidden and a formal warning issued.
            </p>
          </div>
          <div className="border border-white/15 bg-white/[0.03] p-4">
            <p className="font-semibold text-orange-400 text-sm">2. Content Removal & Suspension</p>
            <p className="text-xs text-gray-400 mt-2">
              Repeated violations or severe offenses result in permanent comment deletion and temporary commenting suspension.
            </p>
          </div>
          <div className="border border-white/15 bg-white/[0.03] p-4">
            <p className="font-semibold text-red-400 text-sm">3. Permanent Account Ban</p>
            <p className="text-xs text-gray-400 mt-2">
              Extreme violations (hate speech, harassment, spam networks) lead to permanent revocation of reader accounts and handle bans.
            </p>
          </div>
        </div>
      </section>

      <section className="mb-8">
        <h2 className="text-2xl font-semibold mb-4 text-[#8a2ae3]">
          5. Questions & Contact
        </h2>
        <p className="text-gray-300 leading-relaxed">
          If you have questions about these guidelines, or wish to inquire about a moderation decision,
          please contact us at{" "}
          <Link
            href="mailto:contact@lap.onl?subject=Community%20Guidelines%20Inquiry"
            className="text-[#8a2ae3] hover:underline"
          >
            contact@lap.onl
          </Link>
          .
        </p>
      </section>
    </main>
  );
}
