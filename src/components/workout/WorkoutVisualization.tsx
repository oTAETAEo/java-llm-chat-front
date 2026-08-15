import { useState, type PointerEvent } from "react";
import type { FeedbackRequest, FitSensorSample } from "@/lib/api";
import { calculateAverageSpeed, clampRatio, formatDateTime, formatNumber, formatPace } from "@/lib/workout";

type VisualMetric = {
  label: string;
  value: string;
  unit?: string;
  ratio: number;
  tone: "blue" | "green" | "orange" | "purple" | "gray";
};

const gaugeToneClassNames: Record<VisualMetric["tone"], string> = {
  blue: "text-[#2563eb]",
  green: "text-[#00a86b]",
  orange: "text-[#ff8a00]",
  purple: "text-[#8b5cf6]",
  gray: "text-[#7a7a7a]",
};

function SemiGauge({ metric }: { metric: VisualMetric }) {
  const dashOffset = 126 - metric.ratio * 126;

  return (
    <div className="workout-metric-card">
      <div className="relative h-16 w-full overflow-hidden">
        <svg aria-hidden="true" className="h-20 w-full" viewBox="0 0 120 70">
          <path className="text-black/10" d="M 16 58 A 44 44 0 0 1 104 58" fill="none" stroke="currentColor" strokeLinecap="round" strokeWidth="10" />
          <path
            className={gaugeToneClassNames[metric.tone]}
            d="M 16 58 A 44 44 0 0 1 104 58"
            fill="none"
            pathLength="126"
            stroke="currentColor"
            strokeDasharray="126"
            strokeDashoffset={dashOffset}
            strokeLinecap="round"
            strokeWidth="10"
          />
        </svg>
        <div className="absolute inset-x-0 bottom-0 text-center">
          <div className="text-[22px] font-semibold tracking-[-0.45px] text-[#1d1d1f]">
            {metric.value}
            {metric.unit ? <span className="ml-1 text-xs font-medium text-[#7a7a7a]">{metric.unit}</span> : null}
          </div>
        </div>
      </div>
      <div className="mt-1 text-center">
        <div className="text-sm font-semibold text-[#1d1d1f]">{metric.label}</div>
      </div>
    </div>
  );
}

function MetricPill({ label, value, unit }: { label: string; value: string; unit?: string }) {
  return (
    <div className="rounded-2xl border border-white/70 bg-white/65 px-4 py-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.7)]">
      <div className="text-xs font-semibold text-[#7a7a7a]">{label}</div>
      <div className="mt-1 text-base font-semibold tracking-[-0.2px] text-[#1d1d1f]">
        {value}
        {unit ? <span className="ml-1 text-xs font-medium text-[#7a7a7a]">{unit}</span> : null}
      </div>
    </div>
  );
}

function isNumber(value: number | null): value is number {
  return value !== null && Number.isFinite(value);
}

function formatChartTime(seconds: number | null) {
  if (seconds === null) return "";
  const roundedSeconds = Math.max(0, Math.floor(seconds));
  const hours = Math.floor(roundedSeconds / 3600);
  const minutes = Math.floor((roundedSeconds % 3600) / 60);
  const remainingSeconds = roundedSeconds % 60;

  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }
  if (minutes > 0) {
    return `${minutes}m`;
  }
  return `${remainingSeconds}s`;
}

function formatAxisValue(value: number) {
  const absoluteValue = Math.abs(value);
  if (absoluteValue >= 1000) {
    return `${formatNumber(value / 1000, 1)}k`;
  }
  if (absoluteValue >= 100) {
    return formatNumber(value, 0);
  }
  return formatNumber(value, 1);
}

function formatSensorValue(value: number, unit?: string) {
  const formattedValue = Math.abs(value) >= 100
    ? formatNumber(value, 0)
    : formatNumber(value, 1);

  return unit ? `${formattedValue} ${unit}` : formattedValue;
}

type SensorChartValue = {
  index: number;
  elapsedSeconds: number | null;
  value: number;
};

type SensorChartPoint = SensorChartValue & {
  x: number;
  y: number;
};

function downsampleChartValues(
  values: SensorChartValue[],
  maxPoints = 90,
): SensorChartValue[] {
  if (values.length <= maxPoints) return values;

  const lastIndex = values.length - 1;
  const step = lastIndex / (maxPoints - 1);

  return Array.from({ length: maxPoints }, (_, pointIndex) => {
    const sourceIndex =
      pointIndex === maxPoints - 1 ? lastIndex : Math.round(pointIndex * step);
    return values[sourceIndex];
  });
}

function hasSensorChartValues(
  samples: FitSensorSample[],
  valueKey: keyof FitSensorSample,
) {
  let valueCount = 0;

  for (const sample of samples) {
    if (isNumber(sample[valueKey] as number | null)) {
      valueCount += 1;
    }

    if (valueCount >= 2) return true;
  }

  return false;
}

function FitRoutePreview({ samples }: { samples: FitSensorSample[] }) {
  const points = samples.filter(
    (sample) => isNumber(sample.latitude) && isNumber(sample.longitude),
  );

  if (points.length === 0) return null;

  const minLat = Math.min(...points.map((point) => point.latitude as number));
  const maxLat = Math.max(...points.map((point) => point.latitude as number));
  const minLng = Math.min(...points.map((point) => point.longitude as number));
  const maxLng = Math.max(...points.map((point) => point.longitude as number));
  const latRange = Math.max(maxLat - minLat, 0.000001);
  const lngRange = Math.max(maxLng - minLng, 0.000001);
  const padding = 18;
  const width = 360;
  const height = 180;

  const route = points
    .map((point) => {
      const x =
        padding +
        (((point.longitude as number) - minLng) / lngRange) *
          (width - padding * 2);
      const y =
        height -
        padding -
        (((point.latitude as number) - minLat) / latRange) *
          (height - padding * 2);
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(" ");
  const start = route.split(" ")[0];
  const end = route.split(" ").at(-1);

  return (
    <section className="mt-5 overflow-hidden rounded-[18px] border border-black/10 bg-white/65">
      <div className="flex items-center justify-between px-4 py-3">
        <div>
          <div className="text-sm font-semibold text-[#1d1d1f]">GPS 경로</div>
          <div className="text-xs text-[#7a7a7a]">
            {points.length.toLocaleString("ko-KR")}개 좌표 샘플
          </div>
        </div>
      </div>
      <svg
        aria-label="FIT GPS 경로"
        className="h-[190px] w-full bg-[#f8fafc]"
        preserveAspectRatio="xMidYMid meet"
        viewBox={`0 0 ${width} ${height}`}
      >
        <defs>
          <pattern
            height="24"
            id="route-grid"
            patternUnits="userSpaceOnUse"
            width="24"
          >
            <path
              d="M 24 0 L 0 0 0 24"
              fill="none"
              stroke="rgba(0,0,0,0.05)"
              strokeWidth="1"
            />
          </pattern>
        </defs>
        <rect fill="url(#route-grid)" height={height} width={width} />
        <polyline
          fill="none"
          points={route}
          stroke="#0066cc"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="5"
        />
        {start ? <circle cx={Number(start.split(",")[0])} cy={Number(start.split(",")[1])} fill="#00a86b" r="5" /> : null}
        {end ? <circle cx={Number(end.split(",")[0])} cy={Number(end.split(",")[1])} fill="#ff3b30" r="5" /> : null}
      </svg>
    </section>
  );
}

function SensorLineChart({
  label,
  samples,
  valueKey,
  color,
  unit,
  hoveredSampleIndex,
  onHoverSampleIndexChange,
  className = "",
}: {
  label: string;
  samples: FitSensorSample[];
  valueKey: keyof FitSensorSample;
  color: string;
  unit?: string;
  hoveredSampleIndex: number | null;
  onHoverSampleIndexChange: (index: number | null) => void;
  className?: string;
}) {
  const rawValues = samples
    .map((sample, index) => ({
      index,
      elapsedSeconds: sample.elapsedSeconds,
      value: sample[valueKey],
    }))
    .filter((sample): sample is SensorChartValue =>
      isNumber(sample.value as number | null),
    );

  const values = downsampleChartValues(rawValues);

  if (values.length < 2) return null;

  const width = 360;
  const height = 112;
  const chartTop = 12;
  const chartRight = 6;
  const chartBottom = 24;
  const chartLeft = 18;
  const chartWidth = width - chartLeft - chartRight;
  const chartHeight = height - chartTop - chartBottom;
  const min = Math.min(...values.map((sample) => sample.value));
  const max = Math.max(...values.map((sample) => sample.value));
  const range = Math.max(max - min, 1);
  const lastIndex = Math.max(values.at(-1)?.index ?? 1, 1);
  const xScale = (index: number) => chartLeft + (index / lastIndex) * chartWidth;
  const yScale = (value: number) =>
    chartTop + chartHeight - ((value - min) / range) * chartHeight;
  const points: SensorChartPoint[] = values.map((sample) => ({
    x: xScale(sample.index),
    y: yScale(sample.value),
    index: sample.index,
    elapsedSeconds: sample.elapsedSeconds,
    value: sample.value,
  }));
  const pointString = points
    .map((point) => `${point.x.toFixed(1)},${point.y.toFixed(1)}`)
    .join(" ");
  const areaString = [
    `${chartLeft},${chartTop + chartHeight}`,
    pointString,
    `${chartLeft + chartWidth},${chartTop + chartHeight}`,
  ].join(" ");
  const yTicks = [max, min + range / 2, min];
  const xTicks = [
    values[0],
    values[Math.floor(values.length / 2)],
    values[values.length - 1],
  ];
  const gradientId = `sensor-area-${String(valueKey)}`;
  const lastPoint = points.at(-1);
  const hoveredPoint =
    hoveredSampleIndex === null
      ? null
      : points.reduce((nearest, point) => {
          return Math.abs(point.index - hoveredSampleIndex) <
            Math.abs(nearest.index - hoveredSampleIndex)
            ? point
            : nearest;
        }, points[0]);
  const activePoint = hoveredPoint ?? lastPoint;

  function handlePointerMove(event: PointerEvent<SVGSVGElement>) {
    const rect = event.currentTarget.getBoundingClientRect();
    const svgX = ((event.clientX - rect.left) / rect.width) * width;
    const boundedX = Math.min(
      chartLeft + chartWidth,
      Math.max(chartLeft, svgX),
    );
    const nearestPoint = points.reduce((nearest, point) => {
      return Math.abs(point.x - boundedX) < Math.abs(nearest.x - boundedX)
        ? point
        : nearest;
    }, points[0]);

    onHoverSampleIndexChange(nearestPoint.index);
  }

  return (
    <div className={`rounded-[18px] border border-black/10 bg-white/65 p-3 ${className}`}>
      <div className="flex items-start justify-between gap-3">
        <div className="text-sm font-semibold text-[#1d1d1f]">{label}</div>
        <div
          className={`min-w-16 shrink-0 text-right text-xs font-semibold text-[#1d1d1f] transition-opacity ${
            hoveredPoint ? "opacity-100" : "opacity-0"
          }`}
        >
          {hoveredPoint ? (
            <>
              {formatSensorValue(hoveredPoint.value, unit)}
              <div className="mt-0.5 text-[10px] font-medium text-[#8f8f94]">
                {formatChartTime(hoveredPoint.elapsedSeconds)}
              </div>
            </>
          ) : (
            <>
              -
              <div className="mt-0.5 text-[10px] font-medium text-[#8f8f94]">
                -
              </div>
            </>
          )}
        </div>
      </div>
      <svg
        aria-label={`${label} 그래프`}
        className="mt-2 w-full"
        onPointerLeave={() => onHoverSampleIndexChange(null)}
        onPointerMove={handlePointerMove}
        viewBox={`0 0 ${width} ${height}`}
      >
        <defs>
          <linearGradient id={gradientId} x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity="0.22" />
            <stop offset="100%" stopColor={color} stopOpacity="0.02" />
          </linearGradient>
        </defs>
        {yTicks.map((tick) => {
          const y = yScale(tick);
          return (
            <g key={tick}>
              <line
                stroke="rgba(0,0,0,0.09)"
                strokeDasharray="3 4"
                strokeWidth="1"
                x1={chartLeft}
                x2={chartLeft + chartWidth}
                y1={y}
                y2={y}
              />
              <text
                fill="#8f8f94"
                fontSize="8"
                textAnchor="end"
                x={chartLeft - 2}
                y={y + 3}
              >
                {formatAxisValue(tick)}
              </text>
            </g>
          );
        })}
        <line
          stroke="rgba(0,0,0,0.16)"
          strokeWidth="1"
          x1={chartLeft}
          x2={chartLeft}
          y1={chartTop}
          y2={chartTop + chartHeight}
        />
        <line
          stroke="rgba(0,0,0,0.16)"
          strokeWidth="1"
          x1={chartLeft}
          x2={chartLeft + chartWidth}
          y1={chartTop + chartHeight}
          y2={chartTop + chartHeight}
        />
        <polygon fill={`url(#${gradientId})`} points={areaString} />
        {hoveredPoint ? (
          <line
            stroke="rgba(29,29,31,0.42)"
            strokeDasharray="3 3"
            strokeWidth="1"
            x1={hoveredPoint.x}
            x2={hoveredPoint.x}
            y1={chartTop}
            y2={chartTop + chartHeight}
          />
        ) : null}
        <polyline
          fill="none"
          points={pointString}
          stroke={color}
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="1.8"
        />
        {activePoint ? (
          <circle cx={activePoint.x} cy={activePoint.y} fill={color} r="3" />
        ) : null}
        {xTicks.map((tick, index) => (
          <text
            fill="#8f8f94"
            fontSize="8"
            key={`${tick.index}-${index}`}
            textAnchor={index === 0 ? "start" : index === 2 ? "end" : "middle"}
            x={xScale(tick.index)}
            y={height - 8}
          >
            {formatChartTime(tick.elapsedSeconds)}
          </text>
        ))}
      </svg>
    </div>
  );
}

function FitSensorPreview({ samples }: { samples: FitSensorSample[] }) {
  const [hoveredSampleIndex, setHoveredSampleIndex] = useState<number | null>(
    null,
  );

  if (samples.length === 0) return null;

  const chartConfigs = [
    { label: "심박수", valueKey: "heartRate" as const, color: "#ff3b30", unit: "bpm" },
    { label: "파워", valueKey: "power" as const, color: "#8b5cf6", unit: "W" },
    { label: "케이던스", valueKey: "cadence" as const, color: "#00a86b", unit: "rpm" },
    { label: "속도", valueKey: "speed" as const, color: "#0066cc", unit: "km/h" },
    { label: "고도", valueKey: "altitude" as const, color: "#ff8a00", unit: "m" },
  ].filter((config) => hasSensorChartValues(samples, config.valueKey));

  return (
    <>
      <FitRoutePreview samples={samples} />
      {chartConfigs.length > 0 ? (
        <section className="mt-4">
          <div className="grid gap-3 lg:grid-cols-2">
            {chartConfigs.map((config, index) => (
              <SensorLineChart
                className={
                  chartConfigs.length === 1 ||
                  (chartConfigs.length % 2 === 1 &&
                    index === chartConfigs.length - 1)
                    ? "lg:col-span-2"
                    : ""
                }
                color={config.color}
                hoveredSampleIndex={hoveredSampleIndex}
                key={config.label}
                label={config.label}
                onHoverSampleIndexChange={setHoveredSampleIndex}
                samples={samples}
                unit={config.unit}
                valueKey={config.valueKey}
              />
            ))}
          </div>
        </section>
      ) : null}
    </>
  );
}

export function WorkoutVisualization({
  workout,
  fitSamples,
  className = "",
}: {
  workout: FeedbackRequest;
  fitSamples?: FitSensorSample[] | null;
  className?: string;
}) {
  const isRunning = workout.workOutType === "RUNNING";
  const averageSpeed = calculateAverageSpeed(workout);
  const durationHours = workout.movingTime === null ? null : workout.movingTime / 3600;
  const computedPace = workout.avgPace ?? (workout.distance && workout.movingTime ? workout.movingTime / workout.distance : null);
  const primaryMetrics: VisualMetric[] = [
    {
      label: "거리",
      value: formatNumber(workout.distance),
      unit: "km",
      ratio: clampRatio(workout.distance, isRunning ? 42.195 : 100),
      tone: "blue",
    },
    {
      label: "활동 시간",
      value: durationHours === null ? "-" : formatNumber(durationHours, 1),
      unit: "h",
      ratio: clampRatio(workout.movingTime, isRunning ? 10800 : 18000),
      tone: "green",
    },
    ...(isRunning
      ? [
          {
            label: "평균 페이스",
            value: formatPace(computedPace),
            unit: "/km",
            ratio: clampRatio(computedPace, 600, true),
            tone: "orange" as const,
          },
        ]
      : [
          {
            label: "평균 속도",
            value: formatNumber(averageSpeed),
            unit: "km/h",
            ratio: clampRatio(averageSpeed, 45),
            tone: "orange" as const,
          },
        ]),
  ];

  const detailMetrics = [
    { label: "누적 상승", value: formatNumber(workout.elevGain), unit: "m", raw: workout.elevGain },
    { label: "최고 고도", value: formatNumber(workout.elevationMax), unit: "m", raw: workout.elevationMax },
    { label: "칼로리", value: formatNumber(workout.calories, 0), unit: "kcal", raw: workout.calories },
    { label: "평균 케이던스", value: formatNumber(workout.avgCadence), unit: "rpm", raw: workout.avgCadence },
    { label: "최대 케이던스", value: formatNumber(workout.maxCadence), unit: "rpm", raw: workout.maxCadence },
    { label: "평균 심박", value: formatNumber(workout.avgHeartRate), unit: "bpm", raw: workout.avgHeartRate },
    { label: "최대 심박", value: formatNumber(workout.maxHeartRate), unit: "bpm", raw: workout.maxHeartRate },
    { label: "평균 속도", value: formatNumber(workout.avgSpeed), unit: "km/h", raw: isRunning ? null : workout.avgSpeed },
    { label: "최대 속도", value: formatNumber(workout.maxSpeed), unit: "km/h", raw: isRunning ? null : workout.maxSpeed },
    { label: "평균 파워", value: formatNumber(workout.avgPower), unit: "W", raw: isRunning ? null : workout.avgPower },
    { label: "최대 파워", value: formatNumber(workout.maxPower), unit: "W", raw: isRunning ? null : workout.maxPower },
    { label: "FTP", value: formatNumber(workout.ftp), unit: "W", raw: isRunning ? null : workout.ftp },
    { label: "평균 페이스", value: formatPace(workout.avgPace), unit: "/km", raw: isRunning ? workout.avgPace : null },
    { label: "최대 페이스", value: formatPace(workout.maxPace), unit: "/km", raw: isRunning ? workout.maxPace : null },
    { label: "걸음 수", value: formatNumber(workout.steps, 0), unit: "steps", raw: isRunning ? workout.steps : null },
  ].filter((metric) => metric.raw !== null);

  return (
    <div className={`workout-visual-card w-full p-4 text-[#1d1d1f] sm:p-5 ${className}`}>
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div className="min-w-0">
          <div className="text-xs font-bold uppercase tracking-[0.18em] text-[#7a7a7a]">입력된 운동</div>
          {workout.title ? (
            <div className="mt-1 max-w-full truncate text-base font-semibold tracking-[-0.224px] text-[#1d1d1f] sm:max-w-[28rem] sm:text-lg">
              {workout.title}
            </div>
          ) : null}
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-[#1d1d1f] px-3 py-1 text-sm font-semibold text-white">{isRunning ? "러닝" : "자전거"}</span>
            <span className="rounded-full bg-white/70 px-3 py-1 text-sm font-semibold text-[#333333] ring-1 ring-black/10">
              {workout.tier === "AMATEUR" ? "아마추어" : "프로"}
            </span>
            {workout.inputSource === "FIT_FILE" ? (
              <span className="rounded-full bg-[#f0f6ff] px-3 py-1 text-sm font-semibold text-[#0066cc] ring-1 ring-[#0066cc]/15">
                FIT 파일
              </span>
            ) : null}
          </div>
        </div>
        <div className="grid min-w-0 gap-2 text-sm text-[#555555] sm:grid-cols-2 md:min-w-[280px]">
          <div className="rounded-2xl bg-white/60 px-3 py-2 ring-1 ring-black/5">
            <span className="block text-xs font-semibold text-[#7a7a7a]">시작</span>
            {formatDateTime(workout.startedAt)}
          </div>
          <div className="rounded-2xl bg-white/60 px-3 py-2 ring-1 ring-black/5">
            <span className="block text-xs font-semibold text-[#7a7a7a]">종료</span>
            {formatDateTime(workout.endedAt)}
          </div>
        </div>
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-3">
        {primaryMetrics.map((metric) => (
          <SemiGauge key={metric.label} metric={metric} />
        ))}
      </div>

      {detailMetrics.length > 0 ? (
        <div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
          {detailMetrics.map((metric) => (
            <MetricPill key={metric.label} label={metric.label} unit={metric.unit} value={metric.value} />
          ))}
        </div>
      ) : null}

      {fitSamples ? <FitSensorPreview samples={fitSamples} /> : null}
    </div>
  );
}
