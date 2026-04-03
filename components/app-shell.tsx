"use client";

import { useState } from "react";
import { ThemeProvider } from "./theme-provider";
import { Sidebar } from "./sidebar";
import { ThemeToggle } from "./theme-toggle";
import { Dashboard } from "./dashboard";
import { Menu } from "lucide-react";
import type { UpdateItem } from "@/lib/types";

interface AppShellProps {
  items: UpdateItem[];
  fetchedAt: string;
  initialTheme?: "dark" | "light";
}

export function AppShell({ items, fetchedAt, initialTheme }: AppShellProps) {
  const [activeCategory, setActiveCategory] = useState("all");
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);

  return (
    <ThemeProvider initialTheme={initialTheme}>
      <div className="flex h-screen w-full overflow-hidden bg-background">
        {/* Desktop sidebar (>=1024px): inline collapsible */}
        <div className="hidden lg:flex">
          <Sidebar
            mode="desktop"
            activeCategory={activeCategory}
            onCategoryChange={setActiveCategory}
          />
        </div>

        {/* Main area */}
        <div className="flex flex-col flex-1 min-w-0">
          {/* Top header bar */}
          <header className="flex items-center gap-3 px-4 py-2 border-b border-border bg-background/80 backdrop-blur-sm shrink-0">
            {/* Mobile/tablet hamburger */}
            <button
              className="lg:hidden inline-flex items-center justify-center w-8 h-8 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
              onClick={() => setMobileDrawerOpen(true)}
              aria-label="Open sidebar"
              data-testid="button-sidebar-toggle-mobile"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div className="flex-1" />
            <ThemeToggle />
          </header>

          {/* Scrollable content */}
          <main className="flex-1 overflow-y-auto">
            <Dashboard
              items={items}
              fetchedAt={fetchedAt}
              activeCategory={activeCategory}
              onCategoryChange={setActiveCategory}
            />
          </main>
        </div>
      </div>

      {/* Mobile/tablet drawer — rendered at root level so fixed positioning works */}
      <Sidebar
        mode="mobile"
        activeCategory={activeCategory}
        onCategoryChange={setActiveCategory}
        isOpen={mobileDrawerOpen}
        onClose={() => setMobileDrawerOpen(false)}
      />
    </ThemeProvider>
  );
}
