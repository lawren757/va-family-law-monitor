import { NextRequest, NextResponse } from "next/server";
import { fetchUpdatesFromGemini } from "@/lib/gemini";
import { saveUpdates } from "@/lib/store";

export async function GET(request: NextRequest) {
  // Verify cron secret for Vercel Cron Jobs
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const updates = await fetchUpdatesFromGemini();
    await saveUpdates(updates);
    return NextResponse.json({
      success: true,
      count: updates.length,
      message: `Added ${updates.length} updates`,
    });
  } catch (error) {
    console.error("Cron job failed:", error);
    return NextResponse.json(
      { error: "Failed to fetch updates", details: String(error) },
      { status: 500 }
    );
  }
}
