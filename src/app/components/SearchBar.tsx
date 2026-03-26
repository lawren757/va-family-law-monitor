"use client";

import { Search, X } from "lucide-react";
import { useState, type FormEvent } from "react";

interface SearchBarProps {
  onSearch: (query: string) => void;
  currentSearch: string;
}

export default function SearchBar({ onSearch, currentSearch }: SearchBarProps) {
  const [value, setValue] = useState(currentSearch);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    onSearch(value);
  };

  const handleClear = () => {
    setValue("");
    onSearch("");
  };

  return (
    <form onSubmit={handleSubmit} className="relative">
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
      <input
        type="search"
        placeholder="Search updates... e.g. 'child custody', 'spousal support reform', 'AI ethics'"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        className="w-full pl-9 pr-20 h-10 text-[13px] bg-card border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
      />
      <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
        {value && (
          <button
            type="button"
            onClick={handleClear}
            aria-label="Clear search"
            className="p-1 hover:bg-muted rounded"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
        <button
          type="submit"
          className="h-7 px-3 text-[12px] bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
        >
          Search
        </button>
      </div>
    </form>
  );
}
