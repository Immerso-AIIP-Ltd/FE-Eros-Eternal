// Pure canvas draw functions for FaceScanner visualizations
// Ported from FacePhys-Demo VisEngine

/**
 * Draw a red bounding box on the overlay canvas.
 * Accounts for CSS mirror (scaleX(-1)) on the video by flipping x coordinates.
 */
export function drawFaceBbox(
  canvas: HTMLCanvasElement,
  bbox: { x: number; y: number; w: number; h: number },
  videoWidth: number,
  videoHeight: number
): void {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  // Match overlay canvas size to video natural size
  if (canvas.width !== videoWidth || canvas.height !== videoHeight) {
    canvas.width = videoWidth;
    canvas.height = videoHeight;
  }

  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Mirror x to match the CSS scaleX(-1) on the video element
  const mirroredX = videoWidth - bbox.x - bbox.w;

  ctx.strokeStyle = '#ff0000be';
  ctx.lineWidth = 2;
  ctx.strokeRect(mirroredX, bbox.y, bbox.w, bbox.h);
}

/**
 * Smoothed min/max range for stable heatmap rendering.
 */
export interface HeatmapRange {
  min: number;
  max: number;
}

/**
 * Draw a heatmap visualization of a feature map (fm1-fm4).
 * Uses blue -> purple -> red -> yellow color gradient.
 */
export function drawHeatmap(
  canvas: HTMLCanvasElement,
  data: Float32Array | number[],
  range: HeatmapRange
): HeatmapRange {
  const ctx = canvas.getContext('2d');
  if (!ctx || !data || data.length === 0) return range;

  const size = Math.sqrt(data.length);
  if (size % 1 !== 0) return range;

  // Find local min/max
  let localMin = Infinity;
  let localMax = -Infinity;
  for (let i = 0; i < data.length; i++) {
    if (data[i] < localMin) localMin = data[i];
    if (data[i] > localMax) localMax = data[i];
  }

  // Smooth range update (exponential moving average)
  const alpha = 0.01;
  const smoothed: HeatmapRange = {
    min: range.min * (1 - alpha) + localMin * alpha,
    max: range.max * (1 - alpha) + localMax * alpha,
  };

  const valRange = smoothed.max - smoothed.min || 1;
  const minVal = smoothed.min;

  // Build ImageData
  const imgData = ctx.createImageData(size, size);
  for (let i = 0; i < data.length; i++) {
    let norm = (data[i] - minVal) / valRange;
    norm = Math.max(0, Math.min(1, norm));

    const idx = i * 4;
    let r: number, g: number, b: number;

    if (norm < 0.25) {
      const t = norm / 0.25;
      r = t * 60;
      g = 0;
      b = t * 100;
    } else if (norm < 0.5) {
      const t = (norm - 0.25) / 0.25;
      r = 60 + t * 195;
      g = 0;
      b = 100 - t * 80;
    } else if (norm < 0.75) {
      const t = (norm - 0.5) / 0.25;
      r = 255;
      g = t * 150;
      b = 20;
    } else {
      const t = (norm - 0.75) / 0.25;
      r = 255;
      g = 150 + t * 105;
      b = 20 + t * 235;
    }

    imgData.data[idx] = r;
    imgData.data[idx + 1] = g;
    imgData.data[idx + 2] = b;
    imgData.data[idx + 3] = 255;
  }

  // Draw to temp canvas, then scale up to display canvas
  const tempC = document.createElement('canvas');
  tempC.width = size;
  tempC.height = size;
  const tempCtx = tempC.getContext('2d')!;
  tempCtx.putImageData(imgData, 0, 0);

  ctx.clearRect(0, 0, canvas.width, canvas.height);
  const destSize = Math.min(canvas.width, canvas.height) * 0.95;
  const dx = (canvas.width - destSize) / 2;
  const dy = (canvas.height - destSize) / 2;
  ctx.imageSmoothingEnabled = false;
  ctx.drawImage(tempC, dx, dy, destSize, destSize);

  return smoothed;
}

export interface TrajPoint {
  x: number;
  y: number;
  val: number;
}

/**
 * Draw the SSM1 trajectory as a color-coded Bezier trail with alpha fade.
 */
export function drawTrajectory(
  canvas: HTMLCanvasElement,
  history: TrajPoint[]
): void {
  const ctx = canvas.getContext('2d');
  if (!ctx || history.length < 3) return;

  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Draw cross-hair at center
  const cx = canvas.width / 2;
  const cy = canvas.height / 2;
  ctx.strokeStyle = 'rgba(255,255,255,0.15)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(cx, 0);
  ctx.lineTo(cx, canvas.height);
  ctx.moveTo(0, cy);
  ctx.lineTo(canvas.width, cy);
  ctx.stroke();

  // Find bounds
  let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
  for (const p of history) {
    if (p.x < minX) minX = p.x;
    if (p.x > maxX) maxX = p.x;
    if (p.y < minY) minY = p.y;
    if (p.y > maxY) maxY = p.y;
  }

  let rangeX = maxX - minX;
  let rangeY = maxY - minY;
  if (rangeX < 1e-6) rangeX = 0.001;
  if (rangeY < 1e-6) rangeY = 0.001;
  const padX = rangeX * 0.1;
  const padY = rangeY * 0.1;
  minX -= padX;
  maxX += padX;
  minY -= padY;
  maxY += padY;

  const scaleX = canvas.width / (maxX - minX);
  const scaleY = canvas.height / (maxY - minY);

  const toScreen = (p: TrajPoint) => ({
    x: (p.x - minX) * scaleX,
    y: canvas.height - (p.y - minY) * scaleY,
  });

  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.lineWidth = 3;

  let p0 = toScreen(history[0]);
  for (let i = 1; i < history.length - 1; i++) {
    const p1 = toScreen(history[i]);
    const p2 = toScreen(history[i + 1]);
    const val = history[i].val;

    // Color mapping: blue -> purple -> red based on BVP value
    const t = (val - -1.5) / (1.6 - -1.5);
    let r: number, g: number, b: number;
    if (t < 0.5) {
      const lt = t * 2;
      r = lt * 150;
      g = 20;
      b = 255 - lt * 100;
    } else {
      const lt = (t - 0.5) * 2;
      r = 150 + lt * 105;
      g = 20;
      b = 155 - lt * 155;
    }
    r = Math.max(0, Math.min(255, r));
    b = Math.max(0, Math.min(255, b));

    const alpha = Math.pow(i / history.length, 2);

    ctx.strokeStyle = `rgba(${Math.floor(r)}, ${g}, ${Math.floor(b)}, ${alpha})`;
    ctx.beginPath();
    const midX = (p1.x + p2.x) / 2;
    const midY = (p1.y + p2.y) / 2;
    ctx.moveTo(p0.x, p0.y);
    ctx.quadraticCurveTo(p1.x, p1.y, midX, midY);
    ctx.stroke();
    p0 = { x: midX, y: midY };
  }
}
