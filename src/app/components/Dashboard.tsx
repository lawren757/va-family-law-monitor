"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import type { UpdatesResponse } from "@/lib/types";
import { CATEGORY_META, TAG_LABELS } from "@/lib/types";
import Sidebar from "./Sidebar";
import StatsBar from "./StatsBar";
import SearchBar from "./SearchBar";
import TagFilter from "./TagFilter";
import UpdateCard from "./UpdateCard";
import ThemeToggle from "./ThemeToggle";
import { PanelLeft, Search, X, Hash, ChevronLeft, ChevronRight, Clock } from "lucide-react";

export default function Dashboard() {
  const [category, setCategory] = useState("all");
  const [tag, setTag] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [data, setData] = useState<UpdatesResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const fetchIdRef = useRef(0);

  const fetchData = useCallback(async () => {
    const id = ++fetchIdRef.current;
    setLoading(true);
    const params = new URLSearchParams();
    if (category !== "all") params.set("category", category);
    if (tag) params.set("tag", tag);
    if (search) params.set("search", search);
    params.set("page", String(page));

    try {
      const res = await fetch(`/api/updates?${params.toString()}`);
      if (id !== fetchIdRef.current) return; // stale response
      if (!res.ok) {
        console.error("Failed to fetch updates:", res.status);
        return;
      }
      const json: UpdatesResponse = await res.json();
      setData(json);
      if (json.page !== page) {
        setPage(json.page);
      }
    } catch (err) {
      if (id !== fetchIdRef.current) return;
      console.error("Failed to fetch updates:", err);
    } finally {
      if (id === fetchIdRef.current) {
        setLoading(false);
      }
    }
  }, [category, tag, search, page]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const clearFilters = () => {
    setCategory("all");
    setTag(null);
    setSearch("");
    setPage(1);
  };

  const handleCategoryChange = (cat: string) => {
    setCategory(cat);
    setTag(null);
    setPage(1);
  };

  const handleTagClick = (t: string) => {
    setTag(tag === t ? null : t);
    setPage(1);
  };

  const handleSearch = (q: string) => {
    setSearch(q);
    setPage(1);
  };

  const activeFilterCount =
    (category !== "all" ? 1 : 0) + (tag ? 1 : 0) + (search ? 1 : 0);

  return (
    <div className="flex h-screen w-full overflow-hidden bg-background">
      <Sidebar
        category={category}
        onCategoryChange={handleCategoryChange}
        isOpen={sidebarOpen}
        onToggle={() => setSidebarOpen(!sidebarOpen)}
      />

      <div className="flex flex-col flex-1 min-w-0">
        {/* Top bar */}
        <header className="flex items-center gap-2 px-4 py-2 border-b border-border bg-card/80 backdrop-blur-sm shrink-0">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="md:hidden p-1.5 rounded-md hover:bg-muted"
            aria-label="Toggle sidebar"
          >
            <PanelLeft className="w-4 h-4" />
          </button>
          <div className="flex-1" />
          <ThemeToggle />
        </header>

        {/* Main content */}
        <main className="flex-1 overflow-y-auto">
          <div className="p-4 md:p-6 max-w-[1200px] mx-auto space-y-5">
            {/* Page header */}
            <div>
              <h1 className="text-xl font-bold tracking-tight">
                Virginia Family Law Monitor
              </h1>
              <p className="text-[13px] text-muted-foreground mt-1">
                Code updates, case law, ethics opinions, bar news, and practice trends
              </p>
              {data?.lastUpdated && (
                <p className="text-[11px] text-muted-foreground mt-1.5 flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  Last updated: {new Date(data.lastUpdated).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric", hour: "numeric", minute: "2-digit" })}
                </p>
              )}
            </div>

            {/* Stats */}
            {!loading && data && <StatsBar data={data} />}

            {/* Search */}
            <SearchBar onSearch={handleSearch} currentSearch={search} />

            {/* Active filters */}
            <div className="flex flex-wrap items-center gap-2">
              {activeFilterCount > 0 && (
                <button
                  onClick={clearFilters}
                  className="inline-flex items-center gap-1 h-6 text-[11px] px-2 text-[#b91c1c] dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-md transition-colors"
                >
                  <X className="w-3 h-3" />
                  Clear filters
                </button>
              )}
              {category !== "all" && (
                <span className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-md bg-muted">
                  {CATEGORY_META[category as keyof typeof CATEGORY_META]?.label || category}
                  <button onClick={() => setCategory("all")} aria-label="Remove category filter" className="ml-0.5 hover:bg-muted-foreground/20 rounded-full p-0.5">
                    <X className="w-2.5 h-2.5" />
                  </button>
                </span>
              )}
              {tag && (
                <span className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-md bg-muted">
                  <Hash className="w-2.5 h-2.5" />
                  {TAG_LABELS[tag] || tag}
                  <button onClick={() => setTag(null)} aria-label="Remove tag filter" className="ml-0.5 hover:bg-muted-foreground/20 rounded-full p-0.5">
                    <X className="w-2.5 h-2.5" />
                  </button>
                </span>
              )}
              {search && (
                <span className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-md bg-muted">
                  &ldquo;{search}&rdquo;
                  <button onClick={() => setSearch("")} aria-label="Remove search filter" className="ml-0.5 hover:bg-muted-foreground/20 rounded-full p-0.5">
                    <X className="w-2.5 h-2.5" />
                  </button>
                </span>
              )}
            </div>

            {/* Tag cloud */}
            {data && (
              <TagFilter
                tags={data.tags}
                activeTag={tag}
                onTagClick={handleTagClick}
              />
            )}

            {/* Updates list */}
            {loading ? (
              <div className="space-y-3">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="p-4 rounded-xl bg-card border border-border/60">
                    <div className="flex gap-3">
                      <div className="w-8 h-8 rounded-md bg-muted animate-pulse shrink-0" />
                      <div className="flex-1 space-y-2">
                        <div className="h-4 w-24 bg-muted animate-pulse rounded" />
                        <div className="h-4 w-full bg-muted animate-pulse rounded" />
                        <div className="h-3 w-3/4 bg-muted animate-pulse rounded" />
                        <div className="h-3 w-1/2 bg-muted animate-pulse rounded" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : data && data.items.length > 0 ? (
              <div className="space-y-3">
                <p className="text-[11px] text-muted-foreground">
                  Showing {(data.page - 1) * data.pageSize + 1}–{Math.min(data.page * data.pageSize, data.filteredTotal)} of {data.filteredTotal} update{data.filteredTotal !== 1 ? "s" : ""}
                </p>
                {data.items.map((item) => (
                  <UpdateCard key={item.id} item={item} onTagClick={handleTagClick} />
                ))}

                {/* Pagination */}
                {data.totalPages > 1 && (
                  <div className="flex items-center justify-center gap-2 pt-4 pb-2">
                    <button
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                      disabled={data.page <= 1}
                      className="inline-flex items-center gap-1 px-3 py-1.5 text-[12px] border border-border rounded-md hover:bg-muted transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      <ChevronLeft className="w-3.5 h-3.5" />
                      Previous
                    </button>
                    <span className="text-[12px] text-muted-foreground px-2">
                      Page {data.page} of {data.totalPages}
                    </span>
                    <button
                      onClick={() => setPage((p) => Math.min(data.totalPages, p + 1))}
                      disabled={data.page >= data.totalPages}
                      className="inline-flex items-center gap-1 px-3 py-1.5 text-[12px] border border-border rounded-md hover:bg-muted transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      Next
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-16">
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-muted mb-3">
                  <Search className="w-5 h-5 text-muted-foreground" />
                </div>
                <h2 className="text-sm font-medium mb-1">No results found</h2>
                <p className="text-[12px] text-muted-foreground mb-3">
                  Try adjusting your filters or search terms
                </p>
                <button
                  onClick={clearFilters}
                  className="px-3 py-1.5 text-[12px] border border-border rounded-md hover:bg-muted transition-colors"
                >
                  Reset all filters
                </button>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
