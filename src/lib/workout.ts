import type { FeedbackRequest } from "@/lib/api";
import { parseServerDateTime } from "@/lib/dateTime";

export type WorkoutField = Exclude<
  keyof FeedbackRequest,
  "workOutType" | "tier" | "title" | "inputSource"
>;
export type WorkoutInputSource = NonNullable<FeedbackRequest["inputSource"]>;
export type WorkoutFormState = Record<WorkoutField, string> & {
  title: string;
  inputSource: WorkoutInputSource;
  movingTimeHours: string;
  movingTimeMinutes: string;
};

export type WorkoutFieldConfig = {
  name: WorkoutField;
  label: string;
  unit?: string;
  type?: string;
  required?: boolean;
};

export const emptyWorkoutForm: WorkoutFormState = {
  title: "",
  inputSource: "DIRECT_INPUT",
  startedAt: "",
  endedAt: "",
  distance: "",
  elevGain: "",
  elevationMax: "",
  movingTime: "",
  movingTimeHours: "",
  movingTimeMinutes: "",
  calories: "",
  avgCadence: "",
  maxCadence: "",
  maxHeartRate: "",
  avgHeartRate: "",
  avgSpeed: "",
  maxSpeed: "",
  avgPower: "",
  maxPower: "",
  ftp: "",
  avgPace: "",
  maxPace: "",
  steps: "",
};

export const commonWorkoutFields: WorkoutFieldConfig[] = [
  {
    name: "startedAt",
    label: "운동 시작 시간",
    type: "datetime-local",
    required: true,
  },
  {
    name: "endedAt",
    label: "운동 종료 시간",
    type: "datetime-local",
    required: true,
  },
  { name: "distance", label: "거리", unit: "km", required: true },
  {
    name: "movingTime",
    label: "활동 시간",
    unit: "시:분",
    type: "duration",
    required: true,
  },
  { name: "elevGain", label: "누적 상승 고도", unit: "m" },
  { name: "elevationMax", label: "최고 고도", unit: "m" },
  { name: "calories", label: "칼로리", unit: "kcal" },
  { name: "avgCadence", label: "평균 케이던스", unit: "rpm" },
  { name: "maxCadence", label: "최대 케이던스", unit: "rpm" },
  { name: "avgHeartRate", label: "평균 심박수", unit: "bpm" },
  { name: "maxHeartRate", label: "최대 심박수", unit: "bpm" },
];

export const cyclingWorkoutFields: WorkoutFieldConfig[] = [
  { name: "avgSpeed", label: "평균 속도", unit: "km/h" },
  { name: "maxSpeed", label: "최대 속도", unit: "km/h" },
  { name: "avgPower", label: "평균 파워", unit: "W" },
  { name: "maxPower", label: "최대 파워", unit: "W" },
  { name: "ftp", label: "FTP", unit: "W" },
];

export const runningWorkoutFields: WorkoutFieldConfig[] = [
  { name: "avgPace", label: "평균 페이스", unit: "초/km" },
  { name: "maxPace", label: "최대 페이스", unit: "초/km" },
  { name: "steps", label: "걸음 수", unit: "steps" },
];

export function toNumberOrNull(value: string) {
  if (value.trim() === "") return null;
  return Number(value);
}

export function durationToSeconds(hoursValue: string, minutesValue: string) {
  if (hoursValue.trim() === "" && minutesValue.trim() === "") return null;

  const hours = hoursValue.trim() === "" ? 0 : Number(hoursValue);
  const minutes = minutesValue.trim() === "" ? 0 : Number(minutesValue);
  return hours * 3600 + minutes * 60;
}

export function formatDuration(seconds: number | null) {
  if (seconds === null) return "-";

  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const remainingSeconds = seconds % 60;

  return `${hours}시간 ${minutes}분 ${remainingSeconds}초`;
}

export function formatDateTime(value: string) {
  if (!value) return "-";

  const date = parseServerDateTime(value);
  if (!date) return value;

  return new Intl.DateTimeFormat("ko-KR", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(date);
}

export function formatNumber(value: number | null, fractionDigits = 1) {
  if (value === null) return "-";

  return new Intl.NumberFormat("ko-KR", {
    maximumFractionDigits: fractionDigits,
    minimumFractionDigits: Number.isInteger(value) ? 0 : fractionDigits,
  }).format(value);
}

export function formatPace(secondsPerKm: number | null) {
  if (secondsPerKm === null) return "-";

  const minutes = Math.floor(secondsPerKm / 60);
  const seconds = Math.round(secondsPerKm % 60)
    .toString()
    .padStart(2, "0");
  return `${minutes}:${seconds}`;
}

export function calculateAverageSpeed(workout: FeedbackRequest) {
  if (workout.avgSpeed !== null) return workout.avgSpeed;
  if (
    workout.distance === null ||
    workout.movingTime === null ||
    workout.movingTime <= 0
  )
    return null;

  return workout.distance / (workout.movingTime / 3600);
}

export function clampRatio(value: number | null, max: number, invert = false) {
  if (value === null || !Number.isFinite(value) || max <= 0) return 0;

  const rawRatio = Math.min(Math.max(value / max, 0), 1);
  return invert ? 1 - rawRatio : rawRatio;
}

export function buildFeedbackRequest(
  workOutType: FeedbackRequest["workOutType"],
  tier: FeedbackRequest["tier"],
  form: WorkoutFormState,
): FeedbackRequest {
  const title = form.title.trim();

  return {
    workOutType,
    tier,
    title: title.length > 0 ? title : null,
    inputSource: form.inputSource,
    startedAt: form.startedAt,
    endedAt: form.endedAt,
    distance: toNumberOrNull(form.distance),
    elevGain: toNumberOrNull(form.elevGain),
    elevationMax: toNumberOrNull(form.elevationMax),
    movingTime: durationToSeconds(form.movingTimeHours, form.movingTimeMinutes),
    calories: toNumberOrNull(form.calories),
    avgCadence: toNumberOrNull(form.avgCadence),
    maxCadence: toNumberOrNull(form.maxCadence),
    maxHeartRate: toNumberOrNull(form.maxHeartRate),
    avgHeartRate: toNumberOrNull(form.avgHeartRate),
    avgSpeed: toNumberOrNull(form.avgSpeed),
    maxSpeed: toNumberOrNull(form.maxSpeed),
    avgPower: toNumberOrNull(form.avgPower),
    maxPower: toNumberOrNull(form.maxPower),
    ftp: toNumberOrNull(form.ftp),
    avgPace: toNumberOrNull(form.avgPace),
    maxPace: toNumberOrNull(form.maxPace),
    steps: toNumberOrNull(form.steps),
  };
}

export function workoutToForm(workout: FeedbackRequest): WorkoutFormState {
  return {
    ...emptyWorkoutForm,
    title: workout.title ?? "",
    inputSource: workout.inputSource,
    startedAt: workout.startedAt,
    endedAt: workout.endedAt,
    distance: workout.distance === null ? "" : String(workout.distance),
    elevGain: workout.elevGain === null ? "" : String(workout.elevGain),
    elevationMax:
      workout.elevationMax === null ? "" : String(workout.elevationMax),
    movingTime: "",
    movingTimeHours:
      workout.movingTime === null
        ? ""
        : String(Math.floor(workout.movingTime / 3600)),
    movingTimeMinutes:
      workout.movingTime === null
        ? ""
        : String(Math.floor((workout.movingTime % 3600) / 60)),
    calories: workout.calories === null ? "" : String(workout.calories),
    avgCadence: workout.avgCadence === null ? "" : String(workout.avgCadence),
    maxCadence: workout.maxCadence === null ? "" : String(workout.maxCadence),
    maxHeartRate:
      workout.maxHeartRate === null ? "" : String(workout.maxHeartRate),
    avgHeartRate:
      workout.avgHeartRate === null ? "" : String(workout.avgHeartRate),
    avgSpeed: workout.avgSpeed === null ? "" : String(workout.avgSpeed),
    maxSpeed: workout.maxSpeed === null ? "" : String(workout.maxSpeed),
    avgPower: workout.avgPower === null ? "" : String(workout.avgPower),
    maxPower: workout.maxPower === null ? "" : String(workout.maxPower),
    ftp: workout.ftp === null ? "" : String(workout.ftp),
    avgPace: workout.avgPace === null ? "" : String(workout.avgPace),
    maxPace: workout.maxPace === null ? "" : String(workout.maxPace),
    steps: workout.steps === null ? "" : String(workout.steps),
  };
}

export function workoutSignature(workout: FeedbackRequest) {
  return JSON.stringify({
    workOutType: workout.workOutType,
    tier: workout.tier,
    startedAt: workout.startedAt,
    endedAt: workout.endedAt,
    distance: workout.distance,
    elevGain: workout.elevGain,
    elevationMax: workout.elevationMax,
    movingTime: workout.movingTime,
    calories: workout.calories,
    avgCadence: workout.avgCadence,
    maxCadence: workout.maxCadence,
    maxHeartRate: workout.maxHeartRate,
    avgHeartRate: workout.avgHeartRate,
    avgSpeed: workout.avgSpeed,
    maxSpeed: workout.maxSpeed,
    avgPower: workout.avgPower,
    maxPower: workout.maxPower,
    ftp: workout.ftp,
    avgPace: workout.avgPace,
    maxPace: workout.maxPace,
    steps: workout.steps,
  });
}

export function missingRequiredWorkoutFields(workout: FeedbackRequest) {
  return (
    !workout.startedAt ||
    !workout.endedAt ||
    workout.distance === null ||
    workout.movingTime === null
  );
}

export function hasAnyWorkoutInput(
  form: WorkoutFormState,
  draftWorkout: FeedbackRequest | null,
) {
  return (
    draftWorkout !== null ||
    Object.entries(form).some(
      ([name, value]) => name !== "inputSource" && value.trim() !== "",
    )
  );
}
