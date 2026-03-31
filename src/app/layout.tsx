import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import { cookies } from "next/headers";
import { ThemeProvider } from "@/components/theme-provider";
import { FilterProvider } from "@/components/providers/filter-provider";
import { QueryProvider } from "@/components/providers/query-provider";
import { SidebarProvider } from "@/components/ui/sidebar";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "VA Family Law Monitor",
  description:
    "Virginia Family Law Monitoring Dashboard — code updates, case law, ethics opinions, bar news, and practice trends",
  icons: {
    icon: "/favicon.ico",
  },
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "VA Law",
  },
};

export const viewport: Viewport = {
  themeColor: "#0066CC",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // Read saved theme from cookie server-side to prevent flash
  const cookieStore = await cookies();
  const theme = (cookieStore.get("va-law-theme")?.value ?? "dark") as "dark" | "light";

  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${inter.variable} h-full antialiased ${theme}`}
    >
      <body className="min-h-full flex font-sans">
        <QueryProvider>
          <FilterProvider>
            <ThemeProvider defaultTheme={theme}>
              <SidebarProvider>
                {children}
              </SidebarProvider>
            </ThemeProvider>
          </FilterProvider>
        </QueryProvider>
      </body>
    </html>
  );
}
