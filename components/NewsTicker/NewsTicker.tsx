import { useEffect, useRef, useState } from "react";

// Static mission statements
const news = [
  "Welcome to LAP Docs, our mission is to provide you with the best possible tutorials that is easy to understand and follow. I hope you enjoy your stay with us and our tutorials actually help you learn something new.",
  "Our Motto: Simplicity in Tech",
  "Our Goal: Simplifying tech for everyone",
];

export default function NewsTicker() {
  return (
    <div className="flex bg-[#8a2be2] text-white py-5 max-w-[95rem] w-full mx-auto relative overflow-hidden">
      <div className="bg-[#8a2be2] z-10 px-6 absolute left-0 top-0 h-full flex items-center">
        <span className="flex gap-2 bg-[#8a2be2] font-semibold uppercase whitespace-nowrap">
          <p>MISSION:</p>
        </span>
      </div>
      {/* News ticker container */}
      <div className="relative flex overflow-hidden w-full pl-32 sm:pl-40">
        <div className="flex gap-4 whitespace-nowrap animate-ticker w-fit">
          {/* First set - visible to screen readers */}
          {news.map((newsItem, index) => (
            <div
              key={`original-${index}`}
              className="text-white text-lg font-normal"
            >
              <p>{newsItem} +++</p>
            </div>
          ))}
          {/* Duplicate set for seamless looping */}
          {news.map((newsItem, index) => (
            <div
              key={`duplicate-${index}`}
              className="text-white text-lg font-normal"
              aria-hidden="true"
            >
              <p>{newsItem} +++</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
