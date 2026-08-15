export const themeInitScript = `
(() => {
  try {
    const stored = window.localStorage.getItem("workout-ai-theme");
    const mode = stored === "light" || stored === "dark" || stored === "system" ? stored : "system";
    const resolved = mode === "system"
      ? (window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light")
      : mode;
    document.documentElement.classList.toggle("dark", resolved === "dark");
    document.documentElement.dataset.theme = resolved;
  } catch {
    document.documentElement.dataset.theme = "light";
  }
})();
`;
