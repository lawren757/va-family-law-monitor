import { NextRequest, NextResponse } from "next/server";
import { insertUpdate, getExistingUrls } from "@/lib/db";

export const maxDuration = 300;
export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const startTime = Date.now();
  const results = {
    researched: 0,
    inserted: 0,
    duplicates: 0,
    sheets: false,
    errors: [] as string[],
  };

  try {
    // Step 1: Call research pipeline
    console.log("[weekly-update] Starting research pipeline...");
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    const researchRes = await fetch(`${baseUrl}/api/research`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.CRON_SECRET}`,
      },
      body: JSON.stringify({}),
    });

    if (!researchRes.ok) {
      throw new Error(`Research API returned ${researchRes.status}`);
    }

    const { items: newItems } = await researchRes.json();
    results.researched = newItems?.length || 0;
    console.log(`[weekly-update] Researched ${results.researched} items`);

    if (!newItems || newItems.length === 0) {
      return NextResponse.json({
        ...results,
        message: "No new items found by research pipeline",
        duration: Date.now() - startTime,
      });
    }

    // Step 2: De-duplicate by source_url
    const urls = newItems.map((i: { source_url: string }) => i.source_url);
    const existingUrlSet = await getExistingUrls(urls);

    const deduped = newItems.filter((item: { source_url: string }) => {
      if (existingUrlSet.has(item.source_url)) {
        results.duplicates++;
        return false;
      }
      return true;
    });

    console.log(
      `[weekly-update] ${deduped.length} new items after dedup (${results.duplicates} duplicates skipped)`
    );

    // Step 3: Insert new items
    const insertedItems = [];
    for (const item of deduped) {
      try {
        const id = await insertUpdate(item);
        insertedItems.push({ ...item, id });
        results.inserted++;
      } catch (err) {
        const msg = `Failed to insert "${item.title}": ${err instanceof Error ? err.message : err}`;
        console.error("[weekly-update]", msg);
        results.errors.push(msg);
      }
    }

    console.log(`[weekly-update] Inserted ${results.inserted} items`);

    // Step 4: Append to Google Sheets (if configured)
    if (insertedItems.length > 0 && process.env.GOOGLE_SERVICE_ACCOUNT_JSON) {
      try {
        const { addRows } = await import("@/lib/google-sheets");
        await addRows(insertedItems);
        results.sheets = true;
        console.log(`[weekly-update] Appended ${insertedItems.length} rows to Google Sheets`);
      } catch (err) {
        const msg = `Google Sheets append failed: ${err instanceof Error ? err.message : err}`;
        console.error("[weekly-update]", msg);
        results.errors.push(msg);
      }
    }

    return NextResponse.json({
      success: true,
      ...results,
      duration: Date.now() - startTime,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("[weekly-update] Fatal error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : String(error),
        ...results,
        duration: Date.now() - startTime,
      },
      { status: 500 }
    );
  }
}
