import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

const COOKIE_NAME = "va-law-theme";
const COOKIE_MAX_AGE = 60 * 60 * 24 * 365;

export async function GET() {
  const cookieStore = await cookies();
  const saved = cookieStore.get(COOKIE_NAME)?.value;
  const theme = saved === "light" || saved === "dark" ? saved : "dark";
  return NextResponse.json({ theme });
}

export async function POST(request: NextRequest) {
  try {
    const { theme } = await request.json();

    if (theme !== "light" && theme !== "dark") {
      return NextResponse.json(
        { error: "Invalid theme. Use 'light' or 'dark'." },
        { status: 400 }
      );
    }

    const response = NextResponse.json({ theme });
    response.cookies.set(COOKIE_NAME, theme, {
      maxAge: COOKIE_MAX_AGE,
      path: "/",
      httpOnly: false,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
    });

    return response;
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }
}
