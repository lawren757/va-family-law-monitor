#!/usr/bin/env npx tsx
/**
 * scripts/backfill-normalize.ts
 *
 * One-time pass over the existing sheet to apply category and source
 * normalization to every row. Safe to run multiple times — idempotent.
 *
 * Usage:
 *   npx tsx scripts/backfill-normalize.ts --dry-run  (preview changes)
 *   npx tsx scripts/backfill-normalize.ts            (apply changes)
 *
 * Environment:
 *   GOOGLE_SHEETS_KEY  - service account JSON string
 */

import { google } from "googleapis";
import { normalizeCategory, normalizeSource } from "./normalize";

const SHEET_ID = "1wYwCPa4tSXOuWwlfWGzq9Cd1pZGprMj6zyVJXOFacMM";
const SHEET_RANGE = "Sheet1!A:M";

const DRY_RUN = process.argv.includes("--dry-run");

if (!process.env.GOOGLE_SHEETS_KEY) {
  console.error("GOOGLE_SHEETS_KEY required");
  process.exit(1);
}

interface RowChange {
  rowNum: number;
  id: string;
  field: "Category" | "Primary Source";
  before: string;
  after: string;
}

async function main() {
  console.log(`\nVFL Toolkit Backfill Normalizer ${DRY_RUN ? "(DRY RUN)" : ""}`);
  console.log("=".repeat(60));

  const auth = new google.auth.GoogleAuth({
    credentials: JSON.parse(process.env.GOOGLE_SHEETS_KEY!),
    scopes: ["https://www.googleapis.com/auth/spreadsheets"],
  });
  const sheets = google.sheets({ version: "v4", auth });

  // Read all rows
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: SHEET_ID,
    range: SHEET_RANGE,
  });
  const rows = res.data.values || [];
  if (rows.length < 2) {
    console.log("No data rows found.");
    return;
  }

  console.log(`Loaded ${rows.length - 1} data rows.\n`);

  const changes: RowChange[] = [];
  // Column indices: 0=ID, 1=Title, 2=Date, 3=Category, 4=Tags, 5=Summary,
  //                 6=Primary Source, 7=Source URL, 8=Citation, 9=Court,
  //                 10=Blog Credit, 11=Blog URL, 12=Search Tags
  for (let i = 1; i < rows.length; i++) {
    const row = rows[i];
    const id = row[0] || String(i);

    // Category (column D, index 3)
    const oldCat = row[3] || "";
    const newCat = normalizeCategory(oldCat);
    if (newCat !== oldCat) {
      changes.push({
        rowNum: i + 1,
        id,
        field: "Category",
        before: oldCat,
        after: newCat,
      });
    }

    // Primary Source (column G, index 6)
    const oldSrc = row[6] || "";
    const newSrc = normalizeSource(oldSrc);
    if (newSrc !== oldSrc) {
      changes.push({
        rowNum: i + 1,
        id,
        field: "Primary Source",
        before: oldSrc,
        after: newSrc,
      });
    }
  }

  console.log(`Proposed changes: ${changes.length}`);
  if (changes.length === 0) {
    console.log("Sheet is already normalized. ✓");
    return;
  }

  // Group by field for readable output
  const byField = changes.reduce<Record<string, RowChange[]>>((acc, c) => {
    (acc[c.field] = acc[c.field] || []).push(c);
    return acc;
  }, {});

  for (const [field, items] of Object.entries(byField)) {
    console.log(`\n${field}: ${items.length} changes`);
    // Show unique before→after pairs
    const pairs = new Map<string, number>();
    for (const c of items) {
      const key = `"${c.before}" → "${c.after}"`;
      pairs.set(key, (pairs.get(key) || 0) + 1);
    }
    for (const [pair, count] of [...pairs.entries()].sort((a, b) => b[1] - a[1])) {
      console.log(`  ${count.toString().padStart(3)}× ${pair}`);
    }
  }

  if (DRY_RUN) {
    console.log("\n--dry-run: no changes written. Re-run without flag to apply.");
    return;
  }

  // Apply changes via batchUpdate. Each cell update is one BatchUpdateRequest.
  console.log(`\nApplying ${changes.length} changes...`);
  const data = changes.map((c) => {
    const col = c.field === "Category" ? "D" : "G";
    return {
      range: `Sheet1!${col}${c.rowNum}`,
      values: [[c.after]],
    };
  });

  const updateRes = await sheets.spreadsheets.values.batchUpdate({
    spreadsheetId: SHEET_ID,
    requestBody: {
      valueInputOption: "USER_ENTERED",
      data,
    },
  });

  console.log(
    `Updated ${updateRes.data.totalUpdatedCells || 0} cells across ${
      updateRes.data.totalUpdatedRows || 0
    } rows.`
  );
}

main().catch((err) => {
  console.error("Fatal:", err);
  process.exit(1);
});
