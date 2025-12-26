"use client";

import { useEffect, useRef, useState } from "react";
import { marked } from "marked";
import DOMPurify from "dompurify";

interface ArticleContentProps {
  content: string;
}

const ArticleContent: React.FC<ArticleContentProps> = ({ content }) => {
  const [sanitizedContent, setSanitizedContent] = useState<string>("");
  const containerRef = useRef<HTMLDivElement | null>(null);

  async function copyTextToClipboard(text: string) {
    if (typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
      return;
    }

    const textarea = document.createElement("textarea");
    textarea.value = text;
    textarea.setAttribute("readonly", "");
    textarea.style.position = "fixed";
    textarea.style.top = "-9999px";
    textarea.style.left = "-9999px";
    document.body.appendChild(textarea);
    textarea.select();
    const ok = document.execCommand("copy");
    document.body.removeChild(textarea);

    if (!ok) {
      throw new Error("Copy failed");
    }
  }

  useEffect(() => {
    async function sanitizeContent() {
      // Convert markdown to HTML
      const rawContent = await marked.parse(content);

      // Configure DOMPurify to allow iframes
      const cleanContent = DOMPurify.sanitize(rawContent, {
        ADD_TAGS: ["iframe"],
        ADD_ATTR: ["allow", "allowfullscreen", "frameborder", "height", "scrolling", "src", "width"],
      });

      setSanitizedContent(cleanContent);
    }
    sanitizeContent();
  }, [content]);

  useEffect(() => {
    const root = containerRef.current;
    if (!root) return;

    const preBlocks = Array.from(root.querySelectorAll("pre"));

    const copySvg =
      '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>';
    const checkSvg =
      '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20 6 9 17l-5-5"></path></svg>';

    for (const pre of preBlocks) {
      const existingWrapper = pre.closest('div[data-copy-wrapper="true"]');
      if (existingWrapper) continue;

      const codeText = pre.querySelector("code")?.textContent ?? pre.textContent ?? "";
      if (!codeText.trim()) continue;

      const wrapper = document.createElement("div");
      wrapper.dataset.copyWrapper = "true";
      wrapper.className = "relative";

      const parent = pre.parentNode;
      if (!parent) continue;

      parent.insertBefore(wrapper, pre);
      wrapper.appendChild(pre);

      pre.style.paddingTop = "52px";
      pre.style.paddingRight = "52px";

      const button = document.createElement("button");
      button.type = "button";
      button.className =
        "absolute top-3 right-3 h-8 w-8 flex items-center justify-center bg-[#121212] text-foreground transition-all duration-200 ease-out transform hover:scale-105 active:scale-95 hover:bg-[#8a2be2] hover:border-[#8a2be2] hover:text-white";
      button.innerHTML = copySvg;
      button.setAttribute("aria-label", "Copy code to clipboard");
      button.setAttribute("title", "Copy");

      let resetTimer: number | undefined;

      const handleClick = async () => {
        const textToCopy = pre.querySelector("code")?.textContent ?? pre.textContent ?? "";
        if (!textToCopy.trim()) return;

        try {
          await copyTextToClipboard(textToCopy);
          button.innerHTML = checkSvg;
          button.setAttribute("title", "Copied");
        } catch {
          button.setAttribute("title", "Copy failed");
        }

        if (resetTimer) window.clearTimeout(resetTimer);
        resetTimer = window.setTimeout(() => {
          button.innerHTML = copySvg;
          button.setAttribute("title", "Copy");
        }, 1500);
      };

      button.addEventListener("click", handleClick);
      wrapper.appendChild(button);
    }
  }, [sanitizedContent]);

  return (
    <article className="flex flex-col md:flex-row gap-6 md:gap-16 max-w-full lg:max-w-[70%] w-full mx-auto mt-6 md:mt-24 mb-10 px-4">
      <div className="markdown-body w-full" ref={containerRef}>
        <div dangerouslySetInnerHTML={{ __html: sanitizedContent }} />
      </div>
    </article>
  );
};

export default ArticleContent;
