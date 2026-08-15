"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import type { AuthUser, LegalTerm } from "@/lib/api";
import { getSignUpTerms, login, signUp } from "@/lib/api";
import { Icon } from "@/components/common/Icon";

export type AuthMode = "login" | "signup";

export function AuthDialog({
  mode,
  onModeChange,
  onClose,
  onAuthenticated,
}: {
  mode: AuthMode;
  onModeChange: (mode: AuthMode) => void;
  onClose: () => void;
  onAuthenticated: (user: AuthUser) => void;
}) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [nickname, setNickname] = useState("");
  const [terms, setTerms] = useState<LegalTerm[]>([]);
  const [agreedTermsIds, setAgreedTermsIds] = useState<number[]>([]);
  const [error, setError] = useState("");
  const [termsLoaded, setTermsLoaded] = useState(false);
  const [loading, setLoading] = useState(false);
  const isSignUp = mode === "signup";
  const termsLoading = isSignUp && !termsLoaded;
  const requiredTerms = useMemo(() => terms.filter((term) => term.required), [terms]);
  const agreedTermsIdSet = useMemo(() => new Set(agreedTermsIds), [agreedTermsIds]);
  const agreedAllRequiredTerms = requiredTerms.every((term) => agreedTermsIdSet.has(term.termsId));

  useEffect(() => {
    if (!isSignUp) return;

    let active = true;
    getSignUpTerms()
      .then((nextTerms) => {
        if (!active) return;
        setTerms(nextTerms);
        setTermsLoaded(true);
      })
      .catch((termsError) => {
        if (!active) return;
        setError(termsError instanceof Error ? termsError.message : "약관 정보를 불러오지 못했습니다.");
        setTermsLoaded(true);
      });

    return () => {
      active = false;
    };
  }, [isSignUp]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    if (isSignUp && !agreedAllRequiredTerms) {
      setError("필수 약관에 모두 동의해야 회원가입할 수 있습니다.");
      return;
    }

    setLoading(true);

    try {
      if (isSignUp) {
        await signUp({ email, password, nickname, agreedTermsIds });
      }

      const user = await login({ email, password });
      onAuthenticated(user);
      onClose();
    } catch (authError) {
      setError(authError instanceof Error ? authError.message : "인증 요청에 실패했습니다.");
    } finally {
      setLoading(false);
    }
  }

  function toggleTermsAgreement(termsId: number) {
    setAgreedTermsIds((currentIds) =>
      currentIds.includes(termsId)
        ? currentIds.filter((currentId) => currentId !== termsId)
        : [...currentIds, termsId],
    );
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/20 px-4 backdrop-blur-sm">
      <div className="apple-auth-panel w-full max-w-md p-6">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <p className="text-sm text-[#7a7a7a]">Workout AI Coach</p>
            <h2 className="mt-1 text-3xl font-semibold tracking-[-0.374px] text-[#1d1d1f]">
              {isSignUp ? "회원 가입" : "로그인"}
            </h2>
          </div>
          <button aria-label="닫기" className="apple-icon-button flex items-center justify-center" onClick={onClose} type="button">
            <Icon name="x" />
          </button>
        </div>

        <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
          {isSignUp ? (
            <label className="flex flex-col gap-2 text-sm text-[#333333]">
              닉네임
              <input className="apple-text-input" onChange={(event) => setNickname(event.target.value)} placeholder="choi taehyun" required type="text" value={nickname} />
            </label>
          ) : null}
          <label className="flex flex-col gap-2 text-sm text-[#333333]">
            이메일
            <input className="apple-text-input" onChange={(event) => setEmail(event.target.value)} placeholder="you@example.com" required type="email" value={email} />
          </label>
          <label className="flex flex-col gap-2 text-sm text-[#333333]">
            비밀번호
            <input className="apple-text-input" onChange={(event) => setPassword(event.target.value)} placeholder="비밀번호" required type="password" value={password} />
          </label>

          {isSignUp ? (
            <div className="rounded-lg border border-[#d2d2d7] p-4">
              <p className="text-sm font-medium text-[#1d1d1f]">약관 동의</p>
              <div className="mt-3 flex flex-col gap-3">
                {termsLoading ? <p className="text-sm text-[#7a7a7a]">약관을 불러오는 중입니다.</p> : null}
                {!termsLoading && terms.length === 0 ? <p className="text-sm text-[#7a7a7a]">표시할 약관이 없습니다.</p> : null}
                {terms.map((term) => (
                  <label className="flex items-start gap-3 text-sm text-[#333333]" key={term.termsId}>
                    <input
                      checked={agreedTermsIdSet.has(term.termsId)}
                      className="mt-1 h-4 w-4"
                      onChange={() => toggleTermsAgreement(term.termsId)}
                      type="checkbox"
                    />
                    <span className="min-w-0 flex-1">
                      <span className="font-medium text-[#1d1d1f]">
                        {term.required ? "[필수] " : "[선택] "}
                        {term.title}
                      </span>
                      <span className="ml-1 text-[#7a7a7a]">v{term.version}</span>
                      <a className="ml-2 text-[#0066cc]" href={term.contentUrl} rel="noreferrer" target="_blank">
                        보기
                      </a>
                    </span>
                  </label>
                ))}
              </div>
            </div>
          ) : null}

          {error ? <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p> : null}

          <button className="apple-primary-button mt-2 w-full disabled:cursor-not-allowed disabled:opacity-60" disabled={loading || termsLoading || (isSignUp && !agreedAllRequiredTerms)} type="submit">
            {loading ? "처리 중..." : isSignUp ? "회원 가입" : "로그인"}
          </button>
        </form>

        <div className="mt-5 text-center text-sm text-[#7a7a7a]">
          {isSignUp ? "이미 계정이 있나요?" : "아직 계정이 없나요?"}{" "}
          <button className="text-[#0066cc]" onClick={() => onModeChange(isSignUp ? "login" : "signup")} type="button">
            {isSignUp ? "로그인" : "회원 가입"}
          </button>
        </div>
      </div>
    </div>
  );
}
