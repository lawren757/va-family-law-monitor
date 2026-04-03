import { UpdateItem } from "./types";

/**
 * Minimal but robust CSV parser that handles:
 * - Quoted fields with embedded commas and newlines
 * - Escaped quotes ("")
 * - Windows and Unix line endings
 */
export function parseCSV(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let inQuotes = false;
  let i = 0;

  while (i < text.length) {
    const ch = text[i];

    if (inQuotes) {
      if (ch === '"') {
        // Peek ahead — "" means escaped quote
        if (text[i + 1] === '"') {
          field += '"';
          i += 2;
          continue;
        } else {
          inQuotes = false;
          i++;
          continue;
        }
      } else {
        field += ch;
        i++;
        continue;
      }
    }

    // Not in quotes
    if (ch === '"') {
      inQuotes = true;
      i++;
      continue;
    }

    if (ch === ',') {
      row.push(field);
      field = "";
      i++;
      continue;
    }

    if (ch === '\r') {
      // Handle \r\n or lone \r
      row.push(field);
      field = "";
      rows.push(row);
      row = [];
      if (text[i + 1] === '\n') i++;
      i++;
      continue;
    }

    if (ch === '\n') {
      row.push(field);
      field = "";
      rows.push(row);
      row = [];
      i++;
      continue;
    }

    field += ch;
    i++;
  }

  // Trailing field/row
  if (field || row.length > 0) {
    row.push(field);
    rows.push(row);
  }

  return rows;
}

function col(row: string[], idx: number): string {
  return (row[idx] ?? "").trim();
}

/**
 * Parse date string for sorting. Handles ISO (2025-07-01) and text (March 2026).
 */
export function parseDateForSort(dateStr: string): number {
  if (!dateStr) return 0;

  // Try ISO first
  const iso = new Date(dateStr);
  if (!isNaN(iso.getTime())) return iso.getTime();

  // Try "Month Year" format e.g. "March 2026"
  const monthYear = /^(\w+)\s+(\d{4})$/i.exec(dateStr.trim());
  if (monthYear) {
    const d = new Date(`${monthYear[1]} 1, ${monthYear[2]}`);
    if (!isNaN(d.getTime())) return d.getTime();
  }

  // Try "Q1 2025" etc.
  const quarter = /^Q(\d)\s+(\d{4})$/i.exec(dateStr.trim());
  if (quarter) {
    const month = (parseInt(quarter[1]) - 1) * 3;
    return new Date(parseInt(quarter[2]), month, 1).getTime();
  }

  return 0;
}

/**
 * Normalize category string from the CSV to a known key.
 */
function normalizeCategory(raw: string): string {
  const s = raw.trim().toLowerCase();
  const map: Record<string, string> = {
    "virginia code": "virginia_code",
    "virginia_code": "virginia_code",
    "case law": "case_law",
    "case_law": "case_law",
    "scotus": "supreme_court_us",
    "supreme court us": "supreme_court_us",
    "supreme_court_us": "supreme_court_us",
    "court rules": "court_rules",
    "court_rules": "court_rules",
    "ethics opinion": "ethics_opinion",
    "ethics opinions": "ethics_opinion",
    "ethics_opinion": "ethics_opinion",
    "va state bar": "vsb_update",
    "vsb": "vsb_update",
    "vsb_update": "vsb_update",
    "attorney discipline": "attorney_discipline",
    "attorney_discipline": "attorney_discipline",
    "retirement": "retirement_erisa",
    "retirement / erisa": "retirement_erisa",
    "retirement/erisa": "retirement_erisa",
    "retirement_erisa": "retirement_erisa",
    "erisa": "retirement_erisa",
    "military family": "military_family",
    "military_family": "military_family",
    "military": "military_family",
    "federal employee": "federal_employee",
    "federal employees": "federal_employee",
    "federal_employee": "federal_employee",
    "news": "news",
    "study": "study",
    "studies": "study",
    "trend": "trend",
    "trends": "trend",
  };
  return map[s] || s.replace(/\s+/g, "_");
}

/**
 * Parse tags from a comma/semicolon separated string, normalize them.
 */
function parseTags(raw: string): string[] {
  if (!raw.trim()) return [];
  return raw
    .split(/[,;]+/)
    .map((t) => t.trim().toLowerCase().replace(/\s+/g, "_"))
    .filter(Boolean);
}

/**
 * Convert CSV text to UpdateItem array.
 * Expected columns (0-indexed):
 * 0: ID, 1: Title, 2: Date, 3: Category, 4: Tags, 5: Summary,
 * 6: Primary Source, 7: Source URL, 8: Citation, 9: Court,
 * 10: Blog Credit, 11: Blog URL, 12: Search Tags
 */
export function csvToItems(csvText: string): UpdateItem[] {
  const rows = parseCSV(csvText);
  if (rows.length < 2) return [];

  // Skip header row (row[0])
  const items: UpdateItem[] = [];

  for (let i = 1; i < rows.length; i++) {
    const row = rows[i];
    // Skip entirely empty rows
    if (row.every((c) => !c.trim())) continue;

    const id = col(row, 0) || String(i);
    const title = col(row, 1);
    const date = col(row, 2);
    const category = normalizeCategory(col(row, 3));
    const tagsRaw = col(row, 4);
    const summary = col(row, 5);
    const sourceName = col(row, 6);
    const sourceUrl = col(row, 7);
    const citation = col(row, 8) || null;
    const court = col(row, 9) || null;
    const blogCredit = col(row, 10) || null;
    const blogUrl = col(row, 11) || null;
    const searchTags = col(row, 12);

    if (!title && !summary) continue;

    items.push({
      id,
      title,
      date,
      category,
      tags: parseTags(tagsRaw),
      summary,
      sourceName,
      sourceUrl,
      citation,
      court,
      blogCredit,
      blogUrl,
      searchTags,
    });
  }

  // Sort most recent first
  items.sort((a, b) => parseDateForSort(b.date) - parseDateForSort(a.date));

  return items;
}
