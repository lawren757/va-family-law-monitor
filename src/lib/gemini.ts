import { GoogleGenerativeAI } from "@google/generative-ai";
import type { LawUpdate, Category } from "./types";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

const PROMPT = `You are a Virginia family law research assistant. Find the most recent and significant Virginia family law developments from TODAY or the past few days. Return a JSON array of updates.

Each update must have this exact structure:
{
  "id": "unique-kebab-case-id",
  "title": "Clear, concise title",
  "summary": "2-4 sentence summary of the development and its significance for Virginia family law practitioners",
  "category": one of: "virginia_code", "case_law", "supreme_court_us", "court_rules", "ethics_opinion", "vsb_update", "attorney_discipline", "news", "study", "trend",
  "tags": array of relevant tags from: "custody", "child_support", "divorce", "equitable_distribution", "spousal_support", "domestic_violence", "adoption", "guardianship", "property_division", "marriage", "child_welfare", "coparenting", "mental_health", "financial", "demographics", "parenting_time", "relocation", "ethics", "malpractice", "ai_in_law", "trust_accounts", "advertising", "competence", "confidentiality", "conflicts", "technology", "disciplinary", "fees",
  "date": "YYYY-MM-DD",
  "citation": "Va. Code Ann. § X-Y.Z" or case citation if applicable,
  "court": court name if applicable,
  "scope": "statewide" or specific jurisdiction,
  "sourceUrl": "https://...",
  "sourceName": "Source name"
}

IMPORTANT: Only use reputable, authoritative sources. Prioritize these specific sources:
- Virginia Lawyers Weekly (valawyersweekly.com) — especially the "Domestic Relations" section
- Supreme Court of Virginia (vacourts.gov)
- Supreme Court of the United States (supremecourt.gov)
- Virginia State Bar (vsb.org)
- Virginia local and regional bar associations (e.g., Fairfax Bar, Richmond Bar, Virginia Beach Bar, etc.)
- Virginia Legislative Information System (lis.virginia.gov) — for code amendments and legislative updates
- Virginia Court of Appeals
- Law school publications (e.g., University of Virginia Law, William & Mary Law, Washington and Lee Law, George Mason / Antonin Scalia Law School, University of Richmond Law, Regent University Law)
- Peer-reviewed academic journals and research studies on family law
- ABA Family Law Section publications
- National Center for State Courts

DO NOT use blogs, social media, Wikipedia, or unverified sources.

Focus on:
1. Recent Virginia Code amendments affecting family law (Title 20, 16.1, 63.2)
2. Virginia Court of Appeals and Supreme Court of Virginia family law decisions
3. U.S. Supreme Court decisions affecting family law
4. Virginia court rule changes
5. Virginia State Bar ethics opinions relevant to family law
6. VSB disciplinary actions against family law practitioners
7. Virginia Lawyers Weekly domestic relations coverage
8. News articles about Virginia family law from reputable legal publications
9. Academic studies on family law topics from law reviews and peer-reviewed journals
10. Practice trends in Virginia family law

Return 15-25 updates. Use real, verifiable sources with accurate URLs. Format dates as YYYY-MM-DD. Return ONLY the JSON array, no other text.`;

export async function fetchUpdatesFromGemini(): Promise<LawUpdate[]> {
  const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

  const result = await model.generateContent(PROMPT);
  const text = result.response.text();

  // Extract JSON from the response (handle markdown code blocks)
  const jsonMatch = text.match(/\[[\s\S]*\]/);
  if (!jsonMatch) {
    throw new Error("No JSON array found in Gemini response");
  }

  const updates: LawUpdate[] = JSON.parse(jsonMatch[0]);

  // Validate and clean each update
  const validCategories: Category[] = [
    "virginia_code", "case_law", "supreme_court_us", "court_rules",
    "ethics_opinion", "vsb_update", "attorney_discipline", "news",
    "study", "trend",
  ];

  return updates
    .filter((u) => u.title && u.summary && validCategories.includes(u.category))
    .map((u, idx) => ({
      ...u,
      id: typeof u.id === "number" ? u.id : idx + 1,
      tags: Array.isArray(u.tags) ? u.tags : [],
      citation: u.citation ?? null,
      court: u.court ?? null,
      blogCredit: u.blogCredit ?? null,
      pinned: u.pinned ?? false,
    }));
}
