import { NextRequest, NextResponse } from "next/server";
import {
  GoogleGenerativeAI,
  HarmBlockThreshold,
  HarmCategory,
} from "@google/generative-ai";

export interface ResearchedItem {
  title: string;
  summary: string;
  date: string;
  category: string;
  tags: string[];
  source_name: string;
  source_url: string;
  citation: string | null;
  court: string | null;
  blog_credit: string | null;
  pinned: boolean;
}

const SYSTEM_PROMPT = `You are a legal research assistant specializing in Virginia family law.
Your task is to identify recent developments in Virginia family law that would be relevant to
Virginia family law attorneys. Focus on:

1. Virginia Code changes (legislation signed or effective in the last 90 days)
2. Notable Virginia case law (Court of Appeals of Virginia, Supreme Court of Virginia)
3. SCOTUS decisions affecting family law
4. Virginia Supreme Court Rules amendments
5. Virginia State Bar ethics opinions
6. VSB attorney discipline orders
7. Relevant legal news, studies, and trends

For each item found, return a JSON object matching this schema exactly:
{
  "title": "Concise, informative title (max 120 chars)",
  "summary": "2-4 sentence summary with key legal details, citations where available",
  "date": "YYYY-MM-DD (effective date, decision date, or publication date)",
  "category": one of: virginia_code | case_law | supreme_court_us | court_rules | ethics_opinion | vsb_update | attorney_discipline | news | study | trend,
  "tags": array of applicable tags from: custody, child_support, divorce, equitable_distribution, spousal_support, domestic_violence, adoption, guardianship, property_division, marriage, child_welfare, coparenting, mental_health, financial, demographics, parenting_time, relocation, ethics, malpractice, ai_in_law, trust_accounts, advertising, competence, confidentiality, conflicts, technology, disciplinary, fees,
  "source_name": "Official source name",
  "source_url": "Direct URL to the primary source document",
  "citation": "Legal citation if applicable, null otherwise",
  "court": "Court name if case law, null otherwise",
  "blog_credit": "BlogName|https://url if found via a law blog, null otherwise",
  "pinned": false
}

Return a JSON array of items. Only include items from the last 90 days with verifiable sources.`;

export async function POST(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!process.env.GEMINI_API_KEY) {
    return NextResponse.json({ error: "GEMINI_API_KEY not configured" }, { status: 500 });
  }

  try {
    const body = await request.json().catch(() => ({}));
    const customPrompt = body.prompt || "";

    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({
      model: "gemini-2.0-flash",
      safetySettings: [
        { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_NONE },
        { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_NONE },
      ],
      generationConfig: {
        temperature: 0.1,
        topP: 0.95,
        maxOutputTokens: 8192,
        responseMimeType: "application/json",
      },
    });

    const today = new Date().toISOString().split("T")[0];
    const ninetyDaysAgo = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000)
      .toISOString()
      .split("T")[0];

    const userPrompt = `
Today's date: ${today}
Research period: ${ninetyDaysAgo} to ${today}

${customPrompt ? `Additional focus: ${customPrompt}\n\n` : ""}
Search for recent Virginia family law developments in this period.
Use Google Search to find current information from:
- lis.virginia.gov (Virginia legislative information)
- law.lis.virginia.gov (Virginia code)
- courts.virginia.gov (Virginia court rules and opinions)
- vsb.org (Virginia State Bar)
- Legal news sites covering Virginia family law

Return results as a JSON array. Include 5-15 items. Quality over quantity.
`;

    const result = await model.generateContent([
      { text: SYSTEM_PROMPT },
      { text: userPrompt },
    ]);

    const responseText = result.response.text();

    let items: ResearchedItem[] = [];
    try {
      const parsed = JSON.parse(responseText);
      items = Array.isArray(parsed) ? parsed : parsed.items || [];
    } catch {
      const match = responseText.match(/\[[\s\S]*\]/);
      if (match) {
        items = JSON.parse(match[0]);
      } else {
        throw new Error("Could not parse JSON from Gemini response");
      }
    }

    const validItems = items.filter(
      (item) => item.title && item.category && item.source_url && item.date
    );

    return NextResponse.json({
      success: true,
      items: validItems,
      count: validItems.length,
      model: "gemini-2.0-flash",
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("[/api/research] Error:", error);
    return NextResponse.json(
      {
        error: "Research pipeline failed",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    status: "ok",
    model: "gemini-2.0-flash",
    description: "POST with Authorization: Bearer $CRON_SECRET to trigger research",
  });
}
