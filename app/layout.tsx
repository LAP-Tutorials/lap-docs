import Container from "@/components/ui/container";
import "./globals.css";
import type { Metadata } from "next";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import CookieBanner from "@/components/CookieBanner";
import JsonLd from "@/components/JsonLd";
import Script from "next/script";
import localFont from "next/font/local";
import {
  DEFAULT_OG_IMAGE_PATH,
  DEFAULT_TWITTER_IMAGE_PATH,
  SITE_DESCRIPTION,
  SITE_LOCALE,
  SITE_NAME,
  SITE_URL,
  buildOrganizationSchema,
  buildWebsiteSchema,
} from "@/lib/seo";

const generalSans = localFont({
  src: [
    {
      path: "../public/fonts/general-sans/GeneralSans-Regular.woff2",
      weight: "400",
      style: "normal",
    },
    {
      path: "../public/fonts/general-sans/GeneralSans-Medium.woff2",
      weight: "500",
      style: "normal",
    },
    {
      path: "../public/fonts/general-sans/GeneralSans-Semibold.woff2",
      weight: "600",
      style: "normal",
    },
  ],
  variable: "--font-general-sans",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  applicationName: SITE_NAME,
  title: {
    default: SITE_NAME,
    template: `%s | ${SITE_NAME}`,
  },
  description: SITE_DESCRIPTION,
  keywords: [
    SITE_NAME,
    "L.A.P Docs",
    "LAP Docs",
    "Technology",
    "Tutorials",
    "Guides",
    "Tech Simplified",
    "Programming",
    "Web Development",
  ],
  authors: [{ name: "L.A.P Team", url: `${SITE_URL}/team` }],
  creator: "L.A.P Team",
  publisher: SITE_NAME,
  manifest: "/icons/site.webmanifest",
  verification: {
    google: "fba4fc7d928e4cc6",
  },
  icons: {
    icon: [
      { url: "/favicon.ico" },
      { url: "/icons/favicon-32x32.png", sizes: "32x32", type: "image/png" },
      { url: "/icons/favicon-16x16.png", sizes: "16x16", type: "image/png" },
    ],
    apple: [{ url: "/icons/apple-touch-icon.png", sizes: "180x180" }],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  openGraph: {
    title: SITE_NAME,
    description: SITE_DESCRIPTION,
    url: SITE_URL,
    siteName: SITE_NAME,
    locale: SITE_LOCALE,
    type: "website",
    images: [
      {
        url: DEFAULT_OG_IMAGE_PATH,
        width: 1200,
        height: 630,
        alt: `${SITE_NAME} homepage preview`,
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: SITE_NAME,
    description: SITE_DESCRIPTION,
    images: [DEFAULT_TWITTER_IMAGE_PATH],
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const GA_TRACKING_ID = process.env.NEXT_PUBLIC_MEASURING_ID || "";

  return (
    <html lang="en" className={`scroll-smooth ${generalSans.variable}`}>
      <head>
        {/* Google Analytics */}
        {GA_TRACKING_ID && (
          <>
            <Script
              src={`https://www.googletagmanager.com/gtag/js?id=${GA_TRACKING_ID}`}
              strategy="afterInteractive"
            />
            <Script
              id="google-analytics"
              strategy="afterInteractive"
              dangerouslySetInnerHTML={{
                __html: `
                  window.dataLayer = window.dataLayer || [];
                  function gtag(){dataLayer.push(arguments);}
                  gtag('consent', 'default', {
                    'analytics_storage': 'denied'
                  });
                  gtag('js', new Date());
                  gtag('config', '${GA_TRACKING_ID}', {
                    page_path: window.location.pathname,
                  });
                `,
              }}
            />
          </>
        )}
      </head>
      <body suppressHydrationWarning>
        <JsonLd data={[buildWebsiteSchema(), buildOrganizationSchema()]} />
        <Container>
          <Header />
          {children}
          <Footer />
          <CookieBanner />
        </Container>
      </body>
    </html>
  );
}
