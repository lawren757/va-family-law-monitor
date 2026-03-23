import {
  Gavel, Scale, BookOpen, BarChart3,
} from "lucide-react";
import type { UpdatesResponse } from "@/lib/types";

interface StatsBarProps {
  data: UpdatesResponse;
}

export default function StatsBar({ data }: StatsBarProps) {
  const stats = [
    {
      label: "Total Updates",
      value: data.total,
      icon: Gavel,
    },
    {
      label: "Legislation",
      value: (data.categories.virginia_code || 0) + (data.categories.court_rules || 0),
      icon: Scale,
    },
    {
      label: "Case Law",
      value: (data.categories.case_law || 0) + (data.categories.supreme_court_us || 0),
      icon: BookOpen,
    },
    {
      label: "News & Studies",
      value:
        (data.categories.news || 0) +
        (data.categories.study || 0) +
        (data.categories.trend || 0),
      icon: BarChart3,
    },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
      {stats.map((stat) => (
        <div
          key={stat.label}
          className="flex items-center gap-3 p-3 rounded-lg bg-card border border-border/50"
        >
          <div className="flex items-center justify-center w-9 h-9 rounded-md bg-primary/10 text-primary">
            <stat.icon className="w-4 h-4" />
          </div>
          <div>
            <p className="text-xl font-bold tabular-nums leading-none">
              {stat.value}
            </p>
            <p className="text-[11px] text-muted-foreground mt-0.5">
              {stat.label}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}
