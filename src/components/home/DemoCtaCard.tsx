import { forwardRef } from "react";

type DemoCtaCardProps = {
  onStart: () => void;
};

export const DemoCtaCard = forwardRef<HTMLDivElement, DemoCtaCardProps>(
  function DemoCtaCard({ onStart }, ref) {
    return (
      <div className="apple-demo-enter mx-auto w-full max-w-3xl" ref={ref}>
        <div className="rounded-[24px] border border-[#0066cc]/15 bg-gradient-to-br from-white to-[#f0f6ff] p-5 shadow-[0_18px_50px_rgba(0,102,204,0.10)]">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#0066cc]">
                Ready to train smarter?
              </p>
              <h3 className="mt-2 text-xl font-semibold tracking-[-0.3px] text-[#1d1d1f]">
                내 운동 데이터로 AI 코칭을 시작해 보세요.
              </h3>
              <p className="mt-2 text-sm leading-6 text-[#6e6e73]">
                회원가입하면 운동과 피드백을 저장하고, 이전 기록을 이어서 확인할
                수 있습니다.
              </p>
            </div>
            <button
              className="apple-primary-button shrink-0 px-6"
              onClick={onStart}
              type="button"
            >
              바로 시작
            </button>
          </div>
        </div>
      </div>
    );
  },
);
