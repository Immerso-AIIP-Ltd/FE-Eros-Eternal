// src/ErosChatUI.tsx
import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Row, Col, Button, Form } from "react-bootstrap";
import starone from "./star1.png";
import startwo from "./star2.png";
import starthree from "./star3.png";
import starfour from "./star4.png";
import sparkle from "./sparkle.png";
import Stars from "./components/stars";
import VoiceMessage from "./VoiceMessage";
import MicVisualizer from "./MicVisualizer";

const VibrationTool: React.FC = () => {
    const navigate = useNavigate();
    const [activeModel, setActiveModel] = useState<"gpt1" | "gpt2pro">("gpt1");
    const [inputValue, setInputValue] = useState<string>("");
    const [isRecording, setIsRecording] = useState(false);
    const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
    const [recordingTime, setRecordingTime] = useState(0);
    const timerRef = useRef<NodeJS.Timeout | null>(null);

    interface Message {
        sender: "user" | "ai";
        text?: string;
        imageList?: string[];
        audio?: string;
        duration?: number;
        isThinking?: boolean;
        isSuggestion?: boolean;
        isAnalysisReport?: boolean;
        analysisData?: any;
    }

    const [messages, setMessages] = useState<
        {
            sender: "user" | "ai";
            text?: string;
            imageList?: string[];
            audio?: string;
            duration?: number;
        }[]
    >([]);

    let animationId: number;
    const videoRef = useRef<HTMLVideoElement | null>(null);
    const canvasRef = useRef<HTMLCanvasElement | null>(null);
    const [showCamera, setShowCamera] = useState(false);

    const [previewImage, setPreviewImage] = useState<string | null>(null);
    const [attachedImages, setAttachedImages] = useState<string[]>([]);
    const [attachedFiles, setAttachedFiles] = useState<File[]>([]);
    const [micStream, setMicStream] = useState<MediaStream | null>(null);
    const [nextApiUrl, setNextApiUrl] = useState<string | null>(null);
    const [userId, setUserId] = useState<string | null>(null);
    const [hasCalledMood, setHasCalledMood] = useState(false);
    const hasMounted = useRef(false);
    const [isLoadingResponse, setIsLoadingResponse] = useState(false);

    const baseApiUrl = 'http://192.168.29.154:8002';

    useEffect(() => {
        if (hasMounted.current) return;
        hasMounted.current = true;
        const id = localStorage.getItem('user_id');
        setUserId(id);
        if (id) {
            initChat(id);
        }
    }, []);

    useEffect(() => {
        if (nextApiUrl && nextApiUrl.endsWith('/analysis')) {
            const formData = new FormData();
            sendFormData(formData);
        }
    }, [nextApiUrl]);

    const initChat = async (userId: string) => {
        const url = `${baseApiUrl}/api/v1/vf/chat/${userId}/start/`;
        try {
            const res = await fetch(url, { method: 'POST' });
            const data = await res.json();
            console.log("Init chat response:", data); // Debug log
            setMessages((prev) => [...prev, { sender: "ai", text: data.message }]);
            setNextApiUrl(data.navigation?.next?.url || null);
        } catch (err) {
            console.error("Init chat error:", err);
        }
    };

    const sendFormData = async (formData: FormData) => {
        if (!nextApiUrl) return;
        const url = `${baseApiUrl}${nextApiUrl}`;
        try {
            const res = await fetch(url, {
                method: 'POST',
                body: formData,
            });
            const data = await res.json();
            console.log("API response:", data); // Debug log
            setMessages((prev) => [...prev, { sender: "ai", text: data.message }]);
            setNextApiUrl(data.navigation?.next?.url || null);
        } catch (err) {
            console.error("API error:", err);
            setMessages((prev) => [...prev, { sender: "ai", text: "Error occurred." }]);
        }
    };

    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (files) {
            const newFiles = Array.from(files);
            const urls = newFiles.map((file) => URL.createObjectURL(file));
            setAttachedFiles((prev) => [...prev, ...newFiles]);
            setAttachedImages((prev) => [...prev, ...urls]);

            // Debug log
            console.log("Images stored:", urls);
        }
    };
    const sendMessage = async () => {
        if (!inputValue.trim() && attachedImages.length === 0) return;

        const userMsg = {
            sender: "user",
            text: inputValue || "",
            imageList: attachedImages.length > 0 ? [attachedImages[0]] : []
        };
        setMessages((prev) => [...prev, userMsg]);
        setIsLoadingResponse(true);

        // Add thinking message
        setMessages((prev) => [...prev, { sender: "ai", text: "Thinking...", isThinking: true }]);

        const formData = new FormData();

        try {
            if (attachedImages.length > 0) {
                // Handle image upload to /face endpoint
                formData.append('image_data', attachedFiles[0], 'image.png');
                console.log("Sending image to /face endpoint:", attachedImages[0]);
                const faceUrl = `${baseApiUrl}/api/v1/vf/chat/${userId}/face/`;
                await sendFormDataToSpecificUrl(faceUrl, formData);
            } else if (inputValue.trim()) {
                if (!hasCalledMood) {
                    // Handle first text input to /mood endpoint
                    formData.append('mood_input', inputValue);
                    console.log("Sending text to /mood endpoint:", inputValue);
                    const moodUrl = `${baseApiUrl}/api/v1/vf/chat/${userId}/mood/`;
                    await sendFormDataToSpecificUrl(moodUrl, formData);
                    setHasCalledMood(true);
                } else {
                    // Handle subsequent text input to /food endpoint
                    formData.append('food_input', inputValue);
                    console.log("Sending text to /food endpoint:", inputValue);
                    const foodUrl = `${baseApiUrl}/api/v1/vf/chat/${userId}/food/`;
                    const foodResponse = await sendFormDataToSpecificUrl(foodUrl, formData);

                    // If /food API call is successful, call /analysis API
                    if (foodResponse && foodResponse.message) {
                        const analysisUrl = `${baseApiUrl}/api/v1/vf/chat/${userId}/analysis/`;
                        console.log("Calling /analysis endpoint");

                        const res = await fetch(analysisUrl, {
                            method: 'POST',
                            body: new FormData(),
                        });
                        const analysisData = await res.json();
                        console.log("Analysis API response:", analysisData);

                        // Remove thinking message
                        setMessages((prev) => prev.filter(msg => !msg.isThinking));

                        if (analysisData.success && analysisData.data && analysisData.data.analysis_data) {
                            const analysisResult = analysisData.data.analysis_data;

                            // Create a structured data object for better formatting
                            const formattedData = {
                                "VF Analysis": {
                                    "VF Score": analysisResult.vf_analysis?.vf_score || "N/A",
                                    "VF Change Percent": analysisResult.vf_analysis?.vf_change_percent || "N/A",
                                    "Previous VF": analysisResult.vf_analysis?.previous_vf || "N/A"
                                },
                                "Analysis Summary": analysisResult.analysis_summary || "No summary available",
                                "Inputs Processed": analysisResult.inputs_processed || {},
                                "AI Outputs": {
                                    "VF Alerts": analysisResult.ai_outputs?.vf_alerts || [],
                                    "Healing Prescriptions": {
                                        "Mantras": analysisResult.ai_outputs?.healing_prescriptions?.mantras || [],
                                        "Foods": analysisResult.ai_outputs?.healing_prescriptions?.foods || [],
                                        "Rituals": analysisResult.ai_outputs?.healing_prescriptions?.rituals || []
                                    },
                                    "Flame Path Adjustments": {
                                        "Focus Area": analysisResult.ai_outputs?.flame_path_adjustments?.focus_area || "N/A",
                                        "Daily Practice": analysisResult.ai_outputs?.flame_path_adjustments?.daily_practice || "N/A",
                                        "Energy Work": analysisResult.ai_outputs?.flame_path_adjustments?.energy_work || "N/A"
                                    }
                                },
                                "Timestamp": analysisResult.timestamp || "N/A"
                            };

                            // Create a custom message component for the analysis
                            setMessages((prev) => [
                                ...prev,
                                {
                                    sender: "ai",
                                    text: "", // Empty text since we'll render custom content
                                    isAnalysisReport: true,
                                    analysisData: formattedData
                                }
                            ]);
                        } else {
                            setMessages((prev) => [
                                ...prev,
                                { sender: "ai", text: "Analysis completed but no detailed data available." }
                            ]);
                        }
                        setNextApiUrl(analysisData.navigation?.next?.url || null);
                    }
                }
            }
        } catch (error) {
            // Remove thinking message on error
            setMessages((prev) => prev.filter(msg => !msg.isThinking));
            console.error("API error:", error);
            setMessages((prev) => [...prev, { sender: "ai", text: "Sorry, something went wrong. Please try again." }]);
        } finally {
            setIsLoadingResponse(false);
        }

        setInputValue("");
        setAttachedImages([]);
        setAttachedFiles([]);

        // Reset textarea height
        const textarea = document.querySelector<HTMLTextAreaElement>("#chat-input-textarea");
        if (textarea) {
            textarea.style.height = "40px";
        }
    };
    const sendFormDataToSpecificUrl = async (url: string, formData: FormData) => {
        try {
            const res = await fetch(url, {
                method: 'POST',
                body: formData,
            });
            const data = await res.json();
            console.log("API response:", data);

            // Remove thinking message
            setMessages((prev) => prev.filter(msg => !msg.isThinking));

            setMessages((prev) => [...prev, { sender: "ai", text: data.message }]);
            setNextApiUrl(data.navigation?.next?.url || null);
            return data;
        } catch (err) {
            // Remove thinking message on error
            setMessages((prev) => prev.filter(msg => !msg.isThinking));
            console.error("API error:", err);
            setMessages((prev) => [...prev, { sender: "ai", text: "Error occurred." }]);
            return null;
        }
    };

    const formatKey = (key: string) => {
        return key
            .replace(/_/g, ' ')
            .replace(/([A-Z])/g, ' $1')
            .replace(/^./, str => str.toUpperCase())
            .trim();
    };

    const renderValue = (value: any): React.ReactNode => {
        if (value === null || value === undefined) {
            return <span className="text-muted">N/A</span>;
        }

        if (typeof value === 'boolean') {
            return <span className={value ? 'text-success' : 'text-danger'}>{value ? 'Yes' : 'No'}</span>;
        }

        if (typeof value === 'string') {
            return <span>{value}</span>;
        }

        if (typeof value === 'number') {
            return <span className="fw-semibold">{value}</span>;
        }

        if (Array.isArray(value)) {
            if (value.length === 0) return <span className="text-muted">None</span>;
            return (
                <ul className="list-unstyled mb-0">
                    {value.map((item, index) => (
                        <li key={index} className="mb-1">
                            <span className="badge bg-secondary me-2">•</span>
                            {typeof item === 'object' ? renderValue(item) : item}
                        </li>
                    ))}
                </ul>
            );
        }

        if (typeof value === 'object') {
            return (
                <div className="ms-3">
                    {Object.entries(value).map(([subKey, subValue]) => (
                        <div key={subKey} className="mb-2">
                            <strong className="text-info">{formatKey(subKey)}:</strong>
                            <div className="ms-2">{renderValue(subValue)}</div>
                        </div>
                    ))}
                </div>
            );
        }

        return <span>{String(value)}</span>;
    };

    const renderReportDynamic = (report: any) => {
        if (!report) return null;

        return (
            <div style={{ whiteSpace: "pre-wrap" }} className="analysis-report">
                {Object.entries(report).map(([key, value]) => (
                    <div key={key} className="mb-4 p-3 bg-dark bg-opacity-50 rounded-3">
                        <h6 className="fw-semibold text-primary mb-2 border-bottom border-secondary pb-1">
                            {formatKey(key)}
                        </h6>
                        <div className="text-light">{renderValue(value)}</div>
                    </div>
                ))}
            </div>
        );
    };

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

                setMessages((prev) => [...prev, { sender: "user", audio: audioUrl }]);
                console.log("Audio stored:", { sender: "user", audio: audioUrl });

                const formData = new FormData();
                formData.append('audio_data', audioBlob, 'voice.webm');
                const voiceUrl = `${baseApiUrl}/api/v1/vf/chat/${userId}/voice/`;
                console.log("Sending audio to /voice endpoint:", audioUrl);

                try {
                    const res = await fetch(voiceUrl, {
                        method: 'POST',
                        body: formData,
                    });
                    const data = await res.json();
                    console.log("Voice API response:", data);

                    // Remove thinking message
                    setMessages((prev) => prev.filter(msg => !msg.isThinking));

                    setMessages((prev) => [...prev, { sender: "ai", text: data.message }]);
                    setNextApiUrl(data.navigation?.next?.url || null);
                } catch (err) {
                    // Remove thinking message on error
                    setMessages((prev) => prev.filter(msg => !msg.isThinking));
                    console.error("Voice API error:", err);
                    setMessages((prev) => [...prev, { sender: "ai", text: "Error occurred." }]);
                } finally {
                    setIsLoadingResponse(false);
                }
            };
            recorder.start();
            setMediaRecorder(recorder);
            setIsRecording(true);

            // Timer
            setRecordingTime(0);
            timerRef.current = setInterval(() => {
                setRecordingTime((prev) => prev + 1);
            }, 1000);
        } catch (err) {
            console.error("Microphone error:", err);
        }
    };

    useEffect(() => {
        console.log("messages:", messages);
    }, [messages]);

    const stopRecording = () => {
        if (mediaRecorder && isRecording) {
            mediaRecorder.stop();
            setIsRecording(false);
            setIsLoadingResponse(true); // Add loading state

            // Add thinking message for voice processing
            setMessages((prev) => [...prev, { sender: "ai", text: "Processing voice...", isThinking: true }]);

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
                const userMsg = { sender: "user", text: inputValue || "", imageList: [imageUrl] };
                setMessages((prev) => [...prev, userMsg]);

                if (nextApiUrl && nextApiUrl.endsWith('/face')) {
                    const formData = new FormData();
                    formData.append('image_data', blob, 'face.png');
                    await sendFormData(formData);
                }

                setInputValue("");
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

    const handleSuggestionClick = (question: string) => {
        debugger;
        // Add user message
        setMessages((prev) => [...prev, { sender: "user", text: question }]);

        // Call same sendMessage logic or API trigger
        // sendMessage(question);
    };

    const handleAudioUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const file = files[0];
    const audioUrl = URL.createObjectURL(file);

    // Add user message with audio preview
    setMessages((prev) => [
      ...prev,
      { sender: "user", audio: audioUrl, duration: 0 },
    ]);

    // Add "Processing..." message
    setMessages((prev) => [
      ...prev,
      { sender: "ai", text: "Processing audio...", isThinking: true },
    ]);

    // Prepare API call
    const formData = new FormData();
    formData.append("audio_data", file, file.name);

    const voiceUrl = `${baseApiUrl}/api/v1/vf/chat/${userId}/voice/`;

    try {
      const res = await fetch(voiceUrl, {
        method: "POST",
        body: formData,
      });
      const data = await res.json();

      // Remove "thinking"
      setMessages((prev) => prev.filter((m) => !m.isThinking));

      setMessages((prev) => [...prev, { sender: "ai", text: data.message }]);
      setNextApiUrl(data.navigation?.next?.url || null);
    } catch (err) {
      setMessages((prev) => prev.filter((m) => !m.isThinking));
      console.error("Voice upload error:", err);
      setMessages((prev) => [
        ...prev,
        { sender: "ai", text: "Audio upload failed. Please try again." },
      ]);
    }
  };


    return (
        <div className="d-flex w-100 h-100 min-vh-100 min-vw-100 bg-black text-white overflow-hidden">
            {/* Sidebar */}
            <Stars />

            {/* Main Content */}
            <div className="flex-grow-1 d-flex flex-column position-relative">
                {/* Header */}
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
                        <h2 className="h4 fw-bold mb-0" style={{ color: "#00A2FF" }}>
                            Eternal AI
                        </h2>
                    </div>
                </div>


                {/* Main Content Area */}
                <div className="flex-grow-1 d-flex flex-column align-items-center justify-content-center position-relative z-10 px-3">
                    {/* Only show if input is empty */}
                    {inputValue === "" && messages.length === 0 && (
                        <>
                            <div className="text-center mb-5">
                                <div className="d-flex flex-column align-items-center mb-3">
                                    {/* Main Sparkle Logo */}
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

                            {/* Feature Cards - Responsive Grid */}
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
                                            {/* Icon with Color */}
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
                            const isSuggestion = msg.isSuggestion;
                            const isAnalysisReport = msg.isAnalysisReport;

                            return (
                                <div
                                    key={i}
                                    className={`d-flex mb-2 ${isUser ? "justify-content-end" : "justify-content-start"}`}
                                >
                                    <div
                                        className={`px-3 py-2 rounded-3`}
                                        style={{
                                            maxWidth: isAnalysisReport ? "90%" : "70%",
                                            whiteSpace: "pre-wrap",
                                            background: isUser
                                                ? "#00b8f8"
                                                : isSuggestion
                                                    ? "#e9ecef"
                                                    : isAnalysisReport
                                                        ? "rgba(12, 12, 12, 0.1)"
                                                        : "#6c757d",
                                            color: isUser
                                                ? "white"
                                                : isSuggestion
                                                    ? "black"
                                                    : "white",
                                            cursor: isSuggestion ? "pointer" : "default",
                                            userSelect: "none",
                                            border: isAnalysisReport ? "1px solid rgba(7, 7, 7, 0.3)" : "none"
                                        }}
                                        onClick={() => {
                                            if (isSuggestion) {
                                                console.log("Suggestion clicked:", msg.text);
                                                handleSuggestionClick(msg.text!);
                                            }
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

                                        {/* Handle analysis report */}
                                        {isAnalysisReport && msg.analysisData ? (
                                            <div>
                                                <div className="mb-3 text-center">
                                                    <h5 className="text-white mb-1">Vibrational Frequency Analysis Complete!</h5>
                                                    <p className="text-white small mb-0">Your personalized analysis is ready</p>
                                                </div>
                                                {renderReportDynamic(msg.analysisData)}
                                            </div>
                                        ) : (
                                            msg.text && <div>{msg.text}</div>
                                        )}

                                        {msg.audio && (
                                            <VoiceMessage url={msg.audio} duration={msg.duration ?? 0} />
                                        )}
                                    </div>
                                </div>
                            );
                        })}
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
                                            placeholder="Enter a prompt here"
                                            className="bg-transparent text-white border-0 shadow-none flex-grow-1"
                                            style={{
                                                resize: "none",
                                                overflow: "hidden",
                                                minHeight: "40px",
                                                maxHeight: "150px",
                                            }}
                                            value={inputValue}
                                            onChange={(e) => {
                                                setInputValue(e.target.value);
                                                e.currentTarget.style.height = "40px";
                                                e.currentTarget.style.height = e.currentTarget.scrollHeight + "px";
                                            }}
                                            onKeyDown={(e) =>
                                                e.key === "Enter" &&
                                                !e.shiftKey &&
                                                (e.preventDefault(), sendMessage())
                                            }
                                        />
                                        <div className="d-flex align-items-center ms-2">
                                            <Button
                                                as="label"
                                                variant="link"
                                                className="border-0 p-2"
                                                style={{ color: "#ccc", fontSize: "1.2rem", cursor: "pointer" }}
                                            >
                                                <i className="bi bi-image"></i>
                                                <input
                                                    type="file"
                                                    accept="image/*"
                                                    hidden
                                                    multiple
                                                    onChange={handleImageUpload}
                                                />
                                            </Button>
                                            <Button
                                                variant="link"
                                                className="border-0 p-2"
                                                style={{ color: "#ccc", fontSize: "1.2rem" }}
                                                onClick={openCamera}
                                            >
                                                <i className="bi bi-camera"></i>
                                            </Button>
                                            <Button
                        as="label"
                        variant="link"
                        className="border-0 p-2"
                        style={{
                          color: "#ccc",
                          fontSize: "1.2rem",
                          cursor: "pointer",
                        }}
                      >
                        <i className="bi bi-music-note"></i>
                        <input
                          type="file"
                          accept=".mp3,.wav"
                          hidden
                          onChange={handleAudioUpload}
                        />
                      </Button>
                                            <Button
                                                variant="link"
                                                className="border-0 p-2"
                                                style={{ color: "#ccc", fontSize: "1.2rem" }}
                                                onClick={startRecording}
                                            >
                                                <i className="bi bi-mic"></i>
                                            </Button>
                                            <Button
                                                variant="info"
                                                className="rounded-pill px-3 py-2 ms-2"
                                                disabled={(!inputValue.trim() && attachedImages.length === 0) || isLoadingResponse}
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
                                            >
                                                {isLoadingResponse ? (
                                                    <div className="spinner-border spinner-border-sm" role="status">
                                                        <span className="visually-hidden">Loading...</span>
                                                    </div>
                                                ) : (
                                                    <i className="bi bi-send"></i>
                                                )}
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

export default VibrationTool;