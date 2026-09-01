import Container from "@/components/ui/container";
import "./globals.css";
import type { Metadata, Viewport } from "next";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import CookieBanner from "@/components/CookieBanner";
import GoogleAnalytics from "@/components/GoogleAnalytics";
import JsonLd from "@/components/JsonLd";
import Script from "next/script";
import localFont from "next/font/local";
import { PublicAuthProvider } from "@/lib/public-auth-context";
import {
  DEFAULT_OG_IMAGE_PATH,
  DEFAULT_TWITTER_IMAGE_PATH,
  SITE_DESCRIPTION,
  SITE_HOME_URL,
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
    url: SITE_HOME_URL,
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

export const viewport: Viewport = {
  themeColor: "#050505",
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
        <Script
          id="hydration-recovery"
          strategy="beforeInteractive"
          dangerouslySetInnerHTML={{
            __html: `
              (function () {
                var recoveryKey = 'lap_hydration_recovery_v1';
                window.setTimeout(async function () {
                  if (document.documentElement.dataset.lapHydrated === 'true') {
                    try { window.sessionStorage.removeItem(recoveryKey); } catch (_) {}
                    return;
                  }

                  try {
                    if (window.sessionStorage.getItem(recoveryKey)) return;
                    window.sessionStorage.setItem(recoveryKey, '1');

                    if ('serviceWorker' in navigator) {
                      var registrations = await navigator.serviceWorker.getRegistrations();
                      await Promise.all(registrations.map(function (registration) {
                        return registration.unregister();
                      }));
                    }

                    if ('caches' in window) {
                      var cacheNames = await window.caches.keys();
                      await Promise.all(cacheNames.map(function (cacheName) {
                        return window.caches.delete(cacheName);
                      }));
                    }

                    window.location.reload();
                  } catch (_) {
                    // Leave the rendered page in place if browser storage is unavailable.
                  }
                }, 8000);
              })();
            `,
          }}
        />
        {GA_TRACKING_ID && (
          <GoogleAnalytics measurementId={GA_TRACKING_ID} />
        )}
        {/* Service Worker Registration */}
        <Script
          id="register-sw"
          strategy="afterInteractive"
          dangerouslySetInnerHTML={{
            __html: `
              if ('serviceWorker' in navigator) {
                window.addEventListener('load', function() {
                  navigator.serviceWorker.register('/sw.js?v=3', { updateViaCache: 'none' }).then(function(reg) {
                    console.log('SW registered:', reg.scope);
                    reg.update().catch(function() {});
                  }).catch(function(err) {
                    console.warn('SW registration failed:', err);
                  });
                });
              }
            `
          }}
        />
      </head>
      <body suppressHydrationWarning>
        <PublicAuthProvider>
          <JsonLd data={[buildWebsiteSchema(), buildOrganizationSchema()]} />
          <Container>
            <Header />
            {children}
            <Footer />
            <CookieBanner />
          </Container>
        </PublicAuthProvider>
      </body>
    </html>
  );
}
