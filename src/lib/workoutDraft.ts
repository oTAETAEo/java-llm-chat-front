import type { FeedbackRequest, FitSensorSample } from "@/lib/api";
import { emptyWorkoutForm, type WorkoutFormState } from "@/lib/workout";

export const WORKOUT_DRAFT_STORAGE_PREFIX = "workout-feedback-draft";

export type WorkoutDraftStorage = {
  workOutType: FeedbackRequest["workOutType"];
  tier: FeedbackRequest["tier"];
  workoutForm: WorkoutFormState;
  draftWorkout: FeedbackRequest | null;
  fitPreviewSamples: FitSensorSample[] | null;
};

export function workoutDraftStorageKey(roomId?: string) {
  return roomId
    ? `${WORKOUT_DRAFT_STORAGE_PREFIX}:room:${roomId}`
    : `${WORKOUT_DRAFT_STORAGE_PREFIX}:new`;
}

export function isEmptyWorkoutDraft(draft: Partial<WorkoutDraftStorage>) {
  const normalizedForm = { ...emptyWorkoutForm, ...draft.workoutForm };

  return (
    !draft.draftWorkout &&
    (!draft.workoutForm ||
      Object.entries(normalizedForm).every(
        ([name, value]) => name === "inputSource" || value.trim() === "",
      ))
  );
}
