# Plan: Instagram Story Highlights Journey Integration (Gallery & Footer)

## Overview & Goal
Integrate an interactive, high-end "View Entire Journey" entry point to the creator's Instagram Story Highlight (`https://www.instagram.com/stories/highlights/18103155317053800/`) across two key high-impact surfaces of the DIY Party Box website:
1. **Build Photos & Videos Carousel / Gallery Header (`FocusSpeakerCarousel.tsx`)**: Positioned cleanly in the top header action strip next to the navigation controls and modal close button, styled with DualBeast's dark workbench theme and a subtle Instagram-accented hover glow.
2. **Website Closing Footer (`SocialFanShowcaseSection.tsx`)**: Prominently surfaced in the `EXPLORE` quick-nav menu as `"Build Journey (Stories)"` and in the `CONNECT` list as `"Story Highlights ↗"` with an Instagram icon.

---

## Architectural Mapping & Source of Truth

```
                               ┌──────────────────────────────────────────────────────────┐
                               │       src/kinetic/socialFanEngine.ts                     │
                               │  export const INSTAGRAM_JOURNEY_HIGHLIGHT_URL = '...'    │
                               └────────────────────────────┬─────────────────────────────┘
                                                            │
                            ┌───────────────────────────────┴──────────────────────────────┐
                            ▼                                                              ▼
 ┌──────────────────────────────────────────────────┐   ┌──────────────────────────────────────────────────┐
 │  src/components/FocusSpeakerCarousel.tsx         │   │  src/components/SocialFanShowcaseSection.tsx     │
 │  - Top header action bar                         │   │  - Footer "EXPLORE" navigation list              │
 │  - "View Entire Journey ↗" pill button           │   │  - Footer "CONNECT" external links               │
 │  - Instagram icon mark + cobalt/neon hover glow  │   │  - Seamless keyboard focus & accessible links    │
 └──────────────────────────────────────────────────┘   └──────────────────────────────────────────────────┘
```

---

## Detailed Task Breakdown

### Phase 1: Central Constant Configuration
- **File:** `src/kinetic/socialFanEngine.ts`
- **Actions:**
  - Export `INSTAGRAM_JOURNEY_HIGHLIGHT_URL = 'https://www.instagram.com/stories/highlights/18103155317053800/';`
  - Ensure single-source-of-truth export alongside `SOCIAL_ACCOUNT_LINKS`.

### Phase 2: Build Photos & Videos Carousel Header Integration
- **File:** `src/components/FocusSpeakerCarousel.tsx`
- **Actions:**
  - Import `INSTAGRAM_JOURNEY_HIGHLIGHT_URL` and Instagram icon / `ArrowUpRight` from `lucide-react`.
  - Add an accessible `<a>` element in the top header action bar (`<header className="...">` -> controls `div`).
  - **Position:** Right before or adjacent to `<div className="flex items-center gap-1">` (`<` and `>` buttons) and `[Close]`.
  - **Styling:**
    - Dark tech aesthetic: `px-3 py-1.5 rounded-md border border-zinc-800 bg-zinc-900/90 text-xs font-mono text-zinc-200`.
    - Interactive hover: `hover:bg-zinc-800 hover:border-[#DD2A7B]/50 hover:text-white hover:shadow-[0_0_20px_rgba(221,42,123,0.25)] transition-all`.
    - Content: Compact Instagram gradient icon, text `"View Entire Journey"`, and `ArrowUpRight` icon.
    - Responsive: Full text on screens $\ge 640\text{px}$, responsive short label or icon-focused pill on mobile (`max-sm:text-[11px]`).
    - Attributes: `target="_blank"`, `rel="noopener noreferrer"`, `data-testid="carousel-view-journey-btn"`, `aria-label="View entire build journey on Instagram Stories"`.

### Phase 3: Footer Navigation & Connect Integration
- **File:** `src/components/SocialFanShowcaseSection.tsx`
- **Actions:**
  - In `Footer Quick Navigation` (`EXPLORE` list):
    - Add `{ label: 'Build Journey (Stories)', href: INSTAGRAM_JOURNEY_HIGHLIGHT_URL, isExternal: true, testId: 'footer-nav-journey' }`.
    - Render external links with `target="_blank" rel="noopener noreferrer"` and an external arrow indicator.
  - In `CONNECT` list:
    - Add `{ label: 'Story Highlights', href: INSTAGRAM_JOURNEY_HIGHLIGHT_URL, testId: 'footer-social-stories' }` alongside Instagram profile, GitHub, LinkedIn, and Buy Me a Coffee.
  - Retain full keyboard navigation accessibility (`tabIndex={footerInteractive ? 0 : -1}`).

### Phase 4: Automated Testing & Verification
- **Files:**
  - `src/kinetic/socialFanEngine.test.ts`
  - `src/kinetic/focusCarouselEngine.test.ts`
- **Actions:**
  - Add unit tests verifying `INSTAGRAM_JOURNEY_HIGHLIGHT_URL` format and accessibility.
  - Run build & typecheck via `npm run build` or `bun run build`.
  - Run test suite via `npm test` or `bun test`.

---

## Agent Assignments

| Agent Role | Responsibility |
|------------|----------------|
| `frontend-specialist` | UI styling, responsive alignment, and theme preservation in `FocusSpeakerCarousel.tsx` and `SocialFanShowcaseSection.tsx`. |
| `backend-specialist` / `orchestrator` | URL constant extraction and test suite validation. |

---

## Verification & QA Checklist

- [x] **Visual Hierarchy:** "View Entire Journey" button in carousel header sits cleanly adjacent to `< >` navigation and `[Close]` buttons across both mobile ($\le 375\text{px}$) and desktop ($1440\text{px}$).
- [x] **Theme Adherence:** Button matches the obsidian `#0B0D10` workbench surface, with zinc borders and subtle Instagram magenta hover glow (`hover:border-[#DD2A7B]/60 hover:shadow-[0_0_18px_rgba(221,42,123,0.25)]`).
- [x] **Target & Security:** All links feature `target="_blank"` and `rel="noopener noreferrer"`.
- [x] **Correct URL:** Destination verified as `https://www.instagram.com/stories/highlights/18103155317053800/`.
- [x] **Footer Presence:** Visible and interactive in both `EXPLORE` (`Build Journey (Stories)`) and `CONNECT` (`Story Highlights ↗`) columns.
- [x] **Tests:** All 71 unit tests passed; `vite build` completed with zero errors.
