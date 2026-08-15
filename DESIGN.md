# Design

## Source of truth
- Status: Active
- Last refreshed: 2026-07-29
- Primary product surfaces: Workout AI Coach chat screen, collapsible sidebar, fixed bottom action bar, mobile bottom navigation.
- Evidence reviewed:
  - `DESIGN-apple.md` Apple-style design analysis and component tokens.
  - User-provided chat UI HTML reference.
  - `src/app/page.tsx`, `src/app/layout.tsx`, `src/app/globals.css`.
  - Backend API client in `src/lib/api.ts`.

## Brand
- Personality: calm, focused, premium, coach-like.
- Trust signals: restrained chrome, clear primary action, explicit AI/medical caution copy.
- Avoid: decorative gradients, heavy button shadows, multiple accent colors, cluttered dashboard density.

## Product goals
- Goals: provide a chat-first workout feedback interface that can connect to the Java LLM backend.
- Non-goals: full analytics dashboard, medical diagnosis UX, complex multi-route product shell in the initial screen.
- Success signals: workout input, feedback generation, tier selection, and chat context are visually obvious.

## Personas and jobs
- Primary personas: amateur runners/cyclists, exercise learners, developers testing the workout feedback backend.
- User jobs: input workout data, request AI feedback, review history, understand current coaching context.
- Key contexts of use: desktop development first, responsive browser/mobile preview second.

## Information architecture
- Primary navigation: collapsible left sidebar on desktop, fixed bottom nav on mobile.
- Core routes/screens: `/` chat home; future Coach/Progress routes can reuse the same Apple-style control grammar.
- Content hierarchy: sidebar history → chat timeline → frosted bottom action bar.

## Design principles
- Principle 1: Preserve the current chat layout; apply Apple styling first to interactive controls.
- Principle 2: Use a single Action Blue for click targets.
- Tradeoffs: current screen remains a chat app, not a full Apple product-tile page; Apple guidance is adapted at component level.

## Visual language
- Color: Action Blue `#0066cc`, focus blue `#0071e3`, Apple parchment `#f5f5f7`, ink `#1d1d1f`, pearl `#fafafc`.
- Typography: system Apple stack (`SF Pro Text`, `SF Pro Display`, `system-ui`, `-apple-system`) with 17px button copy and subtle negative tracking.
- Spacing/layout rhythm: 44px minimum touch targets; pill CTAs use 11px × 22px padding.
- Shape/radius/elevation: full pill for primary/secondary actions; subtle hairline borders; no button shadows.
- Motion: active press state uses `transform: scale(0.95)`.
- Imagery/iconography: inline SVG icons; no external icon font dependency.

## Components
- Existing components to reuse: `Sidebar`, `SidebarButton`, `BottomActionBar`, `TierDropdown`, `MobileNav`, `Icon` in `src/app/page.tsx`.
- New/changed components: Apple-style CSS utility classes in `src/app/globals.css`:
  - `.apple-primary-button`
  - `.apple-secondary-pill`
  - `.apple-pearl-capsule`
  - `.apple-icon-button`
  - `.apple-frosted-bar`
- Variants and states: hover color change, focus-visible blue outline, active scale press, selected tier ring.
- Token/component ownership: Apple component classes live in `globals.css`; screen composition remains in `page.tsx`.

## Accessibility
- Target standard: WCAG AA directionally.
- Keyboard/focus behavior: buttons preserve semantic `button` elements and visible `focus-visible` outlines.
- Contrast/readability: primary CTA uses white on Action Blue; secondary uses Action Blue on white.
- Screen-reader semantics: icon-only buttons include `aria-label`.
- Reduced motion and sensory considerations: transitions are short; future work can add reduced-motion media query if needed.

## Responsive behavior
- Supported breakpoints/devices: desktop and mobile browser widths.
- Layout adaptations: sidebar closes below 1024px; bottom CTA text is `whitespace-nowrap` with responsive spacing.
- Touch/hover differences: touch targets are at least 44px for primary bottom controls.

## Interaction states
- Loading: future feedback generation should disable CTA and stream response into chat.
- Empty: initial AI greeting is the empty-state anchor.
- Error: future API errors should render as chat/system bubbles.
- Success: generated feedback should appear in the chat timeline.
- Disabled: future workout validation should disable `피드백 생성` until required inputs exist.
- Offline/slow network, if applicable: future SSE retry/timeout state required.

## Content voice
- Tone: friendly Korean fitness coach, concise and non-medical.
- Terminology: 운동 입력, 피드백 생성, 운동 기록, 아마추어/프로.
- Microcopy rules: keep AI medical caveat visible and concise.

## Implementation constraints
- Framework/styling system: Next.js App Router, React, TypeScript, Tailwind CSS v4 plus small global CSS component classes.
- Design-token constraints: do not introduce a second accent color for interactive controls.
- Performance constraints: no external icon font; inline SVG icons are local.
- Compatibility constraints: backend runs separately, default API base URL is `http://localhost:8080`.
- Test/screenshot expectations: run `npm run lint` and `npm run build` after UI changes.

## Open questions
- [ ] Exact workout input form/modal UX / owner: frontend / impact: primary flow completion.
- [ ] Backend enum mapping for athlete tiers / owner: backend / impact: payload correctness.
- [ ] Whether chat history is persisted by backend or local state / owner: full stack / impact: sidebar content.

## Workout input dialog
- Trigger: bottom `운동 입력` button.
- Placement: centered modal over chat with Apple-style white panel, 28px radius, subtle hairline border, blurred backdrop.
- Field coverage: mirrors backend `FeedbackRequest` completely: `workOutType`, `tier`, common workout fields, and the selected workout type's dedicated fields.
- Required first-pass fields: `startedAt`, `endedAt`, `distance`, `movingTime`; remaining fields are presented to users as 선택 입력.
- Feedback generation: if required fields are missing, reopen the workout dialog and show an inline chat error.

- Sport-specific inputs: the modal shows either 자전거 선택 입력 or 러닝 선택 입력 based on the selected 운동 타입, not both at once.
- User-facing copy: avoid developer-facing terms such as `null`; use 필수 입력 and 선택 입력 instead.

- Label mapping: backend `movingTime` maps to user-facing `활동 시간` and is entered through a custom 시/분 duration picker.

## Workout summary visualization
- Trigger: after the user saves workout input, replace plain text summary with a visual card in the chat timeline.
- Primary visualization: use three Apple-style semi-gauge cards for distance, activity time, and speed/pace. For running, pace is shown as `분:초/km`; for cycling, speed is shown as `km/h`.
- Detail visualization: show every non-empty optional metric as compact glass pills, grouped under the primary gauges, so user-provided fields are not hidden.
- Visual language: use the existing Apple frosted/glass treatment, subtle radial color, hairline borders, and no heavy dashboard chrome.
- Data behavior: hide unavailable optional metrics instead of showing developer-facing `null`; compute average speed from distance/time when explicit speed is absent.
