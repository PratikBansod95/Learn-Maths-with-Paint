# Custom level authoring (Path A)

Build up to **30 levels** using JSON + art files. No code changes needed per level — only edit data and run the validator.

## Quick start

```bash
# Scaffold level 07 (or next id)
npm run new-level -- "Rainbow Fish"

# Edit art + regions, then validate
npm run validate-levels
```

## Files per level

| File | Purpose |
|------|---------|
| `levels/level_NN.json` | Regions, tasks, equations, colors |
| `public/assets/levels/level_NN.svg` | Line art (or `.png`) — **no white background rect** |
| `public/assets/levels/level_NN_colored.png` | Optional full-color reference (same size/alignment as line art) |
| `levels/manifest.json` | Order of levels in the game |

`new-level` creates the JSON + placeholder SVG and appends to the manifest.

## Art rules

1. **Size:** 512×512 (or set `imageSize` in JSON if different).
2. **Background:** transparent — the game draws white/paper behind fills.
3. **Strokes:** dark outlines only (`#2d3748` / `#374151`), ~4–5px — fills are drawn **under** your art.
4. **Format:** SVG for line art, or PNG if you paint in Procreate / Photoshop.
5. **Kid-friendly:** simple shapes, big tap targets, original characters only.

### HD texture fills (optional)

For a polished “paint by numbers” look, add a **colored reference** image aligned pixel-for-pixel with your line art. When the child fills a region, the game reveals that artwork instead of a flat color.

```json
"image": "assets/levels/level_07.svg",
"coloredImage": "assets/levels/level_07_colored.png",
"imageSize": { "width": 512, "height": 512 }
```

- Same dimensions and layout as line art (512×512 default).
- PNG or SVG; keep PNG **&lt; 200 KB** when possible.
- Omit `coloredImage` to use flat palette fills (levels 1–5 work this way).
- See `level_01` for a working example.

Replace `public/assets/levels/level_NN.svg` with your finished art. If using PNG:

```json
"image": "assets/levels/level_07.png",
"imageSize": { "width": 1024, "height": 1024 }
```

## Region polygons

Each region is a polygon in **image coordinates** (0–512):

```json
{
  "id": "r_wing",
  "label": 24,
  "points": [
    { "x": 100, "y": 120 },
    { "x": 180, "y": 100 },
    { "x": 200, "y": 200 },
    { "x": 120, "y": 220 }
  ]
}
```

- `label` = number shown on the picture (the answer the child taps).
- Use **circles/ellipses** as many-point polygons (see `level_01.json` sun).
- **Order matters for overlaps:** later regions in the array are checked first on tap.
- Put **smaller** regions **after** larger ones if they overlap.

### Authoring regions

1. Open art in Figma / Inkscape / a image editor with coordinates.
2. Trace each colorable area as a polygon.
3. One unique answer per level (no duplicate `label` values used in tasks).

## Tasks

```json
{
  "equation": "15 + 9",
  "op": "add",
  "answer": 24,
  "color": "#FDD835"
}
```

| Rule | Detail |
|------|--------|
| Answers | 0–50 only |
| Subtraction | `a - b` where a ≥ b |
| Colors | `#E53935` `#FDD835` `#43A047` `#1E88E5` `#FB8C00` `#8b5cf6` |
| Count | 4–6 tasks per level typical; ≤ number of regions |

## Difficulty guide (30 levels)

| Levels | Focus | Max answer |
|--------|-------|------------|
| 1–5 | Add, then intro sub | 30 |
| 6–10 | Mix | 40 |
| 11–20 | Mix, larger numbers | 50 |
| 21–30 | Mix, 5–6 tasks | 50 |

## Checklist before shipping a level

- [ ] Art replaced (not placeholder dashed box)
- [ ] Optional: `coloredImage` aligned with line art for HD fills
- [ ] Every task answer matches a region `label`
- [ ] No duplicate answers in one level
- [ ] Polygons cover the right shapes (test in `npm run dev`)
- [ ] `npm run validate-levels` passes
- [ ] Play start → finish with 0–3 stars

## Example: level_01 Sunny Cat

See `levels/level_01.json` + `public/assets/levels/level_01.png` + `level_01_colored.png` for a complete custom level with HD texture fills.

## Scaling to 30 levels

- Initial bundle loads levels listed in `manifest.json` (all JSON is small).
- Keep each PNG **&lt; 200 KB** (compress with TinyPNG / Squoosh).
- For very large packs later: lazy-load art per level (optional future step).

## Commands

```bash
npm run new-level -- "Your Title"   # scaffold next level
npm run validate-levels           # check all manifest levels
npm run dev                       # play-test
```
