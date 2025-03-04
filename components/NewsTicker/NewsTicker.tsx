"use client";

import gsap from "gsap";
import { useEffect, useRef, useState } from "react";
import { collection, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase";

export default function NewsTicker() {
  const tickerRef = useRef<HTMLDivElement | null>(null);
  const [news, setNews] = useState<string[]>([]);

  useEffect(() => {
    // Fetch real-time updates from Firestore
    const unsubscribe = onSnapshot(collection(db, "news"), (snapshot) => {
      const newsData = snapshot.docs.map((doc) => doc.data().title);
      setNews(newsData);
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const ticker = tickerRef.current;

    if (ticker && news.length > 0) {
      const tickerWidth = ticker.scrollWidth / 2; // Half because we are duplicating items

      gsap.to(ticker, {
        x: `-${tickerWidth}px`,
        duration: 75,
        ease: "linear",
        repeat: -1,
        onRepeat: () => {
          gsap.set(ticker, { x: 0 });
        },
      });
    }
  }, [news]);

  return (
    <div className="flex bg-[#8a2be2] text-white py-5 max-w-[95rem] w-full mx-auto relative overflow-hidden">
      <div className="bg-[#8a2be2] z-10 px-6">
        <span className="flex gap-2 bg-[#8a2be2] font-semibold uppercase whitespace-nowrap">
          <p>UPDATES:</p>
          <p className="block sm:hidden">+++</p>
        </span>
      </div>
      {/* News ticker container */}
      <div className="relative flex overflow-hidden w-full">
        <div ref={tickerRef} className="flex gap-4 whitespace-nowrap">
          {[...news, ...news].map((newsItem, index) => (
            <div key={index} className="text-white text-lg font-normal">
              <p>{newsItem} +++</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
