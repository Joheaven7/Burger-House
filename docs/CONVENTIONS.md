# Coding conventions

- TypeScript strict mode. No `any` unless commented with a reason.
- Components: `PascalCase.tsx`, one component per file, under ~200 lines.
- Hooks: `useThing.ts`. Utilities: `camelCase.ts`.
- UI components only display. Business logic lives in `features/*` and `lib/*`.
- API calls live in `services/*`. 3D code lives only in `components/3d/*`.
- Business data (names, prices, hours) is never written inside components.
- Money is an integer in minor units. Format only with `formatMoney`.
- All user-facing text comes from `messages/`.
- Colours and sizes come from design tokens in `app/globals.css`, not random hex values.
- Every screen handles loading, empty, error and success states.
- Never put secrets in frontend code. Only `NEXT_PUBLIC_*` variables reach the browser.
- Temporary mock data must be labelled `// TEMPORARY MOCK` and removed by Phase 7.

## Design system conventions

- **Palette tokens:** Use semantic names (`charcoal`, `cream`, `orange`, `copper`, `surface-dark`, `ink`, `muted`). Legacy aliases (`tomato`, `tomato-dark`, `mustard`) exist for backward compatibility — prefer the new names in new code.
- **Typography:** Three font families via CSS variables — `font-editorial` (Playfair Display) for luxury headings, `font-display` (Oswald) for uppercase display text, `font-body` (Inter) for UI text.
- **UI primitives:** Use `Badge`, `Card`, `SectionHeader`, `Button`, `Input`, `Container` from `components/ui/` before building new patterns.
- **Elevation:** Use `shadow-luxury` and `shadow-glow` tokens, not arbitrary shadow values.
- **Border radius:** Use `rounded-card` (1rem) and `rounded-control` (0.75rem) tokens.
- **Tone support:** Components with `tone` prop accept `"light"` or `"dark"` to adapt to background color. Default is light.
- **Public vs Admin:** The public storefront uses the full luxury palette. Admin components use the same tokens but with a more functional layout (dark sidebar, light content area).
- **Accessibility:** Global `:focus-visible` outline uses `--color-orange`. All interactive elements must be keyboard-navigable. `prefers-reduced-motion` is respected globally.