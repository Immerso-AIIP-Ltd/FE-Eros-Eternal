// src/ErosChatUI.tsx
import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Row, Col, Button, Form } from "react-bootstrap";
import starone from "@/assets/images/star1.png";
import startwo from "@/assets/images/star2.png";
import starthree from "@/assets/images/star3.png";
import starfour from "@/assets/images/star4.png";
import sparkle from "@/assets/images/sparkle.png";
import Stars from "@/components/ui/stars";
import VoiceMessage from "@/VoiceMessage";
import MicVisualizer from "@/MicVisualizer";
import { baseApiUrl } from "@/config/api";

interface Message {
    sender: "user" | "ai";
    text?: string;
    imageList?: string[];
    audio?: string; // blob URL for display
    audioBlob?: Blob; // actual blob for API upload
    duration?: number;
}

// Define the flow steps
type FlowStep = 'welcome' | 'image_uploaded' | 'voice_uploaded' | 'stool_pattern' | 'daily_routine' | 'additional_info' | 'generating_report' | 'completed';

const AgeTrack: React.FC = () => {
    const navigate = useNavigate();
    const [activeModel, setActiveModel] = useState<"gpt1" | "gpt2pro">("gpt1");
    const [inputValue, setInputValue] = useState<string>("");
    const [isRecording, setIsRecording] = useState(false);
    const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
    const [recordingTime, setRecordingTime] = useState(0);
    const timerRef = useRef<NodeJS.Timeout | null>(null);

    // Flow control
    const [currentStep, setCurrentStep] = useState<FlowStep>('welcome');
    const [collectedData, setCollectedData] = useState<{
        imageData?: File;
        voiceData?: Blob;
        stoolPattern?: string;
        dailyRoutine?: string;
        additionalInfo?: string;
    }>({});

    const [messages, setMessages] = useState<Message[]>([
        {
            sender: "ai",
            text: "⭐ Welcome to Eternal AI! ⭐\n\nTo begin your personalized health analysis journey, please upload a clear photo of your face."
        }
    ]);

    let animationId: number;
    const videoRef = useRef<HTMLVideoElement | null>(null);
    const canvasRef = useRef<HTMLCanvasElement | null>(null);
    const [showCamera, setShowCamera] = useState(false);

    const [previewImage, setPreviewImage] = useState<string | null>(null);
    const [attachedImages, setAttachedImages] = useState<string[]>([]);
    const [attachedFiles, setAttachedFiles] = useState<File[]>([]);
    const [micStream, setMicStream] = useState<MediaStream | null>(null);
    const [userId, setUserId] = useState<string | null>(null);


    const convertToMp3 = async (audioBlob: Blob): Promise<Blob> => {
        return new Promise((resolve, reject) => {
            const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
            const fileReader = new FileReader();

            fileReader.onload = async (e) => {
                try {
                    const arrayBuffer = e.target?.result as ArrayBuffer;
                    const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
                    const wavBlob = audioBufferToWav(audioBuffer);
                    resolve(wavBlob);
                } catch (error) {
                    console.error("Audio conversion error:", error);
                    resolve(audioBlob);
                }
            };

            fileReader.onerror = () => {
                console.error("FileReader error");
                resolve(audioBlob);
            };

            fileReader.readAsArrayBuffer(audioBlob);
        });
    };

    const audioBufferToWav = (audioBuffer: AudioBuffer): Blob => {
        const numberOfChannels = audioBuffer.numberOfChannels;
        const sampleRate = audioBuffer.sampleRate;
        const format = 1; // PCM
        const bitDepth = 16;

        const bytesPerSample = bitDepth / 8;
        const blockAlign = numberOfChannels * bytesPerSample;
        const byteRate = sampleRate * blockAlign;
        const dataSize = audioBuffer.length * blockAlign;
        const bufferSize = 44 + dataSize;

        const arrayBuffer = new ArrayBuffer(bufferSize);
        const view = new DataView(arrayBuffer);

        const writeString = (offset: number, string: string) => {
            for (let i = 0; i < string.length; i++) {
                view.setUint8(offset + i, string.charCodeAt(i));
            }
        };

        writeString(0, 'RIFF');
        view.setUint32(4, bufferSize - 8, true);
        writeString(8, 'WAVE');
        writeString(12, 'fmt ');
        view.setUint32(16, 16, true);
        view.setUint16(20, format, true);
        view.setUint16(22, numberOfChannels, true);
        view.setUint32(24, sampleRate, true);
        view.setUint32(28, byteRate, true);
        view.setUint16(32, blockAlign, true);
        view.setUint16(34, bitDepth, true);
        writeString(36, 'data');
        view.setUint32(40, dataSize, true);

        let offset = 44;
        for (let i = 0; i < audioBuffer.length; i++) {
            for (let channel = 0; channel < numberOfChannels; channel++) {
                const sample = Math.max(-1, Math.min(1, audioBuffer.getChannelData(channel)[i]));
                view.setInt16(offset, sample * 0x7FFF, true);
                offset += 2;
            }
        }

        return new Blob([arrayBuffer], { type: 'audio/wav' });
    };

    useEffect(() => {
        const id = localStorage.getItem('user_id');
        setUserId(id);
    }, []);

    const sendMessage = async () => {
        if (!inputValue.trim() && attachedImages.length === 0) return;

        const userMsg = {
            sender: "user" as const,
            text: inputValue || "",
            imageList: attachedImages.length > 0 ? [...attachedImages] : []
        };

        setMessages((prev) => [...prev, userMsg]);
        await handleFlowStep(inputValue, attachedFiles);

        setInputValue("");
        setAttachedImages([]);
        setAttachedFiles([]);

        const textarea = document.querySelector<HTMLTextAreaElement>("#chat-input-textarea");
        if (textarea) {
            textarea.style.height = "40px";
        }
    };

    const handleFlowStep = async (userInput: string, files: File[]) => {
        switch (currentStep) {
            case 'welcome':
                if (files.length > 0) {
                    setCollectedData(prev => ({ ...prev, imageData: files[0] }));
                    setCurrentStep('image_uploaded');
                    setMessages((prev) => [...prev, {
                        sender: "ai",
                        text: "Great! Image received. Now please upload a voice message to continue the analysis."
                    }]);
                }
                break;

            case 'image_uploaded':
                // Handled by voice recording
                break;

            case 'voice_uploaded':
                if (userInput.trim()) {
                    setCollectedData(prev => ({ ...prev, stoolPattern: userInput.trim() }));
                    setCurrentStep('stool_pattern');
                    setMessages((prev) => [...prev, {
                        sender: "ai",
                        text: "Thank you. Now please describe your daily routine (e.g., wake up time, meals, exercise, sleep schedule)."
                    }]);
                }
                break;

            case 'stool_pattern':
                if (userInput.trim()) {
                    setCollectedData(prev => ({ ...prev, dailyRoutine: userInput.trim() }));
                    setCurrentStep('daily_routine');
                    setMessages((prev) => [...prev, {
                        sender: "ai",
                        text: "Please provide any additional information that might be relevant to your health analysis (medications, allergies, symptoms, etc.)."
                    }]);
                }
                break;

            case 'daily_routine':
                if (userInput.trim()) {
                    setCollectedData(prev => ({ ...prev, additionalInfo: userInput.trim() }));
                    setCurrentStep('additional_info');
                    setMessages((prev) => [...prev, {
                        sender: "ai",
                        text: "Generating your personalized health report..."
                    }]);

                    await generateHealthReport();
                }
                break;
        }
    };


    const generateHealthReport = async () => {
        try {
            setCurrentStep('generating_report');

            const formData = new FormData();

            // Append image if available
            if (collectedData.imageData) {
                formData.append('face_image', collectedData.imageData, 'face.png');
            } else {
                console.warn("No image data available, appending empty string for face_image");
                formData.append('face_image', ''); // Fallback if required
            }

            // Append audio if available
            if (collectedData.voiceData) {
                const fileExtension = collectedData.voiceData.type.includes('wav') ? '.wav' : '.webm';
                formData.append('audio_data', collectedData.voiceData, `voice_recording${fileExtension}`);
            } else {
                console.warn("No voice data available, appending empty string for audio_data");
                formData.append('audio_data', ''); // Fallback if required
            }

            // Append text fields, ensuring they are strings
            formData.append('stool_pattern', collectedData.stoolPattern || '');
            formData.append('daily_routine', collectedData.dailyRoutine || '');
            formData.append('additional_info', collectedData.additionalInfo || '');
            formData.append('user_id', userId || '123');

            // Log FormData contents for debugging
            for (let [key, value] of formData.entries()) {
                console.log(key, typeof value === 'string' ? value : 'Non-string value');
            }

            const reportUrl = `http://192.168.1.171:6001/aitools/wellness/v2/bio/holistic-analyze`;
            const response = await fetch(reportUrl, {
                method: 'POST',
                body: formData,
            });

            if (!response.ok) {
                const errorText = await response.text(); // Get full error response
                throw new Error(`HTTP error! status: ${response.status}, details: ${errorText}`);
            }

            const reportData = await response.json();

            if (reportData.success) {
                setCurrentStep('completed');
                setMessages((prev) => [...prev, {
                    sender: "ai",
                    text: reportData.message || "Your personalized health report has been generated successfully!"
                }]);

                if (reportData.data && reportData.data.result) {
                    const formattedReport = formatHealthReport(reportData.data.result, reportData.data.analysis);
                    setMessages((prev) => [...prev, {
                        sender: "ai",
                        text: formattedReport
                    }]);
                }
                setShowGoBack(true);
            } else {
                setMessages((prev) => [...prev, {
                    sender: "ai",
                    text: reportData.message || "Failed to generate report. Please try again."
                }]);
            }
        } catch (error) {
            console.error("Health report API error:", error);
            setMessages((prev) => [...prev, {
                sender: "ai",
                text: `Error occurred while generating your health report. Please try again. Details: ${error.message}`
            }]);
        }
    };


    const formatHealthReport = (result: string, analysis: any): string => {
        const {
            spiritual_biological_age,
            age_difference,
            life_force_years_gained_or_lost,
            flame_vitality_score,
            flame_vitality_trend,
            gut_wisdom_score,
            agni_strength,
            mantra_score,
            mental_sattva_rating,
            weekly_transformation_metrics,
            comprehensive_analysis,
            spiritual_guidance,
            energy_medicine_recommendations,
            ayurvedic_constitutional_analysis,
            chinese_medicine_insights,
            confidence_level,
            priority_actions
        } = analysis;

        return `
🌟 **Your Personalized Health Report** 🌟

${result}

### Detailed Analysis
- **Spiritual Biological Age:** ${spiritual_biological_age} years
- **Age Difference:** ${age_difference} years (${age_difference < 0 ? 'YOUNGER' : 'OLDER'} biologically)
- **Life Force Years Gained/Lost:** ${life_force_years_gained_or_lost} years
- **Flame Vitality Score:** ${flame_vitality_score}/100 (${flame_vitality_trend})
- **Gut Wisdom Score:** ${gut_wisdom_score}/100 (Agni Strength: ${agni_strength})
- **Mantra Resonance Score:** ${mantra_score}/100
- **Mental Sattva Rating:** ${mental_sattva_rating}/100
- **Weekly Transformation Metrics:**
  - Meditation Hours: ${weekly_transformation_metrics.meditation_hours}
  - Physical Activity Sessions: ${weekly_transformation_metrics.physical_activity_sessions}
  - Social Interactions: ${weekly_transformation_metrics.social_interactions}
  - Creative Expression: ${weekly_transformation_metrics.creative_expression}
- **Comprehensive Analysis:** ${comprehensive_analysis}
- **Spiritual Guidance:** ${spiritual_guidance}
- **Energy Medicine Recommendations:**
  ${energy_medicine_recommendations.map((rec: string, index: number) => `${index + 1}. ${rec}`).join('\n  ')}
- **Ayurvedic Constitutional Analysis:** ${ayurvedic_constitutional_analysis}
- **Chinese Medicine Insights:** ${chinese_medicine_insights}
- **Confidence Level:** ${confidence_level}%
- **Priority Actions:**
  ${priority_actions.map((action: string, index: number) => `${index + 1}. ${action}`).join('\n  ')}

Thank you for using our service! (Generated at 02:47 PM IST on Saturday, September 06, 2025)
    `;
    };

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (!files || files.length === 0) return;

        const file = files[0];
        const imageUrl = URL.createObjectURL(file);

        setAttachedImages(prev => [...prev, imageUrl]);
        setAttachedFiles(prev => [...prev, file]);
    };

    const [showGoBack, setShowGoBack] = useState(false);

    const startRecording = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            setMicStream(stream);
            const recorder = new MediaRecorder(stream, {
                mimeType: "audio/webm;codecs=opus",
            });

            const chunks: Blob[] = [];

            recorder.ondataavailable = (e) => {
                if (e.data.size > 0) {
                    chunks.push(e.data);
                }
            };

            recorder.onstop = async () => {
                const audioBlob = new Blob(chunks, { type: "audio/webm;codecs=opus" });
                const audioUrl = URL.createObjectURL(audioBlob);

                try {
                    const convertedBlob = await convertToMp3(audioBlob);

                    // Store voice data
                    setCollectedData(prev => ({ ...prev, voiceData: convertedBlob }));

                    // Add to messages
                    setMessages((prev) => [...prev, {
                        sender: "user",
                        audio: audioUrl,
                        audioBlob: convertedBlob,
                        duration: recordingTime
                    }]);

                    // Move to next step
                    if (currentStep === 'image_uploaded') {
                        setCurrentStep('voice_uploaded');
                        setMessages((prev) => [...prev, {
                            sender: "ai",
                            text: "Perfect! Voice message received. Now please describe your stool pattern (e.g., frequency, consistency, color, any irregularities)."
                        }]);
                    }

                } catch (conversionError) {
                    console.error("Audio conversion failed:", conversionError);
                    // Handle error appropriately
                }
            };

            recorder.start();
            setMediaRecorder(recorder);
            setIsRecording(true);

            setRecordingTime(0);
            timerRef.current = setInterval(() => {
                setRecordingTime((prev) => prev + 1);
            }, 1000);
        } catch (err) {
            console.error("Microphone error:", err);
            setMessages((prev) => [...prev, {
                sender: "ai",
                text: "Could not access microphone. Please check permissions and try again."
            }]);
        }
    };

    const stopRecording = () => {
        if (mediaRecorder && isRecording) {
            mediaRecorder.stop();
            setIsRecording(false);
            if (timerRef.current) clearInterval(timerRef.current);
            if (micStream) {
                micStream.getTracks().forEach(track => track.stop());
            }
        }
        cancelAnimationFrame(animationId);
    };

    const formatTime = (secs: number) => {
        const m = Math.floor(secs / 60).toString().padStart(2, "0");
        const s = (secs % 60).toString().padStart(2, "0");
        return `${m}:${s}`;
    };

    const [stars] = useState(() =>
        Array.from({ length: 12 }, () => ({
            x: Math.random() * 100,
            y: Math.random() * 100,
            opacity: 0.3 + Math.random() * 0.5,
        }))
    );

    const openCamera = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ video: true });
            if (videoRef.current) {
                videoRef.current.srcObject = stream;
                videoRef.current.play();
            }
            setShowCamera(true);
        } catch (err) {
            console.error("Camera error:", err);
        }
    };

    const capturePhoto = () => {
        if (!videoRef.current || !canvasRef.current) return;

        const video = videoRef.current;
        const canvas = canvasRef.current;
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        const ctx = canvas.getContext("2d");
        if (ctx) ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

        canvas.toBlob(async (blob) => {
            if (blob) {
                const imageUrl = URL.createObjectURL(blob);
                const file = new File([blob], 'camera_capture.png', { type: 'image/png' });

                // Add to messages
                const userMsg = {
                    sender: "user" as const,
                    text: "",
                    imageList: [imageUrl]
                };
                setMessages((prev) => [...prev, userMsg]);

                // Store image data and proceed with flow
                setCollectedData(prev => ({ ...prev, imageData: file }));
                setCurrentStep('image_uploaded');
                setMessages((prev) => [...prev, {
                    sender: "ai",
                    text: "Great! Image received. Now please upload a voice message to continue the analysis."
                }]);
            }
        }, "image/png");

        setShowCamera(false);

        // Stop stream
        const stream = video.srcObject as MediaStream;
        if (stream) {
            stream.getTracks().forEach((track) => track.stop());
        }
    };

    const closeCamera = () => {
        if (videoRef.current && videoRef.current.srcObject) {
            (videoRef.current.srcObject as MediaStream).getTracks().forEach((t) => t.stop());
        }
        setShowCamera(false);
    };

    const cancelRecording = () => {
        if (mediaRecorder) {
            mediaRecorder.stop();
        }
        if (timerRef.current) clearInterval(timerRef.current);
        if (micStream) {
            micStream.getTracks().forEach(track => track.stop());
        }
        cancelAnimationFrame(animationId);
        setIsRecording(false);
    };

    // Determine if input should be disabled based on current step
    const shouldDisableTextInput = () => {
        return currentStep === 'welcome' || currentStep === 'image_uploaded' || currentStep === 'generating_report' || currentStep === 'completed';
    };

    // Determine if file upload should be disabled
    const shouldDisableFileUpload = () => {
        return currentStep !== 'welcome';
    };

    // Determine if voice recording should be disabled
    const shouldDisableVoiceRecording = () => {
        return currentStep !== 'image_uploaded';
    };

    const handleAudioUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (!files || files.length === 0) return;

        const file = files[0];
        const audioUrl = URL.createObjectURL(file);

        // Save voice data for API
        setCollectedData((prev) => ({ ...prev, voiceData: file }));

        // Add to chat messages
        setMessages((prev) => [
            ...prev,
            {
                sender: "user",
                audio: audioUrl,
                audioBlob: file,
                duration: 0, // not available for uploads
            },
        ]);

        // Move to next step
        if (currentStep === "image_uploaded") {
            setCurrentStep("voice_uploaded");
            setMessages((prev) => [
                ...prev,
                {
                    sender: "ai",
                    text: "Perfect! Audio uploaded. Now please describe your stool pattern (e.g., frequency, consistency, color, any irregularities).",
                },
            ]);
        }
    };

    return (
        <div className="d-flex w-100 h-100 min-vh-100 min-vw-100 bg-black text-white overflow-hidden">
            <Stars />

            <div className="flex-grow-1 d-flex flex-column position-relative">
                <div className="position-relative z-10 d-flex justify-content-between align-items-center p-4">
                    <div className="d-flex align-items-center">
                        {/* Go Back Button */}
                        <button
                            type="button"
                            className="btn btn-info rounded-pill me-3"
                            onClick={() => navigate(-1)}   // goes back one step in history
                            style={{
                                display: "flex",
                                alignItems: "center",
                                gap: "0.4rem",
                                fontSize: "0.9rem",
                                fontWeight: 500,
                                borderColor: "#00A2FF",
                                color: "#fbfcfdff",
                            }}
                        >
                            <i className="bi bi-arrow-left"></i>
                            Go Back
                        </button>

                        {/* Title */}
                        {/* <h2 className="h4 fw-bold mb-0" style={{ color: "#00A2FF" }}>
                            Eternal AI
                        </h2> */}
                        <h2
                            className="h4 fw-bold"
                            style={{
                                background: 'linear-gradient(90deg, rgb(74, 222, 128), rgb(96, 165, 250))',
                                WebkitBackgroundClip: 'text',
                                WebkitTextFillColor: 'transparent',
                                backgroundClip: 'text',
                                color: 'transparent',
                                margin: 0,
                                fontFamily: "'Poppins', sans-serif"
                            }}
                        >
                            Eternal AI
                        </h2>
                    </div>
                </div>


                <div className="flex-grow-1 d-flex flex-column align-items-center justify-content-center position-relative z-10 px-3">
                    {inputValue === "" && messages.length === 0 && (
                        <>
                            <div className="text-center mb-5">
                                <div className="d-flex flex-column align-items-center mb-3">
                                    <img
                                        src={sparkle}
                                        alt="Sparkle Logo"
                                        style={{
                                            width: "48px",
                                            height: "48px",
                                            objectFit: "cover",
                                            filter: "drop-shadow(0 0 8px rgba(0, 184, 248, 0.5))",
                                        }}
                                    />
                                    <svg
                                        xmlns="http://www.w3.org/2000/svg"
                                        width="24"
                                        height="24"
                                        viewBox="0 0 24 24"
                                        style={{
                                            position: "absolute",
                                            top: "-12px",
                                            right: "12px",
                                            filter: "drop-shadow(0 0 4px rgba(100, 255, 100, 0.6))",
                                        }}
                                    >
                                        <polygon
                                            points="12,2 16,8 12,14 8,8"
                                            fill="#00ff00"
                                            opacity="0.8"
                                        />
                                    </svg>
                                </div>
                                <h3 className="h5 fw-semibold">Your Daily AI Assistant</h3>
                            </div>

                            <Row
                                className="g-3 mb-5 w-100 justify-content-center h-45"
                                style={{ maxWidth: "1200px" }}
                            >
                                {[
                                    { icon: starone, label: "Eternal Echo", color: "yellow" },
                                    { icon: startwo, label: "Aether Chat", color: "red" },
                                    { icon: starthree, label: "Nexus Eternal", color: "blue" },
                                    { icon: starfour, label: "Timeless Words", color: "green" },
                                ].map((card, idx) => (
                                    <Col
                                        key={idx}
                                        xs={12}
                                        sm={6}
                                        md={3}
                                        style={{ height: "200px" }}
                                    >
                                        <div
                                            className="bg-dark bg-opacity-75 text-white p-3 rounded-4 d-flex flex-column align-items-center justify-content-center h-100"
                                            style={{
                                                width: "100%",
                                                height: "100px",
                                                transition: "all 0.2s ease",
                                                cursor: "pointer",
                                                border: "none",
                                            }}
                                            onClick={() => console.log(`${card.label} clicked!`)}
                                        >
                                            <div className="d-flex flex-column align-items-center">
                                                <img
                                                    src={card.icon}
                                                    alt={card.label}
                                                    style={{
                                                        width: "24px",
                                                        height: "24px",
                                                        marginBottom: "6px",
                                                    }}
                                                />
                                                <p
                                                    className="text-secondary small m-0"
                                                    style={{ whiteSpace: "nowrap" }}
                                                >
                                                    {card.label}
                                                </p>
                                            </div>
                                        </div>
                                    </Col>
                                ))}
                            </Row>
                        </>
                    )}
                </div>

                {messages.length > 0 && (
                    <div className="flex-grow-1 container d-flex flex-column px-3 mb-3 overflow-auto">
                        {messages.map((msg, i) => {
                            const isUser = msg.sender === "user";

                            return (
                                <div
                                    key={i}
                                    className={`d-flex mb-2 ${isUser ? "justify-content-end" : "justify-content-start"}`}
                                >
                                    <div
                                        className={`px-3 py-2 rounded-3`}
                                        style={{
                                            maxWidth: "70%",
                                            whiteSpace: "pre-wrap",
                                            background: isUser ? "#00b8f8" : "#6c757d",
                                            color: "white",
                                        }}
                                    >
                                        {msg.imageList && msg.imageList.length > 0 && (
                                            <div className="d-flex flex-wrap gap-2 mb-2" style={{ maxWidth: "100%" }}>
                                                {msg.imageList.map((img, j) => (
                                                    <img
                                                        key={j}
                                                        src={img}
                                                        alt="attachment"
                                                        className="rounded"
                                                        style={{
                                                            width: "120px",
                                                            height: "120px",
                                                            objectFit: "cover",
                                                            cursor: "pointer",
                                                        }}
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            setPreviewImage(img);
                                                        }}
                                                    />
                                                ))}
                                            </div>
                                        )}
                                        {msg.text && <div>{msg.text}</div>}
                                        {msg.audio && (
                                            <VoiceMessage url={msg.audio} duration={msg.duration ?? 0} />
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}

                {showGoBack && (
                    <div className="d-flex justify-content-center mt-3">
                        <Button variant="secondary" onClick={() => navigate('/result')}>
                            Go Back
                        </Button>
                    </div>
                )}

                {/* Chat Input */}
                <div className="position-relative z-10 p-3">
                    <div className="d-flex justify-content-center w-100">
                        <div
                            className="bg-dark bg-opacity-75 rounded-4 p-2 shadow-sm"
                            style={{ width: "100%", maxWidth: "1000px" }}
                        >
                            {attachedImages.length > 0 && (
                                <div className="d-flex flex-wrap gap-2 mb-2">
                                    {attachedImages.map((img, idx) => (
                                        <div
                                            key={idx}
                                            className="position-relative"
                                            style={{ width: "80px", height: "80px" }}
                                        >
                                            <img
                                                src={img}
                                                alt="preview"
                                                className="rounded"
                                                style={{
                                                    width: "100%",
                                                    height: "100%",
                                                    objectFit: "cover",
                                                }}
                                            />
                                            <Button
                                                variant="light"
                                                size="sm"
                                                className="position-absolute top-0 end-0 rounded-circle p-0"
                                                style={{ width: "20px", height: "20px", lineHeight: "1" }}
                                                onClick={() =>
                                                    setAttachedImages((prev) => prev.filter((_, i) => i !== idx))
                                                }
                                            >
                                                ✕
                                            </Button>
                                        </div>
                                    ))}
                                </div>
                            )}
                            <div className="d-flex align-items-end w-100">
                                {!isRecording ? (
                                    <>
                                        <Form.Control
                                            id="chat-input-textarea"
                                            as="textarea"
                                            rows={1}
                                            placeholder={shouldDisableTextInput() ? "Please follow the instructions above..." : "Enter your response here"}
                                            className="bg-transparent text-white border-0 shadow-none flex-grow-1"
                                            style={{
                                                resize: "none",
                                                overflow: "hidden",
                                                minHeight: "40px",
                                                maxHeight: "150px",
                                            }}
                                            value={inputValue}
                                            disabled={shouldDisableTextInput()}
                                            onChange={(e) => {
                                                setInputValue(e.target.value);
                                                e.currentTarget.style.height = "40px";
                                                e.currentTarget.style.height = e.currentTarget.scrollHeight + "px";
                                            }}
                                            onKeyDown={(e) =>
                                                e.key === "Enter" &&
                                                !e.shiftKey &&
                                                !shouldDisableTextInput() &&
                                                (e.preventDefault(), sendMessage())
                                            }
                                        />
                                        <div className="d-flex align-items-center ms-2">
                                            <Button
                                                as="label"
                                                variant="link"
                                                className="border-0 p-2"
                                                style={{
                                                    color: shouldDisableFileUpload() ? "#555" : "#ccc",
                                                    fontSize: "1.2rem",
                                                    cursor: shouldDisableFileUpload() ? "not-allowed" : "pointer"
                                                }}
                                                disabled={shouldDisableFileUpload()}
                                            >
                                                <i className="bi bi-image"></i>
                                                <input
                                                    type="file"
                                                    accept="image/*"
                                                    hidden
                                                    multiple
                                                    onChange={handleFileSelect}
                                                    disabled={shouldDisableFileUpload()}
                                                />
                                            </Button>
                                            <Button
                                                variant="link"
                                                className="border-0 p-2"
                                                style={{
                                                    color: shouldDisableFileUpload() ? "#555" : "#ccc",
                                                    fontSize: "1.2rem"
                                                }}
                                                onClick={openCamera}
                                                disabled={shouldDisableFileUpload()}
                                            >
                                                <i className="bi bi-camera"></i>
                                            </Button>

                                            {/* <Button
                                                variant="link"
                                                className="border-0 p-2"
                                                style={{
                                                    color: shouldDisableVoiceRecording() ? "#555" : "#ccc",
                                                    fontSize: "1.2rem"
                                                }}
                                                onClick={startRecording}
                                                disabled={shouldDisableVoiceRecording()}
                                            >
                                                <i className="bi bi-mic"></i>
                                            </Button> */}

                                            <Button
                                                as="label"
                                                variant="link"
                                                className="border-0 p-2"
                                                style={{
                                                    color:
                                                        currentStep !== "image_uploaded" ? "#555" : "#ccc",
                                                    fontSize: "1.2rem",
                                                    cursor:
                                                        currentStep !== "image_uploaded"
                                                            ? "not-allowed"
                                                            : "pointer",
                                                }}
                                                disabled={currentStep !== "image_uploaded"}
                                            >
                                                <i className="bi bi-music-note"></i>
                                                <input
                                                    type="file"
                                                    accept=".mp3,.wav"
                                                    hidden
                                                    onChange={(e) => handleAudioUpload(e)}
                                                    disabled={currentStep !== "image_uploaded"}
                                                />
                                            </Button>
                                            <Button
                                                variant="info"
                                                className="rounded-pill px-3 py-2 ms-2"
                                                style={{
                                                    backgroundColor: "#00b8f8",
                                                    borderColor: "#00b8f8",
                                                    color: "white",
                                                    fontSize: "1.1rem",
                                                    fontWeight: "600",
                                                    minWidth: "40px",
                                                    height: "40px",
                                                }}
                                                onClick={sendMessage}
                                                disabled={
                                                    (shouldDisableTextInput() && !(currentStep === 'welcome' && attachedImages.length > 0)) ||
                                                    (!inputValue.trim() && attachedImages.length === 0)
                                                }
                                            >
                                                <i className="bi bi-send"></i>
                                            </Button>
                                        </div>
                                    </>
                                ) : (
                                    <div className="d-flex align-items-center bg-dark rounded-3 px-3 py-2 flex-grow-1">
                                        <MicVisualizer stream={micStream} height={40} />
                                        <span className="ms-3 text-danger fw-bold">{formatTime(recordingTime)}</span>
                                        <Button
                                            variant="success"
                                            className="ms-3 rounded-circle d-flex align-items-center justify-content-center"
                                            style={{ width: 36, height: 36 }}
                                            onClick={stopRecording}
                                        >
                                            <i className="bi bi-check-lg"></i>
                                        </Button>
                                        <Button
                                            variant="danger"
                                            className="ms-2 rounded-circle d-flex align-items-center justify-content-center"
                                            style={{ width: 36, height: 36 }}
                                            onClick={cancelRecording}
                                        >
                                            <i className="bi bi-x-lg"></i>
                                        </Button>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {previewImage && (
                    <div
                        className="modal fade show d-block"
                        tabIndex={-1}
                        role="dialog"
                        style={{ background: "rgba(0,0,0,0.7)" }}
                        onClick={() => setPreviewImage(null)}
                    >
                        <div
                            className="modal-dialog modal-dialog-centered"
                            role="document"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <div className="modal-content bg-transparent border-0 shadow-none">
                                <div className="modal-body text-center p-0">
                                    <img
                                        src={previewImage}
                                        alt="preview"
                                        style={{ maxWidth: "100%", maxHeight: "80vh", borderRadius: "8px" }}
                                    />
                                </div>
                                <div className="modal-footer border-0 d-flex justify-content-center">
                                    <Button variant="light" onClick={() => setPreviewImage(null)}>Close</Button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {showCamera && (
                    <div
                        className="modal fade show d-block"
                        tabIndex={-1}
                        role="dialog"
                        style={{ background: "rgba(0,0,0,0.8)" }}
                        onClick={closeCamera}
                    >
                        <div
                            className="modal-dialog modal-dialog-centered"
                            role="document"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <div className="modal-content bg-dark text-white rounded-3">
                                <div className="modal-body text-center">
                                    <video ref={videoRef} style={{ width: "100%", borderRadius: "8px" }} />
                                    <canvas ref={canvasRef} style={{ display: "none" }} />
                                </div>
                                <div className="modal-footer border-0 d-flex justify-content-between">
                                    <Button variant="secondary" onClick={closeCamera}>Cancel</Button>
                                    <Button variant="info" onClick={capturePhoto}>Capture</Button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Footer */}
                <div className="position-relative z-10 px-3 pb-3">
                    <div className="d-flex flex-wrap justify-content-center align-items-center text-secondary small">
                        <span className="mb-2 mb-md-0">© 2025 EROS Universe. All Rights Reserved.</span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AgeTrack;