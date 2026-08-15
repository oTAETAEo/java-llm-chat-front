import type { Metadata } from "next";
import { Toaster } from "sonner";
import { CookieBanner } from "@/components/legal/CookieBanner";
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
    <html lang="ko">
      <head>
        <link
          href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/variable/pretendardvariable-dynamic-subset.min.css"
          rel="stylesheet"
        />
      </head>
      <body>
        {children}
        <CookieBanner />
        <Toaster
          closeButton
          position="top-center"
          richColors
          toastOptions={{
            classNames: {
              toast:
                "rounded-xl border border-black/10 bg-white text-sm shadow-lg",
              title: "text-[13px] font-medium text-[#131b2e]",
              description: "text-[12px] text-[#434655]",
            },
          }}
        />
      </body>
    </html>
  );
}
