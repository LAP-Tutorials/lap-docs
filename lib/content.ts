import "server-only";

import { db } from "@/lib/firebase";
import {
  collection,
  getDocs,
  limit,
  orderBy,
  query,
  where,
  type DocumentData,
  type QueryDocumentSnapshot,
} from "firebase/firestore";
import {
  DEFAULT_OG_IMAGE_PATH,
  SITE_NAME,
  buildTopicPath,
  slugifySegment,
} from "@/lib/seo";
import { safeTimestampToDate } from "@/lib/utils";

const ARTICLE_UPDATED_FIELDS = [
  "updatedAt",
  "updated_at",
  "modifiedAt",
  "modified_at",
  "lastModified",
  "last_modified",
  "publishedAt",
  "published_at",
  "createdAt",
  "created_at",
  "date",
] as const;

const AUTHOR_UPDATED_FIELDS = [
  "updatedAt",
  "updated_at",
  "modifiedAt",
  "modified_at",
  "lastModified",
  "last_modified",
  "createdAt",
  "created_at",
] as const;

const VIDEO_URL_FIELDS = [
  "youtubeUrl",
  "youtubeURL",
  "youtubeLink",
  "youtube",
  "videoUrl",
  "videoURL",
  "videoLink",
  "video",
  "watchUrl",
] as const;

type SocialMap = Record<string, string>;

export type AuthorRecord = {
  docId: string;
  uid: string;
  name: string;
  job: string;
  city: string;
  avatar: string;
  imgAlt: string;
  slug: string;
  biography: {
    summary: string;
    body: string;
  };
  socials: SocialMap;
  updatedAt?: Date;
};

export type ArticleVideoRecord = {
  platform: "youtube" | "external";
  url: string;
  videoId?: string;
  embedUrl?: string;
  thumbnailUrl?: string;
};

export type ArticleRecord = {
  id: string;
  title: string;
  slug: string;
  content: string;
  description: string;
  date: Date;
  updatedAt: Date;
  read: string;
  label: string;
  labelSlug: string;
  topicPath: string;
  img: string;
  imgAlt: string;
  authorUID: string;
  authorName: string;
  author?: AuthorRecord;
  publish: boolean;
  popularity: boolean;
  popularityRank?: number;
  video?: ArticleVideoRecord;
};

export type TopicSummary = {
  label: string;
  slug: string;
  path: string;
  count: number;
  lastModified: Date;
};

function pickString(
  source: Record<string, unknown>,
  keys: readonly string[],
): string | undefined {
  for (const key of keys) {
    const value = source[key];
    if (typeof value === "string") {
      const trimmed = value.trim();
      if (trimmed) {
        return trimmed;
      }
    }
  }

  return undefined;
}

function pickDate(
  source: Record<string, unknown>,
  keys: readonly string[],
): Date | undefined {
  for (const key of keys) {
    const value = source[key];
    if (!value) continue;

    const date = safeTimestampToDate(value);
    if (!Number.isNaN(date.getTime())) {
      return date;
    }
  }

  return undefined;
}

function normalizeSocials(source: unknown): SocialMap {
  if (!source || typeof source !== "object" || Array.isArray(source)) {
    return {};
  }

  return Object.entries(source).reduce<SocialMap>((acc, [platform, value]) => {
    if (typeof value === "string" && value.trim()) {
      acc[platform] = value.trim();
    }

    return acc;
  }, {});
}

function extractBiography(source: unknown, name: string) {
  if (typeof source === "string" && source.trim()) {
    const body = source.trim();
    return {
      summary: `${name} contributes to ${SITE_NAME}.`,
      body,
    };
  }

  if (source && typeof source === "object" && !Array.isArray(source)) {
    const biography = source as Record<string, unknown>;
    const summary =
      pickString(biography, ["summary"]) ||
      `${name} contributes to ${SITE_NAME}.`;
    const body = pickString(biography, ["body"]) || summary;

    return { summary, body };
  }

  const fallback = `${name} contributes to ${SITE_NAME}.`;
  return { summary: fallback, body: fallback };
}

function extractYouTubeId(rawValue: string): string | undefined {
  const value = rawValue.trim();

  if (/^[a-zA-Z0-9_-]{11}$/.test(value)) {
    return value;
  }

  try {
    const url = new URL(value);
    const hostname = url.hostname.replace(/^www\./, "").toLowerCase();

    if (hostname === "youtu.be") {
      const id = url.pathname.replace(/\//g, "").trim();
      return /^[a-zA-Z0-9_-]{11}$/.test(id) ? id : undefined;
    }

    if (hostname.endsWith("youtube.com")) {
      const searchId = url.searchParams.get("v");
      if (searchId && /^[a-zA-Z0-9_-]{11}$/.test(searchId)) {
        return searchId;
      }

      const pathSegments = url.pathname.split("/").filter(Boolean);
      const embeddedId = pathSegments[pathSegments.length - 1];
      if (embeddedId && /^[a-zA-Z0-9_-]{11}$/.test(embeddedId)) {
        return embeddedId;
      }
    }
  } catch {
    return undefined;
  }

  return undefined;
}

function buildVideoRecord(
  source: Record<string, unknown>,
): ArticleVideoRecord | undefined {
  const directUrl = pickString(source, VIDEO_URL_FIELDS);
  const sourceUrl = pickString(source, ["sourceUrl", "source_url"]);
  const candidate =
    directUrl ||
    (sourceUrl && /(youtu\.be|youtube\.com|vimeo\.com)/i.test(sourceUrl)
      ? sourceUrl
      : undefined);

  if (!candidate) {
    return undefined;
  }

  const videoId = extractYouTubeId(candidate);
  if (videoId) {
    return {
      platform: "youtube",
      url: `https://www.youtube.com/watch?v=${videoId}`,
      videoId,
      embedUrl: `https://www.youtube.com/embed/${videoId}`,
      thumbnailUrl: `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`,
    };
  }

  if (!/^https?:\/\//i.test(candidate)) {
    return undefined;
  }

  return {
    platform: "external",
    url: candidate,
  };
}

function normalizeAuthorDoc(
  doc: QueryDocumentSnapshot<DocumentData>,
): AuthorRecord {
  const data = doc.data() as Record<string, unknown>;
  const name = pickString(data, ["name"]) || "Unknown Author";

  return {
    docId: doc.id,
    uid: pickString(data, ["uid"]) || doc.id,
    name,
    job: pickString(data, ["job"]) || "",
    city: pickString(data, ["city"]) || "",
    avatar: pickString(data, ["avatar"]) || "/default-avatar.png",
    imgAlt: pickString(data, ["imgAlt", "imageAlt"]) || name,
    slug: pickString(data, ["slug"]) || "",
    biography: extractBiography(data.biography, name),
    socials: normalizeSocials(data.socials),
    updatedAt: pickDate(data, AUTHOR_UPDATED_FIELDS),
  };
}

function createAuthorLookup(authors: AuthorRecord[]) {
  const lookup = new Map<string, AuthorRecord>();

  for (const author of authors) {
    lookup.set(author.docId, author);
    lookup.set(author.uid, author);
  }

  return lookup;
}

function normalizeArticleDoc(
  doc: QueryDocumentSnapshot<DocumentData>,
  authorLookup: Map<string, AuthorRecord>,
): ArticleRecord {
  const data = doc.data() as Record<string, unknown>;
  const authorUID =
    pickString(data, ["authorUID", "authorUid", "authorId"]) || "";
  const author = authorLookup.get(authorUID);
  const label =
    pickString(data, ["label", "category", "topic", "tag"]) || "General";
  const labelSlug = slugifySegment(label);
  const date = pickDate(data, ["date", "publishedAt", "published_at"]) || new Date();
  const updatedAt = pickDate(data, ARTICLE_UPDATED_FIELDS) || date;
  const img =
    pickString(data, ["img", "image", "imageUrl", "coverImage"]) ||
    DEFAULT_OG_IMAGE_PATH;
  const title = pickString(data, ["title"]) || "Untitled";

  return {
    id: doc.id,
    title,
    slug: pickString(data, ["slug"]) || doc.id,
    content: pickString(data, ["content"]) || "",
    description: pickString(data, ["description", "summary"]) || "",
    date,
    updatedAt,
    read: pickString(data, ["read"]) || "Unknown",
    label,
    labelSlug,
    topicPath: buildTopicPath(label),
    img,
    imgAlt: pickString(data, ["imgAlt", "imageAlt"]) || title,
    authorUID,
    authorName: pickString(data, ["authorName"]) || author?.name || "L.A.P Team",
    author,
    publish: Boolean(data.publish),
    popularity: Boolean(data.popularity),
    popularityRank:
      typeof data.popularityRank === "number" ? data.popularityRank : undefined,
    video: buildVideoRecord(data),
  };
}

function sortArticlesDescending(articles: ArticleRecord[]) {
  return [...articles].sort(
    (a, b) => b.date.getTime() - a.date.getTime() || a.title.localeCompare(b.title),
  );
}

export function buildTopicSummaries(articles: ArticleRecord[]): TopicSummary[] {
  const topics = new Map<string, TopicSummary>();

  for (const article of articles) {
    const existing = topics.get(article.labelSlug);

    if (!existing) {
      topics.set(article.labelSlug, {
        label: article.label,
        slug: article.labelSlug,
        path: article.topicPath,
        count: 1,
        lastModified: article.updatedAt,
      });
      continue;
    }

    existing.count += 1;
    if (article.updatedAt.getTime() > existing.lastModified.getTime()) {
      existing.lastModified = article.updatedAt;
    }
  }

  return [...topics.values()].sort((a, b) => a.label.localeCompare(b.label));
}

export async function getAllAuthors() {
  const snapshot = await getDocs(collection(db, "authors"));
  return snapshot.docs
    .map((doc) => normalizeAuthorDoc(doc))
    .sort((a, b) => a.name.localeCompare(b.name));
}

export async function getPublishedArticles(limitCount?: number) {
  const authors = await getAllAuthors();
  const authorLookup = createAuthorLookup(authors);
  const snapshot = await getDocs(query(collection(db, "articles"), orderBy("date", "desc")));

  const articles = snapshot.docs
    .map((doc) => normalizeArticleDoc(doc, authorLookup))
    .filter((article) => article.publish);

  const sorted = sortArticlesDescending(articles);
  return typeof limitCount === "number" ? sorted.slice(0, limitCount) : sorted;
}

export async function getPublishedArticleBySlug(slug: string) {
  const authors = await getAllAuthors();
  const authorLookup = createAuthorLookup(authors);
  const snapshot = await getDocs(
    query(collection(db, "articles"), where("slug", "==", slug), limit(1)),
  );

  if (snapshot.empty) {
    return null;
  }

  const article = normalizeArticleDoc(snapshot.docs[0], authorLookup);
  return article.publish ? article : null;
}

export async function getPublishedArticlesForAuthor(authorUID: string) {
  const articles = await getPublishedArticles();
  return articles.filter((article) => article.authorUID === authorUID);
}

export async function getAuthorBySlug(slug: string) {
  const snapshot = await getDocs(
    query(collection(db, "authors"), where("slug", "==", slug), limit(1)),
  );

  if (snapshot.empty) {
    return null;
  }

  return normalizeAuthorDoc(snapshot.docs[0]);
}

export async function getPublishedTopicBySlug(topicSlug: string) {
  const articles = await getPublishedArticles();
  const topics = buildTopicSummaries(articles);
  const topic = topics.find((entry) => entry.slug === topicSlug);

  if (!topic) {
    return null;
  }

  return {
    topic,
    articles: articles.filter((article) => article.labelSlug === topicSlug),
    topics,
  };
}
