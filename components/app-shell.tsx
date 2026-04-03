"use client";

import { useState } from "react";
import { ThemeProvider } from "./theme-provider";
import { Sidebar } from "./sidebar";
import { ThemeToggle } from "./theme-toggle";
import { Dashboard } from "./dashboard";
import type { UpdateItem } from "@/lib/types";
import Image from "next/image";

interface AppShellProps {
  items: UpdateItem[];
  fetchedAt: string;
  initialTheme?: "dark" | "light";
}

export function AppShell({ items, fetchedAt, initialTheme }: AppShellProps) {
  const [activeCategory, setActiveCategory] = useState("all");

  return (
    <ThemeProvider initialTheme={initialTheme}>
      <div className="flex h-screen w-full overflow-hidden">
        {/* Sidebar — desktop */}
        <div className="hidden md:flex">
          <Sidebar
            activeCategory={activeCategory}
            onCategoryChange={setActiveCategory}
          />
        </div>

        {/* Main area */}
        <div className="flex flex-col flex-1 min-w-0">
          {/* Top header bar */}
          <header className="flex items-center gap-2 px-4 py-2 border-b border-border bg-background/80 backdrop-blur-sm shrink-0">
            {/* Mobile sidebar trigger */}
            <div className="md:hidden">
              <Sidebar
                activeCategory={activeCategory}
                onCategoryChange={setActiveCategory}
              />
            </div>
            {/* Logo on mobile */}
            <div className="md:hidden flex-1 flex items-center">
              <Image
                src="/logo-wordmark.png"
                alt="VFL Toolkit"
                width={100}
                height={24}
                className="h-6 w-auto object-contain object-left"
              />
            </div>
            <div className="hidden md:flex flex-1" />
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
