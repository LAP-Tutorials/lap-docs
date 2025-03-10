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
    async function processContent() {
      // Convert markdown to HTML with Marked and await the result
      const rawHtml = await marked.parse(content);

      // Remove #hashtags specifically from heading text using a regex on <hN> blocks
      const htmlNoHashtagsInHeadings = rawHtml.replace(
        /(<h[1-6][^>]*>)([^<]+)(<\/h[1-6]>)/g,
        (match, openTag, headingText, closeTag) => {
          // Remove all occurrences of #something
          const textWithoutHashtags = headingText.replace(/#[^\s]+/g, "");
          return `${openTag}${textWithoutHashtags}${closeTag}`;
        }
      );

      // Sanitize final HTML
      const cleanContent = DOMPurify.sanitize(htmlNoHashtagsInHeadings, {
        ADD_TAGS: ["iframe"],
        ADD_ATTR: [
          "allow",
          "allowfullscreen",
          "frameborder",
          "height",
          "scrolling",
          "src",
          "width",
        ],
      });

      setSanitizedContent(cleanContent);
    }
    processContent();
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
