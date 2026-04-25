/**
 * app/feed.xml/route.ts
 *
 * RSS 2.0 feed for the VFL Toolkit Monitor.
 * Available at: https://monitor.vfltoolkit.com/feed.xml
 *
 * Reads the same Google Sheet CSV your dashboard uses (no service account
 * needed here — public CSV export). Returns the most recent 50 items.
 *
 * Cached for 1 hour via Next.js revalidate. The /api/revalidate endpoint
 * already busts this cache when GitHub Actions appends new rows.
 */

import { NextResponse } from "next/server";

export const revalidate = 3600; // 1h, busted by /api/revalidate

const SHEET_CSV_URL =
  "https://docs.google.com/spreadsheets/d/1wYwCPa4tSXOuWwlfWGzq9Cd1pZGprMj6zyVJXOFacMM/export?format=csv";

const FEED_URL = "https://monitor.vfltoolkit.com/feed.xml";
const SITE_URL = "https://monitor.vfltoolkit.com";
const FEED_TITLE = "VFL Toolkit — Virginia Family Law Monitor";
const FEED_DESC =
  "Curated updates on Virginia family law: legislation, case law, attorney discipline, retirement/ERISA, military and federal employee divorce, and practice trends.";
const ITEM_LIMIT = 50;

interface Row {
  id: string;
  title: string;
  date: string;
  category: string;
  tags: string;
  summary: string;
  primarySource: string;
  sourceUrl: string;
  citation: string;
  court: string;
  blogCredit: string;
  blogUrl: string;
}

// Minimal RFC 4180 CSV parser — handles quoted fields with embedded commas/newlines.
// We don't pull in a full CSV library to keep the route lean.
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

function escapeXml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

// CDATA-safe wrapper for HTML-ish content
function cdata(s: string): string {
  return `<![CDATA[${s.replace(/]]>/g, "]]]]><![CDATA[>")}]]>`;
}

function toRfc822(dateStr: string): string {
  // Try ISO first
  let d = new Date(dateStr);
  if (isNaN(d.getTime())) {
    // "Month YYYY"
    const m = dateStr.match(/^([A-Za-z]+)\s+(\d{4})$/);
    if (m) d = new Date(`${m[1]} 1, ${m[2]}`);
  }
  if (isNaN(d.getTime())) d = new Date(); // fallback to now
  return d.toUTCString();
}

function rowsToItems(csvRows: string[][]): Row[] {
  if (csvRows.length < 2) return [];
  // Skip header
  return csvRows.slice(1).map((cols) => ({
    id: cols[0] || "",
    title: cols[1] || "",
    date: cols[2] || "",
    category: cols[3] || "",
    tags: cols[4] || "",
    summary: cols[5] || "",
    primarySource: cols[6] || "",
    sourceUrl: cols[7] || "",
    citation: cols[8] || "",
    court: cols[9] || "",
    blogCredit: cols[10] || "",
    blogUrl: cols[11] || "",
  }));
}

function buildItem(row: Row): string {
  // Build a useful description: summary + citation + source link
  const descParts: string[] = [];
  if (row.summary) descParts.push(`<p>${escapeXml(row.summary)}</p>`);
  if (row.citation)
    descParts.push(`<p><strong>Citation:</strong> ${escapeXml(row.citation)}</p>`);
  if (row.court) descParts.push(`<p><strong>Court:</strong> ${escapeXml(row.court)}</p>`);
  if (row.primarySource)
    descParts.push(`<p><strong>Source:</strong> ${escapeXml(row.primarySource)}</p>`);

  const description = descParts.join("");
  const link = row.sourceUrl || row.blogUrl || `${SITE_URL}/#${row.id}`;
  const guid = row.id ? `${SITE_URL}/#item-${row.id}` : link;
  const categories = row.category
    ? row.category
        .split(",")
        .map((c) => c.trim())
        .filter(Boolean)
        .map((c) => `<category>${escapeXml(c)}</category>`)
        .join("")
    : "";

  return `<item>
  <title>${escapeXml(row.title)}</title>
  <link>${escapeXml(link)}</link>
  <guid isPermaLink="false">${escapeXml(guid)}</guid>
  <pubDate>${toRfc822(row.date)}</pubDate>
  ${categories}
  <description>${cdata(description)}</description>
</item>`;
}

export async function GET() {
  try {
    const res = await fetch(SHEET_CSV_URL, { next: { revalidate: 3600 } });
    if (!res.ok) {
      return new NextResponse(`Failed to fetch sheet: ${res.status}`, {
        status: 502,
      });
    }
    const csv = await res.text();
    const rows = rowsToItems(parseCSV(csv));

    // Sort by date desc, take top N. Items with unparseable dates fall to the end.
    rows.sort((a, b) => {
      const da = new Date(a.date).getTime() || 0;
      const db = new Date(b.date).getTime() || 0;
      return db - da;
    });
    const items = rows.slice(0, ITEM_LIMIT);

    const lastBuild = items[0] ? toRfc822(items[0].date) : new Date().toUTCString();

    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
<channel>
  <title>${escapeXml(FEED_TITLE)}</title>
  <link>${SITE_URL}</link>
  <description>${escapeXml(FEED_DESC)}</description>
  <language>en-us</language>
  <lastBuildDate>${lastBuild}</lastBuildDate>
  <atom:link href="${FEED_URL}" rel="self" type="application/rss+xml" />
  ${items.map(buildItem).join("\n  ")}
</channel>
</rss>`;

    return new NextResponse(xml, {
      headers: {
        "Content-Type": "application/rss+xml; charset=utf-8",
        "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400",
      },
    });
  } catch (err) {
    console.error("Feed generation error:", err);
    return new NextResponse("Feed generation failed", { status: 500 });
  }
}
