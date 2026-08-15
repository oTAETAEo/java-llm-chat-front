"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

export type ConsentItem = {
  key: string;
  label: string;
  required: boolean;
  href?: string;
  description?: string;
};

export type ConsentResult = Record<string, boolean>;

const DEFAULT_ITEMS: ConsentItem[] = [
  {
    key: "terms",
    label: "이용약관 동의",
    required: true,
    href: "/terms",
    description: "서비스 이용 조건과 회원의 권리·의무를 확인합니다.",
  },
  {
    key: "privacy",
    label: "개인정보 수집·이용 동의",
    required: true,
    href: "/privacy",
    description: "회원 관리, 운동 기록 저장, AI 피드백 제공에 필요한 개인정보 처리에 동의합니다.",
  },
  {
    key: "sensitive",
    label: "건강 관련 운동 데이터 처리 동의",
    required: true,
    href: "/privacy",
    description: "심박수, 운동 강도 등 건강 관련 데이터가 운동 분석에 사용될 수 있습니다.",
  },
  {
    key: "marketing",
    label: "마케팅 정보 수신 동의",
    required: false,
    href: "/privacy#marketing-consent",
    description: "이벤트, 업데이트, 혜택 안내를 이메일 등으로 받을 수 있습니다.",
  },
];

export function ConsentModal({
  open,
  onClose,
  onConfirm,
  serviceName = "Workout AI Coach",
  items = DEFAULT_ITEMS,
}: {
  open: boolean;
  onClose: () => void;
  onConfirm: (result: ConsentResult) => void;
  serviceName?: string;
  items?: ConsentItem[];
}) {
  const [checked, setChecked] = useState<ConsentResult>({});
  const requiredItems = useMemo(() => items.filter((item) => item.required), [items]);
  const allRequiredChecked = requiredItems.every((item) => checked[item.key]);
  const allChecked = items.every((item) => checked[item.key]);

  if (!open) return null;

  function toggleAll(nextChecked: boolean) {
    setChecked(Object.fromEntries(items.map((item) => [item.key, nextChecked])));
  }

  function toggle(key: string) {
    setChecked((current) => ({ ...current, [key]: !current[key] }));
  }

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/30 px-4 backdrop-blur-sm">
      <section className="w-full max-w-lg rounded-lg bg-white p-6 shadow-2xl">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-sm text-[#7a7a7a]">{serviceName}</p>
            <h2 className="mt-1 text-2xl font-semibold text-[#1d1d1f]">서비스 이용 동의</h2>
          </div>
          <button aria-label="닫기" className="apple-icon-button" onClick={onClose} type="button">
            x
          </button>
        </div>

        <label className="mt-5 flex items-center gap-3 rounded-lg border border-black/10 bg-[#f5f5f7] p-4 text-sm font-semibold text-[#1d1d1f]">
          <input checked={allChecked} className="h-4 w-4" onChange={(event) => toggleAll(event.target.checked)} type="checkbox" />
          전체 동의
        </label>

        <div className="mt-4 space-y-3">
          {items.map((item) => (
            <label className="flex items-start gap-3 rounded-lg border border-black/10 p-4 text-sm" key={item.key}>
              <input checked={Boolean(checked[item.key])} className="mt-1 h-4 w-4" onChange={() => toggle(item.key)} type="checkbox" />
              <span className="min-w-0 flex-1">
                <span className="font-semibold text-[#1d1d1f]">
                  {item.required ? "[필수] " : "[선택] "}
                  {item.label}
                </span>
                {item.href ? (
                  <Link className="ml-2 text-[#0066cc] underline" href={item.href} target="_blank">
                    보기
                  </Link>
                ) : null}
                {item.description ? <span className="mt-1 block leading-6 text-[#555555]">{item.description}</span> : null}
              </span>
            </label>
          ))}
        </div>

        <div className="mt-5 flex justify-end gap-2">
          <button className="apple-secondary-pill" onClick={onClose} type="button">
            취소
          </button>
          <button className="apple-primary-button disabled:cursor-not-allowed disabled:opacity-50" disabled={!allRequiredChecked} onClick={() => onConfirm(checked)} type="button">
            동의하고 계속
          </button>
        </div>
      </section>
    </div>
  );
}
