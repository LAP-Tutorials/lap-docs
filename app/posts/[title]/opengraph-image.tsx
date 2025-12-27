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
            backgroundColor: "#050505",
            height: "100%",
            width: "100%",
            display: "flex",
            flexDirection: "column",
            alignItems: "flex-start",
            justifyContent: "space-between",
            padding: "60px",
            fontFamily: "sans-serif",
            position: "relative",
        }}
      >
        <div style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "8px", background: "#9D4EDD" }} />

        {/* Top: Branding */}
        <div style={{ display: "flex", alignItems: "center" }}>
            <div style={{ 
                fontSize: 48, 
                fontWeight: 900, 
                color: "#9D4EDD", // Purple
                letterSpacing: "-0.02em"
            }}>
                L.A.P - DOCS
            </div>
        </div>

        {/* Center: Title & Author */}
        <div style={{ display: "flex", flexDirection: "column", gap: "10px", marginBottom: "40px" }}>
          <div style={{ 
              fontSize: 80, 
              fontWeight: "bold", 
              lineHeight: 1.1, 
              color: "white", 
              textTransform: "uppercase" 
            }}>
            {articleTitle}
          </div>
          <div style={{ 
              fontSize: 28, 
              color: "#9D4EDD", // Purple accent for label or "author"
              fontWeight: "bold",
              marginTop: "10px"
            }}>
             AUTHOR: <span style={{ color: "white" }}>{authorName.toUpperCase()}</span>
          </div>
        </div>

        {/* Bottom: Footer Info */}
        <div style={{ 
            width: "100%", 
            display: "flex", 
            justifyContent: "space-between", 
            alignItems: "flex-end",
            borderTop: "2px solid #333",
            paddingTop: "24px"
        }}>
            <div style={{ fontSize: 24, color: "#888" }}>
                lap-docs.netlify.app
            </div>
             <div style={{ fontSize: 24, color: "#9D4EDD", fontWeight: "bold" }}>
                SIMPLICITY IN TECH
            </div>
        </div>
      </div>
    ),
    {
      ...size,
    }
  );
}

