import { marked } from "marked";
import DOMPurify from "isomorphic-dompurify";

function slugifyHeading(text: string) {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-") // Replace spaces with -
    .replace(/&/g, "-and-") // Replace & with 'and'
    .replace(/[^\w\-]+/g, "") // Remove all non-word characters
    .replace(/\-\-+/g, "-") // Replace multiple - with single -
    .replace(/^-+/, "") // Trim - from start of text
    .replace(/-+$/, ""); // Trim - from end of text
}

export async function processMarkdown(content: string): Promise<string> {
  const renderer = new marked.Renderer();
  const seenIds = new Map<string, number>();

  // Icon for copy button
  const copySvg =
    '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>';

  renderer.heading = function ({ tokens, depth }) {
    const text = this.parser.parseInline(tokens);
    const title = text.toString();
    // Strip HTML tags for clean ID generation
    const cleanTitle = DOMPurify.sanitize(title, { ALLOWED_TAGS: [] });
    const baseId = slugifyHeading(cleanTitle) || "section";
    const nextCount = (seenIds.get(baseId) ?? 0) + 1;
    seenIds.set(baseId, nextCount);
    const id = nextCount === 1 ? baseId : `${baseId}-${nextCount}`;

    return `<h${depth} id="${id}">${text}</h${depth}>`;
  };

  renderer.code = ({ text, lang }) => {
    const languageClass = lang ? `language-${lang}` : "";
    // Encode text for data attribute
    const safeCode = text.replace(/"/g, "&quot;");

    return `
      <div class="relative group my-4" data-copy-wrapper="true">
        <button 
          type="button"
          class="copy-btn absolute top-2 right-2 z-10 h-8 w-8 flex items-center justify-center rounded-md border border-white/20 bg-[#121212] text-white hover:bg-[#202020] transition-all"
          aria-label="Copy code to clipboard"
          title="Copy"
          data-code="${safeCode}"
        >
          ${copySvg}
        </button>
        <pre><code class="${languageClass}">${text}</code></pre>
      </div>
    `;
  };

  renderer.link = ({ href, title, text }) => {
    return `<a href="${href}" title="${
      title || ""
    }" target="_blank" rel="noopener noreferrer">${text}</a>`;
  };

  const rawContent = await marked.parse(content, { renderer });

  const cleanContent = DOMPurify.sanitize(rawContent, {
    ADD_TAGS: ["iframe", "button"],
    ADD_ATTR: [
      "allow",
      "allowfullscreen",
      "frameborder",
      "height",
      "scrolling",
      "src",
      "width",
      "id",
      "class",
      "data-code",
      "aria-label",
      "title",
      "type",
      "target",
      "rel",
    ],
  });

  return cleanContent;
}
