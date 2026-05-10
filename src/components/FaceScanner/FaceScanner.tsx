import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import Stars from '../ui/stars';
import { baseApiUrl } from '@/config/api';
import { usePhcSession } from '@/context/PhcSessionContext';
import { getPhcCopy } from '@/i18n/phcCopy';
import ErosClinicLogo from '@/assets/images/eros-wellness-ai-clinic-cropped.png';
import type { CombinedReportData, HrHistoryPoint, RppgSignalPayload } from '../../types/rppg';
import type { HealthData, SectionInsightsInput } from '../../services/openaiReport';
import {
  KalmanFilter1D,
  generateVitals,
  generateHrv,
  generateStress,
  generateNonlinear,
  generateRespiratoryExtended,
  calculateAverage,
  getStatusColorCode
} from '../../utils/rppgHelpers';
import { drawFaceBbox, drawHeatmap, drawTrajectory } from './visualizations';
import type { HeatmapRange, TrajPoint } from './visualizations';

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
const RECORDING_DURATION = 60; // seconds
const MIN_VALID_HR_SAMPLES_FOR_REPORT = 10;
const MIN_VALID_BVP_SAMPLES_FOR_REPORT = 150;

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
  const [preparedReport, setPreparedReport] = useState<CombinedReportData | null>(null);
  const navigate = useNavigate();
  const { language, patient, setBioCareReport } = usePhcSession();
  const t = getPhcCopy(language);
  const reportLanguage = language === 'gu' ? 'gu' : 'en';
  const reportLocale = language === 'gu' ? 'gu-IN' : 'en-US';
  const scanDos = [t.dosStill, t.dosGaze, t.dosQuality];
  const scanDonts = [t.dontTalk, t.dontMove, t.dontEnvironment];

  useEffect(() => {
    if (!patient?.userId) {
      navigate('/profile', { replace: true });
    }
  }, [navigate, patient?.userId]);


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
  const faceDetectionFrameCountRef = useRef<number>(0);
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
              modelAssetPath: `${import.meta.env.BASE_URL}models/blaze_face_short_range.tflite`,
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
              modelAssetPath: `${import.meta.env.BASE_URL}models/blaze_face_short_range.tflite`,
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

            // Skip warm-up readings below physiological minimum (model needs ~5s to stabilize)
            if (hrValue < 45) {
              return;
            }

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
        faceDetectionFrameCountRef.current += 1;
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

    if (!rppgInitialized) {
      setError(t.preparingScanner);
      return;
    }

    chunksRef.current = [];

    hrLogRef.current = [];
    bvpLogRef.current = [];
    faceDetectionFrameCountRef.current = 0;
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

  // Recording timer and auto-stop after the configured capture window.
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
      let sent = false;
      const interval = setInterval(() => {
        setProgress((prev) => {
          if (prev >= 100) {
            clearInterval(interval);
            // When processing completes, send data to API (only once)
            if (!sent) {
              sent = true;
              sendScanDataToAPI();
            }
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
    setPreparedReport(null);
    setUploadError(null);
    setRecordingTime(0);
    setError(null);
    setIsCameraReady(false);

    setRppgInitialized(false);
    setHeartRate(0);
    setSqi(0);
    setFaceDetected(false);
    hrLogRef.current = [];
    bvpLogRef.current = [];
    faceDetectionFrameCountRef.current = 0;
    kalmanFiltersRef.current = {};

    // Reset visualization refs
    projOutputRef.current = null;
    trajHistoryRef.current = [];
    heatmapRangeRef.current = { min: 0, max: 1 };
    faceBboxRef.current = null;
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

          const { metrics, rrIntervals: rrData, poincareData } = e.data.payload;

          // Filter out any warm-up readings below 45 BPM
          const stableReadings = hrLogRef.current.filter(([, hr]) => hr >= 45);

          // Calculate average HR from valid readings
          const validHr = stableReadings.filter(([, , s]) => s > SQI_THRESHOLD);
          if (validHr.length < MIN_VALID_HR_SAMPLES_FOR_REPORT) {
            resolve(null);
            return;
          }

          const avgHr = calculateAverage(validHr.map(([, hr]) => hr));

          // Calculate average SQI
          const avgSqi = calculateAverage(validHr.map(([, , s]) => s));

          // Generate report data
          const hrHistory: HrHistoryPoint[] = stableReadings.map(([time, hr, sqi]) => ({
            time,
            hr: Math.round(hr),
            sqi: Math.round(sqi * 100) / 100
          }));

          // Build nonlinear metrics
          const nl = metrics.nonlinear;
          const nonlinear = nl ? generateNonlinear(
            nl.sd1 || 0, nl.sd2 || 0, nl.sd1Sd2Ratio || 0,
            nl.sampleEntropy, nl.dfaAlpha1, nl.dfaAlpha1Reliable || false
          ) : undefined;

          // Build respiratory extended
          const re = metrics.respiratoryExtended;
          const respiratoryExtended = re ? generateRespiratoryExtended(
            re.breathingRateMean || 0, re.breathingRateSd || 0,
            re.breathingRateCv || 0, re.stability || 'stable', re.breathCyclesDetected || 0
          ) : undefined;

          // Build frequency domain
          const fd = metrics.frequencyDomain;
          const frequencyDomain = fd ? {
            vlf: fd.vlf || 0, lf: fd.lf || 0, hf: fd.hf || 0, tp: fd.tp || 0, lfHfRatio: fd.lfHfRatio || 0
          } : undefined;

          // Build stress with sympathovagal balance
          const sa = metrics.stressAnalysis;

          resolve({
            vitals: generateVitals(
              avgHr,
              avgSqi,
              metrics.respiratoryRate ?? 0
            ),
            hrv: generateHrv(
              metrics.sdnn || 0,
              metrics.rmssd || 0,
              metrics.pnn50 || 0,
              metrics.recordingClass || 'insufficient_data',
              frequencyDomain,
              nonlinear,
              respiratoryExtended,
              rrData?.length || 0,
              metrics.pnn20 || 0,
            ),
            stress: generateStress(
              sa?.stressLevel || metrics.stressLevel || 'unknown',
              sa?.stressIndex || metrics.stressIndex || 0,
              sa?.stressDescription,
              sa?.sympathovagalBalance,
              metrics.sdnn || 0,
              metrics.rmssd || 0,
            ),
            metadata: {
              timestamp: new Date().toISOString(),
              scanDurationSeconds: recordingTime,
              samplesCollected: stableReadings.length
            },
            hrHistory,
            rrIntervals: rrData || [],
            poincareData: poincareData || [],
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
  // Call BP prediction endpoint with raw PPG signal
  const predictBP = async (): Promise<{ bp_systolic: number; bp_diastolic: number; confidence: number; method: string } | null> => {
    try {
      const ppgSignal = bvpLogRef.current
        .filter(([, v]) => v !== 0) // skip zero-init values
        .map(([, v]) => v);

      if (ppgSignal.length < 150) { // need at least 5 seconds at 30fps
        console.warn('PPG signal too short for BP prediction:', ppgSignal.length);
        return null;
      }

      const userId = patient?.userId;
      const response = await fetch(
        `${baseApiUrl}/aitools/wellness/v2/health/bp-predict`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ppg_signal: ppgSignal,
            sample_rate: 30,
            scan_duration_seconds: recordingTime,
            user_id: userId || undefined,
            report_language: reportLanguage,
            locale: reportLocale,
          }),
        }
      );

      if (!response.ok) {
        throw new Error(`BP API returned ${response.status}`);
      }

      const result = await response.json();
      if (result.success && result.data) {
        console.log('BP prediction:', result.data);
        return result.data;
      }
      return null;
    } catch (err) {
      console.error('BP prediction failed:', err);
      return null;
    }
  };

  const buildRppgSignalPayload = (): RppgSignalPayload => {
    const bvpSamples = bvpLogRef.current
      .filter(([, value]) => Number.isFinite(value) && value !== 0)
      .map(([timestamp, value], index) => ({
        index,
        timestamp_ms: timestamp,
        value,
      }));

    return {
      sample_rate_hz: TARGET_FPS,
      scan_duration_seconds: recordingTime,
      bvp_signal: bvpSamples,
      ppg_signal: bvpSamples.map((sample) => sample.value),
      heart_rate_samples: hrLogRef.current.map(([timestamp, hr, sqi], index) => ({
        index,
        timestamp_ms: timestamp,
        heart_rate_bpm: Math.round(hr),
        sqi,
      })),
      model_metadata: {
        input_buffer_size: INPUT_BUFFER_SIZE,
        sqi_threshold: SQI_THRESHOLD,
        target_fps: TARGET_FPS,
      },
    };
  };

  const validateFaceScanForReport = (
    rppgData: CombinedReportData['rppg'] | null,
    rppgSignals: RppgSignalPayload,
  ): string | null => {
    if (!rppgData) {
      return t.invalidFaceScan;
    }

    const validHrSamples = hrLogRef.current.filter(
      ([, hr, sampleSqi]) => hr >= 45 && sampleSqi >= SQI_THRESHOLD,
    );
    const averageSqi = validHrSamples.length > 0
      ? calculateAverage(validHrSamples.map(([, , sampleSqi]) => sampleSqi))
      : 0;
    const rrIntervalCount = rppgData.hrv.rrIntervalCount ?? 0;

    if (
      faceDetectionFrameCountRef.current === 0 ||
      validHrSamples.length < MIN_VALID_HR_SAMPLES_FOR_REPORT ||
      rppgSignals.ppg_signal.length < MIN_VALID_BVP_SAMPLES_FOR_REPORT ||
      averageSqi < SQI_THRESHOLD ||
      rrIntervalCount < MIN_VALID_HR_SAMPLES_FOR_REPORT
    ) {
      return t.invalidFaceScan;
    }

    return null;
  };

  const buildHealthReportInput = (rppgData: CombinedReportData['rppg']): HealthData => ({
    vitals: {
      heartRate: rppgData.vitals.heartRate,
      signalQuality: rppgData.vitals.signalQuality,
      breathingRate: rppgData.vitals.breathingRate,
    },
    hrv: {
      sdnn: rppgData.hrv.sdnn,
      rmssd: rppgData.hrv.rmssd,
      pnn50: rppgData.hrv.pnn50,
      pnn20: rppgData.hrv.pnn20,
    },
    stress: {
      level: rppgData.stress.level,
      index: rppgData.stress.index,
    },
    metadata: {
      scanDurationSeconds: recordingTime,
      timestamp: new Date().toISOString(),
      reportLanguage,
      locale: reportLocale,
    },
  });

  const buildSectionInsightsInput = (rppgData: CombinedReportData['rppg']): SectionInsightsInput => {
    const nl = rppgData.hrv.nonlinear;
    const re = rppgData.hrv.respiratoryExtended;
    return {
      language: reportLanguage,
      locale: reportLocale,
      heartRate: rppgData.vitals.heartRate.value,
      heartRateStatus: rppgData.vitals.heartRate.status,
      signalQuality: rppgData.vitals.signalQuality.percentage,
      breathingRate: rppgData.vitals.breathingRate.value,
      breathingRateStatus: rppgData.vitals.breathingRate.status,
      sdnn: rppgData.hrv.sdnn.value,
      sdnnStatus: rppgData.hrv.sdnn.status,
      rmssd: rppgData.hrv.rmssd.value,
      rmssdStatus: rppgData.hrv.rmssd.status,
      pnn50: rppgData.hrv.pnn50.value,
      pnn50Status: rppgData.hrv.pnn50.status,
      pnn20: rppgData.hrv.pnn20.value,
      pnn20Status: rppgData.hrv.pnn20.status,
      rrIntervalCount: rppgData.hrv.rrIntervalCount || 0,
      recordingClass: rppgData.hrv.recordingClass,
      sd1: nl?.sd1?.value,
      sd2: nl?.sd2?.value,
      sd1Sd2Ratio: nl?.sd1Sd2Ratio,
      sampleEntropy: nl?.sampleEntropy?.value,
      dfaAlpha1: nl?.dfaAlpha1?.value,
      stressLevel: rppgData.stress.level,
      stressIndex: rppgData.stress.index,
      sympathovagalBalance: rppgData.stress.sympathovagalBalance,
      breathingRateSd: re?.breathingRateSd?.value,
      breathingStability: re?.stability,
      breathCyclesDetected: re?.breathCyclesDetected,
    };
  };

  const buildCombinedReportData = (
    rppgData: CombinedReportData['rppg'],
    aiReport: CombinedReportData['aiReport'] | null,
    sectionInsights: CombinedReportData['sectionInsights'] | null,
    rppgSignals: RppgSignalPayload,
  ): CombinedReportData => {
    const apiRes = apiResponseRef.current;
    return {
      success: true,
      uploadedImage: previewUrl || '',
      data: {
        face_analysis_text: '',
        spiritual_interpretation: '',
      },
      rppg: rppgData,
      aiReport: apiRes?.ai_report
        ? {
          summary: apiRes.ai_report.summary || '',
          insights: apiRes.ai_report.insights || [],
          recommendations: apiRes.ai_report.recommendations || [],
          riskFactors: aiReport?.riskFactors || [],
          disclaimer: aiReport?.disclaimer || 'This report is AI-generated and for informational purposes only.',
        }
        : aiReport || undefined,
      sectionInsights: sectionInsights || undefined,
      apiHealthData: apiRes
        ? {
          heart_rate: apiRes.heart_rate,
          bp_systolic: apiRes.bp_systolic,
          bp_diastolic: apiRes.bp_diastolic,
          scan_duration_seconds: apiRes.scan_duration_seconds,
        }
        : undefined,
      rppgSignals,
    };
  };

  const sendScanDataToAPI = async () => {
    setIsUploadingData(true);
    setUploadError(null);
    setPreparedReport(null);

    try {
      const rppgData = await getFinalRppgMetrics();
      const rppgSignals = buildRppgSignalPayload();
      const validationError = validateFaceScanForReport(rppgData, rppgSignals);

      if (validationError || !rppgData) {
        setPreparedReport(null);
        setUploadError(validationError || t.invalidFaceScan);
        setScanState('complete');
        return;
      }

      const bpResult = await predictBP();

      const bpSystolic = bpResult?.bp_systolic ?? 0;
      const bpDiastolic = bpResult?.bp_diastolic ?? 0;
      const bpConfidence = bpResult?.confidence ?? 0;

      // Generate the full report before showing the completed state.
      let aiReport = null;
      let sectionInsights = null;
      try {
        const { generateHealthReport, generateSectionInsights } = await import('../../services/openaiReport');
        const [reportResult, insightsResult] = await Promise.allSettled([
          generateHealthReport(buildHealthReportInput(rppgData)),
          generateSectionInsights(buildSectionInsightsInput(rppgData)),
        ]);
        aiReport = reportResult.status === 'fulfilled' ? reportResult.value : null;
        sectionInsights = insightsResult.status === 'fulfilled' ? insightsResult.value : null;
      } catch (err) {
        console.error('Failed to generate AI report:', err);
      }

      // Prepare API payload matching the expected format
      const apiPayload = {
        report_language: reportLanguage,
        locale: reportLocale,
        data: {
          metadata: {
            timestamp: new Date().toISOString(),
            scan_duration_seconds: recordingTime,
            frames_processed: hrLogRef.current.length || 0,
            report_language: reportLanguage,
            locale: reportLocale,
          },
          rppg_signals: rppgSignals,
          vitals: {
            heart_rate: {
              value_bpm: rppgData.vitals.heartRate.value,
            },
            signal_quality: {
              value: rppgData.vitals.signalQuality.value,
            },
            blood_pressure: {
              systolic_mmHg: bpSystolic,
              diastolic_mmHg: bpDiastolic,
              confidence: bpConfidence,
            },
          },
          hrv: {
            sdnn: rppgData.hrv.sdnn.value,
            rmssd: rppgData.hrv.rmssd.value,
            pnn50: rppgData.hrv.pnn50.value / 100,
            breathing_rate: rppgData.vitals.breathingRate.value,
            frequency_domain: rppgData.hrv.frequencyDomain || undefined,
            nonlinear: rppgData.hrv.nonlinear ? {
              sd1: rppgData.hrv.nonlinear.sd1.value,
              sd2: rppgData.hrv.nonlinear.sd2.value,
              sd1_sd2_ratio: rppgData.hrv.nonlinear.sd1Sd2Ratio,
              sample_entropy: rppgData.hrv.nonlinear.sampleEntropy.value,
              dfa_alpha1: rppgData.hrv.nonlinear.dfaAlpha1.value,
            } : undefined,
            rr_interval_count: rppgData.hrv.rrIntervalCount || 0,
          },
          stress_analysis: {
            sympathovagal_balance: rppgData.stress.sympathovagalBalance,
            stress_level: rppgData.stress.level,
            stress_description: rppgData.stress.description,
            components: rppgData.stress.components,
          },
          latency: 0.0,
          ai_report: aiReport || "Health assessment completed successfully.",
          report_language: reportLanguage,
          locale: reportLocale,
        },
      };

      // Send data to API
      const userId = patient?.userId;
      if (!userId) {
        throw new Error('No active patient session. Please register the patient again.');
      }
      const response = await fetch(
        `${baseApiUrl}/aitools/wellness/v2/health/scan/${userId}`,
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

      // Store API response for use in report page — merge BP data
      if (result.success) {
        apiResponseRef.current = {
          ...result.data,
          bp_systolic: bpSystolic || result.data?.bp_systolic || 0,
          bp_diastolic: bpDiastolic || result.data?.bp_diastolic || 0,
        };
      }

      const combinedData = buildCombinedReportData(
        rppgData,
        aiReport,
        sectionInsights,
        rppgSignals,
      );
      await saveBioCareReportToAPI(combinedData);
      setPreparedReport(combinedData);
      setBioCareReport(combinedData);

      // Show the report button only after scan, report assembly, and DB save are complete.
      setScanState('complete');
    } catch (err) {
      console.error('Error sending data to API:', err);
      setPreparedReport(null);
      setUploadError(t.reportSaveFailed);
      setScanState('complete');
    } finally {
      setIsUploadingData(false);
    }
  };

  const saveBioCareReportToAPI = async (reportData: CombinedReportData) => {
    const userId = patient?.userId;
    if (!userId) {
      throw new Error('No active patient session. Please register the patient again.');
    }

    const payload = {
      user_id: userId,
      report_type: 'bio_care',
      report_language: reportLanguage,
      locale: reportLocale,
      scan_timestamp: reportData.rppg.metadata.timestamp,
      report_data: {
        rppg: reportData.rppg,
        rppg_signals: reportData.rppgSignals ?? null,
        ai_report: reportData.aiReport ?? null,
        section_insights: reportData.sectionInsights ?? null,
        api_health_data: reportData.apiHealthData ?? null,
      },
    };

    const response = await fetch(
      `${baseApiUrl}/aitools/wellness/v2/health/scan/${userId}/report`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      },
    );

    if (!response.ok) {
      throw new Error(`Report save API failed with status ${response.status}`);
    }
  };

  // Handle continue to results
  const handleContinue = () => {
    if (!preparedReport) {
      setUploadError(t.reportNotReady);
      return;
    }

    setBioCareReport(preparedReport);
    navigate('/face-report', { state: preparedReport });
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
          background: #f5f8fb;
          color: #000;
          overflow-x: hidden;
        }

        .container {
          max-width: 1400px;
          margin: 0 auto;
          padding: 0 1.5rem;
        }

        .btn-primary {
          background: linear-gradient(135deg, #0891b2 0%, #0ea5e9 100%);
          color: #fff;
          border: none;
          padding: 0.875rem 2rem;
          border-radius: 0.875rem;
          font-size: 1rem;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.2s ease;
          box-shadow: 0 14px 30px rgba(14, 165, 233, 0.24);
        }

        .btn-primary:hover {
          transform: translateY(-1px);
          box-shadow: 0 18px 34px rgba(14, 165, 233, 0.3);
        }

        .btn-primary:disabled {
          background: #BAE6FD;
          color: #fff;
          cursor: not-allowed;
        }

        .btn-secondary {
          background: #ffffff;
          border: 1px solid #D1D5DB;
          color: #374151;
          padding: 0.875rem 1.5rem;
          border-radius: 0.875rem;
          font-size: 1rem;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.2s ease;
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        .btn-secondary:hover {
          border-color: #0891b2;
          color: #0891b2;
          background: #f0f9ff;
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

        .card {
          background: rgba(255, 255, 255, 0.94);
          border: 1px solid #dbeafe;
          box-shadow: 0 24px 70px rgba(15, 23, 42, 0.12);
          border-radius: 1.25rem;
          padding: 1.5rem;
          min-height: 50vh;
          max-height: calc(100vh - 3rem);
          display: flex;
          flex-direction: column;
        }

        .drop-zone {
          border: 1px dashed #93c5fd;
          border-radius: 1rem;
          padding: 3rem 2rem;
          text-align: center;
          transition: all 0.2s ease;
          flex: 1;
          background: linear-gradient(180deg, #f8fbff 0%, #eef8ff 100%);
        }

        .video-container {
          position: relative;
          border-radius: 1.125rem;
          overflow: hidden;
          border: 1px solid #dbeafe;
          background: #0f172a;
          height: 45vh;
          max-height: 500px;
          box-shadow: inset 0 0 0 1px rgba(255,255,255,0.05), 0 18px 40px rgba(15,23,42,0.16);
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

          .btn-primary, .btn-secondary {
            padding: 0.75rem 1rem !important;
            font-size: 0.875rem !important;
          }

          .corner-bracket {
            width: 2.5rem;
            height: 2.5rem;
          }
        }
      `}</style>
      <div style={{ minHeight: '100vh', minWidth: '100vw', background: 'linear-gradient(180deg, #f8fbff 0%, #eef6fb 100%)', color: '#000', display: 'flex', flexDirection: 'column', position: 'relative', overflow: 'auto' }}>
        {/* Blurred bubbles background */}
        <div style={{
          position: "absolute",
          width: "100%",
          height: "100%",
          overflow: "hidden",
          zIndex: 0,
          display: "none",
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
        <div style={{ padding: 'clamp(72px, 7vh, 92px) 3% 3%', flex: 1, display: 'flex', flexDirection: 'column', minHeight: '100vh', position: 'relative', zIndex: 1 }}>
          {/* <div className="container"> */}
          {error && scanState === 'initial' && (
            <div className="error-message" style={{ marginBottom: '2rem' }}>
              {error}
              {error.includes('HTTPS') && (
                <div style={{ marginTop: '0.5rem', fontSize: '0.75rem' }}>
                  <strong>{t.solution}:</strong> {t.localhost}
                  <ul style={{ margin: '0.5rem 0 0 1rem' }}>
                    <li>Localhost (http://localhost:5179)</li>
                    <li>HTTPS</li>
                  </ul>
                </div>
              )}
            </div>
          )}

          <div className="main-container" style={{ display: 'flex', alignItems: 'flex-start', gap: '2rem', flex: 1, minHeight: 0 }}>

            {/* Left side - Info */}
            <div className="left-side" style={{ width: '46%', paddingTop: '0.5rem', display: 'flex', flexDirection: 'column', minHeight: 0, maxHeight: '100%', overflowY: 'auto' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', background: '#ffffff', border: '1px solid #dbeafe', borderRadius: 20, padding: '28px', boxShadow: '0 18px 50px rgba(15, 23, 42, 0.08)' }}>
                <img
                  src={ErosClinicLogo}
                  alt="EROS Wellness AI Clinic"
                  style={{ width: 170, maxWidth: '55%', height: 'auto', objectFit: 'contain', marginBottom: 4 }}
                />
                <h2 style={{
                  color: '#0891b2',
                  fontSize: '0.875rem',
                  fontWeight: 800,
                  letterSpacing: '0.05em',
                  marginBottom: '0.25rem',
                  textTransform: 'uppercase'
                }}>
                  {t.bioCare}
                </h2>

                <h1 style={{ fontSize: 'clamp(2rem, 4vw, 3.5rem)', fontWeight: 800, lineHeight: 1.05, marginBottom: '0.5rem', color: '#0f172a', letterSpacing: 0 }}>
                  {t.scanHeroTitle}
                </h1>

                <p style={{ color: '#6B7280', fontSize: '1rem', fontWeight: 400, lineHeight: 1.6 }}>
                  {t.scanHeroSubtitle}
                </p>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 10, marginTop: 8 }}>
                  {[t.lighting, t.stillPosture, t.noEyewear].map((item) => (
                    <div key={item} style={{ padding: '10px 12px', borderRadius: 12, background: '#ecfeff', border: '1px solid #bae6fd', color: '#155e75', fontSize: 12, fontWeight: 800, textAlign: 'center' }}>
                      {item}
                    </div>
                  ))}
                </div>

                {/* Do's Section */}
                <div style={{ marginTop: '1rem' }}>
                  <h4 style={{ color: '#000', fontSize: '1.125rem', fontWeight: 600, marginBottom: '0.75rem' }}>
                    {t.doTitle}
                  </h4>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    {scanDos.map((item, i) => (
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
                    {t.dontTitle}
                  </h4>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    {scanDonts.map((item, i) => (
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
            <div className="right-side" style={{ width: '54%', display: 'flex', alignItems: 'stretch', justifyContent: 'center', minHeight: 0, maxHeight: '100%' }}>
              <div className="card-wrapper" style={{ width: '92%', display: 'flex', flexDirection: 'column', minHeight: '60vh' }}>
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
                      <strong>{t.rppgWarning}:</strong> {rppgError}
                      <br />
                      <small>{t.continuingVideoOnly}</small>
                    </div>
                  )}

                  {/* Initial State */}
                  {scanState === 'initial' && (
                    <>
                      <h3 style={{ color: '#00B8D4', fontSize: '1.25rem', fontWeight: 500, textAlign: 'center', marginBottom: '1rem' }}>
                        {t.scanYourFace}
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
                          {t.openCamera}
                        </button>

                        <p style={{ color: '#6B7280', fontSize: '0.875rem', marginTop: '1rem', textAlign: 'center' }}>
                          {t.cameraHelp}
                        </p>
                      </div>

                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: '0.75rem', marginTop: '1rem' }}>
                        {[t.lighting, t.stillPosture, t.noEyewear].map((item) => (
                          <div key={item} style={{ padding: '0.75rem', borderRadius: 12, background: '#f8fafc', border: '1px solid #e5e7eb', color: '#475569', fontSize: 12, fontWeight: 700, textAlign: 'center' }}>
                            {item}
                          </div>
                        ))}
                      </div>
                    </>
                  )}

                  {/* Camera/Recording State - Shows live camera feed immediately */}
                  {(scanState === 'camera' || scanState === 'recording') && (
                    <>
                      <h3 style={{ color: '#00B8D4', fontSize: '1.25rem', fontWeight: 500, textAlign: 'center', marginBottom: '1rem' }}>
                        {scanState === 'camera' ? t.cameraPreview : t.recording}
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
                            {t.liveCamera}
                          </div>
                        )}

                        {/* Recording indicator */}
                        {scanState === 'recording' && (
                          <>
                            <div className="recording-indicator">
                              <div className="recording-dot"></div>
                              {t.rec} {recordingTime}s / {RECORDING_DURATION}s
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
                              {t.signalQualityShort}
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
                                {t.noFaceDetected}
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
                            <p style={{ color: '#00B8D4', marginTop: '1rem' }}>{t.startCamera}</p>
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
                            <span style={{ fontSize: '9px', color: '#6B7280', marginBottom: '2px' }}>{t.heartState}</span>
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
                            disabled={!isCameraReady || !rppgInitialized}
                          >
                            <VideoIcon />
                            {t.startScanRecord}
                          </button>
                          <p style={{ color: '#6B7280', fontSize: '0.875rem', marginTop: '1rem' }}>
                            {rppgInitialized ? t.scanPositionHelp : t.preparingScanner}
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
                            {t.stopRecording} ({RECORDING_DURATION - recordingTime}s {t.remaining})
                          </button>
                          <p style={{ color: '#6B7280', fontSize: '0.875rem', marginTop: '1rem' }}>
                            {t.recordingHelp}
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
                          {scanState === 'camera' ? t.closeCamera : t.cancel}
                        </button>
                      </div>
                    </>
                  )}

                  {/* Processing State */}
                  {scanState === 'processing' && (
                    <>
                      <h3 style={{ color: '#00B8D4', fontSize: '1.25rem', fontWeight: 500, textAlign: 'center', marginBottom: '1rem' }}>
                        {t.processingVideo}
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
                          {progress === 100 ? t.uploadingData : `${t.processingScan} ${progress}%`}
                        </button>
                        <p style={{ color: '#6B7280', fontSize: '0.875rem', marginTop: '1rem' }}>
                          {progress === 100
                            ? t.sendingHealthData
                            : t.analyzingScan}
                        </p>
                      </div>

                      <div style={{ display: 'flex', gap: '1rem' }}>
                        <button
                          onClick={resetScan}
                          className="btn-secondary"
                          style={{ flex: 1, justifyContent: 'center' }}
                        >
                          <XIcon />
                          {t.cancel}
                        </button>
                      </div>
                    </>
                  )}

                  {/* Complete State */}
                  {scanState === 'complete' && (
                    <>
                      <h3 style={{ color: '#00B8D4', fontSize: '1.25rem', fontWeight: 500, textAlign: 'center', marginBottom: '1rem' }}>
                        {t.scanComplete}
                      </h3>

                      <div className="video-container" style={{ marginBottom: '1rem', position: 'relative' }}>
                        {previewUrl && (
                          previewUrl.startsWith('blob:') ? (
                            <video src={previewUrl} style={{ width: '100%', height: '100%', objectFit: 'cover' }} controls />
                          ) : (
                            <img src={previewUrl} alt={t.scanComplete} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                          )
                        )}

                        {/* Corner brackets - white for complete state */}
                        <div className="corner-bracket corner-tl"></div>
                        <div className="corner-bracket corner-tr"></div>
                        <div className="corner-bracket corner-bl"></div>
                        <div className="corner-bracket corner-br"></div>
                      </div>

                      <div style={{ textAlign: 'center', marginBottom: '1rem' }}>
                        <button className={preparedReport ? 'btn-success' : 'btn-secondary'} style={{
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
                          {preparedReport ? t.scannedSuccessfully : t.scanNeedsRetry}
                        </button>
                        <p style={{ color: '#6B7280', fontSize: '0.875rem' }}>
                          {preparedReport ? t.completeHelp : uploadError || t.reportSaveFailed}
                        </p>
                      </div>

                      <div style={{ display: 'flex', gap: '1rem' }}>
                        <button
                          onClick={resetScan}
                          className="btn-secondary"
                          style={{ flex: 1, justifyContent: 'center' }}
                          disabled={isUploadingData}
                        >
                          <XIcon />
                          {t.scanAgain}
                        </button>
                        {preparedReport && (
                          <button
                            onClick={handleContinue}
                            className="btn-primary"
                            style={{
                              flex: 1,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              gap: '0.5rem',
                              padding: '1rem',
                            }}
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
                              <polyline points="9 22 9 12 15 12 15 22"></polyline>
                            </svg>
                            {t.viewBioCareReport}
                          </button>
                        )}
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
