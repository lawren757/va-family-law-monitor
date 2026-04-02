"use client";

import { useState, useMemo, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useFilterStore } from "@/components/providers/filter-provider";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
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
} from "lucide-react";

interface UpdateItem {
  id: number;
  title: string;
  summary: string;
  date: string;
  category: string;
  tags: string[];
  sourceName: string;
  sourceUrl: string;
  blogCredit: string | null;
  court: string | null;
  citation: string | null;
  scope: string | null;
  pinned: boolean;
}

interface ApiResponse {
  items: UpdateItem[];
  total: number;
  categories: Record<string, number>;
  tags: Record<string, number>;
}

const categoryConfig: Record<string, { label: string; icon: typeof Scale; color: string }> = {
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
};

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

function UpdateCard({
  item,
  onTagClick,
}: {
  item: UpdateItem;
  onTagClick: (tag: string) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const config = categoryConfig[item.category] || {
    label: item.category,
    icon: FileText,
    color: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300",
  };
  const Icon = config.icon;

  return (
    <Card className="p-4 transition-all duration-200 hover:shadow-md border-border/60 group">
      <div className="flex items-start gap-3">
        <div className={`flex items-center justify-center w-8 h-8 rounded-md shrink-0 mt-0.5 ${config.color}`}>
          <Icon className="w-4 h-4" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <Badge
              variant="secondary"
              className={`text-[10px] px-1.5 py-0 font-medium ${config.color} border-0`}
            >
              {config.label}
            </Badge>
            {item.court && (
              <Badge variant="outline" className="text-[10px] px-1.5 py-0 font-normal">
                {item.court}
              </Badge>
            )}
            <span className="text-[11px] text-muted-foreground flex items-center gap-1 ml-auto shrink-0">
              <Calendar className="w-3 h-3" />
              {formatDate(item.date)}
            </span>
          </div>

          <h3 className="text-[13px] font-semibold leading-snug mb-1.5 text-foreground">
            {item.title}
          </h3>

          <p className={`text-[12.5px] leading-relaxed text-muted-foreground ${expanded ? "" : "line-clamp-3"}`}>
            {item.summary}
          </p>

          {item.summary.length > 200 && (
            <button
              onClick={() => setExpanded(!expanded)}
              className="text-[11px] text-primary hover:underline mt-1 flex items-center gap-0.5"
            >
              {expanded ? (
                <>Show less <ChevronUp className="w-3 h-3" /></>
              ) : (
                <>Read more <ChevronDown className="w-3 h-3" /></>
              )}
            </button>
          )}

          {item.citation && (
            <p className="text-[11px] text-muted-foreground/70 mt-1.5 font-mono">
              {item.citation}
            </p>
          )}

          <div className="flex items-center gap-1.5 flex-wrap mt-2.5">
            {item.tags.map((t) => (
              <button
                key={t}
                onClick={() => onTagClick(t)}
                className="inline-flex items-center gap-0.5 text-[10px] px-1.5 py-0.5 rounded-full bg-muted hover:bg-muted/80 text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
              >
                <Tag className="w-2.5 h-2.5" />
                {tagLabels[t] || t.replace(/_/g, " ")}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-3 mt-2.5 pt-2 border-t border-border/40">
            <a
              href={item.sourceUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-[11px] font-medium text-primary hover:underline"
            >
              <ExternalLink className="w-3 h-3" />
              {item.sourceName}
            </a>
            {item.blogCredit && (() => {
              const parts = item.blogCredit.split("|");
              const name = parts[0];
              const url = parts[1];
              return url ? (
                <a
                  href={url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[10px] text-muted-foreground/60 hover:text-muted-foreground hover:underline"
                >
                  via {name}
                </a>
              ) : (
                <span className="text-[10px] text-muted-foreground/60">via {name}</span>
              );
            })()}
            <button
              onClick={() => {
                const lines: string[] = [item.title, ""];
                if (item.citation) lines.push(item.citation, "");
                lines.push(item.summary, "");
                lines.push(`Source: ${item.sourceName}`);
                lines.push(item.sourceUrl);
                if (item.blogCredit) {
                  const bp = item.blogCredit.split("|");
                  if (bp[1]) lines.push("", `Via ${bp[0]}: ${bp[1]}`);
                }
                const text = lines.join("\n");
                if (navigator.share) {
                  navigator.share({ text }).catch(() => {});
                } else {
                  navigator.clipboard.writeText(text).then(() => alert("Copied to clipboard")).catch(() => {});
                }
              }}
              className="inline-flex items-center gap-1 text-[11px] text-muted-foreground/60 hover:text-primary transition-colors ml-auto"
              title="Share this update"
            >
              <Share2 className="w-3 h-3" />
              <span className="hidden sm:inline">Share</span>
            </button>
          </div>
        </div>
      </div>
    </Card>
  );
}

function StatCard({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: number;
  icon: typeof Scale;
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

export default function Dashboard() {
  const { category, tag, search, setCategory, setTag, setSearch, clearFilters } =
    useFilterStore();
  const [searchInput, setSearchInput] = useState("");
  const [visibleCount, setVisibleCount] = useState(20);
  const PAGE_SIZE = 20;

  useEffect(() => {
    setVisibleCount(PAGE_SIZE);
  }, [category, tag, search]);

  const queryParams = new URLSearchParams();
  if (category !== "all") queryParams.set("category", category);
  if (tag) queryParams.set("tag", tag);
  if (search) queryParams.set("search", search);

  const { data, isLoading } = useQuery<ApiResponse>({
    queryKey: ["/api/updates", category, tag, search],
    queryFn: async () => {
      const res = await fetch(`/api/updates?${queryParams.toString()}`);
      if (!res.ok) throw new Error("Failed to fetch updates");
      return res.json();
    },
  });

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setSearch(searchInput);
    setVisibleCount(PAGE_SIZE);
  };

  const handleClearSearch = () => {
    setSearchInput("");
    setSearch("");
    setVisibleCount(PAGE_SIZE);
  };

  const handleTagClick = (t: string) => {
    if (tag === t) {
      setTag(null);
    } else {
      setTag(t);
    }
    setVisibleCount(PAGE_SIZE);
  };

  const activeFilterCount =
    (category !== "all" ? 1 : 0) + (tag ? 1 : 0) + (search ? 1 : 0);

  const popularTags = useMemo(() => {
    if (!data?.tags) return [];
    return Object.entries(data.tags)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 12)
      .map(([key, count]) => ({ key, count, label: tagLabels[key] || key.replace(/_/g, " ") }));
  }, [data?.tags]);

  return (
    <div className="p-4 md:p-6 max-w-[1200px] mx-auto space-y-5">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold tracking-tight">
          Virginia Family Law Monitor
        </h1>
        <p className="text-[13px] text-muted-foreground mt-1">
          Code updates, case law, ethics opinions, bar news, and practice trends
        </p>
        {!isLoading && data && data.items.length > 0 && (
          <p className="text-[11px] text-muted-foreground/70 mt-1 flex items-center gap-1">
            <Calendar className="w-3 h-3" />
            Last updated {formatDate(data.items.reduce((latest, item) => item.date > latest ? item.date : latest, data.items[0].date))}
          </p>
        )}
      </div>

      {/* Stats Row */}
      {!isLoading && data && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <StatCard label="Total Updates" value={data.total} icon={FileText} />
          <StatCard
            label="Legislation"
            value={(data.categories?.virginia_code || 0) + (data.categories?.court_rules || 0)}
            icon={ScrollText}
          />
          <StatCard
            label="Case Law"
            value={(data.categories?.case_law || 0) + (data.categories?.supreme_court_us || 0)}
            icon={Gavel}
          />
          <StatCard
            label="News & Studies"
            value={
              (data.categories?.news || 0) +
              (data.categories?.study || 0) +
              (data.categories?.trend || 0)
            }
            icon={TrendingUp}
          />
        </div>
      )}

      {/* Search Bar */}
      <form onSubmit={handleSearch} className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          type="search"
          placeholder="Search updates... e.g. 'child custody', 'spousal support reform', 'AI ethics'"
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          className="pl-9 pr-20 h-10 text-[13px] bg-card"
        />
        <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
          {searchInput && (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-6 w-6"
              onClick={handleClearSearch}
            >
              <X className="w-3.5 h-3.5" />
            </Button>
          )}
          <Button type="submit" size="sm" className="h-7 text-[12px] px-3">
            Search
          </Button>
        </div>
      </form>

      {/* Active Filters */}
      <div className="flex flex-wrap items-center gap-2">
        {activeFilterCount > 0 && (
          <Button
            variant="ghost"
            size="sm"
            className="h-6 text-[11px] px-2 text-destructive hover:text-destructive"
            onClick={clearFilters}
          >
            <X className="w-3 h-3 mr-0.5" />
            Clear filters
          </Button>
        )}
        {category !== "all" && (
          <Badge variant="secondary" className="text-[11px] gap-1 pr-1">
            {categoryConfig[category]?.label || category}
            <button
              onClick={() => setCategory("all")}
              className="ml-0.5 hover:bg-muted-foreground/20 rounded-full p-0.5"
            >
              <X className="w-2.5 h-2.5" />
            </button>
          </Badge>
        )}
        {tag && (
          <Badge variant="secondary" className="text-[11px] gap-1 pr-1">
            <Tag className="w-2.5 h-2.5" />
            {tagLabels[tag] || tag}
            <button
              onClick={() => setTag(null)}
              className="ml-0.5 hover:bg-muted-foreground/20 rounded-full p-0.5"
            >
              <X className="w-2.5 h-2.5" />
            </button>
          </Badge>
        )}
        {search && (
          <Badge variant="secondary" className="text-[11px] gap-1 pr-1">
            &ldquo;{search}&rdquo;
            <button
              onClick={handleClearSearch}
              className="ml-0.5 hover:bg-muted-foreground/20 rounded-full p-0.5"
            >
              <X className="w-2.5 h-2.5" />
            </button>
          </Badge>
        )}
      </div>

      {/* Tag Cloud */}
      {popularTags.length > 0 && !tag && (
        <div className="flex flex-wrap gap-1.5">
          {popularTags.map((t) => (
            <button
              key={t.key}
              onClick={() => handleTagClick(t.key)}
              className="inline-flex items-center gap-1 text-[11px] px-2 py-1 rounded-full border border-border/60 bg-card hover:bg-accent/20 hover:border-accent/50 text-muted-foreground hover:text-foreground transition-colors"
            >
              {t.label}
              <span className="text-[9px] opacity-50">{t.count}</span>
            </button>
          ))}
        </div>
      )}

      {/* Results */}
      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <Card key={i} className="p-4">
              <div className="flex gap-3">
                <Skeleton className="w-8 h-8 rounded-md shrink-0" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-3 w-3/4" />
                  <Skeleton className="h-3 w-1/2" />
                </div>
              </div>
            </Card>
          ))}
        </div>
      ) : data && data.items.length > 0 ? (
        <div className="space-y-3">
          <p className="text-[11px] text-muted-foreground">
            Showing {Math.min(visibleCount, data.items.length)} of {data.items.length} update{data.items.length !== 1 ? "s" : ""}
          </p>
          {data.items.slice(0, visibleCount).map((item) => (
            <UpdateCard key={item.id} item={item} onTagClick={handleTagClick} />
          ))}
          {visibleCount < data.items.length && (
            <div className="flex justify-center pt-2 pb-4">
              <Button
                variant="outline"
                size="sm"
                className="h-9 px-6 text-[12px] gap-1.5"
                onClick={() => setVisibleCount((prev) => prev + PAGE_SIZE)}
              >
                <ChevronDown className="w-3.5 h-3.5" />
                Load more ({Math.min(PAGE_SIZE, data.items.length - visibleCount)} more)
              </Button>
            </div>
          )}
        </div>
      ) : (
        <div className="text-center py-16">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-muted mb-3">
            <Search className="w-5 h-5 text-muted-foreground" />
          </div>
          <h3 className="text-sm font-medium mb-1">No results found</h3>
          <p className="text-[12px] text-muted-foreground mb-3">
            Try adjusting your filters or search terms
          </p>
          <Button variant="outline" size="sm" onClick={clearFilters}>
            Reset all filters
          </Button>
        </div>
      )}
    </div>
  );
}
