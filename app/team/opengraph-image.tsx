import { ImageResponse } from "next/og";

export const runtime = "edge";

export const alt = "L.A.P Docs Team";
export const size = {
  width: 1200,
  height: 630,
};

export const contentType = "image/png";

export default async function Image() {
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
             <span>Posts</span>
             <span style={{ color: "#9D4EDD" }}>Team</span>
             <span>YouTube</span>
           </div>
        </div>

        {/* Hero Section */}
        <div style={{ 
            flex: 1, 
            display: "flex", 
            flexDirection: "column", 
            alignItems: "center", 
            justifyContent: "center",
        }}>
            <div
            style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontWeight: 900,
            }}
            >
            <span style={{ color: "#fff", fontSize: 180, letterSpacing: "-0.04em", lineHeight: 0.8 }}>OUR</span>
            <span style={{ color: "#9D4EDD", fontSize: 180, marginLeft: "30px", letterSpacing: "-0.04em", lineHeight: 0.8  }}>TEAM</span>
            </div>
            
            <div style={{ 
                marginTop: "30px",
                color: "#888", 
                fontSize: 32, 
                fontWeight: 500,
                textAlign: "center",
                maxWidth: "800px"
            }}>
                Meet the creators behind L.A.P Docs
            </div>
        </div>
      </div>
    ),
    {
      ...size,
    }
  );
}
