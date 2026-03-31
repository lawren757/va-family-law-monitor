import { AppSidebar } from "@/components/app-sidebar";
import { SidebarInset } from "@/components/ui/sidebar";
import Dashboard from "@/components/dashboard";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { ThemeToggle } from "@/components/theme-toggle";

export default function Home() {
  return (
    <>
      <AppSidebar />
      <SidebarInset>
        <header className="flex items-center gap-2 px-4 py-2 border-b border-border/50">
          <SidebarTrigger className="md:hidden" />
          <div className="flex-1" />
          <ThemeToggle />
        </header>
        <div className="flex-1 overflow-y-auto">
          <Dashboard />
        </div>
      </SidebarInset>
    </>
  );
}
