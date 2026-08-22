"use client";

import Link from "next/link";
import Image from "next/image";
import menuLinks from "@/data/menu";
import SocialSharing from "./SocialSharing";
import Search, { SearchItem } from "./Search";
import { Sheet, SheetContent, SheetTrigger } from "./ui/sheet";
import {
  RiInstagramLine,
  RiYoutubeFill,
  RiGithubFill,
  RiTiktokFill,
  RiPatreonFill,
  RiUser3Line,
} from "react-icons/ri";

import { useState, useEffect } from "react";
import { collection, getDocs, query, where } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { SITE_NAME } from "@/lib/seo";
import { usePublicAuth } from "@/lib/public-auth-context";

export default function Header() {
  const [allArticles, setAllArticles] = useState<SearchItem[]>([]);
  const { user, profile } = usePublicAuth();
  const accountPhotoURL = profile?.photoURL || user?.photoURL || "";
  const accountLabel = user ? "Open your profile" : "Sign in or create an account";

  // Fetch minimal article data on mount
  useEffect(() => {
    (async () => {
      try {
        const q = query(
          collection(db, "articles"),
          where("publish", "==", true),
        );
        const snap = await getDocs(q);
        const items = [...snap.docs]
          .sort(
            (a, b) =>
              (b.get("date")?.toMillis?.() || 0) -
              (a.get("date")?.toMillis?.() || 0),
          )
          .map((d) => {
            const data = d.data() as any;
            return {
              id: d.id,
              title: data.title || "",
              slug: data.slug || "",
              img: data.img || "",
              imgAlt: data.imgAlt || data.title || "",
            } as SearchItem;
          });
        setAllArticles(items);
      } catch (error) {
        console.error("Error fetching articles for search:", error);
      }
    })();
  }, []);

  return (
    <header className="relative z-40 mx-auto flex w-full max-w-[95rem] flex-col justify-between px-4 pt-4 sm:pb-2 md:pb-4 md:pt-8 lg:pb-4">
      <div className="flex">
        {/* Logo */}
        <div className="flex flex-1">
          <Link
            href="/"
            aria-label={`${SITE_NAME} home`}
            className="flex items-center gap-3 w-fit"
          >
            <Image
              className="w-10 md:w-12 h-auto"
              src="/logos/LAP-Logo-Transparent.png"
              alt={`${SITE_NAME} logo`}
              width={600}
              height={600}
              priority
            />
            <span className="sr-only">{SITE_NAME}</span>
          </Link>
        </div>

        {/* Mobile menu */}
        <Sheet>
          <SheetTrigger
            aria-labelledby="button-label"
            className="relative z-10 md:hidden"
          >
            <span id="button-label" hidden>
              Menu
            </span>
            <svg
              aria-hidden="true"
              width="25"
              height="16"
              viewBox="0 0 25 16"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <rect width="25" height="4" fill="white" />
              <rect y="6" width="25" height="4" fill="white" />
              <rect y="12" width="25" height="4" fill="white" />
            </svg>
          </SheetTrigger>
          <SheetContent
            side="top"
            className="w-full pt-14"
            aria-label="Menu Toggle"
          >
            <nav
              className="flex flex-col flex-1 justify-end gap-6"
              aria-labelledby="mobile-nav"
            >
              {/* Mobile Search */}
              <Search articles={allArticles} className="w-full" />

              {menuLinks.map((m, i) => (
                <Link key={i} href={m.href}>
                  {m.label}
                </Link>
              ))}
              <Link
                href="/account"
                aria-label={accountLabel}
                className="inline-flex items-center justify-center text-2xl text-white transition-colors duration-300 hover:text-[#8a2ae3]"
              >
                {accountPhotoURL ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={accountPhotoURL}
                    alt="Your profile picture"
                    className="h-5 w-5 rounded-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <RiUser3Line aria-hidden="true" />
                )}
              </Link>
              <svg
                width="15"
                height="1"
                viewBox="0 0 15 1"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <rect width="15" height="1" fill="white" />
              </svg>
              <SocialSharing
                links={[
                  {
                    href: "https://www.youtube.com/@lap-tutorials",
                    ariaLabel: "Visit our YouTube channel",
                    Icon: RiYoutubeFill,
                  },
                  {
                    href: "https://github.com/LAP-Tutorials",
                    ariaLabel: "Visit our GitHub page",
                    Icon: RiGithubFill,
                  },
                  {
                    href: "https://www.instagram.com/lap.mgmt.team/",
                    ariaLabel: "Visit our Instagram page",
                    Icon: RiInstagramLine,
                  },
                  {
                    href: "https://www.tiktok.com/@lap_mgmt",
                    ariaLabel: "Visit our TikTok page",
                    Icon: RiTiktokFill,
                  },
                  {
                    href: "https://patreon.com/lap_mgmt",
                    ariaLabel: "Visit our Patreon page",
                    Icon: RiPatreonFill,
                  },
                ]}
              />
            </nav>
          </SheetContent>
        </Sheet>

        {/* Desktop nav */}
        <nav
          className="relative z-10 hidden flex-1 items-center justify-end gap-6 md:flex"
          aria-labelledby="desktop-nav"
        >
          {/* Search box */}
          <Search articles={allArticles} className="ml-6 w-64" />

          {menuLinks.map((m, i) => (
            <Link
              key={i}
              href={m.href}
              className="hover:text-[#8a2ae3] transition ease-in-out duration-300"
            >
              {m.label}
            </Link>
          ))}
          <Link
            href="/account"
            aria-label={accountLabel}
            className="inline-flex items-center justify-center text-2xl text-white transition-colors duration-300 hover:text-[#8a2ae3]"
          >
            {accountPhotoURL ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={accountPhotoURL}
                alt="Your profile picture"
                className="h-6 w-6 rounded-full object-cover"
                referrerPolicy="no-referrer"
              />
            ) : (
              <RiUser3Line aria-hidden="true" />
            )}
          </Link>
          <svg
            width="15"
            height="1"
            viewBox="0 0 15 1"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <rect width="15" height="1" fill="white" />
          </svg>

          <SocialSharing
            links={[
              {
                href: "https://www.youtube.com/@lap-tutorials",
                ariaLabel: "Visit our YouTube channel",
                Icon: RiYoutubeFill,
              },
              {
                href: "https://github.com/LAP-Tutorials",
                ariaLabel: "Visit our GitHub page",
                Icon: RiGithubFill,
              },
              {
                href: "https://www.instagram.com/lap.mgmt.team/",
                ariaLabel: "Visit our Instagram page",
                Icon: RiInstagramLine,
              },
              {
                href: "https://www.tiktok.com/@lap_mgmt",
                ariaLabel: "Visit our TikTok page",
                Icon: RiTiktokFill,
              },
              {
                href: "https://patreon.com/lap_mgmt",
                ariaLabel: "Visit our Patreon page",
                Icon: RiPatreonFill,
              },
            ]}
          />
        </nav>
      </div>

      <hr className="border-white border-t-0 border mt-4" />
    </header>
  );
}
