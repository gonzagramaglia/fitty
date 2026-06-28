# UI Rules

Concise rules for building Fitty UI. Design assets are available — use them as the source of truth for visual decisions. These rules cover the most important patterns and constraints to keep the UI consistent without over-specifying every detail.

## Font

Always import `Inter` via `@expo-google-fonts/inter` in the root layout.

```typescript
import { useFonts, Inter_400Regular, Inter_500Medium, Inter_600SemiBold, Inter_700Bold } from '@expo-google-fonts/inter';
```

Never use standard system fonts as the primary font if `Inter` is available. Apply font families via NativeWind classes (e.g., `font-sans`, `font-semibold`).

## Layout & Spacing

- **Safe Area:** Always wrap the main screens in `<SafeAreaView>` or use `useSafeAreaInsets()`.
- **Screen Padding:** Standard horizontal padding for all main screens is `px-6` (24px).
- **Flexbox:** Everything in React Native uses Flexbox. Avoid absolute positioning unless necessary.
- **Gaps:** Gap between page sections is usually `gap-6` (24px).

## Bottom Navigation (Navbar)

Four nav items: Dashboard, Camera, History, Profile.

- **Active item:** `text-primary-cool`, font-weight 500
- **Inactive item:** `text-text-muted`, font-weight 500
- **Indicator:** Active state is color change only — no underlines.
- **Container:** Navbar always uses a solid `bg-background` (white) spanning the full viewport width.

## Cards

Every content section lives in a card.

```text
/* Tailwind equivalent classes */
background: bg-background (pure white)
border: border border-border
border-radius: rounded-2xl (16px)
padding: p-6 (24px)
box-shadow: shadow-sm
```

**Never use colored card backgrounds** — always white. Color goes inside cards via badges, progress bars, and text, never on the card surface itself.

## Typography Hierarchy

Three levels used consistently throughout the app:

**Section headings** — card titles, page section titles
```text
font-size: text-base (16px)
font-weight: font-semibold (600)
color: text-text-primary
```

**Body / primary content text**
```text
font-size: text-sm (14px)
font-weight: font-medium (500)
color: text-text-primary
```

**Secondary / muted text** — labels, timestamps, subtitles
```text
font-size: text-xs (12px)
font-weight: font-normal (400)
color: text-text-muted
```

*Note: Stat numbers on dashboard use 30px / weight 600 / color `text-text-primary`.*

## Badges

All badges use `rounded-full` (pill shape) unless specified otherwise.

```text
padding: px-2 py-0.5
font-size: text-xs (12px)
font-weight: font-medium (500)
```

Trend badges on stat cards use `rounded-sm` (4px radius, not pill) with `bg-success-light` background and `text-success-dark` text.

## Buttons

All interactive elements must use `<TouchableOpacity>` or `<Pressable>` for visual feedback. Minimum height for touchable elements is 48px on mobile for accessibility.

**Primary button:**
```text
background: bg-primary-warm
color: text-primary-warm-foreground
border-radius: rounded-xl (12px)
padding: py-3 px-4
font-size: text-sm (14px)
font-weight: font-medium (500)
```

**Secondary button:**
```text
background: bg-background (white)
border: border border-border
color: text-text-primary
border-radius: rounded-xl (12px)
padding: py-3 px-4
```

## Form Inputs

```text
background: bg-background (white)
border: border border-border
border-radius: rounded-xl (12px)
padding: py-3 px-4
font-size: text-sm (14px)
color: text-text-primary
placeholder color: text-text-muted
focus: border-primary-warm (ring-1 equivalent in React Native)
```

## Lists (Recent History)

- **No alternating row colors** — white rows only, separated by border or gap.
- **Row separator:** `border-b border-border` between rows (if not using bento cards).
- **Section headers:** uppercase, `text-xs`, `font-medium`, `text-text-secondary`.
- **Row text:** `text-sm`, `text-text-primary`.
- **Pressed state:** `<Pressable>` or `<TouchableHighlight>` with `underlayColor` set to `bg-surface-secondary`.

## Progress / Gauges (BCS Score)

Inline progress bars or score gauges.

```text
height: h-1.5 (6px) or h-2 (8px)
border-radius: rounded-full
background track: bg-border
```

**Fill color by BCS Score:**
- **Ideal (Score 4-5):** `bg-success` (Green)
- **Underweight (Score 1-3):** `bg-primary-cool` (Teal)
- **Overweight (Score 6-9):** `bg-warning` (Orange) or `bg-error` (Red)

## Empty States

Every section that can be empty must have an empty state (e.g., no health history, incomplete profile). Keep it minimal:

- Short descriptive text in `text-text-muted`.
- Optional icon above the text (use Fitty accent colors for the icon).
- CTA button below if there's a logical next action (e.g., "Start Health Check").
