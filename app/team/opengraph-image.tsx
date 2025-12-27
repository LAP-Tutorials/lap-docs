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
          alignItems: "center",
          justifyContent: "center",
          fontFamily: "sans-serif",
          position: "relative",
        }}
      >
        <div style={{
            width: "80px",
            height: "80px",
            background: "#9D4EDD",
            marginBottom: "40px",
            clipPath: "polygon(50% 0%, 0% 100%, 100% 100%)",
            display: "flex"
        }} />

        <div
        style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontWeight: 900,
        }}
        >
            <span style={{ color: "#fff", fontSize: 200, letterSpacing: "-0.05em", lineHeight: 0.8 }}>L.A.P</span>
            <span style={{ color: "#9D4EDD", fontSize: 200, marginLeft: "40px", letterSpacing: "-0.05em", lineHeight: 0.8  }}>TEAM</span>
        </div>
        
        <div style={{ 
            marginTop: "30px",
            color: "#888", 
            fontSize: 32, 
            fontWeight: 500,
            textAlign: "center",
            letterSpacing: "0.05em"
        }}>
            Meet the Creators
        </div>
      </div>
    ),
    {
      ...size,
    }
  );
}
