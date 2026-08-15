import { Icon } from "@/components/common/Icon";

export function GeneratingFeedbackIndicator() {
  return (
    <div
      className="mx-auto flex w-full max-w-3xl gap-3 sm:gap-4"
      role="status"
      aria-live="polite"
    >
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-primary-fixed bg-primary-container text-on-primary-container shadow-sm sm:h-10 sm:w-10">
        <Icon name="smart_toy" className="h-3.5 w-3.5" />
      </div>
      <div className="min-w-0 flex-1">
        <div className="inline-flex max-w-full flex-wrap items-center gap-3 rounded-[18px] border border-black/10 bg-white px-4 py-3 text-[#1d1d1f] shadow-[0_4px_20px_rgba(15,23,42,0.05)] sm:px-5 sm:py-4">
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
