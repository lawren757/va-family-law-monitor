import { promises as fs } from "fs";
import path from "path";

const usePostgres = !!process.env.POSTGRES_URL;

export interface UpdateItem {
  id: number;
  title: string;
  summary: string;
  date: string;
  category: string;
  tags: string[];
  sourceName: string;
  sourceUrl: string;
  citation: string | null;
  court: string | null;
  blogCredit: string | null;
  pinned: boolean;
}

export interface UpdatesResponse {
  items: UpdateItem[];
  total: number;
  categories: Record<string, number>;
  tags: Record<string, number>;
}

interface InsertItem {
  title: string;
  summary?: string;
  date?: string;
  category: string;
  tags?: string[];
  source_name?: string;
  source_url?: string;
  citation?: string | null;
  court?: string | null;
  blog_credit?: string | null;
  pinned?: boolean;
}

// ─── JSON fallback helpers ──────────────────────────────────────────────────

const DATA_PATH = path.join(process.cwd(), "data", "updates.json");

interface SeedJson {
  _meta?: unknown;
  items?: RawJsonItem[];
}

interface RawJsonItem {
  id: number;
  title: string;
  summary: string;
  date: string;
  category: string;
  tags: string[];
  source_name?: string;
  source_url?: string;
  sourceName?: string;
  sourceUrl?: string;
  citation?: string | null;
  court?: string | null;
  blog_credit?: string | null;
  blogCredit?: string | null;
  search_tags?: string;
  pinned?: boolean;
}

function normalizeItem(raw: RawJsonItem): UpdateItem {
  return {
    id: raw.id,
    title: raw.title,
    summary: raw.summary,
    date: raw.date,
    category: raw.category,
    tags: raw.tags || [],
    sourceName: raw.sourceName || raw.source_name || "",
    sourceUrl: raw.sourceUrl || raw.source_url || "",
    citation: raw.citation || null,
    court: raw.court || null,
    blogCredit: raw.blogCredit || raw.blog_credit || null,
    pinned: raw.pinned || false,
  };
}

async function readJsonItems(): Promise<UpdateItem[]> {
  try {
    const raw = await fs.readFile(DATA_PATH, "utf-8");
    const parsed = JSON.parse(raw);
    // Handle both array format and { _meta, items } format
    const arr: RawJsonItem[] = Array.isArray(parsed) ? parsed : parsed.items || [];
    return arr.map(normalizeItem);
  } catch {
    return [];
  }
}

async function writeJsonItems(items: UpdateItem[]): Promise<void> {
  await fs.writeFile(DATA_PATH, JSON.stringify(items, null, 2));
}

// ─── Postgres helpers ───────────────────────────────────────────────────────

async function getPostgresClient() {
  const { Pool } = await import("@neondatabase/serverless");
  const pool = new Pool({ connectionString: process.env.POSTGRES_URL });
  return pool;
}

// ─── Public API ─────────────────────────────────────────────────────────────

export async function getUpdates(options?: {
  category?: string | null;
  tag?: string | null;
  search?: string | null;
  scope?: string | null;
  sort?: string | null;
}): Promise<UpdatesResponse> {
  const { category, tag, search, scope, sort } = options || {};

  if (usePostgres) {
    return getUpdatesPostgres({ category, tag, search, scope, sort });
  }
  return getUpdatesJson({ category, tag, search, sort });
}

async function getUpdatesPostgres(options: {
  category?: string | null;
  tag?: string | null;
  search?: string | null;
  scope?: string | null;
  sort?: string | null;
}): Promise<UpdatesResponse> {
  const { category, tag, search, scope, sort } = options;
  const client = await getPostgresClient();

  const conditions: string[] = [];
  const values: string[] = [];
  let paramIdx = 1;

  if (category && category !== "all") {
    conditions.push(`category = $${paramIdx++}`);
    values.push(category);
  }
  if (tag) {
    conditions.push(`$${paramIdx++} = ANY(tags)`);
    values.push(tag);
  }
  if (scope) {
    conditions.push(`search_tags ILIKE $${paramIdx++}`);
    values.push(`%${scope}%`);
  }
  if (search) {
    const terms = search.trim().split(/\s+/).filter(Boolean);
    for (const term of terms) {
      conditions.push(
        `(title ILIKE $${paramIdx} OR summary ILIKE $${paramIdx} OR search_tags ILIKE $${paramIdx} OR citation ILIKE $${paramIdx})`
      );
      values.push(`%${term}%`);
      paramIdx++;
    }
  }

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";
  const orderClause = sort === "oldest" ? "ORDER BY date ASC NULLS LAST" : "ORDER BY date DESC NULLS LAST";

  const queryStr = `
    SELECT id, title, summary, date, category, tags,
           source_name AS "sourceName", source_url AS "sourceUrl",
           citation, court, blog_credit AS "blogCredit", pinned
    FROM updates ${whereClause} ${orderClause}
  `;

  const { rows } = await client.query(queryStr, values);

  // Category/tag counts
  const { rows: allRows } = await client.query(
    `SELECT category, tags FROM updates ${whereClause}`,
    values
  );

  const categories: Record<string, number> = {};
  const tags: Record<string, number> = {};
  for (const row of allRows) {
    categories[row.category] = (categories[row.category] || 0) + 1;
    if (Array.isArray(row.tags)) {
      for (const t of row.tags) {
        tags[t] = (tags[t] || 0) + 1;
      }
    }
  }

  return { items: rows, total: rows.length, categories, tags };
}

async function getUpdatesJson(options: {
  category?: string | null;
  tag?: string | null;
  search?: string | null;
  sort?: string | null;
}): Promise<UpdatesResponse> {
  const { category, tag, search, sort } = options;
  let items = await readJsonItems();

  // Sort
  items.sort((a, b) => {
    const diff = new Date(b.date).getTime() - new Date(a.date).getTime();
    return sort === "oldest" ? -diff : diff;
  });

  // Compute totals before filtering
  const categories: Record<string, number> = {};
  const tags: Record<string, number> = {};
  for (const item of items) {
    categories[item.category] = (categories[item.category] || 0) + 1;
    for (const t of item.tags) {
      tags[t] = (tags[t] || 0) + 1;
    }
  }
  const total = items.length;

  // Apply filters
  if (category && category !== "all") {
    items = items.filter((i) => i.category === category);
  }
  if (tag) {
    items = items.filter((i) => i.tags.includes(tag));
  }
  if (search) {
    const q = search.toLowerCase();
    items = items.filter(
      (i) =>
        i.title.toLowerCase().includes(q) ||
        i.summary.toLowerCase().includes(q) ||
        (i.citation && i.citation.toLowerCase().includes(q)) ||
        i.tags.some((t) => t.toLowerCase().includes(q))
    );
  }

  return { items, total, categories, tags };
}

export async function insertUpdate(item: InsertItem): Promise<number> {
  if (usePostgres) {
    const { neon } = await import("@neondatabase/serverless");
    const sql = neon(process.env.POSTGRES_URL!);
    const searchTags = [...(item.tags || []), item.category, item.court || ""]
      .filter(Boolean)
      .join(" ");

    const tagsArray = `{${(item.tags || []).join(",")}}`;
    const rows = await sql`
      INSERT INTO updates
        (title, summary, date, category, tags, source_name, source_url,
         citation, court, blog_credit, search_tags, pinned)
      VALUES
        (${item.title}, ${item.summary || ""}, ${item.date || new Date().toISOString().split("T")[0]},
         ${item.category}, ${tagsArray}::text[],
         ${item.source_name || ""}, ${item.source_url || ""},
         ${item.citation || null}, ${item.court || null},
         ${item.blog_credit || null}, ${searchTags}, ${item.pinned || false})
      RETURNING id
    `;
    return (rows[0] as { id: number }).id;
  }

  // JSON fallback
  const items = await readJsonItems();
  const maxId = items.reduce((max, i) => Math.max(max, i.id), 0);
  const newItem: UpdateItem = {
    id: maxId + 1,
    title: item.title,
    summary: item.summary || "",
    date: item.date || new Date().toISOString().split("T")[0],
    category: item.category,
    tags: item.tags || [],
    sourceName: item.source_name || "",
    sourceUrl: item.source_url || "",
    citation: item.citation || null,
    court: item.court || null,
    blogCredit: item.blog_credit || null,
    pinned: item.pinned || false,
  };
  items.unshift(newItem);
  await writeJsonItems(items);
  return newItem.id;
}

export async function getExistingUrls(urls: string[]): Promise<Set<string>> {
  if (usePostgres) {
    const { Pool } = await import("@neondatabase/serverless");
    const client = new Pool({ connectionString: process.env.POSTGRES_URL });
    const urlsArray = `{${urls.map((u) => `"${u.replace(/"/g, '\\"')}"`).join(",")}}`;
    const { rows } = await client.query(
      `SELECT source_url FROM updates WHERE source_url = ANY($1::text[])`,
      [urlsArray]
    );
    return new Set(rows.map((r) => r.source_url));
  }

  // JSON fallback
  const items = await readJsonItems();
  const allUrls = new Set(items.map((i) => i.sourceUrl));
  return new Set(urls.filter((u) => allUrls.has(u)));
}
