import { Icon } from "@/components/common/Icon";

export function MobileNav() {
  const items = [
    { icon: "chat", label: "Chat", active: true },
    { icon: "fitness_center", label: "Coach" },
    { icon: "monitoring", label: "Progress" },
    { icon: "more_horiz", label: "More" },
  ];

  return (
    <nav className="fixed bottom-0 left-0 z-50 flex w-full items-center justify-around border-t border-outline-variant bg-surface px-margin-mobile py-2 shadow-lg md:hidden">
      {items.map((item) => (
        <a
          className={`flex flex-col items-center justify-center rounded-xl px-3 py-1 transition-colors ${
            item.active ? "scale-95 bg-secondary-container text-on-secondary-container" : "text-on-surface-variant hover:bg-surface-container-high"
          }`}
          href="#"
          key={item.label}
        >
          <Icon name={item.icon} />
          <span className="mt-1 text-[12px] font-bold uppercase leading-4 tracking-wider">{item.label}</span>
        </a>
      ))}
    </nav>
  );
}
