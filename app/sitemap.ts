import { MetadataRoute } from "next";
import { db } from "@/lib/firebase";
import { collection, query, where, getDocs } from "firebase/firestore";
import { safeTimestampToDate } from "@/lib/utils";
import { absoluteUrl } from "@/lib/seo";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const lastModified = new Date();

  // Static routes
  const routes = [
    "",
    "/posts",
    "/team",
    "/privacy-policy",
    "/terms-of-service",
  ].map((route) => ({
    url: absoluteUrl(route || "/"),
    lastModified,
    changeFrequency: route === "" ? ("daily" as const) : ("weekly" as const),
    priority: route === "" ? 1 : 0.7,
  }));

  try {
    // Fetch all published articles
    const articlesRef = collection(db, "articles");
    const q = query(articlesRef, where("publish", "==", true));
    const querySnapshot = await getDocs(q);

    const matchRoutes = querySnapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        url: absoluteUrl(`/posts/${data.slug}`),
        lastModified: safeTimestampToDate(data.date),
        changeFrequency: "weekly" as const,
        priority: 0.8,
      };
    });

    // Fetch all team members (authors)
    const authorsRef = collection(db, "authors");
    const authorsSnapshot = await getDocs(authorsRef);

    const authorRoutes = authorsSnapshot.docs
      .map((doc) => {
        const data = doc.data();
        if (!data.slug) return null;
        return {
          url: absoluteUrl(`/team/${data.slug}`),
          lastModified,
          changeFrequency: "monthly" as const,
          priority: 0.6,
        };
      })
      .filter((route): route is NonNullable<typeof route> => route !== null);

    return [...routes, ...matchRoutes, ...authorRoutes];
  } catch (error) {
    console.error("Error generating sitemap:", error);
    return routes;
  }
}
