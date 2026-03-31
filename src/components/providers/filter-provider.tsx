"use client";

import { createContext, useContext, useState } from "react";

export interface FilterState {
  category: string;
  tag: string | null;
  search: string;
  setCategory: (cat: string) => void;
  setTag: (tag: string | null) => void;
  setSearch: (s: string) => void;
  clearFilters: () => void;
}

const FilterContext = createContext<FilterState>({
  category: "all",
  tag: null,
  search: "",
  setCategory: () => {},
  setTag: () => {},
  setSearch: () => {},
  clearFilters: () => {},
});

export function FilterProvider({ children }: { children: React.ReactNode }) {
  const [category, setCategory] = useState("all");
  const [tag, setTag] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  const clearFilters = () => {
    setCategory("all");
    setTag(null);
    setSearch("");
  };

  return (
    <FilterContext.Provider
      value={{ category, tag, search, setCategory, setTag, setSearch, clearFilters }}
    >
      {children}
    </FilterContext.Provider>
  );
}

export const useFilterStore = () => useContext(FilterContext);
