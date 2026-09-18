#!/usr/bin/env python3
"""Honest status-stripped MAE @440w for Issue #10 pixel reconstruct.

Compares live Figma exports (reconstructed vectors, PixelBase hidden) vs
docs/ui-screenshots refs. Does NOT accept PixelBase wallpaper locks.
"""
from __future__ import annotations

import json
import sys
from pathlib import Path

import numpy as np
from PIL import Image

# Approx status / Dynamic Island band to strip from phone screenshots.
STATUS_BAND_FRAC = 0.055  # ~top 5.5% of portrait frame
TARGET_W = 440


def load_rgb(path: Path) -> np.ndarray:
    im = Image.open(path).convert("RGB")
    return np.asarray(im, dtype=np.float32)


def strip_status(arr: np.ndarray) -> np.ndarray:
    h = arr.shape[0]
    y0 = int(round(h * STATUS_BAND_FRAC))
    return arr[y0:, :, :]


def resize_w(arr: np.ndarray, w: int = TARGET_W) -> np.ndarray:
    h, ow, _ = arr.shape
    nh = max(1, int(round(h * (w / ow))))
    im = Image.fromarray(arr.astype(np.uint8))
    im = im.resize((w, nh), Image.Resampling.LANCZOS)
    return np.asarray(im, dtype=np.float32)


def mae(a: np.ndarray, b: np.ndarray) -> float:
    h = min(a.shape[0], b.shape[0])
    w = min(a.shape[1], b.shape[1])
    a2, b2 = a[:h, :w], b[:h, :w]
    return float(np.mean(np.abs(a2 - b2)))


def bands(a: np.ndarray, b: np.ndarray) -> dict:
    h = min(a.shape[0], b.shape[0])
    chrome_h = max(1, int(h * 0.18))
    bot_h = max(1, int(h * 0.22))
    mid_y0, mid_y1 = chrome_h, h - bot_h
    return {
        "full": round(mae(a, b), 2),
        "chrome": round(mae(a[:chrome_h], b[:chrome_h]), 2),
        "mid": round(mae(a[mid_y0:mid_y1], b[mid_y0:mid_y1]), 2),
        "bot": round(mae(a[h - bot_h :], b[h - bot_h :]), 2),
        "H": h,
    }


def side_by_side(ref: np.ndarray, fig: np.ndarray, out: Path) -> None:
    h = min(ref.shape[0], fig.shape[0])
    w = min(ref.shape[1], fig.shape[1])
    gap = np.full((h, 8, 3), 240, dtype=np.uint8)
    canvas = np.concatenate(
        [ref[:h, :w].astype(np.uint8), gap, fig[:h, :w].astype(np.uint8)], axis=1
    )
    Image.fromarray(canvas).save(out)


def diff_map(ref: np.ndarray, fig: np.ndarray, out: Path) -> None:
    h = min(ref.shape[0], fig.shape[0])
    w = min(ref.shape[1], fig.shape[1])
    d = np.mean(np.abs(ref[:h, :w] - fig[:h, :w]), axis=2)
    # amplify for visibility
    vis = np.clip(d * 4.0, 0, 255).astype(np.uint8)
    Image.fromarray(vis).save(out)


def compare_pair(ref_path: Path, fig_path: Path, stem: str, out_dir: Path) -> dict:
    ref = resize_w(strip_status(load_rgb(ref_path)))
    fig = resize_w(strip_status(load_rgb(fig_path)))
    m = bands(ref, fig)
    side_by_side(ref, fig, out_dir / f"{stem}-side.png")
    diff_map(ref, fig, out_dir / f"{stem}-diff.png")
    m["ref"] = str(ref_path)
    m["figma"] = str(fig_path)
    return m


def main() -> int:
    root = Path(__file__).resolve().parents[1]
    pairs = {
        "43": ("refs/43-household.jpg", "figma/43-household.png"),
        "39": ("refs/39-account.jpg", "figma/39-account.png"),
        "05": ("refs/05-timer.jpg", "figma/05-timer.png"),
        "07": ("refs/07-folders.jpg", "figma/07-folders.png"),
    }
    report = {"method": "status-stripped MAE @440w", "pixelbase_banned": True, "pages": {}}
    for page, (r, f) in pairs.items():
        rp, fp = root / r, root / f
        if not fp.exists():
            report["pages"][page] = {"error": f"missing export {fp.name}"}
            continue
        report["pages"][page] = compare_pair(rp, fp, page, root / "compare")
    out = root / "REPORT.json"
    out.write_text(json.dumps(report, indent=2) + "\n")
    print(json.dumps(report, indent=2))
    return 0


if __name__ == "__main__":
    sys.exit(main())
