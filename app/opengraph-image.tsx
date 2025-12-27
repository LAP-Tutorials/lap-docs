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
          background: "linear-gradient(to bottom right, #000000, #111111)",
          height: "100%",
          width: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          color: "white",
          fontFamily: "sans-serif",
        }}
      >
        <div
            style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                border: "4px solid white",
                padding: "40px 80px",
                borderRadius: "20px",
                background: "black",
            }}
        >
            <div style={{ fontSize: 120, fontWeight: "bold", letterSpacing: "-0.05em" }}>
            L.A.P
            </div>
            <div style={{ fontSize: 40, marginTop: "20px", color: "#CCCCCC", textTransform: "uppercase", letterSpacing: "0.2em" }}>
            Docs
            </div>
        </div>
        
        <div style={{ position: "absolute", bottom: "40px", fontSize: 24, color: "#444" }}>
            Simplicity in Tech
        </div>
      </div>
    ),
    {
      ...size,
    }
  );
}
