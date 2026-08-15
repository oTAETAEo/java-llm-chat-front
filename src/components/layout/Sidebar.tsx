"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import type { AuthUser, FeedbackRoomSummary } from "@/lib/api";
import { Icon } from "@/components/common/Icon";

function SidebarButton({
  icon,
  children,
  active = false,
  onClick,
  iconClassName,
}: {
  icon?: string;
  children: ReactNode;
  active?: boolean;
  onClick?: () => void;
  iconClassName?: string;
}) {
  return (
    <button
      className={`flex w-full items-center gap-3 rounded-lg p-2 text-left transition-colors ${
        active
          ? "bg-[#f5f5f7] font-medium text-[#1d1d1f] hover:bg-[#f0f0f0]"
          : "text-[#333333] hover:bg-surface-container-low hover:text-on-surface"
      }`}
      onClick={onClick}
      type="button"
    >
      {icon ? <Icon name={icon} className={iconClassName} /> : null}
      <span className="truncate text-sm">{children}</span>
    </button>
  );
}

function RoomRow({
  room,
  active,
  generationStatus,
  onRoomClick,
  onTogglePin,
  onRename,
  onDelete,
  menuOpen,
  onMenuToggle,
  onMenuClose,
}: {
  room: FeedbackRoomSummary;
  active: boolean;
  generationStatus?: "generating" | "completed";
  onRoomClick: (roomId: string) => void;
  onTogglePin: (room: FeedbackRoomSummary) => void;
  onRename: (room: FeedbackRoomSummary, title: string) => void;
  onDelete: (room: FeedbackRoomSummary) => void;
  menuOpen: boolean;
  onMenuToggle: () => void;
  onMenuClose: () => void;
}) {
  const [editing, setEditing] = useState(false);
  const [title, setTitle] = useState(room.title);

  function submitRename() {
    const nextTitle = title.trim();
    if (!nextTitle || nextTitle === room.title) {
      setTitle(room.title);
      setEditing(false);
      return;
    }

    onRename(room, nextTitle);
    setEditing(false);
  }

  return (
    <div className="group relative">
      {editing ? (
        <form
          className="flex w-full items-center gap-2 rounded-lg bg-[#f5f5f7] p-1.5 pr-2"
          onSubmit={(event) => {
            event.preventDefault();
            submitRename();
          }}
        >
          <Icon
            name={room.pinned ? "keep" : "chat_bubble"}
            className="h-[18px] w-[18px] shrink-0 text-outline"
          />
          <input
            autoFocus
            className="min-w-0 flex-1 rounded-md border border-black/10 bg-white px-2 py-1 text-sm text-[#1d1d1f] outline-none focus:border-[#0066cc]"
            onBlur={submitRename}
            onChange={(event) => setTitle(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Escape") {
                setTitle(room.title);
                setEditing(false);
              }
            }}
            value={title}
          />
        </form>
      ) : (
        <button
          className={`flex w-full items-center gap-2 rounded-lg p-2 pr-20 text-left transition-colors ${
            active
              ? "bg-[#f5f5f7] font-medium text-[#1d1d1f]"
              : "text-[#333333] hover:bg-surface-container-low hover:text-on-surface"
          }`}
          onClick={() => onRoomClick(room.roomId)}
          type="button"
        >
          <Icon
            name={room.pinned ? "keep" : "chat_bubble"}
            className="h-[18px] w-[18px] shrink-0 text-outline"
          />
          <span className="min-w-0 flex-1 truncate text-sm">{room.title}</span>
        </button>
      )}
      {generationStatus === "generating" ? (
        <span
          aria-label="피드백 생성 중"
          className="pointer-events-none absolute right-12 top-1/2 h-2.5 w-2.5 -translate-y-1/2 animate-spin rounded-full border-2 border-[#0066cc]/25 border-t-[#0066cc]"
        />
      ) : null}
      {generationStatus === "completed" ? (
        <span
          aria-label="새 피드백 도착"
          className="pointer-events-none absolute right-12 top-1/2 h-2.5 w-2.5 -translate-y-1/2 rounded-full bg-[#0066cc]"
        />
      ) : null}
      <button
        aria-label={
          room.pinned ? `${room.title} 고정 해제` : `${room.title} 고정`
        }
        className={`apple-icon-button absolute right-8 top-1/2 h-7 w-7 -translate-y-1/2 items-center justify-center p-1 ${
          editing ? "hidden" : "hidden group-hover:flex focus:flex"
        } ${room.pinned ? "flex text-[#0066cc]" : "text-[#71717a]"}`}
        onClick={(event) => {
          event.stopPropagation();
          onTogglePin(room);
        }}
        type="button"
      >
        <Icon name={room.pinned ? "keep_off" : "keep"} className="h-4 w-4" />
      </button>
      <button
        aria-label={`${room.title} 메뉴`}
        className={`apple-icon-button absolute right-1 top-1/2 h-7 w-7 -translate-y-1/2 items-center justify-center p-1 text-[#71717a] aria-expanded:flex ${
          editing ? "hidden" : "hidden group-hover:flex"
        }`}
        aria-expanded={menuOpen}
        onClick={(event) => {
          event.stopPropagation();
          onMenuToggle();
        }}
        type="button"
      >
        <Icon name="more_horiz" className="h-4 w-4" />
      </button>
      {menuOpen ? (
        <div className="absolute right-1 top-8 z-50 w-32 overflow-hidden rounded-xl border border-black/10 bg-white py-1 shadow-[0_12px_36px_rgba(0,0,0,0.14)]">
          <button
            className="flex w-full items-center gap-2 px-3 py-2 text-left text-xs text-[#333333] hover:bg-[#f5f5f7]"
            onClick={() => {
              onMenuClose();
              setTitle(room.title);
              setEditing(true);
            }}
            type="button"
          >
            <Icon name="edit_square" className="h-4 w-4" />
            제목 수정
          </button>
          <button
            className="flex w-full items-center gap-2 px-3 py-2 text-left text-xs text-[#d70015] hover:bg-red-50"
            onClick={() => {
              onMenuClose();
              onDelete(room);
            }}
            type="button"
          >
            <Icon name="trash" className="h-4 w-4" />
            삭제
          </button>
        </div>
      ) : null}
    </div>
  );
}

export function Sidebar({
  open,
  onClose,
  user,
  onLoginClick,
  onLogoutClick,
  onNewChatClick,
  onWorkoutHistoryClick,
  pinnedRooms = [],
  recentRooms = [],
  activeRoomId,
  workoutHistoryActive = false,
  generatingRoomIds = [],
  completedRoomIds = [],
  onRoomClick,
  onTogglePinRoom,
  onRenameRoom,
  onDeleteRoom,
}: {
  open: boolean;
  onClose: () => void;
  user: AuthUser | null;
  onLoginClick: () => void;
  onLogoutClick: () => void;
  onNewChatClick: () => void;
  onWorkoutHistoryClick?: () => void;
  pinnedRooms?: FeedbackRoomSummary[];
  recentRooms?: FeedbackRoomSummary[];
  activeRoomId?: string;
  workoutHistoryActive?: boolean;
  generatingRoomIds?: string[];
  completedRoomIds?: string[];
  onRoomClick?: (roomId: string) => void;
  onTogglePinRoom?: (room: FeedbackRoomSummary) => void;
  onRenameRoom?: (room: FeedbackRoomSummary, title: string) => void;
  onDeleteRoom?: (room: FeedbackRoomSummary) => void;
}) {
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const sidebarMenuRef = useRef<HTMLDivElement | null>(null);
  const profileMenuOpen = openMenuId === "profile";

  const profileMenuItems = [
    {
      label: "로그아웃",
      icon: "logout",
      tone: "danger" as const,
      onClick: onLogoutClick,
    },
  ];

  useEffect(() => {
    if (!openMenuId) return;

    function closeSidebarMenu(event: MouseEvent) {
      if (!sidebarMenuRef.current?.contains(event.target as Node)) {
        setOpenMenuId(null);
      }
    }

    function closeSidebarMenuWithEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpenMenuId(null);
      }
    }

    document.addEventListener("mousedown", closeSidebarMenu);
    document.addEventListener("keydown", closeSidebarMenuWithEscape);
    return () => {
      document.removeEventListener("mousedown", closeSidebarMenu);
      document.removeEventListener("keydown", closeSidebarMenuWithEscape);
    };
  }, [openMenuId]);

  const renderRoom = (room: FeedbackRoomSummary) => (
    <RoomRow
      active={room.roomId === activeRoomId}
      generationStatus={
        generatingRoomIds.includes(room.roomId)
          ? "generating"
          : completedRoomIds.includes(room.roomId)
            ? "completed"
            : undefined
      }
      key={room.roomId}
      menuOpen={openMenuId === `room:${room.roomId}`}
      onDelete={(target) => onDeleteRoom?.(target)}
      onMenuClose={() => setOpenMenuId(null)}
      onMenuToggle={() =>
        setOpenMenuId((current) =>
          current === `room:${room.roomId}` ? null : `room:${room.roomId}`,
        )
      }
      onRename={(target, title) => onRenameRoom?.(target, title)}
      onRoomClick={(roomId) => {
        setOpenMenuId(null);
        onRoomClick?.(roomId);
      }}
      onTogglePin={(target) => {
        setOpenMenuId(null);
        onTogglePinRoom?.(target);
      }}
      room={room}
    />
  );

  return (
    <aside
      className={`flex h-full shrink-0 flex-col overflow-hidden border-r border-outline-variant/30 bg-white text-on-surface shadow-[4px_0_24px_rgba(0,0,0,0.02)] transition-all duration-300 ease-in-out ${
        open ? "w-[260px] opacity-100" : "w-0 opacity-0"
      }`}
      ref={sidebarMenuRef}
    >
      <div className="flex h-full flex-1 flex-col overflow-hidden whitespace-nowrap">
        <div className="flex items-center justify-between p-4 pb-2">
          <div className="w-full" />
          <div className="flex gap-1 text-on-surface-variant">
            <button
              aria-label="검색"
              className="apple-icon-button flex items-center justify-center p-1.5"
              type="button"
            >
              <Icon name="search" className="h-7 w-7" />
            </button>
            <button
              aria-label="사이드바 닫기"
              className="apple-icon-button flex items-center justify-center p-1.5"
              onClick={onClose}
              type="button"
            >
              <Icon name="dock_to_left" className="h-7 w-7" />
            </button>
          </div>
        </div>

        <div className="sidebar-scroll flex flex-1 flex-col gap-1 overflow-y-auto px-3 py-2">
          <div className="mt-4">
            <button
              className="flex w-full items-center gap-3 rounded-lg bg-[#f5f5f7] p-2 text-left font-medium text-[#1d1d1f] transition-colors hover:bg-[#f0f0f0]"
              onClick={onNewChatClick}
              type="button"
            >
              <Icon name="edit_square" className="h-7 w-7" />
              <span className="truncate text-sm">새 운동 피드백</span>
            </button>
          </div>
          <SidebarButton
            active={workoutHistoryActive}
            icon="view_column"
            iconClassName="h-7 w-7"
            onClick={() => {
              setOpenMenuId(null);
              onWorkoutHistoryClick?.();
            }}
          >
            운동 기록
          </SidebarButton>
          <SidebarButton icon="more_horiz" iconClassName="h-7 w-7">
            더 보기
          </SidebarButton>

          <div className="mb-1 mt-6 px-2">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-outline">
              고정됨
            </span>
          </div>
          {pinnedRooms.length > 0 ? (
            pinnedRooms.map(renderRoom)
          ) : (
            <div className="rounded-lg px-2 py-2 text-xs leading-5 text-[#9a9a9a]">
              고정된 운동 피드백이 없습니다.
            </div>
          )}

          <div className="mb-1 mt-6 px-2">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-outline">
              최근
            </span>
          </div>
          {recentRooms.length > 0 ? (
            recentRooms.map(renderRoom)
          ) : (
            <div className="rounded-lg px-2 py-2 text-xs leading-5 text-[#9a9a9a]">
              새 운동 피드백을 받아보세요.
            </div>
          )}
        </div>
      </div>

      <div className="bg-white p-3">
        {user ? (
          <div className="relative">
            {profileMenuOpen ? (
              <div className="absolute bottom-full left-0 z-50 mb-2 w-full overflow-hidden rounded-2xl border border-black/10 bg-white p-1 shadow-[0_18px_50px_rgba(0,0,0,0.16)]">
                {profileMenuItems.map((item) => (
                  <button
                    className={`flex w-full items-center gap-2 rounded-xl px-3 py-2.5 text-left text-sm font-medium transition-colors ${
                      item.tone === "danger"
                        ? "text-[#d70015] hover:bg-red-50"
                        : "text-[#1d1d1f] hover:bg-[#f5f5f7]"
                    }`}
                    key={item.label}
                    onClick={() => {
                      setOpenMenuId(null);
                      item.onClick();
                    }}
                    type="button"
                  >
                    <Icon name={item.icon} className="h-4.5 w-4.5" />
                    <span className="truncate">{item.label}</span>
                  </button>
                ))}
              </div>
            ) : null}

            <div className="flex w-full items-center gap-3 rounded-2xl bg-[#f4f4f5] p-3 transition-colors hover:bg-[#e4e4e7]">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#1d1d1f] text-sm font-medium text-white">
                {user.nickname.slice(0, 2).toUpperCase()}
              </div>
              <div className="min-w-0 flex-1">
                <div className="truncate text-[15px] font-medium text-[#18181b]">
                  {user.nickname}
                </div>
                <div className="truncate text-[13px] text-[#71717a]">
                  {user.email}
                </div>
              </div>
              <button
                aria-expanded={profileMenuOpen}
                aria-label="프로필 메뉴"
                className="apple-icon-button flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[#71717a] transition hover:text-[#1d1d1f]"
                onClick={() =>
                  setOpenMenuId((current) =>
                    current === "profile" ? null : "profile",
                  )
                }
                type="button"
              >
                <Icon name="more_vert" className="h-5 w-5" />
              </button>
            </div>
          </div>
        ) : (
          <button
            className="apple-primary-button w-full"
            onClick={onLoginClick}
            type="button"
          >
            로그인
          </button>
        )}
      </div>
    </aside>
  );
}
