import type { AuthUser } from "@/lib/api";

export function TopAuthActions({
  user,
  authPending = false,
  onLoginClick,
  onSignUpClick,
}: {
  user: AuthUser | null;
  authPending?: boolean;
  onLoginClick: () => void;
  onSignUpClick: () => void;
}) {
  return (
    <div className="absolute right-4 top-4 z-50 flex items-center gap-2">
      {authPending ? (
        <div
          aria-label="로그인 상태 확인 중"
          className="h-9 w-28 rounded-full bg-white/70 ring-1 ring-black/5"
        />
      ) : user ? (
        <span className="inline-flex max-w-[42vw] truncate rounded-full bg-white/90 px-3 py-2 text-sm text-[#1d1d1f] ring-1 ring-black/10 sm:max-w-none sm:px-4">
          {user.nickname}님
        </span>
      ) : (
        <>
          <button
            className="apple-text-button"
            onClick={onLoginClick}
            type="button"
          >
            로그인
          </button>
          <button
            className="apple-primary-button min-h-9 px-4 text-sm"
            onClick={onSignUpClick}
            type="button"
          >
            회원 가입
          </button>
        </>
      )}
    </div>
  );
}
