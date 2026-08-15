import type { AuthUser } from "@/lib/api";

export function TopAuthActions({
  user,
  onLoginClick,
  onSignUpClick,
}: {
  user: AuthUser | null;
  onLoginClick: () => void;
  onSignUpClick: () => void;
}) {
  return (
    <div className="absolute right-4 top-4 z-50 flex items-center gap-2">
      {user ? (
        <span className="hidden rounded-full bg-white/90 px-4 py-2 text-sm text-[#1d1d1f] ring-1 ring-black/10 sm:inline">
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
