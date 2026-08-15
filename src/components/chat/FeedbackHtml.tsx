"use client";

import { useMemo, useState } from "react";
import DOMPurify from "dompurify";
import { Icon } from "@/components/common/Icon";

function normalizeFeedbackHtml(text: string) {
  const trimmed = text.trim();

  if (/<\/?(article|section|h1|h2|h3|p|ul|ol|li|strong|br)\b/i.test(trimmed)) {
    return trimmed;
  }

  return trimmed
    .replace(/\r\n/g, "\n")
    .replace(/#{1,6}\s*⚡\s*AI\s*운동\s*리포트/g, "<h1>⚡ AI 운동 리포트</h1>")
    .replace(/#{1,6}\s*🏅\s*오늘의\s*한줄\s*평가/g, "<h2>🏅 오늘의 한줄 평가</h2>")
    .replace(/#{1,6}\s*📈\s*성장\s*포인트/g, "<h2>📈 성장 포인트</h2>")
    .replace(/#{1,6}\s*📊\s*트레이닝\s*인사이트/g, "<h2>📊 트레이닝 인사이트</h2>")
    .replace(/#{1,6}\s*💬\s*운동\s*코치\s*총평/g, "<h2>💬 운동 코치 총평</h2>")
    .replace(/#{1,6}\s*🎯\s*Next\s*Mission/g, "<h2>🎯 Next Mission</h2>")
    .replace(/(?:^|\n|\s)⚡\s*AI\s*운동\s*리포트/g, "\n<h1>⚡ AI 운동 리포트</h1>\n")
    .replace(/(?:^|\n|\s)🏅\s*오늘의\s*한줄\s*평가/g, "\n<h2>🏅 오늘의 한줄 평가</h2>\n")
    .replace(/(?:^|\n|\s)📈\s*성장\s*포인트/g, "\n<h2>📈 성장 포인트</h2>\n")
    .replace(/(?:^|\n|\s)📊\s*트레이닝\s*인사이트/g, "\n<h2>📊 트레이닝 인사이트</h2>\n")
    .replace(/(?:^|\n|\s)💬\s*운동\s*코치\s*총평/g, "\n<h2>💬 운동 코치 총평</h2>\n")
    .replace(/(?:^|\n|\s)🎯\s*Next\s*Mission/g, "\n<h2>🎯 Next Mission</h2>\n")
    .split(/\n{2,}/)
    .map((block) => {
      const value = block.trim();
      if (!value) return "";
      if (value.startsWith("<h1") || value.startsWith("<h2") || value.startsWith("<ul")) return value;
      if (/^-\s*/m.test(value)) {
        const items = value
          .split(/\n/)
          .map((line) => line.replace(/^-\s*/, "").trim())
          .filter(Boolean)
          .map((line) => `<li>${line}</li>`)
          .join("");
        return `<ul>${items}</ul>`;
      }
      return `<p>${value.replace(/\n/g, "<br />")}</p>`;
    })
    .join("\n");
}

export function FeedbackHtml({ text, streaming }: { text: string; streaming: boolean }) {
  const [copied, setCopied] = useState(false);
  const [reaction, setReaction] = useState<"like" | "dislike" | null>(null);
  const safeHtml = useMemo(() => {
    return DOMPurify.sanitize(normalizeFeedbackHtml(text), {
      ALLOWED_TAGS: ["article", "section", "h1", "h2", "h3", "p", "ul", "ol", "li", "strong", "em", "br"],
      ALLOWED_ATTR: [],
    });
  }, [text]);

  async function handleCopy() {
    if (!text.trim()) return;

    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1400);
    } catch {
      setCopied(false);
    }
  }

  return (
    <div className="mx-auto flex w-full max-w-3xl gap-3 sm:gap-4">
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-primary-fixed bg-primary-container text-on-primary-container shadow-sm sm:h-10 sm:w-10">
        <Icon name="smart_toy" className="h-3.5 w-3.5" />
      </div>
      <div className="min-w-0 flex-1">
        <div className="rounded-[18px] border border-black/10 bg-white p-4 text-[#1d1d1f] sm:p-5">
          <div className="ai-report-html" dangerouslySetInnerHTML={{ __html: safeHtml }} />
          {streaming ? <span className="apple-stream-cursor inline-block h-5 w-1 translate-y-1 rounded-full bg-[#0066cc]" /> : null}
        </div>
        <div className="mt-2 flex items-center gap-2 pl-1 text-[#6e6e73]">
          <button
            aria-label={copied ? "복사됨" : "피드백 복사"}
            className="apple-icon-button flex h-8 w-8 items-center justify-center rounded-full transition hover:text-[#1d1d1f] disabled:cursor-not-allowed disabled:opacity-40"
            disabled={streaming}
            onClick={handleCopy}
            title={copied ? "복사됨" : "복사"}
            type="button"
          >
            <Icon name={copied ? "check" : "copy"} className="h-5 w-5" />
          </button>
          <button
            aria-label="좋아요"
            className={`apple-icon-button flex h-8 w-8 items-center justify-center rounded-full transition hover:text-[#1d1d1f] ${
              reaction === "like" ? "text-[#0066cc]" : ""
            }`}
            onClick={() => setReaction((current) => (current === "like" ? null : "like"))}
            title="좋아요"
            type="button"
          >
            <Icon name="thumb_up" className="h-5 w-5" />
          </button>
          <button
            aria-label="싫어요"
            className={`apple-icon-button flex h-8 w-8 items-center justify-center rounded-full transition hover:text-[#1d1d1f] ${
              reaction === "dislike" ? "text-[#d70015]" : ""
            }`}
            onClick={() => setReaction((current) => (current === "dislike" ? null : "dislike"))}
            title="싫어요"
            type="button"
          >
            <Icon name="thumb_down" className="h-5 w-5" />
          </button>
        </div>
      </div>
    </div>
  );
}
