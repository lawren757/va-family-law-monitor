import { promises as fs } from "fs";
import path from "path";
import type { LawUpdate, UpdatesResponse } from "./types";

const DATA_PATH = path.join(process.cwd(), "data", "updates.json");

const PAGE_SIZE = 20;

export async function getUpdates(
  category?: string,
  tag?: string | null,
  search?: string,
  page: number = 1
): Promise<UpdatesResponse> {
  let items: LawUpdate[] = [];

  try {
    const raw = await fs.readFile(DATA_PATH, "utf-8");
    items = JSON.parse(raw);
  } catch {
    items = [];
  }

  // Sort by date descending
  items.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  // Compute totals before filtering
  const allCategories: Record<string, number> = {};
  const allTags: Record<string, number> = {};

  for (const item of items) {
    allCategories[item.category] = (allCategories[item.category] || 0) + 1;
    for (const t of item.tags) {
      allTags[t] = (allTags[t] || 0) + 1;
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

  const filteredTotal = items.length;
  const totalPages = Math.max(1, Math.ceil(filteredTotal / PAGE_SIZE));
  const safePage = Math.max(1, Math.min(page, totalPages));
  const start = (safePage - 1) * PAGE_SIZE;
  const paginatedItems = items.slice(start, start + PAGE_SIZE);

  return {
    items: paginatedItems,
    total,
    filteredTotal,
    page: safePage,
    totalPages,
    categories: allCategories,
    tags: allTags,
  };
}

export async function saveUpdates(updates: LawUpdate[]): Promise<void> {
  // Read existing updates
  let existing: LawUpdate[] = [];
  try {
    const raw = await fs.readFile(DATA_PATH, "utf-8");
    existing = JSON.parse(raw);
  } catch {
    existing = [];
  }

  // Deduplicate by id
  const existingIds = new Set(existing.map((e) => e.id));
  const newUpdates = updates.filter((u) => !existingIds.has(u.id));

  const merged = [...newUpdates, ...existing];
  await fs.writeFile(DATA_PATH, JSON.stringify(merged, null, 2));
}
