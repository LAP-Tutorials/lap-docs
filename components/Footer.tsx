"use client";

import NewsletterTicker from "./NewsletterTicker";
import { Input } from "@/components/ui/input";
import { Button } from "./ui/button";
import Link from "next/link";
import FooterSocialLinks from "./FooterSocialsLinks";
import NewsletterSignUp from "./NewsletterSignUp";
import Image from "next/image";

export default function Footer() {
  return (
    <footer className="bg-[#8a2be2] overflow-hidden">
      <div className="max-w-[95rem] mx-auto px-6 mt-11">
        <div className="flex flex-col md:flex-row flex-wrap lg:justify-between gap-6 max-w-[95rem] w-full">
          <Image
            src="/logos/lap-logo-white.png"
            alt=""
            width={100}
            height={50}
          />

          <div className="flex lg:flex-row max-w-[63.125rem] w-full">
            <nav className="flex flex-1" aria-label="left-footer-links">
              <ul className="text-white space-y-3">
                <li>
                  <Link href="/posts">Posts</Link>
                </li>
                <li>
                  <Link href="/authors">Team</Link>
                </li>
              </ul>
            </nav>
            <nav className="flex flex-1" aria-label="middle-footer-links">
              <ul className="text-white space-y-3">
                <li>
                  <Link
                    href="https://www.youtube.com/@lap-tutorials"
                    target="_blank"
                  >
                    Youtube
                  </Link>
                </li>
                <li>
                  <Link href="https://github.com/LAP-Tutorials" target="_blank">
                    GitHub
                  </Link>
                </li>
                <li>
                  <Link href="http://patreon.com/lap_mgmt" target="_blank">
                    Patreon
                  </Link>
                </li>
              </ul>
            </nav>
            <nav className="flex flex-1" aria-label="right-footer-links">
              <ul className="text-white space-y-3">
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
                <li>
                  <Link href="https://x.com/lap_mgmt" target="_blank">
                    Twitter / X
                  </Link>
                </li>
              </ul>
            </nav>
          </div>
        </div>
        <div className="flex flex-wrap flex-col md:flex-row justify-between gap-6 py-3 lg:pt-[6rem] lg:pb-[4.0625rem] w-full">
          <p className="font-regular text-white">
            © {new Date().getFullYear()} L.A.P. All rights reserved.
          </p>
          <FooterSocialLinks />
        </div>
      </div>
    </footer>
  );
}
