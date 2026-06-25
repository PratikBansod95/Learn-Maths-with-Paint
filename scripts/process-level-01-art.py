"""Process AI art pair into game-ready level_01 assets + region JSON."""
from __future__ import annotations

import json
import math
from pathlib import Path

import cv2
import numpy as np
from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
ASSETS_IN = Path(
    r"C:\Users\AP\.cursor\projects\d-Apps-by-me-Learn-Maths-with-Paint\assets"
)
LINE_SRC = ASSETS_IN / (
    "c__Users_AP_AppData_Roaming_Cursor_User_workspaceStorage_f072dfa9214d3903eed9bd1ddbedfd60_"
    "images_colorifyai-1782412866253-e651a17e-52f7-4697-b826-75b7951a8f5d.png"
)
COLOR_SRC = ASSETS_IN / (
    "c__Users_AP_AppData_Roaming_Cursor_User_workspaceStorage_f072dfa9214d3903eed9bd1ddbedfd60_"
    "images_cat_color-29f3c088-0b2e-416c-939d-80af122d8a53.png"
)
OUT_DIR = ROOT / "public" / "assets" / "levels"
SIZE = 1024


def ellipse_points(
    cx: float, cy: float, rx: float, ry: float, segments: int = 20, angle_deg: float = 0
) -> list[dict[str, int]]:
    a = math.radians(angle_deg)
    ca, sa = math.cos(a), math.sin(a)
    pts: list[dict[str, int]] = []
    for i in range(segments):
        t = 2 * math.pi * i / segments
        lx = rx * math.cos(t)
        ly = ry * math.sin(t)
        x = cx + lx * ca - ly * sa
        y = cy + lx * sa + ly * ca
        pts.append({"x": int(round(x)), "y": int(round(y))})
    return pts


# Hand-tuned tap targets aligned to the AI art (1024 canvas)
REGIONS: list[dict] = [
    {"id": "r_sun", "label": 18, "points": ellipse_points(130, 130, 80, 80)},
    {"id": "r_flower_pink", "label": 6, "points": ellipse_points(168, 505, 62, 68)},
    {"id": "r_flower_purple", "label": 10, "points": ellipse_points(248, 730, 55, 60)},
    {"id": "r_flower_blue", "label": 14, "points": ellipse_points(862, 495, 62, 68)},
    {"id": "r_flower_yellow", "label": 16, "points": ellipse_points(858, 792, 52, 56)},
    {"id": "r_tail", "label": 12, "points": ellipse_points(688, 668, 75, 100, angle_deg=32)},
    {"id": "r_head", "label": 8, "points": ellipse_points(512, 295, 122, 112)},
    {"id": "r_body", "label": 15, "points": ellipse_points(512, 568, 138, 122)},
]


def make_line_art_transparent(src: Path, dst: Path) -> None:
    im = Image.open(src).convert("RGBA")
    im = im.resize((SIZE, SIZE), Image.Resampling.LANCZOS)
    data = np.array(im)
    rgb = data[:, :, :3].astype(np.int16)
    # White/near-white paper -> transparent; keep dark ink
    brightness = rgb.max(axis=2)
    ink = brightness < 200
    alpha = np.where(ink, 255, 0).astype(np.uint8)
    data[:, :, 3] = alpha
    # Thicken lines slightly for mobile readability
    gray = cv2.cvtColor(data[:, :, :3], cv2.COLOR_RGBA2GRAY)
    _, mask = cv2.threshold(gray, 200, 255, cv2.THRESH_BINARY_INV)
    mask = cv2.dilate(mask, np.ones((2, 2), np.uint8), iterations=1)
    data[:, :, 3] = mask
    data[mask > 0, 0:3] = 0
    Image.fromarray(data).save(dst, optimize=True)


def save_colored(src: Path, dst: Path) -> None:
    im = Image.open(src).convert("RGB")
    im = im.resize((SIZE, SIZE), Image.Resampling.LANCZOS)
    im.save(dst, optimize=True, quality=88)


def build_regions() -> list[dict]:
    for r in REGIONS:
        print(f"  {r['id']}: {len(r['points'])} points, label {r['label']}")
    return REGIONS


def write_debug(color_path: Path, regions: list[dict], dst: Path) -> None:
    img = cv2.imread(str(color_path))
    for r in regions:
        pts = np.array([[p["x"], p["y"]] for p in r["points"]], np.int32)
        cv2.polylines(img, [pts], True, (0, 0, 255), 2)
        cx = int(sum(p["x"] for p in r["points"]) / len(r["points"]))
        cy = int(sum(p["y"] for p in r["points"]) / len(r["points"]))
        cv2.putText(img, str(r["label"]), (cx - 12, cy), cv2.FONT_HERSHEY_SIMPLEX, 0.7, (0, 255, 0), 2)
    cv2.imwrite(str(dst), img)


def main() -> None:
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    line_out = OUT_DIR / "level_01.png"
    color_out = OUT_DIR / "level_01_colored.png"
    debug_out = OUT_DIR / "level_01_regions_debug.png"

    print("Processing line art...")
    make_line_art_transparent(LINE_SRC, line_out)
    print("Saving colored art...")
    save_colored(COLOR_SRC, color_out)
    print("Extracting regions...")
    regions = build_regions()
    write_debug(color_out, regions, debug_out)

    level = {
        "id": "level_01",
        "title": "Sunny Cat",
        "image": "assets/levels/level_01.png",
        "coloredImage": "assets/levels/level_01_colored.png",
        "imageSize": {"width": SIZE, "height": SIZE},
        "regions": regions,
        "tasks": [
            {"equation": "5 + 3", "op": "add", "answer": 8, "color": "#FB8C00"},
            {"equation": "2 + 4", "op": "add", "answer": 6, "color": "#E53935"},
            {"equation": "7 + 5", "op": "add", "answer": 12, "color": "#43A047"},
            {"equation": "6 + 4", "op": "add", "answer": 10, "color": "#8b5cf6"},
            {"equation": "8 + 7", "op": "add", "answer": 15, "color": "#FB8C00"},
            {"equation": "7 + 7", "op": "add", "answer": 14, "color": "#1E88E5"},
            {"equation": "8 + 8", "op": "add", "answer": 16, "color": "#FDD835"},
            {"equation": "9 + 9", "op": "add", "answer": 18, "color": "#FDD835"},
        ],
    }

    json_path = ROOT / "levels" / "level_01.json"
    json_path.write_text(json.dumps(level, indent=2) + "\n", encoding="utf-8")
    print(f"Wrote {line_out.name}, {color_out.name}, {json_path.name}")
    print(f"Debug overlay: {debug_out.name}")


if __name__ == "__main__":
    main()
