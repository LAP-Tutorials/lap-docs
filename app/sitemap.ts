import { MetadataRoute } from "next";
import { buildTopicSummaries, getAllAuthors, getPublishedArticles } from "@/lib/content";
import { absoluteUrl } from "@/lib/seo";

export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // Static routes
  const routes = [
    "",
    "/posts",
    "/team",
    "/privacy-policy",
    "/terms-of-service",
  ].map((route) => ({
    url: absoluteUrl(route || "/"),
    changeFrequency: route === "" ? ("daily" as const) : ("weekly" as const),
    priority: route === "" ? 1 : 0.7,
  }));

  try {
    const [articles, authors] = await Promise.all([
      getPublishedArticles(),
      getAllAuthors(),
    ]);

    const articleRoutes = articles.map((article) => ({
      url: absoluteUrl(`/posts/${article.slug}`),
      lastModified: article.updatedAt,
      changeFrequency: "weekly" as const,
      priority: 0.8,
    }));

    const topicRoutes = buildTopicSummaries(articles).map((topic) => ({
      url: absoluteUrl(topic.path),
      lastModified: topic.lastModified,
      changeFrequency: "weekly" as const,
      priority: 0.75,
    }));

    const articleDatesByAuthor = new Map<string, Date>();
    for (const article of articles) {
      if (!article.author?.slug) continue;

      const current = articleDatesByAuthor.get(article.author.slug);
      if (!current || article.updatedAt.getTime() > current.getTime()) {
        articleDatesByAuthor.set(article.author.slug, article.updatedAt);
      }
    }

    const authorRoutes = authors
      .filter((author) => author.slug)
      .map((author) => ({
        url: absoluteUrl(`/team/${author.slug}`),
        lastModified:
          author.updatedAt || articleDatesByAuthor.get(author.slug) || undefined,
        changeFrequency: "monthly" as const,
        priority: 0.6,
      }));

    return [...routes, ...topicRoutes, ...articleRoutes, ...authorRoutes];
  } catch (error) {
    console.error("Error generating sitemap:", error);
    return routes;
  }
}
