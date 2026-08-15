import { Icon } from "@/components/common/Icon";

export function GeneratingFeedbackIndicator() {
  return (
    <div
      className="mx-auto flex w-full max-w-3xl gap-4"
      role="status"
      aria-live="polite"
    >
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-primary-fixed bg-primary-container text-on-primary-container shadow-sm">
        <Icon name="smart_toy" className="h-3.5 w-3.5" />
      </div>
      <div className="min-w-0 flex-1">
        <div className="inline-flex items-center gap-3 rounded-[18px] border border-black/10 bg-white px-5 py-4 text-[#1d1d1f] shadow-[0_4px_20px_rgba(15,23,42,0.05)]">
          <span className="text-sm font-medium text-[#6e6e73]">
            피드백을 생성하고 있어요
          </span>
          <span className="apple-thinking-dots" aria-hidden="true">
            <span />
            <span />
            <span />
          </span>
        </div>
      </div>
    </div>
  );
}
