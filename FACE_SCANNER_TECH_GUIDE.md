# FaceScanner Technical Implementation Guide

> **For Frontend Team**: This document explains the FacePhys rPPG (remote photoplethysmography) integration implemented in the FaceScanner component. Use this as a reference when working with the face scanning feature.

---

## Overview

The FaceScanner uses **FacePhys**, a deep learning model that extracts heart rate and HRV (Heart Rate Variability) from facial video using rPPG technology. The system runs entirely in the browser using TensorFlow Lite via Web Workers.

### What It Does
- **Real-time face detection** using MediaPipe BlazeFace
- **rPPG signal extraction** using FacePhys neural network
- **Heart rate calculation** from BVP (Blood Volume Pulse) signal
- **HRV analysis** (SDNN, RMSSD, pNN50)
- **Stress level estimation**
- **AI-powered health report** via OpenAI GPT-4o-mini
- **Visual feedback**: ROI crop, attention heatmap, heart state trajectory

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        FaceScanner.tsx                          │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐             │
│  │   Camera    │  │   Canvas    │  │  Visualize  │             │
│  │   Input     │→ │   Overlay   │→ │   Drawers   │             │
│  └─────────────┘  └─────────────┘  └─────────────┘             │
└────────────────────┬────────────────────────────────────────────┘
                     │ processFrame() every 33ms
                     ▼
┌─────────────────────────────────────────────────────────────────┐
│                      Web Workers (3)                              │
│  ┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐   │
│  │ inference_worker│ │   psd_worker    │ │   hrv_worker    │   │
│  │                 │ │                 │ │                 │   │
│  │ • Face detection│ │ • SQI model     │ │ • HRV metrics   │   │
│  │ • FacePhys model│ │ • PSD analysis  │ │ • Peak detection│   │
│  │ • BVP extraction│ │ • HR calculation│ │ • Stress index  │   │
│  └─────────────────┘ └─────────────────┘ └─────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────────┐
│                   FaceReportPage.tsx                              │
│  • Dark-themed UI with metrics cards                              │
│  • Real-time heart rate waveform chart (Recharts)                 │
│  • AI health summary & insights                                   │
│  • HRV time domain metrics                                        │
│  • Risk factors & recommendations                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## Key Files Reference

### Core Components

| File | Purpose | Lines |
|------|---------|-------|
| `src/components/FaceScanner/FaceScanner.tsx` | Main scanning component | ~800 |
| `src/FaceReportPage.tsx` | Report display page | ~900 |
| `src/components/FaceScanner/visualizations.ts` | Canvas drawing functions | ~200 |

### Services & Types

| File | Purpose |
|------|---------|
| `src/services/openaiReport.ts` | OpenAI GPT-4o-mini integration |
| `src/types/rppg.ts` | TypeScript interfaces (RppgMetrics, CombinedReportData) |
| `src/utils/rppgHelpers.ts` | Utility functions (Kalman filter, status colors) |

### Workers (Runtime)

| File | Purpose |
|------|---------|
| `public/workers/inference_worker.js` | Face detection + FacePhys inference |
| `public/workers/psd_worker.js` | Signal quality + heart rate calculation |
| `public/workers/hrv_worker.js` | HRV metrics + stress analysis |

### Workers (TypeScript Source)

| File | Purpose |
|------|---------|
| `src/workers/inference_worker.ts` | Source for inference worker |
| `src/workers/psd_worker.ts` | Source for PSD worker |
| `src/workers/hrv_worker.ts` | Source for HRV worker |
| `src/workers/index.ts` | Worker type definitions |

### Model Files (Required at Runtime)

| File | Size | Purpose |
|------|------|---------|
| `public/models/blaze_face_short_range.tflite` | 230 KB | Face detection |
| `public/models/model.tflite` | 1.15 MB | FacePhys main model |
| `public/models/proj.tflite` | 20 KB | Projection layer |
| `public/models/psd_model.tflite` | 25 KB | PSD/HR calculation |
| `public/models/sqi_model.tflite` | 51 KB | Signal quality index |
| `public/models/state.gz` | 154 KB | Initial model state |

---

## Data Flow

### 1. Initialization Phase

```typescript
// FaceScanner.tsx
const initRppgWorkers = async () => {
  // 1. Load model files via multi-path strategy
  const modelBuffer = await fetchModel('model.tflite');
  const stateJson = await fetchState('state.gz');
  const projBuffer = await fetchModel('proj.tflite');
  
  // 2. Initialize workers with Promise-based wait
  const initPromises = workers.map(worker => 
    new Promise((resolve, reject) => {
      worker.onmessage = (e) => {
        if (e.data.type === 'initDone') resolve();
        if (e.data.type === 'error') reject(e.data.msg);
      };
      worker.postMessage({ type: 'init', payload: {...} });
    })
  );
  
  await Promise.all(initPromises);
};
```

### 2. Processing Loop (33ms/frame)

```typescript
const processFrame = async () => {
  // 1. Detect face using MediaPipe
  const faces = await faceDetector.detectForVideo(video, timestamp);
  
  // 2. Crop face region (96x96)
  const croppedImage = cropFace(video, bbox);
  
  // 3. Send to inference worker
  inferenceWorker.postMessage({
    type: 'input',
    payload: {
      image: croppedImage.data,
      width: 96,
      height: 96,
      timestamp: Date.now()
    }
  });
};
```

### 3. Worker Message Flow

```
Video Frame
    ↓
inference_worker.js
    ├── Detects face → draws bbox
    ├── Runs FacePhys → extracts BVP
    └── Sends {type: 'result', payload: {value, fm1, ssm1}}
    ↓
psd_worker.js
    ├── Receives BVP value
    ├── Computes SQI (signal quality)
    ├── Runs PSD analysis
    └── Sends {type: 'result', payload: {hr, sqi, psd, peak}}
    ↓
hrv_worker.js
    ├── Receives peaks
    ├── Calculates HRV metrics (SDNN, RMSSD, pNN50)
    ├── Estimates stress level
    └── Sends {type: 'metrics', payload: {...}}
```

---

## Worker Message Protocol

### inference_worker.js

```javascript
// Initialize
{ type: 'init', payload: { modelBuffer, stateJson, projBuffer } }

// Input frame
{ type: 'input', payload: { image: Uint8Array, width: 96, height: 96, timestamp } }

// Result
{ type: 'result', payload: { 
  value: number,      // BVP value
  timestamp: number, 
  fm1: Float32Array,  // Feature map for heatmap
  ssm1: Float32Array  // State for trajectory
}}

// Init confirmation
{ type: 'initDone' }
```

### psd_worker.js

```javascript
// Initialize
{ type: 'init', payload: { sqiBuffer, psdBuffer } }

// Process BVP
{ type: 'input', payload: { value, timestamp } }

// Result
{ type: 'result', payload: { 
  sqi: number,        // Signal quality 0-1
  hr: number,         // Heart rate BPM
  freq: number[],     // Frequency data
  psd: number[],      // Power spectral density
  peak: boolean,      // Peak detected
  time: number        // Timestamp
}}

// Init confirmation
{ type: 'initDone' }
```

### hrv_worker.js

```javascript
// Initialize
{ type: 'init' }

// Process peak
{ type: 'peak', payload: { timestamp, hr } }

// Get metrics
{ type: 'get_metrics' }

// Metrics result
{ type: 'metrics', payload: {
  sdnn: number,
  rmssd: number,
  pnn50: number,
  stressIndex: number,
  stressLevel: string
}}

// Get full data (for report)
{ type: 'get_full_data' }

// Full data result
{ type: 'full_data', payload: CompleteMetrics }

// Init confirmation
{ type: 'initDone' }
```

---

## Visualization System

Three canvas elements display real-time visualizations:

### 1. ROI Crop Canvas (`roiCanvasRef`)

Shows the 96x96 face region being fed to the model.

```typescript
const updateRoiCanvas = (croppedImage: ImageData) => {
  const canvas = roiCanvasRef.current;
  const ctx = canvas.getContext('2d');
  ctx.putImageData(croppedImage, 0, 0);
};
```

### 2. Attention Heatmap (`heatmapCanvasRef`)

Visualizes FM1 feature activations as a heatmap.

```typescript
drawHeatmap(ctx: CanvasRenderingContext2D, fm1: Float32Array) {
  // FM1 is 6x6 feature map, upsampled to canvas size
  // Color scheme: blue → purple → red → yellow
}
```

### 3. Heart State Trajectory (`trajCanvasRef`)

Plots SSM1 state evolution over time.

```typescript
drawTrajectory(ctx: CanvasRenderingContext2D, ssm1History: TrajPoint[]) {
  // Draws animated path with color gradient
  // Newest points: red/orange
  // Oldest points: blue/green
}
```

### 4. Face Bounding Box (main `canvasRef`)

Red rectangle overlay on detected face with mirror correction.

---

## OpenAI Integration

After scan completes, an AI health report is generated:

```typescript
// src/services/openaiReport.ts
const aiReport = await generateHealthReport({
  vitals: { heartRate, signalQuality, breathingRate },
  hrv: { sdnn, rmssd, pnn50 },
  stress: { level, index },
  metadata: { scanDurationSeconds, timestamp }
});

// Returns:
{
  summary: string;           // Overall health assessment
  insights: string[];        // Key observations
  recommendations: string[]; // Actionable tips
  riskFactors: string[];     // Areas to monitor
  disclaimer: string;        // Medical disclaimer
}
```

### Prompt Strategy
- Uses GPT-4o-mini for cost efficiency
- Structured JSON response format
- Includes medical disclaimer
- Fallback to mock data if API fails

---

## Key Technical Decisions

### 1. Path Resolution Strategy

Models and workers are loaded using multi-path fallback:

```typescript
const paths = [
  `models/${filename}`,           // Relative
  `/models/${filename}`,          // Absolute
  `${import.meta.env.BASE_URL}models/${filename}` // Vite base
];
```

This ensures compatibility with:
- Development (`npm run dev`)
- Production builds
- Subdirectory deployments
- Custom base URLs

### 2. Worker Initialization

Workers must confirm `initDone` before scanning starts:

```typescript
const initPromises = workers.map(worker => 
  new Promise<void>((resolve, reject) => {
    const timeout = setTimeout(() => reject(new Error('Timeout')), 30000);
    worker.onmessage = (e) => {
      if (e.data.type === 'initDone') { 
        clearTimeout(timeout); 
        resolve(); 
      }
    };
  })
);
```

### 3. Rules of Hooks Compliance

All hooks must be called before any conditional returns:

```typescript
const FaceReportPage = () => {
  // 1. All hooks first
  const [report, setReport] = useState(null);
  const insights = useMemo(() => {...}, [report]);
  const chartData = useMemo(() => {...}, [report]);
  
  // 2. Then conditional returns
  if (error) return <ErrorView />;
  if (!report) return <LoadingView />;
  
  // 3. Main render
  return <ReportView />;
};
```

### 4. Chart Data Format

Timestamps converted to relative seconds for X-axis:

```typescript
const chartData = rppg.hrHistory.map((point, index, arr) => {
  const startTime = arr[0]?.time || 0;
  return {
    time: (point.time - startTime) / 1000, // seconds from start
    hr: point.hr,
    sqi: point.sqi
  };
});
```

---

## Common Issues & Solutions

### Issue: "Failed to fetch" model files

**Cause**: Incorrect path resolution in production

**Solution**: Multi-path strategy already implemented. Check browser Network tab to see which paths are attempted.

### Issue: "Worker load error"

**Cause**: Worker files not found at expected path

**Solution**: Workers use same multi-path strategy as models. Ensure `public/workers/` exists in build output.

### Issue: "Heart rate monitoring initialization failed"

**Cause**: Workers not responding with `initDone`

**Solution**: Check browser console for worker errors. LiteRT WASM may fail to load from CDN in some environments.

### Issue: React hooks order violation

**Cause**: Hook called after conditional return

**Solution**: Move ALL hooks to top of component, before any `if (error)` returns.

### Issue: Chart shows "-1 width/height" error

**Cause**: Recharts container has no explicit dimensions

**Solution**: Wrap `ResponsiveContainer` in div with `minHeight: '300px'`.

---

## Environment Variables

Required in `.env`:

```bash
# OpenAI API Key (required for AI health reports)
VITE_OPENAI_API_KEY=sk-...
```

Note: Must use `VITE_` prefix for Vite to expose to client.

---

## Browser Requirements

- **HTTPS or localhost** (required for camera access)
- **Web Workers** support
- **MediaDevices API** (getUserMedia)
- **WebGL** (for TensorFlow Lite)

Tested on:
- Chrome/Edge (latest)
- Firefox (latest)
- Safari (iOS 14.3+)

---

## Modification Guide

### Adding New Metrics

1. Add to `src/types/rppg.ts`:
```typescript
interface RppgMetrics {
  // existing...
  newMetric: { value: number; status: string };
}
```

2. Calculate in `hrv_worker.ts`:
```typescript
// In processPeak or get_metrics
const newMetric = calculateNewMetric(rrIntervals);
```

3. Display in `FaceReportPage.tsx`:
```typescript
<MetricCard 
  title="New Metric" 
  value={rppg.newMetric.value} 
  status={rppg.newMetric.status}
/>
```

### Changing Visualization Colors

Edit `src/components/FaceScanner/visualizations.ts`:

```typescript
// For heatmap
const color = getHeatmapColor(value); // Modify this function

// For trajectory
const hue = 240 - (index / total) * 240; // Blue to Red
```

### Modifying OpenAI Prompt

Edit `src/services/openaiReport.ts`:

```typescript
const prompt = `
  You are a health analysis AI...
  // Modify this prompt
`;
```

---

## Build Commands

```bash
# Development
npm run dev

# Production build
npm run build

# Preview production build
npm run preview
```

---

## File Size Notes

- Model files total: ~1.6 MB
- Worker files total: ~25 KB
- OpenAI chunk: ~105 KB (lazy loaded)

Total additional download: ~1.7 MB on first load.

---

## Debugging Tips

1. **Enable verbose logging**: Check browser console for `[FaceScanner]` prefixed logs
2. **Test workers**: Open `chrome://inspect/#workers` to debug Web Workers
3. **Check model loading**: Network tab → filter by "tflite"
4. **Monitor memory**: Performance tab → Memory → Take heap snapshots

---

## Resources

- **FacePhys Paper**: [arXiv:2303.11508](https://arxiv.org/abs/2303.11508)
- **MediaPipe BlazeFace**: [Documentation](https://developers.google.com/mediapipe/solutions/vision/face_detector)
- **TensorFlow Lite JS**: [GitHub](https://github.com/tensorflow/tfjs)
- **HRV Standards**: [Task Force 1996](https://circ.ahajournals.org/content/93/5/1043)

---

## Questions?

If you need to modify or debug the FaceScanner:

1. Check this guide first
2. Review `AGENTS.md` in project root (if available)
3. Check worker console logs in browser DevTools
4. Test with `test-rppg.html` (if available in your branch)

---

*Last Updated: 2026-02-04*
*Integration: FacePhys rPPG v1.0*
