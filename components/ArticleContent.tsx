"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { marked } from "marked";
import DOMPurify from "dompurify";

interface ArticleContentProps {
  content: string;
}

type TocItem = {
  id: string;
  title: string;
  level: number;
  children: TocItem[];
};

function getScrollParent(el: HTMLElement): HTMLElement {
  // Prefer the document scroller when appropriate.
  const docScroller =
    (document.scrollingElement as HTMLElement | null) ??
    (document.documentElement as HTMLElement | null) ??
    (document.body as HTMLElement | null);

  let parent = el.parentElement;
  while (
    parent &&
    parent !== document.body &&
    parent !== document.documentElement
  ) {
    const style = window.getComputedStyle(parent);
    const overflowY = style.overflowY;
    const isScrollable =
      (overflowY === "auto" ||
        overflowY === "scroll" ||
        overflowY === "overlay") &&
      parent.scrollHeight > parent.clientHeight + 1;
    if (isScrollable) return parent;
    parent = parent.parentElement;
  }

  return docScroller ?? document.documentElement;
}

function isDocumentScroller(el: HTMLElement) {
  const docScroller =
    (document.scrollingElement as HTMLElement | null) ??
    (document.documentElement as HTMLElement | null) ??
    (document.body as HTMLElement | null);
  return (
    el === docScroller ||
    el === document.documentElement ||
    el === document.body
  );
}

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

function buildTocTree(flatItems: Array<Omit<TocItem, "children">>): TocItem[] {
  const root: TocItem[] = [];
  const stack: TocItem[] = [];

  for (const flat of flatItems) {
    const node: TocItem = { ...flat, children: [] };

    while (stack.length > 0 && node.level <= stack[stack.length - 1].level) {
      stack.pop();
    }

    if (stack.length === 0) {
      root.push(node);
    } else {
      stack[stack.length - 1].children.push(node);
    }

    stack.push(node);
  }

  return root;
}

const ArticleContent: React.FC<ArticleContentProps> = ({ content }) => {
  const [sanitizedContent, setSanitizedContent] = useState<string>("");
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [tocTree, setTocTree] = useState<TocItem[]>([]);
  const [collapsedIds, setCollapsedIds] = useState<Set<string>>(new Set());
  const headingMapRef = useRef<Map<string, HTMLHeadingElement>>(new Map());

  const tocNodeStorageKey = useMemo(() => "lap:toc:collapsed:nodes", []);

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
      // Use a custom renderer to add IDs to headings during parsing
      const renderer = new marked.Renderer();
      const seenIds = new Map<string, number>();

      renderer.heading = ({ text, depth }) => {
        const title = text.toString();
        const baseId = slugifyHeading(title) || "section";
        const nextCount = (seenIds.get(baseId) ?? 0) + 1;
        seenIds.set(baseId, nextCount);
        const id = nextCount === 1 ? baseId : `${baseId}-${nextCount}`;
        
        return `<h${depth} id="${id}">${text}</h${depth}>`;
      };

      marked.use({ renderer });

      // Convert markdown to HTML
      const rawContent = await marked.parse(content);

      // Configure DOMPurify to allow iframes
      const cleanContent = DOMPurify.sanitize(rawContent, {
        ADD_TAGS: ["iframe"],
        ADD_ATTR: [
          "allow",
          "allowfullscreen",
          "frameborder",
          "height",
          "scrolling",
          "src",
          "width",
          "id", // Ensure ID is allowed
        ],
      });

      setSanitizedContent(cleanContent);
    }
    sanitizeContent();
  }, [content]);

  useEffect(() => {
    if (typeof window === "undefined") return;

    try {
      const raw = window.localStorage.getItem(tocNodeStorageKey);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          setCollapsedIds(new Set(parsed as string[]));
        }
      }
    } catch {
      // Ignore storage failures
    }
  }, [tocNodeStorageKey]);

  useEffect(() => {
    const root = containerRef.current;
    if (!root) return;

    // Build TOC from headings.
    // IDs are now generated by marked, so we just read them.
    headingMapRef.current.clear();
    const headings = Array.from(
      root.querySelectorAll("h1, h2, h3, h4")
    ) as HTMLHeadingElement[];

    const flat: Array<Omit<TocItem, "children">> = [];

    for (const heading of headings) {
      const title = (heading.textContent ?? "").trim();
      if (!title) continue;

      const level = Number(heading.tagName.replace("H", ""));
      const id = heading.id;
      
      if (id) {
          headingMapRef.current.set(id, heading);
          flat.push({ id, title, level });
      }
    }

    setTocTree(buildTocTree(flat));
  }, [sanitizedContent]);

  useEffect(() => {
    // If the page was loaded with a hash, scroll to it after headings have ids.
    if (typeof window === "undefined") return;
    if (!tocTree.length) return;

    const raw = window.location.hash;
    if (!raw || raw.length < 2) return;
    const id = decodeURIComponent(raw.slice(1));

    // Let layout settle before scrolling.
    window.requestAnimationFrame(() => {
      const el = document.getElementById(id);
      if (el) {
          const headerOffset = 120;
          const elementPosition = el.getBoundingClientRect().top + window.scrollY;
          const offsetPosition = elementPosition - headerOffset;
          window.scrollTo({ top: offsetPosition, behavior: "smooth" });
      }
    });
  }, [tocTree]);

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

      const codeText =
        pre.querySelector("code")?.textContent ?? pre.textContent ?? "";
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
        const textToCopy =
          pre.querySelector("code")?.textContent ?? pre.textContent ?? "";
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
    <article className="grid md:grid-cols-1 lg:grid-cols-[minmax(0,1fr)_340px] xl:grid-cols-[minmax(0,1fr)_380px] gap-8 lg:gap-12 w-full max-w-7xl mx-auto mt-6 md:mt-24 mb-10 px-4">
      <div className="markdown-body w-full min-w-0" ref={containerRef}>
        <div dangerouslySetInnerHTML={{ __html: sanitizedContent }} />
      </div>

      {tocTree.length > 0 ? (
        <aside className="hidden lg:block shrink-0 self-start sticky top-16">
          <div className="border border-white p-4">
            <p className="uppercase font-semibold">Contents</p>

            <nav className="mt-4 max-h-[calc(100vh-12rem)] overflow-auto">
              <TocList
                items={tocTree}
                collapsedIds={collapsedIds}
                onToggle={(id) => {
                  setCollapsedIds((prev) => {
                    const next = new Set(prev);
                    if (next.has(id)) {
                      next.delete(id);
                    } else {
                      next.add(id);
                    }
                    try {
                      window.localStorage.setItem(
                        tocNodeStorageKey,
                        JSON.stringify(Array.from(next))
                      );
                    } catch {
                      // Ignore storage failures
                    }
                    return next;
                  });
                }}
              />
            </nav>
          </div>
        </aside>
      ) : null}
    </article>
  );
};

function TocList({
  items,
  collapsedIds,
  onToggle,
}: {
  items: TocItem[];
  collapsedIds: Set<string>;
  onToggle: (id: string) => void;
  // onNavigate removed
}) {
  return (
    <ul className="space-y-2">
      {items.map((item) => (
        <li key={item.id} className="space-y-2">
          <div className="flex items-start gap-2">
            {item.children.length > 0 ? (
              <button
                type="button"
                className="mt-[2px] text-sm w-5 text-left"
                aria-label={collapsedIds.has(item.id) ? "Expand" : "Collapse"}
                aria-expanded={!collapsedIds.has(item.id)}
                onClick={() => onToggle(item.id)}
              >
                {collapsedIds.has(item.id) ? "▸" : "▾"}
              </button>
            ) : (
              <span className="mt-[2px] w-5" aria-hidden="true"></span>
            )}

            <a
              href={`#${item.id}`}
              className="text-left w-full hover:underline cursor-pointer pointer-events-auto"
              onClick={(e) => {
                e.preventDefault();
                const element = document.getElementById(item.id);
                if (element) {
                  const headerOffset = 120; // 7.5rem approx
                  const elementPosition =
                    element.getBoundingClientRect().top + window.scrollY;
                  const offsetPosition = elementPosition - headerOffset;

                  window.scrollTo({
                    top: offsetPosition,
                    behavior: "smooth",
                  });
                  window.history.pushState(null, "", `#${item.id}`);
                }
              }}
            >
              <span
                className={
                  item.level === 2
                    ? "text-base"
                    : item.level === 3
                    ? "text-sm"
                    : "text-sm opacity-90"
                }
              >
                {item.title}
              </span>
            </a>
          </div>

          {item.children.length > 0 && !collapsedIds.has(item.id) ? (
            <div className="pl-4 border-l border-white/20">
              <TocList
                items={item.children}
                collapsedIds={collapsedIds}
                onToggle={onToggle}
                // onNavigate removed
              />
            </div>
          ) : null}
        </li>
      ))}
    </ul>
  );
}
// End of file
export default ArticleContent;
