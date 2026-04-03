"use client";

import { useState, useMemo, useCallback } from "react";
import Image from "next/image";
import {
  Search,
  X,
  ExternalLink,
  Scale,
  Gavel,
  BookOpen,
  FileText,
  ScrollText,
  TrendingUp,
  Newspaper,
  GraduationCap,
  ShieldAlert,
  AlertTriangle,
  Calendar,
  Tag,
  ChevronDown,
  ChevronUp,
  Share2,
  Landmark,
  Shield,
  Building2,
  Clock,
} from "lucide-react";
import type { UpdateItem } from "@/lib/types";

// ─────────────────────────────────────────────
// Category configuration
// ─────────────────────────────────────────────
type IconComponent = typeof Scale;

const categoryConfig: Record<string, { label: string; icon: IconComponent; color: string }> = {
  virginia_code: { label: "Virginia Code", icon: ScrollText, color: "bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300" },
  case_law: { label: "Case Law", icon: Gavel, color: "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300" },
  supreme_court_us: { label: "SCOTUS", icon: Scale, color: "bg-purple-100 text-purple-800 dark:bg-purple-900/40 dark:text-purple-300" },
  court_rules: { label: "Court Rules", icon: FileText, color: "bg-slate-100 text-slate-800 dark:bg-slate-800/40 dark:text-slate-300" },
  ethics_opinion: { label: "Ethics Opinion", icon: BookOpen, color: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300" },
  vsb_update: { label: "VA State Bar", icon: GraduationCap, color: "bg-indigo-100 text-indigo-800 dark:bg-indigo-900/40 dark:text-indigo-300" },
  attorney_discipline: { label: "Attorney Discipline", icon: ShieldAlert, color: "bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300" },
  news: { label: "News", icon: Newspaper, color: "bg-sky-100 text-sky-800 dark:bg-sky-900/40 dark:text-sky-300" },
  study: { label: "Study", icon: TrendingUp, color: "bg-teal-100 text-teal-800 dark:bg-teal-900/40 dark:text-teal-300" },
  trend: { label: "Trend", icon: AlertTriangle, color: "bg-orange-100 text-orange-800 dark:bg-orange-900/40 dark:text-orange-300" },
  retirement_erisa: { label: "Retirement / ERISA", icon: Landmark, color: "bg-violet-100 text-violet-800 dark:bg-violet-900/40 dark:text-violet-300" },
  military_family: { label: "Military Family", icon: Shield, color: "bg-cyan-100 text-cyan-800 dark:bg-cyan-900/40 dark:text-cyan-300" },
  federal_employee: { label: "Federal Employee", icon: Building2, color: "bg-rose-100 text-rose-800 dark:bg-rose-900/40 dark:text-rose-300" },
};

const tagLabels: Record<string, string> = {
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
  qdro: "QDRO",
  erisa: "ERISA",
  pension: "Pension",
  retirement: "Retirement",
  tsp: "TSP",
  fers: "FERS",
  csrs: "CSRS",
  sbp: "SBP",
  fehb: "FEHB",
  fegli: "FEGLI",
  military: "Military",
  deployment: "Deployment",
  scra: "SCRA",
  usfspa: "USFSPA",
  tricare: "TRICARE",
  bah: "BAH",
  veterans: "Veterans",
  security_clearance: "Security Clearance",
  federal_benefits: "Federal Benefits",
  locality_pay: "Locality Pay",
  government_shutdown: "Gov't Shutdown",
  doge: "DOGE/RIF",
  survivor_benefits: "Survivor Benefits",
  defined_benefit: "Defined Benefit",
  defined_contribution: "Defined Contribution",
  class_action: "Class Action",
  fiduciary: "Fiduciary",
  valuation: "Valuation",
};

function getTagLabel(tag: string): string {
  return tagLabels[tag.toLowerCase()] || tag.replace(/_/g, " ");
}

// ─────────────────────────────────────────────
// Date helpers
// ─────────────────────────────────────────────
function formatDate(dateStr: string): string {
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    return d.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  } catch {
    return dateStr;
  }
}

function formatLastUpdated(iso: string): string {
  try {
    const d = new Date(iso);
    return d.toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  } catch {
    return iso;
  }
}

// ─────────────────────────────────────────────
// UpdateCard component
// ─────────────────────────────────────────────
function UpdateCard({
  item,
  onTagClick,
}: {
  item: UpdateItem;
  onTagClick: (tag: string) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const config = categoryConfig[item.category] || {
    label: item.category.replace(/_/g, " "),
    icon: FileText,
    color: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300",
  };
  const Icon = config.icon;

  const handleShare = useCallback(() => {
    const lines: string[] = [item.title, ""];
    if (item.citation) lines.push(item.citation, "");
    lines.push(item.summary, "");
    lines.push(`Source: ${item.sourceName}`);
    lines.push(item.sourceUrl);
    if (item.blogCredit && item.blogUrl) {
      lines.push("", `Via ${item.blogCredit}: ${item.blogUrl}`);
    } else if (item.blogCredit) {
      lines.push("", `Via ${item.blogCredit}`);
    }
    const text = lines.join("\n");

    if (typeof navigator !== "undefined" && navigator.share) {
      navigator.share({ text }).catch(() => {});
    } else if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(text).then(() => {
        alert("Copied to clipboard");
      }).catch(() => {});
    }
  }, [item]);

  return (
    <div
      className="p-4 rounded-lg bg-card border border-border/60 transition-all duration-200 hover:shadow-md group"
      data-testid={`card-update-${item.id}`}
    >
      <div className="flex items-start gap-3">
        <div className={`flex items-center justify-center w-8 h-8 rounded-md shrink-0 mt-0.5 ${config.color}`}>
          <Icon className="w-4 h-4" />
        </div>
        <div className="min-w-0 flex-1">
          {/* Badges row */}
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <span className={`inline-flex items-center text-[10px] px-1.5 py-0 font-medium rounded-sm ${config.color}`}>
              {config.label}
            </span>
            {item.court && (
              <span className="text-[10px] px-1.5 py-0 font-normal rounded-sm border border-border bg-transparent text-muted-foreground">
                {item.court}
              </span>
            )}
            <span className="text-[11px] text-muted-foreground flex items-center gap-1 ml-auto shrink-0">
              <Calendar className="w-3 h-3" />
              {formatDate(item.date)}
            </span>
          </div>

          {/* Title */}
          <h3 className="text-[13px] font-semibold leading-snug mb-1.5 text-foreground">
            {item.title}
          </h3>

          {/* Summary */}
          <p
            className={`text-[12.5px] leading-relaxed text-muted-foreground ${
              expanded ? "" : "line-clamp-3"
            }`}
          >
            {item.summary}
          </p>

          {item.summary.length > 200 && (
            <button
              onClick={() => setExpanded(!expanded)}
              className="text-[11px] text-primary hover:underline mt-1 flex items-center gap-0.5"
              data-testid={`button-expand-${item.id}`}
            >
              {expanded ? (
                <>Show less <ChevronUp className="w-3 h-3" /></>
              ) : (
                <>Read more <ChevronDown className="w-3 h-3" /></>
              )}
            </button>
          )}

          {/* Citation */}
          {item.citation && (
            <p className="text-[11px] text-muted-foreground/70 mt-1.5 font-mono">
              {item.citation}
            </p>
          )}

          {/* Tags */}
          {item.tags.length > 0 && (
            <div className="flex items-center gap-1.5 flex-wrap mt-2.5">
              {item.tags.map((t) => (
                <button
                  key={t}
                  onClick={() => onTagClick(t)}
                  className="inline-flex items-center gap-0.5 text-[10px] px-1.5 py-0.5 rounded-full bg-muted hover:bg-muted/80 text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                  data-testid={`tag-${t}`}
                >
                  <Tag className="w-2.5 h-2.5" />
                  {getTagLabel(t)}
                </button>
              ))}
            </div>
          )}

          {/* Footer: source links + share */}
          <div className="flex items-center gap-3 mt-2.5 pt-2 border-t border-border/40">
            {item.sourceUrl ? (
              <a
                href={item.sourceUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-[11px] font-medium text-primary hover:underline"
                data-testid={`link-source-${item.id}`}
              >
                <ExternalLink className="w-3 h-3" />
                {item.sourceName || "Source"}
              </a>
            ) : item.sourceName ? (
              <span className="text-[11px] text-muted-foreground">{item.sourceName}</span>
            ) : null}

            {item.blogCredit && (
              item.blogUrl ? (
                <a
                  href={item.blogUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[10px] text-muted-foreground/60 hover:text-muted-foreground hover:underline"
                >
                  via {item.blogCredit}
                </a>
              ) : (
                <span className="text-[10px] text-muted-foreground/60">
                  via {item.blogCredit}
                </span>
              )
            )}

            <button
              onClick={handleShare}
              className="inline-flex items-center gap-1 text-[11px] text-muted-foreground/60 hover:text-primary transition-colors ml-auto"
              data-testid={`button-share-${item.id}`}
              title="Share this update"
            >
              <Share2 className="w-3 h-3" />
              <span className="hidden sm:inline">Share</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// StatCard component
// ─────────────────────────────────────────────
function StatCard({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: number;
  icon: IconComponent;
}) {
  return (
    <div className="flex items-center gap-3 p-3 rounded-lg bg-card border border-border/50">
      <div className="flex items-center justify-center w-9 h-9 rounded-md bg-primary/10 text-primary">
        <Icon className="w-4 h-4" />
      </div>
      <div>
        <p className="text-xl font-bold tabular-nums lining-nums leading-none">{value}</p>
        <p className="text-[11px] text-muted-foreground mt-0.5">{label}</p>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// Main Dashboard
// ─────────────────────────────────────────────
interface DashboardProps {
  items: UpdateItem[];
  fetchedAt: string;
  activeCategory: string;
  onCategoryChange: (cat: string) => void;
}

export function Dashboard({ items, fetchedAt, activeCategory, onCategoryChange }: DashboardProps) {
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [activeTag, setActiveTag] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState<20 | 50>(20);

  // Reset page when filters change
  const resetPage = useCallback(() => setCurrentPage(1), []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setSearch(searchInput);
    resetPage();
  };

  const handleClearSearch = () => {
    setSearchInput("");
    setSearch("");
    resetPage();
  };

  const handleTagClick = (t: string) => {
    setActiveTag((prev) => (prev === t ? null : t));
    resetPage();
  };

  const handleCategoryChange = (cat: string) => {
    onCategoryChange(cat);
    setActiveTag(null);
    resetPage();
  };

  const clearFilters = () => {
    onCategoryChange("all");
    setActiveTag(null);
    setSearch("");
    setSearchInput("");
    resetPage();
  };

  // Compute category counts
  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const item of items) {
      counts[item.category] = (counts[item.category] || 0) + 1;
    }
    return counts;
  }, [items]);

  // Filter items
  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      if (activeCategory !== "all" && item.category !== activeCategory) return false;
      if (activeTag && !item.tags.includes(activeTag)) return false;
      if (search) {
        const q = search.toLowerCase();
        const searchable = [
          item.title,
          item.summary,
          item.citation ?? "",
          item.tags.join(" "),
          item.searchTags,
        ]
          .join(" ")
          .toLowerCase();
        if (!searchable.includes(q)) return false;
      }
      return true;
    });
  }, [items, activeCategory, activeTag, search]);

  // Compute popular tags from filtered items (or all items if no filter)
  const popularTags = useMemo(() => {
    const tagCounts: Record<string, number> = {};
    const source = activeCategory !== "all" || activeTag || search ? filteredItems : items;
    for (const item of source) {
      for (const t of item.tags) {
        tagCounts[t] = (tagCounts[t] || 0) + 1;
      }
    }
    return Object.entries(tagCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 12)
      .map(([key, count]) => ({ key, count, label: getTagLabel(key) }));
  }, [items, filteredItems, activeCategory, activeTag, search]);

  // Pagination
  const totalItems = filteredItems.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const safeCurrentPage = Math.min(currentPage, totalPages);
  const startIdx = (safeCurrentPage - 1) * pageSize;
  const endIdx = Math.min(startIdx + pageSize, totalItems);
  const pageItems = filteredItems.slice(startIdx, endIdx);

  const getPageNumbers = (): (number | "...")[] => {
    const pages: (number | "...")[] = [];
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      pages.push(1);
      if (safeCurrentPage > 3) pages.push("...");
      for (
        let i = Math.max(2, safeCurrentPage - 1);
        i <= Math.min(totalPages - 1, safeCurrentPage + 1);
        i++
      ) {
        pages.push(i);
      }
      if (safeCurrentPage < totalPages - 2) pages.push("...");
      pages.push(totalPages);
    }
    return pages;
  };

  const scrollTop = () => {
    if (typeof window !== "undefined") {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const activeFilterCount =
    (activeCategory !== "all" ? 1 : 0) + (activeTag ? 1 : 0) + (search ? 1 : 0);

  return (
    <div className="p-4 md:p-6 max-w-[1200px] mx-auto space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2 sm:gap-4">
        <div className="min-w-0">
          <Image
            src="/logo-wordmark.png"
            alt="VFL Toolkit"
            width={160}
            height={32}
            className="h-7 sm:h-8 w-auto object-contain object-left"
            priority
          />
          <p className="text-[12px] sm:text-[13px] text-muted-foreground mt-0.5">
            Code updates, case law, ethics opinions, bar news, and practice trends
          </p>
        </div>
        {fetchedAt && (
          <div
            className="flex items-center gap-1.5 text-[11px] text-muted-foreground/70 whitespace-nowrap shrink-0"
            data-testid="text-last-updated"
          >
            <Clock className="w-3 h-3" />
            <span>Updated {formatLastUpdated(fetchedAt)}</span>
          </div>
        )}
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-3 md:grid-cols-6 gap-2">
        <StatCard label="Total" value={items.length} icon={FileText} />
        <StatCard
          label="Legislation"
          value={(categoryCounts.virginia_code || 0) + (categoryCounts.court_rules || 0)}
          icon={ScrollText}
        />
        <StatCard
          label="Case Law"
          value={(categoryCounts.case_law || 0) + (categoryCounts.supreme_court_us || 0)}
          icon={Gavel}
        />
        <StatCard label="Retirement" value={categoryCounts.retirement_erisa || 0} icon={Landmark} />
        <StatCard label="Military" value={categoryCounts.military_family || 0} icon={Shield} />
        <StatCard label="Federal" value={categoryCounts.federal_employee || 0} icon={Building2} />
      </div>

      {/* Search Bar */}
      <form onSubmit={handleSearch} className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
        <input
          type="search"
          placeholder="Search updates... e.g. 'child custody', 'spousal support reform', 'AI ethics'"
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          className="w-full pl-9 pr-20 h-10 text-[13px] bg-card border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent placeholder:text-muted-foreground"
          data-testid="input-search"
        />
        <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
          {searchInput && (
            <button
              type="button"
              className="inline-flex items-center justify-center h-6 w-6 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
              onClick={handleClearSearch}
              data-testid="button-clear-search"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
          <button
            type="submit"
            className="h-7 px-3 text-[12px] rounded-md bg-primary text-primary-foreground hover:bg-primary/90 transition-colors font-medium"
            data-testid="button-search"
          >
            Search
          </button>
        </div>
      </form>

      {/* Active Filters */}
      {activeFilterCount > 0 && (
        <div className="flex flex-wrap items-center gap-2">
          <button
            className="h-6 px-2 text-[11px] rounded-md text-destructive hover:text-destructive hover:bg-muted transition-colors flex items-center gap-0.5"
            onClick={clearFilters}
            data-testid="button-clear-filters"
          >
            <X className="w-3 h-3 mr-0.5" />
            Clear filters
          </button>
          {activeCategory !== "all" && (
            <span className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full bg-secondary text-secondary-foreground">
              {categoryConfig[activeCategory]?.label || activeCategory}
              <button
                onClick={() => handleCategoryChange("all")}
                className="ml-0.5 hover:bg-muted-foreground/20 rounded-full p-0.5"
              >
                <X className="w-2.5 h-2.5" />
              </button>
            </span>
          )}
          {activeTag && (
            <span className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full bg-secondary text-secondary-foreground">
              <Tag className="w-2.5 h-2.5" />
              {getTagLabel(activeTag)}
              <button
                onClick={() => setActiveTag(null)}
                className="ml-0.5 hover:bg-muted-foreground/20 rounded-full p-0.5"
              >
                <X className="w-2.5 h-2.5" />
              </button>
            </span>
          )}
          {search && (
            <span className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full bg-secondary text-secondary-foreground">
              &ldquo;{search}&rdquo;
              <button
                onClick={handleClearSearch}
                className="ml-0.5 hover:bg-muted-foreground/20 rounded-full p-0.5"
              >
                <X className="w-2.5 h-2.5" />
              </button>
            </span>
          )}
        </div>
      )}

      {/* Tag Cloud */}
      {popularTags.length > 0 && !activeTag && (
        <div className="flex flex-wrap gap-1.5">
          {popularTags.map((t) => (
            <button
              key={t.key}
              onClick={() => handleTagClick(t.key)}
              className="inline-flex items-center gap-1 text-[11px] px-2 py-1 rounded-full border border-border/60 bg-card hover:bg-accent/20 hover:border-accent/50 text-muted-foreground hover:text-foreground transition-colors"
              data-testid={`filter-tag-${t.key}`}
            >
              {t.label}
              <span className="text-[9px] opacity-50">{t.count}</span>
            </button>
          ))}
        </div>
      )}

      {/* Results */}
      {totalItems === 0 ? (
        <div className="text-center py-16">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-muted mb-3">
            <Search className="w-5 h-5 text-muted-foreground" />
          </div>
          <h3 className="text-sm font-medium mb-1">No results found</h3>
          <p className="text-[12px] text-muted-foreground mb-3">
            Try adjusting your filters or search terms
          </p>
          <button
            className="h-8 px-4 text-[12px] rounded-md border border-border bg-transparent hover:bg-muted transition-colors"
            onClick={clearFilters}
            data-testid="button-reset-filters"
          >
            Reset all filters
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {/* Results count + page size selector */}
          <div className="flex items-center justify-between">
            <p className="text-[11px] text-muted-foreground">
              Showing {startIdx + 1}–{endIdx} of {totalItems} update{totalItems !== 1 ? "s" : ""}
            </p>
            <div className="flex items-center gap-1.5">
              <span className="text-[11px] text-muted-foreground">Per page:</span>
              {([20, 50] as const).map((size) => (
                <button
                  key={size}
                  onClick={() => {
                    setPageSize(size);
                    setCurrentPage(1);
                  }}
                  className={`text-[11px] px-2 py-0.5 rounded-md transition-colors ${
                    pageSize === size
                      ? "bg-primary text-primary-foreground font-medium"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted"
                  }`}
                  data-testid={`button-pagesize-${size}`}
                >
                  {size}
                </button>
              ))}
            </div>
          </div>

          {/* Cards */}
          {pageItems.map((item) => (
            <UpdateCard key={item.id} item={item} onTagClick={handleTagClick} />
          ))}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-1 pt-3 pb-4">
              <button
                className="inline-flex items-center justify-center h-8 w-8 p-0 rounded-md border border-border bg-transparent text-muted-foreground hover:bg-muted hover:text-foreground disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                onClick={() => {
                  setCurrentPage((p) => Math.max(1, p - 1));
                  scrollTop();
                }}
                disabled={safeCurrentPage === 1}
                data-testid="button-page-prev"
              >
                <ChevronUp className="w-3.5 h-3.5 -rotate-90" />
              </button>

              {getPageNumbers().map((pg, idx) =>
                pg === "..." ? (
                  <span key={`ellipsis-${idx}`} className="text-[12px] text-muted-foreground px-1">
                    …
                  </span>
                ) : (
                  <button
                    key={pg}
                    className={`inline-flex items-center justify-center h-8 w-8 p-0 text-[12px] rounded-md border transition-colors ${
                      safeCurrentPage === pg
                        ? "bg-primary text-primary-foreground border-primary font-medium"
                        : "border-border bg-transparent text-muted-foreground hover:bg-muted hover:text-foreground"
                    }`}
                    onClick={() => {
                      setCurrentPage(pg as number);
                      scrollTop();
                    }}
                    data-testid={`button-page-${pg}`}
                  >
                    {pg}
                  </button>
                )
              )}

              <button
                className="inline-flex items-center justify-center h-8 w-8 p-0 rounded-md border border-border bg-transparent text-muted-foreground hover:bg-muted hover:text-foreground disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                onClick={() => {
                  setCurrentPage((p) => Math.min(totalPages, p + 1));
                  scrollTop();
                }}
                disabled={safeCurrentPage === totalPages}
                data-testid="button-page-next"
              >
                <ChevronDown className="w-3.5 h-3.5 -rotate-90" />
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
