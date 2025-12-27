import Container from "@/components/ui/container";
import "./globals.css";
import type { Metadata } from "next";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import Script from 'next/script';

export const metadata: Metadata = {
  metadataBase: new URL("https://lap-docs.netlify.app/"),
  title: {
    default: "L.A.P Docs",
    template: "%s | L.A.P Docs",
  },
  description: "Simplicity in Tech. L.A.P aims to make tech simple as possible for everyone.",
  keywords: ["L.A.P Docs", "Technology", "Tutorials", "Guides", "Tech Simplified", "Programming", "Web Development"],
  authors: [{ name: "L.A.P Team", url: "https://lap-docs.netlify.app/team" }],
  creator: "L.A.P Team",
  publisher: "L.A.P Docs",
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  openGraph: {
    title: "L.A.P Docs",
    description: "Simplicity in Tech. L.A.P aims to make tech simple as possible for everyone.",
    url: "https://lap-docs.netlify.app/",
    siteName: "L.A.P Docs",
    locale: "en_US",
    type: "website",
    images: [
      {
        url: "https://lap-docs.netlify.app/og-image.png",
        width: 1200,
        height: 630,
        alt: "L.A.P Docs - Simplicity in Tech",
      }
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "L.A.P Docs",
    description: "Simplicity in Tech. L.A.P aims to make tech simple as possible for everyone.",
    images: ["https://lap-docs.netlify.app/twitter-image.png"],
    creator: "@lap_mgmt", // Assuming handle, can be updated if known
  },
  other: {
    "og:logo": "https://lap-docs.netlify.app/logos/LAP-Logo-Transparent.png",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const GA_TRACKING_ID = process.env.MEASURING_ID || "";

  return (
    
    <html lang="en" className="scroll-smooth">
      
      <head>
        <link
          rel="icon"
          href="/logos/LAP-Logo-Color.png"
          type="image/x-icon"
        />
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
            <Container>
              <Header />
              {children}
              <Footer />
            </Container>
      </body>
    </html>
  );
}
