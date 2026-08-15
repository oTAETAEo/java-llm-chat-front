"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

type CookieConsent = {
  essential: true;
  functional: boolean;
  analytics: boolean;
  marketing: boolean;
};

const STORAGE_KEY = "activity-coaching-cookie-consent";

function saveConsent(consent: CookieConsent) {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(consent));
  window.dispatchEvent(new CustomEvent("cookie-consent-changed", { detail: consent }));
}

export function CookieBanner() {
  const [visible, setVisible] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [functional, setFunctional] = useState(true);
  const [analytics, setAnalytics] = useState(false);
  const [marketing, setMarketing] = useState(false);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setVisible(!window.localStorage.getItem(STORAGE_KEY));
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);

  if (!visible) return null;

  function acceptAll() {
    saveConsent({ essential: true, functional: true, analytics: true, marketing: true });
    setVisible(false);
  }

  function acceptSelected() {
    saveConsent({ essential: true, functional, analytics, marketing });
    setVisible(false);
  }

  function rejectOptional() {
    saveConsent({ essential: true, functional: false, analytics: false, marketing: false });
    setVisible(false);
  }

  return (
    <section className="fixed inset-x-0 bottom-0 z-[110] border-t border-black/10 bg-white/95 px-4 py-4 shadow-[0_-16px_40px_rgba(0,0,0,0.12)] backdrop-blur">
      <div className="mx-auto max-w-4xl">
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div>
            <h2 className="text-base font-semibold text-[#1d1d1f]">쿠키 사용 안내</h2>
            <p className="mt-1 max-w-2xl text-sm leading-6 text-[#333333]">
              로그인과 보안에 필요한 필수 쿠키를 사용합니다. 기능, 분석, 마케팅 쿠키는 선택 사항이며 언제든 브라우저 설정에서 거부할 수 있습니다. 자세한 내용은{" "}
              <Link className="text-[#0066cc] underline" href="/privacy">
                개인정보 처리방침
              </Link>
              에서 확인할 수 있습니다.
            </p>
          </div>
          <div className="flex shrink-0 flex-wrap gap-2">
            <button className="apple-pearl-capsule" onClick={() => setSettingsOpen((open) => !open)} type="button">
              설정
            </button>
            <button className="apple-secondary-pill" onClick={rejectOptional} type="button">
              선택 거부
            </button>
            <button className="apple-primary-button" onClick={settingsOpen ? acceptSelected : acceptAll} type="button">
              {settingsOpen ? "선택 동의" : "모두 동의"}
            </button>
          </div>
        </div>

        {settingsOpen ? (
          <div className="mt-4 grid gap-3 rounded-lg border border-black/10 bg-[#f5f5f7] p-4 sm:grid-cols-2 lg:grid-cols-4">
            <CookieOption checked disabled label="필수 쿠키" text="로그인, 보안, 인증 유지" />
            <CookieOption checked={functional} label="기능 쿠키" onChange={setFunctional} text="사용 편의 설정 저장" />
            <CookieOption checked={analytics} label="분석 쿠키" onChange={setAnalytics} text="서비스 이용 통계" />
            <CookieOption checked={marketing} label="마케팅 쿠키" onChange={setMarketing} text="이벤트 안내와 광고 성과 측정" />
          </div>
        ) : null}
      </div>
    </section>
  );
}

function CookieOption({
  checked,
  disabled = false,
  label,
  onChange,
  text,
}: {
  checked: boolean;
  disabled?: boolean;
  label: string;
  onChange?: (checked: boolean) => void;
  text: string;
}) {
  return (
    <label className="flex items-start gap-3 text-sm text-[#333333]">
      <input
        checked={checked}
        className="mt-1 h-4 w-4"
        disabled={disabled}
        onChange={(event) => onChange?.(event.target.checked)}
        type="checkbox"
      />
      <span>
        <span className="block font-semibold text-[#1d1d1f]">{label}</span>
        <span className="block leading-5 text-[#555555]">{text}</span>
      </span>
    </label>
  );
}
