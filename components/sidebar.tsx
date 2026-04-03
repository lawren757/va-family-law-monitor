"use client";

import { useEffect } from "react";
import Image from "next/image";
import {
  Scale, BookOpen, Gavel, AlertTriangle, FileText, ScrollText,
  TrendingUp, Newspaper, GraduationCap, LayoutDashboard, ShieldAlert,
  Landmark, Shield, Building2, X, ChevronRight,
} from "lucide-react";
import { useState } from "react";

const categories = [
  { key: "all", label: "All Updates", icon: LayoutDashboard },
  { key: "virginia_code", label: "Virginia Code", icon: ScrollText },
  { key: "case_law", label: "Case Law", icon: Gavel },
  { key: "supreme_court_us", label: "SCOTUS", icon: Scale },
  { key: "court_rules", label: "Court Rules", icon: FileText },
  { key: "ethics_opinion", label: "Ethics Opinions", icon: BookOpen },
  { key: "vsb_update", label: "VA State Bar", icon: GraduationCap },
  { key: "attorney_discipline", label: "Attorney Discipline", icon: ShieldAlert },
  { key: "retirement_erisa", label: "Retirement / ERISA", icon: Landmark },
  { key: "military_family", label: "Military Family", icon: Shield },
  { key: "federal_employee", label: "Federal Employees", icon: Building2 },
  { key: "news", label: "News", icon: Newspaper },
  { key: "study", label: "Studies", icon: TrendingUp },
  { key: "trend", label: "Trends", icon: AlertTriangle },
];

interface SidebarProps {
  mode: "desktop" | "mobile";
  activeCategory: string;
  onCategoryChange: (cat: string) => void;
  isOpen?: boolean;
  onClose?: () => void;
}

function CategoryList({ activeCategory, onSelect }: { activeCategory: string; onSelect: (key: string) => void }) {
  return (
    <ul className="px-2 space-y-0.5">
      {categories.map((cat) => {
        const Icon = cat.icon;
        const isActive = activeCategory === cat.key;
        return (
          <li key={cat.key}>
            <button
              onClick={() => onSelect(cat.key)}
              data-testid={`nav-category-${cat.key}`}
              className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded-md text-[13px] transition-colors ${
                isActive
                  ? "bg-sidebar-primary text-sidebar-primary-foreground font-medium"
                  : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
              }`}
            >
              <Icon className="w-4 h-4 shrink-0" />
              <span className="truncate">{cat.label}</span>
            </button>
          </li>
        );
      })}
    </ul>
  );
}

export function Sidebar({ mode, activeCategory, onCategoryChange, isOpen, onClose }: SidebarProps) {
  // ---- MOBILE DRAWER ----
  if (mode === "mobile") {
    // Lock body scroll when open
    useEffect(() => {
      if (isOpen) {
        document.body.style.overflow = "hidden";
      } else {
        document.body.style.overflow = "";
      }
      return () => { document.body.style.overflow = ""; };
    }, [isOpen]);

    // Close on escape
    useEffect(() => {
      if (!isOpen) return;
      const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose?.(); };
      window.addEventListener("keydown", handler);
      return () => window.removeEventListener("keydown", handler);
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    return (
      <div className="fixed inset-0 z-[100]">
        {/* Backdrop */}
        <div
          className="absolute inset-0 bg-black/50 backdrop-blur-sm"
          onClick={onClose}
        />
        {/* Drawer panel */}
        <aside className="absolute left-0 top-0 h-full w-72 bg-sidebar border-r border-sidebar-border shadow-2xl flex flex-col">
          {/* Header */}
          <div className="px-4 pt-4 pb-3 border-b border-sidebar-border flex items-center justify-between shrink-0">
            <div className="flex flex-col gap-0.5">
              <Image
                src="/logo-wordmark.png"
                alt="VFL Toolkit"
                width={120}
                height={28}
                className="h-7 w-auto object-contain object-left"
                priority
              />
              <p className="text-[10px] font-medium tracking-wide uppercase text-sidebar-foreground/50 leading-tight">
                Virginia Family Law Monitor
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-md text-sidebar-foreground/50 hover:text-sidebar-foreground hover:bg-sidebar-accent transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Category list */}
          <div className="flex-1 overflow-y-auto py-2">
            <p className="px-4 py-1.5 text-[11px] uppercase tracking-wider text-sidebar-foreground/40 font-medium">
              Categories
            </p>
            <CategoryList
              activeCategory={activeCategory}
              onSelect={(key) => { onCategoryChange(key); onClose?.(); }}
            />
          </div>
        </aside>
      </div>
    );
  }

  // ---- DESKTOP: collapsible inline sidebar ----
  const [expanded, setExpanded] = useState(false);

  return (
    <aside
      className={`relative flex flex-col h-screen bg-sidebar border-r border-sidebar-border transition-all duration-200 shrink-0 ${
        expanded ? "w-60" : "w-14"
      }`}
    >
      {/* Toggle chevron */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="absolute -right-3 top-5 z-10 flex items-center justify-center w-6 h-6 rounded-full bg-sidebar border border-sidebar-border text-sidebar-foreground/50 hover:text-sidebar-foreground shadow-sm transition-colors"
        aria-label={expanded ? "Collapse sidebar" : "Expand sidebar"}
        data-testid="button-sidebar-toggle"
      >
        <ChevronRight className={`w-3 h-3 transition-transform ${expanded ? "rotate-180" : ""}`} />
      </button>

      {expanded ? (
        <nav className="flex flex-col h-full">
          <div className="px-4 pt-4 pb-3 border-b border-sidebar-border">
            <div className="flex flex-col gap-0.5">
              <Image
                src="/logo-wordmark.png"
                alt="VFL Toolkit"
                width={120}
                height={28}
                className="h-7 w-auto object-contain object-left"
                priority
              />
              <p className="text-[10px] font-medium tracking-wide uppercase text-sidebar-foreground/50 leading-tight">
                Virginia Family Law Monitor
              </p>
            </div>
          </div>
          <div className="flex-1 overflow-y-auto py-2">
            <p className="px-4 py-1.5 text-[11px] uppercase tracking-wider text-sidebar-foreground/40 font-medium">
              Categories
            </p>
            <CategoryList activeCategory={activeCategory} onSelect={onCategoryChange} />
          </div>
        </nav>
      ) : (
        <nav className="flex flex-col h-full">
          <div className="h-[52px] border-b border-sidebar-border shrink-0" />
          <ul className="flex-1 overflow-y-auto py-2 px-2 space-y-0.5">
            {categories.map((cat) => {
              const Icon = cat.icon;
              const isActive = activeCategory === cat.key;
              return (
                <li key={cat.key}>
                  <button
                    onClick={() => onCategoryChange(cat.key)}
                    title={cat.label}
                    data-testid={`nav-category-${cat.key}`}
                    className={`w-full flex items-center justify-center p-2 rounded-md transition-colors ${
                      isActive
                        ? "bg-sidebar-primary text-sidebar-primary-foreground"
                        : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                  </button>
                </li>
              );
            })}
          </ul>
        </nav>
      )}
    </aside>
  );
}
