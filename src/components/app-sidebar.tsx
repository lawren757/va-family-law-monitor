"use client";

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter,
} from "@/components/ui/sidebar";
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
} from "lucide-react";
import { useFilterStore } from "@/components/providers/filter-provider";

const categories = [
  { key: "all", label: "All Updates", icon: LayoutDashboard },
  { key: "virginia_code", label: "Virginia Code", icon: ScrollText },
  { key: "case_law", label: "Case Law", icon: Gavel },
  { key: "supreme_court_us", label: "SCOTUS", icon: Scale },
  { key: "court_rules", label: "Court Rules", icon: FileText },
  { key: "ethics_opinion", label: "Ethics Opinions", icon: BookOpen },
  { key: "vsb_update", label: "VA State Bar", icon: GraduationCap },
  { key: "attorney_discipline", label: "Attorney Discipline", icon: ShieldAlert },
  { key: "news", label: "News", icon: Newspaper },
  { key: "study", label: "Studies", icon: TrendingUp },
  { key: "trend", label: "Trends", icon: AlertTriangle },
];

export function AppSidebar() {
  const { category, setCategory } = useFilterStore();

  return (
    <Sidebar>
      <SidebarHeader className="p-4 pb-2">
        <div className="flex items-center gap-2.5">
          <div className="flex items-center justify-center w-8 h-8 rounded-md bg-sidebar-primary text-sidebar-primary-foreground">
            <Scale className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <h1 className="text-sm font-semibold leading-tight truncate text-sidebar-foreground">
              VA Family Law
            </h1>
            <p className="text-[11px] text-sidebar-foreground/50 leading-tight">
              Monitoring Dashboard
            </p>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className="text-[11px] uppercase tracking-wider text-sidebar-foreground/40 font-medium">
            Categories
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {categories.map((cat) => (
                <SidebarMenuItem key={cat.key}>
                  <SidebarMenuButton
                    onClick={() => setCategory(cat.key)}
                    isActive={category === cat.key}
                    className="text-[13px]"
                  >
                    <cat.icon className="w-4 h-4 shrink-0" />
                    <span className="truncate">{cat.label}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="p-3">
        <p className="text-[10px] text-sidebar-foreground/30 text-center">
          Virginia Family Law Monitor
        </p>
      </SidebarFooter>
    </Sidebar>
  );
}
