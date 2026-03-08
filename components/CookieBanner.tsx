"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { X } from "lucide-react";

export default function CookieBanner() {
  const [showBanner, setShowBanner] = useState(false);

  useEffect(() => {
    // Check if the user has already consented
    const consent = localStorage.getItem("lap_cookie_consent");
    if (!consent) {
      setShowBanner(true);
    } else if (consent === "granted") {
      // If they already granted consent, ensure gtag knows on subsequent page loads
      // This is necessary because gtag default is 'denied' in layout.tsx
      if (typeof window !== "undefined" && window.gtag) {
        window.gtag("consent", "update", {
          analytics_storage: "granted",
        });
      }
    }
  }, []);

  const acceptCookies = () => {
    localStorage.setItem("lap_cookie_consent", "granted");
    setShowBanner(false);

    if (typeof window !== "undefined" && window.gtag) {
      window.gtag("consent", "update", {
        analytics_storage: "granted",
      });
    }
  };

  const declineCookies = () => {
    localStorage.setItem("lap_cookie_consent", "denied");
    setShowBanner(false);
  };

  if (!showBanner) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 p-4 md:p-6 pb-6 md:pb-6 pointer-events-none animate-in slide-in-from-bottom-24 fade-in duration-500">
      <div className="max-w-4xl mx-auto pointer-events-auto">
        <div className="bg-[#111111] border border-[#333333] shadow-2xl rounded-lg p-5 md:p-6 flex flex-col md:flex-row items-center justify-between gap-5 md:gap-6 relative overflow-hidden">
          {/* Subtle accent border on top */}
          <div className="absolute top-0 left-0 right-0 h-1 bg-[#8a2be2]"></div>

          <div className="flex-1 pr-6 md:pr-4">
            <h3 className="text-white font-semibold text-lg mb-2">
              We value your privacy
            </h3>
            <p className="text-gray-200 text-sm leading-relaxed">
              We use cookies to analyze our traffic. By clicking &quot;Accept
              All&quot;, you consent to our use of cookies. Read more in our{" "}
              <Link
                href="/privacy-policy"
                className="text-[#8a2be2] hover:underline"
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
              Decline
            </button>
            <button
              onClick={acceptCookies}
              className="px-5 py-2.5 rounded-md text-sm font-medium text-white bg-[#8a2be2] hover:bg-[#7a1fd1] transition-colors shadow-[0_0_15px_rgba(138,43,226,0.5)]"
            >
              Accept All
            </button>
          </div>

          <button
            onClick={declineCookies}
            className="absolute top-3 right-3 text-gray-500 hover:text-gray-300 transition-colors"
            aria-label="Close banner"
          >
            <X size={20} />
          </button>
        </div>
      </div>
    </div>
  );
}

// Add TypeScript declaration for window.gtag
declare global {
  interface Window {
    gtag?: (...args: any[]) => void;
  }
}
