import { ImageResponse } from "next/og";
import { getPublishedArticleBySlug } from "@/lib/content";
import { SITE_NAME } from "@/lib/seo";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export const alt = `${SITE_NAME} article preview`;
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
  const article = await getPublishedArticleBySlug(title);

  const articleTitle = article?.title || SITE_NAME;
  const authorName = article?.authorName || "L.A.P Team";
  const categoryName = article?.label || "Docs";

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
          padding: "56px 72px",
          color: "white",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            borderBottom: "1px solid #222",
            paddingBottom: "20px",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
            <div
              style={{
                width: "42px",
                height: "42px",
                borderRadius: "999px",
                background: "#8a2be2",
                display: "flex",
              }}
            />
            <div style={{ fontSize: 28, fontWeight: 700 }}>{SITE_NAME}</div>
          </div>
          <div
            style={{
              display: "flex",
              gap: "14px",
              fontSize: 20,
              textTransform: "uppercase",
              letterSpacing: "0.08em",
              color: "#d6d6d6",
            }}
          >
            <span>{categoryName}</span>
          </div>
        </div>

        <div
          style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
          }}
        >
          <div
            style={{
              color: "#8a2be2",
              fontSize: 24,
              fontWeight: 700,
              textTransform: "uppercase",
              marginBottom: "24px",
              letterSpacing: "0.08em",
            }}
          >
            By {authorName}
          </div>

          <div
            style={{
              fontSize: 74,
              fontWeight: 900,
              lineHeight: 1.05,
              marginBottom: "36px",
            }}
          >
            {articleTitle}
          </div>

          <div
            style={{
              display: "flex",
              gap: "18px",
              alignItems: "center",
            }}
          >
            <div
              style={{
                padding: "10px 22px",
                borderRadius: "999px",
                border: "1px solid #8a2be2",
                color: "white",
                fontSize: 22,
              }}
            >
              Read Article
            </div>
          </div>
        </div>
      </div>
    ),
    {
      ...size,
    },
  );
}
