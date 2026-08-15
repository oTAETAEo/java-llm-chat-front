"use client";

import { useState } from "react";
import type { FeedbackRequest } from "@/lib/api";
import { Icon } from "@/components/common/Icon";

export function TierDropdown({
  tier,
  onTierChange,
}: {
  tier: FeedbackRequest["tier"];
  onTierChange: (tier: FeedbackRequest["tier"]) => void;
}) {
  const [open, setOpen] = useState(false);
  const options: Array<{ label: string; value: FeedbackRequest["tier"] }> = [
    { label: "아마추어", value: "AMATEUR" },
    { label: "프로", value: "PRO" },
  ];
  const selectedLabel = options.find((option) => option.value === tier)?.label ?? "아마추어";

  return (
    <div className="relative w-24 shrink-0">
      <button className="apple-pearl-capsule flex w-full items-center justify-center gap-1 px-2" onClick={() => setOpen((value) => !value)} type="button">
        <span className="text-[10px] font-bold uppercase tracking-wider">{selectedLabel}</span>
        <Icon name="keyboard_arrow_down" className="h-4 w-4" />
      </button>
      {open ? (
        <div className="absolute bottom-full left-0 z-50 mb-2 w-full overflow-hidden rounded-xl border border-outline-variant/30 bg-surface-container-lowest shadow-lg">
          {options.map((option) => (
            <button
              className={`w-full px-4 py-3 text-left text-[10px] font-bold uppercase tracking-wider transition-colors hover:bg-surface-container-low ${
                option.value === tier ? "bg-white text-[#1d1d1f] ring-1 ring-[#0066cc]" : "text-on-surface-variant"
              }`}
              key={option.value}
              onClick={() => {
                onTierChange(option.value);
                setOpen(false);
              }}
              type="button"
            >
              {option.label}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
