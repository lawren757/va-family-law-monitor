"use client";

import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import {
  Scale,
  BookOpen,
  Gavel,
  AlertTriangle,
  FileText,
  ScrollText,
  TrendingUp,
  Newspaper,
  GraduationCap,
  LayoutDashboard,
  ShieldAlert,
  Landmark,
  Shield,
  Building2,
  Menu,
  X,
  ChevronRight,
} from "lucide-react";

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
  activeCategory: string;
  onCategoryChange: (cat: string) => void;
}

export function Sidebar({ activeCategory, onCategoryChange }: SidebarProps) {
  const [open, setOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const overlayRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  // Close sidebar on escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  const handleCategoryClick = (key: string) => {
    onCategoryChange(key);
    if (isMobile) setOpen(false);
  };

  const sidebarContent = (
    <nav className="flex flex-col h-full">
      {/* Header */}
      <div className="px-4 pt-4 pb-3 border-b border-sidebar-border">
        <div className="flex items-center justify-between">
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
          {isMobile && (
            <button
              onClick={() => setOpen(false)}
              className="p-1.5 rounded-md text-sidebar-foreground/50 hover:text-sidebar-foreground hover:bg-sidebar-accent transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Categories */}
      <div className="flex-1 overflow-y-auto py-2">
        <p className="px-4 py-1.5 text-[11px] uppercase tracking-wider text-sidebar-foreground/40 font-medium">
          Categories
        </p>
        <ul className="px-2 space-y-0.5">
          {categories.map((cat) => {
            const Icon = cat.icon;
            const isActive = activeCategory === cat.key;
            return (
              <li key={cat.key}>
                <button
                  onClick={() => handleCategoryClick(cat.key)}
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
      </div>
    </nav>
  );

  if (isMobile) {
    return (
      <>
        {/* Hamburger trigger — rendered by layout header on mobile */}
        {open && (
          <>
            {/* Overlay */}
            <div
              ref={overlayRef}
              className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm"
              onClick={() => setOpen(false)}
            />
            {/* Drawer */}
            <aside className="fixed left-0 top-0 h-full w-64 z-50 bg-sidebar border-r border-sidebar-border shadow-xl">
              {sidebarContent}
            </aside>
          </>
        )}
        {/* Expose open setter via data attribute for the header trigger */}
        <button
          id="sidebar-mobile-trigger"
          onClick={() => setOpen(true)}
          className="inline-flex items-center justify-center w-8 h-8 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
          aria-label="Open sidebar"
          data-testid="button-sidebar-toggle"
        >
          <Menu className="w-4 h-4" />
        </button>
      </>
    );
  }

  // Desktop: collapsible sidebar
  return (
    <aside
      className={`relative flex flex-col h-screen bg-sidebar border-r border-sidebar-border transition-all duration-200 shrink-0 ${
        open ? "w-60" : "w-14"
      }`}
    >
      {/* Toggle button */}
      <button
        onClick={() => setOpen(!open)}
        className="absolute -right-3 top-5 z-10 flex items-center justify-center w-6 h-6 rounded-full bg-sidebar border border-sidebar-border text-sidebar-foreground/50 hover:text-sidebar-foreground shadow-sm transition-colors"
        aria-label={open ? "Collapse sidebar" : "Expand sidebar"}
        data-testid="button-sidebar-toggle"
      >
        <ChevronRight className={`w-3 h-3 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      {open ? (
        sidebarContent
      ) : (
        /* Collapsed: icon-only */
        <nav className="flex flex-col h-full">
          <div className="px-3 pt-4 pb-3 border-b border-sidebar-border flex items-center justify-center">
            <Image
              src="/logo-wordmark.png"
              alt="VFL Toolkit"
              width={28}
              height={28}
              className="h-7 w-7 object-contain"
              priority
            />
          </div>
          <ul className="flex-1 overflow-y-auto py-2 px-2 space-y-0.5">
            {categories.map((cat) => {
              const Icon = cat.icon;
              const isActive = activeCategory === cat.key;
              return (
                <li key={cat.key}>
                  <button
                    onClick={() => handleCategoryClick(cat.key)}
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
