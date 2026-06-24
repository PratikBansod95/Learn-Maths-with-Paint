# Learn Maths with Paint — Project Roadmap

**Platform:** YouTube Playables (HTML5)  
**Stack:** TypeScript · Vite · Canvas 2D · DOM UI · Playables SDK  
**V1:** 5 levels · Addition & subtraction · Answers 0–50 · 3 lives  

**UI reference:** Approved mock (header, equation bar, canvas, palette, win/fail screens)  
**Spec:** [PRD.md](./PRD.md)

---

## Phase overview

| Phase | Name | Deliverable | Est. |
|-------|------|-------------|------|
| **1** | Foundation | Scaffold, SDK, loading, UI shell | 2 days |
| **2** | Canvas engine | Regions, hit-test, fill animation | 3–4 days |
| **3** | Game logic | Tasks, lives, add/sub, win/lose | 2 days |
| **4** | UI polish | Mock-aligned feedback, screens, audio hooks | 2–3 days |
| **5** | Content | 5 levels + validator script | 3–4 days |
| **6** | Playables compliance | Save/load, pause/resume, cert test suite | 2 days |
| **7** | QA & ship | Device QA, bundle analyzer, submit prep | 2–3 days |

**Total V1:** ~16–20 days

---

## Phase 1 — Foundation ✅ (in progress)

**Goal:** Runnable project that calls Playables SDK correctly and shows the game shell.

### Tasks
- [x] Vite + TypeScript project setup
- [x] Playables SDK in `index.html` (first script)
- [x] SDK wrapper (`firstFrameReady`, `gameReady`, `loadData`, `saveData`, pause/resume)
- [x] App state machine: `loading` → `title` → `playing`
- [x] UI layout per mock (header, equation, canvas area, palette)
- [x] CSS design tokens (kid-friendly colors, large tap targets)
- [x] Level types + demo `level_01.json` (placeholder regions)
- [x] README (dev + build commands)

### Exit criteria
- `npm run dev` runs locally
- Loading screen → Play button → game shell visible
- `gameReady()` fires when play screen is interactive
- No console errors in local dev

---

## Phase 2 — Canvas engine ✅

**Goal:** Tappable numbered regions that fill with color.

### Tasks
- [x] `PictureCanvas` class — load PNG/SVG + region polygons
- [x] Draw outline art + region number labels (dynamic font size)
- [x] Point-in-polygon hit testing (touch + mouse)
- [x] Fill animation (radial expand from centroid)
- [x] Wrong-tap red **X** overlay + shake on region
- [x] Responsive canvas scaling (fit width, maintain aspect ratio)
- [x] Coordinate transform (screen ↔ image space)
- [x] Hover highlight on unfilled regions
- [x] Pause-aware animation loop (Playables `onPause`)
- [x] Level 1 SVG line art (`public/assets/levels/level_01.svg`)

### Exit criteria
- [x] Demo level: tap region → animated fill with palette color
- [x] Numbers readable at mobile sizes
- [x] Works with touch + pointer events

---

## Phase 3 — Game logic ✅

**Goal:** Full math gameplay loop from PRD.

### Tasks
- [x] `GameController` — task index, lives, selected color, progress
- [x] Equation display (`10 + 12 = ?`, `20 - 8 = ?`)
- [x] Correct tap: advance task, update `n/total` progress
- [x] Wrong tap: −1 life, grey heart, “Oops!” banner
- [x] No color selected: hint toast, no life lost
- [x] Level win → stars (0/1–2/3 wrong taps rule)
- [x] Level fail → try again (reset level state)
- [x] Linear level progression 1 → 2 (more in Phase 5)
- [x] Build-time level validator (answers ≤ 50, sub valid, unique regions)
- [x] Save unlock + **Next level** on complete

### Exit criteria
- [x] Complete playable loop on `level_01` and `level_02` (add + sub)
- [x] Validator passes all shipped JSON files

---

## Phase 4 — UI polish

**Goal:** Match approved mock; feel kid-friendly.

### Tasks
- [x] Header: home button, hearts (full/empty), progress `n/total`
- [x] Equation row + color swatch + hint text
- [x] Palette selection ring + star indicator
- [x] Confetti on correct fill + level complete
- [x] Level complete screen (stars, mascot placeholder, NEXT LEVEL)
- [x] Level fail screen (sad mascot, TRY AGAIN)
- [x] First-session “How it works” overlay (4 steps)
- [x] Sound effects + SDK audio mute integration
- [x] Screen transitions (light CSS animations)

### Exit criteria
- Side-by-side with mock: same information hierarchy
- Audio respects mute when SDK disables audio

---

## Phase 5 — Content

**Goal:** 5 shippable levels with original kid-friendly art.

### Tasks
- [x] Level 1 — Sunny Cat (add, ≤ 20) — 4 tasks
- [x] Level 2 — Fruit Bowl (add, ≤ 30) — 4 tasks
- [x] Level 3 — Little Car (sub, ≤ 20) — 5 tasks
- [x] Level 4 — Tree & Birds (mix, ≤ 40) — 5 tasks
- [x] Level 5 — Toy Room (mix, ≤ 50) — 6 tasks
- [x] SVG line art per level (512², optimized)
- [x] Region polygons authored (manual JSON)
- [x] `npm run validate-levels` script

### Exit criteria
- All 5 levels playable start to finish
- Initial bundle < 15 MB
- No duplicate answer regions per level

---

## Phase 6 — Playables compliance

**Goal:** Pass SDK test suite before submission.

### Tasks
- [x] `loadData` on boot — restore `highestUnlockedLevel`, `levelStars`
- [x] `saveData` on level complete + `onPause`
- [x] `onPause` / `onResume` — stop rAF, audio, input
- [x] No Page Visibility API usage
- [x] Publisher name on title screen
- [ ] Run Playables SDK Test Suite locally (manual — see below)
- [x] Run bundle analyzer (file count, sizes)

### Test suite (manual)
1. `npm run dev` → note local URL (default `http://localhost:5173`)
2. Open [Playables SDK Test Suite](https://developers.google.com/youtube/gaming/playables/test_suite)
3. Enter game URL; verify `firstFrameReady`, `gameReady`, `loadData`, `saveData`, pause/resume, audio mute
4. Optional: apply CSP header override from [test suite guide](https://developers.google.com/youtube/gaming/playables/reference/test_suite_guide) in Chrome DevTools

### NPM scripts
- `npm run check-compliance` — no Page Visibility API; SDK load order
- `npm run analyze-bundle` — dist size report (< 30 MB)

### Exit criteria
- Test suite green locally
- Initial bundle < 30 MB compressed

---

## Phase 7 — QA & ship

**Goal:** Ready for YouTube Playables submission.

### Tasks
- [ ] Test YouTube Android app (WebView)
- [ ] Test YouTube iOS app
- [ ] Test desktop Chrome / Safari
- [ ] Fix touch edge cases (scroll, double-tap zoom disabled)
- [ ] Final art pass (replace placeholders)
- [ ] Build production zip
- [ ] Submit via Playables developer flow

### Exit criteria
- No reproducible crashes
- Load to interactive < 5 s on throttled 3G test

---

## Post-V1 (backlog)

| Item | Priority |
|------|----------|
| Hindi / regional language | Medium |
| Level select map | Low |
| Subtraction visual aids (crossing out) | Low |
| More levels (lazy-loaded pack 2) | Medium |
| Hint button (reveal correct region) | Low |
| Parent “math skills” summary | Low |

---

## Repository structure (target)

```
Learn Maths with Paint/
├── PRD.md
├── ROADMAP.md
├── README.md
├── index.html              # Playables SDK first
├── package.json
├── vite.config.ts
├── public/
│   └── assets/             # images, audio
├── levels/                 # level JSON
├── scripts/
│   └── validate-levels.ts
└── src/
    ├── main.ts
    ├── sdk/playables.ts
    ├── game/
    │   ├── GameController.ts
    │   ├── state.ts
    │   └── types.ts
    ├── canvas/PictureCanvas.ts
    ├── ui/
    │   ├── App.ts
    │   └── screens/
    └── styles/main.css
```

---

## Current status

| Phase | Status |
|-------|--------|
| 1 Foundation | 🟢 Complete |
| 2 Canvas engine | 🟢 Complete |
| 3 Game logic | 🟢 Complete |
| 4 UI polish | ⚪ Next |
| 5 Content | ⚪ Not started |
| 6 Compliance | ⚪ Not started |
| 7 QA & ship | ⚪ Not started |

**Current phase:** Phase 2 complete — next: Phase 3 (game logic refactor) + Phase 4 (UI polish).
