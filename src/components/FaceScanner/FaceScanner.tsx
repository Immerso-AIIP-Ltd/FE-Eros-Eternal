import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import Stars from '../stars';
import type { CombinedReportData, HrHistoryPoint } from '../../types/rppg';
import {
  KalmanFilter1D,
  generateVitals,
  generateHrv,
  generateStress,
  calculateAverage,
  getStatusColorCode
} from '../../utils/rppgHelpers';
import { drawFaceBbox, drawHeatmap, drawTrajectory, HeatmapRange, TrajPoint } from './visualizations';

type ScanState = 'initial' | 'camera' | 'recording' | 'processing' | 'complete';

// Face detection types
interface FaceDetection {
  boundingBox: {
    originX: number;
    originY: number;
    width: number;
    height: number;
  };
  keypoints?: Array<{
    x: number;
    y: number;
    name?: string;
  }>;
}

// Constants for rPPG processing (matching FacePhys-Demo)
const INPUT_BUFFER_SIZE = 450;  // 15 seconds at 30 FPS
const SQI_THRESHOLD = 0.38;
const TARGET_FPS = 30;
const FRAME_INTERVAL = 1000 / TARGET_FPS;
const RECORDING_DURATION = 40; // seconds

const FaceScanner: React.FC = () => {
  const [scanState, setScanState] = useState<ScanState>('initial');
  const [progress, setProgress] = useState<number>(0);
  const [recordedVideo, setRecordedVideo] = useState<Blob | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const [recordingTime, setRecordingTime] = useState<number>(0);
  const [error, setError] = useState<string | null>(null);
  const [isCameraReady, setIsCameraReady] = useState<boolean>(false);
  const [isUploadingData, setIsUploadingData] = useState<boolean>(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const navigate = useNavigate();


  // rPPG State
  const [rppgInitialized, setRppgInitialized] = useState<boolean>(false);
  const [heartRate, setHeartRate] = useState<number>(0);
  const [sqi, setSqi] = useState<number>(0);
  const [faceDetected, setFaceDetected] = useState<boolean>(false);
  const [rppgError, setRppgError] = useState<string | null>(null);

  // rPPG Refs
  const faceDetectorRef = useRef<any>(null);
  const inferenceWorkerRef = useRef<Worker | null>(null);
  const psdWorkerRef = useRef<Worker | null>(null);
  const hrvWorkerRef = useRef<Worker | null>(null);
  const inputBufferRef = useRef<Float32Array>(new Float32Array(INPUT_BUFFER_SIZE));
  const bufferPtrRef = useRef<number>(0);
  const bufferFullRef = useRef<boolean>(false);
  const hrLogRef = useRef<Array<[number, number, number]>>([]); // [timestamp, hr, sqi]
  const apiResponseRef = useRef<any>(null); // Store API PUT response for report page
  const bvpLogRef = useRef<Array<[number, number]>>([]); // [timestamp, bvp_value]
  const lastFaceDetectTimeRef = useRef<number>(0);
  const animationFrameRef = useRef<number | null>(null);
  const lastFrameTimeRef = useRef<number>(0);
  const dvalRef = useRef<number>(1 / 30); // Smoothed frame dt in seconds (matching FacePhys-Demo)
  const lastCaptureTimeRef = useRef<number>(0);
  const kalmanFiltersRef = useRef<{
    x?: KalmanFilter1D;
    y?: KalmanFilter1D;
    w?: KalmanFilter1D;
    h?: KalmanFilter1D;
  }>({});

  // Visualization refs
  const overlayCanvasRef = useRef<HTMLCanvasElement>(null);
  const roiCanvasRef = useRef<HTMLCanvasElement>(null);
  const heatmapCanvasRef = useRef<HTMLCanvasElement>(null);
  const trajCanvasRef = useRef<HTMLCanvasElement>(null);
  const projOutputRef = useRef<Record<string, Float32Array> | null>(null);
  const trajHistoryRef = useRef<TrajPoint[]>([]);
  const heatmapRangeRef = useRef<HeatmapRange>({ min: 0, max: 1 });
  const faceBboxRef = useRef<{ x: number; y: number; w: number; h: number } | null>(null);

  // Check if browser supports camera
  const checkCameraSupport = (): boolean => {
    const isSecureContext = window.isSecureContext;
    const hostname = window.location.hostname;

    const isLocalhost = hostname === 'localhost' ||
      hostname === '127.0.0.1' ||
      hostname === '[::1]';


    const isLocalNetwork = /^192\.168\.\d+\.\d+$/.test(hostname) ||
      /^10\.\d+\.\d+\.\d+$/.test(hostname) ||
      /^172\.(1[6-9]|2[0-9]|3[0-1])\.\d+\.\d+$/.test(hostname);


    if (!isSecureContext && !isLocalhost && !isLocalNetwork) {
      setError('Camera access requires HTTPS. Please run this app on HTTPS or localhost.');
      return false;
    }

    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setError('Camera access is not supported in this browser. Please use Chrome, Firefox, or Safari.');
      return false;
    }

    return true;
  };


  // Get ordered buffer for PSD processing
  const getOrderedBuffer = useCallback((): Float32Array => {
    const ordered = new Float32Array(INPUT_BUFFER_SIZE);
    for (let i = 0; i < INPUT_BUFFER_SIZE; i++) {
      const idx = (bufferPtrRef.current + i) % INPUT_BUFFER_SIZE;
      ordered[i] = inputBufferRef.current[idx];
    }
    return ordered;
  }, []);

  // Initialize MediaPipe FaceDetector
  const initFaceDetector = async (): Promise<boolean> => {
    try {
      const vision = await import('@mediapipe/tasks-vision');
      const { FaceDetector, FilesetResolver } = vision;

      const filesetResolver = await FilesetResolver.forVisionTasks(
        'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.21/wasm'
      );

      try {
        faceDetectorRef.current = await FaceDetector.createFromOptions(
          filesetResolver,
          {
            baseOptions: {
              modelAssetPath: '/models/blaze_face_short_range.tflite',
              delegate: 'GPU',
            },
            runningMode: 'VIDEO',
          }
        );
      } catch {
        // GPU delegate not available, fall back to CPU
        faceDetectorRef.current = await FaceDetector.createFromOptions(
          filesetResolver,
          {
            baseOptions: {
              modelAssetPath: '/models/blaze_face_short_range.tflite',
              delegate: 'CPU',
            },
            runningMode: 'VIDEO',
          }
        );
      }
      return true;
    } catch (err) {
      console.error('Failed to initialize face detector:', err);
      setRppgError('Face detection initialization failed. Continuing with video only.');
      return false;
    }
  };

  // Initialize rPPG workers - waits for all workers to confirm initialization
  const initRppgWorkers = async (): Promise<boolean> => {
    try {
      // Helper function to fetch model with error handling
      // Uses relative path to work with any base URL
      const fetchModel = async (filename: string, name: string): Promise<Response> => {
        try {
          // Try multiple path strategies
          const paths = [
            `models/${filename}`,           // Relative to current path
            `/models/${filename}`,          // Absolute from root
            `${import.meta.env.BASE_URL || ''}models/${filename}` // Vite base URL
          ];

          let lastError: Error | null = null;

          for (const path of paths) {
            try {
              console.log(`Fetching ${name} from: ${path}`);
              const res = await fetch(path);
              if (res.ok) {
                console.log(`✅ ${name} fetched successfully from ${path}`);
                return res;
              }
            } catch (err: any) {
              lastError = err;
              console.warn(`Failed to fetch from ${path}:`, err.message);
            }
          }

          throw lastError || new Error('All paths failed');
        } catch (err: any) {
          console.error(`❌ Failed to fetch ${name}:`, err.message);
          throw new Error(`Failed to fetch ${name}: ${err.message}`);
        }
      };

      // Fetch model files individually for better error reporting
      console.log('Starting model file fetch...');
      console.log('Current location:', window.location.href);
      console.log('Base URL:', import.meta.env.BASE_URL);

      const modelRes = await fetchModel('model.tflite', 'FacePhys Model');
      const projRes = await fetchModel('proj.tflite', 'Projection Layer');
      const sqiRes = await fetchModel('sqi_model.tflite', 'SQI Model');
      const psdRes = await fetchModel('psd_model.tflite', 'PSD Model');
      const stateRes = await fetchModel('state.gz', 'Initial State');

      const modelBuffer = await modelRes.arrayBuffer();
      const projBuffer = await projRes.arrayBuffer();
      const sqiBuffer = await sqiRes.arrayBuffer();
      const psdBuffer = await psdRes.arrayBuffer();

      // Parse state - try JSON directly first (Vite may auto-decompress .gz),
      // then fall back to manual gzip decompression
      let stateJson: any;
      try {
        // Clone the response so we can retry if this fails
        const stateClone = stateRes.clone();
        stateJson = await stateClone.json();
        console.log('State parsed as JSON directly (already decompressed)');
      } catch {
        // Response is still gzip-compressed, decompress manually
        console.log('State needs gzip decompression...');
        const ds = new DecompressionStream('gzip');
        const stateStream = stateRes.body!.pipeThrough(ds);
        stateJson = await new Response(stateStream).json();
        console.log('State decompressed and parsed successfully');
      }

      // Helper to create worker with correct path
      const createWorker = (filename: string): Worker => {
        const paths = [
          `workers/${filename}`,
          `/workers/${filename}`,
          `${import.meta.env.BASE_URL || ''}workers/${filename}`
        ];

        let lastError: Error | null = null;
        for (const path of paths) {
          try {
            console.log(`Trying to load worker from: ${path}`);
            const worker = new Worker(path);
            console.log(`✅ Worker loaded successfully from: ${path}`);
            return worker;
          } catch (err: any) {
            lastError = err;
            console.warn(`Failed to load worker from ${path}:`, err.message);
          }
        }

        throw lastError || new Error(`Failed to create worker ${filename}`);
      };

      // Create workers (loaded from public/ as classic workers, matching FacePhys-Demo)
      inferenceWorkerRef.current = createWorker('inference_worker.js');
      psdWorkerRef.current = createWorker('psd_worker.js');
      hrvWorkerRef.current = createWorker('hrv_worker.js');

      // Initialize workers and wait for initDone confirmation
      const initPromises = [
        // Inference worker init
        new Promise<void>((resolve, reject) => {
          const worker = inferenceWorkerRef.current!;
          const timeout = setTimeout(() => {
            reject(new Error('Inference worker initialization timeout (30s). Check LiteRT CDN connectivity.'));
          }, 30000);

          worker.onmessage = (e: MessageEvent) => {
            if (e.data.type === 'initDone') {
              clearTimeout(timeout);
              console.log('Inference worker initialized successfully');
              resolve();
            } else if (e.data.type === 'error') {
              clearTimeout(timeout);
              reject(new Error(`Inference worker error: ${e.data.msg}`));
            }
          };

          worker.onerror = (err) => {
            clearTimeout(timeout);
            reject(new Error(`Inference worker load error: ${err.message}`));
          };

          worker.postMessage({
            type: 'init',
            payload: { modelBuffer, stateJson, projBuffer }
          }, [modelBuffer, projBuffer]);
        }),

        // PSD worker init
        new Promise<void>((resolve, reject) => {
          const worker = psdWorkerRef.current!;
          const timeout = setTimeout(() => {
            reject(new Error('PSD worker initialization timeout (30s). Check LiteRT CDN connectivity.'));
          }, 30000);

          worker.onmessage = (e: MessageEvent) => {
            if (e.data.type === 'initDone') {
              clearTimeout(timeout);
              console.log('PSD worker initialized successfully');
              resolve();
            } else if (e.data.type === 'error') {
              clearTimeout(timeout);
              reject(new Error(`PSD worker error: ${e.data.msg}`));
            }
          };

          worker.onerror = (err) => {
            clearTimeout(timeout);
            reject(new Error(`PSD worker load error: ${err.message}`));
          };

          worker.postMessage({
            type: 'init',
            payload: { sqiBuffer, psdBuffer }
          }, [sqiBuffer, psdBuffer]);
        }),

        // HRV worker init
        new Promise<void>((resolve, reject) => {
          const worker = hrvWorkerRef.current!;
          const timeout = setTimeout(() => {
            reject(new Error('HRV worker initialization timeout (10s)'));
          }, 10000);

          worker.onmessage = (e: MessageEvent) => {
            if (e.data.type === 'initDone') {
              clearTimeout(timeout);
              console.log('HRV worker initialized successfully');
              resolve();
            } else if (e.data.type === 'error') {
              clearTimeout(timeout);
              reject(new Error(`HRV worker error: ${e.data.msg}`));
            }
          };

          worker.onerror = (err) => {
            clearTimeout(timeout);
            reject(new Error(`HRV worker load error: ${err.message}`));
          };

          worker.postMessage({ type: 'init' });
        })
      ];

      // Wait for all workers to initialize
      await Promise.all(initPromises);

      // NOW set up the permanent message handlers for runtime
      setupWorkerHandlers();

      console.log('All rPPG workers initialized successfully');
      return true;
    } catch (err: any) {
      console.error('Failed to initialize rPPG workers:', err);
      setRppgError(`Heart rate monitoring initialization failed: ${err.message}. Continuing with video only.`);
      return false;
    }
  };

  // Size overlay canvas to match video when recording starts
  useEffect(() => {
    if (scanState === 'recording' && overlayCanvasRef.current && videoRef.current) {
      const resizeOverlay = () => {
        const video = videoRef.current;
        const canvas = overlayCanvasRef.current;
        if (video && canvas) {
          // Get the displayed size
          const rect = video.getBoundingClientRect();
          canvas.style.width = rect.width + 'px';
          canvas.style.height = rect.height + 'px';
        }
      };

      resizeOverlay();
      window.addEventListener('resize', resizeOverlay);
      return () => window.removeEventListener('resize', resizeOverlay);
    }
  }, [scanState]);

  // Set up worker message handlers for runtime (called after init is complete)
  const setupWorkerHandlers = () => {
    // Inference worker - receives BVP values
    if (inferenceWorkerRef.current) {
      inferenceWorkerRef.current.onmessage = (e: MessageEvent) => {
        if (e.data.type === 'error') {
          console.error('Inference worker error:', e.data.msg);
          return;
        }
        if (e.data.type === 'result') {
          const { value, timestamp, projOutput } = e.data.payload;

          // Store for visualizations
          if (projOutput && projOutput.ssm1) {
            projOutputRef.current = projOutput;

            // Update trajectory history from ssm1
            const ssm1 = projOutput.ssm1;
            if (ssm1 && ssm1.length >= 2) {
              trajHistoryRef.current.push({ x: ssm1[0], y: ssm1[1], val: value });
              if (trajHistoryRef.current.length > 300) {
                trajHistoryRef.current.shift();
              }
            }
          }

          // Store BVP value
          bvpLogRef.current.push([timestamp, value]);

          // Add to circular buffer for PSD
          inputBufferRef.current[bufferPtrRef.current] = value;
          bufferPtrRef.current = (bufferPtrRef.current + 1) % INPUT_BUFFER_SIZE;
          if (bufferPtrRef.current === 0) bufferFullRef.current = true;

          // Send to PSD worker (only when buffer has enough data - same as FacePhys-Demo)
          if (bufferFullRef.current || bufferPtrRef.current > 100) {
            const orderedData = getOrderedBuffer();
            psdWorkerRef.current?.postMessage({
              type: 'run',
              payload: { inputData: orderedData }
            });
          }
        }
      };

      inferenceWorkerRef.current.onerror = (err) => {
        console.error('Inference worker runtime error:', err);
      };
    }

    // PSD worker - receives HR and SQI
    if (psdWorkerRef.current) {
      psdWorkerRef.current.onmessage = (e: MessageEvent) => {
        if (e.data.type === 'error') {
          console.error('PSD worker error:', e.data.msg);
          return;
        }
        if (e.data.type === 'result') {
          const { sqi: sqiVal, hr } = e.data.payload;
          setSqi(sqiVal);

          const timeSinceFace = performance.now() - lastFaceDetectTimeRef.current;
          const hasFace = timeSinceFace < 500;
          const isReliable = sqiVal > SQI_THRESHOLD && hasFace;

          if (isReliable && hr > 0) {
            // Convert HR to BPM (same formula as FacePhys-Demo: hr / 30.0 / dval)
            const hrValue = hr / 30.0 / dvalRef.current;
            setHeartRate(hrValue);

            // Send to HRV worker
            hrvWorkerRef.current?.postMessage({
              type: 'hr_data',
              payload: {
                hr: hrValue,
                timestamp: Date.now(),
                sqi: sqiVal,
                isValid: true
              }
            });

            // Log HR data
            hrLogRef.current.push([Date.now(), hrValue, sqiVal]);
          }
        }
      };

      psdWorkerRef.current.onerror = (err) => {
        console.error('PSD worker runtime error:', err);
      };
    }

    // HRV worker - receives HRV metrics
    if (hrvWorkerRef.current) {
      hrvWorkerRef.current.onmessage = (e: MessageEvent) => {
        if (e.data.type === 'error') {
          console.error('HRV worker error:', e.data.msg);
          return;
        }
        if (e.data.type === 'metrics') {
          // HRV metrics updated, can be used for live display if needed
          console.log('HRV metrics updated:', e.data.payload);
        } else if (e.data.type === 'full_data') {
          // Full data received on recording stop
          console.log('HRV full data:', e.data.payload);
        }
      };

      hrvWorkerRef.current.onerror = (err) => {
        console.error('HRV worker runtime error:', err);
      };
    }
  };

  // Process video frame for rPPG
  const processFrame = useCallback(() => {
    if (!videoRef.current || !faceDetectorRef.current || scanState !== 'recording') return;

    const video = videoRef.current;
    if (video.readyState < 2) return;

    const now = performance.now();
    if (now - lastFrameTimeRef.current < FRAME_INTERVAL) return;
    lastFrameTimeRef.current = now;

    try {
      const detections = faceDetectorRef.current.detectForVideo(video, now);

      if (detections.detections.length > 0) {
        const det = detections.detections[0] as FaceDetection;
        let { originX, originY, width, height } = det.boundingBox;
        lastFaceDetectTimeRef.current = now;
        setFaceDetected(true);

        // Apply Kalman filtering for stability
        if (!kalmanFiltersRef.current.x) {
          kalmanFiltersRef.current.x = new KalmanFilter1D(originX);
          kalmanFiltersRef.current.y = new KalmanFilter1D(originY);
          kalmanFiltersRef.current.w = new KalmanFilter1D(width);
          kalmanFiltersRef.current.h = new KalmanFilter1D(height);
        } else {
          originX = kalmanFiltersRef.current.x.update(originX);
          originY = kalmanFiltersRef.current.y.update(originY);
          width = kalmanFiltersRef.current.w.update(width);
          height = kalmanFiltersRef.current.h.update(height);
        }

        // Store for visualization
        faceBboxRef.current = { x: originX, y: originY, w: width, h: height };

        // Extend height to include forehead (same as FacePhys-Demo: height*1.2, originY -= height*0.2)
        height *= 1.2;
        originY -= height * 0.2;

        // Ensure bounds
        originX = Math.max(0, originX);
        originY = Math.max(0, originY);
        width = Math.min(width, video.videoWidth - originX);
        height = Math.min(height, video.videoHeight - originY);

        // Create canvas for cropping
        const cropCanvas = document.createElement('canvas');
        cropCanvas.width = 36;
        cropCanvas.height = 36;
        const cropCtx = cropCanvas.getContext('2d', { willReadFrequently: true });

        if (cropCtx) {
          // Draw cropped face
          cropCtx.drawImage(video, originX, originY, width, height, 0, 0, 36, 36);

          // Draw to ROI canvas for visualization
          if (roiCanvasRef.current) {
            const roiCtx = roiCanvasRef.current.getContext('2d');
            if (roiCtx) {
              roiCtx.clearRect(0, 0, 36, 36);
              roiCtx.drawImage(cropCanvas, 0, 0);
            }
          }

          // Get image data
          const imgData = cropCtx.getImageData(0, 0, 36, 36);
          const inputFloat32 = new Float32Array(36 * 36 * 3);

          // Normalize to 0-1 (same as FacePhys-Demo)
          for (let i = 0; i < imgData.data.length; i += 4) {
            const idx = i / 4;
            inputFloat32[idx * 3] = imgData.data[i] / 255.0;
            inputFloat32[idx * 3 + 1] = imgData.data[i + 1] / 255.0;
            inputFloat32[idx * 3 + 2] = imgData.data[i + 2] / 255.0;
          }

          // Track actual frame timing (same smoothing as FacePhys-Demo)
          const captureTime = Date.now();
          if (lastCaptureTimeRef.current > 0) {
            const actualDt = (captureTime - lastCaptureTimeRef.current) / 1000;
            dvalRef.current = dvalRef.current * 0.997 + 0.003 * actualDt;
          }
          lastCaptureTimeRef.current = captureTime;

          // Send to inference worker
          inferenceWorkerRef.current?.postMessage({
            type: 'run',
            payload: {
              imgData: inputFloat32,
              dtVal: dvalRef.current,
              timestamp: captureTime
            }
          }, [inputFloat32.buffer]);
        }
      } else {
        setFaceDetected(false);
      }
    } catch (err) {
      console.error('Frame processing error:', err);
    }

    // Draw visualizations
    if (scanState === 'recording') {
      // Draw face bounding box on overlay
      if (overlayCanvasRef.current && faceBboxRef.current && videoRef.current) {
        const video = videoRef.current;
        drawFaceBbox(
          overlayCanvasRef.current,
          faceBboxRef.current,
          video.videoWidth,
          video.videoHeight
        );
      }

      // Draw heatmap from fm1 (first feature map)
      if (heatmapCanvasRef.current && projOutputRef.current?.fm1) {
        heatmapRangeRef.current = drawHeatmap(
          heatmapCanvasRef.current,
          projOutputRef.current.fm1,
          heatmapRangeRef.current
        );
      }

      // Draw trajectory
      if (trajCanvasRef.current && trajHistoryRef.current.length > 2) {
        drawTrajectory(trajCanvasRef.current, trajHistoryRef.current);
      }
    }
  }, [scanState, getOrderedBuffer]);

  // Animation frame loop for rPPG processing
  useEffect(() => {
    if (scanState === 'recording' && rppgInitialized) {
      const loop = () => {
        processFrame();
        animationFrameRef.current = requestAnimationFrame(loop);
      };
      animationFrameRef.current = requestAnimationFrame(loop);
    }

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
    };
  }, [scanState, rppgInitialized, processFrame]);

  // Handle webcam access
  const openCamera = async () => {
    setError(null);
    setIsCameraReady(false);

    setRppgError(null);

    if (!checkCameraSupport()) {
      return;
    }

    try {

      const constraints: MediaStreamConstraints = {
        video: {
          width: { ideal: 1280 },
          height: { ideal: 720 },
          facingMode: 'user',
          frameRate: { ideal: 30 }
        },
        audio: false
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);

      streamRef.current = stream;

      // Set state to camera first to render the video element
      setScanState('camera');


      // Initialize rPPG after camera is ready
      setTimeout(async () => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play()
            .then(async () => {
              setIsCameraReady(true);

              // Initialize rPPG
              const faceDetectorReady = await initFaceDetector();
              const workersReady = await initRppgWorkers();
              setRppgInitialized(faceDetectorReady && workersReady);
            })
            .catch(err => {
              console.error('Error playing video:', err);
              setError('Error starting camera preview. Please try again.');
            });

        }
      }, 50);

    } catch (error: any) {
      console.error('Error accessing camera:', error);

      let errorMessage = 'Could not access camera. ';

      if (error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError') {
        errorMessage += 'Please allow camera access in your browser settings and try again.';
      } else if (error.name === 'NotFoundError' || error.name === 'DevicesNotFoundError') {
        errorMessage += 'No camera found on your device.';
      } else if (error.name === 'NotReadableError' || error.name === 'TrackStartError') {
        errorMessage += 'Camera is already in use by another application.';
      } else if (error.name === 'OverconstrainedError') {
        errorMessage += 'Camera does not support requested resolution.';
      } else if (error.name === 'SecurityError') {
        errorMessage += 'Camera access blocked due to security restrictions. Please use HTTPS or localhost.';
      } else {
        errorMessage += `Error: ${error.message || 'Unknown error occurred.'}`;
      }

      setError(errorMessage);
    }
  };

  // Start recording
  const startRecording = () => {
    if (!streamRef.current) {
      setError('No camera stream available');
      return;
    }

    chunksRef.current = [];

    hrLogRef.current = [];
    bvpLogRef.current = [];
    bufferPtrRef.current = 0;
    bufferFullRef.current = false;
    inputBufferRef.current = new Float32Array(INPUT_BUFFER_SIZE);
    kalmanFiltersRef.current = {};

    // Reset visualization state
    projOutputRef.current = null;
    trajHistoryRef.current = [];
    heatmapRangeRef.current = { min: 0, max: 1 };
    faceBboxRef.current = null;

    // Clear canvas contexts
    if (overlayCanvasRef.current) {
      const ctx = overlayCanvasRef.current.getContext('2d');
      if (ctx) ctx.clearRect(0, 0, overlayCanvasRef.current.width, overlayCanvasRef.current.height);
    }
    if (heatmapCanvasRef.current) {
      const ctx = heatmapCanvasRef.current.getContext('2d');
      if (ctx) ctx.clearRect(0, 0, heatmapCanvasRef.current.width, heatmapCanvasRef.current.height);
    }
    if (trajCanvasRef.current) {
      const ctx = trajCanvasRef.current.getContext('2d');
      if (ctx) ctx.clearRect(0, 0, trajCanvasRef.current.width, trajCanvasRef.current.height);
    }

    dvalRef.current = 1 / 30;
    lastCaptureTimeRef.current = 0;

    // Reset HRV worker
    hrvWorkerRef.current?.postMessage({ type: 'reset' });

    const mimeTypes = [
      'video/webm;codecs=vp9',
      'video/webm;codecs=vp8',
      'video/webm',
      'video/mp4',
      ''
    ];

    let mediaRecorder: MediaRecorder | null = null;

    for (const mimeType of mimeTypes) {
      try {
        if (mimeType === '') {
          mediaRecorder = new MediaRecorder(streamRef.current);
        } else if (MediaRecorder.isTypeSupported(mimeType)) {
          mediaRecorder = new MediaRecorder(streamRef.current, { mimeType });
        }

        if (mediaRecorder) {
          console.log(`Using MIME type: ${mimeType || 'default'}`);
          break;
        }
      } catch (e) {
        console.warn(`MIME type ${mimeType} not supported:`, e);
        continue;
      }
    }

    if (!mediaRecorder) {
      setError('Your browser does not support video recording. Please use a modern browser like Chrome.');
      return;
    }

    mediaRecorder.ondataavailable = (event) => {
      if (event.data && event.data.size > 0) {
        chunksRef.current.push(event.data);
      }
    };

    mediaRecorder.onstop = () => {
      try {
        const blob = new Blob(chunksRef.current, { type: chunksRef.current[0]?.type || 'video/webm' });
        setRecordedVideo(blob);


        const url = URL.createObjectURL(blob);
        setPreviewUrl(url);

        if (streamRef.current) {
          streamRef.current.getTracks().forEach(track => {
            track.stop();
          });
          streamRef.current = null;
        }

        setScanState('processing');
        setProgress(0);
      } catch (err) {
        setError('Error processing recorded video');
        console.error('Error creating video blob:', err);
      }
    };

    mediaRecorder.onerror = (event) => {
      console.error('MediaRecorder error:', event);
      setError('Recording error occurred. Please try again.');
    };

    mediaRecorderRef.current = mediaRecorder;

    try {

      mediaRecorder.start(100);
      setScanState('recording');
      setRecordingTime(0);
      setHeartRate(0);
      setSqi(0);
      setError(null);
    } catch (err) {
      console.error('Error starting recording:', err);
      setError('Failed to start recording. Please try again.');
    }
  };

  // Recording timer and auto-stop after 40 seconds
  useEffect(() => {
    let interval: NodeJS.Timeout;

    if (scanState === 'recording') {
      interval = setInterval(() => {
        setRecordingTime(prev => {
          const newTime = prev + 1;


          if (newTime >= RECORDING_DURATION) {
            stopRecording();
            return RECORDING_DURATION;
          }

          return newTime;
        });
      }, 1000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [scanState]);

  // Processing progress simulation
  useEffect(() => {
    if (scanState === 'processing') {
      const interval = setInterval(() => {
        setProgress((prev) => {
          if (prev >= 100) {
            clearInterval(interval);
            // When processing completes, send data to API
            sendScanDataToAPI();
            return 100;
          }
          return prev + 10;
        });
      }, 200);
      return () => clearInterval(interval);
    }
  }, [scanState]);

  const resetScan = () => {

    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop();
    }
    if (previewUrl && previewUrl.startsWith('blob:')) {
      URL.revokeObjectURL(previewUrl);
    }


    // Clean up workers
    inferenceWorkerRef.current?.terminate();
    psdWorkerRef.current?.terminate();
    hrvWorkerRef.current?.terminate();
    inferenceWorkerRef.current = null;
    psdWorkerRef.current = null;
    hrvWorkerRef.current = null;

    setScanState('initial');
    setProgress(0);
    setRecordedVideo(null);
    setPreviewUrl(null);
    setRecordingTime(0);
    setError(null);
    setIsCameraReady(false);

    setRppgInitialized(false);
    setHeartRate(0);
    setSqi(0);
    setFaceDetected(false);
    hrLogRef.current = [];
    bvpLogRef.current = [];
    kalmanFiltersRef.current = {};

    // Reset visualization refs
    projOutputRef.current = null;
    trajHistoryRef.current = [];
    heatmapRangeRef.current = { min: 0, max: 1 };
    faceBboxRef.current = null;
  };

  // Handle skip to results
  const handleSkip = () => {

    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }


    navigate('/result');
  };

  // Get final rPPG metrics
  const getFinalRppgMetrics = async (): Promise<CombinedReportData['rppg'] | null> => {
    if (!rppgInitialized || hrLogRef.current.length < 5) {
      return null;
    }

    return new Promise((resolve) => {
      const handleHrvData = (e: MessageEvent) => {
        if (e.data.type === 'full_data') {
          hrvWorkerRef.current!.removeEventListener('message', handleHrvData);

          const { metrics } = e.data.payload;

          // Calculate average HR from valid readings
          const validHr = hrLogRef.current.filter(([_, __, s]) => s > SQI_THRESHOLD);
          const avgHr = validHr.length > 0
            ? calculateAverage(validHr.map(([_, hr]) => hr))
            : heartRate || 72;

          // Calculate average SQI
          const avgSqi = hrLogRef.current.length > 0
            ? calculateAverage(hrLogRef.current.map(([_, __, s]) => s))
            : sqi || 0.5;

          // Generate report data
          const hrHistory: HrHistoryPoint[] = hrLogRef.current.map(([time, hr, sqi]) => ({
            time,
            hr: Math.round(hr),
            sqi: Math.round(sqi * 100) / 100
          }));

          resolve({
            vitals: generateVitals(
              avgHr,
              avgSqi,
              metrics.respiratoryRate || 15
            ),
            hrv: generateHrv(
              metrics.sdnn || 0,
              metrics.rmssd || 0,
              metrics.pnn50 || 0,
              metrics.recordingClass || 'insufficient_data'
            ),
            stress: generateStress(
              metrics.stressLevel || 'unknown',
              metrics.stressIndex || 0
            ),
            metadata: {
              timestamp: new Date().toISOString(),
              scanDurationSeconds: recordingTime,
              samplesCollected: hrLogRef.current.length
            },
            hrHistory
          });
        }
      };

      hrvWorkerRef.current?.addEventListener('message', handleHrvData);
      hrvWorkerRef.current?.postMessage({ type: 'get_full_data' });

      // Timeout after 2 seconds
      setTimeout(() => {
        hrvWorkerRef.current?.removeEventListener('message', handleHrvData);
        resolve(null);
      }, 2000);
    });
  };

  // Send scan data to API
  const sendScanDataToAPI = async () => {
    setIsUploadingData(true);
    setUploadError(null);

    try {
      // Get rPPG metrics
      const rppgData = await getFinalRppgMetrics();

      // Generate AI health report
      let aiReport = null;
      try {
        const { generateHealthReport } = await import('../../services/openaiReport');
        const healthData = {
          vitals: {
            heartRate: rppgData?.vitals.heartRate || { value: Math.round(heartRate) || 72, unit: 'BPM', status: 'NORMAL' },
            signalQuality: rppgData?.vitals.signalQuality || { value: sqi || 0.5, percentage: Math.round((sqi || 0.5) * 100), status: 'FAIR' },
            breathingRate: rppgData?.vitals.breathingRate || { value: 15, unit: 'breaths/min', status: 'NORMAL' },
          },
          hrv: {
            sdnn: rppgData?.hrv.sdnn || { value: 45, unit: 'ms', status: 'NORMAL' },
            rmssd: rppgData?.hrv.rmssd || { value: 35, unit: 'ms', status: 'NORMAL' },
            pnn50: rppgData?.hrv.pnn50 || { value: 15, unit: '%', status: 'NORMAL' },
          },
          stress: {
            level: rppgData?.stress.level || 'moderate',
            index: rppgData?.stress.index || 50,
          },
          metadata: {
            scanDurationSeconds: recordingTime,
            timestamp: new Date().toISOString(),
          },
        };
        aiReport = await generateHealthReport(healthData);
      } catch (err) {
        console.error('Failed to generate AI report:', err);
      }

      // Prepare API payload matching the expected format
      const apiPayload = {
        data: {
          metadata: {
            timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19),
            scan_duration_seconds: recordingTime,
            frames_processed: hrLogRef.current.length || 0,
          },
          vitals: {
            heart_rate: {
              value_bpm: rppgData?.vitals.heartRate?.value || Math.round(heartRate) || 72,
            },
            signal_quality: {
              value: rppgData?.vitals.signalQuality?.value || sqi || 0.5,
            },
            blood_pressure: {
              systolic_mmHg: 120, // Default values - adjust based on your actual data
              diastolic_mmHg: 80,
              confidence: 0.5,
            },
          },
          hrv: {
            sdnn: rppgData?.hrv.sdnn?.value || 45,
            rmssd: rppgData?.hrv.rmssd?.value || 35,
            pnn50: rppgData?.hrv.pnn50?.value ? rppgData.hrv.pnn50.value / 100 : 0.15,
            breathing_rate: rppgData?.vitals.breathingRate?.value || 15,
          },
          latency: 0.0,
          ai_report: aiReport || "Health assessment completed successfully.",
        },
      };

      // Send data to API
      const userId = localStorage.getItem('user_id');
      const response = await fetch(
        // 'https://db3e22d7b631.ngrok-free.app/api/v1/health/scan/dbfb40fa-83bc-4f5f-9f13-71429d47b903',
        `http://164.52.205.108:8500/api/v1/health/scan/${userId}`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(apiPayload),
        }
      );

      if (!response.ok) {
        throw new Error(`API request failed with status ${response.status}`);
      }

      const result = await response.json();
      console.log('API response:', result);

      // Store API response for use in report page
      if (result.success) {
        apiResponseRef.current = result.data;
      }

      // Set scan state to complete after successful API call
      setScanState('complete');
    } catch (err) {
      console.error('Error sending data to API:', err);
      setUploadError('Failed to upload scan data. You can still continue.');
      // Still set to complete even if API fails
      setScanState('complete');
    } finally {
      setIsUploadingData(false);
    }
  };

  // Handle continue to results
  const handleContinue = async () => {
    if (!recordedVideo) {
      setError('No video recorded');
      return;
    }

    // Get rPPG metrics for navigation state
    const rppgData = await getFinalRppgMetrics();

    // Generate AI health report for local storage
    let aiReport = null;
    try {
      const { generateHealthReport } = await import('../../services/openaiReport');
      const healthData = {
        vitals: {
          heartRate: rppgData?.vitals.heartRate || { value: Math.round(heartRate) || 72, unit: 'BPM', status: 'NORMAL' },
          signalQuality: rppgData?.vitals.signalQuality || { value: sqi || 0.5, percentage: Math.round((sqi || 0.5) * 100), status: 'FAIR' },
          breathingRate: rppgData?.vitals.breathingRate || { value: 15, unit: 'breaths/min', status: 'NORMAL' },
        },
        hrv: {
          sdnn: rppgData?.hrv.sdnn || { value: 45, unit: 'ms', status: 'NORMAL' },
          rmssd: rppgData?.hrv.rmssd || { value: 35, unit: 'ms', status: 'NORMAL' },
          pnn50: rppgData?.hrv.pnn50 || { value: 15, unit: '%', status: 'NORMAL' },
        },
        stress: {
          level: rppgData?.stress.level || 'moderate',
          index: rppgData?.stress.index || 50,
        },
        metadata: {
          scanDurationSeconds: recordingTime,
          timestamp: new Date().toISOString(),
        },
      };
      aiReport = await generateHealthReport(healthData);
    } catch (err) {
      console.error('Failed to generate AI report:', err);
    }

    // Get stored API response data
    const apiRes = apiResponseRef.current;

    const combinedData: CombinedReportData = {
      success: true,
      uploadedImage: previewUrl || '',
      data: {
        face_analysis_text: '',
        spiritual_interpretation: '',
      },
      rppg: rppgData || {
        vitals: {
          heartRate: { value: Math.round(heartRate) || 72, unit: 'BPM', status: 'NORMAL' },
          signalQuality: { value: sqi || 0.5, percentage: Math.round((sqi || 0.5) * 100), status: 'FAIR' },
          breathingRate: { value: 15, unit: 'breaths/min', status: 'NORMAL' },
        },
        hrv: {
          sdnn: { value: 45, unit: 'ms', status: 'NORMAL' },
          rmssd: { value: 35, unit: 'ms', status: 'NORMAL' },
          pnn50: { value: 15, unit: '%', status: 'NORMAL' },
          recordingClass: 'ultra-short',
        },
        stress: {
          level: 'moderate',
          index: 50,
          description: 'Balanced autonomic state with healthy adaptability to stress.',
        },
        metadata: {
          timestamp: new Date().toISOString(),
          scanDurationSeconds: recordingTime,
          samplesCollected: hrLogRef.current.length || 0,
        },
        hrHistory: hrLogRef.current.map(([time, hr, sqi]) => ({ time, hr: Math.round(hr), sqi })),
      },
      aiReport: apiRes?.ai_report
        ? {
          summary: apiRes.ai_report.summary || '',
          insights: apiRes.ai_report.insights || [],
          recommendations: apiRes.ai_report.recommendations || [],
          riskFactors: (aiReport as any)?.riskFactors || [],
          disclaimer: 'This report is AI-generated and for informational purposes only.',
        }
        : aiReport || undefined,
      apiHealthData: apiRes
        ? {
          heart_rate: apiRes.heart_rate,
          bp_systolic: apiRes.bp_systolic,
          bp_diastolic: apiRes.bp_diastolic,
          scan_duration_seconds: apiRes.scan_duration_seconds,
        }
        : undefined,
    };

    // Save to localStorage for persistence
    localStorage.setItem('faceReportData', JSON.stringify(combinedData));

    // Dispatch custom event to notify Header component
    window.dispatchEvent(new Event('vitaScanUpdated'));

    navigate('/face-report', { state: combinedData });
  };

  // Stop recording manually
  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop();
    }

  };

  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
      if (previewUrl && previewUrl.startsWith('blob:')) {
        URL.revokeObjectURL(previewUrl);
      }

      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      inferenceWorkerRef.current?.terminate();
      psdWorkerRef.current?.terminate();
      hrvWorkerRef.current?.terminate();
    };
  }, []);

  // SVG Icons
  const XIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="6" x2="6" y2="18"></line>
      <line x1="6" y1="6" x2="18" y2="18"></line>
    </svg>
  );

  const CameraIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z"></path>
      <circle cx="12" cy="13" r="3"></circle>
    </svg>
  );

  const VideoIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="23 7 16 12 23 17 23 7"></polygon>
      <rect x="1" y="5" width="15" height="14" rx="2" ry="2"></rect>
    </svg>
  );

  const SkipIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="5 4 15 12 5 20 5 4"></polygon>
      <line x1="19" y1="5" x2="19" y2="19"></line>
    </svg>
  );


  const HeartIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
    </svg>
  );

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');

        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }

        body {
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
          background: rgb(255, 255, 255);
          color: #000;
          overflow-x: hidden;
        }

        .container {
          max-width: 1400px;
          margin: 0 auto;
          padding: 0 1.5rem;
        }

        .btn-primary {
          background: #7DD3FC;
          color: #fff;
          border: none;
          padding: 0.875rem 2rem;
          border-radius: 0.5rem;
          font-size: 1rem;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .btn-primary:hover {
          background: #38BDF8;
        }

        .btn-primary:disabled {
          background: #BAE6FD;
          color: #fff;
          cursor: not-allowed;
        }

        .btn-secondary {
          background: transparent;
          border: 1px solid #2D3748;
          color: #A0AEC0;
          padding: 0.875rem 1.5rem;
          border-radius: 0.5rem;
          font-size: 1rem;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s ease;
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        .btn-secondary:hover {
          border-color: #EF4444;
          color: #EF4444;
        }

        .btn-success {
          background: #10B981;
          color: #fff;
          border: none;
          padding: 0.75rem 1.5rem;
          border-radius: 0.75rem;
          font-size: 1rem;
          font-weight: 500;
          cursor: default;
        }

        .btn-skip {
          background: transparent;
          border: 1px solid #FCA5A5;
          color: #000;
          padding: 0.875rem 1.5rem;
          border-radius: 0.5rem;
          font-size: 1rem;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s ease;
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        .btn-skip:hover {
          border-color: #F87171;
          color: #000;
        }

        .card {
          background: #fff;
          border: 1px solid #e0e0e0;
          border-top: 3px solid rgb(0, 184, 248);
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1), 0 1px 4px rgba(0, 0, 0, 0.06);
          border-radius: 1rem;
          padding: 2rem;
          min-height: 50vh;
          max-height: calc(100vh - 3rem);
          display: flex;
          flex-direction: column;
        }

        .drop-zone {
          border: 2px dashed #d1d5db;
          border-radius: 1rem;
          padding: 3rem 2rem;
          text-align: center;
          transition: all 0.2s ease;
          flex: 1;
        }

        .video-container {
          position: relative;
          border-radius: 1rem;
          overflow: hidden;
          border: 4px solid #d1d5db;
          background: #f9fafb;
          height: 45vh;
          max-height: 500px;
        }

        video {
          width: 100%;
          height: 100%;
          display: block;
          object-fit: cover;
          background: #fff;
        }

        .corner-bracket {
          position: absolute;
          width: 4rem;
          height: 4rem;
          border-color: #fff;
        }

        .corner-tl {
          top: 1rem;
          left: 1rem;
          border-top: 4px solid;
          border-left: 4px solid;
          border-top-left-radius: 0.5rem;
        }

        .corner-tr {
          top: 1rem;
          right: 1rem;
          border-top: 4px solid;
          border-right: 4px solid;
          border-top-right-radius: 0.5rem;
        }

        .corner-bl {
          bottom: 1rem;
          left: 1rem;
          border-bottom: 4px solid;
          border-left: 4px solid;
          border-bottom-left-radius: 0.5rem;
        }

        .corner-br {
          bottom: 1rem;
          right: 1rem;
          border-bottom: 4px solid;
          border-right: 4px solid;
          border-bottom-right-radius: 0.5rem;
        }

        @keyframes pulse-glow {
          0%, 100% { opacity: 0.6; transform: scale(1); }
          50% { opacity: 1; transform: scale(1.2); }
        }

        @keyframes scan-line {
          0% { top: 0; }
          100% { top: 100%; }
        }

        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }

        .spinner {
          animation: spin 1s linear infinite;
        }

        .scan-overlay {
          position: absolute;
          inset: 0;
          background: linear-gradient(to bottom, rgba(6, 182, 212, 0.2), rgba(168, 85, 247, 0.2), rgba(236, 72, 153, 0.2));
          mix-blend-mode: overlay;
          animation: pulse-glow 2s ease-in-out infinite;
        }

        .scan-line {
          position: absolute;
          left: 0;
          right: 0;
          height: 2px;
          background: linear-gradient(90deg, transparent, #00B8D4, transparent);
          animation: scan-line 2s linear infinite;
        }

        .heat-point {
          position: absolute;
          border-radius: 50%;
          filter: blur(12px);
          animation: pulse-glow 2s ease-in-out infinite;
        }

        .recording-indicator {
          position: absolute;
          top: 1rem;
          right: 1rem;
          background: rgba(239, 68, 68, 0.9);
          color: white;
          padding: 0.5rem 1rem;
          border-radius: 2rem;
          font-size: 0.875rem;
          font-weight: 600;
          display: flex;
          align-items: center;
          gap: 0.5rem;
          z-index: 10;
        }

        .recording-dot {
          width: 8px;
          height: 8px;
          background: white;
          border-radius: 50%;
          animation: pulse-glow 1s ease-in-out infinite;
        }

        .camera-preview-indicator {
          position: absolute;
          top: 1rem;
          left: 1rem;
          background: rgba(0, 184, 212, 0.9);
          color: white;
          padding: 0.5rem 1rem;
          border-radius: 2rem;
          font-size: 0.875rem;
          font-weight: 600;
          display: flex;
          align-items: center;
          gap: 0.5rem;
          z-index: 10;
        }

        .camera-dot {
          width: 8px;
          height: 8px;
          background: white;
          border-radius: 50%;
          animation: pulse-glow 2s ease-in-out infinite;
        }

        .error-message {
          background: rgba(239, 68, 68, 0.1);
          border: 1px solid #EF4444;
          color: #EF4444;
          padding: 1rem;
          border-radius: 0.5rem;
          margin-bottom: 1rem;
          font-size: 0.875rem;
        }

        .warning-message {
          background: rgba(245, 158, 11, 0.1);
          border: 1px solid #F59E0B;
          color: #F59E0B;
          padding: 1rem;
          border-radius: 0.5rem;
          margin-bottom: 1rem;
          font-size: 0.875rem;
        }

        .info-message {
          background: rgba(6, 182, 212, 0.1);
          border: 1px solid #00B8D4;
          color: #00B8D4;
          padding: 1rem;
          border-radius: 0.5rem;
          margin-bottom: 1rem;
          font-size: 0.875rem;
        }


        .heart-rate-card {
          position: absolute;
          top: 1rem;
          left: 1rem;
          background: rgba(0, 0, 0, 0.8);
          border: 1px solid #00B8D4;
          border-radius: 0.5rem;
          padding: 0.75rem 1rem;
          z-index: 20;
          min-width: 120px;
        }

        .heart-rate-value {
          color: #00B8D4;
          font-size: 1.5rem;
          font-weight: bold;
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        .heart-rate-label {
          color: #9CA3AF;
          font-size: 0.75rem;
          margin-top: 0.25rem;
        }

        .sqi-indicator {
          display: flex;
          align-items: center;
          gap: 0.25rem;
          margin-top: 0.25rem;
        }

        .sqi-bar {
          width: 60px;
          height: 4px;
          background: #2D2D2D;
          border-radius: 2px;
          overflow: hidden;
        }

        .sqi-fill {
          height: 100%;
          background: #00B8D4;
          border-radius: 2px;
          transition: width 0.3s ease;
        }

        @media (max-width: 1280px) {
          .card-wrapper {
            width: 90% !important;
          }
        }

        @media (max-width: 1024px) {
          .main-container {
            flex-direction: column !important;
            gap: 2rem !important;
          }

          .left-side, .right-side {
            width: 100% !important;
          }

          .left-side {
            padding-top: 0.5rem !important;
          }

          .right-side {
            justify-content: center !important;
          }

          .card-wrapper {
            width: 100% !important;
          }

          .card {
            min-height: 50vh;
          }
        }

        /* Laptop screens - better fit without scrolling */
        @media (min-width: 769px) and (max-width: 1920px) {
          .card-wrapper {
            min-height: 80vh !important;
          }

          .card {
            padding: 1.25rem;
            max-height: calc(100vh - 4rem);
            overflow-y: auto;
          }

          h1 {
            font-size: 2rem !important;
            margin-bottom: 0.5rem !important;
          }

          .video-container {
            max-height: 50vh;
          }

          .left-side h4 {
            font-size: 1rem !important;
            margin-bottom: 0.5rem !important;
          }

          .main-container {
            gap: 1.5rem !important;
          }
        }

        @media (max-width: 768px) {
          .card {
            padding: 1.5rem;
            min-height: 45vh;
          }

          h1 {
            font-size: 2rem !important;
          }

          h2 {
            margin-bottom: 0.5rem !important;
          }

          .video-container {
            height: 50vh;
          }

          .heart-rate-card {
            top: 0.5rem;
            left: 0.5rem;
            padding: 0.5rem 0.75rem;
            min-width: 100px;
          }

          .heart-rate-value {
            font-size: 1.25rem;
          }

          .drop-zone {
            padding: 2rem 1rem !important;
          }
        }

        @media (max-width: 480px) {
          .card {
            padding: 1rem;
            min-height: 40vh;
            border-radius: 0.75rem;
          }

          h1 {
            font-size: 1.5rem !important;
            margin-bottom: 0.5rem !important;
          }

          .video-container {
            height: 40vh;
            border-radius: 0.75rem;
          }

          .drop-zone {
            padding: 1.5rem 0.75rem !important;
            border-radius: 0.75rem;
          }

          .btn-primary, .btn-secondary, .btn-skip {
            padding: 0.75rem 1rem !important;
            font-size: 0.875rem !important;
          }

          .corner-bracket {
            width: 2.5rem;
            height: 2.5rem;
          }
        }
      `}</style>
      <div style={{ minHeight: '100vh', minWidth: '100vw', background: 'rgb(255, 255, 255)', color: '#000', display: 'flex', flexDirection: 'column', position: 'relative', overflow: 'hidden' }}>
        {/* Blurred bubbles background */}
        <div style={{
          position: "absolute",
          width: "100%",
          height: "100%",
          overflow: "hidden",
          zIndex: 0,
        }}>
          {/* Top left area */}
          <div style={{
            position: "absolute",
            width: "500px",
            height: "500px",
            borderRadius: "50%",
            background: "linear-gradient(135deg, rgba(0, 184, 248, 0.35), rgba(135, 206, 250, 0.25))",
            filter: "blur(100px)",
            top: "-10%",
            left: "-5%",
          }} />
          <div style={{
            position: "absolute",
            width: "350px",
            height: "350px",
            borderRadius: "50%",
            background: "linear-gradient(135deg, rgba(197, 245, 245, 0.4), rgba(176, 224, 230, 0.3))",
            filter: "blur(85px)",
            top: "5%",
            left: "15%",
          }} />

          {/* Top right area */}
          <div style={{
            position: "absolute",
            width: "400px",
            height: "400px",
            borderRadius: "50%",
            background: "linear-gradient(135deg, rgba(135, 206, 250, 0.32), rgba(173, 216, 230, 0.22))",
            filter: "blur(95px)",
            top: "0%",
            right: "10%",
          }} />
          <div style={{
            position: "absolute",
            width: "300px",
            height: "300px",
            borderRadius: "50%",
            background: "linear-gradient(135deg, rgba(0, 184, 248, 0.28), rgba(135, 206, 250, 0.18))",
            filter: "blur(75px)",
            top: "20%",
            right: "-5%",
          }} />

          {/* Middle area */}
          <div style={{
            position: "absolute",
            width: "450px",
            height: "450px",
            borderRadius: "50%",
            background: "linear-gradient(135deg, rgba(197, 245, 245, 0.38), rgba(176, 224, 230, 0.28))",
            filter: "blur(105px)",
            top: "35%",
            left: "40%",
          }} />

          {/* Bottom left area */}
          <div style={{
            position: "absolute",
            width: "380px",
            height: "380px",
            borderRadius: "50%",
            background: "linear-gradient(135deg, rgba(135, 206, 250, 0.34), rgba(173, 216, 230, 0.24))",
            filter: "blur(88px)",
            bottom: "10%",
            left: "5%",
          }} />
          <div style={{
            position: "absolute",
            width: "320px",
            height: "320px",
            borderRadius: "50%",
            background: "linear-gradient(135deg, rgba(0, 184, 248, 0.3), rgba(135, 206, 250, 0.2))",
            filter: "blur(80px)",
            bottom: "-5%",
            left: "25%",
          }} />

          {/* Bottom right area */}
          <div style={{
            position: "absolute",
            width: "420px",
            height: "420px",
            borderRadius: "50%",
            background: "linear-gradient(135deg, rgba(197, 245, 245, 0.42), rgba(176, 224, 230, 0.32))",
            filter: "blur(110px)",
            bottom: "5%",
            right: "8%",
          }} />
          <div style={{
            position: "absolute",
            width: "280px",
            height: "280px",
            borderRadius: "50%",
            background: "linear-gradient(135deg, rgba(135, 206, 250, 0.29), rgba(173, 216, 230, 0.19))",
            filter: "blur(70px)",
            bottom: "25%",
            right: "-3%",
          }} />
        </div>
        <div style={{ padding: '3% 3%', flex: 1, display: 'flex', flexDirection: 'column', maxHeight: '100vh', overflow: 'hidden', position: 'relative', zIndex: 1 }}>
          {/* <div className="container"> */}
          {error && scanState === 'initial' && (
            <div className="error-message" style={{ marginBottom: '2rem' }}>
              {error}
              {error.includes('HTTPS') && (
                <div style={{ marginTop: '0.5rem', fontSize: '0.75rem' }}>
                  <strong>Solution:</strong> Run your app on:
                  <ul style={{ margin: '0.5rem 0 0 1rem' }}>
                    <li>Localhost (http://localhost:3000)</li>
                    <li>HTTPS (https://yourdomain.com)</li>
                    <li>Use Chrome flags: chrome://flags/#unsafely-treat-insecure-origin-as-secure</li>
                  </ul>
                </div>
              )}
            </div>
          )}

          <div className="main-container" style={{ display: 'flex', alignItems: 'flex-start', gap: '2rem', flex: 1, minHeight: 0 }}>

            {/* Left side - Info */}
            <div className="left-side" style={{ width: '50%', paddingTop: '0.5rem', display: 'flex', flexDirection: 'column', minHeight: 0, maxHeight: '100%', overflowY: 'auto' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <h2 style={{
                  color: '#00B8D4',
                  fontSize: '0.875rem',
                  fontWeight: 500,
                  letterSpacing: '0.05em',
                  marginBottom: '1rem'
                }}>
                  Vita Scan
                </h2>

                <h1 style={{ fontSize: '2.25rem', fontWeight: 400, lineHeight: 1.2, marginBottom: '0.5rem', color: '#000' }}>
                  Scan yourself and see how health rate works
                </h1>

                <p style={{ color: '#6B7280', fontSize: '1rem', fontWeight: 400, lineHeight: 1.6 }}>
                  "Research-driven. Precision-crafted. Eternal AI transforms your health journey."
                </p>

                {/* Do's Section */}
                <div style={{ marginTop: '1rem' }}>
                  <h4 style={{ color: '#000', fontSize: '1.125rem', fontWeight: 600, marginBottom: '0.75rem' }}>
                    Do's
                  </h4>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    {[
                      'Stay as still as possible, only gentle natural breathing, no talking or facial expressions.',
                      'Keep your gaze fixed at a point near the camera to avoid eye/head movements.',
                      'If you see "signal quality" dropping or "poor," stop and redo the scan after adjusting light and posture.',
                    ].map((item, i) => (
                      <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem' }}>
                        <div style={{
                          width: '24px',
                          height: '24px',
                          borderRadius: '50%',
                          background: '#10B981',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          flexShrink: 0,
                          marginTop: '2px'
                        }}>
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="20 6 9 17 4 12" />
                          </svg>
                        </div>
                        <span style={{ color: '#4B5563', fontSize: '0.85rem', lineHeight: 1.5 }}>{item}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Don'ts Section */}
                <div style={{ marginTop: '1rem' }}>
                  <h4 style={{ color: '#000', fontSize: '1.125rem', fontWeight: 600, marginBottom: '0.75rem' }}>
                    Don'ts
                  </h4>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    {[
                      'Don\'t talk, smile, laugh, or move your jaw.',
                      'Don\'t move the device, change distance, or turn your head during the measurement.',
                      'Don\'t scan while walking, in a vehicle, or with a fan blowing directly on your face or hair & Don\'t wear specs or sunglass.',
                    ].map((item, i) => (
                      <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem' }}>
                        <div style={{
                          width: '24px',
                          height: '24px',
                          borderRadius: '50%',
                          background: '#EF4444',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          flexShrink: 0,
                          marginTop: '2px'
                        }}>
                          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                            <line x1="18" y1="6" x2="6" y2="18" />
                            <line x1="6" y1="6" x2="18" y2="18" />
                          </svg>
                        </div>
                        <span style={{ color: '#4B5563', fontSize: '0.85rem', lineHeight: 1.5 }}>{item}</span>
                      </div>
                    ))}
                  </div>
                </div>

              </div>
            </div>

            {/* Right side - Scan Interface */}
            <div className="right-side" style={{ width: '50%', display: 'flex', alignItems: 'stretch', justifyContent: 'center', minHeight: 0, maxHeight: '100%' }}>
              <div className="card-wrapper" style={{ width: '80%', display: 'flex', flexDirection: 'column', minHeight: '60vh' }}>
                <div className="card" style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0, overflowY: 'auto' }}>

                  {/* Error message */}
                  {error && scanState !== 'initial' && (
                    <div className="error-message" style={{ marginBottom: '1rem' }}>
                      {error}
                    </div>
                  )}


                  {/* rPPG Warning */}
                  {rppgError && (scanState === 'camera' || scanState === 'recording') && (
                    <div className="warning-message" style={{ marginBottom: '1rem' }}>
                      <strong>rPPG Warning:</strong> {rppgError}
                      <br />
                      <small>Continuing with video recording only...</small>
                    </div>
                  )}

                  {/* Initial State */}
                  {scanState === 'initial' && (
                    <>
                      <h3 style={{ color: '#00B8D4', fontSize: '1.25rem', fontWeight: 500, textAlign: 'center', marginBottom: '1rem' }}>
                        Scan your face
                      </h3>

                      <div
                        className="drop-zone"
                        style={{
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}
                      >
                        <button
                          onClick={openCamera}
                          className="btn-primary"
                          style={{
                            marginBottom: '1rem',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem',
                            padding: '1rem 2rem',
                            fontSize: '1.1rem'
                          }}
                          disabled={!!error && error.includes('HTTPS')}
                        >
                          <CameraIcon />
                          Open Camera
                        </button>

                        <p style={{ color: '#6B7280', fontSize: '0.875rem', marginTop: '1rem', textAlign: 'center' }}>
                          Click above to start face scanning using your webcam
                        </p>
                      </div>

                      <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
                        <button
                          onClick={handleSkip}
                          className="btn-skip"
                          style={{ flex: 1, justifyContent: 'center' }}
                        >
                          <SkipIcon />
                          Skip
                        </button>
                        <button
                          disabled
                          className="btn-primary"
                          style={{ flex: 1 }}
                        >
                          Start Scan
                        </button>
                      </div>
                    </>
                  )}

                  {/* Camera/Recording State - Shows live camera feed immediately */}
                  {(scanState === 'camera' || scanState === 'recording') && (
                    <>
                      <h3 style={{ color: '#00B8D4', fontSize: '1.25rem', fontWeight: 500, textAlign: 'center', marginBottom: '1rem' }}>
                        {scanState === 'camera' ? 'Camera Preview' : 'Recording...'}
                      </h3>

                      <div className="video-container" style={{ marginBottom: '1rem', position: 'relative' }}>
                        {/* Video element for camera preview */}
                        <video
                          ref={videoRef}
                          autoPlay
                          playsInline
                          muted
                          style={{
                            width: '100%',
                            height: '100%',
                            transform: 'scaleX(-1)', // Mirror effect for selfie view
                            background: '#000'
                          }}
                        />

                        {/* Corner brackets */}
                        <div className="corner-bracket corner-tl"></div>
                        <div className="corner-bracket corner-tr"></div>
                        <div className="corner-bracket corner-bl"></div>
                        <div className="corner-bracket corner-br"></div>

                        {/* Camera preview indicator */}
                        {scanState === 'camera' && (
                          <div className="camera-preview-indicator">
                            <div className="camera-dot"></div>
                            LIVE CAMERA
                          </div>
                        )}

                        {/* Recording indicator */}
                        {scanState === 'recording' && (
                          <>
                            <div className="recording-indicator">
                              <div className="recording-dot"></div>
                              REC {recordingTime}s / 40s
                            </div>
                            <div className="scan-line"></div>
                          </>
                        )}


                        {/* Live Heart Rate Display */}
                        {scanState === 'recording' && heartRate > 0 && (
                          <div className="heart-rate-card">
                            <div className="heart-rate-value">
                              <HeartIcon />
                              {Math.round(heartRate)}
                              <span style={{ fontSize: '0.875rem', fontWeight: 'normal' }}>BPM</span>
                            </div>
                            <div className="heart-rate-label">
                              Signal Quality
                            </div>
                            <div className="sqi-indicator">
                              <div className="sqi-bar">
                                <div
                                  className="sqi-fill"
                                  style={{
                                    width: `${Math.round(sqi * 100)}%`,
                                    background: sqi > 0.5 ? '#10B981' : sqi > 0.38 ? '#F59E0B' : '#EF4444'
                                  }}
                                />
                              </div>
                              <span style={{ fontSize: '0.75rem', color: '#6B7280' }}>
                                {Math.round(sqi * 100)}%
                              </span>
                            </div>
                            {!faceDetected && (
                              <div style={{ color: '#EF4444', fontSize: '0.75rem', marginTop: '0.25rem' }}>
                                No face detected
                              </div>
                            )}
                          </div>
                        )}

                        {/* Show loading if camera not ready */}
                        {scanState === 'camera' && !isCameraReady && (
                          <div style={{
                            position: 'absolute',
                            top: 0,
                            left: 0,
                            right: 0,
                            bottom: 0,
                            background: 'rgba(0, 0, 0, 0.8)',
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            justifyContent: 'center',
                            zIndex: 5
                          }}>
                            <div style={{
                              width: '60px',
                              height: '60px',
                              border: '3px solid #00B8D4',
                              borderTopColor: 'transparent',
                              borderRadius: '50%',
                              animation: 'spin 1s linear infinite'
                            }}></div>
                            <p style={{ color: '#00B8D4', marginTop: '1rem' }}>Starting camera...</p>
                          </div>
                        )}


                        {/* Face detection overlay canvas */}
                        <canvas
                          ref={overlayCanvasRef}
                          style={{
                            position: 'absolute',
                            top: 0,
                            left: 0,
                            width: '100%',
                            height: '100%',
                            pointerEvents: 'none',
                            zIndex: 5
                          }}
                        />
                      </div>

                      {/* Visualization Panels - Only during recording */}
                      {scanState === 'recording' && (
                        <div style={{
                          display: 'grid',
                          gridTemplateColumns: '80px 80px 1fr',
                          gap: '8px',
                          marginBottom: '1rem',
                          marginTop: '0.5rem'
                        }}>
                          {/* ROI Panel */}
                          <div style={{
                            background: 'rgba(0,0,0,0.6)',
                            borderRadius: '8px',
                            border: '1px solid rgba(255,255,255,0.1)',
                            padding: '4px',
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center'
                          }}>
                            <span style={{ fontSize: '9px', color: '#6B7280', marginBottom: '2px' }}>ROI</span>
                            <canvas
                              ref={roiCanvasRef}
                              width={36}
                              height={36}
                              style={{
                                width: '64px',
                                height: '64px',
                                imageRendering: 'pixelated',
                                borderRadius: '4px'
                              }}
                            />
                          </div>

                          {/* Attention Heatmap Panel */}
                          <div style={{
                            background: 'rgba(0,0,0,0.6)',
                            borderRadius: '8px',
                            border: '1px solid rgba(255,255,255,0.1)',
                            padding: '4px',
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center'
                          }}>
                            <span style={{ fontSize: '9px', color: '#6B7280', marginBottom: '2px' }}>ATTN</span>
                            <canvas
                              ref={heatmapCanvasRef}
                              width={64}
                              height={64}
                              style={{
                                width: '64px',
                                height: '64px',
                                borderRadius: '4px'
                              }}
                            />
                          </div>

                          {/* Heart State / Trajectory Panel */}
                          <div style={{
                            background: 'rgba(0,0,0,0.6)',
                            borderRadius: '8px',
                            border: '1px solid rgba(255,255,255,0.1)',
                            padding: '4px',
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            minHeight: '80px'
                          }}>
                            <span style={{ fontSize: '9px', color: '#6B7280', marginBottom: '2px' }}>Heart State</span>
                            <canvas
                              ref={trajCanvasRef}
                              width={200}
                              height={80}
                              style={{
                                width: '100%',
                                height: '70px',
                                borderRadius: '4px'
                              }}
                            />
                          </div>
                        </div>
                      )}

                      {/* Camera action buttons */}
                      {scanState === 'camera' && (
                        <div style={{ textAlign: 'center', marginBottom: '1rem' }}>
                          <button
                            onClick={startRecording}
                            className="btn-primary"
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '0.5rem',
                              margin: '0 auto',
                              padding: '0.75rem 1.5rem',
                              fontSize: '1rem'
                            }}
                            disabled={!isCameraReady}
                          >
                            <VideoIcon />
                            Start Scan (Record 40s)
                          </button>
                          <p style={{ color: '#6B7280', fontSize: '0.875rem', marginTop: '1rem' }}>
                            Position your face in the frame and click Start Scan to begin recording
                          </p>
                        </div>
                      )}

                      {scanState === 'recording' && (
                        <div style={{ textAlign: 'center', marginBottom: '1rem' }}>
                          <button
                            onClick={stopRecording}
                            className="btn-primary"
                            style={{
                              background: '#EF4444',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '0.5rem',
                              margin: '0 auto',
                              padding: '0.75rem 1.5rem',
                              fontSize: '1rem'
                            }}
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <rect x="6" y="6" width="12" height="12"></rect>
                            </svg>
                            Stop Recording ({40 - recordingTime}s remaining)
                          </button>
                          <p style={{ color: '#6B7280', fontSize: '0.875rem', marginTop: '1rem' }}>
                            Recording in progress. Please keep your face still and centered.
                          </p>
                        </div>
                      )}

                      <div style={{ display: 'flex', gap: '1rem' }}>
                        <button
                          onClick={resetScan}
                          className="btn-secondary"
                          style={{ flex: 1, justifyContent: 'center' }}
                        >
                          <XIcon />
                          {scanState === 'camera' ? 'Close Camera' : 'Cancel'}
                        </button>
                        <button
                          disabled
                          className="btn-primary"
                          style={{ flex: 1 }}
                        >
                          Continue to spiritual journey
                        </button>
                      </div>
                    </>
                  )}

                  {/* Processing State */}
                  {scanState === 'processing' && (
                    <>
                      <h3 style={{ color: '#00B8D4', fontSize: '1.25rem', fontWeight: 500, textAlign: 'center', marginBottom: '1rem' }}>
                        Processing Video
                      </h3>

                      <div className="video-container" style={{ marginBottom: '1rem', position: 'relative' }}>
                        {previewUrl && (
                          previewUrl.startsWith('blob:') ? (
                            <video src={previewUrl} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                          ) : (
                            <img src={previewUrl} alt="Preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                          )
                        )}

                        {/* Scanning effect */}
                        <div className="scan-overlay"></div>
                        <div className="scan-line"></div>

                        {/* Corner brackets */}
                        <div className="corner-bracket corner-tl" style={{ borderColor: '#00B8D4' }}></div>
                        <div className="corner-bracket corner-tr" style={{ borderColor: '#00B8D4' }}></div>
                        <div className="corner-bracket corner-bl" style={{ borderColor: '#00B8D4' }}></div>
                        <div className="corner-bracket corner-br" style={{ borderColor: '#00B8D4' }}></div>

                        {/* Heat map points */}
                        <div className="heat-point" style={{
                          top: '25%',
                          left: '50%',
                          transform: 'translateX(-50%)',
                          width: '4rem',
                          height: '4rem',
                          background: 'radial-gradient(circle, rgba(250, 204, 21, 0.8), rgba(168, 85, 247, 0.6), transparent)'
                        }}></div>
                        <div className="heat-point" style={{
                          top: '50%',
                          left: '33%',
                          width: '3rem',
                          height: '3rem',
                          background: 'radial-gradient(circle, rgba(6, 182, 212, 0.7), rgba(59, 130, 246, 0.5), transparent)',
                          animationDelay: '0.3s'
                        }}></div>
                        <div className="heat-point" style={{
                          top: '50%',
                          right: '33%',
                          width: '3rem',
                          height: '3rem',
                          background: 'radial-gradient(circle, rgba(6, 182, 212, 0.7), rgba(59, 130, 246, 0.5), transparent)',
                          animationDelay: '0.6s'
                        }}></div>
                      </div>

                      <div style={{ textAlign: 'center', marginBottom: '1rem' }}>
                        <button className="btn-primary" style={{
                          background: '#00B8D4',
                          cursor: 'default',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.5rem',
                          margin: '0 auto',
                          padding: '0.75rem 1.5rem'
                        }}>
                          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <circle cx="12" cy="12" r="10"></circle>
                            <polyline points="12 6 12 12 16 14"></polyline>
                          </svg>
                          {progress === 100 ? 'Uploading data...' : `Processing Face Scan... ${progress}%`}
                        </button>
                        <p style={{ color: '#6B7280', fontSize: '0.875rem', marginTop: '1rem' }}>
                          {progress === 100
                            ? 'Sending health data to server...'
                            : 'Analyzing facial features and generating health insights...'}
                        </p>
                      </div>

                      <div style={{ display: 'flex', gap: '1rem' }}>
                        <button
                          onClick={resetScan}
                          className="btn-secondary"
                          style={{ flex: 1, justifyContent: 'center' }}
                        >
                          <XIcon />
                          Cancel
                        </button>
                        <button
                          disabled
                          className="btn-primary"
                          style={{ flex: 1 }}
                        >
                          Continue to spiritual journey
                        </button>
                      </div>
                    </>
                  )}

                  {/* Complete State */}
                  {scanState === 'complete' && (
                    <>
                      <h3 style={{ color: '#00B8D4', fontSize: '1.25rem', fontWeight: 500, textAlign: 'center', marginBottom: '1rem' }}>
                        Scan Complete!
                      </h3>

                      <div className="video-container" style={{ marginBottom: '1rem', position: 'relative' }}>
                        {previewUrl && (
                          previewUrl.startsWith('blob:') ? (
                            <video src={previewUrl} style={{ width: '100%', height: '100%', objectFit: 'cover' }} controls />
                          ) : (
                            <img src={previewUrl} alt="Scanned face" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                          )
                        )}

                        {/* Corner brackets - white for complete state */}
                        <div className="corner-bracket corner-tl"></div>
                        <div className="corner-bracket corner-tr"></div>
                        <div className="corner-bracket corner-bl"></div>
                        <div className="corner-bracket corner-br"></div>
                      </div>

                      <div style={{ textAlign: 'center', marginBottom: '1rem' }}>
                        <button className="btn-success" style={{
                          marginBottom: '0.75rem',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.5rem',
                          margin: '0 auto',
                          padding: '0.75rem 1.5rem'
                        }}>
                          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                            <polyline points="22 4 12 14.01 9 11.01"></polyline>
                          </svg>
                          Face Scanned Successfully!
                        </button>
                        <p style={{ color: '#6B7280', fontSize: '0.875rem' }}>
                          Your face scan is complete. View your report in the health AI dashboard.
                        </p>
                        {uploadError && (
                          <p style={{ color: '#EF4444', fontSize: '0.875rem', marginTop: '0.5rem' }}>
                            {uploadError}
                          </p>
                        )}
                      </div>

                      <div style={{ display: 'flex', gap: '1rem' }}>
                        <button
                          onClick={resetScan}
                          className="btn-secondary"
                          style={{ flex: 1, justifyContent: 'center' }}
                          disabled={isUploadingData}
                        >
                          <XIcon />
                          Scan Again
                        </button>
                        <button
                          onClick={handleContinue}
                          className="btn-primary"
                          disabled={isUploadingData}
                          style={{
                            flex: 1,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '0.5rem',
                            padding: '1rem',
                            opacity: isUploadingData ? 0.7 : 1,
                          }}
                        >
                          {isUploadingData ? (
                            <>
                              <svg className="spinner" xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <circle cx="12" cy="12" r="10"></circle>
                              </svg>
                              Uploading...
                            </>
                          ) : (
                            <>
                              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
                                <polyline points="9 22 9 12 15 12 15 22"></polyline>
                              </svg>
                              Continue to spiritual journey
                            </>
                          )}
                        </button>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};


export default FaceScanner;