/**
 * Vital Monitor - FacePhys rPPG Integration for Eros Eternal
 * Real-time heart rate, HRV, and stress monitoring
 */

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, Button, Alert, Spinner, Badge } from 'react-bootstrap';
import Sidebar from "@/components/layout/Sidebar";

// Types
interface HrvMetrics {
  sdnn: number;
  rmssd: number;
  pnn50: number;
  sd1: number;
  sd2: number;
  respiratoryRate: number;
  stressLevel: 'low' | 'moderate' | 'high' | 'unknown';
  stressIndex: number;
  recordingClass: string;
}

interface HealthReport {
  timestamp: string;
  vitals: any;
  hrv: any;
  stress_analysis: any;
  recording_info: any;
}

const VitalMonitor: React.FC = () => {
  const navigate = useNavigate();
  
  // Video refs
  const videoRef = useRef<HTMLVideoElement>(null);
  const previewCanvasRef = useRef<HTMLCanvasElement>(null);
  const overlayCanvasRef = useRef<HTMLCanvasElement>(null);
  const bvpCanvasRef = useRef<HTMLCanvasElement>(null);
  
  // Workers refs
  const inferenceWorkerRef = useRef<Worker | null>(null);
  const psdWorkerRef = useRef<Worker | null>(null);
  const hrvWorkerRef = useRef<Worker | null>(null);
  
  // State
  const [isInitialized, setIsInitialized] = useState(false);
  const [isRunning, setIsRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  // Vital signs
  const [heartRate, setHeartRate] = useState<number>(0);
  const [sqi, setSqi] = useState<number>(0);
  const [latency, setLatency] = useState<number>(0);
  const [fps, setFps] = useState<number>(0);
  
  // HRV metrics
  const [hrvMetrics, setHrvMetrics] = useState<HrvMetrics>({
    sdnn: 0,
    rmssd: 0,
    pnn50: 0,
    sd1: 0,
    sd2: 0,
    respiratoryRate: 0,
    stressLevel: 'unknown',
    stressIndex: 0,
    recordingClass: 'insufficient_data'
  });
  
  // Recording
  const [recordingTime, setRecordingTime] = useState(0);
  const recordingStartTime = useRef<number>(0);
  
  // Internal state refs
  const isRunningRef = useRef(false);
  const frameCount = useRef(0);
  const lastFpsTime = useRef(0);
  const inputBuffer = useRef<Float32Array>(new Float32Array(450));
  const bufferPtr = useRef(0);
  const bufferFull = useRef(false);
  const lastFaceDetectTime = useRef(0);
  const lastHrValue = useRef(70);
  const bvpLog = useRef<[number, number][]>([]);
  const hrLog = useRef<[number, number, number][]>([]);
  
  // Kalman filters
  const kfRef = useRef({ x: 0, y: 0, w: 0, h: 0, initialized: false });
  
  // FaceDetector
  const faceDetectorRef = useRef<any>(null);
  
  // Constants
  const SQI_THRESHOLD = 0.38;
  const TARGET_FPS = 30;
  const FRAME_INTERVAL = 1000 / TARGET_FPS;
  
  // Initialize workers and models
  useEffect(() => {
    const init = async () => {
      try {
        // Initialize FaceDetector from MediaPipe
        const vision = await (window as any).FilesetResolver.forVisionTasks(
          "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.21/wasm"
        );
        
        const { FaceDetector } = await import('@mediapipe/tasks-vision');
        
        try {
          faceDetectorRef.current = await FaceDetector.createFromOptions(vision, {
            baseOptions: {
              modelAssetPath: "/models/blaze_face_short_range.tflite",
              delegate: "GPU"
            },
            runningMode: "VIDEO"
          });
        } catch (err) {
          faceDetectorRef.current = await FaceDetector.createFromOptions(vision, {
            baseOptions: {
              modelAssetPath: "/models/blaze_face_short_range.tflite",
              delegate: "CPU"
            },
            runningMode: "VIDEO"
          });
        }
        
        // Load model files
        const [modelRes, projRes, sqiRes, psdRes, stateRes] = await Promise.all([
          fetch('/models/model.tflite'),
          fetch('/models/proj.tflite'),
          fetch('/models/sqi_model.tflite'),
          fetch('/models/psd_model.tflite'),
          fetch('/models/state.gz')
        ]);
        
        if (!modelRes.ok || !projRes.ok || !sqiRes.ok || !psdRes.ok) {
          throw new Error('Failed to load model files');
        }
        
        const modelBuffer = await modelRes.arrayBuffer();
        const projBuffer = await projRes.arrayBuffer();
        const sqiBuffer = await sqiRes.arrayBuffer();
        const psdBuffer = await psdRes.arrayBuffer();
        
        // Decompress state
        const ds = new DecompressionStream('gzip');
        const stateStream = stateRes.body!.pipeThrough(ds);
        const stateJson = await new Response(stateStream).json();
        
        // Initialize workers
        inferenceWorkerRef.current = new Worker(
          new URL('../workers/inference_worker.ts', import.meta.url),
          { type: 'module' }
        );
        
        psdWorkerRef.current = new Worker(
          new URL('../workers/psd_worker.ts', import.meta.url),
          { type: 'module' }
        );
        
        hrvWorkerRef.current = new Worker(
          new URL('../workers/hrv_worker.ts', import.meta.url),
          { type: 'module' }
        );
        
        // Set up worker message handlers
        setupWorkerHandlers();
        
        // Initialize workers
        inferenceWorkerRef.current.postMessage({
          type: 'init',
          payload: { modelBuffer, stateJson, projBuffer }
        }, [modelBuffer, projBuffer]);
        
        psdWorkerRef.current.postMessage({
          type: 'init',
          payload: { sqiBuffer, psdBuffer }
        }, [sqiBuffer, psdBuffer]);
        
        hrvWorkerRef.current.postMessage({ type: 'init' });
        
        setIsInitialized(true);
        setIsLoading(false);
      } catch (err: any) {
        console.error('Initialization error:', err);
        setError('Failed to initialize: ' + err.message);
        setIsLoading(false);
      }
    };
    
    init();
    
    return () => {
      stopCamera();
      inferenceWorkerRef.current?.terminate();
      psdWorkerRef.current?.terminate();
      hrvWorkerRef.current?.terminate();
    };
  }, []);
  
  const setupWorkerHandlers = () => {
    // Inference worker
    inferenceWorkerRef.current!.onmessage = (e: MessageEvent) => {
      const { type, payload } = e.data;
      if (type === 'result') {
        handleInferenceResult(payload);
      }
    };
    
    // PSD worker
    psdWorkerRef.current!.onmessage = (e: MessageEvent) => {
      const { type, payload } = e.data;
      if (type === 'result') {
        handlePsdResult(payload);
      }
    };
    
    // HRV worker
    hrvWorkerRef.current!.onmessage = (e: MessageEvent) => {
      const { type, payload } = e.data;
      if (type === 'metrics') {
        setHrvMetrics(payload);
      } else if (type === 'initDone') {
        // HRV worker ready
      }
    };
  };
  
  const handleInferenceResult = (payload: any) => {
    const { value, timestamp } = payload;
    
    if (isRunningRef.current) {
      bvpLog.current.push([timestamp, value]);
    }
    
    // Update buffer
    inputBuffer.current[bufferPtr.current] = value;
    bufferPtr.current = (bufferPtr.current + 1) % 450;
    if (bufferPtr.current === 0) bufferFull.current = true;
    
    // Send to PSD worker
    let orderedData: Float32Array;
    if (!bufferFull.current) {
      orderedData = new Float32Array(450);
      orderedData.set(inputBuffer.current.slice(0, bufferPtr.current), 450 - bufferPtr.current);
    } else {
      orderedData = new Float32Array(450);
      orderedData.set(inputBuffer.current.subarray(bufferPtr.current), 0);
      orderedData.set(inputBuffer.current.subarray(0, bufferPtr.current), 450 - bufferPtr.current);
    }
    
    psdWorkerRef.current?.postMessage({ type: 'run', payload: { inputData: orderedData } });
    
    // Draw BVP waveform
    drawBVP(value);
  };
  
  const handlePsdResult = (payload: any) => {
    const { sqi: sqiVal, hr, time } = payload;
    
    setSqi(sqiVal);
    setLatency(time);
    
    const timeSinceFace = performance.now() - lastFaceDetectTime.current;
    const hasFace = timeSinceFace < 500;
    const isReliable = sqiVal > SQI_THRESHOLD && hasFace;
    
    if (isReliable) {
      const calculatedHr = hr / 30 / (1 / 30); // Adjust based on your dt calculation
      lastHrValue.current = calculatedHr;
      setHeartRate(calculatedHr);
      
      // Send to HRV worker
      hrvWorkerRef.current?.postMessage({
        type: 'hr_data',
        payload: {
          hr: calculatedHr,
          timestamp: Date.now(),
          sqi: sqiVal,
          isValid: true
        }
      });
      
      if (isRunningRef.current) {
        hrLog.current.push([Date.now(), calculatedHr, sqiVal]);
      }
    }
  };
  
  const drawBVP = (value: number) => {
    const canvas = bvpCanvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    const width = canvas.width;
    const height = canvas.height;
    
    // Shift existing data
    const imageData = ctx.getImageData(1, 0, width - 1, height);
    ctx.putImageData(imageData, 0, 0);
    
    // Draw new point
    const y = height / 2 - (value * height / 4);
    ctx.fillStyle = '#00ff00';
    ctx.fillRect(width - 1, y, 1, 2);
  };
  
  const startCamera = async () => {
    if (!isInitialized) return;
    
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: 640, height: 480, frameRate: 30 },
        audio: false
      });
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      
      isRunningRef.current = true;
      setIsRunning(true);
      recordingStartTime.current = Date.now();
      
      // Reset buffers
      bvpLog.current = [];
      hrLog.current = [];
      bufferPtr.current = 0;
      bufferFull.current = false;
      
      hrvWorkerRef.current?.postMessage({ type: 'reset' });
      
      // Start processing loop
      requestAnimationFrame(processFrame);
      
      // Start recording timer
      const timerInterval = setInterval(() => {
        if (!isRunningRef.current) {
          clearInterval(timerInterval);
          return;
        }
        setRecordingTime(Math.floor((Date.now() - recordingStartTime.current) / 1000));
      }, 1000);
      
    } catch (err: any) {
      setError('Camera access denied: ' + err.message);
    }
  };
  
  const stopCamera = () => {
    isRunningRef.current = false;
    setIsRunning(false);
    
    const stream = videoRef.current?.srcObject as MediaStream;
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  };
  
  const processFrame = useCallback(async () => {
    if (!isRunningRef.current) return;
    
    const video = videoRef.current;
    const previewCanvas = previewCanvasRef.current;
    const overlayCanvas = overlayCanvasRef.current;
    
    if (!video || !previewCanvas || !overlayCanvas) return;
    if (video.readyState < 2) {
      requestAnimationFrame(processFrame);
      return;
    }
    
    // Update FPS
    frameCount.current++;
    const now = performance.now();
    if (now - lastFpsTime.current >= 1000) {
      setFps(frameCount.current);
      frameCount.current = 0;
      lastFpsTime.current = now;
    }
    
    // Draw video to preview canvas
    const previewCtx = previewCanvas.getContext('2d');
    if (previewCtx) {
      previewCtx.drawImage(video, 0, 0, previewCanvas.width, previewCanvas.height);
    }
    
    // Face detection
    if (faceDetectorRef.current) {
      const detections = faceDetectorRef.current.detectForVideo(video, now);
      const overlayCtx = overlayCanvas.getContext('2d');
      
      if (overlayCtx) {
        overlayCtx.clearRect(0, 0, overlayCanvas.width, overlayCanvas.height);
        
        if (detections.detections.length > 0) {
          lastFaceDetectTime.current = now;
          
          const det = detections.detections[0];
          let { originX, originY, width, height } = det.boundingBox;
          
          // Kalman filtering
          if (!kfRef.current.initialized) {
            kfRef.current = { x: originX, y: originY, w: width, h: height, initialized: true };
          } else {
            const kf = kfRef.current;
            kf.x = kf.x * 0.7 + originX * 0.3;
            kf.y = kf.y * 0.7 + originY * 0.3;
            kf.w = kf.w * 0.7 + width * 0.3;
            kf.h = kf.h * 0.7 + height * 0.3;
            originX = kf.x;
            originY = kf.y;
            width = kf.w;
            height = kf.h;
          }
          
          // Draw face box
          overlayCtx.strokeStyle = '#00b8f8';
          overlayCtx.lineWidth = 3;
          overlayCtx.strokeRect(originX, originY, width, height);
          
          // Extract face region
          const cropCanvas = document.createElement('canvas');
          cropCanvas.width = 36;
          cropCanvas.height = 36;
          const cropCtx = cropCanvas.getContext('2d');
          
          if (cropCtx) {
            cropCtx.drawImage(
              previewCanvas,
              originX, originY, width, height,
              0, 0, 36, 36
            );
            
            const imgData = cropCtx.getImageData(0, 0, 36, 36);
            const inputFloat32 = new Float32Array(36 * 36 * 3);
            
            for (let i = 0; i < imgData.data.length; i += 4) {
              const idx = i / 4;
              inputFloat32[idx * 3] = imgData.data[i] / 255.0;
              inputFloat32[idx * 3 + 1] = imgData.data[i + 1] / 255.0;
              inputFloat32[idx * 3 + 2] = imgData.data[i + 2] / 255.0;
            }
            
            inferenceWorkerRef.current?.postMessage({
              type: 'run',
              payload: { imgData: inputFloat32, dtVal: 1 / 30, timestamp: Date.now() }
            }, [inputFloat32.buffer]);
          }
        } else {
          // No face detected
          overlayCtx.strokeStyle = '#ff0000';
          overlayCtx.lineWidth = 2;
          overlayCtx.strokeRect(10, 10, overlayCanvas.width - 20, overlayCanvas.height - 20);
        }
      }
    }
    
    requestAnimationFrame(processFrame);
  }, []);
  
  const generateHealthReport = (): HealthReport => {
    const validHrLog = hrLog.current.filter(row => row[2] > 0.38);
    const avgHr = validHrLog.length > 0
      ? validHrLog.reduce((sum, row) => sum + row[1], 0) / validHrLog.length
      : lastHrValue.current;
    const avgSqi = validHrLog.length > 0
      ? validHrLog.reduce((sum, row) => sum + row[2], 0) / validHrLog.length
      : sqi;
    
    return {
      timestamp: new Date().toISOString(),
      vitals: {
        heart_rate: { value: avgHr, unit: 'BPM' },
        signal_quality: { value: avgSqi, percentage: Math.round(avgSqi * 100) },
        breathing_rate: { value: hrvMetrics.respiratoryRate, unit: 'breaths/min' }
      },
      hrv: {
        time_domain: {
          sdnn: hrvMetrics.sdnn,
          rmssd: hrvMetrics.rmssd,
          pnn50: hrvMetrics.pnn50,
          recording_class: hrvMetrics.recordingClass
        },
        nonlinear: {
          sd1: hrvMetrics.sd1,
          sd2: hrvMetrics.sd2
        }
      },
      stress_analysis: {
        stress_level: hrvMetrics.stressLevel,
        stress_index: hrvMetrics.stressIndex
      },
      recording_info: {
        duration_seconds: recordingTime,
        samples_count: hrLog.current.length
      }
    };
  };
  
  const downloadReport = () => {
    const report = generateHealthReport();
    const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `vital_report_${new Date().toISOString().slice(0, 19).replace(/:/g, '-')}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };
  
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };
  
  const getStressColor = (level: string) => {
    switch (level) {
      case 'low': return 'success';
      case 'moderate': return 'warning';
      case 'high': return 'danger';
      default: return 'secondary';
    }
  };
  
  if (isLoading) {
    return (
      <div className="d-flex flex-column flex-lg-row vh-100 vw-100" style={{ backgroundColor: '#050505' }}>
        <div className="d-none d-lg-block" style={{ width: '256px' }}>
          <Sidebar />
        </div>
        <div className="flex-grow-1 d-flex align-items-center justify-content-center">
          <div className="text-center text-white">
            <Spinner animation="border" variant="info" className="mb-3" />
            <p>Initializing Vital Monitor...</p>
          </div>
        </div>
      </div>
    );
  }
  
  return (
    <div className="d-flex flex-column flex-lg-row vh-100 vw-100" style={{ backgroundColor: '#050505', color: 'white' }}>
      {/* Sidebar */}
      <div className="d-none d-lg-block" style={{ width: '256px' }}>
        <Sidebar />
      </div>
      
      {/* Main Content */}
      <main className="flex-grow-1 overflow-auto p-3">
        {/* Header */}
        <div className="d-flex justify-content-between align-items-center mb-4">
          <Button variant="link" className="text-white" onClick={() => navigate('/home')}>
            ← Back
          </Button>
          <h2 className="m-0" style={{ color: '#00b8f8' }}>Vital Monitor</h2>
          <Button variant="link" className="text-white" onClick={() => window.location.reload()}>
            ↻
          </Button>
        </div>
        
        {error && (
          <Alert variant="danger" className="mb-3">
            {error}
          </Alert>
        )}
        
        <div className="row g-3">
          {/* Video Feed */}
          <div className="col-lg-6">
            <Card style={{ backgroundColor: '#121212', border: '1px solid #333' }}>
              <Card.Header className="d-flex justify-content-between align-items-center" style={{ backgroundColor: '#1a1a1a' }}>
                <span>Camera Feed</span>
                <Badge bg={isRunning ? 'success' : 'secondary'}>
                  {isRunning ? 'LIVE' : 'OFFLINE'}
                </Badge>
              </Card.Header>
              <Card.Body className="p-0 position-relative">
                <div style={{ position: 'relative', width: '100%', aspectRatio: '4/3', backgroundColor: '#000' }}>
                  <video
                    ref={videoRef}
                    playsInline
                    muted
                    style={{ display: 'none' }}
                  />
                  <canvas
                    ref={previewCanvasRef}
                    width={640}
                    height={480}
                    style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                  />
                  <canvas
                    ref={overlayCanvasRef}
                    width={640}
                    height={480}
                    style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' }}
                  />
                </div>
                
                {/* Controls */}
                <div className="p-3 d-flex gap-2">
                  {!isRunning ? (
                    <Button
                      variant="primary"
                      onClick={startCamera}
                      disabled={!isInitialized}
                      style={{ backgroundColor: '#00b8f8', border: 'none' }}
                    >
                      Start Monitoring
                    </Button>
                  ) : (
                    <Button
                      variant="danger"
                      onClick={stopCamera}
                    >
                      Stop
                    </Button>
                  )}
                  
                  {hrLog.current.length > 0 && (
                    <Button variant="outline-light" onClick={downloadReport}>
                      Download Report
                    </Button>
                  )}
                </div>
              </Card.Body>
            </Card>
            
            {/* BVP Waveform */}
            <Card className="mt-3" style={{ backgroundColor: '#121212', border: '1px solid #333' }}>
              <Card.Header style={{ backgroundColor: '#1a1a1a' }}>BVP Signal</Card.Header>
              <Card.Body className="p-0">
                <canvas
                  ref={bvpCanvasRef}
                  width={400}
                  height={100}
                  style={{ width: '100%', height: '100px', backgroundColor: '#000' }}
                />
              </Card.Body>
            </Card>
          </div>
          
          {/* Metrics */}
          <div className="col-lg-6">
            {/* Primary Stats */}
            <div className="row g-2 mb-3">
              <div className="col-6">
                <Card style={{ backgroundColor: '#121212', border: '1px solid #333' }}>
                  <Card.Body className="text-center">
                    <div className="text-muted small">Heart Rate</div>
                    <div className="fs-2 fw-bold" style={{ color: '#00b8f8' }}>
                      {heartRate > 0 ? Math.round(heartRate) : '--'}
                    </div>
                    <div className="text-muted small">BPM</div>
                  </Card.Body>
                </Card>
              </div>
              <div className="col-6">
                <Card style={{ backgroundColor: '#121212', border: '1px solid #333' }}>
                  <Card.Body className="text-center">
                    <div className="text-muted small">Signal Quality</div>
                    <div className="fs-2 fw-bold" style={{ color: sqi > 0.5 ? '#00ff00' : '#ffaa00' }}>
                      {sqi > 0 ? Math.round(sqi * 100) : '--'}
                    </div>
                    <div className="text-muted small">%</div>
                  </Card.Body>
                </Card>
              </div>
              <div className="col-6">
                <Card style={{ backgroundColor: '#121212', border: '1px solid #333' }}>
                  <Card.Body className="text-center">
                    <div className="text-muted small">Respiratory Rate</div>
                    <div className="fs-2 fw-bold" style={{ color: '#00b8f8' }}>
                      {hrvMetrics.respiratoryRate > 0 ? hrvMetrics.respiratoryRate : '--'}
                    </div>
                    <div className="text-muted small">br/min</div>
                  </Card.Body>
                </Card>
              </div>
              <div className="col-6">
                <Card style={{ backgroundColor: '#121212', border: '1px solid #333' }}>
                  <Card.Body className="text-center">
                    <div className="text-muted small">Recording Time</div>
                    <div className="fs-2 fw-bold" style={{ color: '#00b8f8' }}>
                      {formatTime(recordingTime)}
                    </div>
                    <div className="text-muted small">mm:ss</div>
                  </Card.Body>
                </Card>
              </div>
            </div>
            
            {/* HRV Metrics */}
            <Card className="mb-3" style={{ backgroundColor: '#121212', border: '1px solid #333' }}>
              <Card.Header style={{ backgroundColor: '#1a1a1a' }}>Heart Rate Variability</Card.Header>
              <Card.Body>
                <div className="row g-2">
                  <div className="col-4 text-center">
                    <div className="text-muted small">SDNN</div>
                    <div className="fs-4 fw-bold">{hrvMetrics.sdnn > 0 ? hrvMetrics.sdnn.toFixed(1) : '--'}</div>
                    <div className="text-muted small">ms</div>
                  </div>
                  <div className="col-4 text-center">
                    <div className="text-muted small">RMSSD</div>
                    <div className="fs-4 fw-bold">{hrvMetrics.rmssd > 0 ? hrvMetrics.rmssd.toFixed(1) : '--'}</div>
                    <div className="text-muted small">ms</div>
                  </div>
                  <div className="col-4 text-center">
                    <div className="text-muted small">pNN50</div>
                    <div className="fs-4 fw-bold">{hrvMetrics.pnn50 > 0 ? hrvMetrics.pnn50.toFixed(1) : '--'}</div>
                    <div className="text-muted small">%</div>
                  </div>
                </div>
              </Card.Body>
            </Card>
            
            {/* Stress Analysis */}
            <Card className="mb-3" style={{ backgroundColor: '#121212', border: '1px solid #333' }}>
              <Card.Header style={{ backgroundColor: '#1a1a1a' }}>Stress Analysis</Card.Header>
              <Card.Body>
                <div className="d-flex justify-content-between align-items-center">
                  <div>
                    <div className="text-muted small">Stress Level</div>
                    <Badge bg={getStressColor(hrvMetrics.stressLevel)} className="fs-6 mt-1">
                      {hrvMetrics.stressLevel !== 'unknown' ? hrvMetrics.stressLevel.toUpperCase() : 'CALCULATING...'}
                    </Badge>
                  </div>
                  <div className="text-end">
                    <div className="text-muted small">Stress Index</div>
                    <div className="fs-4 fw-bold" style={{ color: '#00b8f8' }}>
                      {hrvMetrics.stressIndex > 0 ? Math.round(hrvMetrics.stressIndex) : '--'}
                    </div>
                    <div className="text-muted small">/ 100</div>
                  </div>
                </div>
              </Card.Body>
            </Card>
            
            {/* Technical Stats */}
            <Card style={{ backgroundColor: '#121212', border: '1px solid #333' }}>
              <Card.Header style={{ backgroundColor: '#1a1a1a' }}>Technical</Card.Header>
              <Card.Body>
                <div className="row g-2">
                  <div className="col-6">
                    <div className="text-muted small">FPS</div>
                    <div className="fw-bold">{fps}</div>
                  </div>
                  <div className="col-6">
                    <div className="text-muted small">Latency</div>
                    <div className="fw-bold">{latency.toFixed(1)} ms</div>
                  </div>
                </div>
              </Card.Body>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
};

export default VitalMonitor;
