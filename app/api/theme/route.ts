import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

const COOKIE_NAME = "vfl-theme";
const ONE_YEAR = 60 * 60 * 24 * 365;

export async function GET() {
  const cookieStore = cookies();
  const theme = cookieStore.get(COOKIE_NAME)?.value;
  const validTheme = theme === "light" || theme === "dark" ? theme : "dark";
  return NextResponse.json({ theme: validTheme });
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const theme = body.theme === "light" ? "light" : "dark";

  const response = NextResponse.json({ theme });
  response.cookies.set(COOKIE_NAME, theme, {
    path: "/",
    maxAge: ONE_YEAR,
    sameSite: "lax",
    httpOnly: false, // Needs to be readable client-side fallback
  });

  return response;
}
