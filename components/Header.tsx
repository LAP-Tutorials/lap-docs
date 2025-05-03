"use client";

import Link from "next/link";
import menuLinks from "@/data/menu";
import SocialSharing from "./SocialSharing";
import { Sheet, SheetContent, SheetTrigger } from "./ui/sheet";
import {
  RiInstagramLine,
  RiTwitterFill,
  RiYoutubeFill,
  RiGithubFill,
  RiTiktokFill,
  RiPatreonFill,
} from "react-icons/ri";

import { useState, useEffect, useRef } from "react";
import { collection, getDocs, query, orderBy } from "firebase/firestore";
import { db } from "@/lib/firebase";

interface SearchItem {
  id: string;
  title: string;
  slug: string;
  img: string;
  imgAlt: string;
}

export default function Header() {
  const [allArticles, setAllArticles] = useState<SearchItem[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [suggestions, setSuggestions] = useState<SearchItem[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

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

  // update suggestions when searchTerm changes
  useEffect(() => {
    if (searchTerm.length >= 2) {
      const term = searchTerm.toLowerCase();
      setSuggestions(
        allArticles.filter((a) => a.title.toLowerCase().includes(term))
      );
      setIsOpen(true);
    } else {
      setIsOpen(false);
      setSuggestions([]);
    }
  }, [searchTerm, allArticles]);

  // close dropdown when clicking outside
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    };
    document.addEventListener("click", handleClick);
    return () => document.removeEventListener("click", handleClick);
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
            <nav className="flex flex-col flex-1 justify-end gap-6"               aria-labelledby="mobile-nav">
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
        <nav className="hidden md:flex flex-1 items-center justify-end gap-6"          aria-labelledby="desktop-nav">
          {/* Search box */}
        <div ref={containerRef} className="relative ml-6 w-64">
          <input
            type="text"
            placeholder="Search…"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-3 py-2 bg-[#121212] text-white border border-white focus:outline-none"
          />

          {isOpen && suggestions.length > 0 && (
            <ul className="absolute right-0 mt-1 w-full bg-[#121212] border border-white/60 shadow-lg max-h-60 overflow-auto z-50">
              {suggestions.map((art) => (
                <li
                  key={art.id}
                  className="flex items-center gap-2 px-3 py-2 hover:bg-[#892be250] transition"
                >
                  <img
                    src={art.img}
                    alt={art.imgAlt}
                    className="w-10 h-10 object-cover"
                  />
                  <Link
                    href={`/posts/${art.slug}`}
                    onClick={() => setIsOpen(false)}
                    className="truncate text-white"
                  >
                    {art.title}
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
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
