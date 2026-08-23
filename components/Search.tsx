"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";

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

  useEffect(() => {
    if (searchTerm.length >= 2) {
      const term = searchTerm.toLowerCase();
      setSuggestions(
        articles.filter((article) => article.title.toLowerCase().includes(term)),
      );
      setIsOpen(true);
      return;
    }

    setIsOpen(false);
    setSuggestions([]);
  }, [searchTerm, articles]);

  useEffect(() => {
    const handleClick = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
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
        placeholder="Search..."
        value={searchTerm}
        onChange={(event) => setSearchTerm(event.target.value)}
        className="w-full px-3 py-2 bg-[#121212] text-white border border-white focus:outline-none"
      />

      {isOpen && suggestions.length > 0 && (
        <ul className="absolute right-0 mt-1 w-full bg-[#121212] border border-white/60 shadow-lg max-h-60 overflow-auto z-50">
          {suggestions.map((article) => (
            <li
              key={article.id}
              className="hover:bg-[#8a2ae350] transition"
            >
              <Link
                href={`/posts/${article.slug}`}
                onClick={() => {
                  setIsOpen(false);
                  if (onSearchSelect) {
                    onSearchSelect();
                  }
                }}
                className="flex items-center gap-2.5 px-3 py-2 w-full text-white cursor-pointer"
              >
                <img
                  src={article.img}
                  alt={article.imgAlt}
                  className="w-14 h-10 object-cover shrink-0"
                  width={56}
                  height={40}
                  loading="lazy"
                  decoding="async"
                />
                <span className="truncate text-white">
                  {article.title}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
