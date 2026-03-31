"use client";

import { createContext, useContext, useEffect, useState } from "react";

type Theme = "dark" | "light";

const ThemeContext = createContext<{
  theme: Theme;
  toggleTheme: () => void;
}>({
  theme: "dark",
  toggleTheme: () => {},
});

export function ThemeProvider({
  children,
  defaultTheme = "dark",
}: {
  children: React.ReactNode;
  defaultTheme?: Theme;
}) {
  const [theme, setTheme] = useState<Theme>(defaultTheme);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    fetch("/api/theme")
      .then((res) => res.json())
      .then((data) => {
        if (data.theme === "light" || data.theme === "dark") {
          setTheme(data.theme);
        }
      })
      .catch(() => {
        setTheme(
          window.matchMedia("(prefers-color-scheme: dark)").matches
            ? "dark"
            : "light"
        );
      })
      .finally(() => setLoaded(true));
  }, []);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", theme === "dark");
  }, [theme]);

  const toggleTheme = () => {
    const next = theme === "dark" ? "light" : "dark";
    setTheme(next);
    fetch("/api/theme", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ theme: next }),
    }).catch(() => {});
  };

  if (!loaded) {
    return null;
  }

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export const useTheme = () => useContext(ThemeContext);
