"use client";

import Link from "next/link";
import { useState, useEffect, useRef } from "react";

export interface SearchItem {
  id: string;
  title: string;
  slug: string;
  img: string;
  imgAlt: string;
}

interface SearchProps {
  articles: SearchItem[];
  className?: string;
  onSearchSelect?: () => void;
}

export default function Search({
  articles,
  className = "",
  onSearchSelect,
}: SearchProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [suggestions, setSuggestions] = useState<SearchItem[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // update suggestions when searchTerm changes
  useEffect(() => {
    if (searchTerm.length >= 2) {
      const term = searchTerm.toLowerCase();
      setSuggestions(
        articles.filter((a) => a.title.toLowerCase().includes(term))
      );
      setIsOpen(true);
    } else {
      setIsOpen(false);
      setSuggestions([]);
    }
  }, [searchTerm, articles]);

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
    <div ref={containerRef} className={`relative ${className}`}>
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
                className="w-14 h-10 object-cover"
              />
              <Link
                href={`/posts/${art.slug}`}
                onClick={() => {
                  setIsOpen(false);
                  if (onSearchSelect) onSearchSelect();
                }}
                className="truncate text-white"
              >
                {art.title}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
