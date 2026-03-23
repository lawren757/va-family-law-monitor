"use client";

import {
  LayoutList, Scale, BookOpen, Landmark, Gavel, Shield,
  Building2, AlertTriangle, Newspaper, BarChart3, TrendingUp,
  PanelLeft,
} from "lucide-react";
import type { Category } from "@/lib/types";

const ICON_MAP: Record<string, React.ElementType> = {
  LayoutList, Scale, BookOpen, Landmark, Gavel, Shield,
  Building2, AlertTriangle, Newspaper, BarChart3, TrendingUp,
};

const CATEGORIES: { key: Category | "all"; label: string; icon: string }[] = [
  { key: "all", label: "All Updates", icon: "LayoutList" },
  { key: "virginia_code", label: "Virginia Code", icon: "Scale" },
  { key: "case_law", label: "Case Law", icon: "BookOpen" },
  { key: "supreme_court_us", label: "SCOTUS", icon: "Landmark" },
  { key: "court_rules", label: "Court Rules", icon: "Gavel" },
  { key: "ethics_opinion", label: "Ethics Opinions", icon: "Shield" },
  { key: "vsb_update", label: "VA State Bar", icon: "Building2" },
  { key: "attorney_discipline", label: "Attorney Discipline", icon: "AlertTriangle" },
  { key: "news", label: "News", icon: "Newspaper" },
  { key: "study", label: "Studies", icon: "BarChart3" },
  { key: "trend", label: "Trends", icon: "TrendingUp" },
];

interface SidebarProps {
  category: string;
  onCategoryChange: (cat: string) => void;
  isOpen: boolean;
  onToggle: () => void;
}

export default function Sidebar({ category, onCategoryChange, isOpen, onToggle }: SidebarProps) {
  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 md:hidden"
          onClick={onToggle}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed inset-y-0 left-0 z-50 w-64 bg-card border-r border-border
          transform transition-transform duration-200 ease-in-out
          md:relative md:translate-x-0
          ${isOpen ? "translate-x-0" : "-translate-x-full"}
        `}
      >
        {/* Header */}
        <div className="flex items-center gap-2.5 p-4 pb-2">
          <div className="flex items-center justify-center w-8 h-8 rounded-md bg-primary text-primary-foreground">
            <Landmark className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <h1 className="text-sm font-semibold leading-tight truncate">VA Family Law</h1>
            <p className="text-[11px] text-muted-foreground leading-tight">Monitoring Dashboard</p>
          </div>
        </div>

        {/* Categories */}
        <div className="p-2">
          <p className="text-[11px] uppercase tracking-wider text-muted-foreground/40 font-medium px-2 mb-1">
            Categories
          </p>
          <nav className="flex flex-col gap-0.5">
            {CATEGORIES.map((cat) => {
              const Icon = ICON_MAP[cat.icon] || LayoutList;
              const isActive = category === cat.key;
              return (
                <button
                  key={cat.key}
                  onClick={() => {
                    onCategoryChange(cat.key);
                    if (window.innerWidth < 768) onToggle();
                  }}
                  className={`
                    flex items-center gap-2 px-2 py-1.5 rounded-md text-[13px] w-full text-left transition-colors
                    ${isActive
                      ? "bg-primary/10 text-primary font-medium"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                    }
                  `}
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  <span className="truncate">{cat.label}</span>
                </button>
              );
            })}
          </nav>
        </div>
      </aside>

      {/* Mobile toggle button */}
      <button
        onClick={onToggle}
        className="md:hidden fixed top-3 left-3 z-30 p-1.5 rounded-md bg-card border border-border shadow-sm"
        aria-label="Toggle Sidebar"
      >
        <PanelLeft className="w-4 h-4" />
      </button>
    </>
  );
}
