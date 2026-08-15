"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import {
  getWorkoutDashboardHistories,
  getWorkoutDashboardSummary,
  getWorkoutDetail,
  saveFitWorkoutRecords,
  type FeedbackRequest,
  type WorkoutDetail,
  type WorkoutDashboardFilters,
  type WorkoutDashboardSummary,
  type WorkoutHistoryItem,
} from "@/lib/api";
import { Icon } from "@/components/common/Icon";
import {
  calculateAverageSpeed,
  formatDuration,
  formatNumber,
  formatPace,
} from "@/lib/workout";
import { demoWorkouts } from "@/constants/demo";

type FilterPeriod = WorkoutDashboardFilters["period"];
type FilterWorkoutType = WorkoutDashboardFilters["workOutType"];

const periodOptions: Array<{ label: string; value: FilterPeriod }> = [
  { label: "전체", value: "ALL" },
  { label: "7일", value: "7d" },
  { label: "30일", value: "30d" },
  { label: "90일", value: "90d" },
  { label: "직접 선택", value: "custom" },
];

const workoutTypeOptions: Array<{ label: string; value: FilterWorkoutType }> = [
  { label: "전체", value: "ALL" },
  { label: "러닝", value: "RUNNING" },
  { label: "사이클", value: "CYCLING" },
];

const HISTORY_PAGE_SIZE = 20;
const MAX_FIT_UPLOAD_COUNT = 10;

type WorkoutHistoryDashboardProps = {
  demoMode?: boolean;
  onRequestFeedback?: (workout: WorkoutDetail) => void | Promise<void>;
};
const MAX_RECENT_DISTANCE_BARS = 7;
const trendTones = {
  distance: {
    bar: "bg-[#2563eb]",
    barHover: "group-hover:bg-[#1d4ed8]",
    badge: "bg-[#eef2ff]",
    badgeText: "text-[#3730a3]",
  },
  duration: {
    bar: "bg-[#059669]",
    barHover: "group-hover:bg-[#047857]",
    badge: "bg-[#ecfdf5]",
    badgeText: "text-[#047857]",
  },
  heartRate: {
    bar: "bg-[#e11d48]",
    barHover: "group-hover:bg-[#be123c]",
    badge: "bg-[#fff1f2]",
    badgeText: "text-[#be123c]",
  },
  elevation: {
    bar: "bg-[#7c3aed]",
    barHover: "group-hover:bg-[#6d28d9]",
    badge: "bg-[#f5f3ff]",
    badgeText: "text-[#6d28d9]",
  },
} satisfies Record<string, TrendTone>;

function resolveErrorMessage(error: unknown, fallback: string) {
  return error instanceof Error ? error.message : fallback;
}

function formatFileSize(size: number) {
  if (size < 1024 * 1024) {
    return `${Math.max(1, Math.round(size / 1024))}KB`;
  }
  return `${(size / 1024 / 1024).toFixed(1)}MB`;
}

function compactDateParts(value: string) {
  const date = new Date(value);
  return {
    date: new Intl.DateTimeFormat("ko-KR", {
      month: "numeric",
      day: "numeric",
    }).format(date),
    weekday: new Intl.DateTimeFormat("ko-KR", {
      weekday: "short",
    }).format(date),
  };
}

function compactDate(value: string) {
  const { date, weekday } = compactDateParts(value);
  return `${date} (${weekday})`;
}

function startTime(value: string) {
  const date = new Date(value);
  return new Intl.DateTimeFormat("ko-KR", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(date);
}

function workoutTypeLabel(type: FeedbackRequest["workOutType"]) {
  return type === "RUNNING" ? "러닝" : "사이클";
}

function tierLabel(tier: FeedbackRequest["tier"]) {
  return tier === "PRO" ? "프로" : "아마추어";
}

function sourceLabel(source: FeedbackRequest["inputSource"]) {
  return source === "FIT_FILE" ? "FIT" : "직접 입력";
}

function isInPeriod(workout: FeedbackRequest, filters: WorkoutDashboardFilters) {
  if (filters.period === "ALL") return true;

  const startedAt = new Date(workout.startedAt);
  const now = new Date();

  if (filters.period === "custom") {
    const start = filters.startDate ? new Date(filters.startDate) : null;
    const end = filters.endDate ? new Date(filters.endDate) : null;
    if (start && startedAt < start) return false;
    if (end) {
      const endOfDay = new Date(end);
      endOfDay.setHours(23, 59, 59, 999);
      if (startedAt > endOfDay) return false;
    }
    return true;
  }

  const days = Number(filters.period.replace("d", ""));
  const cutoff = new Date(now);
  cutoff.setDate(now.getDate() - days);
  return startedAt >= cutoff;
}

function demoHistoryItems(filters: WorkoutDashboardFilters) {
  return demoWorkouts
    .map<WorkoutHistoryItem>((workout, index) => ({
      ...workout,
      workoutId: index + 1,
      feedbackCount: index % 2 === 0 ? 2 : 1,
    }))
    .filter((workout) => {
      const typeMatches =
        filters.workOutType === "ALL" ||
        workout.workOutType === filters.workOutType;
      return typeMatches && isInPeriod(workout, filters);
    })
    .sort(
      (left, right) =>
        new Date(right.startedAt).getTime() - new Date(left.startedAt).getTime(),
    );
}

function demoDashboardSummary(
  items: WorkoutHistoryItem[],
): WorkoutDashboardSummary {
  const runningItems = items.filter((item) => item.workOutType === "RUNNING");
  const cyclingItems = items.filter((item) => item.workOutType === "CYCLING");
  const totalDistance = items.reduce((sum, item) => sum + (item.distance ?? 0), 0);
  const totalMovingTime = items.reduce(
    (sum, item) => sum + (item.movingTime ?? 0),
    0,
  );
  const heartRates = items.flatMap((item) =>
    item.avgHeartRate == null ? [] : [item.avgHeartRate],
  );
  const runningPaces = runningItems.flatMap((item) =>
    item.avgPace == null ? [] : [item.avgPace],
  );
  const cyclingPowers = cyclingItems.flatMap((item) =>
    item.avgPower == null ? [] : [item.avgPower],
  );
  const average = (values: number[]) =>
    values.length === 0
      ? null
      : values.reduce((sum, value) => sum + value, 0) / values.length;

  return {
    totalWorkoutCount: items.length,
    totalDistance,
    totalMovingTime,
    totalFeedbackCount: items.reduce((sum, item) => sum + item.feedbackCount, 0),
    runningCount: runningItems.length,
    cyclingCount: cyclingItems.length,
    runningDistance: runningItems.reduce(
      (sum, item) => sum + (item.distance ?? 0),
      0,
    ),
    cyclingDistance: cyclingItems.reduce(
      (sum, item) => sum + (item.distance ?? 0),
      0,
    ),
    avgHeartRate: average(heartRates),
    totalElevGain: items.reduce((sum, item) => sum + (item.elevGain ?? 0), 0),
    avgRunningPace: average(runningPaces),
    avgCyclingPower: average(cyclingPowers),
    recentDistances: items.slice(0, MAX_RECENT_DISTANCE_BARS).map((item) => ({
      label: item.title ?? workoutTypeLabel(item.workOutType),
      startedAt: item.startedAt,
      distance: item.distance,
      movingTime: item.movingTime,
      avgHeartRate: item.avgHeartRate,
      elevGain: item.elevGain,
    })),
  };
}

function formatDurationMinutes(minutes: number) {
  const roundedMinutes = Math.max(0, Math.round(minutes));
  const hours = Math.floor(roundedMinutes / 60);
  const remainingMinutes = roundedMinutes % 60;

  if (hours <= 0) {
    return `${remainingMinutes}분`;
  }

  if (remainingMinutes === 0) {
    return `${hours}시간`;
  }

  return `${hours}시간 ${remainingMinutes}분`;
}

function formatDurationAxisHours(minutes: number) {
  const hours = Math.max(0, minutes / 60);
  return `${formatNumber(hours, hours >= 10 || Number.isInteger(hours) ? 0 : 1)}시간`;
}

function metricValue(workout: WorkoutHistoryItem) {
  if (workout.workOutType === "RUNNING") {
    return {
      label: "평균 페이스",
      value: formatPace(workout.avgPace),
      unit: "/km",
    };
  }

  return {
    label: "평균 파워",
    value: formatNumber(workout.avgPower, 0),
    unit: "W",
  };
}

function DashboardStat({
  label,
  value,
  subLabel,
  icon,
}: {
  label: string;
  value: string;
  subLabel: string;
  icon: string;
}) {
  return (
    <div className="rounded-lg border border-black/10 bg-white p-4 shadow-[0_10px_24px_rgba(15,23,42,0.04)]">
      <div className="mb-4 flex items-center justify-between gap-3">
        <span className="text-xs font-medium text-[#6b7280]">{label}</span>
        <Icon name={icon} className="h-5 w-5 text-[#2563eb]" />
      </div>
      <div className="text-2xl font-semibold text-[#111827]">{value}</div>
      <div className="mt-1 text-xs text-[#6b7280]">{subLabel}</div>
    </div>
  );
}

type TrendTone = {
  bar: string;
  barHover: string;
  badge: string;
  badgeText: string;
};

type TrendPoint = {
  label: string;
  weekday: string;
  value: number;
  valueLabel: string;
};

function TrendBar({
  label,
  weekday,
  value,
  valueLabel,
  maxValue,
  tone,
  animate,
  delayMs = 0,
}: {
  label: string;
  weekday: string;
  value: number;
  valueLabel: string;
  maxValue: number;
  tone: TrendTone;
  animate: boolean;
  delayMs?: number;
}) {
  const height = Math.max(12, Math.round((value / maxValue) * 104));

  return (
    <div className="flex min-w-0 flex-col items-center gap-2">
      <div className="group relative flex h-30 w-full min-w-0 max-w-20 items-end rounded-lg bg-[#f3f4f6] px-2 pb-2">
        <div
          className="relative w-full overflow-visible rounded-lg transition-transform duration-150 ease-out group-hover:scale-x-105"
          style={{
            height,
          }}
          title={`${label} ${valueLabel}`}
        >
          <div
            className={`absolute inset-0 origin-bottom rounded-lg transition-transform duration-700 ease-out ${tone.bar} ${tone.barHover}`}
            style={{
              transform: animate ? "scaleY(1)" : "scaleY(0)",
              transitionDelay: `${delayMs}ms`,
            }}
          />
          <div className="pointer-events-none absolute bottom-full left-1/2 mb-2 min-w-12 -translate-x-1/2 whitespace-nowrap rounded-md bg-[#111827] px-2 py-1 text-center text-[11px] font-semibold text-white opacity-0 shadow-lg transition duration-150 group-hover:opacity-100">
            {valueLabel}
            <span className="absolute left-1/2 top-full h-2 w-2 -translate-x-1/2 -translate-y-1 rotate-45 bg-[#111827]" />
          </div>
        </div>
      </div>
      <div className="flex h-8 flex-col items-center justify-start text-center leading-tight">
        <span className="whitespace-nowrap text-[11px] font-medium text-[#6b7280]">
          {label}
        </span>
        <span className="text-[10px] text-[#9ca3af]">({weekday})</span>
      </div>
    </div>
  );
}

function TrendChart({
  title,
  description,
  points,
  unit,
  tone,
  formatAxisLabel,
  animate,
}: {
  title: string;
  description: string;
  points: TrendPoint[];
  unit: string;
  tone: TrendTone;
  formatAxisLabel?: (value: number) => string;
  animate: boolean;
}) {
  const maxValue = Math.max(1, ...points.map((point) => point.value));
  const highestValue = Math.max(0, ...points.map((point) => point.value));
  const highestValueLabel =
    points.find((point) => point.value === highestValue)?.valueLabel ??
    `0${unit}`;
  const axisTicks = [maxValue, maxValue / 2, 0];

  return (
    <div className="rounded-lg border border-black/10 bg-white p-5 shadow-[0_10px_24px_rgba(15,23,42,0.04)]">
      <div className="mb-5 flex items-center justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold text-[#111827]">{title}</h2>
          <p className="mt-1 text-xs text-[#6b7280]">{description}</p>
        </div>
        <div
          className={`rounded-md px-2.5 py-1 text-xs font-medium ${tone.badge} ${tone.badgeText}`}
        >
          최고 {highestValueLabel}
        </div>
      </div>
      <div className="mx-auto grid w-full max-w-[540px] grid-cols-[36px_minmax(0,1fr)] gap-0">
        <div className="-translate-x-1.5 flex h-30 flex-col justify-between pb-2 text-right text-[10px] font-medium text-[#9ca3af]">
          {axisTicks.map((tick) => (
            <span className="whitespace-nowrap" key={`${title}-axis-${tick}`}>
              {formatAxisLabel
                ? formatAxisLabel(tick)
                : formatNumber(tick, tick >= 10 ? 0 : 1)}
            </span>
          ))}
        </div>
        <div className="flex min-w-0 items-end justify-center gap-2 pb-1">
          {points.map((point, index) => (
            <div
              className="min-w-0 flex-1"
              key={`${title}-${point.label}-${index}`}
            >
              <TrendBar
                label={point.label}
                maxValue={maxValue}
                tone={tone}
                animate={animate}
                delayMs={index * 55}
                value={point.value}
                valueLabel={point.valueLabel}
                weekday={point.weekday}
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function TypeSplit({
  label,
  count,
  distance,
  ratio,
  tone,
  animate,
}: {
  label: string;
  count: number;
  distance: number;
  ratio: number;
  tone: "blue" | "green";
  animate: boolean;
}) {
  const color = tone === "blue" ? "bg-[#2563eb]" : "bg-[#059669]";
  const width = Math.min(100, Math.max(0, ratio));

  return (
    <div>
      <div className="mb-2 flex items-center justify-between gap-3 text-sm">
        <span className="font-medium text-[#111827]">{label}</span>
        <span className="text-[#6b7280]">
          {count}회 · {formatNumber(distance)}km
        </span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-[#e5e7eb]">
        <div
          className={`h-full rounded-full transition-[width] duration-700 ease-out ${color}`}
          style={{ width: `${animate ? width : 0}%` }}
        />
      </div>
    </div>
  );
}

function MiniGauge({
  label,
  value,
  color,
  track,
  animate,
  delayMs = 0,
}: {
  label: string;
  value: number;
  color: string;
  track: string;
  animate: boolean;
  delayMs?: number;
}) {
  const normalizedValue = Math.min(100, Math.max(0, value));
  const radius = 34;
  const circumference = 2 * Math.PI * radius;
  const dashOffset =
    circumference -
    ((animate ? normalizedValue : 0) / 100) * circumference;

  return (
    <div className="flex items-center gap-3 rounded-lg bg-[#f9fafb] p-3">
      <div className="relative h-20 w-20 shrink-0">
        <svg className="h-20 w-20 -rotate-90" viewBox="0 0 80 80">
          <circle
            className={track}
            cx="40"
            cy="40"
            fill="none"
            r={radius}
            strokeWidth="7"
          />
          <circle
            className={color}
            cx="40"
            cy="40"
            fill="none"
            r={radius}
            strokeDasharray={circumference}
            strokeDashoffset={dashOffset}
            strokeLinecap="round"
            strokeWidth="7"
            style={{
              transition: "stroke-dashoffset 900ms ease-out",
              transitionDelay: `${delayMs}ms`,
            }}
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center text-sm font-semibold text-[#111827]">
          {normalizedValue}%
        </div>
      </div>
      <div className="min-w-0">
        <div className="text-sm font-semibold text-[#111827]">{label}</div>
        <div className="mt-1 text-xs leading-relaxed text-[#6b7280]">
          디자인 확인용 임시 게이지입니다.
        </div>
      </div>
    </div>
  );
}

function WeeklyFrequencyBars({ animate }: { animate: boolean }) {
  const values = [
    { label: "월", value: 42 },
    { label: "화", value: 68 },
    { label: "수", value: 54 },
    { label: "목", value: 82 },
    { label: "금", value: 74 },
    { label: "토", value: 96 },
    { label: "일", value: 58 },
  ];
  const maxValue = Math.max(1, ...values.map((item) => item.value));

  return (
    <div className="rounded-lg bg-[#f9fafb] p-3">
      <div className="mb-3 flex items-center justify-between gap-3">
        <div>
          <div className="text-sm font-semibold text-[#111827]">운동 빈도</div>
          <div className="mt-0.5 text-xs text-[#6b7280]">
            월~일 기준 임시 빈도입니다.
          </div>
        </div>
        <span className="rounded-md bg-[#eef2ff] px-2 py-1 text-[11px] font-semibold text-[#3730a3]">
          주간
        </span>
      </div>
      <div className="flex h-24 items-end gap-2">
        {values.map((item, index) => {
          const height = Math.max(14, Math.round((item.value / maxValue) * 60));

          return (
          <div
            className="group flex min-w-0 flex-1 flex-col items-center gap-1.5"
            key={item.label}
          >
            <div className="relative flex h-18 w-full items-end rounded-md bg-white px-1 pb-1 ring-1 ring-black/[0.04]">
              <div
                className="relative w-full rounded-md transition-transform duration-150 group-hover:scale-x-105"
                style={{
                  height: `${height}px`,
                }}
                title={`${item.label}요일 ${item.value}회`}
              >
                <div
                  className="absolute inset-0 origin-bottom rounded-md bg-[#2563eb] transition-transform duration-700 ease-out group-hover:bg-[#1d4ed8]"
                  style={{
                    transform: animate ? "scaleY(1)" : "scaleY(0)",
                    transitionDelay: `${index * 55}ms`,
                  }}
                />
                <div className="pointer-events-none absolute bottom-full left-1/2 mb-2 min-w-12 -translate-x-1/2 whitespace-nowrap rounded-md bg-[#111827] px-2 py-1 text-center text-[11px] font-semibold text-white opacity-0 shadow-lg transition duration-150 group-hover:opacity-100">
                  {item.value}회
                  <span className="absolute left-1/2 top-full h-2 w-2 -translate-x-1/2 -translate-y-1 rotate-45 bg-[#111827]" />
                </div>
              </div>
            </div>
            <span className="text-[10px] font-medium text-[#6b7280]">
              {item.label}
            </span>
          </div>
          );
        })}
      </div>
    </div>
  );
}

function WorkoutTypeSplitCard({
  summary,
  animate,
}: {
  summary: WorkoutDashboardSummary | null;
  animate: boolean;
}) {
  return (
    <div className="rounded-lg border border-black/10 bg-white p-5 shadow-[0_10px_24px_rgba(15,23,42,0.04)]">
      <div className="mb-6 text-center">
        <h2 className="text-base font-semibold text-[#111827]">
          운동 유형 비중
        </h2>
        <p className="mt-1 text-xs text-[#6b7280]">
          러닝과 사이클 기록 흐름을 비교합니다.
        </p>
      </div>
      <div className="mx-auto w-full max-w-70 space-y-5">
        <TypeSplit
          count={summary?.runningCount ?? 0}
          distance={summary?.runningDistance ?? 0}
          label="러닝"
          ratio={
            summary?.totalDistance
              ? (summary.runningDistance / summary.totalDistance) * 100
              : 0
          }
          animate={animate}
          tone="blue"
        />
        <TypeSplit
          count={summary?.cyclingCount ?? 0}
          distance={summary?.cyclingDistance ?? 0}
          label="사이클"
          ratio={
            summary?.totalDistance
              ? (summary.cyclingDistance / summary.totalDistance) * 100
              : 0
          }
          animate={animate}
          tone="green"
        />
      </div>
      <div className="mt-6 grid grid-cols-2 gap-3">
        <div className="rounded-lg bg-[#f9fafb] p-3 text-center">
          <div className="text-xs text-[#6b7280]">러닝 평균 페이스</div>
          <div className="mt-1 text-base font-semibold text-[#111827]">
            {formatPace(summary?.avgRunningPace ?? null)}
          </div>
        </div>
        <div className="rounded-lg bg-[#f9fafb] p-3 text-center">
          <div className="text-xs text-[#6b7280]">사이클 평균 파워</div>
          <div className="mt-1 text-base font-semibold text-[#111827]">
            {formatNumber(summary?.avgCyclingPower ?? null, 0)} W
          </div>
        </div>
      </div>
      <div className="mt-4 space-y-3">
        <WeeklyFrequencyBars animate={animate} />
        <MiniGauge
          animate={animate}
          color="stroke-[#059669]"
          delayMs={140}
          label="피드백 활용"
          track="stroke-[#d1fae5]"
          value={64}
        />
        <MiniGauge
          animate={animate}
          color="stroke-[#7c3aed]"
          delayMs={220}
          label="훈련 부하"
          track="stroke-[#ede9fe]"
          value={86}
        />
      </div>
    </div>
  );
}

function FilterSelect<T extends string>({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: Array<{ label: string; value: T }>;
  value: T;
  onChange: (value: T) => void;
}) {
  return (
    <label className="flex min-w-0 flex-1 flex-col gap-1.5 text-xs font-medium text-[#6b7280]">
      {label}
      <div className="relative">
        <select
          className="h-10 w-full appearance-none rounded-lg border border-black/10 bg-white px-3 pr-9 text-sm font-medium text-[#111827] outline-none transition focus:border-[#2563eb] focus:ring-2 focus:ring-[#2563eb]/15"
          onChange={(event) => onChange(event.target.value as T)}
          value={value}
        >
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <Icon
          name="keyboard_arrow_down"
          className="pointer-events-none absolute right-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#6b7280]"
        />
      </div>
    </label>
  );
}

function FilterDateInput({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="flex min-w-0 flex-1 flex-col gap-1.5 text-xs font-medium text-[#6b7280]">
      {label}
      <div className="flex h-10 items-center gap-2 rounded-lg border border-black/10 bg-white px-3 text-[#111827]">
        <Icon name="calendar" className="h-4 w-4 shrink-0 text-[#6b7280]" />
        <input
          className="min-w-0 flex-1 bg-transparent text-sm outline-none"
          onChange={(event) => onChange(event.target.value)}
          type="date"
          value={value}
        />
      </div>
    </label>
  );
}

function HistoryMetric({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="min-w-0 rounded-lg bg-[#f9fafb] px-3 py-2.5 text-center ring-1 ring-black/[0.03]">
      <div className="truncate text-[11px] font-medium text-[#6b7280]">
        {label}
      </div>
      <div className="mt-1 truncate text-sm font-semibold text-[#111827]">
        {value}
      </div>
    </div>
  );
}

function SkeletonLine({ className = "" }: { className?: string }) {
  return <div className={`rounded-full bg-[#f3f4f6] ${className}`} />;
}

function WorkoutHistoryDashboardSkeleton() {
  return (
    <>
      <div
        aria-label="운동 통계 불러오는 중"
        className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4"
        role="status"
      >
        {Array.from({ length: 4 }, (_, index) => (
          <div
            className="rounded-lg border border-black/10 bg-white p-5 shadow-[0_10px_24px_rgba(15,23,42,0.04)]"
            key={index}
          >
            <div className="mb-4 flex items-center justify-between">
              <div className="h-10 w-10 rounded-lg bg-[#f3f4f6]" />
              <SkeletonLine className="h-4 w-16" />
            </div>
            <SkeletonLine className="h-7 w-28" />
            <SkeletonLine className="mt-3 h-4 w-36" />
          </div>
        ))}
      </div>

      <div className="relative left-1/2 w-[min(1500px,calc(100vw-32px))] -translate-x-1/2">
        <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_320px]">
          <div className="flex min-w-0 flex-col gap-4">
            <div className="grid gap-4 lg:grid-cols-2">
              {Array.from({ length: 4 }, (_, index) => (
                <div
                  className="rounded-lg border border-black/10 bg-white p-5 shadow-[0_10px_24px_rgba(15,23,42,0.04)]"
                  key={index}
                >
                  <SkeletonLine className="h-5 w-32" />
                  <SkeletonLine className="mt-2 h-3 w-52" />
                  <div className="mt-6 flex h-40 items-end gap-2">
                    {Array.from({ length: 7 }, (_, barIndex) => (
                      <div
                        className="flex min-w-0 flex-1 flex-col items-center gap-2"
                        key={barIndex}
                      >
                        <div
                          className="w-full rounded-md bg-[#f3f4f6]"
                          style={{ height: `${36 + ((barIndex * 17) % 76)}px` }}
                        />
                        <SkeletonLine className="h-2 w-7" />
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            <div className="rounded-lg border border-black/10 bg-white shadow-[0_10px_24px_rgba(15,23,42,0.04)]">
              <div className="flex flex-col gap-4 border-b border-black/10 p-5 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <SkeletonLine className="h-5 w-40" />
                  <SkeletonLine className="mt-2 h-3 w-72 max-w-full" />
                </div>
                <div className="h-10 w-24 rounded-lg bg-[#f3f4f6]" />
              </div>
              <div className="divide-y divide-black/10">
                {Array.from({ length: 4 }, (_, index) => (
                  <div
                    className="flex flex-col gap-4 px-5 py-4 lg:flex-row lg:items-center lg:justify-between"
                    key={index}
                  >
                    <div className="flex min-w-0 flex-1 items-center gap-4">
                      <div className="h-11 w-11 shrink-0 rounded-lg bg-[#f3f4f6]" />
                      <div className="min-w-0 flex-1">
                        <SkeletonLine className="h-5 w-48" />
                        <SkeletonLine className="mt-2 h-4 w-64 max-w-full" />
                        <SkeletonLine className="mt-2 h-3 w-32" />
                      </div>
                    </div>
                    <div className="grid w-full gap-2 sm:grid-cols-2 lg:w-[640px] lg:grid-cols-5">
                      {Array.from({ length: 5 }, (_, metricIndex) => (
                        <div
                          className="rounded-lg bg-[#f9fafb] px-3 py-2.5"
                          key={metricIndex}
                        >
                          <SkeletonLine className="mx-auto h-3 w-12" />
                          <SkeletonLine className="mx-auto mt-2 h-4 w-20" />
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="rounded-lg border border-black/10 bg-white p-5 shadow-[0_10px_24px_rgba(15,23,42,0.04)]">
            <SkeletonLine className="mx-auto h-5 w-32" />
            <SkeletonLine className="mx-auto mt-2 h-3 w-48" />
            <div className="mt-8 space-y-5">
              <div className="mx-auto h-48 w-48 rounded-full bg-[#f3f4f6]" />
              <div className="grid grid-cols-2 gap-3">
                <div className="h-16 rounded-lg bg-[#f9fafb]" />
                <div className="h-16 rounded-lg bg-[#f9fafb]" />
              </div>
              <div className="h-36 rounded-lg bg-[#f9fafb]" />
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

export function WorkoutHistoryDashboard({
  demoMode = false,
  onRequestFeedback,
}: WorkoutHistoryDashboardProps) {
  const [filterOpen, setFilterOpen] = useState(false);
  const [period, setPeriod] = useState<FilterPeriod>("ALL");
  const [workoutType, setWorkoutType] = useState<FilterWorkoutType>("ALL");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [summary, setSummary] = useState<WorkoutDashboardSummary | null>(null);
  const [historyItems, setHistoryItems] = useState<WorkoutHistoryItem[]>([]);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [hasNext, setHasNext] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [animateTrendCharts, setAnimateTrendCharts] = useState(false);
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [selectedFitFiles, setSelectedFitFiles] = useState<File[]>([]);
  const [savingFitFiles, setSavingFitFiles] = useState(false);
  const historyCardRef = useRef<HTMLDivElement | null>(null);
  const sentinelRef = useRef<HTMLDivElement | null>(null);
  const followContainerRef = useRef<HTMLDivElement | null>(null);
  const followCardRef = useRef<HTMLDivElement | null>(null);
  const historyActionCloseTimerRef = useRef<number | null>(null);
  const [hoveredHistoryAction, setHoveredHistoryAction] = useState<{
    key: string;
    top: number;
    item: WorkoutHistoryItem;
  } | null>(null);
  const [feedbackLoadingKey, setFeedbackLoadingKey] = useState<string | null>(
    null,
  );

  function cancelHistoryActionClose() {
    if (historyActionCloseTimerRef.current !== null) {
      window.clearTimeout(historyActionCloseTimerRef.current);
      historyActionCloseTimerRef.current = null;
    }
  }

  function scheduleHistoryActionClose() {
    cancelHistoryActionClose();
    historyActionCloseTimerRef.current = window.setTimeout(() => {
      setHoveredHistoryAction(null);
      historyActionCloseTimerRef.current = null;
    }, 120);
  }

  function showHistoryAction(
    itemKey: string,
    item: WorkoutHistoryItem,
    element: HTMLElement,
  ) {
    cancelHistoryActionClose();
    const card = historyCardRef.current;
    if (!card) return;

    const cardRect = card.getBoundingClientRect();
    const itemRect = element.getBoundingClientRect();
    setHoveredHistoryAction({
      key: itemKey,
      item,
      top: itemRect.top - cardRect.top + itemRect.height / 2,
    });
  }

  async function handleRequestFeedback(item: WorkoutHistoryItem) {
    if (!onRequestFeedback) return;
    if (demoMode) {
      toast.info("로그인 후 실제 운동 기록으로 피드백을 받을 수 있습니다.");
      return;
    }

    const itemKey = `${item.workOutType}-${item.workoutId}`;
    setFeedbackLoadingKey(itemKey);

    try {
      const workout = await getWorkoutDetail(item.workOutType, item.workoutId);
      await onRequestFeedback(workout);
      setHoveredHistoryAction(null);
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "운동 기록을 불러오지 못했습니다.",
      );
    } finally {
      setFeedbackLoadingKey(null);
    }
  }

  const filters = useMemo<WorkoutDashboardFilters>(
    () => ({
      period,
      workOutType: workoutType,
      startDate,
      endDate,
    }),
    [endDate, period, startDate, workoutType],
  );

  const recentDistanceBars = (summary?.recentDistances ?? [])
    .slice(0, MAX_RECENT_DISTANCE_BARS)
    .slice()
    .reverse();
  const recentTrendBase = recentDistanceBars.map((item) => {
    const { date, weekday } = compactDateParts(item.startedAt);

    return {
      label: date,
      weekday,
      distance: item.distance ?? 0,
      durationMinutes:
        item.movingTime == null ? 0 : Math.round(item.movingTime / 60),
      heartRate: item.avgHeartRate ?? 0,
      elevation: item.elevGain ?? 0,
    };
  });
  const trendCharts = [
    {
      title: "최근 운동 거리",
      description: "기록별 거리 흐름을 빠르게 비교합니다.",
      unit: "km",
      tone: trendTones.distance,
      points: recentTrendBase.map((item) => ({
        label: item.label,
        weekday: item.weekday,
        value: item.distance,
        valueLabel: `${formatNumber(item.distance)}km`,
      })),
    },
    {
      title: "최근 운동 시간",
      description: "운동별 소요 시간을 같은 기준으로 봅니다.",
      unit: "분",
      tone: trendTones.duration,
      formatAxisLabel: formatDurationAxisHours,
      points: recentTrendBase.map((item) => ({
        label: item.label,
        weekday: item.weekday,
        value: item.durationMinutes,
        valueLabel: formatDurationMinutes(item.durationMinutes),
      })),
    },
    {
      title: "최근 평균 심박",
      description: "러닝과 사이클 공통 심박 흐름입니다.",
      unit: "bpm",
      tone: trendTones.heartRate,
      points: recentTrendBase.map((item) => ({
        label: item.label,
        weekday: item.weekday,
        value: item.heartRate,
        valueLabel: `${formatNumber(item.heartRate, 0)}bpm`,
      })),
    },
    {
      title: "최근 상승 고도",
      description: "운동별 오르막 부하를 임시로 비교합니다.",
      unit: "m",
      tone: trendTones.elevation,
      points: recentTrendBase.map((item) => ({
        label: item.label,
        weekday: item.weekday,
        value: item.elevation,
        valueLabel: `${formatNumber(item.elevation, 0)}m`,
      })),
    },
  ];
  const selectedWorkoutTypeLabel =
    workoutTypeOptions.find((option) => option.value === workoutType)?.label ??
    "전체";
  const selectedPeriodLabel =
    periodOptions.find((option) => option.value === period)?.label ?? "전체";
  const dateRangeLabel =
    period === "custom" ? `${startDate} ~ ${endDate}` : selectedPeriodLabel;

  function beginFilterChange() {
    setLoading(true);
    setAnimateTrendCharts(false);
    setSummary(null);
    setHistoryItems([]);
    setNextCursor(null);
    setHasNext(false);
  }

  async function refreshDashboard() {
    if (demoMode) {
      const items = demoHistoryItems(filters);
      setSummary(demoDashboardSummary(items));
      setHistoryItems(items);
      setNextCursor(null);
      setHasNext(false);
      setLoading(false);
      return;
    }

    setLoading(true);
    setAnimateTrendCharts(false);
    setSummary(null);
    setHistoryItems([]);
    setNextCursor(null);
    setHasNext(false);

    try {
      const [summaryResult, historyResult] = await Promise.all([
        getWorkoutDashboardSummary(filters),
        getWorkoutDashboardHistories(filters, { size: HISTORY_PAGE_SIZE }),
      ]);

      setSummary(summaryResult);
      setHistoryItems(historyResult.items);
      setNextCursor(historyResult.nextCursor);
      setHasNext(historyResult.hasNext);
    } finally {
      setLoading(false);
    }
  }

  function appendFitFiles(files: FileList | File[]) {
    const nextFiles = Array.from(files).filter((file) =>
      file.name.toLowerCase().endsWith(".fit"),
    );

    if (nextFiles.length === 0) {
      toast.error("FIT 파일만 업로드할 수 있습니다.");
      return;
    }

    setSelectedFitFiles((currentFiles) => {
      const fileKeys = new Set(
        currentFiles.map(
          (file) => `${file.name}-${file.size}-${file.lastModified}`,
        ),
      );
      const uniqueFiles = nextFiles.filter((file) => {
        const key = `${file.name}-${file.size}-${file.lastModified}`;
        if (fileKeys.has(key)) return false;
        fileKeys.add(key);
        return true;
      });
      const mergedFiles = [...currentFiles, ...uniqueFiles];

      if (mergedFiles.length > MAX_FIT_UPLOAD_COUNT) {
        toast.error("FIT 파일은 한 번에 최대 10개까지 업로드할 수 있습니다.");
      }

      return mergedFiles.slice(0, MAX_FIT_UPLOAD_COUNT);
    });
  }

  function removeFitFile(index: number) {
    setSelectedFitFiles((files) =>
      files.filter((_, fileIndex) => fileIndex !== index),
    );
  }

  function closeUploadDialog() {
    if (savingFitFiles) return;
    setUploadDialogOpen(false);
    setSelectedFitFiles([]);
  }

  async function handleSaveFitFiles() {
    if (demoMode) {
      toast.info("로그인 후 FIT 파일을 저장할 수 있습니다.");
      return;
    }
    if (selectedFitFiles.length === 0 || savingFitFiles) return;

    setSavingFitFiles(true);
    try {
      const result = await saveFitWorkoutRecords(selectedFitFiles);
      toast.success(
        `운동 ${result.createdCount}개를 추가했습니다.${result.duplicatedCount > 0 ? ` 중복 ${result.duplicatedCount}개는 기존 기록으로 처리했습니다.` : ""}`,
      );
      setUploadDialogOpen(false);
      setSelectedFitFiles([]);
    } catch (error) {
      toast.error(resolveErrorMessage(error, "운동 파일 저장에 실패했습니다."));
      return;
    } finally {
      setSavingFitFiles(false);
    }

    try {
      await refreshDashboard();
    } catch (error) {
      toast.error(resolveErrorMessage(error, "운동 기록을 다시 불러오지 못했습니다."));
    }
  }

  useEffect(() => {
    let active = true;

    if (demoMode) {
      const timerId = window.setTimeout(() => {
        if (!active) return;
        const items = demoHistoryItems(filters);
        setSummary(demoDashboardSummary(items));
        setHistoryItems(items);
        setNextCursor(null);
        setHasNext(false);
        setLoading(false);
      }, 0);
      return () => {
        active = false;
        window.clearTimeout(timerId);
      };
    }

    Promise.all([
      getWorkoutDashboardSummary(filters),
      getWorkoutDashboardHistories(filters, { size: HISTORY_PAGE_SIZE }),
    ])
      .then(([summaryResult, historyResult]) => {
        if (!active) return;
        setSummary(summaryResult);
        setHistoryItems(historyResult.items);
        setNextCursor(historyResult.nextCursor);
        setHasNext(historyResult.hasNext);
      })
      .catch((loadError) => {
        if (!active) return;
        setSummary(null);
        setHistoryItems([]);
        setNextCursor(null);
        setHasNext(false);
        toast.error(
          resolveErrorMessage(loadError, "운동 기록을 불러오지 못했습니다."),
        );
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [demoMode, filters]);

  useEffect(() => {
    if (!summary || loading) return;

    const animationFrameId = window.requestAnimationFrame(() => {
      setAnimateTrendCharts(true);
    });

    return () => {
      window.cancelAnimationFrame(animationFrameId);
    };
  }, [loading, summary]);

  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (demoMode) return;
    if (!sentinel || loading || loadingMore || !hasNext) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (!entries[0]?.isIntersecting || loadingMore || !hasNext) return;

        setLoadingMore(true);
        getWorkoutDashboardHistories(filters, {
          cursor: nextCursor,
          size: HISTORY_PAGE_SIZE,
        })
          .then((result) => {
            setHistoryItems((items) => [...items, ...result.items]);
            setNextCursor(result.nextCursor);
            setHasNext(result.hasNext);
          })
          .catch((loadError) => {
            toast.error(
              resolveErrorMessage(
                loadError,
                "운동 기록을 더 불러오지 못했습니다.",
              ),
            );
          })
          .finally(() => setLoadingMore(false));
      },
      { rootMargin: "160px" },
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [demoMode, filters, hasNext, loading, loadingMore, nextCursor]);

  useEffect(() => {
    return () => cancelHistoryActionClose();
  }, []);

  useEffect(() => {
    const container = followContainerRef.current;
    const card = followCardRef.current;
    if (!container || !card) return;
    const containerElement = container;
    const cardElement = card;
    const scrollRoot = (() => {
      let element = containerElement.parentElement;
      while (element) {
        const style = window.getComputedStyle(element);
        const canScrollY =
          /(auto|scroll)/.test(style.overflowY) &&
          element.scrollHeight > element.clientHeight;
        if (canScrollY) return element;
        element = element.parentElement;
      }
      return null;
    })();

    let currentY = 0;
    let targetY = 0;
    let frameId = 0;

    function calculateTarget() {
      if (window.innerWidth < 1280) {
        targetY = 0;
        currentY = 0;
        cardElement.style.transform = "translate3d(0, 0, 0)";
        return;
      }

      const scrollTop = scrollRoot?.scrollTop ?? window.scrollY;

      if (scrollTop <= 4) {
        targetY = 0;
        return;
      }

      const containerTop = containerElement.getBoundingClientRect().top;
      const viewportTop = scrollRoot?.getBoundingClientRect().top ?? 0;
      const viewportHeight = scrollRoot?.clientHeight ?? window.innerHeight;
      const maxY = Math.max(
        0,
        containerElement.offsetHeight - cardElement.offsetHeight,
      );
      const viewportCenterY =
        viewportTop + viewportHeight / 2 - cardElement.offsetHeight / 2;
      targetY = Math.min(
        maxY,
        Math.max(0, viewportCenterY - containerTop),
      );
    }

    function animate() {
      currentY += (targetY - currentY) * 0.12;
      if (Math.abs(targetY - currentY) < 0.4) {
        currentY = targetY;
      }

      cardElement.style.transform = `translate3d(0, ${currentY}px, 0)`;

      if (currentY !== targetY) {
        frameId = window.requestAnimationFrame(animate);
      } else {
        frameId = 0;
      }
    }

    function startFollow() {
      calculateTarget();
      if (frameId === 0) {
        frameId = window.requestAnimationFrame(animate);
      }
    }

    startFollow();
    window.addEventListener("scroll", startFollow, { passive: true });
    window.addEventListener("resize", startFollow);
    scrollRoot?.addEventListener("scroll", startFollow, { passive: true });

    return () => {
      window.removeEventListener("scroll", startFollow);
      window.removeEventListener("resize", startFollow);
      scrollRoot?.removeEventListener("scroll", startFollow);
      if (frameId !== 0) {
        window.cancelAnimationFrame(frameId);
      }
      cardElement.style.transform = "";
    };
  }, [historyItems.length, summary]);

  const showInitialLoading =
    loading && summary === null && historyItems.length === 0;

  return (
    <section
      aria-busy={showInitialLoading}
      className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-8 md:px-8"
    >
      <div className="relative flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-sm font-medium text-[#2563eb]">운동 기록</p>
          <h1 className="mt-1 text-3xl font-semibold text-[#111827]">
            나의 운동 통계
          </h1>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="inline-flex items-center gap-2 rounded-lg border border-black/10 bg-white px-3 py-2 text-sm text-[#4b5563]">
            <Icon name="filter" className="h-4 w-4 text-[#2563eb]" />
            {dateRangeLabel} · {selectedWorkoutTypeLabel}
          </div>
          <button
            aria-expanded={filterOpen}
            className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-black/10 bg-white px-3 text-sm font-medium text-[#374151] transition hover:bg-[#f9fafb]"
            onClick={() => setFilterOpen((open) => !open)}
            type="button"
          >
            <Icon name="filter" className="h-4 w-4" />
            필터
            <Icon
              name="keyboard_arrow_down"
              className={`h-4 w-4 transition-transform ${
                filterOpen ? "rotate-180" : ""
              }`}
            />
          </button>
        </div>

        {filterOpen ? (
          <div className="absolute right-0 top-[calc(100%+8px)] z-30 w-full rounded-lg border border-black/10 bg-white p-4 shadow-[0_18px_48px_rgba(15,23,42,0.14)] md:w-[520px]">
            <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-[#111827]">
              <Icon name="filter" className="h-4 w-4 text-[#2563eb]" />
              {dateRangeLabel} · {selectedWorkoutTypeLabel}
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <FilterSelect
                label="기간"
                onChange={(value) => {
                  beginFilterChange();
                  setPeriod(value);
                }}
                options={periodOptions}
                value={period}
              />
              <FilterSelect
                label="운동 유형"
                onChange={(value) => {
                  beginFilterChange();
                  setWorkoutType(value);
                }}
                options={workoutTypeOptions}
                value={workoutType}
              />
            </div>

            <div className="mt-4 grid min-w-0 gap-3 sm:grid-cols-2">
              <FilterDateInput
                label="시작 날짜"
                onChange={(value) => {
                  beginFilterChange();
                  setStartDate(value);
                  setPeriod("custom");
                }}
                value={startDate}
              />
              <FilterDateInput
                label="종료 날짜"
                onChange={(value) => {
                  beginFilterChange();
                  setEndDate(value);
                  setPeriod("custom");
                }}
                value={endDate}
              />
            </div>

            <div className="mt-4 flex justify-end">
              <button
                className="inline-flex h-10 items-center justify-center rounded-lg border border-black/10 bg-white px-4 text-sm font-medium text-[#374151] transition hover:bg-[#f9fafb]"
                onClick={() => {
                  beginFilterChange();
                  setPeriod("ALL");
                  setWorkoutType("ALL");
                  setStartDate("");
                  setEndDate("");
                }}
                type="button"
              >
                초기화
              </button>
            </div>
          </div>
        ) : null}
      </div>

      {showInitialLoading ? <WorkoutHistoryDashboardSkeleton /> : null}

      {!showInitialLoading ? (
        <>
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <DashboardStat
          icon="route"
          label="총 거리"
          subLabel={`${summary?.totalWorkoutCount ?? 0}개의 운동 기록`}
          value={`${formatNumber(summary?.totalDistance ?? 0)} km`}
        />
        <DashboardStat
          icon="timer"
          label="총 운동 시간"
          subLabel="러닝과 사이클 합산"
          value={formatDuration(summary?.totalMovingTime ?? 0)}
        />
        <DashboardStat
          icon="favorite"
          label="평균 심박"
          subLabel="기록별 평균 심박 기준"
          value={`${formatNumber(summary?.avgHeartRate ?? null, 0)} bpm`}
        />
        <DashboardStat
          icon="terrain"
          label="누적 상승 고도"
          subLabel="업힐 부하 추적"
          value={`${formatNumber(summary?.totalElevGain ?? 0, 0)} m`}
        />
      </div>

      <div className="relative left-1/2 w-[min(1500px,calc(100vw-32px))] -translate-x-1/2">
        <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_320px]">
          <div className="flex min-w-0 flex-col gap-4">
            <div className="grid gap-4 lg:grid-cols-2">
              {trendCharts.map((chart) => (
                <TrendChart
                  animate={animateTrendCharts}
                  description={chart.description}
                  key={chart.title}
                  points={chart.points}
                  title={chart.title}
                  tone={chart.tone}
                  unit={chart.unit}
                  formatAxisLabel={chart.formatAxisLabel}
                />
              ))}
            </div>

            <div
              className="relative rounded-lg border border-black/10 bg-white shadow-[0_10px_24px_rgba(15,23,42,0.04)]"
              ref={historyCardRef}
            >
              <div className="flex flex-col gap-4 border-b border-black/10 p-5 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="text-base font-semibold text-[#111827]">
                      나의 운동 기록 목록
                    </h2>
                    {demoMode ? (
                      <span className="inline-flex h-6 items-center rounded-md bg-[#fff7ed] px-2 text-[11px] font-semibold text-[#c2410c]">
                        체험용 데이터
                      </span>
                    ) : null}
                    <span className="inline-flex h-6 items-center rounded-md bg-[#f3f4f6] px-2 text-[11px] font-semibold text-[#4b5563]">
                      전체 {summary?.totalWorkoutCount ?? 0}개
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-[#6b7280]">
                    {demoMode
                      ? "로그인 전에는 임시 운동 기록으로 화면을 미리 확인할 수 있습니다."
                      : "저장된 운동 기록과 피드백 횟수를 한눈에 확인할 수 있습니다."}
                  </p>
                </div>
                <button
                  className="inline-flex h-10 shrink-0 items-center justify-center gap-2 rounded-lg bg-[#2563eb] px-3 text-sm font-semibold text-white transition hover:bg-[#1d4ed8] disabled:cursor-not-allowed disabled:opacity-60"
                  disabled={savingFitFiles}
                  onClick={() => {
                    if (demoMode) {
                      toast.info("로그인 후 FIT 파일을 저장할 수 있습니다.");
                      return;
                    }
                    setUploadDialogOpen(true);
                  }}
                  type="button"
                >
                  <Icon name="upload_file" className="h-4 w-4" />
                  운동 추가
                </button>
              </div>

              <div className="divide-y divide-black/10">
                {loading ? (
                  Array.from({ length: 4 }, (_, index) => (
                    <div
                      className="flex flex-col gap-4 px-5 py-4 lg:flex-row lg:items-center lg:justify-between"
                      key={index}
                    >
                      <div className="min-w-0 flex-1">
                        <div className="mb-3 h-7 w-40 rounded-md bg-[#f3f4f6]" />
                        <div className="h-4 w-52 rounded-full bg-[#f3f4f6]" />
                        <div className="mt-2 h-3 w-32 rounded-full bg-[#f3f4f6]" />
                      </div>
                      <div className="grid w-full gap-2 sm:grid-cols-2 lg:w-[640px] lg:grid-cols-5">
                        {Array.from({ length: 5 }, (_, metricIndex) => (
                          <div
                            className="rounded-lg bg-[#f9fafb] px-3 py-2.5"
                            key={metricIndex}
                          >
                            <div className="mx-auto h-3 w-12 rounded-full bg-[#f3f4f6]" />
                            <div className="mx-auto mt-2 h-4 w-20 rounded-full bg-[#f3f4f6]" />
                          </div>
                        ))}
                      </div>
                    </div>
                  ))
                ) : null}

                {!loading && historyItems.length === 0 ? (
                  <div className="px-5 py-12 text-center">
                    <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-full bg-[#f3f4f6] text-[#6b7280]">
                      <Icon name="route" className="h-5 w-5" />
                    </div>
                    <div className="mt-3 text-sm font-semibold text-[#111827]">
                      운동 기록이 없습니다
                    </div>
                    <p className="mt-1 text-xs text-[#6b7280]">
                      운동 데이터를 저장하면 이곳에서 통계와 기록을 확인할 수 있습니다.
                    </p>
                  </div>
                ) : null}

                {!loading && historyItems.map((item) => {
                  const metric = metricValue(item);
                  const speed = calculateAverageSpeed(item);
                  const itemKey = `${item.workOutType}-${item.workoutId}`;

                  return (
                    <div
                      className="group relative flex w-full flex-col gap-4 px-5 py-4 text-left transition hover:bg-[#f9fafb] lg:flex-row lg:items-center lg:justify-between"
                      key={itemKey}
                      onFocus={(event) => {
                        showHistoryAction(itemKey, item, event.currentTarget);
                      }}
                      onMouseEnter={(event) => {
                        showHistoryAction(itemKey, item, event.currentTarget);
                      }}
                      onMouseLeave={scheduleHistoryActionClose}
                      role="button"
                      tabIndex={0}
                    >
                      <div className="flex min-w-0 flex-1 items-center gap-4">
                        <div
                          className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-lg ${
                            item.workOutType === "RUNNING"
                              ? "bg-[#eff6ff] text-[#1d4ed8]"
                              : "bg-[#ecfdf5] text-[#047857]"
                          }`}
                        >
                          <Icon
                            name={
                              item.workOutType === "RUNNING"
                                ? "fitness_center"
                                : "cycling"
                            }
                            className="h-5 w-5"
                          />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="text-sm font-semibold text-[#111827]">
                              {workoutTypeLabel(item.workOutType)}
                            </span>
                            <span className="inline-flex h-6 items-center rounded-md bg-[#f3f4f6] px-2 text-[11px] font-medium text-[#4b5563]">
                              {sourceLabel(item.inputSource)}
                            </span>
                            <span className="inline-flex h-6 items-center rounded-md bg-[#eef2ff] px-2 text-[11px] font-medium text-[#3730a3]">
                              {tierLabel(item.tier)}
                            </span>
                            <span className="inline-flex h-6 items-center rounded-md bg-white px-2 text-[11px] font-medium text-[#6b7280] ring-1 ring-black/10">
                              피드백 {item.feedbackCount}회
                            </span>
                          </div>
                          <div className="mt-1 truncate text-base font-semibold text-[#111827]">
                            {item.title}
                          </div>
                          <div className="mt-1 text-xs text-[#6b7280]">
                            {compactDate(item.startedAt)} ·{" "}
                            {startTime(item.startedAt)}
                          </div>
                        </div>
                      </div>

                      <div className="grid w-full gap-2 sm:grid-cols-2 lg:w-[640px] lg:grid-cols-5">
                        <HistoryMetric
                          label="거리"
                          value={`${formatNumber(item.distance)} km`}
                        />
                        <HistoryMetric
                          label="시간"
                          value={formatDuration(item.movingTime)}
                        />
                        <HistoryMetric
                          label={metric.label}
                          value={`${metric.value} ${metric.unit}`}
                        />
                        <HistoryMetric
                          label="평균 속도"
                          value={`${formatNumber(speed)} km/h`}
                        />
                        <HistoryMetric
                          label="평균 심박"
                          value={`${formatNumber(item.avgHeartRate, 0)} bpm`}
                        />
                      </div>
                    </div>
                  );
                })}

                <div ref={sentinelRef} />

                {loadingMore ? (
                  <div className="px-5 py-4 text-center text-sm text-[#6b7280]">
                    운동 기록을 더 불러오는 중입니다.
                  </div>
                ) : null}
              </div>
              {hoveredHistoryAction ? (
                <div
                  className="absolute left-0 z-50 hidden -translate-x-[calc(100%+8px)] -translate-y-1/2 rounded-md border border-black/10 bg-white p-0.5 shadow-[0_8px_18px_rgba(15,23,42,0.12)] before:absolute before:left-full before:top-1/2 before:h-2 before:w-2 before:-translate-x-1 before:-translate-y-1/2 before:rotate-45 before:border-r before:border-t before:border-black/10 before:bg-white lg:block"
                  data-workout-action-key={hoveredHistoryAction.key}
                  onMouseEnter={cancelHistoryActionClose}
                  onMouseLeave={scheduleHistoryActionClose}
                  style={{ top: hoveredHistoryAction.top }}
                >
                  <button
                    className="block h-7 w-full min-w-20 rounded-[6px] bg-[#2563eb] px-2 text-[10px] font-semibold text-white transition hover:bg-[#1d4ed8]"
                    disabled={feedbackLoadingKey === hoveredHistoryAction.key}
                    onClick={() => {
                      void handleRequestFeedback(hoveredHistoryAction.item);
                    }}
                    type="button"
                  >
                    {feedbackLoadingKey === hoveredHistoryAction.key
                      ? "불러오는 중"
                      : "피드백 받기"}
                  </button>
                  <button
                    className="mt-0.5 block h-7 w-full min-w-20 rounded-[6px] bg-white px-2 text-[10px] font-semibold text-[#374151] transition hover:bg-[#f9fafb]"
                    type="button"
                  >
                    운동 세부 보기
                  </button>
                </div>
              ) : null}
            </div>
          </div>

          <div className="relative min-h-full" ref={followContainerRef}>
            <div className="will-change-transform" ref={followCardRef}>
              <WorkoutTypeSplitCard
                animate={animateTrendCharts}
                summary={summary}
              />
            </div>
          </div>
        </div>
      </div>
        </>
      ) : null}

      {uploadDialogOpen ? (
        <div
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/35 px-4 py-6"
          role="dialog"
        >
          <div className="flex h-[88vh] max-h-[760px] w-full max-w-xl flex-col overflow-hidden rounded-lg bg-white shadow-2xl">
            <div className="flex items-start justify-between gap-4 border-b border-black/10 px-5 py-4">
              <div>
                <h3 className="text-base font-semibold text-[#111827]">
                  FIT 파일로 운동 추가
                </h3>
                <p className="mt-1 text-xs text-[#6b7280]">
                  최대 10개의 FIT 파일을 선택한 뒤 운동 저장을 눌러주세요.
                </p>
              </div>
              <button
                aria-label="업로드 창 닫기"
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-[#6b7280] transition hover:bg-[#f3f4f6] hover:text-[#111827] disabled:cursor-not-allowed disabled:opacity-50"
                disabled={savingFitFiles}
                onClick={closeUploadDialog}
                type="button"
              >
                <Icon name="x" className="h-4 w-4" />
              </button>
            </div>

            <div className="flex min-h-0 flex-1 flex-col px-5 py-5">
              <div className="shrink-0">
                <div className="flex items-center justify-between gap-3 text-xs text-[#6b7280]">
                  <span>
                    {selectedFitFiles.length} / {MAX_FIT_UPLOAD_COUNT}개 선택됨
                  </span>
                  {selectedFitFiles.length > 0 ? (
                    <button
                      className="font-medium text-[#2563eb] transition hover:text-[#1d4ed8] disabled:cursor-not-allowed disabled:opacity-50"
                      disabled={savingFitFiles}
                      onClick={() => setSelectedFitFiles([])}
                      type="button"
                    >
                      전체 제거
                    </button>
                  ) : null}
                </div>
              </div>

              <div className="mt-3 min-h-0 flex-1 overflow-y-auto pr-1">
                {selectedFitFiles.length > 0 ? (
                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                    {selectedFitFiles.map((file, index) => (
                      <div
                        className="group relative flex min-h-36 flex-col items-center justify-center rounded-lg border border-black/10 bg-[#f9fafb] px-3 py-4 text-center transition hover:border-[#bfdbfe] hover:bg-[#eff6ff]"
                        key={`${file.name}-${file.size}-${file.lastModified}`}
                      >
                        <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-white text-[#2563eb] shadow-sm ring-1 ring-black/[0.04]">
                          <Icon name="file" className="h-7 w-7" />
                        </div>
                        <div className="mt-3 w-full min-w-0">
                          <div className="truncate text-xs font-semibold text-[#111827]">
                            {file.name}
                          </div>
                          <div className="mt-1 text-[11px] text-[#6b7280]">
                            FIT · {formatFileSize(file.size)}
                          </div>
                        </div>
                        <button
                          aria-label={`${file.name} 제거`}
                          className="absolute right-2 top-2 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-white text-[#6b7280] opacity-100 shadow-sm ring-1 ring-black/[0.05] transition hover:bg-red-50 hover:text-[#d70015] disabled:cursor-not-allowed disabled:opacity-50 sm:opacity-0 sm:group-hover:opacity-100"
                          disabled={savingFitFiles}
                          onClick={() => removeFitFile(index)}
                          type="button"
                        >
                          <Icon name="trash" className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex min-h-full flex-col items-center justify-center rounded-lg border border-black/10 bg-[#f9fafb] px-4 text-center">
                    <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-white text-[#9ca3af] shadow-sm ring-1 ring-black/[0.04]">
                      <Icon name="file" className="h-6 w-6" />
                    </div>
                    <p className="mt-3 text-sm font-medium text-[#374151]">
                      선택된 FIT 파일이 없습니다.
                    </p>
                  </div>
                )}
              </div>

              <label
                className="mt-4 flex min-h-32 shrink-0 cursor-pointer flex-col items-center justify-center rounded-lg border border-dashed border-[#9ca3af] bg-white px-4 py-5 text-center transition hover:border-[#2563eb] hover:bg-[#eff6ff]"
                onDragOver={(event) => event.preventDefault()}
                onDrop={(event) => {
                  event.preventDefault();
                  appendFitFiles(event.dataTransfer.files);
                }}
              >
                <Icon
                  name="upload_file"
                  className="mb-2 h-7 w-7 text-[#2563eb]"
                />
                <span className="text-sm font-semibold text-[#111827]">
                  파일 추가하기
                </span>
                <span className="mt-1 text-xs text-[#6b7280]">
                  선택하거나 이 영역에 .fit 파일을 놓아주세요.
                </span>
                <input
                  accept=".fit"
                  className="sr-only"
                  disabled={savingFitFiles}
                  multiple
                  onChange={(event) => {
                    if (event.target.files) appendFitFiles(event.target.files);
                    event.target.value = "";
                  }}
                  type="file"
                />
              </label>
            </div>

            <div className="flex items-center justify-end gap-2 border-t border-black/10 px-5 py-4">
              <button
                className="h-10 rounded-lg border border-black/10 bg-white px-4 text-sm font-medium text-[#374151] transition hover:bg-[#f9fafb] disabled:cursor-not-allowed disabled:opacity-60"
                disabled={savingFitFiles}
                onClick={closeUploadDialog}
                type="button"
              >
                취소
              </button>
              <button
                className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-[#2563eb] px-4 text-sm font-semibold text-white transition hover:bg-[#1d4ed8] disabled:cursor-not-allowed disabled:opacity-60"
                disabled={selectedFitFiles.length === 0 || savingFitFiles}
                onClick={handleSaveFitFiles}
                type="button"
              >
                {savingFitFiles ? (
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                ) : (
                  <Icon name="check" className="h-4 w-4" />
                )}
                운동 저장
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
}
