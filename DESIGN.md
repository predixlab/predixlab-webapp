# PredixLab Dashboard design system

This document records the Dashboard's implemented interface language and development constraints. See [README](./README.md) for product, startup, and deployment information. `src/index.css` and `src/components/ui/` are the source of truth for styling.

## Direction: a calmer research workspace

The Dashboard pairs a warm paper canvas with white reading surfaces, ink-colored type, and a forest-dark navigation rail. It shares the public site's typography and material palette without turning the analysis workspace into a marketing page. Blue identifies actions and selection; it is not used as a decorative wash over every section.

The redesign preserves the existing routes, API contracts, authentication, account entitlements, models, and business actions. Presentation can adapt to the device, but a mobile layout must not silently remove a filter, metric, or action.

Its priorities are:

1. **Fast scanning:** prices, percentages, dates, and signal states must be directly comparable in dense information.
2. **Stable semantics:** blue denotes action or selection; green and red denote market direction; warning colors express only caution or risk.
3. **Cross-device consistency:** desktop and mobile retain the same information hierarchy rather than hiding core information on narrow screens.
4. **Measured feedback:** motion only supports comprehension of state changes; loading, empty, and error states are explicit.

## Themes and design tokens

Colors, radii, shadows, type scales, and layering are defined in `src/index.css`. Use the same tokens for controls, page content, and charts:

- `:root` / `[data-theme="light"]`: default light theme;
- `[data-theme="dark"]`: dark theme;
- `@theme inline`: maps CSS variables to Tailwind utility classes.

Use semantic utilities such as `bg-surface`, `text-text-secondary`, `text-bull`, and `border-border`. Do not introduce unscoped color constants in product components.

| Semantic token | Typical use |
| --- | --- |
| `accent` | Primary actions, selection, focus |
| `bull` / `bear` | Up/down movement; bullish/bearish context |
| `warn` | Attention required, but not an error |
| `info` | Neutral information |
| `danger` | Destructive actions such as account deletion |

| Material | Light | Dark |
| --- | --- | --- |
| Canvas | `#f4f5f2` | `#111915` |
| Surface | `#ffffff` | `#19241e` |
| Primary text | `#24332b` | `#ecf1e9` |
| Action | `#465ed1` | `#526dde` |
| Sidebar | `#1c2b24` | `#101913` |

The sidebar has its own `--pl-nav-*` tokens; ordinary page text tokens must not be used on that dark material. Panels use 12px corners, larger dialogs 16-20px, and controls 8px. Borders and a very light surface shadow establish structure; avoid gradients, nested card stacks, and ornamental market graphics.

Charts, bars, and status dots use `*-vivid`; small text uses base semantic colors adjusted for text legibility. Color must not be the sole cue: directional values also retain a sign, icon, or text. AlphaRank's ranking bars are blue, not green: a relative score is not a market direction or probability of profit.

## Typography and data layout

Manrope is the display and body family, followed by system and CJK fallbacks. IBM Plex Mono is available for technical annotations. Both fonts are self-hosted in `public/fonts/` with their OFL licenses. Do not introduce Inter or external, render-blocking font stylesheets.

Working body text is 14px. Page titles are 24px on phones and 30px on larger screens. Labels and supporting data can be smaller, but long explanatory text must remain readable and must not be line-clamped merely to force a fixed-height card.

Use `.num` for comparable data such as prices, percentages, counts, and dates so digits are tabular. Right-align numbers in columns. Show missing data as `—`, never as fabricated zeroes.

`CandlestickChart` explicitly uses Manrope for canvas labels and semantic CSS colors. Its background, axes, and market markers track the selected theme.

## Application shell and responsiveness

`src/components/Layout.tsx` owns the global shell:

- At `lg` and above, branding lives in the dark 240px sidebar, which can collapse to an 80px icon rail. Both modes keep accessible navigation names.
- The 72px desktop top bar contains page context, a US Eastern market clock, theme, language, and account controls. The phone header is 60px, with branding and all account controls retained.
- Below `lg`, five persistent bottom destinations support one-handed navigation. The bar reserves the device's bottom safe-area inset instead of placing targets against the home indicator.
- The shell and overlays also reserve left and right safe-area insets in landscape.
- The main region is the page scroll container. Changing routes returns it to the top; dense desktop subregions may scroll independently.
- Sign-in, registration, and OAuth callbacks use a separate `AuthShell`, with the same typography, theme, language, form controls, and focus rules.
- Skip links and the document language follow the active interface language. The selected theme also updates the browser's theme-color metadata.

Place pages inside `<Page>` and begin with `<PageHeader>`. Settings content may use `width="narrow"`; data workspaces use the wide layout by default.

Wide tables need an explicit mobile strategy. Prefer `DataTable`'s `renderMobileRow` for labeled, stacked records. Preserve all relevant fields in that alternate representation, including secondary desktop columns. Intentionally horizontal tables stay inside their own scroll container; the page itself must not overflow.

Daily Signals pairs the AlphaRank and Pivot boards. Selecting a ticker opens its price chart directly in a right-side drawer at desktop widths (`lg` and above), not an embedded lower-right pane. On smaller screens, a sticky model switch and a chart bottom sheet preserve space for the list. Chart ranges and signal performance remain available in the inspector. Keep publication availability, counts, event direction, and date selection tied to real API data.

## Page composition

- Market Overview starts with sentiment and breadth, followed by distributions and market leadership. Native disclosures reveal the remaining 52-week rankings; phone tabs retain every mover category.
- The screener places saved screens before criteria and results. Desktop criteria scroll in their own panel; a sticky phone control opens the same criteria in a sheet. Collapsed groups retain their active-value summaries. Saving creates a named screen; it must not silently overwrite an existing one.
- Signal Performance keeps the ticker, model, chart range, summary, and history visibly connected. Mobile records retain signal prices, trend context, excursions, and timing rather than only headline returns.
- The three options views share `OptionsViewTabs`, preserving the selected symbol, existing URL parameters, and navigation focus across route changes. Gamma and volatility views place a compact `OptionsHighlights` selector before the current-symbol workbench, with a native signal filter. It scrolls naturally with the page and becomes a horizontal ticker rail on phones. Selecting a highlight does not move focus or jump to another section. Do not show an earlier symbol's analysis during a new selection.
- The ATM IV term-structure and smile/skew cards share desktop header, plot, and footer rows. Keep both plotting regions and outer cards aligned even when translations wrap or a series is unavailable; retain the skew comparison values in the footer.
- Authentication uses a two-column introduction and form on desktop, and a focused step-by-step form on phones. Verification uses one native numeric field for autofill, paste, selection, and corrections. Viewing the notice does not imply accepting it.
- Profile separates identity, email preferences, membership, referrals, and destructive actions. Billing sheets keep both plan actions reachable, use server-provided prices, and show an explicit unavailable state rather than inventing a fallback quote. Referral links support native selection, copy, and the existing share flow.

## Shared components

Import shared components from the `@/components/ui` barrel. Prefer:

- Structure: `Page`, `PageHeader`, `Panel`, `Card`;
- Data: `DataTable`, `StatTile`, `StatStrip`, `Change`, `Badge`;
- Actions and input: `Button`, `Field`, `Tabs`, `Dropdown`, `DatePickerModal`, `Modal`;
- Feedback: `Alert`, `EmptyState`, `Skeleton`, `Tooltip`.

Product pages must not reimplement buttons, fields, overlays, or table states. Avoid nested containers; use dividers, title rows, and whitespace for grouping.

`StatStrip` handles two-column mobile borders and complete desktop rows without dangling separators. `DataTable` exposes keyboard-operable sorting, a mobile sort control for stacked rows, and explicit detail actions for clickable records. `Tabs` supports arrow keys, Home, and End; selected tabs scroll into view without moving the entire page.

## Content and internationalization

- All user-visible copy goes through `react-i18next`; maintain both `src/i18n/locales/en.json` and `zh.json`.
- Buttons use a clear “verb + object.” Empty states explain what appears here and the next available action.
- Market direction, signal performance, and membership benefits avoid guaranteed language. The interface presents backend results and does not frame observations as investment advice.
- Use existing formatting utilities for dates, percentages, and amounts rather than creating page-specific formats.

## Interaction and accessibility

- Every interactive element covers default, hover, keyboard-focus, disabled, and loading states. Coarse-pointer controls have at least 44px targets; phone inputs use at least 16px text to prevent iOS focus zoom.
- The global `:focus-visible` outline is required. Menus support arrow-key navigation, Escape, and outside-click dismissal.
- Dialogs become bottom sheets on phones, with a visible dismiss button, bounded content scrolling, a fixed action footer, and safe-area padding. Focus remains inside the overlay and returns to its opener. Opening a sheet must not automatically summon the software keyboard.
- Tooltips wrap within the viewport and can be reached by keyboard focus; scroll and Escape dismiss them.
- Candlestick charts retain horizontal dragging and pinch zoom without consuming vertical page-scroll gestures.
- `src/index.css` provides a global `prefers-reduced-motion: reduce` fallback.
- Tables and charts require loading, empty, and error states; a blank area is not an error state.
- Destructive actions require explicit confirmation that describes the affected item.

## Pre-commit checks

```bash
npm run lint
npm run build
```

Also check manually:

1. light and dark themes in both interface languages;
2. 320px and 390px phones, 768px tablets, and 1440px desktops, including short landscape viewports and device safe areas;
3. keyboard navigation, visible focus, and overlay dismissal;
4. long copy, empty data, errors, and loading;
5. menus, tooltips, tables, and charts are not clipped by scrolling containers.
