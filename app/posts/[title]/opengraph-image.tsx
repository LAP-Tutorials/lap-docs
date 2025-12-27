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
          fontFamily: "sans-serif",
          position: "relative",
        }}
      >
        {/* Fake Navbar */}
        <div style={{ 
            width: "100%", 
            height: "80px", 
            display: "flex", 
            alignItems: "center", 
            justifyContent: "space-between",
            padding: "0 60px",
            borderBottom: "1px solid #222"
        }}>
           <div style={{
               width: "40px",
               height: "40px",
               background: "#9D4EDD",
               display: "flex"
           }} />

           <div style={{ display: "flex", gap: "20px", color: "#ccc", fontSize: 18, fontWeight: 600 }}>
             <span style={{ color: "#9D4EDD" }}>Posts</span>
             <span>Team</span>
             <span>YouTube</span>
           </div>
        </div>

        {/* Hero Section / Content */}
        <div style={{ 
            flex: 1, 
            display: "flex", 
            flexDirection: "column", 
            alignItems: "flex-start", 
            justifyContent: "center",
            padding: "0 80px"
        }}>
           <div style={{ 
               color: "#9D4EDD", 
               fontSize: 24, 
               fontWeight: "bold",
               marginBottom: "20px",
               textTransform: "uppercase"
           }}>
             AUTHOR: {authorName}
           </div>

           <div style={{ 
               fontSize: 80, 
               fontWeight: 900, 
               lineHeight: 1.1, 
               color: "white", 
               textTransform: "uppercase",
               marginBottom: "40px"
           }}>
            {articleTitle}
          </div>

          <div style={{ 
              display: "flex",
              alignItems: "center",
              gap: "20px"
          }}>
              <div style={{ padding: "10px 20px", background: "#333", borderRadius: "50px", color: "white", fontSize: 20 }}>
                 Read Article
              </div>
          </div>
        </div>
      </div>
    ),
    {
      ...size,
    }
  );
}

