"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { X } from "lucide-react";

const CONSENT_KEY = "lap_cookie_consent";
const CONSENT_EVENT = "lap-cookie-consent-changed";

type AnalyticsConsent = "granted" | "denied";

export default function CookieBanner() {
  const [showBanner, setShowBanner] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const consent = localStorage.getItem(CONSENT_KEY);
    if (!consent) {
      setShowBanner(true);
    }
    const openSettings = () => setShowBanner(true);
    window.addEventListener("lap-open-privacy-settings", openSettings);
    return () => window.removeEventListener("lap-open-privacy-settings", openSettings);
  }, []);

  const saveConsent = (consent: AnalyticsConsent) => {
    localStorage.setItem(CONSENT_KEY, consent);
    window.dispatchEvent(
      new CustomEvent<AnalyticsConsent>(CONSENT_EVENT, { detail: consent }),
    );
    setShowBanner(false);
  };

  const acceptCookies = () => {
    saveConsent("granted");
  };

  const declineCookies = () => {
    const analyticsWasLoaded =
      localStorage.getItem(CONSENT_KEY) === "granted" || Boolean(window.gtag);

    window.gtag?.("consent", "update", {
      analytics_storage: "denied",
      ad_storage: "denied",
      ad_user_data: "denied",
      ad_personalization: "denied",
    });
    saveConsent("denied");

    if (analyticsWasLoaded) {
      window.location.reload();
    }
  };

  if (!mounted || !showBanner) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 p-4 md:p-6 pb-6 md:pb-6 pointer-events-none animate-in slide-in-from-bottom-24 fade-in duration-500">
      <div className="max-w-4xl mx-auto pointer-events-auto">
        <div className="bg-[#111111] border border-[#333333] shadow-2xl rounded-lg p-5 md:p-6 flex flex-col md:flex-row items-center justify-between gap-5 md:gap-6 relative overflow-hidden">
          {/* Subtle accent border on top */}
          <div className="absolute top-0 left-0 right-0 h-1 bg-[#8a2ae3]"></div>

          <div className="flex-1 pr-6 md:pr-4">
            <h3 className="text-white font-semibold text-lg mb-2">
              Choose your analytics preference
            </h3>
            <p className="text-gray-200 text-sm leading-relaxed">
              Necessary storage keeps accounts, preferences, and security
              features working. Optional Google Analytics helps us understand
              site traffic and loads only if you accept it. You can change this
              choice later. Read our{" "}
              <Link
                href="/privacy-policy"
                className="text-[#8a2ae3] hover:underline"
              >
                Privacy Policy
              </Link>
              .
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto shrink-0">
            <button
              onClick={declineCookies}
              className="px-5 py-2.5 rounded-md text-sm font-medium text-gray-300 hover:text-white hover:bg-[#222222] transition-colors border border-transparent hover:border-[#444444]"
            >
              Decline analytics
            </button>
            <button
              onClick={acceptCookies}
              className="px-5 py-2.5 rounded-md text-sm font-medium text-white bg-[#8a2ae3] hover:bg-[#8a2ae3] transition-colors shadow-[0_0_15px_rgba(138,42,227,0.5)]"
            >
              Accept analytics
            </button>
          </div>

          <button
            onClick={declineCookies}
            className="absolute top-3 right-3 text-gray-500 hover:text-gray-300 transition-colors"
            aria-label="Decline analytics and close"
          >
            <X size={20} />
          </button>
        </div>
      </div>
    </div>
  );
}
