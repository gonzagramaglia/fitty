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
- **Pagination Dots:** Dynamic dot sizes based on active index (`w-6 bg-primary-cool` vs `w-2 bg-primary-cool-light`).

### Login View / Action Buttons
**File:** `app/(auth)/login.tsx`
**Description:** Primary authentication actions with icons and loading states.
**Key Patterns:**
- **Primary Button (Guest):** `bg-primary-warm py-4 rounded-xl flex-row justify-center items-center`
- **Secondary Button (OAuth):** `bg-background border border-border py-4 rounded-xl flex-row justify-center items-center shadow-sm`
- **Loading State:** Apply `opacity-50` and `disabled={true}` to buttons when loading.
- **Icons:** Use `lucide-react-native` where possible for consistency.

### Custom Bottom Tab Bar
**File:** `components/ui/CustomTabBar.tsx`
**Description:** App-wide bottom navigation with a prominent floating action button for the camera.
**Key Patterns:**
- **Container Layout:** `flex-row bg-background border-t border-border pb-6 pt-3 px-4 items-center justify-between`
- **Floating Action Button (FAB):** Use negative margin (`-mt-8`) on the inner `View` instead of absolute positioning. This prevents flexbox height collapse issues on web.
- **FAB Styling:** `bg-primary-cool w-16 h-16 rounded-full border-[6px] border-background`.
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
**Description:** Standard data entry forms.
**Key Patterns:**
- **Container Stack:** Use `space-y-6` for vertical spacing between fields.
- **Labels:** `text-text-primary font-bold mb-2`.
- **Text Inputs:** `bg-background border rounded-2xl px-4 py-4 text-text-primary text-base`.
- **Error States:** Swap `border-border` to `border-error` dynamically, and show error text below `text-error text-sm mt-1`.
- **Placeholders:** Use `placeholderTextColor="#94a3b8"`.

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
