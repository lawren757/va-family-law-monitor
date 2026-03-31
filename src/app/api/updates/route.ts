import { NextRequest, NextResponse } from "next/server";
import { getUpdates, insertUpdate } from "@/lib/db";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const category = searchParams.get("category");
  const tag = searchParams.get("tag");
  const search = searchParams.get("search");
  const scope = searchParams.get("scope");
  const sort = searchParams.get("sort");

  try {
    const data = await getUpdates({ category, tag, search, scope, sort });
    return NextResponse.json(data);
  } catch (error) {
    console.error("[/api/updates] Error:", error);
    return NextResponse.json({ error: "Failed to fetch updates" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { title, category } = body;

    if (!title || !category) {
      return NextResponse.json({ error: "title and category are required" }, { status: 400 });
    }

    const id = await insertUpdate(body);
    return NextResponse.json({ success: true, id }, { status: 201 });
  } catch (error) {
    console.error("[POST /api/updates] Error:", error);
    return NextResponse.json({ error: "Failed to insert update" }, { status: 500 });
  }
}
