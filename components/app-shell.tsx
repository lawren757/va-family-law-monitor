"use client";

import { useState } from "react";
import { ThemeProvider } from "./theme-provider";
import { Sidebar } from "./sidebar";
import { ThemeToggle } from "./theme-toggle";
import { Dashboard } from "./dashboard";
import type { UpdateItem } from "@/lib/types";

interface AppShellProps {
  items: UpdateItem[];
  fetchedAt: string;
  initialTheme?: "dark" | "light";
}

export function AppShell({ items, fetchedAt, initialTheme }: AppShellProps) {
  const [activeCategory, setActiveCategory] = useState("all");

  return (
    <ThemeProvider initialTheme={initialTheme}>
      <div className="flex h-screen w-full overflow-hidden bg-background">
        {/* Sidebar renders itself: desktop = inline collapsible, mobile/tablet = returns just the trigger button (rendered in header below) */}
        <div className="hidden lg:flex">
          <Sidebar
            activeCategory={activeCategory}
            onCategoryChange={setActiveCategory}
          />
        </div>

        {/* Main area */}
        <div className="flex flex-col flex-1 min-w-0">
          {/* Top header bar */}
          <header className="flex items-center gap-3 px-4 py-2 border-b border-border bg-background/80 backdrop-blur-sm shrink-0">
            {/* Mobile/tablet: hamburger + drawer from Sidebar */}
            <div className="lg:hidden">
              <Sidebar
                activeCategory={activeCategory}
                onCategoryChange={setActiveCategory}
              />
            </div>
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
    </ThemeProvider>
  );
}
