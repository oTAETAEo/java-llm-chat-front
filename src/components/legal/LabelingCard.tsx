"use client";

type LabelingItem = {
  title: string;
  summary: string;
  detail: string;
};

const DEFAULT_ITEMS: LabelingItem[] = [
  {
    title: "처리 항목",
    summary: "이메일, 비밀번호, 닉네임, 운동 기록, 심박수 등",
    detail: "운동 피드백 제공을 위해 회원 정보와 FIT 파일에서 추출된 운동 센서 데이터를 처리합니다.",
  },
  {
    title: "처리 목적",
    summary: "회원 관리, 운동 기록 저장, AI 피드백 제공",
    detail: "로그인, 부정 이용 방지, 운동 분석, 코칭 피드백, 대시보드 통계 제공에 사용합니다.",
  },
  {
    title: "제3자 제공",
    summary: "원칙적으로 제공하지 않음",
    detail: "법령상 의무가 있거나 정보주체가 별도로 동의한 경우에만 제공합니다.",
  },
  {
    title: "처리위탁",
    summary: "AWS, Vercel, OpenAI API",
    detail: "서비스 호스팅, 배포, AI 피드백 생성을 위해 외부 서비스를 사용합니다.",
  },
  {
    title: "정보주체 권리",
    summary: "열람, 정정, 삭제, 처리정지, 전송 요구",
    detail: "이메일 또는 전화로 권리 행사를 요청할 수 있으며 지체 없이 처리합니다.",
  },
  {
    title: "고충처리",
    summary: "ggg7515@naver.com / 010-9799-7515",
    detail: "개인정보 관련 문의와 불만 처리 창구입니다.",
  },
];

export function LabelingCard({ items = DEFAULT_ITEMS }: { items?: LabelingItem[] }) {
  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {items.map((item) => (
        <section className="rounded-lg border border-black/10 bg-white p-4 shadow-sm" key={item.title}>
          <p className="text-xs font-semibold uppercase text-[#7a7a7a]">{item.title}</p>
          <p className="mt-2 text-sm font-semibold text-[#1d1d1f]">{item.summary}</p>
          <p className="mt-2 text-sm leading-6 text-[#555555]">{item.detail}</p>
        </section>
      ))}
    </div>
  );
}
