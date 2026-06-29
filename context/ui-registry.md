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
- **Icons:** Use `@expo/vector-icons` (`Ionicons`) with explicit margin right (`mr-3`, `style={{ marginRight: 12 }}`).
