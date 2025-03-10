"use client";

import { useEffect, useState } from "react";
import { marked } from "marked";
import DOMPurify from "dompurify";

interface ArticleContentProps {
  content: string;
}

const ArticleContent: React.FC<ArticleContentProps> = ({ content }) => {
  const [sanitizedContent, setSanitizedContent] = useState<string>("");

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

  return (
    <article className="flex flex-col md:flex-row gap-6 md:gap-16 max-w-full lg:max-w-[70%] w-full mx-auto mt-6 md:mt-24 mb-10 px-4">
      <div className="markdown-body w-full">
        <div dangerouslySetInnerHTML={{ __html: sanitizedContent }} />
      </div>
    </article>
  );
};

export default ArticleContent;
