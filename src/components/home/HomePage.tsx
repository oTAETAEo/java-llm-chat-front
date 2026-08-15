"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { toast } from "sonner";
import type {
  AuthUser,
  FeedbackMessage,
  FeedbackRequest,
  FeedbackRoomSummary,
  FeedbackRoomWorkout,
  FitSensorSample,
  FitWorkoutPreview,
  WorkoutDetail,
} from "@/lib/api";
import {
  agreeTerms,
  createFeedbackRoom,
  deleteFeedbackRoom,
  getFeedbackRoom,
  getFeedbackRoomWorkouts,
  getPinnedFeedbackRooms,
  getRecentFeedbackRooms,
  logout,
  pinFeedbackRoom,
  isNetworkError,
  reissueToken,
  renameFeedbackRoom,
  requestFeedbackStream,
  unpinFeedbackRoom,
} from "@/lib/api";
import { defaultGreeting, demoFeedbackTexts } from "@/constants/chat";
import { demoWorkouts } from "@/constants/demo";
import { AuthDialog, type AuthMode } from "@/components/auth/AuthDialog";
import { BottomActionBar } from "@/components/chat/BottomActionBar";
import { ChatMessage } from "@/components/chat/ChatMessage";
import { FeedbackHtml } from "@/components/chat/FeedbackHtml";
import { GeneratingFeedbackIndicator } from "@/components/chat/GeneratingFeedbackIndicator";
import { TimeSeparator } from "@/components/chat/TimeSeparator";
import { Icon } from "@/components/common/Icon";
import { DeleteRoomDialog } from "@/components/home/DeleteRoomDialog";
import { DemoCtaCard } from "@/components/home/DemoCtaCard";
import { Sidebar } from "@/components/layout/Sidebar";
import { TopAuthActions } from "@/components/layout/TopAuthActions";
import {
  ConsentModal,
  type ConsentItem,
  type ConsentResult,
} from "@/components/legal/ConsentModal";
import { WorkoutInputDialog } from "@/components/workout/WorkoutInputDialog";
import { WorkoutHistoryDashboard } from "@/components/workout/WorkoutHistoryDashboard";
import { WorkoutVisualization } from "@/components/workout/WorkoutVisualization";
import {
  MESSAGE_TIME_GAP_MS,
  parseMessageDate,
  shouldShowTimeSeparator,
} from "@/lib/chatTime";
import {
  isWorkoutDashboardPath,
  roomIdFromPath,
  replaceUrl,
  WORKOUT_DASHBOARD_PATH,
} from "@/lib/routes";
import {
  isEmptyWorkoutDraft,
  type WorkoutDraftStorage,
  workoutDraftStorageKey,
} from "@/lib/workoutDraft";
import {
  buildFeedbackRequest,
  emptyWorkoutForm,
  hasAnyWorkoutInput,
  missingRequiredWorkoutFields,
  workoutSignature,
  workoutToForm,
  type WorkoutFormState,
} from "@/lib/workout";

const SIDEBAR_BREAKPOINT = 1024;
const AUTO_SCROLL_BOTTOM_THRESHOLD = 96;
const ROOM_SKELETON_MIN_DURATION_MS = 400;
const GENERATING_FEEDBACK_SCROLL_OFFSET = 120;
const FEEDBACK_RECONCILE_ATTEMPTS = 8;
const FEEDBACK_RECONCILE_DELAY_MS = 1000;
type MainView = "chat" | "workoutHistory";
type FeedbackGenerationStatus = "generating" | "completed";
type FeedbackGenerationState = {
  status: FeedbackGenerationStatus;
  text: string;
};

function resolveErrorMessage(error: unknown, fallback: string) {
  return error instanceof Error ? error.message : fallback;
}

function wait(ms: number) {
  return new Promise((resolve) => {
    window.setTimeout(resolve, ms);
  });
}

function ChatRoomSkeleton() {
  return (
    <div
      aria-label="대화 불러오는 중"
      className="apple-chat-skeleton mx-auto flex w-full max-w-3xl flex-col gap-5"
    >
      <div className="mx-auto h-7 w-40 rounded-full bg-black/5" />
      <div className="flex justify-end">
        <div className="w-[82%] rounded-[24px] border border-black/5 bg-white/65 p-5 shadow-sm">
          <div className="mb-4 flex items-center gap-2">
            <div className="h-6 w-14 rounded-full bg-black/10" />
            <div className="h-6 w-20 rounded-full bg-black/10" />
          </div>
          <div className="grid gap-3 sm:grid-cols-3">
            <div className="h-24 rounded-[18px] bg-black/5" />
            <div className="h-24 rounded-[18px] bg-black/5" />
            <div className="h-24 rounded-[18px] bg-black/5" />
          </div>
        </div>
      </div>
      <div className="flex gap-4">
        <div className="h-10 w-10 shrink-0 rounded-full bg-black/10" />
        <div className="flex max-w-[78%] flex-1 flex-col gap-3 rounded-xl rounded-tl-sm border border-black/5 bg-white/70 p-4 shadow-sm">
          <div className="h-4 w-11/12 rounded-full bg-black/10" />
          <div className="h-4 w-full rounded-full bg-black/10" />
          <div className="h-4 w-2/3 rounded-full bg-black/10" />
        </div>
      </div>
      <div className="flex gap-4">
        <div className="h-10 w-10 shrink-0 rounded-full bg-black/10" />
        <div className="flex max-w-[72%] flex-1 flex-col gap-3 rounded-xl rounded-tl-sm border border-black/5 bg-white/70 p-4 shadow-sm">
          <div className="h-4 w-full rounded-full bg-black/10" />
          <div className="h-4 w-4/5 rounded-full bg-black/10" />
        </div>
      </div>
    </div>
  );
}

export function HomePage({
  initialRoomId,
  initialView,
}: {
  initialRoomId?: string;
  initialView?: MainView;
}) {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [user, setUser] = useState<AuthUser | null>(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [authMode, setAuthMode] = useState<AuthMode>("login");
  const [authDialogOpen, setAuthDialogOpen] = useState(false);
  const [termsAgreementSubmitting, setTermsAgreementSubmitting] =
    useState(false);
  const [mainView, setMainView] = useState<MainView>(initialView ?? "chat");
  const [workoutInputOpen, setWorkoutInputOpen] = useState(false);
  const [workOutType, setWorkOutType] =
    useState<FeedbackRequest["workOutType"]>("RUNNING");
  const [tier, setTier] = useState<FeedbackRequest["tier"]>("AMATEUR");
  const [workoutForm, setWorkoutForm] =
    useState<WorkoutFormState>(emptyWorkoutForm);
  const [draftWorkout, setDraftWorkout] = useState<FeedbackRequest | null>(
    null,
  );
  const [fitPreviewSamples, setFitPreviewSamples] = useState<
    FitSensorSample[] | null
  >(null);
  const [activeRoomId, setActiveRoomId] = useState<string | undefined>(
    initialRoomId,
  );
  const [pinnedRooms, setPinnedRooms] = useState<FeedbackRoomSummary[]>([]);
  const [recentRooms, setRecentRooms] = useState<FeedbackRoomSummary[]>([]);
  const [roomWorkouts, setRoomWorkouts] = useState<FeedbackRoomWorkout[]>([]);
  const [persistedMessages, setPersistedMessages] = useState<FeedbackMessage[]>(
    [],
  );
  const [feedbackText, setFeedbackText] = useState("");
  const [feedbackGenerations, setFeedbackGenerations] = useState<
    Record<string, FeedbackGenerationState>
  >({});
  const [workoutInputError, setWorkoutInputError] = useState("");
  const [generatingFeedback, setGeneratingFeedback] = useState(false);
  const [loadingRoomId, setLoadingRoomId] = useState<string | null>(null);
  const [deleteTargetRoom, setDeleteTargetRoom] =
    useState<FeedbackRoomSummary | null>(null);
  const generatingFeedbackRef = useRef(false);
  const roomRequestIdRef = useRef(0);
  const chatScrollRef = useRef<HTMLDivElement | null>(null);
  const workoutHistoryScrollRef = useRef<HTMLDivElement | null>(null);
  const pendingRoomScrollRef = useRef(false);
  const demoCtaRef = useRef<HTMLDivElement | null>(null);
  const shouldAutoScrollRef = useRef(true);
  const workoutDraftHydratedRef = useRef(false);
  const workoutDraftKeyRef = useRef("");
  const demoFeedbackIndexRef = useRef(0);
  const demoWorkoutIndexRef = useRef(0);
  const [greetingText, setGreetingText] = useState("");
  const [greetingStreaming, setGreetingStreaming] = useState(true);
  const [greetingRunId, setGreetingRunId] = useState(0);
  const [emptyChatTimestamp, setEmptyChatTimestamp] = useState(
    () => new Date(),
  );
  const [demoStep, setDemoStep] = useState(0);
  const [demoFeedbackStream, setDemoFeedbackStream] = useState("");
  const [demoStreaming, setDemoStreaming] = useState(false);
  const mainViewRef = useRef(mainView);
  const activeRoomIdRef = useRef(activeRoomId);
  const feedbackGenerationsRef = useRef(feedbackGenerations);

  const activeRoomGeneration = activeRoomId
    ? feedbackGenerations[activeRoomId]
    : undefined;
  const activeFeedbackText =
    activeRoomGeneration?.status === "generating"
      ? activeRoomGeneration.text
      : feedbackText;
  const activeGeneratingFeedback =
    activeRoomGeneration?.status === "generating" ||
    (!activeRoomId && generatingFeedback);
  const missingRequiredTerms = user?.missingRequiredTerms ?? [];
  const termsAgreementRequired = Boolean(user?.requiresTermsAgreement);
  const termsAgreementItems: ConsentItem[] = missingRequiredTerms.map((term) => ({
    key: String(term.termsId),
    label: `${term.title} v${term.version}`,
    required: true,
    href: term.contentUrl,
    description: "변경되었거나 아직 동의하지 않은 필수 약관입니다.",
  }));
  const generatingFeedbackRoomIds = Object.entries(feedbackGenerations)
    .filter(([, generation]) => generation.status === "generating")
    .map(([roomId]) => roomId);
  const completedFeedbackRoomIds = Object.entries(feedbackGenerations)
    .filter(([, generation]) => generation.status === "completed")
    .map(([roomId]) => roomId);

  function updateFeedbackGenerations(
    updater: (
      current: Record<string, FeedbackGenerationState>,
    ) => Record<string, FeedbackGenerationState>,
  ) {
    setFeedbackGenerations((current) => {
      const next = updater(current);
      feedbackGenerationsRef.current = next;
      return next;
    });
  }

  function setFeedbackGeneration(
    roomId: string,
    generation: FeedbackGenerationState,
  ) {
    updateFeedbackGenerations((current) => ({
      ...current,
      [roomId]: generation,
    }));
  }

  function clearFeedbackGeneration(roomId: string) {
    updateFeedbackGenerations((current) => {
      if (!current[roomId]) return current;

      const next = { ...current };
      delete next[roomId];
      return next;
    });
  }

  function isRoomVisible(roomId: string) {
    return mainViewRef.current === "chat" && activeRoomIdRef.current === roomId;
  }

  useEffect(() => {
    mainViewRef.current = mainView;
  }, [mainView]);

  useEffect(() => {
    activeRoomIdRef.current = activeRoomId;
  }, [activeRoomId]);

  function openAuthDialog(mode: AuthMode) {
    setAuthMode(mode);
    setAuthDialogOpen(true);
  }

  function scrollChatToBottom(
    behavior: ScrollBehavior = "auto",
    bottomOffset = 0,
  ) {
    window.requestAnimationFrame(() => {
      window.requestAnimationFrame(() => {
        const scrollElement = chatScrollRef.current;
        if (!scrollElement) return;

        scrollElement.scrollTo({
          top: scrollElement.scrollHeight - bottomOffset,
          behavior,
        });
        shouldAutoScrollRef.current = true;
      });
    });
  }

  useLayoutEffect(() => {
    if (loadingRoomId !== null || !pendingRoomScrollRef.current) return;

    const scrollElement = chatScrollRef.current;
    if (!scrollElement) return;

    scrollElement.scrollTop = scrollElement.scrollHeight;
    shouldAutoScrollRef.current = true;
    pendingRoomScrollRef.current = false;
  }, [loadingRoomId, persistedMessages.length, roomWorkouts.length]);

  useLayoutEffect(() => {
    if (mainView !== "workoutHistory") return;

    const scrollElement = workoutHistoryScrollRef.current;
    if (!scrollElement) return;

    scrollElement.scrollTop = 0;
  }, [mainView]);

  function clearWorkoutDraftStorage(roomId = activeRoomId) {
    window.localStorage.removeItem(workoutDraftStorageKey(roomId));
  }

  function resetWorkoutDraftState() {
    setDraftWorkout(null);
    setFitPreviewSamples(null);
    setWorkoutForm(emptyWorkoutForm);
    setWorkOutType("RUNNING");
    setTier("AMATEUR");
    setWorkoutInputError("");
  }

  function applyDemoWorkout(index = demoWorkoutIndexRef.current) {
    const workout = demoWorkouts[index % demoWorkouts.length];
    demoWorkoutIndexRef.current = index % demoWorkouts.length;
    setWorkOutType(workout.workOutType);
    setTier(workout.tier);
    setWorkoutForm(workoutToForm(workout));
    setDraftWorkout(null);
    setFitPreviewSamples(null);
    setWorkoutInputError("");
  }

  function rotateDemoWorkout() {
    applyDemoWorkout((demoWorkoutIndexRef.current + 1) % demoWorkouts.length);
  }

  function isDemoOnlyWorkoutDraft(draft: Partial<WorkoutDraftStorage>) {
    if (draft.draftWorkout || !draft.workoutForm) return false;

    const normalizedForm = { ...emptyWorkoutForm, ...draft.workoutForm };
    return demoWorkouts.some((workout) => {
      return (
        JSON.stringify(workoutToForm(workout)) ===
        JSON.stringify(normalizedForm)
      );
    });
  }

  function applyWorkoutDraft(roomId: string | undefined, includeDemo: boolean) {
    workoutDraftHydratedRef.current = false;
    const storageKey = workoutDraftStorageKey(roomId);
    workoutDraftKeyRef.current = storageKey;

    try {
      const stored = window.localStorage.getItem(storageKey);
      if (!stored) {
        if (includeDemo) {
          applyDemoWorkout();
          return;
        }

        resetWorkoutDraftState();
        return;
      }

      const draft = JSON.parse(stored) as Partial<WorkoutDraftStorage>;
      if (user && isDemoOnlyWorkoutDraft(draft)) {
        window.localStorage.removeItem(storageKey);
        resetWorkoutDraftState();
        return;
      }

      if (includeDemo && isEmptyWorkoutDraft(draft)) {
        applyDemoWorkout();
        return;
      }

      setWorkOutType(
        draft.workOutType === "RUNNING" || draft.workOutType === "CYCLING"
          ? draft.workOutType
          : "RUNNING",
      );
      setTier(
        draft.tier === "AMATEUR" || draft.tier === "PRO"
          ? draft.tier
          : "AMATEUR",
      );
      setWorkoutForm(
        draft.workoutForm
          ? { ...emptyWorkoutForm, ...draft.workoutForm }
          : emptyWorkoutForm,
      );
      setDraftWorkout(draft.draftWorkout ?? null);
      setFitPreviewSamples(draft.fitPreviewSamples ?? null);
      setWorkoutInputError("");
    } catch {
      window.localStorage.removeItem(storageKey);
      resetWorkoutDraftState();
    } finally {
      workoutDraftHydratedRef.current = true;
    }
  }

  useEffect(() => {
    const timerId = window.setTimeout(() => {
      applyWorkoutDraft(initialRoomId, false);
    }, 0);

    return () => {
      window.clearTimeout(timerId);
    };
    // Initial draft hydration must keep a stable empty dependency array for Fast Refresh.
    // Room changes are handled explicitly by handleRoomClick/popstate handlers.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!authChecked || user || activeRoomId) return;
    const timerId = window.setTimeout(() => {
      applyWorkoutDraft(undefined, true);
    }, 0);

    return () => {
      window.clearTimeout(timerId);
    };
    // Demo draft is applied only after auth check confirms the visitor is logged out.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authChecked, user, activeRoomId]);

  useEffect(() => {
    if (!workoutDraftHydratedRef.current || !user) return;

    const draft: WorkoutDraftStorage = {
      workOutType,
      tier,
      workoutForm,
      draftWorkout,
      fitPreviewSamples,
    };
    window.localStorage.setItem(
      workoutDraftKeyRef.current || workoutDraftStorageKey(activeRoomId),
      JSON.stringify(draft),
    );
  }, [
    activeRoomId,
    draftWorkout,
    fitPreviewSamples,
    tier,
    user,
    workOutType,
    workoutForm,
  ]);

  async function refreshRoomLists() {
    const [pinned, recent] = await Promise.all([
      getPinnedFeedbackRooms(),
      getRecentFeedbackRooms(),
    ]);
    setPinnedRooms(pinned);
    setRecentRooms(recent);
  }

  function handleWorkoutFormChange(
    name: keyof WorkoutFormState,
    value: string,
  ) {
    setWorkoutForm((current) => ({ ...current, [name]: value }));
  }

  function handleWorkOutTypeChange(
    nextWorkOutType: FeedbackRequest["workOutType"],
  ) {
    setWorkOutType(nextWorkOutType);
  }

  function handleTierChange(nextTier: FeedbackRequest["tier"]) {
    setTier(nextTier);
  }

  function handleResetWorkoutInput() {
    clearWorkoutDraftStorage();
    resetWorkoutDraftState();
  }

  function handleParsedWorkout(payload: FitWorkoutPreview) {
    const { samples, ...workout } = payload;

    setWorkOutType(workout.workOutType);
    setTier(workout.tier);
    setWorkoutForm(workoutToForm(workout));
    setDraftWorkout(workout);
    setFitPreviewSamples(samples);
    setWorkoutInputError("");
  }

  async function handleWorkoutHistoryFeedback(workout: WorkoutDetail) {
    const { samples, ...payload } = workout;
    const room = await createFeedbackRoom();
    const roomId = room.roomId;
    const streamingSamples = samples.length > 0 ? samples : null;

    mainViewRef.current = "chat";
    setMainView("chat");
    activeRoomIdRef.current = roomId;
    setActiveRoomId(roomId);
    setPersistedMessages([]);
    setRoomWorkouts([]);
    setLoadingRoomId(null);
    setWorkOutType(payload.workOutType);
    setTier(payload.tier);
    setWorkoutForm(workoutToForm(payload));
    setDraftWorkout(payload);
    setFitPreviewSamples(streamingSamples);
    setWorkoutInputError("");
    setFeedbackText("");
    setGeneratingFeedback(true);
    generatingFeedbackRef.current = true;
    workoutDraftKeyRef.current = workoutDraftStorageKey(roomId);
    shouldAutoScrollRef.current = true;
    replaceUrl(`/c/${roomId}`);
    setFeedbackGeneration(roomId, { status: "generating", text: "" });
    void refreshRoomLists().catch(() => {
      // Sidebar refresh is non-blocking after creating a feedback room.
    });

    try {
      await requestFeedbackStream(
        payload,
        (chunk) => {
          updateFeedbackGenerations((current) => {
            const currentGeneration = current[roomId];

            return {
              ...current,
              [roomId]: {
                status: "generating",
                text: `${currentGeneration?.text ?? ""}${chunk}`,
              },
            };
          });
          if (isRoomVisible(roomId)) {
            setFeedbackText((current) => `${current}${chunk}`);
          }
        },
        roomId,
        streamingSamples,
      );

      await refreshFeedbackRoomState(roomId);
      if (isRoomVisible(roomId)) {
        clearFeedbackGeneration(roomId);
        scrollChatToBottom("smooth");
      } else {
        setFeedbackGeneration(roomId, { status: "completed", text: "" });
      }
    } catch (error) {
      if (
        isNetworkError(error) &&
        (await reconcileSavedAssistantMessage(roomId, new Set()))
      ) {
        if (isRoomVisible(roomId)) {
          clearFeedbackGeneration(roomId);
        } else {
          setFeedbackGeneration(roomId, { status: "completed", text: "" });
        }
        return;
      }

      clearFeedbackGeneration(roomId);
      toast.error(resolveErrorMessage(error, "피드백 생성에 실패했습니다."));
    } finally {
      generatingFeedbackRef.current = false;
      setGeneratingFeedback(false);
    }
  }

  function handleSaveWorkout() {
    const payload = buildFeedbackRequest(workOutType, tier, workoutForm);
    if (missingRequiredWorkoutFields(payload)) {
      setWorkoutInputError(
        "운동 시작/종료 시간, 거리, 활동 시간은 필수입니다. 먼저 운동 입력을 완료해 주세요.",
      );
      return;
    }

    setDraftWorkout(payload);
    setWorkoutInputOpen(false);
    setWorkoutInputError("");
  }

  async function refreshFeedbackRoomState(roomId: string) {
    const [room, workouts, rooms, pinned] = await Promise.all([
      getFeedbackRoom(roomId),
      getFeedbackRoomWorkouts(roomId),
      getRecentFeedbackRooms(),
      getPinnedFeedbackRooms(),
    ]);

    if (isRoomVisible(roomId)) {
      setPersistedMessages(room.messages);
      setRoomWorkouts(workouts);
      setFeedbackText("");
    }
    setRecentRooms(rooms);
    setPinnedRooms(pinned);
    return room;
  }

  async function reconcileSavedAssistantMessage(
    roomId: string,
    previousAssistantMessageIds: Set<number>,
  ) {
    for (let attempt = 0; attempt < FEEDBACK_RECONCILE_ATTEMPTS; attempt += 1) {
      if (attempt > 0) {
        await wait(FEEDBACK_RECONCILE_DELAY_MS);
      }

      try {
        const room = await refreshFeedbackRoomState(roomId);
        const hasNewAssistantMessage = room.messages.some((message) => {
          return (
            message.role === "ASSISTANT" &&
            !previousAssistantMessageIds.has(message.messageId)
          );
        });
        if (hasNewAssistantMessage) {
          if (isRoomVisible(roomId)) {
            scrollChatToBottom("smooth");
          }
          return true;
        }
      } catch {
        // Keep checking briefly; the backend may still be saving the generated answer.
      }
    }

    return false;
  }

  async function handleGenerateFeedback() {
    mainViewRef.current = "chat";
    setMainView("chat");
    const payload =
      draftWorkout ?? buildFeedbackRequest(workOutType, tier, workoutForm);

    if (missingRequiredWorkoutFields(payload)) {
      setWorkoutInputError(
        "운동 시작/종료 시간, 거리, 활동 시간은 필수입니다. 먼저 운동 입력을 완료해 주세요.",
      );
      setWorkoutInputOpen(true);
      return;
    }

    if (!user) {
      const nextDemoIndex =
        (demoFeedbackIndexRef.current + 1) % demoFeedbackTexts.length;
      setWorkoutInputError("");
      setDraftWorkout(payload);
      shouldAutoScrollRef.current = true;
      setFeedbackText("");
      demoFeedbackIndexRef.current = nextDemoIndex;
      setDemoFeedbackStream("");
      setDemoStreaming(true);
      setDemoStep(2);
      return;
    }

    setWorkoutInputError("");
    setDraftWorkout(payload);
    generatingFeedbackRef.current = true;
    shouldAutoScrollRef.current = true;
    setFeedbackText("");
    setWorkoutInputError("");
    setGeneratingFeedback(true);

    let feedbackRoomId = activeRoomId;
    const previousAssistantMessageIds = new Set(
      persistedMessages
        .filter((message) => message.role === "ASSISTANT")
        .map((message) => message.messageId),
    );

    try {
      const roomId = activeRoomId ?? (await createFeedbackRoom()).roomId;
      feedbackRoomId = roomId;
      if (!activeRoomId) {
        const newDraft = window.localStorage.getItem(
          workoutDraftStorageKey(undefined),
        );
        if (newDraft) {
          window.localStorage.setItem(workoutDraftStorageKey(roomId), newDraft);
          window.localStorage.removeItem(workoutDraftStorageKey(undefined));
          workoutDraftKeyRef.current = workoutDraftStorageKey(roomId);
        }
        activeRoomIdRef.current = roomId;
        setActiveRoomId(roomId);
        replaceUrl(`/c/${roomId}`);
      }
      setFeedbackGeneration(roomId, { status: "generating", text: "" });

      await requestFeedbackStream(
        payload,
        (chunk) => {
          updateFeedbackGenerations((current) => {
            const currentGeneration = current[roomId];

            return {
              ...current,
              [roomId]: {
                status: "generating",
                text: `${currentGeneration?.text ?? ""}${chunk}`,
              },
            };
          });
          if (isRoomVisible(roomId)) {
            setFeedbackText((current) => `${current}${chunk}`);
          }
        },
        roomId,
        fitPreviewSamples,
      );

      await refreshFeedbackRoomState(roomId);
      if (isRoomVisible(roomId)) {
        clearFeedbackGeneration(roomId);
        scrollChatToBottom("smooth");
      } else {
        setFeedbackGeneration(roomId, { status: "completed", text: "" });
      }
    } catch (error) {
      if (
        feedbackRoomId &&
        isNetworkError(error) &&
        (await reconcileSavedAssistantMessage(
          feedbackRoomId,
          previousAssistantMessageIds,
        ))
      ) {
        if (isRoomVisible(feedbackRoomId)) {
          clearFeedbackGeneration(feedbackRoomId);
        } else {
          setFeedbackGeneration(feedbackRoomId, {
            status: "completed",
            text: "",
          });
        }
        return;
      }

      if (feedbackRoomId) {
        clearFeedbackGeneration(feedbackRoomId);
      }
      toast.error(resolveErrorMessage(error, "피드백 생성에 실패했습니다."));
    } finally {
      generatingFeedbackRef.current = false;
      setGeneratingFeedback(false);
    }
  }

  function handleNewChat() {
    if (window.innerWidth < SIDEBAR_BREAKPOINT) {
      setSidebarOpen(false);
    }
    mainViewRef.current = "chat";
    setMainView("chat");
    if (!activeRoomId) {
      clearWorkoutDraftStorage(undefined);
    }
    workoutDraftKeyRef.current = workoutDraftStorageKey(undefined);
    activeRoomIdRef.current = undefined;
    setDraftWorkout(null);
    setFitPreviewSamples(null);
    setActiveRoomId(undefined);
    setPersistedMessages([]);
    setRoomWorkouts([]);
    setLoadingRoomId(null);
    if (!user) {
      rotateDemoWorkout();
    } else {
      setWorkoutForm(emptyWorkoutForm);
      setWorkOutType("RUNNING");
      setTier("AMATEUR");
    }
    setFeedbackText("");
    setFeedbackGenerations({});
    feedbackGenerationsRef.current = {};
    setWorkoutInputError("");
    setGreetingText("");
    setGreetingStreaming(true);
    setDemoStep(0);
    setDemoFeedbackStream("");
    setDemoStreaming(false);
    demoFeedbackIndexRef.current = 0;
    setEmptyChatTimestamp(new Date());
    setGreetingRunId((id) => id + 1);
    replaceUrl("/");
  }

  function clearAuthenticatedChatState() {
    mainViewRef.current = "chat";
    setMainView("chat");
    clearWorkoutDraftStorage();
    setDraftWorkout(null);
    setFitPreviewSamples(null);
    activeRoomIdRef.current = undefined;
    setActiveRoomId(undefined);
    setPinnedRooms([]);
    setRecentRooms([]);
    setPersistedMessages([]);
    setRoomWorkouts([]);
    setLoadingRoomId(null);
    applyDemoWorkout();
    setFeedbackText("");
    setFeedbackGenerations({});
    feedbackGenerationsRef.current = {};
    setWorkoutInputError("");
    setDeleteTargetRoom(null);
    setGreetingText("");
    setGreetingStreaming(true);
    setDemoStep(0);
    setDemoFeedbackStream("");
    setDemoStreaming(false);
    demoFeedbackIndexRef.current = 0;
    setEmptyChatTimestamp(new Date());
    setGreetingRunId((id) => id + 1);
    replaceUrl("/");
  }

  function clearDemoStateForAuthenticatedUser(authenticatedUser: AuthUser) {
    mainViewRef.current = "chat";
    setMainView("chat");
    window.localStorage.removeItem(workoutDraftStorageKey(undefined));
    workoutDraftKeyRef.current = workoutDraftStorageKey(undefined);
    workoutDraftHydratedRef.current = true;
    setUser(authenticatedUser);
    setDraftWorkout(null);
    setFitPreviewSamples(null);
    activeRoomIdRef.current = undefined;
    setActiveRoomId(undefined);
    setPersistedMessages([]);
    setRoomWorkouts([]);
    setWorkoutForm(emptyWorkoutForm);
    setWorkOutType("RUNNING");
    setTier("AMATEUR");
    setFeedbackText("");
    setFeedbackGenerations({});
    feedbackGenerationsRef.current = {};
    setWorkoutInputError("");
    setDemoStep(0);
    setDemoFeedbackStream("");
    setDemoStreaming(false);
    demoFeedbackIndexRef.current = 0;
    setGreetingText("");
    setGreetingStreaming(true);
    setEmptyChatTimestamp(new Date());
    setGreetingRunId((id) => id + 1);
    replaceUrl("/");
  }

  async function handleLogout() {
    try {
      await logout();
    } catch {
      // Even if the backend session already expired, clear local UI state.
    } finally {
      setUser(null);
      clearAuthenticatedChatState();
    }
  }

  async function handleTermsAgreementConfirm(result: ConsentResult) {
    const agreedTermsIds = missingRequiredTerms
      .filter((term) => result[String(term.termsId)])
      .map((term) => term.termsId);

    if (agreedTermsIds.length < missingRequiredTerms.length) {
      toast.error("필수 약관에 모두 동의해야 서비스를 계속 이용할 수 있습니다.");
      return;
    }

    setTermsAgreementSubmitting(true);
    try {
      const status = await agreeTerms({ agreedTermsIds });
      setUser((currentUser) =>
        currentUser
          ? {
              ...currentUser,
              requiresTermsAgreement: status.requiresTermsAgreement,
              missingRequiredTerms: status.missingRequiredTerms,
            }
          : currentUser,
      );
      toast.success("약관 동의가 저장되었습니다.");
    } catch (error) {
      toast.error(resolveErrorMessage(error, "약관 동의 저장에 실패했습니다."));
    } finally {
      setTermsAgreementSubmitting(false);
    }
  }

  useEffect(() => {
    let index = 0;

    const intervalId = window.setInterval(() => {
      index += 1;
      setGreetingText(defaultGreeting.slice(0, index));

      if (index >= defaultGreeting.length) {
        window.clearInterval(intervalId);
        setGreetingStreaming(false);
      }
    }, 28);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [greetingRunId]);

  useEffect(() => {
    if (
      user ||
      activeRoomId ||
      persistedMessages.length > 0 ||
      activeFeedbackText
    )
      return;
    if (greetingStreaming) return;

    const workoutTimerId = window.setTimeout(() => setDemoStep(1), 450);
    const feedbackTimerId = window.setTimeout(() => {
      demoFeedbackIndexRef.current = 0;
      setDemoFeedbackStream("");
      setDemoStreaming(true);
      setDemoStep(2);
    }, 1050);

    return () => {
      window.clearTimeout(workoutTimerId);
      window.clearTimeout(feedbackTimerId);
    };
  }, [
    activeRoomId,
    activeFeedbackText,
    greetingStreaming,
    persistedMessages.length,
    user,
  ]);

  useEffect(() => {
    if (demoStep < 2) return;

    const targetText = demoFeedbackTexts[demoFeedbackIndexRef.current];
    if (demoFeedbackStream.length >= targetText.length) return;

    const timerId = window.setTimeout(() => {
      const nextLength = Math.min(
        targetText.length,
        demoFeedbackStream.length + 3,
      );
      setDemoFeedbackStream(targetText.slice(0, nextLength));
      if (nextLength >= targetText.length) {
        setDemoStreaming(false);
      }
    }, 18);

    return () => {
      window.clearTimeout(timerId);
    };
  }, [demoFeedbackStream, demoStep]);

  useEffect(() => {
    const demoAutoStreaming =
      !user &&
      !activeRoomId &&
      persistedMessages.length === 0 &&
      activeFeedbackText.length === 0 &&
      demoStep >= 2 &&
      demoStreaming;
    const demoCtaVisible =
      !user &&
      !activeRoomId &&
      persistedMessages.length === 0 &&
      activeFeedbackText.length === 0 &&
      demoStep >= 2 &&
      !demoStreaming &&
      demoFeedbackStream.length > 0;
    if (!activeGeneratingFeedback && !demoAutoStreaming && !demoCtaVisible)
      return;
    if (!shouldAutoScrollRef.current) return;

    const scrollElement = chatScrollRef.current;
    if (!scrollElement) return;

    if (demoCtaVisible && demoCtaRef.current) {
      demoCtaRef.current.scrollIntoView({
        block: "center",
        behavior: "smooth",
      });
      return;
    }

    scrollElement.scrollTo({
      top:
        scrollElement.scrollHeight -
        (activeGeneratingFeedback && !activeFeedbackText
          ? GENERATING_FEEDBACK_SCROLL_OFFSET
          : 0),
      behavior: "smooth",
    });
  }, [
    activeRoomId,
    demoFeedbackStream,
    demoStep,
    demoStreaming,
    activeFeedbackText,
    activeGeneratingFeedback,
    persistedMessages.length,
    draftWorkout,
    user,
  ]);

  useEffect(() => {
    let active = true;

    reissueToken()
      .then((currentUser) => {
        if (!active) return;
        setUser(currentUser);
        resetWorkoutDraftState();
      })
      .catch(() => {
        if (!active) return;
        setUser(null);
      })
      .finally(() => {
        if (active) setAuthChecked(true);
      });

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (!user) return;

    Promise.all([getPinnedFeedbackRooms(), getRecentFeedbackRooms()])
      .then(([pinned, recent]) => {
        setPinnedRooms(pinned);
        setRecentRooms(recent);
      })
      .catch(() => {
        setPinnedRooms([]);
        setRecentRooms([]);
      });
  }, [user]);

  useEffect(() => {
    if (mainView !== "chat" || !user || !activeRoomId) {
      roomRequestIdRef.current += 1;
      pendingRoomScrollRef.current = false;
      return;
    }

    const requestId = roomRequestIdRef.current + 1;
    roomRequestIdRef.current = requestId;
    const roomId = activeRoomId;
    const loadingTimerId = window.setTimeout(() => {
      if (roomRequestIdRef.current === requestId) {
        setLoadingRoomId(roomId);
      }
    }, 0);
    let skeletonTimerId: number | undefined;
    let resolveMinimumSkeletonDelay: (() => void) | undefined;
    const minimumSkeletonDelay = new Promise<void>((resolve) => {
      resolveMinimumSkeletonDelay = resolve;
      skeletonTimerId = window.setTimeout(
        resolve,
        ROOM_SKELETON_MIN_DURATION_MS,
      );
    });

    Promise.all([
      Promise.all([getFeedbackRoom(roomId), getFeedbackRoomWorkouts(roomId)]),
      minimumSkeletonDelay,
    ])
      .then(([[room, workouts]]) => {
        if (roomRequestIdRef.current !== requestId) return;

        setPersistedMessages(room.messages);
        setRoomWorkouts(workouts);
        setFeedbackText("");
        pendingRoomScrollRef.current = true;
      })
      .catch((error) => {
        if (roomRequestIdRef.current !== requestId) return;

        toast.error(resolveErrorMessage(error, "피드백 방을 불러오지 못했습니다."));
      })
      .finally(() => {
        if (roomRequestIdRef.current === requestId) {
          setLoadingRoomId(null);
        }
      });

    return () => {
      roomRequestIdRef.current += 1;
      pendingRoomScrollRef.current = false;
      window.clearTimeout(loadingTimerId);
      if (skeletonTimerId !== undefined) {
        window.clearTimeout(skeletonTimerId);
      }
      resolveMinimumSkeletonDelay?.();
    };
  }, [mainView, user, activeRoomId]);

  useEffect(() => {
    const syncRoomWithUrl = () => {
      if (isWorkoutDashboardPath(window.location.pathname)) {
        mainViewRef.current = "workoutHistory";
        setMainView("workoutHistory");
        setLoadingRoomId(null);
        return;
      }

      const nextRoomId = roomIdFromPath(window.location.pathname);
      mainViewRef.current = "chat";
      setMainView("chat");
      activeRoomIdRef.current = nextRoomId;
      setActiveRoomId(nextRoomId);
      if (
        nextRoomId &&
        feedbackGenerationsRef.current[nextRoomId]?.status === "completed"
      ) {
        clearFeedbackGeneration(nextRoomId);
      }
      applyWorkoutDraft(nextRoomId, !nextRoomId && !user);
    };

    window.addEventListener("popstate", syncRoomWithUrl);

    return () => {
      window.removeEventListener("popstate", syncRoomWithUrl);
    };
    // The popstate listener is registered once; it reads the current URL at event time.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function handleRoomClick(roomId: string) {
    if (window.innerWidth < SIDEBAR_BREAKPOINT) {
      setSidebarOpen(false);
    }
    if (roomId === activeRoomId) return;

    mainViewRef.current = "chat";
    setMainView("chat");
    setLoadingRoomId(roomId);
    activeRoomIdRef.current = roomId;
    setActiveRoomId(roomId);
    if (feedbackGenerationsRef.current[roomId]?.status === "completed") {
      clearFeedbackGeneration(roomId);
    }
    applyWorkoutDraft(roomId, false);
    setFeedbackText(feedbackGenerationsRef.current[roomId]?.text ?? "");
    replaceUrl(`/c/${roomId}`);
  }

  async function handleTogglePinRoom(room: FeedbackRoomSummary) {
    try {
      if (room.pinned) {
        await unpinFeedbackRoom(room.roomId);
      } else {
        await pinFeedbackRoom(room.roomId);
      }
      await refreshRoomLists();
    } catch (error) {
      toast.error(resolveErrorMessage(error, "고정 상태 변경에 실패했습니다."));
    }
  }

  function handleWorkoutHistoryClick() {
    mainViewRef.current = "workoutHistory";
    setMainView("workoutHistory");
    setLoadingRoomId(null);
    if (window.location.pathname !== WORKOUT_DASHBOARD_PATH) {
      replaceUrl(WORKOUT_DASHBOARD_PATH);
    }
    if (window.innerWidth < SIDEBAR_BREAKPOINT) {
      setSidebarOpen(false);
    }
  }

  async function handleRenameRoom(room: FeedbackRoomSummary, title: string) {
    try {
      await renameFeedbackRoom(room.roomId, title);
      await refreshRoomLists();
    } catch (error) {
      toast.error(resolveErrorMessage(error, "제목 수정에 실패했습니다."));
    }
  }

  function handleDeleteRoom(room: FeedbackRoomSummary) {
    setDeleteTargetRoom(room);
  }

  async function confirmDeleteRoom() {
    if (!deleteTargetRoom) return;

    try {
      await deleteFeedbackRoom(deleteTargetRoom.roomId);
      await refreshRoomLists();
      if (deleteTargetRoom.roomId === activeRoomId) {
        handleNewChat();
      }
      setDeleteTargetRoom(null);
    } catch (error) {
      toast.error(resolveErrorMessage(error, "채팅 삭제에 실패했습니다."));
    }
  }

  useEffect(() => {
    const mediaQuery = window.matchMedia(
      `(min-width: ${SIDEBAR_BREAKPOINT}px)`,
    );

    const syncSidebarWithViewport = () => {
      setSidebarOpen(mediaQuery.matches);
    };

    syncSidebarWithViewport();
    mediaQuery.addEventListener("change", syncSidebarWithViewport);

    return () => {
      mediaQuery.removeEventListener("change", syncSidebarWithViewport);
    };
  }, []);

  function findWorkoutForMessage(message: FeedbackMessage) {
    if (message.workoutId === null) return undefined;

    return roomWorkouts.find((workout) => {
      return (
        workout.workoutId === message.workoutId &&
        workout.workOutType === message.workOutType
      );
    });
  }

  const workoutRenderPlan = persistedMessages.reduce<{
    messageIds: number[];
    latestSignature: string | null;
  }>(
    (plan, message) => {
      if (message.role !== "USER") return plan;

      const workout = findWorkoutForMessage(message);
      if (!workout) return plan;

      const signature = workoutSignature(workout);
      if (signature === plan.latestSignature) {
        return plan;
      }

      return {
        messageIds: [...plan.messageIds, message.messageId],
        latestSignature: signature,
      };
    },
    { messageIds: [], latestSignature: null },
  );
  const shouldShowDemo =
    authChecked &&
    !user &&
    !activeRoomId &&
    persistedMessages.length === 0 &&
    activeFeedbackText.length === 0;
  const shouldShowGreeting =
    !activeRoomId &&
    persistedMessages.length === 0 &&
    activeFeedbackText.length === 0;
  const demoWorkoutPreview =
    draftWorkout ?? buildFeedbackRequest(workOutType, tier, workoutForm);
  const shouldShowDraftWorkout =
    draftWorkout !== null &&
    loadingRoomId === null &&
    !shouldShowDemo &&
    workoutSignature(draftWorkout) !== workoutRenderPlan.latestSignature;
  const lastMessageDate = persistedMessages.reduce<Date | null>(
    (latest, message) => parseMessageDate(message) ?? latest,
    null,
  );
  const nowForDraft = new Date();
  const hasPendingMessageContent =
    shouldShowDraftWorkout ||
    activeFeedbackText.length > 0 ||
    activeGeneratingFeedback;
  const shouldShowDraftTimestamp =
    loadingRoomId === null &&
    hasPendingMessageContent &&
    lastMessageDate !== null &&
    nowForDraft.getTime() - lastMessageDate.getTime() >= MESSAGE_TIME_GAP_MS;
  const workoutInputStatus =
    draftWorkout !== null ||
    !missingRequiredWorkoutFields(
      buildFeedbackRequest(workOutType, tier, workoutForm),
    )
      ? "complete"
      : hasAnyWorkoutInput(workoutForm, draftWorkout)
        ? "partial"
        : "empty";

  return (
    <div className="flex h-dvh overflow-hidden bg-surface font-sans text-on-background antialiased">
      <Sidebar
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        user={user}
        onLoginClick={() => openAuthDialog("login")}
        onLogoutClick={handleLogout}
        onNewChatClick={handleNewChat}
        onWorkoutHistoryClick={handleWorkoutHistoryClick}
        pinnedRooms={pinnedRooms}
        recentRooms={recentRooms}
        activeRoomId={mainView === "chat" ? activeRoomId : undefined}
        workoutHistoryActive={mainView === "workoutHistory"}
        generatingRoomIds={generatingFeedbackRoomIds}
        completedRoomIds={completedFeedbackRoomIds}
        onRoomClick={handleRoomClick}
        onTogglePinRoom={handleTogglePinRoom}
        onRenameRoom={handleRenameRoom}
        onDeleteRoom={handleDeleteRoom}
      />

      <main className="relative flex h-full min-w-0 flex-1 flex-col">
        {!sidebarOpen ? (
          <button
            aria-label="사이드바 열기"
            className="apple-icon-button absolute left-4 top-4 z-50 flex items-center justify-center p-1.5 text-on-surface-variant"
            onClick={() => setSidebarOpen(true)}
            type="button"
          >
            <Icon name="dock_to_right" className="h-7 w-7" />
          </button>
        ) : null}

        <TopAuthActions
          user={user}
          onLoginClick={() => openAuthDialog("login")}
          onSignUpClick={() => openAuthDialog("signup")}
        />

        <div className="relative flex min-h-0 flex-1 bg-surface-container-lowest">
          {mainView === "workoutHistory" ? (
            <div
              className="chat-scroll flex-1 overflow-y-auto pt-14 md:pt-16"
              ref={workoutHistoryScrollRef}
            >
              <WorkoutHistoryDashboard
                onRequestFeedback={handleWorkoutHistoryFeedback}
              />
            </div>
          ) : (
            <div
              className="chat-scroll flex flex-1 flex-col gap-gutter overflow-y-auto p-margin-mobile pb-56 pt-20 md:p-margin-desktop md:pb-32 md:pt-20"
              onScroll={(event) => {
                const target = event.currentTarget;
                const distanceFromBottom =
                  target.scrollHeight - target.scrollTop - target.clientHeight;
                shouldAutoScrollRef.current =
                  distanceFromBottom < AUTO_SCROLL_BOTTOM_THRESHOLD;
              }}
              ref={chatScrollRef}
            >
              {loadingRoomId ? (
                <ChatRoomSkeleton />
              ) : (
                <>
                  {shouldShowGreeting ? (
                    <TimeSeparator date={emptyChatTimestamp} />
                  ) : null}
                  {shouldShowGreeting ? (
                    <ChatMessage
                      message={greetingText}
                      streaming={greetingStreaming}
                    />
                  ) : null}
                  {shouldShowDemo && demoStep >= 1 ? (
                    <div className="apple-demo-enter mx-auto flex w-full max-w-3xl justify-end">
                      <WorkoutVisualization
                        className="max-w-full sm:max-w-[92%]"
                        workout={demoWorkoutPreview}
                      />
                    </div>
                  ) : null}
                  {shouldShowDemo && demoStep >= 2 ? (
                    <div className="apple-demo-enter apple-demo-enter-delayed">
                      <FeedbackHtml
                        text={demoFeedbackStream}
                        streaming={demoStreaming}
                      />
                    </div>
                  ) : null}
                  {shouldShowDemo &&
                  demoStep >= 2 &&
                  !demoStreaming &&
                  demoFeedbackStream ? (
                    <DemoCtaCard
                      onStart={() => openAuthDialog("signup")}
                      ref={demoCtaRef}
                    />
                  ) : null}
                  {shouldShowDemo &&
                  demoStep >= 2 &&
                  !demoStreaming &&
                  demoFeedbackStream ? (
                    <div className="h-[45vh] shrink-0" aria-hidden="true" />
                  ) : null}
                  {persistedMessages.map((message, index) => {
                    const messageDate = parseMessageDate(message);
                    const previousMessageDate =
                      index > 0
                        ? parseMessageDate(persistedMessages[index - 1])
                        : null;
                    const showTimestamp = shouldShowTimeSeparator(
                      messageDate,
                      previousMessageDate,
                    );

                    if (message.role === "USER") {
                      const workout = findWorkoutForMessage(message);

                      return (
                        <div className="contents" key={message.messageId}>
                          {showTimestamp && messageDate ? (
                            <TimeSeparator date={messageDate} />
                          ) : null}
                          {workout &&
                          workoutRenderPlan.messageIds.includes(
                            message.messageId,
                          ) ? (
                            <div className="mx-auto flex w-full max-w-3xl justify-end">
                              <WorkoutVisualization
                                className="max-w-full sm:max-w-[92%]"
                                fitSamples={workout.samples}
                                workout={workout}
                              />
                            </div>
                          ) : null}
                        </div>
                      );
                    }

                    return (
                      <div className="contents" key={message.messageId}>
                        {showTimestamp && messageDate ? (
                          <TimeSeparator date={messageDate} />
                        ) : null}
                        <FeedbackHtml
                          text={message.content}
                          streaming={false}
                        />
                      </div>
                    );
                  })}
                  {shouldShowDraftTimestamp ? (
                    <TimeSeparator date={nowForDraft} />
                  ) : null}
                  {shouldShowDraftWorkout ? (
                    <div className="mx-auto flex w-full max-w-3xl justify-end">
                      <WorkoutVisualization
                        className="max-w-full sm:max-w-[92%]"
                        fitSamples={fitPreviewSamples}
                        workout={draftWorkout}
                      />
                    </div>
                  ) : null}
                  {activeGeneratingFeedback && !activeFeedbackText ? (
                    <GeneratingFeedbackIndicator />
                  ) : null}
                  {activeFeedbackText ? (
                    <FeedbackHtml
                      text={activeFeedbackText}
                      streaming={activeGeneratingFeedback}
                    />
                  ) : null}
                </>
              )}
              <div className="mx-auto flex w-full max-w-3xl gap-4" />
            </div>
          )}
        </div>

        {mainView === "chat" ? (
          <BottomActionBar
            tier={tier}
            onTierChange={handleTierChange}
            onWorkoutInputClick={() => {
              setWorkoutInputError("");
              setWorkoutInputOpen(true);
            }}
            onGenerateFeedback={handleGenerateFeedback}
            generating={activeGeneratingFeedback}
            hasWorkout={draftWorkout !== null}
            workoutInputStatus={workoutInputStatus}
          />
        ) : null}
      </main>

      {workoutInputOpen ? (
        <WorkoutInputDialog
          open={workoutInputOpen}
          workOutType={workOutType}
          tier={tier}
          form={workoutForm}
          onClose={() => setWorkoutInputOpen(false)}
          error={workoutInputError}
          onFormChange={handleWorkoutFormChange}
          onParsedWorkout={handleParsedWorkout}
          onWorkOutTypeChange={handleWorkOutTypeChange}
          onTierChange={handleTierChange}
          onReset={handleResetWorkoutInput}
          onSave={handleSaveWorkout}
        />
      ) : null}

      {authDialogOpen ? (
        <AuthDialog
          mode={authMode}
          onModeChange={setAuthMode}
          onClose={() => setAuthDialogOpen(false)}
          onAuthenticated={clearDemoStateForAuthenticatedUser}
        />
      ) : null}

      <ConsentModal
        open={termsAgreementRequired}
        items={termsAgreementItems}
        onClose={() => {
          toast.info("필수 약관에 동의해야 서비스를 계속 이용할 수 있습니다.");
        }}
        onConfirm={handleTermsAgreementConfirm}
        confirmLabel={termsAgreementSubmitting ? "저장 중..." : "동의하고 계속"}
        confirmDisabled={termsAgreementSubmitting}
      />

      {deleteTargetRoom ? (
        <DeleteRoomDialog
          room={deleteTargetRoom}
          onCancel={() => setDeleteTargetRoom(null)}
          onConfirm={confirmDeleteRoom}
        />
      ) : null}
    </div>
  );
}
