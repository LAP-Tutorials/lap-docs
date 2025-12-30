"use client";

import Link from "next/link";
import menuLinks from "@/data/menu";
import SocialSharing from "./SocialSharing";
import Search, { SearchItem } from "./Search";
import { Sheet, SheetContent, SheetTrigger } from "./ui/sheet";
import {
  RiInstagramLine,
  RiTwitterFill,
  RiYoutubeFill,
  RiGithubFill,
  RiTiktokFill,
  RiPatreonFill,
} from "react-icons/ri";

import { useState, useEffect } from "react";
import { collection, getDocs, query, orderBy } from "firebase/firestore";
import { db } from "@/lib/firebase";

export default function Header() {
  const [allArticles, setAllArticles] = useState<SearchItem[]>([]);

  // Fetch minimal article data on mount
  useEffect(() => {
    (async () => {
      const q = query(collection(db, "articles"), orderBy("date", "desc"));
      const snap = await getDocs(q);
      const items = snap.docs
        // only published
        .filter((d) => (d.data() as any).publish === true)
        .map((d) => {
          const data = d.data() as any;
          return {
            id: d.id,
            title: data.title,
            slug: data.slug,
            img: data.img,
            imgAlt: data.imgAlt || data.title,
          } as SearchItem;
        });
      setAllArticles(items);
    })();
  }, []);

  return (
    <header className="flex flex-col justify-between max-w-[95rem] w-full mx-auto px-4 md:pt-8 pt-4 lg:pb-4 md:pb-4 sm:pb-2 xs:pb-2">
      <div className="flex">
        {/* Logo */}
        <div className="flex flex-1">
          <Link href="/" aria-label="Return to homepage">
            <img
              className="w-[8%]"
              src="/logos/LAP-Logo-Transparent.png"
              alt="logo"
            />
          </Link>
        </div>

        {/* Mobile menu */}
        <Sheet>
          <SheetTrigger aria-labelledby="button-label">
            <span id="button-label" hidden>
              Menu
            </span>
            <svg
              aria-hidden="true"
              className="md:hidden"
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
                    href: "https://x.com/lap_mgmt",
                    ariaLabel: "Visit our X page",
                    Icon: RiTwitterFill,
                  },
                  {
                    href: "https://www.tiktok.com/@lap_mgmt",
                    ariaLabel: "Visit our TikTok page",
                    Icon: RiTiktokFill,
                  },
                  {
                    href: "http://patreon.com/lap_mgmt",
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
          className="hidden md:flex flex-1 items-center justify-end gap-6"
          aria-labelledby="desktop-nav"
        >
          {/* Search box */}
          <Search articles={allArticles} className="ml-6 w-64" />

          {menuLinks.map((m, i) => (
            <Link
              key={i}
              href={m.href}
              className="hover:text-[#8a2be2] transition ease-in-out duration-300"
            >
              {m.label}
            </Link>
          ))}
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
                href: "https://x.com/lap_mgmt",
                ariaLabel: "Visit our X page",
                Icon: RiTwitterFill,
              },
              {
                href: "https://www.tiktok.com/@lap_mgmt",
                ariaLabel: "Visit our TikTok page",
                Icon: RiTiktokFill,
              },
              {
                href: "http://patreon.com/lap_mgmt",
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
