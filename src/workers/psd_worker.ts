/**
 * PSD Worker - Power Spectral Density Analysis and Heart Rate Calculation
 */

interface PsdResult {
  sqi: number;
  hr: number;
  freq: number[];
  psd: number[];
  peak: number;
  time: number;
}

let LiteRT: any = null;
let Tensor: any = null;
let sqiModel: any = null;
let psdModel: any = null;
let lastRunTime = 0;
let lowPowerMode = false;

const INPUT_SHAPE = [1, 450];
const WASM_BASE_URL = 'https://cdn.jsdelivr.net/npm/@litertjs/core@0.2.1/wasm/';

self.onmessage = async (e: MessageEvent) => {
  const { type, payload } = e.data;
  try {
    if (type === 'init') await handleInit(payload);
    else if (type === 'run') await handleRun(payload);
    else if (type === 'setMode') { lowPowerMode = payload.isLowPower; }
  } catch (err: any) {
    self.postMessage({ type: 'error', msg: err.toString() });
  }
};

async function handleInit({ sqiBuffer, psdBuffer }: { sqiBuffer: ArrayBuffer; psdBuffer: ArrayBuffer }) {
  const litertModule = await import('https://cdn.jsdelivr.net/npm/@litertjs/core@0.2.1/+esm');
  LiteRT = litertModule;
  Tensor = litertModule.Tensor;

  const originalFetch = (self as any).fetch;
  (self as any).fetch = async (input: string, init?: RequestInit) => {
    if (typeof input === 'string' && input.endsWith('.wasm')) {
      const fileName = input.split('/').pop();
      return originalFetch(`${WASM_BASE_URL}${fileName}`, init);
    }
    return originalFetch(input, init);
  };

  await LiteRT.loadLiteRt(WASM_BASE_URL);
  (self as any).fetch = originalFetch;

  sqiModel = await LiteRT.loadAndCompile(URL.createObjectURL(new Blob([sqiBuffer])), { accelerator: 'wasm' });
  psdModel = await LiteRT.loadAndCompile(URL.createObjectURL(new Blob([psdBuffer])), { accelerator: 'wasm' });

  self.postMessage({ type: 'initDone' });
}

async function handleRun({ inputData }: { inputData: Float32Array }) {
  if (!sqiModel || !psdModel) return;

  const now = performance.now();
  if (lowPowerMode && (now - lastRunTime < 500)) {
    return;
  }
  lastRunTime = now;

  const start = performance.now();

  const data = inputData instanceof Float32Array ? inputData : new Float32Array(inputData);
  const inputTensor = new Tensor(data, INPUT_SHAPE);

  const sqiResults = sqiModel.run([inputTensor]);
  const sqiVal = sqiResults[0] ? sqiResults[0].toTypedArray()[0] : 0;

  if (sqiResults[0]) sqiResults[0].delete();

  const psdResults = psdModel.run([inputTensor]);

  const tHr = psdResults[0];
  const tFreq = psdResults[1];
  const tPsd = psdResults[2];
  const tPeak = psdResults[3];

  const resultPayload: PsdResult = {
    sqi: sqiVal,
    hr: tHr ? tHr.toTypedArray()[0] : 0,
    freq: tFreq ? Array.from(tFreq.toTypedArray()) : [],
    psd: tPsd ? Array.from(tPsd.toTypedArray()) : [],
    peak: tPeak ? tPeak.toTypedArray()[0] : 0,
    time: performance.now() - start
  };

  psdResults.forEach((t: any) => t && t.delete());
  inputTensor.delete();

  self.postMessage({ type: 'result', payload: resultPayload });
}

export {};
