"use client";

import { useEffect, useState } from "react";
import Script from "next/script";

const CONSENT_KEY = "lap_cookie_consent";
const CONSENT_EVENT = "lap-cookie-consent-changed";

type AnalyticsConsent = "granted" | "denied";

export default function GoogleAnalytics({
  measurementId,
}: {
  measurementId: string;
}) {
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    setEnabled(localStorage.getItem(CONSENT_KEY) === "granted");

    const handleConsentChange = (event: Event) => {
      const consent = (event as CustomEvent<AnalyticsConsent>).detail;
      setEnabled(consent === "granted");
    };

    window.addEventListener(CONSENT_EVENT, handleConsentChange);
    return () => window.removeEventListener(CONSENT_EVENT, handleConsentChange);
  }, []);

  if (!enabled) return null;

  return (
    <>
      <Script
        id="google-analytics-consented-bootstrap"
        strategy="afterInteractive"
        dangerouslySetInnerHTML={{
          __html: `
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            window.gtag = gtag;
            gtag('consent', 'default', {
              analytics_storage: 'granted',
              ad_storage: 'denied',
              ad_user_data: 'denied',
              ad_personalization: 'denied'
            });
            gtag('js', new Date());
            gtag('config', ${JSON.stringify(measurementId)}, {
              allow_google_signals: false,
              allow_ad_personalization_signals: false
            });
          `,
        }}
      />
      <Script
        src={`https://www.googletagmanager.com/gtag/js?id=${measurementId}`}
        strategy="afterInteractive"
      />
    </>
  );
}

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
  }
}
