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
          backgroundColor: "#050505", // Very dark background matching the site
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
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontWeight: 900, // Extra bold
          }}
        >
          <span style={{ color: "#9D4EDD", fontSize: 160, letterSpacing: "-0.02em" }}>L.A.P</span>
          <span style={{ color: "#9D4EDD", fontSize: 160, margin: "0 30px" }}>-</span>
          <span style={{ color: "#9D4EDD", fontSize: 160, letterSpacing: "-0.02em" }}>DOCS</span>
        </div>

        {/* Subtitle/Tagline matching the site header feel */}
        <div style={{ 
            marginTop: "40px",
            color: "white", 
            fontSize: 32, 
            letterSpacing: "0.1em",
            textTransform: "uppercase",
            fontWeight: "bold"
        }}>
            Simplicity in Tech
        </div>

        {/* Decorative purple bar on the side/top like the screenshot? Or just keep it clean. 
            The screenshot has a purple accent line. Let's add a subtle one. */}
        <div style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "8px", background: "#9D4EDD" }} />
      </div>
    ),
    {
      ...size,
    }
  );
}
