import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Stars from '../stars';

type ScanState = 'initial' | 'camera' | 'recording' | 'processing' | 'complete';

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
  const navigate = useNavigate();

  // Check if browser supports camera
  const checkCameraSupport = (): boolean => {
    // Allow camera on localhost, local network IPs, and HTTPS
    const isSecureContext = window.isSecureContext;
    const hostname = window.location.hostname;

    const isLocalhost = hostname === 'localhost' ||
      hostname === '127.0.0.1' ||
      hostname === '[::1]';

    // Allow common local network IP patterns
    const isLocalNetwork = /^192\.168\.\d+\.\d+$/.test(hostname) ||
      /^10\.\d+\.\d+\.\d+$/.test(hostname) ||
      /^172\.(1[6-9]|2[0-9]|3[0-1])\.\d+\.\d+$/.test(hostname);

    // Allow camera in development or secure contexts
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

  // Handle webcam access
  const openCamera = async () => {
    setError(null);
    setIsCameraReady(false);

    if (!checkCameraSupport()) {
      return;
    }

    try {
      // Get camera with proper constraints
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

      // Use setTimeout to ensure video element is rendered
      setTimeout(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play()
            .then(() => {
              setIsCameraReady(true);
            })
            .catch(err => {
              console.error('Error playing video:', err);
              setError('Error starting camera preview. Please try again.');
            });
        } else {
          // If videoRef is still not available, try again
          setTimeout(() => {
            if (videoRef.current) {
              videoRef.current.srcObject = stream;
              videoRef.current.play()
                .then(() => {
                  setIsCameraReady(true);
                })
                .catch(err => {
                  console.error('Error playing video:', err);
                  setError('Error starting camera preview. Please try again.');
                });
            }
          }, 100);
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

    // Try different MIME types for better browser compatibility
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

        // Create preview URL
        const url = URL.createObjectURL(blob);
        setPreviewUrl(url);

        // Stop camera stream
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
      // Start recording with timeslice (100ms chunks)
      mediaRecorder.start(100);
      setScanState('recording');
      setRecordingTime(0);
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

          // Stop recording after 40 seconds
          if (newTime >= 40) {
            stopRecording();
            return 40;
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
            setScanState('complete');
            return 100;
          }
          return prev + 10;
        });
      }, 200);
      return () => clearInterval(interval);
    }
  }, [scanState]);

  const resetScan = () => {
    // Clean up
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

    setScanState('initial');
    setProgress(0);
    setRecordedVideo(null);
    setPreviewUrl(null);
    setRecordingTime(0);
    setError(null);
    setIsCameraReady(false);
  };

  // Handle skip to results
  const handleSkip = () => {
    // Clean up camera if it's active
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }

    // Navigate to result page
    navigate('/result');
  };

  // Handle continue to results
  const handleContinue = async () => {
    if (!recordedVideo) {
      setError('No video recorded');
      return;
    }

    console.log('Continuing to spiritual journey...');
    console.log('Recorded video blob:', recordedVideo);
    console.log('Video size:', recordedVideo.size, 'bytes');
    console.log('Video type:', recordedVideo.type);

    // Here you would send the recordedVideo blob to your API
    try {
      const formData = new FormData();
      const fileExtension = recordedVideo.type.includes('mp4') ? 'mp4' : 'webm';
      formData.append('video', recordedVideo, `face-scan-${Date.now()}.${fileExtension}`);

      // Example API call (uncomment and adjust URL)
      /*
      const response = await fetch('/api/upload-face-scan', {
        method: 'POST',
        body: formData,
      });
      
      if (!response.ok) {
        throw new Error('Upload failed');
      }
      
      const result = await response.json();
      console.log('Upload successful:', result);
      */

      // Navigate to result page after successful "upload"
      navigate('/result');

    } catch (err) {
      console.error('Upload error:', err);
      setError('Failed to upload video. Please try again.');
    }
  };

  // Stop recording manually
  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop();
    }

    // Don't stop the camera stream here - it will be stopped in mediaRecorder.onstop
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
          background: #000;
          color: #fff;
          overflow-x: hidden;
        }

        .container {
          max-width: 1400px;
          margin: 0 auto;
          padding: 0 1.5rem;
        }

        .btn-primary {
          background: #00B8D4;
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
          background: #00ACC1;
        }

        .btn-primary:disabled {
          background: #1E3A47;
          color: #4A5568;
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
          border: 1px solid #6B7280;
          color: #6B7280;
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
          border-color: #00B8D4;
          color: #00B8D4;
        }

        .card {
          background: #1A1A1A;
          border: 1px solid #2D2D2D;
          border-radius: 1rem;
          padding: 2.5rem;
        }

        .drop-zone {
          border: 2px dashed #2D3748;
          border-radius: 1rem;
          padding: 4rem 2rem;
          text-align: center;
          transition: all 0.2s ease;
        }

        .video-container {
          position: relative;
          border-radius: 1rem;
          overflow: hidden;
          border: 4px solid #2D3748;
          background: #0F1419;
          aspect-ratio: 16/9;
          min-height: 300px;
        }

        video {
          width: 100%;
          height: 100%;
          display: block;
          object-fit: cover;
          background: #000;
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

        @media (max-width: 1024px) {
          .main-container {
            flex-direction: column !important;
          }
          
          .left-side, .right-side {
            width: 100% !important;
          }
        }

        @media (max-width: 768px) {
          .card {
            padding: 1.5rem;
          }
          
          h1 {
            font-size: 2rem !important;
          }
          
          .video-container {
            aspect-ratio: 4/3;
          }
        }
      `}</style>
      <div style={{ minHeight: '100vh', minWidth: '100vw', background: '#000', color: '#fff', padding: '3rem 0' }}>
        <div className="container">
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

          <div className="main-container" style={{ display: 'flex', alignItems: 'flex-start', gap: '3rem' }}>

            {/* Left side - Info */}
            <div className="left-side" style={{ width: '50%', paddingTop: '2rem' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                <h2 style={{
                  color: '#00B8D4',
                  fontSize: '0.875rem',
                  fontWeight: 500,
                  letterSpacing: '0.05em',
                  marginBottom: '1rem'
                }}>
                  Face Scan
                </h2>

                <h1 style={{ fontSize: '3rem', fontWeight: 400, lineHeight: 1.2, marginBottom: '1rem', color: '#fff' }}>
                  Scan yourself and see how health rate works
                </h1>

                <p style={{ color: '#9CA3AF', fontSize: '1rem', fontWeight: 400, lineHeight: 1.6 }}>
                  "Research-driven. Precision-crafted. Shen AI transforms your health journey."
                </p>

              </div>
            </div>

            {/* Right side - Scan Interface */}
            <div className="right-side" style={{ width: '50%', display: 'flex', alignItems: 'flex-start', justifyContent: 'center' }}>
              <div style={{ width: '100%', maxWidth: '42rem' }}>
                <div className="card">

                  {/* Error message */}
                  {error && scanState !== 'initial' && (
                    <div className="error-message" style={{ marginBottom: '1rem' }}>
                      {error}
                    </div>
                  )}

                  {/* Initial State */}
                  {scanState === 'initial' && (
                    <>
                      <h3 style={{ color: '#00B8D4', fontSize: '1.5rem', fontWeight: 500, textAlign: 'center', marginBottom: '2rem' }}>
                        Scan your face
                      </h3>

                      <div
                        className="drop-zone"
                        style={{
                          minHeight: '300px',
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

                      <div style={{ display: 'flex', gap: '1rem', marginTop: '2rem' }}>
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
                      <h3 style={{ color: '#00B8D4', fontSize: '1.5rem', fontWeight: 500, textAlign: 'center', marginBottom: '2rem' }}>
                        {scanState === 'camera' ? 'Camera Preview' : 'Recording...'}
                      </h3>

                      <div className="video-container" style={{ marginBottom: '2rem', position: 'relative' }}>
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
                      </div>

                      {/* Camera action buttons */}
                      {scanState === 'camera' && (
                        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
                          <button
                            onClick={startRecording}
                            className="btn-primary"
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '0.5rem',
                              margin: '0 auto',
                              padding: '1rem 2rem',
                              fontSize: '1.1rem'
                            }}
                            disabled={!isCameraReady}
                          >
                            <VideoIcon />
                            Start Scan (Record 40s)
                          </button>
                          <p style={{ color: '#9CA3AF', fontSize: '0.875rem', marginTop: '1rem' }}>
                            Position your face in the frame and click Start Scan to begin recording
                          </p>
                        </div>
                      )}

                      {scanState === 'recording' && (
                        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
                          <button
                            onClick={stopRecording}
                            className="btn-primary"
                            style={{
                              background: '#EF4444',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '0.5rem',
                              margin: '0 auto',
                              padding: '1rem 2rem',
                              fontSize: '1.1rem'
                            }}
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <rect x="6" y="6" width="12" height="12"></rect>
                            </svg>
                            Stop Recording ({40 - recordingTime}s remaining)
                          </button>
                          <p style={{ color: '#9CA3AF', fontSize: '0.875rem', marginTop: '1rem' }}>
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
                      <h3 style={{ color: '#00B8D4', fontSize: '1.5rem', fontWeight: 500, textAlign: 'center', marginBottom: '2rem' }}>
                        Processing Video
                      </h3>

                      <div className="video-container" style={{ marginBottom: '2rem', position: 'relative' }}>
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

                      <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
                        <button className="btn-primary" style={{
                          background: '#00B8D4',
                          cursor: 'default',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.5rem',
                          margin: '0 auto',
                          padding: '1rem 2rem'
                        }}>
                          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <circle cx="12" cy="12" r="10"></circle>
                            <polyline points="12 6 12 12 16 14"></polyline>
                          </svg>
                          Processing Face Scan... {progress}%
                        </button>
                        <p style={{ color: '#9CA3AF', fontSize: '0.875rem', marginTop: '1rem' }}>
                          Analyzing facial features and generating health insights...
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
                      <h3 style={{ color: '#00B8D4', fontSize: '1.5rem', fontWeight: 500, textAlign: 'center', marginBottom: '2rem' }}>
                        Scan Complete!
                      </h3>

                      <div className="video-container" style={{ marginBottom: '2rem', position: 'relative' }}>
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

                      <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
                        <button className="btn-success" style={{
                          marginBottom: '1rem',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.5rem',
                          margin: '0 auto',
                          padding: '1rem 2rem'
                        }}>
                          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                            <polyline points="22 4 12 14.01 9 11.01"></polyline>
                          </svg>
                          Face Scanned Successfully!
                        </button>
                        <p style={{ color: '#9CA3AF', fontSize: '0.875rem' }}>
                          Your face scan is complete. View your report in the health AI dashboard.
                        </p>
                      </div>

                      <div style={{ display: 'flex', gap: '1rem' }}>
                        <button
                          onClick={resetScan}
                          className="btn-secondary"
                          style={{ flex: 1, justifyContent: 'center' }}
                        >
                          <XIcon />
                          Scan Again
                        </button>
                        <button
                          onClick={handleContinue}
                          className="btn-primary"
                          style={{
                            flex: 1,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '0.5rem',
                            padding: '1rem'
                          }}
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
                            <polyline points="9 22 9 12 15 12 15 22"></polyline>
                          </svg>
                          Continue to spiritual journey
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