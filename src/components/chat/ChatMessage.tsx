import { Icon } from "@/components/common/Icon";

export function ChatMessage({ message, streaming = false }: { message: string; streaming?: boolean }) {
  return (
    <div className="mx-auto flex w-full max-w-3xl gap-4">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-primary-fixed bg-primary-container text-on-primary-container shadow-sm">
        <Icon name="smart_toy" className="h-3.5 w-3.5" />
      </div>
      <div className="flex max-w-[85%] flex-col gap-2">
        <div className="rounded-xl rounded-tl-sm border border-outline-variant/30 bg-surface p-4 text-on-surface shadow-[0_4px_20px_rgba(15,23,42,0.05)]">
          <p className="text-base leading-6">
            {message}
            {streaming ? <span className="apple-stream-cursor ml-0.5 inline-block h-5 w-1 translate-y-1 rounded-full bg-[#0066cc]" /> : null}
          </p>
        </div>
      </div>
    </div>
  );
}
