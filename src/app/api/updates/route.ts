import { NextRequest, NextResponse } from "next/server";
import { getUpdates } from "@/lib/store";

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const category = searchParams.get("category") || undefined;
  const tag = searchParams.get("tag") || null;
  const search = searchParams.get("search") || undefined;

  const data = await getUpdates(category, tag, search);
  return NextResponse.json(data);
}
