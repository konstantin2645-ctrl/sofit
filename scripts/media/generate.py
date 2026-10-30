"""Procedural stage photography + hero video for SOFIT.

Generates concert-like images (light beams through haze, stage glow, crowd
silhouettes) so the project ships with original, license-free imagery.
Usage: python3 scripts/media/generate.py <out_dir>
"""
import math
import os
import subprocess
import sys

import numpy as np
from PIL import Image, ImageDraw, ImageFilter

OUT = sys.argv[1] if len(sys.argv) > 1 else "public/media"
os.makedirs(OUT, exist_ok=True)

GELS = {
    "magenta": (1.0, 0.13, 0.55),
    "congo": (0.25, 0.18, 1.0),
    "amber": (1.0, 0.62, 0.12),
    "cyan": (0.05, 0.78, 0.95),
    "tungsten": (1.0, 0.86, 0.66),
    "red": (1.0, 0.12, 0.08),
    "violet": (0.62, 0.22, 1.0),
    "green": (0.2, 1.0, 0.55),
}


def fbm(h, w, rng, octaves=5):
    out = np.zeros((h, w), np.float32)
    amp, total = 1.0, 0.0
    for o in range(octaves):
        sh, sw = max(2, h // (64 >> min(o, 5)) ), max(2, w // (64 >> min(o, 5)))
        sh, sw = 3 + 2 ** o, 4 + int(2 ** o * w / h)
        small = rng.random((sh, sw)).astype(np.float32)
        img = Image.fromarray((small * 255).astype(np.uint8)).resize((w, h), Image.BICUBIC)
        out += amp * (np.asarray(img, np.float32) / 255.0)
        total += amp
        amp *= 0.55
    return out / total


def beams(h, w, specs, haze, t=0.0):
    yy, xx = np.mgrid[0:h, 0:w].astype(np.float32)
    acc = np.zeros((h, w, 3), np.float32)
    for (ox, oy, ang, width, color, power, sway, phase) in specs:
        a = ang + sway * math.sin(t * 2 * math.pi + phase)
        dx, dy = xx - ox * w, yy - oy * h
        dist = np.sqrt(dx * dx + dy * dy) + 1e-3
        up = oy > 0.3
        theta = np.arctan2(dx, -dy) if up else np.arctan2(dx, dy)  # 0 = straight up/down
        d = np.angle(np.exp(1j * (theta - a)))
        core = np.exp(-(d / width) ** 2)
        soft = np.exp(-(d / (width * 3.2)) ** 2) * 0.25
        fall = np.clip(1.25 - dist / (h * 1.35), 0, 1) ** 1.4
        inten = (core + soft) * fall * (0.35 + 0.95 * haze) * power
        inten *= (dy < 0) if up else (dy > 0)
        acc += inten[..., None] * np.array(color, np.float32)
    return acc


def crowd_mask(h, w, rng, density=1.0, horizon=0.78, phones=True, hands_phase=0.0):
    mask = Image.new("L", (w, h), 0)
    glow = Image.new("L", (w, h), 0)
    d = ImageDraw.Draw(mask)
    g = ImageDraw.Draw(glow)
    rows = 5
    for r in range(rows):
        depth = r / (rows - 1)
        y0 = h * (horizon + depth * (1.02 - horizon))
        size = h * (0.018 + depth * 0.075)
        n = int(w / size * 1.25 * density)
        d.rectangle([0, min(y0 + size * 1.2, h + 9), w, h + 10], fill=255)
        for i in range(n):
            x = rng.random() * w
            y = y0 + rng.normal() * size * 0.25
            hw = size * (0.42 + rng.random() * 0.12)
            d.ellipse([x - hw, y - size * 0.55, x + hw, y + size * 0.55], fill=255)
            d.ellipse([x - hw * 2.0, y + size * 0.4, x + hw * 2.0, y + size * 3.2], fill=255)
            if rng.random() < 0.13:
                side = 1 if rng.random() < 0.5 else -1
                lift = 1.6 + rng.random() * 1.3 + 0.25 * math.sin(hands_phase + x * 0.05)
                ax, ay = x + side * hw * 1.4, y + size * 0.4
                hx, hy = ax + side * size * 0.35, y - size * lift
                d.line([ax, ay, hx, hy], fill=255, width=max(2, int(size * 0.28)))
                d.ellipse([hx - size * 0.17, hy - size * 0.22, hx + size * 0.17, hy + size * 0.12], fill=255)
                if phones and rng.random() < 0.3:
                    pw, ph = size * 0.09, size * 0.16
                    g.rectangle([hx - pw, hy - ph * 1.4, hx + pw, hy - ph * 0.2], fill=255)
    mask = mask.filter(ImageFilter.GaussianBlur(max(1, h * 0.0015)))
    glow = glow.filter(ImageFilter.GaussianBlur(max(1, h * 0.002)))
    return (np.asarray(mask, np.float32) / 255.0, np.asarray(glow, np.float32) / 255.0)


def performer(h, w, cx, base_y, scale):
    m = Image.new("L", (w, h), 0)
    d = ImageDraw.Draw(m)
    s = h * scale
    d.ellipse([cx * w - s * 0.09, base_y * h - s * 1.0, cx * w + s * 0.09, base_y * h - s * 0.8], fill=255)
    d.polygon([(cx * w - s * 0.2, base_y * h - s * 0.74), (cx * w + s * 0.2, base_y * h - s * 0.74),
               (cx * w + s * 0.14, base_y * h - s * 0.3), (cx * w + s * 0.12, base_y * h),
               (cx * w - s * 0.12, base_y * h), (cx * w - s * 0.14, base_y * h - s * 0.3)], fill=255)
    d.line([cx * w + s * 0.25, base_y * h, cx * w + s * 0.18, base_y * h - s * 0.78], fill=255, width=max(2, int(s * 0.02)))
    return np.asarray(m.filter(ImageFilter.GaussianBlur(max(1, h * 0.002))), np.float32) / 255.0


def screen(h, w, rng, color, x0, y0, x1, y1):
    yy, xx = np.mgrid[0:h, 0:w].astype(np.float32)
    inside = ((xx > x0 * w) & (xx < x1 * w) & (yy > y0 * h) & (yy < y1 * h)).astype(np.float32)
    u = (xx - x0 * w) / ((x1 - x0) * w)
    v = (yy - y0 * h) / ((y1 - y0) * h)
    pat = (0.55 + 0.45 * np.sin(v * 22 + rng.random() * 6)) * np.exp(-((u - 0.5) / 0.45) ** 2)
    pat = pat ** 2 * (0.5 + 0.5 * v)
    m = Image.fromarray((inside * 255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(h * 0.004))
    inside = np.asarray(m, np.float32) / 255.0
    return inside[..., None] * pat[..., None] * np.array(color, np.float32) * 0.55


def finish(img, rng, grain=0.018, vignette=0.55):
    h, w, _ = img.shape
    # bloom
    bright = np.clip(img - 0.55, 0, None)
    b = Image.fromarray(np.clip(bright * 255, 0, 255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(h * 0.02))
    img = img + np.asarray(b, np.float32) / 255.0 * 0.9
    yy, xx = np.mgrid[0:h, 0:w].astype(np.float32)
    r = np.sqrt(((xx / w - 0.5) * 1.3) ** 2 + ((yy / h - 0.45)) ** 2)
    img *= (1 - vignette * np.clip(r, 0, 1) ** 1.8)[..., None]
    img = 1 - np.exp(-img * 1.35)  # filmic tone map
    img += (rng.normal(size=(h, w, 1)).astype(np.float32)) * grain
    img = np.clip(img, 0, 1) ** (1 / 1.05)
    return (img * 255).astype(np.uint8)


def stage_image(seed, gels, w=1600, h=1067, kind="arena"):
    rng = np.random.default_rng(seed)
    haze = fbm(h, w, rng)
    c1, c2 = GELS[gels[0]], GELS[gels[1]]
    img = np.zeros((h, w, 3), np.float32)
    yy = np.linspace(0, 1, h, dtype=np.float32)[:, None, None]
    img += (np.array(c1) * 0.05 + 0.01) * (1 - yy) + np.array(c2) * 0.04 * yy
    horizon = {"arena": 0.76, "club": 0.74, "festival": 0.8, "hall": 0.72}[kind]
    n = {"arena": 9, "club": 5, "festival": 12, "hall": 4}[kind]
    specs = []
    for i in range(n):
        ox = 0.08 + 0.84 * (i + rng.random() * 0.4) / n
        col = c1 if i % 2 == 0 else c2
        ang = (0.5 - ox) * rng.uniform(0.6, 1.4) + rng.normal() * 0.18
        if i % 3 == 0:
            specs.append((ox, rng.uniform(-0.05, 0.05), ang * 0.6, rng.uniform(0.02, 0.04), col,
                          rng.uniform(0.5, 0.9), 0, 0))
        else:
            specs.append((ox, horizon - 0.08, -ang * 1.3 + rng.normal() * 0.1, rng.uniform(0.008, 0.02), col,
                          rng.uniform(0.6, 1.1), 0, 0))
    if kind in ("club", "hall"):
        specs.append((0.5, -0.1, 0.0, 0.06, GELS["tungsten"], 0.9, 0, 0))
    img += beams(h, w, specs, haze)
    yy2, xx2 = np.mgrid[0:h, 0:w].astype(np.float32)
    glow = np.exp(-(((xx2 / w - 0.5) / 0.38) ** 2 + ((yy2 / h - horizon + 0.04) / 0.07) ** 2))
    img += glow[..., None] * (np.array(c1) * 0.6 + np.array(GELS["tungsten"]) * 0.4) * 0.9
    if kind in ("arena", "festival"):
        img += screen(h, w, rng, c2, 0.36, horizon - 0.36, 0.64, horizon - 0.12)
    if kind != "festival":
        p = performer(h, w, 0.5 + rng.normal() * 0.05, horizon + 0.005, 0.13 if kind != "arena" else 0.09)
        img *= (1 - p * 0.97)[..., None]
    density = {"arena": 1.0, "club": 1.15, "festival": 1.3, "hall": 0.7}[kind]
    m, ph = crowd_mask(h, w, rng, density, horizon, phones=kind != "hall")
    rim = np.asarray(Image.fromarray((m * 255).astype(np.uint8)).filter(ImageFilter.FIND_EDGES), np.float32) / 255.0
    img = img * (1 - m[..., None] * 0.985) + rim[..., None] * np.array(c1) * 0.35 * (1 - (yy2 / h))[..., None]
    img += ph[..., None] * np.array([0.9, 0.95, 1.0]) * 0.8
    return finish(img, rng)


def portrait(seed, gels, w=1000, h=1250):
    rng = np.random.default_rng(seed)
    haze = fbm(h, w, rng, 4)
    c1, c2 = GELS[gels[0]], GELS[gels[1]]
    img = np.zeros((h, w, 3), np.float32)
    yy, xx = np.mgrid[0:h, 0:w].astype(np.float32)
    side = 1 if seed % 2 else -1
    back = np.exp(-(((xx / w - 0.5 - side * 0.15) / 0.5) ** 2 + ((yy / h - 0.3) / 0.45) ** 2))
    img += back[..., None] * np.array(c1) * (0.25 + 0.6 * haze[..., None])
    img += beams(h, w, [(0.5 + side * 0.45, -0.08, -side * 0.35, 0.06, c2, 0.7, 0, 0),
                        (0.5 - side * 0.3, -0.08, side * 0.15, 0.02, GELS["tungsten"], 0.35, 0, 0)], haze)
    m = Image.new("L", (w, h), 0)
    d = ImageDraw.Draw(m)
    cx = w * (0.5 - side * 0.06)
    # head (slightly tilted ellipse), jaw, neck, shoulders
    head = Image.new("L", (w, h), 0)
    hd = ImageDraw.Draw(head)
    hd.ellipse([cx - w * 0.115, h * 0.2, cx + w * 0.115, h * 0.46], fill=255)
    hd.ellipse([cx - w * 0.09, h * 0.33, cx + w * 0.09, h * 0.5], fill=255)
    head = head.rotate(side * 8, center=(cx, h * 0.38))
    m.paste(255, mask=head)
    d.polygon([(cx - w * 0.055, h * 0.44), (cx + w * 0.055, h * 0.44), (cx + w * 0.07, h * 0.58), (cx - w * 0.07, h * 0.58)], fill=255)
    d.polygon([(cx - w * 0.06, h * 0.55), (cx + w * 0.06, h * 0.55), (cx + w * 0.29, h * 0.63),
               (cx + w * 0.38, h * 0.7), (cx + w * 0.43, h), (cx - w * 0.43, h),
               (cx - w * 0.38, h * 0.7), (cx - w * 0.29, h * 0.63)], fill=255)
    for sx in (-1, 1):
        d.ellipse([cx + sx * w * 0.33 - w * 0.085, h * 0.63, cx + sx * w * 0.33 + w * 0.085, h * 0.8], fill=255)
    m = m.filter(ImageFilter.GaussianBlur(w * 0.012)).point(lambda v: 255 if v > 128 else 0).filter(ImageFilter.GaussianBlur(w * 0.002))
    mask = np.asarray(m, np.float32) / 255.0
    # rim light only on the lit side
    shifted = np.roll(mask, int(side * w * 0.012), axis=1)
    rim = np.clip(mask - shifted, 0, 1)
    rim = np.asarray(Image.fromarray((rim * 255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(w * 0.004)), np.float32) / 255.0 * 2.2
    img = img * (1 - mask[..., None] * 0.97) + rim[..., None] * np.array(c2) * 1.4
    return finish(img, rng, grain=0.016, vignette=0.45)


def save(arr, name, q=86):
    Image.fromarray(arr).save(os.path.join(OUT, name), quality=q, optimize=True, progressive=True)
    print("wrote", name)


def hero_video(name="hero", w=1280, h=720, fps=25, seconds=10):
    rng = np.random.default_rng(7)
    haze0 = fbm(h, w * 2, rng, 5)
    specs = []
    palette = [GELS["tungsten"], GELS["amber"], GELS["magenta"], GELS["congo"]]
    for i in range(10):
        ox = 0.05 + 0.9 * i / 9
        specs.append((ox, -0.06, (0.5 - ox) * 0.9, 0.014 + 0.01 * (i % 3), palette[i % 4], 0.85,
                      0.22 + 0.1 * (i % 2), i * 0.7))
    m, phones = crowd_mask(h, w, rng, 1.1, 0.8)
    yy, xx = np.mgrid[0:h, 0:w].astype(np.float32)
    glow = np.exp(-(((xx / w - 0.5) / 0.4) ** 2 + ((yy / h - 0.77) / 0.06) ** 2))
    frames = fps * seconds
    poster = None
    proc = subprocess.Popen([
        "ffmpeg", "-y", "-loglevel", "error", "-f", "rawvideo", "-pix_fmt", "rgb24", "-s", f"{w}x{h}",
        "-r", str(fps), "-i", "-", "-c:v", "libx264", "-preset", "slow", "-crf", "26", "-pix_fmt", "yuv420p",
        "-movflags", "+faststart", "-an", os.path.join(OUT, f"{name}.mp4")], stdin=subprocess.PIPE)
    frng = np.random.default_rng(1)
    for f in range(frames):
        t = f / frames
        shift = int(t * w) % w
        haze = haze0[:, shift:shift + w]
        img = np.full((h, w, 3), 0.008, np.float32)
        img += beams(h, w, specs, haze, t)
        pulse = 0.75 + 0.25 * math.sin(t * 2 * math.pi * 4) ** 2
        img += glow[..., None] * np.array([1.0, 0.7, 0.45]) * pulse
        img = img * (1 - m[..., None] * 0.985) + phones[..., None] * 0.7
        out = finish(img, frng, grain=0.03)
        if f == 0:
            poster = out
        proc.stdin.write(out.tobytes())
    proc.stdin.close()
    proc.wait()
    save(poster, f"{name}-poster.jpg", 80)


if __name__ == "__main__":
    what = sys.argv[2] if len(sys.argv) > 2 else "all"
    combos = [("magenta", "congo"), ("amber", "red"), ("cyan", "violet"), ("tungsten", "amber"),
              ("congo", "cyan"), ("red", "magenta"), ("violet", "amber"), ("green", "cyan")]
    kinds = ["arena", "club", "festival", "hall"]
    if what in ("all", "stills"):
        for i in range(24):
            g = combos[i % len(combos)]
            k = kinds[(i * 3 + i // 8) % 4]
            save(stage_image(100 + i, g, kind=k), f"stage-{i + 1:02d}.jpg")
        for i in range(14):
            g = combos[(i * 5) % len(combos)]
            save(portrait(500 + i, g), f"artist-{i + 1:02d}.jpg")
    if what in ("all", "video"):
        hero_video()
