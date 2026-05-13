import { NextResponse } from "next/server";
import { getPublishedArticleBySlug } from "@/lib/content";
import { DEFAULT_OG_IMAGE_PATH, absoluteUrl } from "@/lib/seo";

export const dynamic = "force-dynamic";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ title: string }> },
) {
  const { title } = await params;
  const article = await getPublishedArticleBySlug(title);

  return NextResponse.redirect(
    absoluteUrl(article?.img || DEFAULT_OG_IMAGE_PATH),
    301,
  );
}
