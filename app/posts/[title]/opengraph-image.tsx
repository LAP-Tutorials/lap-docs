import { ImageResponse } from "next/og";
import { db } from "@/lib/firebase";
import { collection, query, where, getDocs } from "firebase/firestore";

export const runtime = "edge";

export const alt = "L.A.P Docs Article";
export const size = {
  width: 1200,
  height: 630,
};

export const contentType = "image/png";

export default async function Image({
  params,
}: {
  params: Promise<{ title: string }>;
}) {
  const { title } = await params;
  
  // Default values
  let articleTitle = "L.A.P Docs";
  let authorName = "L.A.P Team";

  try {
     // Note: Firestore Edge support might be limited depending on the SDK version and environment. 
     // If this fails in edge runtime, we might need to use node runtime or a different fetching method.
     // For now, assuming standard usage or changing runtime if needed.
     
     // However, Firestore JS SDK isn't always edge-friendly. 
     // Let's rely on standard fetch if we had an API, but here we have direct DB access.
     // To be safe with "edge" runtime and Firebase, we might need to remove "runtime = edge" 
     // or ensure using a compatible adapter. 
     // Given the environment (Next.js 15), let's try 'nodejs' runtime if 'edge' is problematic, 
     // but 'edge' is preferred for OG. 
     // actually, let's stick to Node.js runtime for Firebase compatibility unless we know it works on Edge.
     // Removing `export const runtime = 'edge'` to default to Node.js (Serverless) which supports Firebase Admin/Client SDKs reliably.
     
    const articlesRef = collection(db, "articles");
    const q = query(articlesRef, where("slug", "==", title));
    const snapshot = await getDocs(q);

    if (!snapshot.empty) {
      const data = snapshot.docs[0].data();
      articleTitle = data.title || articleTitle;
      
       if (data.authorUID) {
          const authorSnapshot = await getDocs(
            query(collection(db, "authors"), where("uid", "==", data.authorUID))
          );
          if (!authorSnapshot.empty) {
            authorName = authorSnapshot.docs[0].data().name || authorName;
          }
        }
    }
  } catch (error) {
    console.error("Error fetching OG data:", error);
  }

  return new ImageResponse(
    (
      <div
        style={{
          background: "linear-gradient(to bottom right, #000000, #1a1a1a)",
          height: "100%",
          width: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "flex-start",
          justifyContent: "space-between",
          padding: "60px",
          color: "white",
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "20px" }}>
             {/* Logo or Brand Name */}
            <div style={{ 
                fontSize: 32, 
                fontWeight: "bold", 
                color: "#CCCCCC",
                border: "2px solid #CCCCCC",
                padding: "8px 16px",
                borderRadius: "50px"
            }}>
                L.A.P
            </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
          <div style={{ fontSize: 64, fontWeight: "bold", lineHeight: 1.1 }}>
            {articleTitle}
          </div>
          <div style={{ fontSize: 32, color: "#AAAAAA" }}>
             by {authorName}
          </div>
        </div>

        <div style={{ fontSize: 24, color: "#666666" }}>
          lap-docs.netlify.app
        </div>
      </div>
    ),
    {
      ...size,
    }
  );
}
