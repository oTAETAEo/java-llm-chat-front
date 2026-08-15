import type { Metadata } from "next";
import { Toaster } from "sonner";
import { CookieBanner } from "@/components/legal/CookieBanner";
import { ThemeProvider } from "@/components/theme/ThemeProvider";
import { themeInitScript } from "@/components/theme/themeInitScript";
import "./globals.css";

export const metadata: Metadata = {
  title: "Workout AI Coach",
  description: "Frontend for the Java LLM workout feedback chat server",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
        <link
          href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/variable/pretendardvariable-dynamic-subset.min.css"
          rel="stylesheet"
        />
      </head>
      <body>
        <ThemeProvider>
          {children}
          <CookieBanner />
          <Toaster
            closeButton
            position="top-center"
            richColors
            toastOptions={{
              classNames: {
                toast:
                  "rounded-xl border border-black/10 bg-white text-sm shadow-lg dark:border-white/15 dark:bg-[#333333] dark:text-white",
                title: "text-[13px] font-medium text-[#131b2e] dark:text-white",
                description: "text-[12px] text-[#434655] dark:text-white/70",
              },
            }}
          />
        </ThemeProvider>
      </body>
    </html>
  );
}
