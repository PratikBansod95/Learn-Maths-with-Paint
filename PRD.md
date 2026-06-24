# Product Requirements Document (PRD)

## Learn Maths with Paint — YouTube Playable (V1)

| Field | Value |
|-------|-------|
| **Product name** | Learn Maths with Paint |
| **Version** | 1.0 (MVP Playable) |
| **Platform** | YouTube Playables (HTML5) |
| **Target audience** | Children up to 3rd standard (~ages 6–9) |
| **Document status** | Approved — implementation in progress |
| **Date** | June 23, 2026 |

---

## 1. Executive summary

Learn Maths with Paint is a short-session educational playable embedded in YouTube. Children see a simple sketch divided into numbered sections. Each section displays a **number** (e.g. 22, 43), not a color index. Below the picture, math problems appear (addition and subtraction). The child selects the **color** tied to the current equation, then taps the section showing the **correct answer**. Correct taps fill that region with color; wrong taps cost one life. The player starts with **3 lives** per level.

V1 ships as a certifiable YouTube Playable: web-based, touch-first, no backend, 5 levels, addition and subtraction with all **numeric results in the range 0–50**.

---

## 2. Goals & success criteria

### 2.1 Product goals

- Help young children practice **addition and subtraction** in a playful, visual way.
- Keep sessions **under 2 minutes per level** (suitable for YouTube feed / Playables).
- Meet **YouTube Playables technical certification** requirements on first submission where possible.

### 2.2 Success criteria (V1)

| Metric | Target |
|--------|--------|
| Initial bundle size | < 15 MB (hard limit 30 MB before `gameReady`) |
| Time to interactive | < 5 seconds on average mobile connection |
| Levels shipped | 5 complete levels |
| Math coverage | Addition + subtraction; every **answer** ∈ [0, 50] |
| Certification | Pass Playables SDK test suite locally before submit |
| Child usability | Readable without reading long instructions (visual + 1-line hint) |

### 2.3 Non-goals (V1)

- Multiplication, division, fractions
- User accounts, leaderboards, multiplayer
- Backend / analytics servers (beyond Playables SDK save)
- Hindi or other locales (English only in V1)
- Branded characters (e.g. Doraemon) — original kid-friendly art only
- Android/iOS native apps

---

## 3. Target users

### 3.1 Primary user

- **Child:** Std 1–3, learning single- and double-digit add/subtract with results ≤ 50.
- **Context:** Casual play on parent’s phone/tablet inside YouTube app.

### 3.2 Secondary user

- **Parent / teacher:** Wants safe, short, educational content without ads inside gameplay (YouTube handles outer platform).

### 3.3 Assumptions

- Child can recognize numbers 0–50.
- Child understands “tap the matching number” after one guided hint.
- Play is **touch-only** (no keyboard required).

---

## 4. Platform & technical constraints

### 4.1 YouTube Playables requirements

| Requirement | Implementation |
|-------------|----------------|
| Runtime | Standards-compliant Web APIs (JavaScript, Canvas) |
| SDK load order | Playables SDK in `index.html` **before** game code |
| Lifecycle | `firstFrameReady()` on loading UI; `gameReady()` when first level is tappable |
| Pause / resume | SDK `onPause` / `onResume` only — pause game loop, audio, input |
| Progress save | `loadData()` on boot; `saveData()` on level complete / meaningful progress |
| Save size | < 500 KB target (hard max 3 MB) |
| Audio | Respect `isAudioEnabled` and `onAudioEnabledChange` |
| Initial bundle | All assets needed before `gameReady` < 30 MB |
| Total bundle | < 250 MB (lazy-load extra content if added later) |
| File count | ≤ 8000 files |
| Compatibility | YouTube app (Android/iOS) + major desktop/mobile browsers |

### 4.2 Recommended tech stack

| Layer | Choice |
|-------|--------|
| Language | TypeScript |
| Build | Vite |
| Rendering | Canvas 2D (region fill + line art) |
| Level data | JSON + PNG per level |
| Audio | Web Audio or Howler.js (SDK-aware mute) |
| Testing | Playables SDK Test Suite + manual device QA |

---

## 5. Core gameplay

### 5.1 Game loop (per level)

1. Level loads: picture (outline) + labeled regions + empty color fills.
2. **Lives** display: 3 hearts.
3. **Current task** shown in equation bar, e.g. `10 + 12 = ?` with a **color swatch** (red).
4. Child **selects that color** from the palette (or color auto-highlighted with equation — see UX 6.2).
5. Child **taps a region** on the picture.
6. **Outcomes:**
   - **Correct:** Region fills with selected color; label may hide or fade; next equation appears.
   - **Wrong:** Lose 1 life; brief “try again” feedback (shake + sound); same equation remains active.
7. When all tasks complete → **Level complete** screen (stars + Next).
8. When lives reach 0 → **Try again** screen (restart level, lives reset to 3).

### 5.2 Region labels vs equations

- Each region displays a **fixed number** (the answer value), e.g. `22`, `43`, `7`.
- Each task maps: **equation → answer number → color**.
- Example: `10 + 12 = ?` → answer `22` → color red → child selects red → taps region labeled `22`.

### 5.3 Lives rules

| Rule | Behavior |
|------|----------|
| Starting lives | 3 per level |
| Wrong tap (any incorrect region) | −1 life |
| Wrong tap with no color selected | No life lost; show “Pick a color first” |
| Correct tap | No life change |
| Lives = 0 | Level fail; offer “Try again” (full level reset) |
| Level retry | Reset fills, lives, task index; equations unchanged |

### 5.4 Win / lose

| State | Condition | UI |
|-------|-----------|-----|
| Task progress | N tasks per level (see 8.1) | Progress dots or “3/6” |
| Level win | All tasks completed | Celebration + 1–3 stars + “Next level” |
| Level lose | Lives = 0 | Friendly message + “Try again” |

**Stars (V1):**

- 3 stars: 0 wrong taps
- 2 stars: 1–2 wrong taps
- 1 star: completed with 3 wrong taps (used last life on final task edge case handled: if they complete on last life, still 1 star)

---

## 6. Math rules (V1)

### 6.1 Operations

- **Addition:** `a + b = ?`
- **Subtraction:** `a − b = ?` where **a ≥ b** (no negative answers)

### 6.2 Answer constraints

| Constraint | Rule |
|------------|------|
| Answer range | **0 ≤ answer ≤ 50** (inclusive) |
| Operands | Non-negative integers; chosen so answer stays in range |
| Subtraction | Minuend ≥ subtrahend; result never negative |
| Display | Equation shows `?` for answer; region shows numeric label |

### 6.3 Difficulty progression (5 levels)

| Level | Theme (example) | Tasks | Operations mix | Operand notes |
|-------|-----------------|-------|----------------|---------------|
| 1 | Friendly animal | 4 | Add only | Sums ≤ 20 |
| 2 | Fruit / food | 4 | Add only | Sums 10–30 |
| 3 | Vehicle | 5 | Sub only | Results ≤ 20 |
| 4 | Nature scene | 5 | Mix add + sub | Answers ≤ 40 |
| 5 | Celebration / toy | 6 | Mix add + sub | Answers ≤ 50 |

*Exact equations are authored per level JSON; generator must validate constraints at build time.*

### 6.4 Validation (build-time)

A level validator script MUST reject any level where:

- Any answer < 0 or > 50
- Subtraction has negative result
- Duplicate (equation, answer) tasks in same level
- Region label does not exist for a task answer
- Two tasks require the same region (one region → one fill only)

---

## 7. User experience

### 7.1 Screens (V1)

| Screen | Purpose |
|--------|---------|
| **Loading** | Logo + “Loading…” — triggers `firstFrameReady` |
| **Title / Play** | Single “Play” button → resume saved level or Level 1 |
| **Level play** | Picture + equation bar + palette + lives + progress |
| **Level complete** | Stars, “Next”, optional “Replay” |
| **Level fail** | “Try again” |
| **All complete** | “You did it!” + replay Level 1 |

No level select map in V1 — linear progression 1 → 5.

### 7.2 Layout (portrait-first)

```
┌─────────────────────────┐
│  ♥ ♥ ♥        Level 2   │
├─────────────────────────┤
│                         │
│    [ Picture canvas ]   │
│    regions w/ numbers   │
│                         │
├─────────────────────────┤
│  10 + 12 = ?   [■ red]  │  ← equation + task color
├─────────────────────────┤
│ [■][■][■][■][■]         │  ← palette (task colors)
│      ● ● ○ ○            │  ← task progress
└─────────────────────────┘
```

- **Minimum tap target:** 48×48 px (prefer 56×56 for kids).
- **Fonts:** Rounded, high contrast; equation text ≥ 24px on mobile.

### 7.3 Color selection UX (decision)

**V1 behavior:** When a new task appears, the **task color is auto-selected** in the palette (child can still change selection before tapping). Reduces steps for younger users. Palette remains visible for clarity.

### 7.4 Feedback

| Event | Visual | Audio |
|-------|--------|-------|
| Correct tap | Fill animation (~300 ms) + small particles | Positive chime |
| Wrong tap | Region shake + hearts animate | Soft buzz |
| No color selected | Toast “Pick a color!” | None |
| Level complete | Star burst | Short jingle |
| Level fail | Hearts empty | Gentle “aww” |

All audio gated by Playables `isAudioEnabled`.

### 7.5 First-time hint (once per session)

Overlay (dismiss on tap):  
**“Match the math answer to the number on the picture!”**  
Optional animated finger pointing at equation then region.

---

## 8. Content & levels

### 8.1 Level structure

Each level = 1 picture + 4–6 tasks + region map.

**Regions per picture:** 8–15 labeled sections (simple shapes, thick outlines).

**Art style:**

- Black outline on white/light background
- Original characters (simple mascot style — **no licensed IP**)
- Flat fills when completed; numbers centered in regions

### 8.2 Level manifest (V1)

| Level ID | Name | Tasks | In initial bundle |
|----------|------|-------|-------------------|
| `level_01` | Sunny Cat | 4 | Yes |
| `level_02` | Fruit Bowl | 4 | Yes |
| `level_03` | Little Car | 5 | Yes |
| `level_04` | Tree & Birds | 5 | Yes |
| `level_05` | Toy Room | 6 | Yes |

All 5 levels ship in initial bundle (estimated < 2 MB art + code).

### 8.3 Data format

**`levels/level_01.json`**

```json
{
  "id": "level_01",
  "title": "Sunny Cat",
  "image": "level_01.png",
  "regions": [
    { "id": "r1", "label": 12, "points": [[x,y], ...] },
    { "id": "r2", "label": 7, "points": [...] }
  ],
  "tasks": [
    { "equation": "5 + 7", "op": "add", "answer": 12, "color": "#E53935" },
    { "equation": "9 − 2", "op": "sub", "answer": 7, "color": "#1E88E5" }
  ]
}
```

**Rules:**

- Every `task.answer` must match exactly one `regions[].label`.
- Each region used at most once per level.
- Colors unique per level where possible (min 4 distinct hues).

### 8.4 Asset specs

| Asset | Spec |
|-------|------|
| PNG line art | Max 1024×1024; PNG-8 or optimized PNG-24 |
| Per file | < 512 KB target |
| Regions | Stored as polygon points in image coordinate space |
| Audio | OGG/MP3; short clips < 50 KB each |

---

## 9. Progress & persistence

### 9.1 Saved data (via `saveData`)

```json
{
  "version": 1,
  "highestUnlockedLevel": 3,
  "levelStars": { "level_01": 3, "level_02": 2 },
  "hintSeen": true
}
```

### 9.2 When to save

- After level complete (stars + unlock next)
- On `onPause` (flush current state)
- Not on every tap (batch on task complete)

### 9.3 Resume behavior

- “Play” continues from **lowest incomplete** unlocked level.
- If all 5 complete → play Level 1 or show “Play again”.

---

## 10. Accessibility & kid safety

- No text chat, no external links during play.
- No collection of personal data (Playables save only).
- High color contrast; don’t rely on color alone (equation shown with swatch + number).
- Publisher name on title screen (cert requirement).
- Content suitable for **Everyone / Kids** rating — no violence, scares, or ads inside game canvas.

---

## 11. Certification checklist (pre-submit)

- [ ] SDK loaded before game code
- [ ] `firstFrameReady` / `gameReady` called correctly
- [ ] `onPause` / `onResume` stop loop + audio
- [ ] `loadData` awaited before `saveData`
- [ ] Initial bundle < 30 MB in test suite
- [ ] No Page Visibility API for pause
- [ ] Audio respects platform mute
- [ ] No broken filenames (ASCII, `-`, `_`, `.` only)
- [ ] Playable on iOS YouTube app + Android YouTube app
- [ ] Bundle analyzer: file count, sizes OK

---

## 12. Implementation phases (post-approval)

| Phase | Deliverable | Est. days |
|-------|-------------|-----------|
| 1 | Project scaffold, SDK integration, loading → gameReady | 2 |
| 2 | Canvas engine: regions, hit-test, fill animation | 3–4 |
| 3 | Game logic: tasks, lives, add/sub validation | 2 |
| 4 | UI: equation bar, palette, hearts, screens | 2–3 |
| 5 | 5 levels content + validator script | 3–4 |
| 6 | Audio, save/load, pause/resume | 2 |
| 7 | Test suite + device QA + cert fixes | 2–3 |
| **Total** | **V1 Playable** | **16–20 days** |

---

## 13. Risks & mitigations

| Risk | Mitigation |
|------|------------|
| Playables cert rejection | Integrate SDK from day 1; run test suite weekly |
| Art delays | Placeholder level 1 art for engine; swap PNGs later |
| Kids tap wrong target | Large regions; auto-select task color |
| Licensed character request | PRD mandates original art only |
| Subtraction confusion | Only `a ≥ b`; start sub on Level 3 after add Levels 1–2 |

---

## 14. Open questions (for approval)

1. **Equation bar:** Auto-select task color (recommended) vs require manual color pick every time?
2. **Subtraction symbol:** Use `−` (minus sign) or `-` (hyphen) for kids?
3. **After wrong tap:** Should the wrong region flash red briefly before shake?
4. **Stars:** Is the 0 / 1–2 / 3 wrong-tap star rule acceptable?
5. **Language:** English only confirmed for V1?

*Defaults assumed in this PRD: auto-select color, hyphen minus `-`, wrong-region flash yes, star rule as defined, English only.*

---

## 15. Approval

| Role | Name | Status | Date |
|------|------|--------|------|
| Product owner | | ☐ Approved / ☐ Changes requested | |

**Upon approval:** Implementation begins with Phase 1 (scaffold + SDK + one demo level).

---

## Appendix A — Example level walkthrough

**Level 1 — Sunny Cat (4 tasks, add only)**

| # | Equation | Answer | Color | Region label |
|---|----------|--------|-------|--------------|
| 1 | `3 + 5` | 8 | Red | 8 |
| 2 | `6 + 4` | 10 | Blue | 10 |
| 3 | `7 + 8` | 15 | Green | 15 |
| 4 | `9 + 6` | 15 | — | **Invalid** — validator rejects duplicate answer |

Corrected task 4: `8 + 7` → 15 conflicts; use `11 + 4` → 15 only if region 15 exists once — **each answer used once**. Task 4 revised to `10 + 5` → 15 if 15 not used, or `12 + 3` → 15.

*Final authoring ensures unique region per task.*

---

## Appendix B — Glossary

| Term | Definition |
|------|------------|
| **Region** | Tappable area on the picture with a visible number label |
| **Task** | One equation the child must solve in a level |
| **Answer** | Numeric result of the equation (0–50) |
| **Playable** | HTML5 game running inside YouTube via Playables SDK |
