"use client";

import { useEffect, useRef, useState } from "react";
import {
  uploadFitWorkout,
  type FeedbackRequest,
  type FitWorkoutPreview,
} from "@/lib/api";
import {
  commonWorkoutFields,
  cyclingWorkoutFields,
  runningWorkoutFields,
  type WorkoutFieldConfig,
  type WorkoutFormState,
} from "@/lib/workout";
import { Icon } from "@/components/common/Icon";

type SelectOption<T extends string> = {
  value: T;
  label: string;
  description?: string;
  icon?: string;
};

type DropdownPlacement = {
  direction: "up" | "down";
  maxHeight: number;
};

function useDropdownPlacement(
  open: boolean,
  rootRef: React.RefObject<HTMLDivElement | null>,
) {
  const [placement, setPlacement] = useState<DropdownPlacement>({
    direction: "down",
    maxHeight: 260,
  });

  useEffect(() => {
    if (!open) return;

    function updatePlacement() {
      const element = rootRef.current;
      if (!element) return;

      const rect = element.getBoundingClientRect();
      const viewportHeight = window.innerHeight;
      const margin = 16;
      const spaceBelow = viewportHeight - rect.bottom - margin;
      const spaceAbove = rect.top - margin;
      const direction =
        spaceBelow >= 220 || spaceBelow >= spaceAbove ? "down" : "up";
      const availableSpace = direction === "down" ? spaceBelow : spaceAbove;

      setPlacement({
        direction,
        maxHeight: Math.max(180, Math.min(320, availableSpace)),
      });
    }

    updatePlacement();
    window.addEventListener("resize", updatePlacement);
    window.addEventListener("scroll", updatePlacement, true);
    return () => {
      window.removeEventListener("resize", updatePlacement);
      window.removeEventListener("scroll", updatePlacement, true);
    };
  }, [open, rootRef]);

  return placement;
}

function AppleSelect<T extends string>({
  value,
  options,
  onChange,
  placeholder = "선택",
}: {
  value: T;
  options: SelectOption<T>[];
  onChange: (value: T) => void;
  placeholder?: string;
}) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement | null>(null);
  const placement = useDropdownPlacement(open, rootRef);
  const selected = options.find((option) => option.value === value);

  useEffect(() => {
    if (!open) return;

    function closeOnOutsideClick(event: MouseEvent) {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    }

    document.addEventListener("mousedown", closeOnOutsideClick);
    return () => document.removeEventListener("mousedown", closeOnOutsideClick);
  }, [open]);

  return (
    <div className="relative" ref={rootRef}>
      <button
        aria-expanded={open}
        className={`apple-text-input flex items-center justify-between gap-3 text-left text-[15px] transition ${
          open
            ? "border-[#0066cc] bg-white shadow-[0_0_0_4px_rgba(0,102,204,0.10)]"
            : ""
        }`}
        onClick={() => setOpen((current) => !current)}
        type="button"
      >
        <span className="flex min-w-0 items-center gap-2">
          {selected?.icon ? (
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#f5f5f7] text-[#0066cc]">
              <Icon name={selected.icon} className="h-4 w-4" />
            </span>
          ) : null}
          <span
            className={
              selected ? "truncate text-[#1d1d1f]" : "truncate text-[#7a7a7a]"
            }
          >
            {selected?.label ?? placeholder}
          </span>
        </span>
        <Icon
          name="keyboard_arrow_down"
          className={`h-4 w-4 shrink-0 text-[#7a7a7a] transition-transform ${open ? "rotate-180" : ""}`}
        />
      </button>

      {open ? (
        <div
          className={`absolute left-0 z-[130] w-full overflow-y-auto rounded-[18px] border border-black/10 bg-white p-1 shadow-[0_18px_60px_rgba(0,0,0,0.16)] ${
            placement.direction === "down"
              ? "top-full mt-2"
              : "bottom-full mb-2"
          }`}
          style={{ maxHeight: placement.maxHeight }}
        >
          {options.map((option) => {
            const selectedOption = option.value === value;

            return (
              <button
                className={`flex w-full items-center gap-3 rounded-[14px] px-3 py-3 text-left transition-colors ${
                  selectedOption
                    ? "bg-[#f0f6ff] text-[#0066cc]"
                    : "text-[#1d1d1f] hover:bg-[#f5f5f7]"
                }`}
                key={option.value}
                onClick={() => {
                  onChange(option.value);
                  setOpen(false);
                }}
                type="button"
              >
                {option.icon ? (
                  <span
                    className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${
                      selectedOption
                        ? "bg-white text-[#0066cc]"
                        : "bg-[#f5f5f7] text-[#6e6e73]"
                    }`}
                  >
                    <Icon name={option.icon} className="h-4.5 w-4.5" />
                  </span>
                ) : null}
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-semibold">
                    {option.label}
                  </span>
                  {option.description ? (
                    <span
                      className={`mt-0.5 block truncate text-xs ${selectedOption ? "text-[#4b7fd6]" : "text-[#7a7a7a]"}`}
                    >
                      {option.description}
                    </span>
                  ) : null}
                </span>
                {selectedOption ? (
                  <Icon name="check" className="h-4.5 w-4.5 shrink-0" />
                ) : null}
              </button>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}

function DurationPicker({
  form,
  onChange,
}: {
  form: WorkoutFormState;
  onChange: (name: keyof WorkoutFormState, value: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement | null>(null);
  const placement = useDropdownPlacement(open, rootRef);
  const hours = Array.from({ length: 13 }, (_, index) => String(index));
  const minutes = Array.from({ length: 12 }, (_, index) => String(index * 5));
  const selectedHours =
    form.movingTimeHours.trim() === "" ? "0" : form.movingTimeHours;
  const selectedMinutes =
    form.movingTimeMinutes.trim() === "" ? "0" : form.movingTimeMinutes;
  const label = `${selectedHours}시간 ${selectedMinutes}분`;

  useEffect(() => {
    if (!open) return;

    function closeOnOutsideClick(event: MouseEvent) {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    }

    function closeWithEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpen(false);
      }
    }

    document.addEventListener("mousedown", closeOnOutsideClick);
    document.addEventListener("keydown", closeWithEscape);
    return () => {
      document.removeEventListener("mousedown", closeOnOutsideClick);
      document.removeEventListener("keydown", closeWithEscape);
    };
  }, [open]);

  return (
    <div className="relative" ref={rootRef}>
      <button
        className="apple-text-input flex items-center justify-between text-left text-[15px]"
        onClick={() => setOpen((value) => !value)}
        type="button"
      >
        <span
          className={
            form.movingTimeHours || form.movingTimeMinutes
              ? "text-[#1d1d1f]"
              : "text-[#7a7a7a]"
          }
        >
          {form.movingTimeHours || form.movingTimeMinutes
            ? label
            : "시간과 분 선택"}
        </span>
        <Icon name="keyboard_arrow_down" className="h-4 w-4 text-[#7a7a7a]" />
      </button>
      <input
        className="sr-only"
        onChange={() => undefined}
        required
        tabIndex={-1}
        value={form.movingTimeHours || form.movingTimeMinutes ? "selected" : ""}
      />

      {open ? (
        <div
          className={`absolute left-0 z-[120] w-full overflow-hidden rounded-[18px] border border-black/10 bg-white shadow-[0_18px_60px_rgba(0,0,0,0.16)] ${
            placement.direction === "down"
              ? "top-full mt-2"
              : "bottom-full mb-2"
          }`}
        >
          <div
            className="grid grid-cols-2 divide-x divide-black/10 overflow-y-auto"
            style={{ maxHeight: Math.max(150, placement.maxHeight - 54) }}
          >
            <div>
              <div className="sticky top-0 bg-[#f5f5f7] px-4 py-2 text-xs font-semibold text-[#7a7a7a]">
                시간
              </div>
              <div className="py-1">
                {hours.map((hour) => (
                  <button
                    className={`flex w-full items-center justify-between px-4 py-2.5 text-left text-sm transition-colors hover:bg-[#f5f5f7] ${
                      selectedHours === hour
                        ? "font-semibold text-[#0066cc]"
                        : "text-[#1d1d1f]"
                    }`}
                    key={hour}
                    onClick={() => onChange("movingTimeHours", hour)}
                    type="button"
                  >
                    <span>{hour}시간</span>
                    {selectedHours === hour ? <span>✓</span> : null}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <div className="sticky top-0 bg-[#f5f5f7] px-4 py-2 text-xs font-semibold text-[#7a7a7a]">
                분
              </div>
              <div className="py-1">
                {minutes.map((minute) => (
                  <button
                    className={`flex w-full items-center justify-between px-4 py-2.5 text-left text-sm transition-colors hover:bg-[#f5f5f7] ${
                      selectedMinutes === minute
                        ? "font-semibold text-[#0066cc]"
                        : "text-[#1d1d1f]"
                    }`}
                    key={minute}
                    onClick={() => onChange("movingTimeMinutes", minute)}
                    type="button"
                  >
                    <span>{minute}분</span>
                    {selectedMinutes === minute ? <span>✓</span> : null}
                  </button>
                ))}
              </div>
            </div>
          </div>
          <div className="flex items-center justify-between border-t border-black/10 bg-[#fafafc] px-4 py-3">
            <button
              className="text-sm text-[#7a7a7a]"
              onClick={() => {
                onChange("movingTimeHours", "");
                onChange("movingTimeMinutes", "");
              }}
              type="button"
            >
              초기화
            </button>
            <button
              className="apple-primary-button min-h-9 px-4 text-sm"
              onClick={() => setOpen(false)}
              type="button"
            >
              완료
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function WorkoutFieldInput({
  field,
  value,
  form,
  onChange,
}: {
  field: WorkoutFieldConfig;
  value: string;
  form: WorkoutFormState;
  onChange: (name: keyof WorkoutFormState, value: string) => void;
}) {
  if (field.type === "duration") {
    return (
      <label className="apple-field-label min-w-0">
        <span>
          {field.label}
          <span className="ml-1 text-[#7a7a7a]">({field.unit})</span>
          <span className="ml-1 text-[#0066cc]">*</span>
        </span>
        <DurationPicker form={form} onChange={onChange} />
      </label>
    );
  }

  return (
    <label className="apple-field-label min-w-0">
      <span>
        {field.label}
        {field.unit ? (
          <span className="ml-1 text-[#7a7a7a]">({field.unit})</span>
        ) : null}
        {field.required ? <span className="ml-1 text-[#0066cc]">*</span> : null}
      </span>
      <input
        className="apple-text-input min-w-0 text-[15px]"
        min={field.type === "datetime-local" ? undefined : "0"}
        onChange={(event) => onChange(field.name, event.target.value)}
        required={field.required}
        step="any"
        type={field.type ?? "number"}
        value={value}
      />
    </label>
  );
}

export function WorkoutInputDialog({
  open,
  workOutType,
  tier,
  form,
  onClose,
  onFormChange,
  onParsedWorkout,
  onWorkOutTypeChange,
  onTierChange,
  onReset,
  onSave,
  error,
}: {
  open: boolean;
  workOutType: FeedbackRequest["workOutType"];
  tier: FeedbackRequest["tier"];
  form: WorkoutFormState;
  onClose: () => void;
  onFormChange: (name: keyof WorkoutFormState, value: string) => void;
  onParsedWorkout: (workout: FitWorkoutPreview) => void;
  onWorkOutTypeChange: (workOutType: FeedbackRequest["workOutType"]) => void;
  onTierChange: (tier: FeedbackRequest["tier"]) => void;
  onReset: () => void;
  onSave: () => void;
  error?: string;
}) {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [fitUploadOpen, setFitUploadOpen] = useState(false);
  const [fitUploading, setFitUploading] = useState(false);
  const [fitUploadError, setFitUploadError] = useState("");
  const [fitUploadStatus, setFitUploadStatus] = useState("");
  const fitUploadButtonLabel = fitUploading
    ? "업로드 중"
    : fitUploadStatus
      ? "불러옴"
      : fitUploadOpen
        ? "닫기"
        : "FIT 업로드";

  useEffect(() => {
    if (!fitUploadStatus) return;

    const timerId = window.setTimeout(() => {
      setFitUploadStatus("");
    }, 1000);

    return () => window.clearTimeout(timerId);
  }, [fitUploadStatus]);

  const workoutTypeOptions: SelectOption<FeedbackRequest["workOutType"]>[] = [
    {
      value: "RUNNING",
      label: "러닝",
      description: "페이스, 케이던스, 걸음 수 중심",
      icon: "fitness_center",
    },
    {
      value: "CYCLING",
      label: "자전거",
      description: "속도, 파워, FTP 중심",
      icon: "cycling",
    },
  ];
  const tierOptions: SelectOption<FeedbackRequest["tier"]>[] = [
    {
      value: "AMATEUR",
      label: "아마추어",
      description: "취미·일반 운동 기준",
      icon: "user",
    },
    {
      value: "PRO",
      label: "프로",
      description: "경쟁·고강도 훈련 기준",
      icon: "award",
    },
  ];

  async function handleFitFile(file: File | undefined) {
    if (!file || fitUploading) return;
    setFitUploadError("");
    setFitUploadStatus("");

    if (!file.name.toLowerCase().endsWith(".fit")) {
      setFitUploadError("FIT 파일만 업로드할 수 있습니다.");
      return;
    }

    setFitUploading(true);
    try {
      const parsedWorkout = await uploadFitWorkout(file, tier);
      onParsedWorkout(parsedWorkout);
      setFitUploadStatus("FIT 파일에서 운동 데이터를 불러왔습니다.");
      setFitUploadOpen(false);
    } catch (uploadError) {
      setFitUploadError(
        uploadError instanceof Error
          ? uploadError.message
          : "FIT 파일을 불러오지 못했습니다.",
      );
    } finally {
      setFitUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center bg-black/20 px-4 py-8 backdrop-blur-sm">
      <form
        className="apple-form-panel flex max-h-[88vh] w-full max-w-3xl flex-col overflow-hidden"
        onSubmit={(event) => {
          event.preventDefault();
          onSave();
        }}
      >
        <div className="flex items-start justify-between gap-4 border-b border-black/10 p-6">
          <div>
            <h2 className="mt-1 text-3xl font-semibold tracking-[-0.374px] text-[#1d1d1f]">
              운동 데이터 입력
            </h2>
            <p className="mt-2 text-sm leading-5 text-[#7a7a7a]">
              운동 타입을 선택하면 필요한 전용 지표가 자동으로 바뀝니다. 필수
              입력만 먼저 채워도 피드백을 요청할 수 있습니다.
            </p>
          </div>
          <button
            aria-label="닫기"
            className="apple-icon-button flex items-center justify-center"
            onClick={onClose}
            type="button"
          >
            <Icon name="x" />
          </button>
        </div>

        <div className="chat-scroll overflow-y-auto p-6">
          {error ? (
            <div className="mb-5 rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm leading-6 text-red-700">
              {error}
            </div>
          ) : null}

          <section className="mb-6">
            <div className="flex flex-col gap-3 rounded-[18px] border border-black/10 bg-white/70 p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.75)] sm:flex-row sm:items-center sm:justify-between">
              <div className="min-w-0">
                <div className="flex items-center gap-2 text-sm font-semibold text-[#1d1d1f]">
                  <Icon name="upload_file" className="h-4.5 w-4.5 text-[#0066cc]" />
                  FIT 파일로 자동 입력
                </div>
                <p className="mt-1 text-xs leading-5 text-[#7a7a7a]">
                  기기에서 내보낸 .fit 기록을 읽어 아래 입력값을 채웁니다.
                </p>
              </div>
              <button
                className={`apple-secondary-pill inline-flex shrink-0 items-center gap-2 px-4 transition ${
                  fitUploadStatus
                    ? "border-[#b8e2c8] bg-[#f0fff5] text-[#087b36]"
                    : ""
                }`}
                disabled={fitUploading}
                onClick={() => {
                  if (fitUploading) return;
                  setFitUploadOpen((current) => !current);
                  setFitUploadError("");
                  setFitUploadStatus("");
                }}
                type="button"
              >
                {fitUploading ? (
                  <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-current border-t-transparent" />
                ) : fitUploadStatus ? (
                  <Icon name="check" className="h-4 w-4" />
                ) : (
                  <Icon name="upload_file" className="h-4 w-4" />
                )}
                {fitUploadButtonLabel}
              </button>
            </div>

            {fitUploadOpen ? (
              <div
                className={`mt-3 flex min-h-32 cursor-pointer flex-col items-center justify-center rounded-[18px] border border-dashed p-5 text-center transition ${
                  fitUploading
                    ? "border-[#0066cc]/40 bg-[#f0f6ff]"
                    : "border-black/20 bg-[#f5f5f7] hover:border-[#0066cc]/50 hover:bg-[#f0f6ff]"
                }`}
                onClick={() => fileInputRef.current?.click()}
                onDragOver={(event) => {
                  event.preventDefault();
                }}
                onDrop={(event) => {
                  event.preventDefault();
                  void handleFitFile(event.dataTransfer.files.item(0) ?? undefined);
                }}
                role="button"
                tabIndex={0}
                onKeyDown={(event) => {
                  if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault();
                    fileInputRef.current?.click();
                  }
                }}
              >
                <input
                  accept=".fit"
                  className="hidden"
                  disabled={fitUploading}
                  onChange={(event) =>
                    void handleFitFile(event.target.files?.item(0) ?? undefined)
                  }
                  ref={fileInputRef}
                  type="file"
                />
                <span className="flex h-11 w-11 items-center justify-center rounded-full bg-white text-[#0066cc] ring-1 ring-black/10">
                  {fitUploading ? (
                    <span className="h-5 w-5 animate-spin rounded-full border-2 border-current border-t-transparent" />
                  ) : (
                    <Icon name="upload_file" className="h-5 w-5" />
                  )}
                </span>
                <div className="mt-3 text-sm font-semibold text-[#1d1d1f]">
                  {fitUploading ? "FIT 파일을 읽는 중입니다" : "파일을 선택하거나 여기에 놓기"}
                </div>
                <div className="mt-1 text-xs text-[#7a7a7a]">최대 10MB</div>
              </div>
            ) : null}

            {fitUploadError ? (
              <div className="mt-3 rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm leading-6 text-red-700">
                {fitUploadError}
              </div>
            ) : null}
          </section>

          <section className="mb-6">
            <label className="apple-field-label">
              <span className="flex items-center justify-between gap-3">
                <span>운동 제목</span>
                {form.inputSource === "FIT_FILE" ? (
                  <span className="shrink-0 rounded-full bg-[#f0f6ff] px-2.5 py-1 text-[11px] font-semibold text-[#0066cc] ring-1 ring-[#0066cc]/15">
                    FIT 파일
                  </span>
                ) : null}
              </span>
              <input
                className="apple-text-input min-w-0 text-[15px]"
                maxLength={80}
                onChange={(event) => onFormChange("title", event.target.value)}
                placeholder="비워두면 운동 정보로 자동 생성됩니다."
                type="text"
                value={form.title}
              />
            </label>
          </section>

          <section className="mb-8 grid gap-4 md:grid-cols-2">
            <label className="apple-field-label">
              운동 타입 <span className="sr-only">필수</span>
              <AppleSelect
                options={workoutTypeOptions}
                onChange={onWorkOutTypeChange}
                value={workOutType}
              />
            </label>
            <label className="apple-field-label">
              선수 등급 <span className="sr-only">필수</span>
              <AppleSelect
                options={tierOptions}
                onChange={onTierChange}
                value={tier}
              />
            </label>
          </section>

          <section className="mb-8">
            <div className="mb-4 flex items-end justify-between gap-3">
              <div>
                <h3 className="text-xl font-semibold tracking-[-0.224px] text-[#1d1d1f]">
                  공통 지표
                </h3>
                <p className="mt-1 text-sm text-[#7a7a7a]">
                  모든 운동 타입에 포함되는 필드입니다.
                </p>
              </div>
              <span className="text-xs text-[#0066cc]">* 필수</span>
            </div>
            <div className="flex flex-col gap-4">
              <div className="grid gap-4 lg:grid-cols-3">
                {commonWorkoutFields.slice(0, 3).map((field) => (
                  <WorkoutFieldInput
                    field={field}
                    form={form}
                    key={field.name}
                    onChange={onFormChange}
                    value={form[field.name]}
                  />
                ))}
              </div>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {commonWorkoutFields.slice(3).map((field) => (
                  <WorkoutFieldInput
                    field={field}
                    form={form}
                    key={field.name}
                    onChange={onFormChange}
                    value={form[field.name]}
                  />
                ))}
              </div>
            </div>
          </section>

          <section className="rounded-[18px] bg-[#f5f5f7] p-5">
            <div className="mb-4 flex items-end justify-between gap-3">
              <div>
                <h3 className="text-xl font-semibold tracking-[-0.224px] text-[#1d1d1f]">
                  {workOutType === "CYCLING"
                    ? "자전거 선택 입력"
                    : "러닝 선택 입력"}
                </h3>
                <p className="mt-1 text-sm text-[#7a7a7a]">
                  {workOutType === "CYCLING"
                    ? "속도, 파워, FTP처럼 자전거 피드백을 더 정확하게 만드는 선택 지표입니다."
                    : "페이스와 걸음 수처럼 러닝 피드백을 더 정확하게 만드는 선택 지표입니다."}
                </p>
              </div>
              <span className="shrink-0 rounded-full bg-white px-3 py-1 text-xs text-[#7a7a7a] ring-1 ring-black/10">
                선택 입력
              </span>
            </div>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {(workOutType === "CYCLING"
                ? cyclingWorkoutFields
                : runningWorkoutFields
              ).map((field) => (
                <WorkoutFieldInput
                  field={field}
                  form={form}
                  key={field.name}
                  onChange={onFormChange}
                  value={form[field.name]}
                />
              ))}
            </div>
          </section>
        </div>

        <div className="flex items-center justify-between gap-4 border-t border-black/10 p-6">
          <p className="min-w-0 flex-1 truncate text-sm text-[#7a7a7a]">
            필수 입력 저장 후 피드백 생성 버튼으로 AI 코칭을 받을 수 있습니다.
          </p>
          <div className="flex shrink-0 gap-2">
            <button
              className="apple-secondary-pill whitespace-nowrap px-5 text-[#c43d2f]"
              onClick={onReset}
              type="button"
            >
              초기화
            </button>
            <button
              className="apple-secondary-pill whitespace-nowrap px-5"
              onClick={onClose}
              type="button"
            >
              취소
            </button>
            <button
              className="apple-primary-button whitespace-nowrap px-5"
              type="submit"
            >
              운동 저장
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
