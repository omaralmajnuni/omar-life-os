"use client";

import { createContext, useContext, useEffect, useState } from "react";

type Theme = "dark" | "light";

export interface ThemeClasses {
  bg: string;
  card: string;
  cardInner: string;
  muted: string;
  mutedBorder: string;
  inputBg: string;
}

interface ThemeContextType {
  theme: Theme;
  toggleTheme: () => void;
  classes: ThemeClasses;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

function applyTheme(theme: Theme) {
  const root = document.documentElement;
  if (theme === "dark") {
    root.classList.add("dark");
    root.style.setProperty("--background", "#09090b");
    root.style.setProperty("--foreground", "#fafafa");
  } else {
    root.classList.remove("dark");
    root.style.setProperty("--background", "#f8fafc");
    root.style.setProperty("--foreground", "#18181b");
  }
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<Theme>("dark");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const saved = localStorage.getItem("lifeos_theme");
    if (saved === "light" || saved === "dark") {
      setTheme(saved);
      applyTheme(saved);
    } else {
      // Default to dark
      applyTheme("dark");
    }
  }, []);

  const toggleTheme = () => {
    const nextTheme = theme === "dark" ? "light" : "dark";
    setTheme(nextTheme);
    localStorage.setItem("lifeos_theme", nextTheme);
    applyTheme(nextTheme);
  };

  const classes: ThemeClasses = {
    bg: theme === "dark" ? "bg-zinc-950 text-zinc-100" : "bg-slate-50 text-zinc-900",
    card: theme === "dark" 
      ? "bg-zinc-900 border-zinc-800 text-zinc-100" 
      : "bg-white border-slate-200/80 shadow-sm text-zinc-900",
    cardInner: theme === "dark" ? "bg-zinc-950" : "bg-slate-50",
    muted: theme === "dark" ? "text-zinc-500" : "text-zinc-400",
    mutedBorder: theme === "dark" ? "border-zinc-800" : "border-slate-200",
    inputBg: theme === "dark" 
      ? "bg-zinc-950 border-zinc-800 text-zinc-100" 
      : "bg-white border-slate-200 text-zinc-900",
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, classes }}>
      <div style={{ visibility: mounted ? "visible" : "hidden" }} className="contents">
        {children}
      </div>
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
}
