import { cookies } from "next/headers";
import { csvToItems } from "@/lib/parse-csv";
import { AppShell } from "@/components/app-shell";

const CSV_URL =
  "https://docs.google.com/spreadsheets/d/1wYwCPa4tSXOuWwlfWGzq9Cd1pZGprMj6zyVJXOFacMM/gviz/tq?tqx=out:csv";

// Revalidate every 5 minutes (ISR)
export const revalidate = 300;

async function fetchItems() {
  try {
    const res = await fetch(CSV_URL, {
      next: { revalidate: 300 },
    });
    if (!res.ok) throw new Error(`CSV fetch failed: ${res.status}`);
    const text = await res.text();
    return csvToItems(text);
  } catch (err) {
    console.error("Failed to fetch CSV:", err);
    return [];
  }
}

export default async function Home() {
  const items = await fetchItems();
  const fetchedAt = new Date().toISOString();

  // Read theme cookie for SSR
  const cookieStore = cookies();
  const themeCookie = cookieStore.get("vfl-theme")?.value;
  const initialTheme: "dark" | "light" =
    themeCookie === "light" ? "light" : "dark";

  return (
    <AppShell
      items={items}
      fetchedAt={fetchedAt}
      initialTheme={initialTheme}
    />
  );
}
