import { MetadataRoute } from "next";
import { db } from "@/lib/firebase";
import { collection, query, where, getDocs } from "firebase/firestore";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = "https://lap-docs.netlify.app";

  // Static routes
  const routes = ["", "/posts", "/team"].map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified: new Date().toISOString(),
  }));

  try {
     // Fetch all published articles
    const articlesRef = collection(db, "articles");
    const q = query(articlesRef, where("publish", "==", true));
    const querySnapshot = await getDocs(q);

    const matchRoutes = querySnapshot.docs.map((doc) => {
        const data = doc.data();
        return {
            url: `${baseUrl}/posts/${data.slug}`,
            lastModified: data.date?.toDate().toISOString() || new Date().toISOString(),
        };
    });
    
    // Fetch all team members (authors)
    const authorsRef = collection(db, "authors");
    const authorsSnapshot = await getDocs(authorsRef);
    
    const authorRoutes = authorsSnapshot.docs.map((doc) => {
        const data = doc.data();
        if(!data.slug) return null;
        return {
            url: `${baseUrl}/team/${data.slug}`,
            lastModified: new Date().toISOString(), // Author profiles might not have a date field, defaulting to now
        };
    }).filter((route) : route is { url: string; lastModified: string } => route !== null);

    return [...routes, ...matchRoutes, ...authorRoutes];
  } catch (error) {
      console.error("Error generating sitemap:", error);
      return routes;
  }
}
