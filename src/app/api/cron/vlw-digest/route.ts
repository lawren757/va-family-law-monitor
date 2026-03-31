import { NextRequest, NextResponse } from "next/server";
import { insertUpdate, getExistingUrls } from "@/lib/db";

export const runtime = "nodejs";

// GET — Trigger GitHub Actions workflow dispatch
export async function GET(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { GITHUB_PAT, GITHUB_OWNER, GITHUB_REPO } = process.env;

  if (!GITHUB_PAT || !GITHUB_OWNER || !GITHUB_REPO) {
    return NextResponse.json(
      { error: "Missing GitHub configuration: GITHUB_PAT, GITHUB_OWNER, GITHUB_REPO" },
      { status: 500 }
    );
  }

  try {
    const dispatchRes = await fetch(
      `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/actions/workflows/vlw-digest.yml/dispatches`,
      {
        method: "POST",
        headers: {
          Accept: "application/vnd.github+json",
          Authorization: `Bearer ${GITHUB_PAT}`,
          "X-GitHub-Api-Version": "2022-11-28",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ref: "main",
          inputs: {
            trigger: "cron",
            callback_url: `${process.env.NEXT_PUBLIC_APP_URL}/api/cron/vlw-digest`,
          },
        }),
      }
    );

    if (!dispatchRes.ok) {
      const text = await dispatchRes.text();
      throw new Error(`GitHub dispatch failed: ${dispatchRes.status} — ${text}`);
    }

    return NextResponse.json({
      success: true,
      message: "VLW digest workflow dispatched to GitHub Actions",
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("[vlw-digest] Dispatch error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}

// POST — Receive results from GitHub Actions after VLW scrape
export async function POST(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { articles } = body as {
      articles: Array<{
        title: string;
        summary: string;
        date: string;
        url: string;
        tags: string[];
      }>;
    };

    if (!articles || !Array.isArray(articles)) {
      return NextResponse.json(
        { error: "Expected { articles: [...] } in request body" },
        { status: 400 }
      );
    }

    const urls = articles.map((a) => a.url);
    const existingUrlSet = await getExistingUrls(urls);

    const inserted = [];
    const duplicates: string[] = [];

    for (const article of articles) {
      if (existingUrlSet.has(article.url)) {
        duplicates.push(article.url);
        continue;
      }

      const id = await insertUpdate({
        title: article.title,
        summary: article.summary,
        date: article.date,
        category: "news",
        tags: article.tags || [],
        source_name: "Virginia Lawyers Weekly",
        source_url: article.url,
        pinned: false,
      });

      inserted.push({ ...article, id });
    }

    // Append to Google Sheets if configured
    if (inserted.length > 0 && process.env.GOOGLE_SERVICE_ACCOUNT_JSON) {
      try {
        const { addRows } = await import("@/lib/google-sheets");
        await addRows(
          inserted.map((a) => ({
            title: a.title,
            summary: a.summary,
            date: a.date,
            category: "news",
            tags: a.tags || [],
            source_name: "Virginia Lawyers Weekly",
            source_url: a.url,
          }))
        );
      } catch (err) {
        console.error("[vlw-digest/ingest] Sheets error:", err);
      }
    }

    return NextResponse.json({
      success: true,
      inserted: inserted.length,
      duplicates: duplicates.length,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("[vlw-digest/ingest] Error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}
