import { NextRequest, NextResponse } from "next/server";
import {
  INDEXNOW_KEY,
  SITE_HOST,
  SITE_URL,
  absoluteUrl,
} from "@/lib/seo";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function normalizeUrl(value: unknown) {
  if (typeof value !== "string" || !value.trim()) {
    return null;
  }

  try {
    const url = new URL(value, SITE_URL);
    return url.host === SITE_HOST ? url.toString() : null;
  } catch {
    return null;
  }
}

export async function POST(request: NextRequest) {
  const secret = process.env.INDEXNOW_SECRET;
  if (secret && request.headers.get("x-indexnow-secret") !== secret) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const rawUrlList = Array.isArray(body.urlList)
    ? body.urlList
    : body.url
      ? [body.url]
      : [];
  const urlList = rawUrlList
    .map((value) => normalizeUrl(value))
    .filter((value): value is string => Boolean(value))
    .slice(0, 10000);

  if (urlList.length === 0) {
    return NextResponse.json(
      { error: "Provide at least one same-host URL." },
      { status: 400 },
    );
  }

  const response = await fetch("https://api.indexnow.org/indexnow", {
    method: "POST",
    headers: {
      "Content-Type": "application/json; charset=utf-8",
    },
    body: JSON.stringify({
      host: SITE_HOST,
      key: INDEXNOW_KEY,
      keyLocation: absoluteUrl(`/${INDEXNOW_KEY}.txt`),
      urlList,
    }),
  });

  if (!response.ok) {
    const message = await response.text();
    return NextResponse.json(
      {
        error: "IndexNow submission failed",
        status: response.status,
        message,
      },
      { status: 502 },
    );
  }

  return NextResponse.json({
    ok: true,
    submitted: urlList.length,
  });
}
