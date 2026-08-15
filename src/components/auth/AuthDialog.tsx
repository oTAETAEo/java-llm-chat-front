"use client";

import { FormEvent, useState } from "react";
import type { AuthUser } from "@/lib/api";
import { login, signUp } from "@/lib/api";
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
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const isSignUp = mode === "signup";

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setLoading(true);

    try {
      if (isSignUp) {
        await signUp({ email, password, nickname });
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

          {error ? <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p> : null}

          <button className="apple-primary-button mt-2 w-full disabled:cursor-not-allowed disabled:opacity-60" disabled={loading} type="submit">
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
