/**
 * Working out what colour the device status bar should be so it reads as a
 * continuation of the screen below it: look at whatever is painted along the
 * very top edge of the page (background colours, translucent headers,
 * background pictures, <img> and <video> frames) and blend it together.
 */

type Rgb = { r: number; g: number; b: number };
type Layer = { r: number; g: number; b: number; a: number };

// ---- explicit overrides (a screen that wants one fixed colour) ----

const overrides: string[] = [];
const listeners = new Set<() => void>();

export function pushStatusBarOverride(color: string): () => void {
  overrides.push(color);
  listeners.forEach((l) => l());
  return () => {
    const i = overrides.lastIndexOf(color);
    if (i >= 0) overrides.splice(i, 1);
    listeners.forEach((l) => l());
  };
}

export function currentStatusBarOverride(): string | null {
  return overrides.length ? overrides[overrides.length - 1] : null;
}

export function onStatusBarOverrideChange(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

// ---- sampling ----

const imageCache = new Map<string, HTMLImageElement | "loading" | "failed">();
let onImageReady: (() => void) | null = null;

export function setImageReadyCallback(cb: (() => void) | null) {
  onImageReady = cb;
}

function loadImage(url: string): HTMLImageElement | null {
  const cached = imageCache.get(url);
  if (cached instanceof HTMLImageElement) return cached;
  if (cached) return null;
  imageCache.set(url, "loading");
  const img = new Image();
  img.onload = () => {
    imageCache.set(url, img);
    onImageReady?.();
  };
  img.onerror = () => imageCache.set(url, "failed");
  img.src = url;
  return null;
}

let canvas: HTMLCanvasElement | null = null;

function pixelFrom(source: CanvasImageSource, sx: number, sy: number, sw: number, sh: number): Layer | null {
  try {
    canvas ??= Object.assign(document.createElement("canvas"), { width: 1, height: 1 });
    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    if (!ctx) return null;
    ctx.clearRect(0, 0, 1, 1);
    ctx.drawImage(source, sx, sy, sw, sh, 0, 0, 1, 1);
    const d = ctx.getImageData(0, 0, 1, 1).data;
    return { r: d[0], g: d[1], b: d[2], a: d[3] / 255 };
  } catch {
    // Tainted (cross-origin) or not decodable yet.
    return null;
  }
}

function parseColor(value: string): Layer | null {
  const m = value.match(/rgba?\(([^)]+)\)/);
  if (!m) return null;
  const parts = m[1].split(/[\s,/]+/).filter(Boolean).map(parseFloat);
  if (parts.length < 3 || parts.slice(0, 3).some(Number.isNaN)) return null;
  return { r: parts[0], g: parts[1], b: parts[2], a: parts.length > 3 && !Number.isNaN(parts[3]) ? parts[3] : 1 };
}

/** "50%" / "12px" against a free space (box minus drawn size); "auto" -> undefined. */
function length(token: string | undefined, basis: number): number | undefined {
  if (!token || token === "auto") return undefined;
  if (token.endsWith("%")) return (parseFloat(token) / 100) * basis;
  if (token.endsWith("px")) return parseFloat(token);
  return undefined;
}

type Placement = { sx: number; sy: number; offX: number; offY: number };

function place(
  boxW: number,
  boxH: number,
  natW: number,
  natH: number,
  size: string,
  position: string,
  fillWhenAuto: boolean,
): Placement {
  let sx = 1;
  let sy = 1;
  if (size === "cover") sx = sy = Math.max(boxW / natW, boxH / natH);
  else if (size === "contain") sx = sy = Math.min(boxW / natW, boxH / natH);
  else if (size === "scale-down") sx = sy = Math.min(1, boxW / natW, boxH / natH);
  else if (size === "fill") {
    sx = boxW / natW;
    sy = boxH / natH;
  } else if (size === "none") {
    sx = sy = 1;
  } else {
    const [wTok, hTok] = size.split(/\s+/);
    const w = length(wTok, boxW);
    const h = length(hTok, boxH);
    if (w !== undefined && h !== undefined) {
      sx = w / natW;
      sy = h / natH;
    } else if (w !== undefined) {
      sx = sy = w / natW;
    } else if (h !== undefined) {
      sx = sy = h / natH;
    } else if (fillWhenAuto) {
      sx = boxW / natW;
      sy = boxH / natH;
    }
  }
  const [pxTok, pyTok] = position.split(/\s+/);
  const offX = length(pxTok, boxW - natW * sx) ?? 0;
  const offY = length(pyTok ?? pxTok, boxH - natH * sy) ?? 0;
  return { sx, sy, offX, offY };
}

function sampleSource(
  source: CanvasImageSource,
  natW: number,
  natH: number,
  rect: DOMRect,
  size: string,
  position: string,
  repeat: boolean,
  x: number,
  y: number,
  fillWhenAuto: boolean,
): Layer | null {
  if (!natW || !natH || !rect.width || !rect.height) return null;
  const p = place(rect.width, rect.height, natW, natH, size, position, fillWhenAuto);
  let ix = (x - rect.left - p.offX) / p.sx;
  let iy = (y - rect.top - p.offY) / p.sy;
  if (repeat) {
    ix = ((ix % natW) + natW) % natW;
    iy = ((iy % natH) + natH) % natH;
  } else if (ix < 0 || iy < 0 || ix >= natW || iy >= natH) {
    return null;
  }
  // A few screen pixels wide, so single noisy pixels don't decide the colour.
  const sw = Math.max(1, Math.min(natW - Math.floor(ix), Math.round(3 / p.sx)));
  const sh = Math.max(1, Math.min(natH - Math.floor(iy), Math.round(3 / p.sy)));
  return pixelFrom(source, Math.floor(ix), Math.floor(iy), sw, sh);
}

function layersAt(x: number, y: number): Layer[] {
  const layers: Layer[] = [];
  const add = (l: Layer | null, opacity: number): boolean => {
    if (!l) return false;
    const a = l.a * opacity;
    if (a <= 0.01) return false;
    layers.push({ r: l.r, g: l.g, b: l.b, a });
    return a >= 0.99;
  };

  for (const el of document.elementsFromPoint(x, y)) {
    const cs = getComputedStyle(el);
    if (cs.visibility === "hidden") continue;
    const opacity = parseFloat(cs.opacity);
    if (opacity < 0.05) continue;
    const rect = el.getBoundingClientRect();

    if (el instanceof HTMLImageElement && el.complete && el.naturalWidth) {
      const l = sampleSource(el, el.naturalWidth, el.naturalHeight, rect, cs.objectFit, cs.objectPosition, false, x, y, true);
      if (add(l, opacity)) break;
    } else if (el instanceof HTMLVideoElement && el.readyState >= 2 && el.videoWidth) {
      const l = sampleSource(el, el.videoWidth, el.videoHeight, rect, cs.objectFit, cs.objectPosition, false, x, y, true);
      if (add(l, opacity)) break;
    }

    const url = cs.backgroundImage.match(/url\(["']?([^"')]+)["']?\)/)?.[1];
    if (url) {
      const img = loadImage(url);
      if (img) {
        const repeat = cs.backgroundRepeat.startsWith("repeat");
        const l = sampleSource(
          img,
          img.naturalWidth,
          img.naturalHeight,
          rect,
          cs.backgroundSize,
          cs.backgroundPosition,
          repeat,
          x,
          y,
          false,
        );
        if (add(l, opacity)) break;
      }
    }

    const bg = parseColor(cs.backgroundColor);
    if (add(bg, opacity)) break;
  }
  return layers;
}

function blendedAt(x: number, y: number): Rgb {
  const layers = layersAt(x, y);
  let out: Rgb = { r: 255, g: 255, b: 255 };
  for (let i = layers.length - 1; i >= 0; i--) {
    const l = layers[i];
    out = { r: out.r * (1 - l.a) + l.r * l.a, g: out.g * (1 - l.a) + l.g * l.a, b: out.b * (1 - l.a) + l.b * l.a };
  }
  return out;
}

const hex = (n: number) => Math.round(Math.max(0, Math.min(255, n))).toString(16).padStart(2, "0");

/** The colour along the top edge of the page, as #rrggbb. */
export function sampleTopEdgeColor(): string {
  const w = window.innerWidth;
  const samples = [0.2, 0.5, 0.8].map((f) => blendedAt(Math.round(w * f), 1));
  const avg = samples.reduce((s, c) => ({ r: s.r + c.r, g: s.g + c.g, b: s.b + c.b }), { r: 0, g: 0, b: 0 });
  return `#${hex(avg.r / samples.length)}${hex(avg.g / samples.length)}${hex(avg.b / samples.length)}`;
}
