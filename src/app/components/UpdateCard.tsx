"use client";

import { useState } from "react";
import {
  Scale, BookOpen, Landmark, Gavel, Shield, Building2,
  AlertTriangle, Newspaper, BarChart3, TrendingUp,
  Calendar, ChevronDown, ChevronUp, ExternalLink, Hash, Share2,
} from "lucide-react";
import type { LawUpdate } from "@/lib/types";
import { CATEGORY_META, TAG_LABELS } from "@/lib/types";

const ICON_MAP: Record<string, React.ElementType> = {
  Scale, BookOpen, Landmark, Gavel, Shield, Building2,
  AlertTriangle, Newspaper, BarChart3, TrendingUp,
};

interface UpdateCardProps {
  item: LawUpdate;
  onTagClick: (tag: string) => void;
}

function formatDate(dateStr: string): string {
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    return d.toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
  } catch {
    return dateStr;
  }
}

export default function UpdateCard({ item, onTagClick }: UpdateCardProps) {
  const [expanded, setExpanded] = useState(false);
  const [shareStatus, setShareStatus] = useState<"idle" | "copied">("idle");
  const meta = CATEGORY_META[item.category] || CATEGORY_META.all;
  const Icon = ICON_MAP[meta.icon] || Gavel;

  const handleShare = async () => {
    const shareText = `${item.title}\n\n${item.summary}${item.citation ? `\n\nCitation: ${item.citation}` : ""}\n\nSource: ${item.sourceUrl}`;

    if (navigator.share) {
      try {
        await navigator.share({
          title: item.title,
          text: shareText,
          url: item.sourceUrl,
        });
      } catch (err) {
        // User cancelled or share failed — ignore AbortError
        if (err instanceof Error && err.name !== "AbortError") {
          console.error("Share failed:", err);
        }
      }
    } else {
      // Fallback: copy to clipboard
      try {
        await navigator.clipboard.writeText(shareText);
        setShareStatus("copied");
        setTimeout(() => setShareStatus("idle"), 2000);
      } catch {
        console.error("Failed to copy to clipboard");
      }
    }
  };

  return (
    <div className="p-4 rounded-xl bg-card border border-border/60 shadow-sm hover:shadow-md transition-all duration-200">
      <div className="flex items-start gap-3">
        {/* Category icon */}
        <div className={`flex items-center justify-center w-8 h-8 rounded-md shrink-0 mt-0.5 ${meta.color} ${meta.darkColor}`}>
          <Icon className="w-4 h-4" />
        </div>

        <div className="min-w-0 flex-1">
          {/* Badges row */}
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <span className={`inline-flex items-center text-[10px] px-1.5 py-0 font-medium rounded-md border-0 ${meta.color} ${meta.darkColor}`}>
              {meta.label}
            </span>
            {item.court && (
              <span className="text-[10px] px-1.5 py-0 rounded-md border border-border text-muted-foreground">
                {item.court}
              </span>
            )}
            {item.scope && (
              <span className="text-[10px] px-1.5 py-0 rounded-md border border-border text-muted-foreground capitalize">
                {item.scope}
              </span>
            )}
            <span className="text-[11px] text-muted-foreground flex items-center gap-1 ml-auto shrink-0">
              <Calendar className="w-3 h-3" />
              {formatDate(item.date)}
            </span>
          </div>

          {/* Title */}
          <h3 className="text-[13px] font-semibold leading-snug mb-1.5">
            {item.title}
          </h3>

          {/* Summary */}
          <p className={`text-[12.5px] leading-relaxed text-muted-foreground ${expanded ? "" : "line-clamp-3"}`}>
            {item.summary}
          </p>
          {item.summary.length > 200 && (
            <button
              onClick={() => setExpanded(!expanded)}
              className="text-[11px] text-primary hover:underline mt-1 flex items-center gap-0.5"
            >
              {expanded ? (
                <>Show less <ChevronUp className="w-3 h-3" /></>
              ) : (
                <>Read more <ChevronDown className="w-3 h-3" /></>
              )}
            </button>
          )}

          {/* Citation */}
          {item.citation && (
            <p className="text-[11px] text-muted-foreground/70 mt-1.5 font-mono">
              {item.citation}
            </p>
          )}

          {/* Tags */}
          <div className="flex items-center gap-1.5 flex-wrap mt-2.5">
            {item.tags.map((tag) => (
              <button
                key={tag}
                onClick={() => onTagClick(tag)}
                className="inline-flex items-center gap-0.5 text-[10px] px-1.5 py-0.5 rounded-full bg-muted hover:bg-muted/80 text-muted-foreground hover:text-foreground transition-colors"
              >
                <Hash className="w-2.5 h-2.5" />
                {TAG_LABELS[tag] || tag.replace(/_/g, " ")}
              </button>
            ))}
          </div>

          {/* Source link & share */}
          <div className="flex items-center gap-3 mt-2.5 pt-2 border-t border-border/40">
            <a
              href={item.sourceUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-[11px] font-medium text-primary hover:underline"
            >
              <ExternalLink className="w-3 h-3" />
              {item.sourceName}
            </a>
            {item.blogCredit && (() => {
              const parts = item.blogCredit.split("|");
              const name = parts[0];
              const url = parts[1];
              return url ? (
                <a
                  href={url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[10px] text-muted-foreground/60 hover:text-muted-foreground hover:underline"
                >
                  via {name}
                </a>
              ) : (
                <span className="text-[10px] text-muted-foreground/60">via {name}</span>
              );
            })()}
            <button
              onClick={handleShare}
              aria-label="Share this update"
              className="ml-auto inline-flex items-center gap-1 text-[11px] text-muted-foreground hover:text-primary transition-colors p-1 rounded-md hover:bg-muted"
            >
              <Share2 className="w-3.5 h-3.5" />
              {shareStatus === "copied" ? "Copied!" : "Share"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
