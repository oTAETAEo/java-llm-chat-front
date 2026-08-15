import type { ReactNode } from "react";

const iconPaths: Record<string, ReactNode> = {
  search: (
    <>
      <circle cx="11" cy="11" r="6" />
      <path d="m16 16 4 4" />
    </>
  ),
  sun: (
    <>
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2" />
      <path d="M12 20v2" />
      <path d="m4.93 4.93 1.41 1.41" />
      <path d="m17.66 17.66 1.41 1.41" />
      <path d="M2 12h2" />
      <path d="M20 12h2" />
      <path d="m6.34 17.66-1.41 1.41" />
      <path d="m19.07 4.93-1.41 1.41" />
    </>
  ),
  moon: <path d="M20 14.6A8 8 0 0 1 9.4 4 7 7 0 1 0 20 14.6Z" />,
  dock_to_left: (
    <>
      <rect x="4" y="4" width="16" height="16" rx="2" />
      <path d="M9 4v16" />
      <path d="m15 9-3 3 3 3" />
    </>
  ),
  dock_to_right: (
    <>
      <rect x="4" y="4" width="16" height="16" rx="2" />
      <path d="M15 4v16" />
      <path d="m9 9 3 3-3 3" />
    </>
  ),
  edit_square: (
    <>
      <rect x="4" y="4" width="16" height="16" rx="2" />
      <path d="m9 15 1.5-.3L17 8.2 15.8 7 9.3 13.5 9 15Z" />
    </>
  ),
  view_column: (
    <>
      <rect x="4" y="5" width="16" height="14" rx="2" />
      <path d="M10 5v14" />
      <path d="M15 5v14" />
    </>
  ),
  more_horiz: (
    <>
      <circle cx="6" cy="12" r="1" fill="currentColor" />
      <circle cx="12" cy="12" r="1" fill="currentColor" />
      <circle cx="18" cy="12" r="1" fill="currentColor" />
    </>
  ),
  more_vert: (
    <>
      <circle cx="12" cy="6" r="1" fill="currentColor" />
      <circle cx="12" cy="12" r="1" fill="currentColor" />
      <circle cx="12" cy="18" r="1" fill="currentColor" />
    </>
  ),
  logout: (
    <>
      <path d="M10 5H6a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h4" />
      <path d="M14 8l4 4-4 4" />
      <path d="M18 12H9" />
    </>
  ),
  chat_bubble: (
    <path d="M5 6.5A3.5 3.5 0 0 1 8.5 3h7A3.5 3.5 0 0 1 19 6.5v4A3.5 3.5 0 0 1 15.5 14H11l-4 4v-4.3A3.5 3.5 0 0 1 5 10.5v-4Z" />
  ),
  storefront: (
    <>
      <path d="M5 10h14l-1-5H6l-1 5Z" />
      <path d="M7 10v9h10v-9" />
      <path d="M9 19v-5h6v5" />
    </>
  ),
  smart_toy: (
    <>
      <rect x="6" y="8" width="12" height="10" rx="3" />
      <path d="M12 8V5" />
      <circle cx="10" cy="13" r="1" fill="currentColor" />
      <circle cx="14" cy="13" r="1" fill="currentColor" />
      <path d="M10 16h4" />
    </>
  ),
  keyboard_arrow_down: <path d="m7 10 5 5 5-5" />,
  cycling: (
    <>
      <circle cx="7" cy="17" r="3" />
      <circle cx="17" cy="17" r="3" />
      <path d="M9 17l3-7 3 7" />
      <path d="M11 10h4" />
      <path d="M12 10 9 7" />
      <path d="M15 7h3" />
    </>
  ),
  user: (
    <>
      <circle cx="12" cy="8" r="3" />
      <path d="M5 20a7 7 0 0 1 14 0" />
    </>
  ),
  award: (
    <>
      <circle cx="12" cy="8" r="4" />
      <path d="M9.5 12 8 21l4-2 4 2-1.5-9" />
    </>
  ),

  chat: (
    <path d="M5 6.5A3.5 3.5 0 0 1 8.5 3h7A3.5 3.5 0 0 1 19 6.5v5A3.5 3.5 0 0 1 15.5 15H11l-4 4v-4.4A3.5 3.5 0 0 1 5 11.5v-5Z" />
  ),
  fitness_center: (
    <>
      <path d="m6 7 11 11" />
      <path d="m4 9 3-3" />
      <path d="m17 18 3-3" />
      <path d="m8 5 2-2" />
      <path d="m14 21 2-2" />
    </>
  ),
  monitoring: (
    <>
      <path d="M4 19h16" />
      <path d="M6 15l4-4 3 3 5-7" />
    </>
  ),
  route: (
    <>
      <circle cx="6" cy="6" r="2" />
      <circle cx="18" cy="18" r="2" />
      <path d="M8 6h3a3 3 0 0 1 0 6H9a3 3 0 0 0 0 6h7" />
    </>
  ),
  timer: (
    <>
      <circle cx="12" cy="13" r="7" />
      <path d="M12 13V9" />
      <path d="M12 13l3 2" />
      <path d="M9 3h6" />
    </>
  ),
  favorite: (
    <path d="M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10Z" />
  ),
  terrain: (
    <>
      <path d="M3 20h18" />
      <path d="m4 20 5-10 4 6 3-5 4 9" />
    </>
  ),
  filter: (
    <>
      <path d="M4 6h16" />
      <path d="M7 12h10" />
      <path d="M10 18h4" />
    </>
  ),
  calendar: (
    <>
      <rect x="4" y="5" width="16" height="15" rx="2" />
      <path d="M8 3v4" />
      <path d="M16 3v4" />
      <path d="M4 10h16" />
    </>
  ),
  upload_file: (
    <>
      <path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8Z" />
      <path d="M14 3v5h5" />
      <path d="M12 17V10" />
      <path d="m9 13 3-3 3 3" />
    </>
  ),
  file: (
    <>
      <path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8Z" />
      <path d="M14 3v5h5" />
      <path d="M8.5 13h7" />
      <path d="M8.5 17h5" />
    </>
  ),
  x: (
    <>
      <path d="M6 6l12 12" />
      <path d="M18 6 6 18" />
    </>
  ),
  keep: (
    <>
      <path d="M8 4h8" />
      <path d="M10 4l1 7-3 3h8l-3-3 1-7" />
      <path d="M12 14v6" />
    </>
  ),
  keep_off: (
    <>
      <path d="M8 4h8" />
      <path d="M10 4l1 7-3 3h8l-3-3 1-7" />
      <path d="M12 14v6" />
      <path d="M5 5l14 14" />
    </>
  ),
  trash: (
    <>
      <path d="M4 7h16" />
      <path d="M10 11v6" />
      <path d="M14 11v6" />
      <path d="M6 7l1 13h10l1-13" />
      <path d="M9 7V4h6v3" />
    </>
  ),
  copy: (
    <>
      <rect x="8" y="8" width="11" height="11" rx="2" />
      <path d="M5 15V6a2 2 0 0 1 2-2h9" />
    </>
  ),
  check: <path d="m5 12 4 4L19 6" />,
  thumb_up: (
    <>
      <path d="M7 10v10" />
      <path d="M4 10h3v10H4a1 1 0 0 1-1-1v-8a1 1 0 0 1 1-1Z" />
      <path d="M7 10l5-7 1 1a3 3 0 0 1 .5 3.2L13 9h5.4a2 2 0 0 1 2 2.3l-1.1 7a2 2 0 0 1-2 1.7H7" />
    </>
  ),
  thumb_down: (
    <>
      <path d="M17 14V4" />
      <path d="M20 14h-3V4h3a1 1 0 0 1 1 1v8a1 1 0 0 1-1 1Z" />
      <path d="M17 14l-5 7-1-1a3 3 0 0 1-.5-3.2L11 15H5.6a2 2 0 0 1-2-2.3l1.1-7A2 2 0 0 1 6.7 4H17" />
    </>
  ),
};

export function Icon({
  name,
  className = "h-[18px] w-[18px]",
}: {
  name: string;
  className?: string;
}) {
  return (
    <svg
      aria-hidden="true"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="1.8"
      viewBox="0 0 24 24"
    >
      {iconPaths[name] ?? iconPaths.more_horiz}
    </svg>
  );
}
