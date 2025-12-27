import { ImageResponse } from "next/og";

export const runtime = "edge";

export const alt = "L.A.P Docs";
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
        {/* Logo Shape */}
        <div style={{
            width: "100px",
            height: "100px",
            background: "#9D4EDD",
            marginBottom: "50px",
            clipPath: "polygon(50% 0%, 0% 100%, 100% 100%)", // Proper Triangle
            display: "flex"
        }} />

        {/* Main Text */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontWeight: 900,
          }}
        >
          <span style={{ color: "#9D4EDD", fontSize: 180, letterSpacing: "-0.04em", lineHeight: 0.8 }}>L.A.P</span>
          <span style={{ color: "white", fontSize: 180, margin: "0 30px", lineHeight: 0.8  }}>-</span>
          <span style={{ color: "#9D4EDD", fontSize: 180, letterSpacing: "-0.04em", lineHeight: 0.8  }}>DOCS</span>
        </div>
        
        {/* Tagline */}
        <div style={{ 
            marginTop: "60px",
            color: "white", 
            fontSize: 32, 
            letterSpacing: "0.2em",
            textTransform: "uppercase",
            fontWeight: 600
        }}>
            Simplicity in Tech
        </div>
      </div>
    ),
    {
      ...size,
    }
  );
}
