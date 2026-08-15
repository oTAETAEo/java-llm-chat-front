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
    <div className="apple-frosted-bar absolute bottom-0 left-0 z-40 flex w-full flex-col items-center gap-6 p-6 md:pb-10">
      <div className="flex w-full max-w-3xl items-center justify-center gap-2 px-6">
        <button className="apple-secondary-pill relative w-28 shrink-0 whitespace-nowrap" onClick={onWorkoutInputClick} type="button">
          <span
            aria-label={statusLabels[workoutInputStatus]}
            className={`absolute left-1 top-0 h-2.5 w-2.5 rounded-full ring-2 ring-white ${statusClassNames[workoutInputStatus]}`}
            role="status"
          />
          운동 입력
        </button>
        <button className="apple-primary-button mx-2 max-w-xs flex-1 whitespace-nowrap disabled:cursor-not-allowed disabled:opacity-60 sm:mx-4" disabled={generating} onClick={onGenerateFeedback} type="button">
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
