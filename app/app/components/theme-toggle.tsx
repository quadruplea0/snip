"use client";

import { MoonIcon, SunIcon } from "./icons";

export default function ThemeToggle() {
  function toggle() {
    const el = document.documentElement;
    const next = !el.classList.contains("dark");
    el.classList.toggle("dark", next);
    try {
      localStorage.setItem("theme", next ? "dark" : "light");
    } catch {}
  }

  return (
    <button
      onClick={toggle}
      aria-label="Toggle theme"
      className="flex h-7 w-7 items-center justify-center border border-line text-muted transition-colors hover:bg-foreground hover:text-background"
    >
      <SunIcon className="hidden h-3.5 w-3.5 dark:block" />
      <MoonIcon className="h-3.5 w-3.5 dark:hidden" />
    </button>
  );
}
