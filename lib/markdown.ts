import { Marked } from "marked";
import sanitizeHtml from "sanitize-html";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

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
  if (!content) return "";

  const marked = new Marked();
  const seenIds = new Map<string, number>();

  // Icon for copy button
  const copySvg =
    '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>';

  marked.use({
    renderer: {
      heading({ tokens, depth }) {
        let title = "";
        try {
          if (this.parser && typeof this.parser.parseInline === "function") {
            title = this.parser.parseInline(tokens);
          } else {
            // Fallback: join text from tokens if parser is unavailable
            title = tokens.map((t: any) => t.text || "").join("");
          }
        } catch (e) {
          console.error("Error parsing heading tokens:", e);
          // Last resort fallback
          title = "Section";
        }

        // Strip HTML tags for clean ID generation
        const cleanTitle = title.replace(/<[^>]*>/g, "");
        const baseId = slugifyHeading(cleanTitle) || "section";
        const nextCount = (seenIds.get(baseId) ?? 0) + 1;
        seenIds.set(baseId, nextCount);
        const id = nextCount === 1 ? baseId : `${baseId}-${nextCount}`;

        return `<h${depth} id="${id}">${title}</h${depth}>`;
      },
      code({ text, lang }) {
        const languageClass = lang ? `language-${lang}` : "";
        // Encode text for data attribute
        const safeCode = text.replace(/"/g, "&quot;");

        return `
      <div data-copy-wrapper="true">
        <button 
          type="button"
          class="copy-btn"
          aria-label="Copy code to clipboard"
          title="Copy"
          data-code="${safeCode}"
        >
          ${copySvg}
        </button>
        <pre><code class="${languageClass}">${text}</code></pre>
      </div>
    `;
      },
      link({ href, title, text }) {
        return `<a href="${href}" title="${
          title || ""
        }" target="_blank" rel="noopener noreferrer">${text}</a>`;
      },
    },
  });

  const rawContent = await marked.parse(content);

  const cleanContent = sanitizeHtml(String(rawContent), {
    allowedTags: sanitizeHtml.defaults.allowedTags.concat([
      "img",
      "iframe",
      "button",
      "svg",
      "path",
      "rect",
      "line",
      "circle",
      "polyline",
      "polygon",
      "div",
    ]),
    allowedAttributes: {
      a: ["href", "name", "target", "rel", "title"],
      img: ["src", "alt", "title", "width", "height", "loading"],
      iframe: [
        "allow",
        "allowfullscreen",
        "frameborder",
        "height",
        "scrolling",
        "src",
        "width",
        "title",
      ],
      button: ["id", "class", "data-code", "aria-label", "title", "type"],
      div: ["class", "data-copy-wrapper"],
      "*": ["id", "class"],
      svg: [
        "xmlns",
        "width",
        "height",
        "viewBox",
        "fill",
        "stroke",
        "stroke-width",
        "stroke-linecap",
        "stroke-linejoin",
        "aria-hidden",
      ],
      path: ["d", "fill", "stroke"],
      rect: ["x", "y", "width", "height", "rx", "ry", "fill", "stroke"],
      line: ["x1", "y1", "x2", "y2", "stroke"],
      circle: ["cx", "cy", "r", "fill", "stroke"],
      polyline: ["points", "fill", "stroke"],
      polygon: ["points", "fill", "stroke"],
    },
    allowedSchemes: ["http", "https", "mailto", "tel"],
    allowedSchemesByTag: {
      iframe: ["https"],
    },
    transformTags: {
      a: (tagName, attribs) => ({
        tagName,
        attribs: {
          ...attribs,
          target: "_blank",
          rel: "noopener noreferrer",
        },
      }),
    },
  });
  return cleanContent;
}
