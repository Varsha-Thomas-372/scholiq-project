import { PropsWithChildren, createContext, useContext, useEffect, useMemo, useState } from "react";

type ThemeMode = "dark" | "light";

interface ThemeContextType {
  mode: ThemeMode;
  critical: boolean;
  setMode: (mode: ThemeMode) => void;
  setCritical: (isCritical: boolean) => void;
}

const ThemeContext = createContext<ThemeContextType | null>(null);

function applyTheme(mode: ThemeMode, critical: boolean) {
  const root = document.documentElement;
  const accent = critical ? "#FF3B30" : "#6C63FF";
  root.style.setProperty("--accent", accent);
  if (mode === "dark") {
    root.style.setProperty("--bg", "#090A12");
    root.style.setProperty("--surface", "#111425");
    root.style.setProperty("--panel", "#141935");
    root.style.setProperty("--fg", "#F2F5FF");
    root.style.setProperty("--muted", "#9BA3C7");
  } else {
    root.style.setProperty("--bg", "#F5F7FF");
    root.style.setProperty("--surface", "#FFFFFF");
    root.style.setProperty("--panel", "#EEF1FF");
    root.style.setProperty("--fg", "#1E2440");
    root.style.setProperty("--muted", "#5F678A");
  }
}

export function ThemeProvider({ children }: PropsWithChildren) {
  const [mode, setMode] = useState<ThemeMode>(() => (localStorage.getItem("scholiq_theme") as ThemeMode) || "dark");
  const [critical, setCritical] = useState(false);

  useEffect(() => {
    localStorage.setItem("scholiq_theme", mode);
    applyTheme(mode, critical);
  }, [mode, critical]);

  const value = useMemo(() => ({ mode, critical, setMode, setCritical }), [mode, critical]);
  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used within ThemeProvider");
  return ctx;
}
