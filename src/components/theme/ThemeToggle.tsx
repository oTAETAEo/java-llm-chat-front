"use client";

import { Icon } from "@/components/common/Icon";
import { useTheme } from "@/components/theme/ThemeProvider";

export function ThemeToggle() {
  const { resolvedTheme, toggleTheme } = useTheme();
  const dark = resolvedTheme === "dark";

  return (
    <button
      aria-label={dark ? "라이트 모드로 전환" : "다크 모드로 전환"}
      className="apple-icon-button flex h-9 w-9 items-center justify-center bg-white/80 p-1.5 ring-1 ring-black/10 backdrop-blur dark:bg-white/10 dark:ring-white/15"
      onClick={toggleTheme}
      suppressHydrationWarning
      title={dark ? "라이트 모드" : "다크 모드"}
      type="button"
    >
      <Icon name={dark ? "sun" : "moon"} className="h-5 w-5" />
    </button>
  );
}
