import type { FeedbackMessage } from "@/lib/api";

export const MESSAGE_TIME_GAP_MS = 30 * 60 * 1000;

export function formatChatTimestamp(date: Date) {
  const now = new Date();
  const isToday = date.toDateString() === now.toDateString();
  const dayLabel = isToday
    ? "오늘"
    : `${date.getMonth() + 1}월 ${date.getDate()}일`;
  const hours = date.getHours();
  const period = hours < 12 ? "오전" : "오후";
  const displayHours = hours % 12 === 0 ? 12 : hours % 12;
  const minutes = String(date.getMinutes()).padStart(2, "0");

  return `${dayLabel} ${period} ${displayHours}:${minutes}`;
}

export function parseMessageDate(message: FeedbackMessage) {
  if (!message.createdAt) return null;

  const date = new Date(message.createdAt);
  return Number.isNaN(date.getTime()) ? null : date;
}

export function shouldShowTimeSeparator(
  current: Date | null,
  previous: Date | null,
) {
  return (
    current !== null &&
    (previous === null ||
      current.getTime() - previous.getTime() >= MESSAGE_TIME_GAP_MS)
  );
}
