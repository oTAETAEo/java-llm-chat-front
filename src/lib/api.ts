const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8080";

export type AuthUser = {
  memberId: number;
  email: string;
  nickname: string;
  requiresTermsAgreement: boolean;
  missingRequiredTerms: LegalTerm[];
};

export type LegalTerm = {
  termsId: number;
  type: "TERMS_OF_SERVICE" | "PRIVACY_POLICY" | "SENSITIVE_INFORMATION" | "MARKETING";
  code: string;
  title: string;
  version: string;
  contentUrl: string;
  required: boolean;
};

export type LegalTermDetail = LegalTerm & {
  content: string;
};

export type FeedbackRoomSummary = {
  roomId: string;
  title: string;
  pinned: boolean;
  createdAt: string | null;
  updatedAt: string | null;
};

export type FeedbackMessage = {
  messageId: number;
  role: "USER" | "ASSISTANT";
  workOutType: FeedbackRequest["workOutType"] | null;
  workoutId: number | null;
  content: string;
  createdAt: string | null;
};

export type FeedbackRoomDetail = FeedbackRoomSummary & {
  messages: FeedbackMessage[];
};

export type FeedbackRoomWorkout = FeedbackRequest & {
  workoutId: number;
  feedbackCount: number;
  samples: FitSensorSample[];
};

export type WorkoutDashboardSummary = {
  totalWorkoutCount: number;
  totalDistance: number;
  totalMovingTime: number;
  totalFeedbackCount: number;
  runningCount: number;
  cyclingCount: number;
  runningDistance: number;
  cyclingDistance: number;
  avgHeartRate: number | null;
  totalElevGain: number;
  avgRunningPace: number | null;
  avgCyclingPower: number | null;
  recentDistances: Array<{
    label: string;
    startedAt: string;
    distance: number | null;
    movingTime: number | null;
    avgHeartRate: number | null;
    elevGain: number | null;
  }>;
};

export type WorkoutDashboardInsight = {
  typeDistribution: {
    totalWorkoutCount: number;
    totalDistance: number;
    running: WorkoutTypeShare;
    cycling: WorkoutTypeShare;
    avgRunningPace: number | null;
    avgCyclingPower: number | null;
  };
  workoutFrequency: {
    maxCount: number;
    days: Array<{
      dayOfWeek:
        | "MONDAY"
        | "TUESDAY"
        | "WEDNESDAY"
        | "THURSDAY"
        | "FRIDAY"
        | "SATURDAY"
        | "SUNDAY";
      count: number;
    }>;
  };
  feedbackUsage: {
    totalWorkoutCount: number;
    feedbackUsedWorkoutCount: number;
    totalFeedbackCount: number;
    usageRate: number;
  };
};

export type WorkoutTypeShare = {
  workOutType: FeedbackRequest["workOutType"];
  count: number;
  distance: number;
  workoutRatio: number;
  distanceRatio: number;
};

export type WorkoutHistoryItem = FeedbackRequest & {
  workoutId: number;
  feedbackCount: number;
};

export type WorkoutDetail = FeedbackRoomWorkout;

export type CursorPageResponse<T> = {
  items: T[];
  nextCursor: string | null;
  hasNext: boolean;
};

export type WorkoutDashboardFilters = {
  period: "ALL" | "7d" | "30d" | "90d" | "custom";
  workOutType: "ALL" | FeedbackRequest["workOutType"];
  startDate?: string;
  endDate?: string;
};

export type FitSensorSample = {
  elapsedSeconds: number | null;
  distance: number | null;
  latitude: number | null;
  longitude: number | null;
  altitude: number | null;
  heartRate: number | null;
  cadence: number | null;
  speed: number | null;
  power: number | null;
};

export type FitWorkoutPreview = FeedbackRequest & {
  samples: FitSensorSample[];
};

export type FitWorkoutSaveResult = {
  totalCount: number;
  createdCount: number;
  duplicatedCount: number;
  items: Array<{
    fileName: string | null;
    workoutId: number;
    workOutType: FeedbackRequest["workOutType"];
    tier: FeedbackRequest["tier"];
    title: string;
    inputSource: "FIT_FILE";
    created: boolean;
    startedAt: string | null;
    endedAt: string | null;
    distance: number | null;
    movingTime: number | null;
  }>;
};

export type FeedbackWithSensorRequest = {
  workout: FeedbackRequest;
  samples: FitSensorSample[];
};

export type FeedbackRequest = {
  workOutType: "RUNNING" | "CYCLING";
  tier: "AMATEUR" | "PRO";
  title: string | null;
  inputSource: "DIRECT_INPUT" | "FIT_FILE";
  startedAt: string;
  endedAt: string;
  distance: number | null;
  elevGain: number | null;
  elevationMax: number | null;
  movingTime: number | null;
  calories: number | null;
  avgCadence: number | null;
  maxCadence: number | null;
  maxHeartRate: number | null;
  avgHeartRate: number | null;
  avgSpeed: number | null;
  maxSpeed: number | null;
  avgPower: number | null;
  maxPower: number | null;
  ftp: number | null;
  avgPace: number | null;
  maxPace: number | null;
  steps: number | null;
};

export type ApiErrorResponse = {
  timestamp: string;
  status: number;
  error: string;
  code: string;
  message: string;
  path: string;
};

const NETWORK_ERROR_MESSAGE =
  "일시적으로 연결이 원활하지 않습니다. 잠시 후 다시 시도해 주세요.";
const TEMPORARY_ERROR_MESSAGE =
  "일시적인 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.";
const API_REQUEST_TIMEOUT_MS = 2500;

type FetchOptions = {
  timeoutMs?: number | null;
};

export function isNetworkError(error: unknown) {
  return error instanceof Error && error.message === NETWORK_ERROR_MESSAGE;
}

function isApiErrorResponse(value: unknown): value is ApiErrorResponse {
  if (!value || typeof value !== "object") return false;

  const candidate = value as Record<string, unknown>;
  return (
    typeof candidate.timestamp === "string" &&
    typeof candidate.status === "number" &&
    typeof candidate.error === "string" &&
    typeof candidate.code === "string" &&
    typeof candidate.message === "string" &&
    typeof candidate.path === "string"
  );
}

function isTemporaryServerErrorMessage(message: string) {
  const normalized = message.trim().toLowerCase();
  return (
    normalized.includes("서버 내부 오류") ||
    normalized.includes("internal server error")
  );
}

function normalizeApiErrorMessage(message: string, status?: number) {
  if (status !== undefined && status >= 500) {
    return TEMPORARY_ERROR_MESSAGE;
  }
  if (isTemporaryServerErrorMessage(message)) {
    return TEMPORARY_ERROR_MESSAGE;
  }
  return message;
}

async function fetchWithCredentials(
  path: string,
  init?: RequestInit,
  options?: FetchOptions,
) {
  const headers = new Headers(init?.headers);
  if (!(init?.body instanceof FormData) && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  const controller = new AbortController();
  const timeoutMs = options?.timeoutMs ?? API_REQUEST_TIMEOUT_MS;
  const timeoutId =
    timeoutMs === null
      ? null
      : window.setTimeout(() => controller.abort(), timeoutMs);
  init?.signal?.addEventListener("abort", () => controller.abort(), {
    once: true,
  });

  try {
    return await fetch(`${API_BASE_URL}${path}`, {
      ...init,
      credentials: "include",
      headers,
      signal: controller.signal,
    });
  } catch (error) {
    if (
      error instanceof TypeError ||
      (error instanceof DOMException && error.name === "AbortError")
    ) {
      throw new Error(NETWORK_ERROR_MESSAGE);
    }
    throw error;
  } finally {
    if (timeoutId !== null) {
      window.clearTimeout(timeoutId);
    }
  }
}

async function readErrorMessage(response: Response, fallback: string) {
  if (response.status >= 500) {
    return TEMPORARY_ERROR_MESSAGE;
  }

  const text = await response.text();
  if (!text) return fallback;

  try {
    const parsed = JSON.parse(text) as unknown;
    if (isApiErrorResponse(parsed) && parsed.message.length > 0) {
      return normalizeApiErrorMessage(parsed.message, parsed.status);
    }
    if (isApiErrorResponse(parsed) && parsed.code.length > 0) {
      return parsed.code;
    }
  } catch {
    return normalizeApiErrorMessage(text, response.status);
  }

  return normalizeApiErrorMessage(text, response.status);
}

async function reissueAccessToken() {
  const response = await fetchWithCredentials("/api/v1/auth/reissue", {
    method: "POST",
  });

  if (!response.ok) {
    throw new Error(
      await readErrorMessage(
        response,
        "로그인이 만료되었습니다. 다시 로그인해 주세요.",
      ),
    );
  }

  return response.json() as Promise<AuthUser>;
}

function shouldAttemptReissue(response: Response, path: string) {
  const reissueExcludedPaths = [
    "/api/v1/auth/sign-up",
    "/api/v1/auth/login",
    "/api/v1/auth/reissue",
    "/api/v1/auth/logout",
  ];

  return (
    (response.status === 401 || response.status === 403) &&
    !reissueExcludedPaths.includes(path)
  );
}

async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  let response = await fetchWithCredentials(path, init);

  if (shouldAttemptReissue(response, path)) {
    await reissueAccessToken();
    response = await fetchWithCredentials(path, init);
  }

  if (!response.ok) {
    throw new Error(
      await readErrorMessage(response, `API request failed: ${response.status}`),
    );
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return response.json() as Promise<T>;
}

export function signUp(payload: {
  email: string;
  password: string;
  nickname: string;
  agreedTermsIds: number[];
}) {
  return apiFetch<AuthUser>("/api/v1/auth/sign-up", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function getSignUpTerms() {
  return apiFetch<LegalTerm[]>("/api/v1/auth/terms");
}

export type TermsAgreementStatus = {
  requiresTermsAgreement: boolean;
  missingRequiredTerms: LegalTerm[];
};

export function getTermsAgreementStatus() {
  return apiFetch<TermsAgreementStatus>("/api/v1/auth/terms/agreements/status");
}

export function agreeTerms(payload: { agreedTermsIds: number[] }) {
  return apiFetch<TermsAgreementStatus>("/api/v1/auth/terms/agreements", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function login(payload: { email: string; password: string }) {
  return apiFetch<AuthUser>("/api/v1/auth/login", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function reissueToken() {
  return reissueAccessToken();
}

export function logout() {
  return apiFetch<{ memberId: number }>("/api/v1/auth/logout", {
    method: "POST",
  });
}

export function uploadFitWorkout(
  file: File,
  tier: FeedbackRequest["tier"] = "AMATEUR",
) {
  const formData = new FormData();
  formData.append("file", file);

  return apiFetch<FitWorkoutPreview>(
    `/api/v1/workouts/fit?tier=${encodeURIComponent(tier)}`,
    {
      method: "POST",
      body: formData,
    },
  );
}

export function saveFitWorkoutRecords(
  files: File[],
  tier: FeedbackRequest["tier"] = "AMATEUR",
) {
  const formData = new FormData();
  files.forEach((file) => formData.append("files", file));

  return apiFetch<FitWorkoutSaveResult>(
    `/api/v1/workouts/fit/records?tier=${encodeURIComponent(tier)}`,
    {
      method: "POST",
      body: formData,
    },
  );
}

async function openFeedbackStream(
  payload: FeedbackRequest,
  roomId: string,
  samples?: FitSensorSample[] | null,
) {
  const hasSensorSamples = Boolean(samples && samples.length > 0);
  const path = hasSensorSamples
    ? `/api/v2/coach/feedback/rooms/${roomId}/single/stream`
    : `/api/v1/coach/feedback/rooms/${roomId}/single/stream`;
  const body: FeedbackRequest | FeedbackWithSensorRequest = hasSensorSamples
    ? { workout: payload, samples: samples ?? [] }
    : payload;

  return fetchWithCredentials(
    path,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "text/event-stream",
      },
      body: JSON.stringify(body),
    },
    { timeoutMs: null },
  );
}

export async function requestFeedbackStream(
  payload: FeedbackRequest,
  onChunk: (chunk: string) => void,
  roomId: string,
  samples?: FitSensorSample[] | null,
) {
  let response = await openFeedbackStream(payload, roomId, samples);

  if (response.status === 401 || response.status === 403) {
    await reissueAccessToken();
    response = await openFeedbackStream(payload, roomId, samples);
  }

  if (!response.ok || !response.body) {
    throw new Error(
      await readErrorMessage(
        response,
        `Feedback stream failed: ${response.status}`,
      ),
    );
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  const emitData = (data: string) => {
    if (!data) return;

    try {
      const parsed = JSON.parse(data) as
        | { content?: unknown; message?: unknown }
        | string;
      if (typeof parsed === "string") {
        emitData(parsed);
        return;
      }
      if (typeof parsed.message === "string" && parsed.message.length > 0) {
        throw new Error(normalizeApiErrorMessage(parsed.message));
      }
      if (typeof parsed.content === "string") {
        onChunk(parsed.content);
        return;
      }
    } catch (error) {
      if (error instanceof Error && error.name !== "SyntaxError") {
        throw error;
      }

      const matches = data.matchAll(/\{"content":"(?:\\.|[^"\\])*"\}/g);
      let matched = false;
      for (const match of matches) {
        matched = true;
        emitData(match[0]);
      }
      if (matched) return;
    }

    onChunk(data);
  };

  const flushEvent = (eventText: string) => {
    const data = eventText
      .split(/\r?\n/)
      .filter((line) => line.startsWith("data:"))
      .map((line) =>
        line.startsWith("data: ") ? line.slice(6) : line.slice(5),
      )
      .join("\n");

    emitData(data);
  };

  try {
    while (true) {
      const { done, value } = await reader.read();
      buffer += decoder.decode(value ?? new Uint8Array(), { stream: !done });

      const events = buffer.split(/\r?\n\r?\n/);
      buffer = events.pop() ?? "";

      for (const eventText of events) {
        flushEvent(eventText);
      }

      if (done) {
        if (buffer.length > 0) {
          flushEvent(buffer);
        }
        break;
      }
    }
  } catch (error) {
    if (error instanceof TypeError) {
      throw new Error(NETWORK_ERROR_MESSAGE);
    }
    throw error;
  }
}

export function createFeedbackRoom() {
  return apiFetch<FeedbackRoomSummary>("/api/v1/coach/feedback/rooms", {
    method: "POST",
  });
}

export function getRecentFeedbackRooms() {
  return apiFetch<FeedbackRoomSummary[]>("/api/v1/coach/feedback/rooms/recent");
}

export function getFeedbackRoom(roomId: string) {
  return apiFetch<FeedbackRoomDetail>(`/api/v1/coach/feedback/rooms/${roomId}`);
}

export function getFeedbackRoomWorkouts(roomId: string) {
  return apiFetch<FeedbackRoomWorkout[]>(
    `/api/v1/coach/feedback/rooms/${roomId}/workouts`,
  );
}

export function getPinnedFeedbackRooms() {
  return apiFetch<FeedbackRoomSummary[]>("/api/v1/coach/feedback/rooms/pinned");
}

export function renameFeedbackRoom(roomId: string, title: string) {
  return apiFetch<FeedbackRoomSummary>(
    `/api/v1/coach/feedback/rooms/${roomId}/title`,
    {
      method: "PATCH",
      body: JSON.stringify({ title }),
    },
  );
}

export function pinFeedbackRoom(roomId: string) {
  return apiFetch<FeedbackRoomSummary>(
    `/api/v1/coach/feedback/rooms/${roomId}/pin`,
    {
      method: "PATCH",
    },
  );
}

export function unpinFeedbackRoom(roomId: string) {
  return apiFetch<FeedbackRoomSummary>(
    `/api/v1/coach/feedback/rooms/${roomId}/unpin`,
    {
      method: "PATCH",
    },
  );
}

export function deleteFeedbackRoom(roomId: string) {
  return apiFetch<void>(`/api/v1/coach/feedback/rooms/${roomId}`, {
    method: "DELETE",
  });
}

function workoutDashboardSearchParams(
  filters: WorkoutDashboardFilters,
  page?: { cursor?: string | null; size?: number },
) {
  const params = new URLSearchParams({
    period: filters.period,
    workOutType: filters.workOutType,
  });

  if (filters.period === "custom") {
    if (filters.startDate) params.set("startDate", filters.startDate);
    if (filters.endDate) params.set("endDate", filters.endDate);
  }

  if (page?.cursor) params.set("cursor", page.cursor);
  if (page?.size) params.set("size", String(page.size));

  return params.toString();
}

export function getWorkoutDashboardSummary(filters: WorkoutDashboardFilters) {
  return apiFetch<WorkoutDashboardSummary>(
    `/api/v1/workouts/dashboard/summary?${workoutDashboardSearchParams(filters)}`,
  );
}

export function getWorkoutDashboardInsights(filters: WorkoutDashboardFilters) {
  return apiFetch<WorkoutDashboardInsight>(
    `/api/v1/workouts/dashboard/insights?${workoutDashboardSearchParams(filters)}`,
  );
}

export function getWorkoutDashboardHistories(
  filters: WorkoutDashboardFilters,
  page?: { cursor?: string | null; size?: number },
) {
  return apiFetch<CursorPageResponse<WorkoutHistoryItem>>(
    `/api/v1/workouts/dashboard/histories?${workoutDashboardSearchParams(filters, page)}`,
  );
}

export function getWorkoutDetail(
  workOutType: FeedbackRequest["workOutType"],
  workoutId: number,
) {
  return apiFetch<WorkoutDetail>(
    `/api/v1/workouts/records/${workOutType}/${workoutId}`,
  );
}
