/**
 * app/api/updates/route.ts
 *
 * JSON API for the VFL Toolkit Monitor.
 * Available at: https://monitor.vfltoolkit.com/api/updates
 *
 * Designed to be consumed by:
 *   - VFL Toolkit (iOS/iPadOS/macOS) "What's New" feed
 *   - Any third-party integrations (e.g., other Virginia practitioner apps)
 *
 * Query parameters:
 *   ?limit=N         max items to return (default 50, max 200)
 *   ?since=YYYY-MM-DD only items dated on/after this date
 *   ?category=X      filter by canonical category (case-insensitive,
 *                    can be repeated: ?category=Case+Law&category=SCOTUS)
 *
 * Response shape is versioned. If the schema changes, bump apiVersion and
 * keep the old route at /api/updates/v1 for at least 90 days so older
 * VFL Toolkit builds in the wild keep working.
 */

import { NextRequest, NextResponse } from "next/server";

export const revalidate = 3600;

const SHEET_CSV_URL =
  "https://docs.google.com/spreadsheets/d/1wYwCPa4tSXOuWwlfWGzq9Cd1pZGprMj6zyVJXOFacMM/export?format=csv";

const API_VERSION = "1.0";
const DEFAULT_LIMIT = 50;
const MAX_LIMIT = 200;

interface UpdateItem {
  id: string;
  title: string;
  date: string;            // ISO YYYY-MM-DD where parseable, else original
  dateRaw: string;         // always the original value from sheet
  category: string;
  tags: string[];
  summary: string;
  primarySource: string;
  sourceUrl: string;
  citation: string | null;
  court: string | null;
  blogCredit: string | null;
  blogUrl: string | null;
  searchTags: string[];
}

interface ApiResponse {
  apiVersion: string;
  generatedAt: string;
  count: number;
  totalAvailable: number;
  items: UpdateItem[];
}

// Same minimal CSV parser as feed.xml/route.ts. Could be extracted to
// lib/csv.ts and shared, but keeping routes self-contained for clarity.
function parseCSV(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let inQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (inQuotes) {
      if (c === '"') {
        if (text[i + 1] === '"') {
          field += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        field += c;
      }
    } else {
      if (c === '"') {
        inQuotes = true;
      } else if (c === ",") {
        row.push(field);
        field = "";
      } else if (c === "\n" || c === "\r") {
        if (c === "\r" && text[i + 1] === "\n") i++;
        row.push(field);
        rows.push(row);
        row = [];
        field = "";
      } else {
        field += c;
      }
    }
  }
  if (field.length > 0 || row.length > 0) {
    row.push(field);
    rows.push(row);
  }
  return rows.filter((r) => r.some((c) => c.length > 0));
}

function toIsoDate(raw: string): string {
  if (!raw) return "";
  const trimmed = raw.trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) return trimmed;
  const monthYear = trimmed.match(/^([A-Za-z]+)\s+(\d{4})$/);
  if (monthYear) {
    const d = new Date(`${monthYear[1]} 1, ${monthYear[2]}`);
    if (!isNaN(d.getTime())) return d.toISOString().split("T")[0];
  }
  const d = new Date(trimmed);
  if (!isNaN(d.getTime()) && d.getFullYear() > 2000) {
    return d.toISOString().split("T")[0];
  }
  return trimmed;
}

function rowToItem(cols: string[]): UpdateItem {
  // Tags column (E) is a comma-separated string in the sheet.
  // Search Tags column (M) is pipe-separated per the schema.
  const tags = (cols[4] || "")
    .split(",")
    .map((t) => t.trim())
    .filter(Boolean);
  const searchTags = (cols[12] || "")
    .split("|")
    .map((t) => t.trim())
    .filter(Boolean);

  const dateRaw = cols[2] || "";

  return {
    id: cols[0] || "",
    title: cols[1] || "",
    date: toIsoDate(dateRaw),
    dateRaw,
    category: cols[3] || "",
    tags,
    summary: cols[5] || "",
    primarySource: cols[6] || "",
    sourceUrl: cols[7] || "",
    citation: cols[8] || null,
    court: cols[9] || null,
    blogCredit: cols[10] || null,
    blogUrl: cols[11] || null,
    searchTags,
  };
}

export async function GET(req: NextRequest) {
  try {
    const params = req.nextUrl.searchParams;

    // Parse + validate query params
    const rawLimit = parseInt(params.get("limit") || String(DEFAULT_LIMIT), 10);
    const limit = Math.min(
      Math.max(isNaN(rawLimit) ? DEFAULT_LIMIT : rawLimit, 1),
      MAX_LIMIT
    );
    const since = params.get("since"); // ISO date
    const categories = params.getAll("category").map((c) => c.toLowerCase());

    // Fetch sheet
    const res = await fetch(SHEET_CSV_URL, { next: { revalidate: 3600 } });
    if (!res.ok) {
      return NextResponse.json(
        { error: "Upstream sheet fetch failed", status: res.status },
        { status: 502 }
      );
    }
    const csv = await res.text();
    const rows = parseCSV(csv);
    if (rows.length < 2) {
      return NextResponse.json({
        apiVersion: API_VERSION,
        generatedAt: new Date().toISOString(),
        count: 0,
        totalAvailable: 0,
        items: [],
      });
    }

    let items = rows.slice(1).map(rowToItem);
    const totalAvailable = items.length;

    // Sort by ISO date desc; rows with un-parseable dates fall to the end
    items.sort((a, b) => {
      const da = new Date(a.date).getTime() || 0;
      const db = new Date(b.date).getTime() || 0;
      return db - da;
    });

    // Filter: since
    if (since && /^\d{4}-\d{2}-\d{2}$/.test(since)) {
      const sinceTime = new Date(since).getTime();
      items = items.filter((it) => {
        const t = new Date(it.date).getTime();
        return !isNaN(t) && t >= sinceTime;
      });
    }

    // Filter: category (multiple values OR'd together)
    if (categories.length > 0) {
      items = items.filter((it) =>
        categories.includes(it.category.toLowerCase())
      );
    }

    items = items.slice(0, limit);

    const body: ApiResponse = {
      apiVersion: API_VERSION,
      generatedAt: new Date().toISOString(),
      count: items.length,
      totalAvailable,
      items,
    };

    return NextResponse.json(body, {
      headers: {
        "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400",
        // CORS — VFL Toolkit on iOS/macOS reaches this via URLSession; native
        // apps don't enforce CORS, but if you ever build a web companion or
        // let third parties consume it, this saves you a follow-up trip.
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET",
      },
    });
  } catch (err) {
    console.error("API /updates error:", err);
    return NextResponse.json(
      { error: "Internal error" },
      { status: 500 }
    );
  }
}
