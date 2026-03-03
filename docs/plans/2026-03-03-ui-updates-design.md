# Data Visualizer UI Updates Design

**Date**: 2026-03-03
**Scope**: Dark/light mode, i18n (EN + PT-BR), login page redesign

## 1. Dark/Light Mode

**Dependency**: `next-themes`

- Wrap `_app.tsx` with `<ThemeProvider attribute="class" defaultTheme="system" enableSystem>`
- Consolidate two conflicting `globals.css` files into `src/styles/globals.css` (the one imported by `_app.tsx`). Merge CSS variable theme + glassmorphism utilities from `app/globals.css` into it.
- New `src/components/ui/theme-toggle.tsx` — Sun/Moon button using `lucide-react` icons and `useTheme()` hook
- Place toggle in Dashboard header (near logout) and on Login page (top-right corner)
- Behavior: auto-detect OS preference → user toggle → persist in `localStorage`
- Existing `dark:` Tailwind classes activate automatically via the `.dark` class on `<html>`

## 2. i18n — EN + PT-BR

**Dependency**: `next-intl`

### File structure
```
src/
  messages/
    en.json
    pt-BR.json
  i18n/
    config.ts
```

### Integration
- Configure `NextIntlClientProvider` in `_app.tsx`
- Detect browser locale via `navigator.language`, default to `en`, store in `localStorage`
- Replace all hardcoded strings with `useTranslations()` hook calls
- New `src/components/ui/locale-switcher.tsx` — small dropdown with BR/US flags
- Place switcher in Dashboard header and Login page (next to theme toggle)
- Update `_document.tsx` `lang` attribute dynamically

### Translation scope (~150-200 keys)
- Login: title, labels, errors, button
- Dashboard: tab names, table headers, dialog titles/labels, action buttons
- TTN page: chart labels, stats, device info
- Common: save, cancel, delete, confirm, loading, error messages

## 3. Login Page Redesign

**Dependency**: `framer-motion`

### Visual design
- Animated gradient mesh background: 3-4 color blobs shifting via CSS `@keyframes`, theme-aware colors
- Glassmorphic card: `backdrop-blur-xl`, `bg-white/70`, `shadow-2xl`, `rounded-2xl`
- Card entrance: Framer Motion fade + slide up (spring, 0.5s)
- Staggered form elements: each field delays 0.1s after the previous
- Replace raw HTML inputs with shadcn `Input` and `Label` components
- Input focus: ring glow animation via Tailwind `ring` + `transition`
- Submit button: loading spinner, `whileTap` scale-down
- Error display: `AnimatePresence` for animate in/out
- Branding: lucide icon above "IoT Dashboard" title
- Theme + locale toggles in top-right corner

## Architecture

```
_app.tsx
  └─ ThemeProvider (next-themes)
     └─ NextIntlClientProvider (next-intl)
        └─ Pages
           ├─ Login (framer-motion, shadcn inputs, toggles)
           └─ Dashboard
              ├─ Header (theme toggle + locale switcher + logout)
              └─ Tabs...
```

No changes to API integration, routing, or data flow. All changes are UI/presentation layer.

## Dependencies to install
- `next-themes`
- `next-intl`
- `framer-motion`
