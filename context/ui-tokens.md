# UI Tokens

Design tokens for Fitty. All colors, typography, spacing, and component values extracted from the delivered design. Use these exact values throughout the codebase — never hardcode colors or use raw Tailwind color classes in components.

## How to Use

This project uses **Tailwind CSS v4** (via NativeWind). All design tokens are defined using the `@theme` directive in the global css file. No `tailwind.config.ts` needed for colors or tokens.

Tailwind v4 automatically generates utility classes from `@theme` variables:

- `--color-primary-warm` -> `bg-primary-warm`, `text-primary-warm`, `border-primary-warm`
- `--color-surface` -> `bg-surface`, `text-surface`, `border-surface`

```tsx
// Correct — uses generated utility classes
className="bg-surface text-text-primary border-border"

// Never — hardcoded hex values
className="bg-[#F6F7FB] text-[#1A303F]"

// Never — raw Tailwind color classes
className="bg-purple-500 text-gray-600"
```

## global.css — Complete Token Definition

```css
@import "tailwindcss";

@theme {
  /* Font */
  --font-sans: "Inter", sans-serif;

  /* Page and surface backgrounds */
  --color-background: #ffffff;
  --color-surface: #f8fafc;
  --color-surface-secondary: #f1f5f9;
  --color-surface-tertiary: #e2e8f0;

  /* Borders */
  --color-border: #e2e8f0;
  --color-border-light: #f1f5f9;
  --color-border-muted: #cbd5e1;

  /* Text */
  --color-text-primary: #1A303F; /* Dark Navy - Logo */
  --color-text-secondary: #475569;
  --color-text-muted: #94a3b8;
  --color-text-inverse: #ffffff;

  /* Primary accent — Warm Yellow/Orange (Logo) */
  --color-primary-warm: #FDCA6E;
  --color-primary-warm-dark: #e5b052;
  --color-primary-warm-light: #fde8c2;
  --color-primary-warm-foreground: #1A303F;

  /* Primary accent — Teal (Logo) */
  --color-primary-cool: #74B7B5;
  --color-primary-cool-dark: #589694;
  --color-primary-cool-light: #b3dcdb;
  --color-primary-cool-foreground: #ffffff;

  /* Secondary accent — Light Teal (Logo) */
  --color-secondary-cool: #9CD4CE;
  --color-secondary-cool-dark: #7abeb8;
  
  /* Semantic - Success (Green) */
  --color-success: #10b981;
  --color-success-dark: #059669;
  --color-success-light: #d1fae5;
  --color-success-foreground: #ffffff;

  /* Semantic - Error (Red) */
  --color-error: #ef4444;
  --color-error-dark: #b91c1c;
  --color-error-light: #fee2e2;
  --color-error-foreground: #ffffff;

  /* Semantic - Warning (Orange) */
  --color-warning: #f59e0b;
  --color-warning-dark: #b45309;
  --color-warning-light: #fef3c7;
  --color-warning-foreground: #ffffff;

  /* Dark overlays */
  --color-overlay: #1A303Fcc;
}
```
