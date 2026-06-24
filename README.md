# Learn Maths with Paint

YouTube Playable — kids solve addition & subtraction (answers 0–50) and color matching numbered regions.

## Docs

- [PRD.md](./PRD.md) — product requirements
- [ROADMAP.md](./ROADMAP.md) — implementation phases

## Quick start

```bash
npm install
npm run dev
```

Open http://localhost:5173 — click **Play** to try Level 1 (placeholder art).

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Local dev server |
| `npm run build` | Production build → `dist/` |
| `npm run preview` | Preview production build |
| `npm run validate-levels` | Validate all `levels/*.json` |

## Project structure

```
src/
  main.ts           Entry point
  sdk/playables.ts  YouTube Playables SDK wrapper
  ui/App.ts         Screens & game shell
  canvas/           Region canvas (Phase 2+)
  game/types.ts     Shared types
levels/             Level JSON files
```

## YouTube Playables

The SDK loads first in `index.html`:

```html
<script src="https://www.youtube.com/game_api/v1"></script>
```

Locally, `ytgame` is a no-op; progress saves to `localStorage`.

## Current phase

**Phase 1 — Foundation** ✓ scaffold, SDK, UI shell, demo level logic

Next: Phase 2 — canvas polish, fill animation, responsive art.
