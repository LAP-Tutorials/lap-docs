"use client";

import Image from "next/image";
import Link from "next/link";
import { SITE_NAME } from "@/lib/seo";
import FooterSocialLinks from "./FooterSocialsLinks";

export default function Footer() {
  return (
    <footer className="overflow-hidden border-t-4 border-[#8a2be2]">
      <div className="max-w-[95rem] mx-auto px-6 mt-11">
        <div className="flex flex-col md:flex-row flex-wrap lg:justify-between gap-6 max-w-[95rem] w-full">
          <Image
            src="/logos/lap-logo-white.png"
            alt={`${SITE_NAME} logo`}
            width={120}
            height={30}
          />

          <div className="flex flex-col md:flex-row gap-8 lg:flex-row max-w-[63.125rem] w-full">
            <nav className="flex flex-1" aria-label="left-footer-links">
              <ul className="text-white space-y-3">
                <li>
                  <Link href="/posts">Posts</Link>
                </li>
                <li>
                  <Link href="/team">Team</Link>
                </li>
                <li>
                  <Link
                    href="https://www.youtube.com/@lap-tutorials"
                    target="_blank"
                  >
                    Youtube
                  </Link>
                </li>
              </ul>
            </nav>
            <nav className="flex flex-1" aria-label="middle-footer-links">
              <ul className="text-white space-y-3">
                <li>
                  <Link href="https://github.com/LAP-Tutorials" target="_blank">
                    GitHub
                  </Link>
                </li>
                <li>
                  <Link href="https://www.patreon.com/lap_mgmt" target="_blank">
                    Patreon
                  </Link>
                </li>
                <li>
                  <Link href="https://www.tiktok.com/@lap_mgmt" target="_blank">
                    Tiktok
                  </Link>
                </li>
                <li>
                  <Link
                    href="https://www.instagram.com/lap.mgmt.team/"
                    target="_blank"
                  >
                    Instagram
                  </Link>
                </li>
              </ul>
            </nav>
            <nav className="flex flex-1" aria-label="right-footer-links">
              <ul className="text-white space-y-3">
                <li>
                  <Link href="/privacy-policy">Privacy Policy</Link>
                </li>
                <li>
                  <Link href="/terms-of-service">Terms of Service</Link>
                </li>
                <li>
                  <Link href="mailto:contact@lap.onl?subject=Contact%20from%20L.A.P%20-%20Docs">
                    Contact Support
                  </Link>
                </li>
              </ul>
            </nav>
          </div>
        </div>
        <div className="flex flex-col md:flex-row items-center md:items-start lg:items-center justify-center md:justify-between gap-6 py-8 lg:pt-24 lg:pb-12 w-full border-t border-[#333333] mt-12 md:mt-0 lg:border-none">
          <div className="md:order-2">
            <FooterSocialLinks />
          </div>
          <div className="flex flex-col md:flex-row items-center md:items-start gap-4 text-gray-400 md:text-white font-regular text-sm md:order-1">
            <p>
              Copyright © {new Date().getFullYear()} L.A.P. All rights reserved.
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
