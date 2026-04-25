/**
 * scripts/normalize.ts
 *
 * Single source of truth for canonical Category and Primary Source values.
 * Used by update-sheet.ts (on append) and backfill-normalize.ts (one-time pass
 * over existing rows).
 *
 * Add a new variant here and it's automatically applied everywhere.
 */

// ── Canonical Categories ────────────────────────────────────────────────────
//
// These are the ONLY values that should ever appear in column D of the sheet.
// If a research item arrives with a category not in this list, it gets mapped
// via CATEGORY_ALIASES below or flagged as "Uncategorized" for manual review.

export const CANONICAL_CATEGORIES = [
  "Virginia Code",
  "Case Law",
  "Attorney Discipline",
  "Retirement / ERISA",
  "Military Family",
  "Federal Employee",
  "Court Rules",
  "SCOTUS",
  "News",
  "Study",
] as const;

export type CanonicalCategory = (typeof CANONICAL_CATEGORIES)[number];

// Maps observed variants (lowercase) → canonical value.
// Add new variants here as they appear in the wild.
const CATEGORY_ALIASES: Record<string, CanonicalCategory> = {
  // Virginia Code variants
  "virginia code": "Virginia Code",
  "virginia code & legislation": "Virginia Code",
  "virginia code updates": "Virginia Code",
  "virginia code update": "Virginia Code",
  "va code": "Virginia Code",
  "legislation": "Virginia Code",
  "virginia legislation": "Virginia Code",

  // Case Law variants
  "case law": "Case Law",
  "caselaw": "Case Law",
  "court decision": "Case Law",
  "court decisions": "Case Law",
  "virginia case law": "Case Law",

  // Attorney Discipline (absorbs Ethics Opinions and VA State Bar)
  "attorney discipline": "Attorney Discipline",
  "vsb discipline": "Attorney Discipline",
  "va state bar": "Attorney Discipline",
  "virginia state bar": "Attorney Discipline",
  "ethics opinion": "Attorney Discipline",
  "ethics opinions": "Attorney Discipline",
  "legal ethics": "Attorney Discipline",
  "leo": "Attorney Discipline",

  // Retirement / ERISA
  "retirement / erisa": "Retirement / ERISA",
  "retirement/erisa": "Retirement / ERISA",
  "retirement and erisa": "Retirement / ERISA",
  "erisa": "Retirement / ERISA",
  "retirement": "Retirement / ERISA",
  "qdro": "Retirement / ERISA",

  // Military Family
  "military family": "Military Family",
  "military": "Military Family",
  "military divorce": "Military Family",

  // Federal Employee
  "federal employee": "Federal Employee",
  "federal employees": "Federal Employee",
  "federal worker": "Federal Employee",

  // Court Rules
  "court rules": "Court Rules",
  "rules of court": "Court Rules",
  "scv rules": "Court Rules",

  // SCOTUS (kept distinct from Case Law because the audience cares)
  "scotus": "SCOTUS",
  "u.s. supreme court": "SCOTUS",
  "us supreme court": "SCOTUS",
  "supreme court of the united states": "SCOTUS",

  // News
  "news": "News",
  "trends": "News",
  "news & trends": "News",
  "news and trends": "News",

  // Studies
  "study": "Study",
  "studies": "Study",
  "research": "Study",
  "report": "Study",
};

/**
 * Normalize a category string to its canonical form.
 * Returns the original string with a "(uncategorized)" prefix if no match —
 * makes anomalies visible in the sheet rather than silently dropped.
 */
export function normalizeCategory(raw: string): string {
  if (!raw) return "Uncategorized";
  const key = raw.toLowerCase().trim();
  const canonical = CATEGORY_ALIASES[key];
  if (canonical) return canonical;

  // Try splitting on commas — "Custody, Domestic Violence" → first canonical match
  if (raw.includes(",")) {
    const parts = raw.split(",").map((p) => p.trim().toLowerCase());
    for (const part of parts) {
      if (CATEGORY_ALIASES[part]) return CATEGORY_ALIASES[part];
    }
  }

  return `Uncategorized: ${raw}`;
}

// ── Canonical Sources ───────────────────────────────────────────────────────

export const CANONICAL_SOURCES = [
  "Virginia General Assembly (LIS)",
  "Virginia State Bar",
  "Virginia Supreme Court",
  "Virginia Court of Appeals",
  "U.S. Supreme Court",
  "U.S. Court of Appeals (4th Circuit)",
  "Virginia Lawyers Weekly",
  "Internal Revenue Service",
  "Department of Labor",
  "Office of Personnel Management",
  "Defense Finance and Accounting Service",
  "Thrift Savings Plan",
  "Virginia Retirement System",
] as const;

const SOURCE_ALIASES: Record<string, string> = {
  // VA General Assembly / LIS — collapse all the bill-specific variants
  "virginia general assembly": "Virginia General Assembly (LIS)",
  "virginia general assembly / lis": "Virginia General Assembly (LIS)",
  "virginia legislative information system": "Virginia General Assembly (LIS)",
  "virginia legislative information system (lis)": "Virginia General Assembly (LIS)",
  "lis": "Virginia General Assembly (LIS)",
  "va lis": "Virginia General Assembly (LIS)",
  "virginia lis": "Virginia General Assembly (LIS)",

  // VSB
  "virginia state bar": "Virginia State Bar",
  "vsb": "Virginia State Bar",
  "virginia state bar — disciplinary system actions": "Virginia State Bar",
  "virginia state bar - disciplinary system actions": "Virginia State Bar",
  "virginia state bar — news and resources": "Virginia State Bar",
  "virginia state bar - news and resources": "Virginia State Bar",

  // Courts
  "virginia supreme court": "Virginia Supreme Court",
  "supreme court of virginia": "Virginia Supreme Court",
  "virginia court of appeals": "Virginia Court of Appeals",
  "virginia court of appeals / justia": "Virginia Court of Appeals",
  "u.s. supreme court": "U.S. Supreme Court",
  "us supreme court": "U.S. Supreme Court",
  "scotus": "U.S. Supreme Court",
  "fourth circuit": "U.S. Court of Appeals (4th Circuit)",
  "4th circuit": "U.S. Court of Appeals (4th Circuit)",
  "u.s. court of appeals for the fourth circuit": "U.S. Court of Appeals (4th Circuit)",

  // Publications
  "virginia lawyers weekly": "Virginia Lawyers Weekly",
  "vlw": "Virginia Lawyers Weekly",

  // Federal agencies
  "irs": "Internal Revenue Service",
  "internal revenue service": "Internal Revenue Service",
  "dol": "Department of Labor",
  "department of labor": "Department of Labor",
  "opm": "Office of Personnel Management",
  "office of personnel management": "Office of Personnel Management",
  "dfas": "Defense Finance and Accounting Service",
  "defense finance and accounting service": "Defense Finance and Accounting Service",
  "tsp": "Thrift Savings Plan",
  "thrift savings plan": "Thrift Savings Plan",
  "vrs": "Virginia Retirement System",
  "virginia retirement system": "Virginia Retirement System",
};

/**
 * Normalize a Primary Source string.
 * Strips "— bill number" suffixes ("Virginia LIS — HB942" → "Virginia General Assembly (LIS)").
 * Returns the original if no match (no prefix added — sources are noisier than categories
 * and we'd rather preserve the value than mark it).
 */
export function normalizeSource(raw: string): string {
  if (!raw) return "";
  // Strip em-dash / hyphen suffixes that carry bill or doc numbers
  const stripped = raw.replace(/\s*[—–-]\s*[A-Z]{1,3}\s*\d+.*$/i, "").trim();
  const key = stripped.toLowerCase().trim();
  return SOURCE_ALIASES[key] || raw.trim();
}

// ── Date Normalization ──────────────────────────────────────────────────────

/**
 * Coerce a date to ISO YYYY-MM-DD where possible.
 * Falls back to the original string for "Q1 2026" or other non-coercible forms,
 * but logs a warning so you can fix them in the source.
 */
export function normalizeDate(raw: string): { iso: string | null; original: string } {
  if (!raw) return { iso: null, original: "" };
  const trimmed = raw.trim();

  // Already ISO
  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
    return { iso: trimmed, original: trimmed };
  }

  // "Month YYYY" → first of that month
  const monthYear = trimmed.match(/^([A-Za-z]+)\s+(\d{4})$/);
  if (monthYear) {
    const date = new Date(`${monthYear[1]} 1, ${monthYear[2]}`);
    if (!isNaN(date.getTime())) {
      return { iso: date.toISOString().split("T")[0], original: trimmed };
    }
  }

  // Try Date.parse as a last resort
  const parsed = new Date(trimmed);
  if (!isNaN(parsed.getTime()) && parsed.getFullYear() > 2000) {
    return { iso: parsed.toISOString().split("T")[0], original: trimmed };
  }

  return { iso: null, original: trimmed };
}

// ── Tag Tightening ──────────────────────────────────────────────────────────

/**
 * Tightened version of generateSearchTags from update-sheet.ts.
 * Key change: only matches legal terms that appear in TITLE or first sentence
 * of summary, not anywhere in the document. Eliminates the over-tagging issue
 * (e.g. child support bills getting tagged "qdro" because the term appears
 * deep in a tangentially related passage).
 */
export function generateSearchTagsTight(item: {
  title: string;
  category: string;
  tags?: string[];
  summary?: string;
  citation?: string | null;
  court?: string | null;
}): string {
  const { title, category, tags = [], summary = "", citation, court } = item;
  const phrases: string[] = [];

  // Title (cleaned)
  const titleClean = title
    .replace(/HB\s*\d+|SB\s*\d+/gi, "")
    .replace(/[^\w\s]/g, " ")
    .trim()
    .toLowerCase();
  if (titleClean) phrases.push(titleClean);

  // First sentence of summary only (not the whole thing)
  const firstSentence = summary.split(/(?<=[.!?])\s+/)[0] || "";

  // Category-specific phrases
  const catPhrases: Record<string, string[]> = {
    "Virginia Code": ["virginia family law statute", "virginia code amendment"],
    "Case Law": ["virginia family law case", "virginia court ruling"],
    "Attorney Discipline": ["virginia bar discipline", "vsb ethics"],
    "Retirement / ERISA": ["qdro virginia", "retirement benefits divorce"],
    "Military Family": ["military divorce virginia", "usfspa"],
    "Federal Employee": ["federal employee divorce", "fers divorce"],
    "SCOTUS": ["supreme court family law"],
    "News": ["virginia family law news"],
    "Court Rules": ["virginia court rules"],
    "Study": ["family law research"],
  };
  phrases.push(...(catPhrases[category] || []).slice(0, 2));

  // Provided tags as readable phrases
  tags.slice(0, 5).forEach((t) => phrases.push(t.replace(/_/g, " ")));

  // Legal terms — but ONLY matched against title + first sentence
  // This is the fix for the over-tagging problem.
  const matchableText = `${titleClean} ${firstSentence}`.toLowerCase();
  const legalTerms = [
    "equitable distribution",
    "child support",
    "spousal support",
    "alimony",
    "custody",
    "visitation",
    "divorce",
    "separation",
    "property division",
    "qdro",
    "erisa",
    "military divorce",
    "usfspa",
    "federal employee",
    "fers",
    "csrs",
    "retirement",
    "pension",
    "protective order",
    "domestic violence",
    "adoption",
    "termination of parental rights",
    "guardian ad litem",
    "attorney fees",
    "contempt",
  ];
  const matchedTerms = legalTerms.filter((term) => matchableText.includes(term));
  phrases.push(...matchedTerms);

  // Code section / bill / case citations from summary (these stay full-text)
  const codeSections = summary.match(/Va\.\s*Code\s*§\s*[\d.-]+/gi) || [];
  phrases.push(...codeSections.slice(0, 2));
  const billNums = summary.match(/[HS]B\s*\d{3,5}/gi) || [];
  phrases.push(...billNums.slice(0, 2));

  if (citation) phrases.push(citation);
  if (court) phrases.push(court.toLowerCase());

  const unique = [
    ...new Set(
      phrases
        .join(" | ")
        .split(/\s*\|\s*/)
        .map((p) => p.trim().toLowerCase())
        .filter((p) => p.length > 3)
    ),
  ];

  return unique.join(" | ").slice(0, 500);
}

// ── CLI usage for manual testing ────────────────────────────────────────────
if (require.main === module) {
  const tests = [
    { fn: normalizeCategory, input: "Virginia Code & Legislation" },
    { fn: normalizeCategory, input: "VA State Bar" },
    { fn: normalizeCategory, input: "Custody, Domestic Violence" },
    { fn: normalizeCategory, input: "Trends" },
    { fn: normalizeCategory, input: "Some New Category" },
    { fn: normalizeSource, input: "Virginia LIS — HB942" },
    { fn: normalizeSource, input: "Virginia State Bar — Disciplinary System Actions" },
    { fn: normalizeSource, input: "Virginia General Assembly / LIS" },
    { fn: normalizeDate, input: "March 2026" },
    { fn: normalizeDate, input: "2025-07-01" },
    { fn: normalizeDate, input: "Q1 2026" },
  ];
  for (const t of tests) {
    console.log(`${t.fn.name}("${t.input}") →`, t.fn(t.input as any));
  }
}
