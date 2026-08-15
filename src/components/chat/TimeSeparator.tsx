import { formatChatTimestamp } from "@/lib/chatTime";

export function TimeSeparator({ date }: { date: Date }) {
  return (
    <div className="my-4 flex justify-center">
      <span className="rounded-full bg-surface-container-high px-4 py-1 text-[12px] font-bold leading-4 tracking-wide text-on-surface-variant">
        {formatChatTimestamp(date)}
      </span>
    </div>
  );
}
