import type { FeedbackRoomSummary } from "@/lib/api";
import { Icon } from "@/components/common/Icon";

type DeleteRoomDialogProps = {
  room: FeedbackRoomSummary;
  onCancel: () => void;
  onConfirm: () => void;
};

export function DeleteRoomDialog({
  room,
  onCancel,
  onConfirm,
}: DeleteRoomDialogProps) {
  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/25 px-4 backdrop-blur-sm">
      <div className="w-full max-w-sm rounded-[28px] border border-white/60 bg-white/95 p-6 text-center shadow-[0_24px_80px_rgba(0,0,0,0.18)]">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-red-50 text-[#d70015]">
          <Icon name="trash" className="h-6 w-6" />
        </div>
        <h2 className="mt-4 text-xl font-semibold tracking-[-0.2px] text-[#1d1d1f]">
          채팅을 삭제할까요?
        </h2>
        <p className="mt-2 text-sm leading-6 text-[#6e6e73]">
          <span className="font-medium text-[#1d1d1f]">“{room.title}”</span>{" "}
          운동 피드백이 사이드바에서 삭제됩니다.
        </p>
        <div className="mt-6 flex gap-2">
          <button
            className="apple-secondary-pill flex-1"
            onClick={onCancel}
            type="button"
          >
            취소
          </button>
          <button
            className="flex-1 rounded-full bg-[#d70015] px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-[#b80012]"
            onClick={onConfirm}
            type="button"
          >
            삭제
          </button>
        </div>
      </div>
    </div>
  );
}
