import type { FeedbackRequest } from "@/lib/api";
import { TierDropdown } from "@/components/chat/TierDropdown";

export function BottomActionBar({
  tier,
  onTierChange,
  onWorkoutInputClick,
  onGenerateFeedback,
  generating,
  hasWorkout,
  workoutInputStatus,
}: {
  tier: FeedbackRequest["tier"];
  onTierChange: (tier: FeedbackRequest["tier"]) => void;
  onWorkoutInputClick: () => void;
  onGenerateFeedback: () => void;
  generating: boolean;
  hasWorkout: boolean;
  workoutInputStatus: "empty" | "partial" | "complete";
}) {
  const statusClassNames = {
    empty: "bg-[#ff3b30]",
    partial: "bg-[#ff9500]",
    complete: "bg-[#34c759]",
  };
  const statusLabels = {
    empty: "운동 데이터 없음",
    partial: "필수 운동 데이터 미완성",
    complete: "운동 데이터 입력 완료",
  };

  return (
    <div className="apple-frosted-bar absolute bottom-0 left-0 z-40 flex w-full flex-col items-center gap-4 p-4 sm:gap-6 sm:p-6 md:pb-10">
      <div className="grid w-full max-w-3xl grid-cols-[minmax(0,1fr)_6rem] items-center gap-2 sm:flex sm:justify-center sm:px-6">
        <button className="apple-secondary-pill relative w-full whitespace-nowrap px-4 text-sm sm:w-28 sm:shrink-0 sm:text-[17px]" onClick={onWorkoutInputClick} type="button">
          <span
            aria-label={statusLabels[workoutInputStatus]}
            className={`absolute left-1 top-0 h-2.5 w-2.5 rounded-full ring-2 ring-white ${statusClassNames[workoutInputStatus]}`}
            role="status"
          />
          운동 입력
        </button>
        <button className="apple-primary-button order-3 col-span-2 mx-0 w-full max-w-none flex-1 whitespace-nowrap text-sm disabled:cursor-not-allowed disabled:opacity-60 sm:order-none sm:mx-4 sm:max-w-xs sm:text-[17px]" disabled={generating} onClick={onGenerateFeedback} type="button">
          {generating ? "생성 중..." : hasWorkout ? "피드백 생성" : "피드백 생성"}
        </button>
        <TierDropdown tier={tier} onTierChange={onTierChange} />
      </div>
      <div className="text-center">
        <span className="text-[10px] font-bold uppercase tracking-wider text-outline opacity-70">
          AI Coach may produce inaccurate information about complex medical conditions.
        </span>
      </div>
    </div>
  );
}
