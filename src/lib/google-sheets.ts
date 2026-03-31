import { google, sheets_v4 } from "googleapis";

export interface SheetItem {
  id?: number;
  title: string;
  summary?: string | null;
  date?: string | null;
  category?: string | null;
  tags?: string[];
  source_name?: string | null;
  source_url?: string | null;
  citation?: string | null;
  court?: string | null;
  blog_credit?: string | null;
  pinned?: boolean;
}

const SHEET_TAB = process.env.GOOGLE_SHEETS_TAB || "Sheet1";

const COLUMNS = {
  ID: 0,
  TITLE: 1,
  SUMMARY: 2,
  DATE: 3,
  CATEGORY: 4,
  TAGS: 5,
  SOURCE_NAME: 6,
  SOURCE_URL: 7,
  CITATION: 8,
  COURT: 9,
  BLOG_CREDIT: 10,
  PINNED: 11,
  CREATED_AT: 12,
} as const;

const NUM_COLUMNS = Object.keys(COLUMNS).length;

function getAuth() {
  const serviceAccountJson = process.env.GOOGLE_SERVICE_ACCOUNT_JSON;
  if (!serviceAccountJson) {
    throw new Error("GOOGLE_SERVICE_ACCOUNT_JSON environment variable is not set.");
  }

  let credentials: object;
  try {
    credentials = JSON.parse(serviceAccountJson);
  } catch {
    throw new Error("GOOGLE_SERVICE_ACCOUNT_JSON is not valid JSON");
  }

  return new google.auth.GoogleAuth({
    credentials,
    scopes: ["https://www.googleapis.com/auth/spreadsheets"],
  });
}

function getSheetsClient(): Promise<sheets_v4.Sheets> {
  const auth = getAuth();
  return Promise.resolve(google.sheets({ version: "v4", auth }));
}

function getSpreadsheetId(): string {
  const id = process.env.GOOGLE_SHEETS_ID;
  if (!id) {
    throw new Error("GOOGLE_SHEETS_ID environment variable is not set.");
  }
  return id;
}

export async function getLastId(): Promise<number> {
  const sheets = await getSheetsClient();
  const spreadsheetId = getSpreadsheetId();

  const res = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range: `${SHEET_TAB}!A:A`,
  });

  const values = res.data.values || [];
  let maxId = 0;
  for (let i = 1; i < values.length; i++) {
    const val = parseInt(values[i][0] || "0", 10);
    if (!isNaN(val) && val > maxId) {
      maxId = val;
    }
  }
  return maxId;
}

export async function addRows(items: SheetItem[]): Promise<number> {
  if (!items || items.length === 0) return 0;

  const sheets = await getSheetsClient();
  const spreadsheetId = getSpreadsheetId();
  const lastId = await getLastId();
  let nextId = lastId + 1;

  const rows: (string | number | boolean)[][] = items.map((item) => {
    const row = new Array(NUM_COLUMNS).fill("");
    row[COLUMNS.ID] = item.id ?? nextId++;
    row[COLUMNS.TITLE] = item.title ?? "";
    row[COLUMNS.SUMMARY] = item.summary ?? "";
    row[COLUMNS.DATE] = item.date ?? "";
    row[COLUMNS.CATEGORY] = item.category ?? "";
    row[COLUMNS.TAGS] = Array.isArray(item.tags) ? item.tags.join(", ") : item.tags ?? "";
    row[COLUMNS.SOURCE_NAME] = item.source_name ?? "";
    row[COLUMNS.SOURCE_URL] = item.source_url ?? "";
    row[COLUMNS.CITATION] = item.citation ?? "";
    row[COLUMNS.COURT] = item.court ?? "";
    row[COLUMNS.BLOG_CREDIT] = item.blog_credit ?? "";
    row[COLUMNS.PINNED] = item.pinned ? "TRUE" : "FALSE";
    row[COLUMNS.CREATED_AT] = new Date().toISOString();
    return row;
  });

  const range = `${SHEET_TAB}!A:${columnLetter(NUM_COLUMNS - 1)}`;

  await sheets.spreadsheets.values.append({
    spreadsheetId,
    range,
    valueInputOption: "USER_ENTERED",
    requestBody: { values: rows },
  });

  return rows.length;
}

export async function initSheet(): Promise<void> {
  const sheets = await getSheetsClient();
  const spreadsheetId = getSpreadsheetId();

  const res = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range: `${SHEET_TAB}!A1:A1`,
  });

  if (res.data.values && res.data.values.length > 0) {
    console.log("[google-sheets] Sheet already has data, skipping header init");
    return;
  }

  const headers = [
    "ID", "Title", "Summary", "Date", "Category", "Tags",
    "Source Name", "Source URL", "Citation", "Court", "Blog Credit",
    "Pinned", "Created At",
  ];

  await sheets.spreadsheets.values.update({
    spreadsheetId,
    range: `${SHEET_TAB}!A1:${columnLetter(headers.length - 1)}1`,
    valueInputOption: "USER_ENTERED",
    requestBody: { values: [headers] },
  });

  console.log("[google-sheets] Header row created");
}

export async function getAllRows(): Promise<Record<string, string>[]> {
  const sheets = await getSheetsClient();
  const spreadsheetId = getSpreadsheetId();

  const res = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range: `${SHEET_TAB}!A:${columnLetter(NUM_COLUMNS - 1)}`,
  });

  const rows = res.data.values || [];
  if (rows.length < 2) return [];

  const headers = rows[0];
  return rows.slice(1).map((row) => {
    const obj: Record<string, string> = {};
    for (let i = 0; i < headers.length; i++) {
      obj[headers[i]] = row[i] || "";
    }
    return obj;
  });
}

function columnLetter(index: number): string {
  let letter = "";
  let n = index;
  while (n >= 0) {
    letter = String.fromCharCode((n % 26) + 65) + letter;
    n = Math.floor(n / 26) - 1;
  }
  return letter;
}
