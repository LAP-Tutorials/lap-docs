const YOUTUBE_ID_PATTERN = /^[a-zA-Z0-9_-]{11}$/;
const YOUTUBE_IFRAME_PATTERN =
  /<iframe\b[^>]*\bsrc\s*=\s*(["'])(https:\/\/(?:(?:www|m)\.)?youtube(?:-nocookie)?\.com\/embed\/[a-zA-Z0-9_-]{11}(?:[?&#][^"']*)?)\1[^>]*>[\s\S]*?<\/iframe>/gi;

export function extractYouTubeId(rawValue: string): string | undefined {
  const value = rawValue.trim();

  if (YOUTUBE_ID_PATTERN.test(value)) {
    return value;
  }

  try {
    const url = new URL(value);
    const hostname = url.hostname.toLowerCase();
    const isYouTubeHost =
      hostname === "youtube.com" ||
      hostname.endsWith(".youtube.com") ||
      hostname === "youtube-nocookie.com" ||
      hostname.endsWith(".youtube-nocookie.com");

    if (hostname === "youtu.be") {
      const pathSegments = url.pathname.split("/").filter(Boolean);
      return pathSegments.length === 1 &&
        YOUTUBE_ID_PATTERN.test(pathSegments[0])
        ? pathSegments[0]
        : undefined;
    }

    if (!isYouTubeHost) {
      return undefined;
    }

    if (url.pathname === "/watch") {
      const videoId = url.searchParams.get("v") || "";
      return YOUTUBE_ID_PATTERN.test(videoId) ? videoId : undefined;
    }

    const pathSegments = url.pathname.split("/").filter(Boolean);
    return pathSegments.length === 2 &&
      ["embed", "shorts", "live"].includes(pathSegments[0]) &&
      YOUTUBE_ID_PATTERN.test(pathSegments[1])
      ? pathSegments[1]
      : undefined;
  } catch {
    return undefined;
  }
}

export function extractYouTubeEmbedId(html: string): string | undefined {
  for (const match of html.matchAll(YOUTUBE_IFRAME_PATTERN)) {
    const videoId = extractYouTubeId(match[2]);
    if (videoId) {
      return videoId;
    }
  }

  return undefined;
}

export function removeYouTubeIframe(html: string, videoId: string) {
  return html.replace(
    YOUTUBE_IFRAME_PATTERN,
    (iframe, _quote: string, sourceUrl: string) =>
      extractYouTubeId(sourceUrl) === videoId ? "" : iframe,
  );
}
