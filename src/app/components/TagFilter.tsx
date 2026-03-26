import { TAG_LABELS } from "@/lib/types";

interface TagFilterProps {
  tags: Record<string, number>;
  activeTag: string | null;
  onTagClick: (tag: string) => void;
}

export default function TagFilter({ tags, activeTag, onTagClick }: TagFilterProps) {
  if (activeTag) return null;

  const sortedTags = Object.entries(tags)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 12);

  if (sortedTags.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-1.5">
      {sortedTags.map(([tag, count]) => (
        <button
          key={tag}
          onClick={() => onTagClick(tag)}
          className="inline-flex items-center gap-1 text-[11px] px-2 py-1 rounded-full border border-slate-300 bg-card hover:bg-primary/5 hover:border-primary/30 text-slate-600 hover:text-foreground dark:border-border/60 dark:text-muted-foreground transition-colors"
        >
          {TAG_LABELS[tag] || tag.replace(/_/g, " ")}
          <span className="text-[9px] opacity-50">{count}</span>
        </button>
      ))}
    </div>
  );
}
