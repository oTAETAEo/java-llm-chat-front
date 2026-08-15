import { Icon } from "@/components/common/Icon";

export function ChatMessage({ message, streaming = false }: { message: string; streaming?: boolean }) {
  return (
    <div className="mx-auto flex w-full max-w-3xl gap-3 sm:gap-4">
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-primary-fixed bg-primary-container text-on-primary-container shadow-sm sm:h-10 sm:w-10">
        <Icon name="smart_toy" className="h-3.5 w-3.5" />
      </div>
      <div className="flex min-w-0 flex-1 flex-col gap-2 sm:max-w-[85%]">
        <div className="rounded-xl rounded-tl-sm border border-outline-variant/30 bg-surface p-3 text-on-surface shadow-[0_4px_20px_rgba(15,23,42,0.05)] sm:p-4">
          <p className="break-words text-sm leading-6 sm:text-base">
            {message}
            {streaming ? <span className="apple-stream-cursor ml-0.5 inline-block h-5 w-1 translate-y-1 rounded-full bg-[#0066cc]" /> : null}
          </p>
        </div>
      </div>
    </div>
  );
}
