export type Category =
  | "virginia_code"
  | "case_law"
  | "supreme_court_us"
  | "court_rules"
  | "ethics_opinion"
  | "vsb_update"
  | "attorney_discipline"
  | "news"
  | "study"
  | "trend";

export interface LawUpdate {
  id: string;
  title: string;
  summary: string;
  category: Category;
  tags: string[];
  date: string;
  citation?: string;
  court?: string;
  scope?: string;
  sourceUrl: string;
  sourceName: string;
  blogCredit?: string;
}

export interface UpdatesResponse {
  items: LawUpdate[];
  total: number;
  filteredTotal: number;
  page: number;
  pageSize: number;
  totalPages: number;
  categories: Record<string, number>;
  tags: Record<string, number>;
  lastUpdated: string | null;
}

export const CATEGORY_META: Record<
  Category | "all",
  { label: string; icon: string; color: string; darkColor: string }
> = {
  all: {
    label: "All Updates",
    icon: "LayoutList",
    color: "bg-gray-600 text-white",
    darkColor: "dark:bg-gray-800/40 dark:text-gray-300",
  },
  virginia_code: {
    label: "Virginia Code",
    icon: "Scale",
    color: "bg-blue-600 text-white",
    darkColor: "dark:bg-blue-900/40 dark:text-blue-300",
  },
  case_law: {
    label: "Case Law",
    icon: "BookOpen",
    color: "bg-amber-600 text-white",
    darkColor: "dark:bg-amber-900/40 dark:text-amber-300",
  },
  supreme_court_us: {
    label: "SCOTUS",
    icon: "Landmark",
    color: "bg-purple-600 text-white",
    darkColor: "dark:bg-purple-900/40 dark:text-purple-300",
  },
  court_rules: {
    label: "Court Rules",
    icon: "Gavel",
    color: "bg-slate-600 text-white",
    darkColor: "dark:bg-slate-800/40 dark:text-slate-300",
  },
  ethics_opinion: {
    label: "Ethics Opinion",
    icon: "Shield",
    color: "bg-emerald-600 text-white",
    darkColor: "dark:bg-emerald-900/40 dark:text-emerald-300",
  },
  vsb_update: {
    label: "VA State Bar",
    icon: "Building2",
    color: "bg-indigo-600 text-white",
    darkColor: "dark:bg-indigo-900/40 dark:text-indigo-300",
  },
  attorney_discipline: {
    label: "Attorney Discipline",
    icon: "AlertTriangle",
    color: "bg-red-600 text-white",
    darkColor: "dark:bg-red-900/40 dark:text-red-300",
  },
  news: {
    label: "News",
    icon: "Newspaper",
    color: "bg-sky-600 text-white",
    darkColor: "dark:bg-sky-900/40 dark:text-sky-300",
  },
  study: {
    label: "Study",
    icon: "BarChart3",
    color: "bg-teal-600 text-white",
    darkColor: "dark:bg-teal-900/40 dark:text-teal-300",
  },
  trend: {
    label: "Trend",
    icon: "TrendingUp",
    color: "bg-orange-600 text-white",
    darkColor: "dark:bg-orange-900/40 dark:text-orange-300",
  },
};

export const TAG_LABELS: Record<string, string> = {
  custody: "Custody",
  child_support: "Child Support",
  divorce: "Divorce",
  equitable_distribution: "Equitable Distribution",
  spousal_support: "Spousal Support",
  domestic_violence: "Domestic Violence",
  adoption: "Adoption",
  guardianship: "Guardianship",
  property_division: "Property Division",
  marriage: "Marriage",
  child_welfare: "Child Welfare",
  coparenting: "Co-Parenting",
  mental_health: "Mental Health",
  financial: "Financial",
  demographics: "Demographics",
  parenting_time: "Parenting Time",
  relocation: "Relocation",
  ethics: "Ethics",
  malpractice: "Malpractice",
  ai_in_law: "AI in Law",
  trust_accounts: "Trust Accounts",
  advertising: "Advertising",
  competence: "Competence",
  confidentiality: "Confidentiality",
  conflicts: "Conflicts",
  technology: "Technology",
  disciplinary: "Disciplinary",
  fees: "Fees",
};
