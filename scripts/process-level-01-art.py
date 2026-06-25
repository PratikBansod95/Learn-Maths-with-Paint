"""Process AI art pair into game-ready level_01 assets + region JSON."""
from __future__ import annotations

import json
import os
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

# Seed points (x, y) in 1024 space — tuned for Sunny Cat layout
REGION_SEEDS: list[dict] = [
    {"id": "r_sun", "label": 18, "seed": (118, 118), "tol": 45},
    {"id": "r_flower_pink", "label": 6, "seed": (160, 520), "tol": 32},
    {"id": "r_flower_purple", "label": 10, "seed": (248, 748), "tol": 35},
    {"id": "r_flower_blue", "label": 14, "seed": (880, 520), "tol": 32},
    {"id": "r_flower_yellow", "label": 16, "seed": (860, 810), "tol": 35},
    {"id": "r_tail", "label": 12, "seed": (710, 690), "tol": 28},
    {"id": "r_head", "label": 8, "seed": (512, 360), "tol": 30},
    {"id": "r_body", "label": 15, "seed": (512, 650), "tol": 32},
]

SKY_RGB = np.array([208, 237, 251], dtype=np.int16)


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
    data[mask == 0, :3] = 0
    Image.fromarray(data).save(dst, optimize=True)


def save_colored(src: Path, dst: Path) -> None:
    im = Image.open(src).convert("RGB")
    im = im.resize((SIZE, SIZE), Image.Resampling.LANCZOS)
    im.save(dst, optimize=True, quality=88)


def flood_region_mask(color_bgr: np.ndarray, seed: tuple[int, int], tol: int = 38) -> np.ndarray:
    h, w = color_bgr.shape[:2]
    x, y = seed
    x = int(np.clip(x, 0, w - 1))
    y = int(np.clip(y, 0, h - 1))
    rgb = cv2.cvtColor(color_bgr, cv2.COLOR_BGR2RGB).astype(np.int16)
    visited = np.zeros((h, w), np.uint8)
    mask = np.zeros((h, w), np.uint8)
    target = rgb[y, x]
    stack = [(x, y)]

    while stack:
        cx, cy = stack.pop()
        if visited[cy, cx]:
            continue
        visited[cy, cx] = 1
        px = rgb[cy, cx]
        if np.linalg.norm(px - SKY_RGB) < 22:
            continue
        if np.linalg.norm(px - target) > tol:
            continue
        mask[cy, cx] = 255
        for nx, ny in ((cx + 1, cy), (cx - 1, cy), (cx, cy + 1), (cx, cy - 1)):
            if 0 <= nx < w and 0 <= ny < h and not visited[ny, nx]:
                stack.append((nx, ny))
    return mask


def mask_to_polygon(mask: np.ndarray, min_area: int = 800) -> list[dict[str, int]] | None:
    contours, _ = cv2.findContours(mask, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
    if not contours:
        return None
    contour = max(contours, key=cv2.contourArea)
    if cv2.contourArea(contour) < min_area:
        return None
    epsilon = 0.012 * cv2.arcLength(contour, True)
    approx = cv2.approxPolyDP(contour, epsilon, True)
    if len(approx) < 3:
        return None
    if len(approx) > 24:
        epsilon = 0.02 * cv2.arcLength(contour, True)
        approx = cv2.approxPolyDP(contour, epsilon, True)
    points = [{"x": int(p[0][0]), "y": int(p[0][1])} for p in approx]
    return points


def build_regions(color_path: Path) -> list[dict]:
    color_bgr = cv2.imread(str(color_path))
    regions: list[dict] = []
    used_mask = np.zeros(color_bgr.shape[:2], np.uint8)

    for spec in REGION_SEEDS:
        tol = spec.get("tol", 38)
        mask = flood_region_mask(color_bgr, spec["seed"], tol)
        mask[used_mask > 0] = 0
        if spec["id"].startswith("r_flower"):
            kernel = np.ones((12, 12), np.uint8)
            mask = cv2.dilate(mask, kernel, iterations=1)
            mask[used_mask > 0] = 0
        points = mask_to_polygon(mask)
        if not points:
            print(f"WARN: could not extract region {spec['id']}, retrying with wider tol")
            mask = flood_region_mask(color_bgr, spec["seed"], tol + 12)
            mask[used_mask > 0] = 0
            points = mask_to_polygon(mask, min_area=400)
        if not points:
            raise RuntimeError(f"Failed to build region {spec['id']}")
        used_mask = cv2.bitwise_or(used_mask, mask)
        regions.append({"id": spec["id"], "label": spec["label"], "points": points})
        print(f"  {spec['id']}: {len(points)} points, label {spec['label']}")
    return regions


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
    regions = build_regions(color_out)
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
