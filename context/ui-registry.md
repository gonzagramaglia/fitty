# UI Registry

Living document. Updated after every component is built (via the `/imprint` skill). Read this before building any new component — match existing patterns exactly before inventing new ones.

## How to Use

Before building any component:
1. Check if a similar component already exists here.
2. If yes — match its exact classes and structure.
3. If no — build it following `ui-rules.md` and `ui-tokens.md`, then add it here.

After building any component — update this file with the component name, file path, and exact classes used.

## Components

### Onboarding Carousel
**File:** `app/(auth)/login.tsx`
**Description:** Full-screen horizontal paging view using `FlatList`.
**Key Patterns:**
- **Container:** `flex-1 bg-background` with dynamic padding from `useSafeAreaInsets()`.
- **FlatList Web Fix:** Items must use `flexShrink: 0` and explicit `width` to prevent overlapping on Web. Use `getItemLayout` for predictable pagination.
- **Pagination Dots:** Dynamic dot sizes based on active index (`w-6 bg-primary-cool` vs `w-2 bg-primary-cool-light`). Centered with `justify-center` and `mb-9` spacing.
- **Navigation:** Single centered "Next" / "Get Started" button (`bg-primary-warm py-3 px-8 rounded-xl`). No skip button.

### Login View / Action Buttons
**File:** `app/(auth)/login.tsx`
**Description:** Primary authentication actions with icons and loading states.
**Key Patterns:**
- **Primary Button (Guest):** `bg-primary-warm py-4 rounded-xl flex-row justify-center items-center`
- **Secondary Button (OAuth):** `bg-background border border-border py-4 rounded-xl flex-row justify-center items-center shadow-sm`
- **Loading State:** Apply `opacity-50` and `disabled={true}` to buttons when loading.
- **Icons:** Use `@expo/vector-icons` (Ionicons) for brand icons, `lucide-react-native` for UI icons.
- **Google OAuth:** Bypasses Terms modal, calls `handleGoogleLogin()` directly.
- **Guest Mode:** Opens Terms modal first, then proceeds on accept.

### Terms & Privacy Modal
**File:** `app/(auth)/login.tsx` (inline absolute overlay)
**Description:** Full-screen overlay presenting Terms of Service and Privacy Policy.
**Key Patterns:**
- **Container:** Absolute overlay `position: absolute, top: 0, bottom: 0, zIndex: 100, backgroundColor: '#ffffff'`.
- **Header:** Centered title with bottom border.
- **Content:** `ScrollView` with themed headings and body text.
- **Action Buttons:** Flex-row with `Decline` (flex: 1, `bg-surface-tertiary`) and `Purrfect, I Accept` (flex: 2, `bg-primary-cool`).
- **Button Position:** `pb-[84px]` to push buttons up from the bottom edge.

### Custom Bottom Tab Bar
**File:** `components/ui/CustomTabBar.tsx`
**Description:** App-wide bottom navigation with a prominent floating action button for the camera.
**Key Patterns:**
- **Container Layout:** `flex-row bg-background border-t border-border pb-6 pt-3 px-4 items-center justify-between`
- **Floating Action Button (FAB):** Use negative margin (`-mt-8`) on the inner `View` instead of absolute positioning. This prevents flexbox height collapse issues on web.
- **FAB Styling:** `bg-[#FDE047] w-16 h-16 rounded-full border-[6px] border-background shadow-sm`.
- **FAB Disabled State:** Use inline `style={{ opacity: 0.5, backgroundColor: '#D1D5DB' }}` and `disabled` prop when no cat exists.
- **Active State (Lucide Icons):** Emulate active/filled states by increasing stroke thickness (`strokeWidth={2.5}`) and changing color, instead of swapping to a different icon.

### Horizontal Selectors / Pills
**File:** `app/(tabs)/profile.tsx`
**Description:** Horizontal list of selectable items (e.g., Cat Selector).
**Key Patterns:**
- **Container:** `<ScrollView horizontal showsHorizontalScrollIndicator={false} className="flex-row mb-8">`
- **Active Pill:** Solid background (`bg-text-primary border-text-primary`) and text (`text-white`).
- **Inactive Pill:** Outline style (`bg-background border-border`).
- **Pill Avatars (Web Fix):** Always use explicit inline sizes (`style={{ width: 24, height: 24 }}`) on inner images inside flex containers to prevent them from scaling to original intrinsic resolution on web.

### Form Inputs & Validation
**File:** `app/(tabs)/profile.tsx`
**Description:** Standard data entry forms with input filtering and max lengths.
**Key Patterns:**
- **Container Stack:** Use `space-y-6` or `mb-5` for vertical spacing between fields.
- **Labels:** `text-text-primary font-bold mb-2`.
- **Text Inputs:** `bg-background border rounded-2xl px-4 py-4 text-text-primary text-base`.
- **Error States:** Swap `border-border` to `border-error` dynamically. For grouped rows, show error below the row spanning full width: `text-error text-sm mt-2`.
- **Placeholders:** Use `placeholderTextColor="#94a3b8"`.
- **Input Filtering:** Strip numbers from text fields (`text.replace(/[0-9]/g, '')`), strip text from numeric fields (`text.replace(/[^0-9]/g, '')`).
- **Max Lengths:** Use `maxLength` prop (owner name: 11, cat name/breed: 30, age: 2 digits, weight: XX.XX format).
- **Weight Format:** Allow single dot, max 2 digits before and after, auto-prepend `0` if starts with `.`, trim trailing `.` on blur.

### Save / Submit Buttons
**File:** `app/(tabs)/profile.tsx`
**Description:** Bottom action buttons for forms.
**Key Patterns:**
- **Valid/Complete State:** `bg-primary-cool` with white text.
- **Invalid/Disabled State:** `bg-surface-tertiary` with `text-slate-400`.
- **Layout:** `flex-row items-center justify-center py-4 rounded-2xl`.

### Split Screen Dark Header Layout
**File:** `app/(tabs)/index.tsx`, `app/(tabs)/profile.tsx`
**Description:** Screens with a dark upper header and white lower body.
**Key Patterns:**
- **Header Container:** `bg-[#1A2530] rounded-b-[2.5rem] px-6 pb-6 mb-6`.
- **Top Padding:** Use dynamic insets: `style={{ paddingTop: Platform.OS === 'web' ? 72 : Math.max(insets.top + 16, 60) }}`.
- **Text:** Section titles should be `text-white/60 text-xs font-bold uppercase tracking-widest mb-3`.

### Absolute Overlay Editable Text Pattern
**File:** `app/(tabs)/profile.tsx`
**Description:** In-line editable text that switches from `Text` to `TextInput` without any layout shifts or sibling element jumping.
**Key Patterns:**
- **Visible Placeholder:** Render the static `Text` normally to drive the flex layout, and toggle `opacity-0` when editing.
- **Input Overlay:** Render the `TextInput` with `absolute left-0 right-0 height-100%` directly over the static text when editing.
- **Web Fallback:** Apply `style={{ outlineStyle: 'none' }}` to `TextInput` on web to prevent the default focus ring.

### Glassmorphism Overlays

**File:** `app/camera/index.tsx`
**Description:** Frosted glass text bubbles overlaying the camera feed.
**Key Patterns:**
- **Container:** `bg-[#1A2530]/80 rounded-3xl px-6 py-4 backdrop-blur-xl border border-white/10 shadow-lg`.
- **Text Hierarchy:** Smaller uppercase tracking text (`text-[#74B7B5] text-xs font-bold tracking-[0.2em] uppercase mb-1`) above larger descriptive text (`text-white text-center text-base font-medium`).

### Loading Progress Screens

**File:** `app/camera/processing.tsx`, `app/camera/index.tsx` (UploadingView)
**Description:** Full-screen loading states with simulated progress and rotating contextual text.
**Key Patterns:**
- **Layout:** Centered content with a light background (`bg-[#F8FAFC]`) and dark text.
- **Progress Bar:** `Animated.View` inside an overflow-hidden container (`bg-[#E2E8F0] rounded-full`). Uses `progressAnim.interpolate` mapping `0-100` to `0%-100%` width.
- **Rotating Status:** `setInterval` updating an index of an array of strings, displaying in a card (`bg-white border border-[#E2E8F0] px-6 py-4 rounded-2xl`).

### Implicit State Routing (Expo Router)

**File:** `app/camera/_layout.tsx`, `app/camera/index.tsx`
**Description:** Passing transient state (like what context was added) between screens without polluting the URL with query parameters.
**Key Patterns:**
- **Provider:** Create a `CameraContext` in the `_layout.tsx` to hold state.
- **Write:** Set the state immediately before calling `router.push('/target')`.
- **Read:** Use the context hook in the destination screen to read the clean state.

### BCS Gauge
**File:** `components/ui/BCSGauge.tsx`
**Description:** Visual horizontal indicator mapping a 1-9 score to underweight, ideal, or overweight.
**Key Patterns:**
- **Dynamic Backgrounds:** Uses `bg-primary-cool`, `bg-success`, `bg-warning`, and `bg-error` based on the score threshold.
- **Gauge Track:** Parent container uses `h-2 w-full bg-border rounded-full overflow-hidden relative` while the inner fill is `absolute top-0 bottom-0 left-0 rounded-full`.
- **Labeling:** Text aligned using `flex-row justify-between items-end` for the score and `flex-row justify-between` for min/max labels below.

### Trend Chart Container
**File:** `components/ui/TrendChart.tsx`
**Description:** Wrapper card for the line chart visualizing score history.
**Key Patterns:**
- **Container:** Standard card pattern `bg-background border border-border rounded-2xl p-6 shadow-sm`.
- **Empty State:** Re-uses the exact same container padding and styling but centers a fallback text `text-text-muted text-sm` using `items-center justify-center`.
- **Chart Theme:** Transparent background mapped to the view, styling lines and grid using the predefined token colors instead of raw hexes.

### History Row Card
**File:** `components/ui/HistoryCard.tsx`
**Description:** Interactive row summarizing a past health check.
**Key Patterns:**
- **Container:** Touchable card `bg-background border border-border rounded-2xl p-4 flex-row items-center shadow-sm mb-3`.
- **Thumbnail:** Left-aligned `w-12 h-12 rounded-xl bg-surface-secondary mr-4`. Fallback uses `items-center justify-center` for text.
- **Action Indicator:** Right chevron using `ChevronRight color="#cbd5e1"` (matches border-muted token).

### Contextual AI Chat Modal
**File:** `components/ui/ChatModal.tsx`
**Description:** Sliding bottom sheet modal containing a back-and-forth chat interface with Vet AI.
**Key Patterns:**
- **Modal Container:** Full screen overlay with `bg-black/50` wrapper and a bottom-anchored content pane `bg-background w-full h-[80%] rounded-t-3xl overflow-hidden`.
- **Message Bubbles (User):** Right-aligned using `justify-end`. Background `bg-primary-cool` with `rounded-tr-sm` to indicate the tail.
- **Message Bubbles (AI):** Left-aligned using `justify-start`. Background `bg-white border border-border` with `rounded-tl-sm`. Uses `flex-row` with an avatar on the left.
- **Input Area:** Sticky footer `p-4 border-t border-border bg-white flex-row items-center`.
- **Inline Actions:** Edit and Delete icons in `flex-row items-center mr-2 opacity-50`.
- **Edit State:** Edited message gets `opacity-60` and shows `✏️ Editing...` indicator.
- **Edit Constraints:** One edit per session (`hasEdited` state), send disabled until text changes from original.
- **Guest Mode:** Simulated script with `handleMockInputTap` for auto-typing questions. Chat history persisted to Supabase.
- **Web Rendering:** Uses absolute positioned `View` instead of `Modal` on web.

### Toast Notifications
**File:** `app/_layout.tsx` (GlobalToast)
**Description:** App-wide toast notifications with auto-dismiss and tap-to-close.
**Key Patterns:**
- **Container:** Absolute positioned, centered, `top: 48`, `zIndex: 99999`.
- **Card:** `bg-[#1A2530] rounded-2xl shadow-lg border border-warning/30 w-[92%] max-w-[340px]`.
- **Icon:** Warning circle `bg-warning/20 w-10 h-10 rounded-full`.
- **Progress Bar:** Animated width from 100% → 0% over `TOAST_DURATION` (2500ms). `h-[3px] bg-[#74B7B5]`.
- **Dismiss:** Tap anywhere on toast to dismiss (both persistent and auto-dismiss).
- **Persistent Toasts:** Show `X` icon on right, no progress bar.

### Guest Limit Modal
**File:** `components/ui/GuestLimitModal.tsx`
**Description:** Modal shown when a guest user tries to exceed Judge Mode limits.
**Key Patterns:**
- **Overlay:** `bg-black/60 items-center justify-center px-6`.
- **Card:** `bg-surface w-full max-w-[340px] rounded-3xl p-6 items-center shadow-xl`.
- **Custom Message:** Accepts optional `message` prop for contextual explanations.

### Skeleton Loading
**File:** `components/ui/Skeleton.tsx`
**Description:** Placeholder shimmer components for loading states.
**Key Patterns:**
- **Props:** `width`, `height`, `borderRadius`, `className` for custom styling.
- **Usage:** Replace content sections 1:1 with matching sized skeletons in loading states.
- **Dark Header Skeletons:** Use `bg-white/10` or `bg-white/20` class overrides.

### BCS Info Card
**File:** `components/ui/BCSInfoCard.tsx`
**Description:** Educational card explaining the BCS scale, shown on the dashboard.
**Key Patterns:**
- **Container:** Standard card with border and rounded corners.
- **Content:** Informational text about the 1-9 BCS scoring system.

### AI Reasoning Card
**File:** `components/ui/AIReasoningCard.tsx`
**Description:** Card displaying Claude's analysis reasoning text.
**Key Patterns:**
- **Container:** Card pattern with icon header (Brain icon).
- **Text:** Preserves line breaks from AI output.

### Recommendations List
**File:** `components/ui/RecommendationsList.tsx`
**Description:** Structured list of actionable recommendations from AI analysis.
**Key Patterns:**
- **Items:** Each recommendation has a `title` (bold) and `description` (regular).
- **Layout:** Vertical stack with consistent spacing.

### Owner's Notes Card
**File:** `components/ui/HistoryDetailView.tsx` (inline)
**Description:** Card displaying text notes and audio player for a health check.
**Key Patterns:**
- **Header:** Icon + title row with `pb-2` spacing below.
- **Quote Style:** Text note with left border accent (`w-[3px] bg-[#74B7B5]/40 rounded-full`).
- **Audio Player:** Conditional touchable with play/stop states, duration display.
- **Spacing:** `mb-6` below the card for separation from next section.
