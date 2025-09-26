import React, { useEffect, useRef, useState } from "react";
import { Menu, X, SendHorizontal, Mic, Camera, ImagePlus, LogOut, SquarePlus, User, Upload, Play, Pause, Check } from "lucide-react";
import { Row, Col, Button, Form } from "react-bootstrap";
import ReactMarkdown from "react-markdown";
import starone from "./star1.png";
import startwo from "./star2.png";
import starthree from "./star3.png";
import starfour from "./star4.png";
import sparkle from "./sparkle.png";
import Stars from "./components/stars";
import VoiceMessage from "./VoiceMessage";
import MicVisualizer from "./MicVisualizer";
import { useNavigate, useLocation } from "react-router-dom";

const sidebarMenuItems = [
    { id: 'vibrational-frequency', label: 'Vibrational Frequency', icon: <ImagePlus size={16} />, reportType: 'vibrational_frequency' },
    { id: 'aura-profile', label: 'Aura Profile', icon: <User size={16} />, reportType: 'aura_profile' },
    { id: 'star-map', label: 'Star Map', icon: <SquarePlus size={16} />, reportType: 'star_map' },
    { id: 'kosha-map', label: 'Kosha Map', icon: <Camera size={16} />, reportType: 'kosha_map' },
    { id: 'flame-score', label: 'Flame Score', icon: <Upload size={16} />, reportType: 'flame_score' },
    { id: 'longevity-blueprint', label: 'Longevity Blueprint', icon: <Mic size={16} />, reportType: 'longevity_blueprint' },
];

const LongevityTool: React.FC = () => {
    const [inputValue, setInputValue] = useState("");
    const [isRecording, setIsRecording] = useState(false);
    const [recordingTime, setRecordingTime] = useState(0);
    const [isLoading, setIsLoading] = useState(false);
    const timerRef = useRef<NodeJS.Timeout | null>(null);
    const [isInitialized, setIsInitialized] = useState(false);
    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const recordedChunksRef = useRef<Blob[]>([]);
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [messages, setMessages] = useState<Message[]>([]);
    const [previewImage, setPreviewImage] = useState<string | null>(null);
    const videoRef = useRef<HTMLVideoElement | null>(null);
    const canvasRef = useRef<HTMLCanvasElement | null>(null);
    const [showCamera, setShowCamera] = useState(false);
    const [attachedImages, setAttachedImages] = useState<string[]>([]);
    const [attachedFiles, setAttachedFiles] = useState<File[]>([]);
    const [micStream, setMicStream] = useState<MediaStream | null>(null);
    const [attachedVoices, setAttachedVoices] = useState<Array<{ url: string, file: File, duration?: number }>>([]);
    const chatContainerRef = useRef<HTMLDivElement>(null);
    const [activeMenuItem, setActiveMenuItem] = useState('vibrational-frequency');

    // New states for API integration
    const [currentReportType, setCurrentReportType] = useState<string>('vibrational_frequency');
    const [assessmentStatus, setAssessmentStatus] = useState<string>('not_started');
    const [currentQuestion, setCurrentQuestion] = useState<string>('');
    const [questionNumber, setQuestionNumber] = useState<number>(0);
    const [totalQuestions, setTotalQuestions] = useState<number>(0);
    const [isGeneratingReport, setIsGeneratingReport] = useState(false);
    const [reportData, setReportData] = useState<any>(null);

    const navigate = useNavigate();
    const location = useLocation();

    interface Message {
        sender: "user" | "ai";
        text?: string | React.ReactNode;
        imageList?: string[];
        audio?: string;
        duration?: number;
        centered?: boolean;
        isThinking?: boolean;
    }

    interface VoicePreviewProps {
        voiceData: { url: string, file: File, duration?: number };
        onRemove: () => void;
    }

    const VoicePreview: React.FC<VoicePreviewProps> = ({ voiceData, onRemove }) => {
        const [isPlaying, setIsPlaying] = useState(false);
        const [currentTime, setCurrentTime] = useState(0);
        const [duration, setDuration] = useState(voiceData.duration || 0);
        const audioRef = useRef(null);

        useEffect(() => {
            const audio = audioRef.current;
            if (!audio) return;
            const updateTime = () => setCurrentTime(audio.currentTime || 0);
            const updateDuration = () => {
                const actualDuration = audio.duration;
                if (actualDuration && !isNaN(actualDuration) && actualDuration < 86400) {
                    setDuration(Math.floor(actualDuration));
                } else if (voiceData.duration && voiceData.duration < 86400) {
                    setDuration(Math.floor(voiceData.duration));
                } else {
                    setDuration(0);
                }
            };
            const onEnded = () => setIsPlaying(false);
            audio.addEventListener('timeupdate', updateTime);
            audio.addEventListener('loadedmetadata', updateDuration);
            audio.addEventListener('ended', onEnded);
            return () => {
                audio.removeEventListener('timeupdate', updateTime);
                audio.removeEventListener('loadedmetadata', updateDuration);
                audio.removeEventListener('ended', onEnded);
            };
        }, [voiceData.duration]);

        const togglePlay = () => {
            const audio = audioRef.current;
            if (!audio) return;
            if (isPlaying) {
                audio.pause();
                setIsPlaying(false);
            } else {
                audio.play();
                setIsPlaying(true);
            }
        };

        const formatTime = (secs) => {
            if (!secs || isNaN(secs) || secs === 0) return '0:00';
            let totalSeconds = Math.floor(secs);
            const minutes = Math.floor(totalSeconds / 60);
            const seconds = totalSeconds % 60;
            if (minutes < 10) {
                return `${minutes}:${seconds.toString().padStart(2, '0')}`;
            } else {
                return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
            }
        };

        return (
            <div className="bg-gray-700 rounded-lg p-3 flex items-center gap-3 max-w-xs">
                <audio ref={audioRef} src={voiceData.url} preload="metadata" />
                <button
                    onClick={togglePlay}
                    className="bg-cyan-500 hover:bg-cyan-600 text-white rounded-full p-2 transition-colors flex-shrink-0"
                >
                    {isPlaying ? <Pause size={16} /> : <Play size={16} />}
                </button>
                <div className="flex-1 min-w-0">
                    <div className="text-sm text-white font-medium truncate">
                        {voiceData.file.name}
                    </div>
                    <div className="text-xs text-gray-300">
                        {formatTime(currentTime)} / {formatTime(duration)}
                    </div>
                    <div className="w-full bg-gray-600 rounded-full h-1 mt-1">
                        <div
                            className="bg-cyan-500 h-1 rounded-full transition-all duration-100"
                            style={{ width: `${duration > 0 ? (currentTime / duration) * 100 : 0}%` }}
                        />
                    </div>
                </div>
                <button
                    onClick={onRemove}
                    className="text-gray-400 hover:text-red-400 transition-colors flex-shrink-0"
                >
                    <X size={16} />
                </button>
            </div>
        );
    };

    const formatTextWithBold = (text) => {
        if (!text || typeof text !== 'string') return text;
        const parts = text.split(/(\*\*[^*]+\*\*)/g);
        return parts.map((part, index) => {
            if (part.startsWith('**') && part.endsWith('**')) {
                const boldText = part.slice(2, -2);
                return <strong key={index}>{boldText}</strong>;
            }
            const singleAsteriskParts = part.split(/(\*[^*]+\*)/g);
            if (singleAsteriskParts.length === 1) {
                return part;
            }
            return singleAsteriskParts.map((subPart, subIndex) => {
                if (subPart.startsWith('*') && subPart.endsWith('*') && !subPart.startsWith('**')) {
                    const boldText = subPart.slice(1, -1);
                    return <strong key={`${index}-${subIndex}`}>{boldText}</strong>;
                }
                return subPart;
            });
        });
    };

    const [stars] = useState(() =>
        Array.from({ length: 50 }, () => ({
            x: Math.random() * 100,
            y: Math.random() * 100,
            opacity: 0.3 + Math.random() * 0.7,
            size: Math.random() * 2 + 1,
        }))
    );

    // Initialize assessment when component mounts or route changes
    useEffect(() => {
        const initializeAssessment = async () => {
            // Get report type from URL or default
            const pathname = location.pathname;
            let reportType = 'vibrational_frequency';

            if (pathname.includes('aura-profile')) reportType = 'aura_profile';
            else if (pathname.includes('star-map')) reportType = 'star_map';
            else if (pathname.includes('kosha-map')) reportType = 'kosha_map';
            else if (pathname.includes('flame-score')) reportType = 'flame_score';
            else if (pathname.includes('longevity-blueprint')) reportType = 'longevity_blueprint';

            setCurrentReportType(reportType);
            setActiveMenuItem(reportType.replace('_', '-'));

            await startSoulReportAssessment(reportType);
        };

        initializeAssessment();
    }, [location.pathname]);

    const startSoulReportAssessment = async (reportType: string) => {
        setIsLoading(true);
        setMessages([]);
        setAssessmentStatus('starting');

        try {
            const userId = localStorage.getItem('user_id');
            if (!userId) {
                setMessages([{ sender: "ai", text: "User ID not found. Please log in." }]);
                setIsLoading(false);
                return;
            }

            const response = await fetch(`http://192.168.29.154:6001/api/v1/chat/select_soul_report/${userId}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                body: new URLSearchParams({
                    report_type: reportType
                })
            });

            const data = await response.json();

            if (data.success) {
                setAssessmentStatus(data.data.assessment_status);
                setCurrentQuestion(data.data.current_question);
                setQuestionNumber(data.data.question_number || 0);
                setTotalQuestions(data.data.total_questions || 0);

                // Add initial message from AI
                setMessages([
                    {
                        sender: "ai",
                        text: data.message || "Let's start your soul report assessment.",
                        centered: false
                    },
                    {
                        sender: "ai",
                        text: data.data.current_question,
                        centered: false
                    }
                ]);
            } else {
                setMessages([{ sender: "ai", text: "Failed to start assessment. Please try again." }]);
            }
        } catch (error) {
            console.error('Error starting assessment:', error);
            setMessages([{ sender: "ai", text: "Error starting assessment. Please try again." }]);
        }

        setIsLoading(false);
    };

    const sendAssessmentResponse = async () => {
        if (!inputValue.trim() && attachedImages.length === 0 && attachedVoices.length === 0 && attachedFiles.length === 0) return;

        const userMessage: Message = {
            sender: "user",
            text: inputValue,
            imageList: attachedImages.length > 0 ? [...attachedImages] : undefined,
            audio: attachedVoices.length > 0 ? attachedVoices[0].url : undefined,
            duration: attachedVoices.length > 0 ? attachedVoices[0].duration : undefined
        };

        setMessages((prev) => [...prev, userMessage]);
        const currentInput = inputValue;
        setInputValue("");

        setIsLoading(true);

        try {
            const userId = localStorage.getItem('user_id');
            if (!userId) {
                setMessages((prev) => [...prev, { sender: "ai", text: "User ID not found. Please log in." }]);
                setIsLoading(false);
                return;
            }

            const formData = new FormData();
            formData.append("report_type", currentReportType);

            // Always send answer, even if empty
            if (currentInput.trim()) {
                formData.append("answer", currentInput);
            } else {
                formData.append("answer", ""); // 👈 empty answer for image/audio
            }

            // Handle file uploads
            if (attachedImages.length > 0 && attachedFiles.length > 0) {
                formData.append("file", attachedFiles[0]);
            } else if (attachedVoices.length > 0) {
                formData.append("file", attachedVoices[0].file);
            }

            const response = await fetch(
                `http://192.168.29.154:6001/api/v1/chat/answer_question/${userId}`,
                {
                    method: "POST",
                    body: formData,
                }
            );

            const data = await response.json();

            if (data.success) {
                setAssessmentStatus(data.data.assessment_status);

                if (data.data.assessment_status === "completed") {
                    setMessages((prev) => [
                        ...prev,
                        {
                            sender: "ai",
                            text: data.message || "All questions answered. Generating your report...",
                        },
                    ]);

                    setTimeout(() => generateSoulReport(userId), 1000);
                } else {
                    setCurrentQuestion(data.data.current_question);
                    setQuestionNumber(data.data.question_number || 0);
                    setTotalQuestions(data.data.total_questions || 0);

                    setMessages((prev) => [
                        ...prev,
                        // {
                        //     sender: "ai",
                        //     text: data.message || "Thank you for your response.",
                        // },
                        {
                            sender: "ai",
                            text: data.data.current_question,
                        },
                    ]);
                }
            } else {
                setMessages((prev) => [
                    ...prev,
                    { sender: "ai", text: data.message || "Failed to process response." },
                ]);
            }
        } catch (error) {
            console.error("Error sending response:", error);
            setMessages((prev) => [
                ...prev,
                {
                    sender: "ai",
                    text: "Sorry, there was an error processing your response. Please try again.",
                },
            ]);
        }

        // Clean up attachments
        setAttachedImages([]);
        setAttachedFiles([]);
        setAttachedVoices([]);
        setIsLoading(false);
    };


    const generateSoulReport = async (userId: string) => {
        setIsGeneratingReport(true);

        try {
            const response = await fetch(`http://192.168.29.154:6001/api/v1/chat/generate_soul_report/${userId}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                body: new URLSearchParams({
                    report_type: currentReportType
                })
            });

            const data = await response.json();

            if (data.success) {
                setReportData(data.data);
                setAssessmentStatus('report_generated');

                // Display the generated report
                const reportContent = formatReportContent(data.data);
                setMessages((prev) => [
                    ...prev,
                    {
                        sender: "ai",
                        text: reportContent
                    }
                ]);
            } else {
                setMessages((prev) => [...prev, { sender: "ai", text: "Failed to generate report. Please try again." }]);
            }
        } catch (error) {
            console.error('Error generating report:', error);
            setMessages((prev) => [
                ...prev,
                {
                    sender: "ai",
                    text: "Error generating report. Please try again."
                }
            ]);
        }

        setIsGeneratingReport(false);
    };

    // Recursive renderer for any JSON value
    const renderValue = (val: any): JSX.Element | string => {
        if (val === null || val === undefined) return "";

        if (
            typeof val === "string" ||
            typeof val === "number" ||
            typeof val === "boolean"
        ) {
            return String(val);
        }

        if (Array.isArray(val)) {
            return (
                <ul>
                    {val.map((item, idx) => (
                        <li key={idx}>{renderValue(item)}</li>
                    ))}
                </ul>
            );
        }

        if (typeof val === "object") {
            return (
                <div style={{ marginLeft: "10px" }}>
                    {Object.entries(val).map(([k, v]) => (
                        <div key={k} className="mb-2">
                            <b>{formatKey(k)}:</b>{" "}
                            {typeof v === "object" ? renderValue(v) : String(v)}
                        </div>
                    ))}
                </div>
            );
        }

        return String(val);
    };

    // Format snake_case keys into nice labels
    const formatKey = (key: string) => {
        return key
            .replace(/_/g, " ") // replace underscores with spaces
            .replace(/\b\w/g, (c) => c.toUpperCase()); // capitalize each word
    };

    // Main Report renderer
    const renderReportDynamic = (report: any) => {
        if (!report) return null;

        return (
            <div style={{ whiteSpace: "pre-wrap" }}>
                {Object.entries(report).map(([key, value]) => (
                    <div key={key} className="mb-3">
                        <h6 className="fw-semibold">{formatKey(key)}</h6>
                        <div>{renderValue(value)}</div>
                    </div>
                ))}
            </div>
        );
    };

    const formatReportContent = (reportData: any) => {
        if (!reportData || !reportData.report) return "Report generated successfully!";

        // Return the JSX component instead of plain text
        return renderReportDynamic(reportData.report);
    };

    const handleNewChat = async () => {
        setMessages([]);
        setInputValue("");
        setAttachedImages([]);
        setAttachedFiles([]);
        setAttachedVoices([]);
        setIsLoading(false);
        setAssessmentStatus('not_started');
        setReportData(null);
        setIsGeneratingReport(false);
        await startSoulReportAssessment(currentReportType);
    };

    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (files) {
            const newFiles = Array.from(files);
            const urls = newFiles.map((file) => URL.createObjectURL(file));
            setAttachedFiles((prev) => [...prev, ...newFiles]);
            setAttachedImages((prev) => [...prev, ...urls]);
        }
    };

    const handleAudioUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (!files || files.length === 0) return;
        const file = files[0];
        const audioUrl = URL.createObjectURL(file);
        const tempAudio = new Audio(audioUrl);
        tempAudio.onloadedmetadata = () => {
            const duration = tempAudio.duration;
            setAttachedVoices(prev => [...prev, {
                url: audioUrl,
                file,
                duration: duration && !isNaN(duration) ? Math.floor(duration) : undefined
            }]);
        };
        tempAudio.onerror = () => {
            setAttachedVoices(prev => [...prev, { url: audioUrl, file }]);
        };
        e.target.value = '';
    };

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
                setAttachedImages(prev => [...prev, imageUrl]);
                const file = new File([blob], 'camera-photo.png', { type: 'image/png' });
                setAttachedFiles(prev => [...prev, file]);
            }
        }, "image/png");
        setShowCamera(false);
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

    const startRecording = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            setMicStream(stream);
            const recorder = new MediaRecorder(stream, {
                mimeType: "audio/webm;codecs=opus",
            });
            recordedChunksRef.current = [];
            recorder.ondataavailable = (e) => {
                if (e.data.size > 0) {
                    recordedChunksRef.current.push(e.data);
                }
            };
            recorder.start();
            mediaRecorderRef.current = recorder;
            setIsRecording(true);
            setRecordingTime(0);
            timerRef.current = setInterval(() => {
                setRecordingTime((prev) => prev + 1);
            }, 1000);
        } catch (err) {
            console.error("Microphone error:", err);
        }
    };

    const stopRecording = () => {
        if (mediaRecorderRef.current && isRecording) {
            const finalDuration = recordingTime;
            mediaRecorderRef.current.onstop = async () => {
                const audioBlob = new Blob(recordedChunksRef.current, { type: "audio/webm;codecs=opus" });
                const audioUrl = URL.createObjectURL(audioBlob);
                const recordedFile = new File([audioBlob], `recording_${Date.now()}.webm`, { type: "audio/webm" });
                setAttachedVoices(prev => [...prev, {
                    url: audioUrl,
                    file: recordedFile,
                    duration: finalDuration
                }]);
            };
            mediaRecorderRef.current.stop();
            setIsRecording(false);
            if (timerRef.current) clearInterval(timerRef.current);
            if (micStream) {
                micStream.getTracks().forEach(track => track.stop());
                setMicStream(null);
            }
        }
    };

    const cancelRecording = () => {
        if (mediaRecorderRef.current) {
            mediaRecorderRef.current.stop();
        }
        if (timerRef.current) clearInterval(timerRef.current);
        if (micStream) {
            micStream.getTracks().forEach(track => track.stop());
            setMicStream(null);
        }
        setIsRecording(false);
        setRecordingTime(0);
    };

    const formatTime = (secs) => {
        if (!secs || isNaN(secs) || secs === 0) return '0:00';
        let totalSeconds = Math.floor(secs);
        const minutes = Math.floor(totalSeconds / 60);
        const seconds = totalSeconds % 60;
        if (minutes < 10) {
            return `${minutes}:${seconds.toString().padStart(2, '0')}`;
        } else {
            return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        }
    };

    const removeAttachedImage = (index: number) => {
        setAttachedImages(prev => prev.filter((_, i) => i !== index));
        setAttachedFiles(prev => prev.filter((_, i) => i !== index));
    };

    const removeAttachedVoice = (index: number) => {
        setAttachedVoices(prev => prev.filter((_, i) => i !== index));
    };

    useEffect(() => {
        return () => {
            if (timerRef.current) {
                clearInterval(timerRef.current);
            }
            if (micStream) {
                micStream.getTracks().forEach(track => track.stop());
            }
            attachedImages.forEach(url => URL.revokeObjectURL(url));
            attachedVoices.forEach(voice => URL.revokeObjectURL(voice.url));
        };
    }, [micStream]);

    useEffect(() => {
        if (chatContainerRef.current) {
            chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
        }
    }, [messages, isLoading]);

    return (
        <div className="d-flex w-100 h-100 min-vh-100 min-vw-100 bg-black text-white overflow-hidden">
            <Stars />
            <div className="absolute inset-0 overflow-hidden">
                {stars.map((star, i) => (
                    <div
                        key={i}
                        className="absolute bg-white rounded-full animate-pulse"
                        style={{
                            width: `${star.size}px`,
                            height: `${star.size}px`,
                            opacity: star.opacity,
                            top: `${star.y}%`,
                            left: `${star.x}%`,
                            animationDelay: `${Math.random() * 3}s`,
                            animationDuration: `${2 + Math.random() * 2}s`
                        }}
                    />
                ))}
            </div>

            {showCamera && (
                <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
                    <div className="bg-gray-800 rounded-lg p-6 max-w-md w-full mx-4">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-lg font-semibold text-white">Take Photo</h3>
                            <button onClick={closeCamera} className="text-gray-400 hover:text-white">
                                <X size={24} />
                            </button>
                        </div>
                        <video
                            ref={videoRef}
                            className="w-full rounded-lg mb-4"
                            autoPlay
                            muted
                        />
                        <canvas ref={canvasRef} className="hidden" />
                        <div className="flex gap-4 justify-center">
                            <button
                                onClick={capturePhoto}
                                className="bg-cyan-500 hover:bg-cyan-600 text-white px-6 py-2 rounded-lg transition-colors"
                            >
                                Capture
                            </button>
                            <button
                                onClick={closeCamera}
                                className="bg-gray-600 hover:bg-gray-700 text-white px-6 py-2 rounded-lg transition-colors"
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {sidebarOpen && (
                <div
                    className="fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden"
                    onClick={() => setSidebarOpen(false)}
                />
            )}

            <div
                className={`${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0 fixed md:relative h-screen z-50 w-64 backdrop-blur-sm transition-transform duration-300 ease-in-out overflow-y-auto`}
                style={{
                    backgroundColor: '#1E2123',
                    scrollbarWidth: 'thin',
                    scrollbarColor: '#4B5563 #1E2123'
                }}
            >
                <style>{`
          div::-webkit-scrollbar {
            width: 6px;
          }
          div::-webkit-scrollbar-track {
            background: #1E2123;
          }
          div::-webkit-scrollbar-thumb {
            background: #4B5563;
            border-radius: 3px;
          }
          div::-webkit-scrollbar-thumb:hover {
            background: #6B7280;
          }
        `}</style>
                <div className="p-4 border-b border-gray-700">
                    <div className="flex items-center justify-between">
                        <h2 className="text-lg font-bold" style={{ color: '#00B8F8' }}>Eternal Reports</h2>
                        <button
                            className="md:hidden text-gray-400 hover:text-white bg-transparent"
                            onClick={() => setSidebarOpen(false)}
                        >
                            <X size={20} />
                        </button>
                    </div>
                </div>
                <div className="p-3">
                    <nav className="d-flex flex-column gap-2">
                        {sidebarMenuItems.map((item) => (
                            <button
                                key={item.id}
                                className={`btn d-flex align-items-center my-2 gap-2 w-100 text-start ${activeMenuItem === item.id
                                    ? 'btn-info text-white'
                                    : 'btn-dark text-white hover-bg-dark'
                                    }`}
                                onClick={() => {
                                    setActiveMenuItem(item.id);
                                    navigate(`/${item.id}`);
                                }}
                                style={{ padding: '0.5rem 1rem', borderRadius: '8px' }}
                            >
                                {item.icon}
                                <span>{item.label}</span>
                            </button>
                        ))}
                    </nav>
                </div>
            </div>

            <div className="flex-1 flex flex-col relative z-10 h-screen">
                <div className="flex items-center justify-between p-4 border-gray-800">
                    <div className="flex items-center gap-3">
                        <button
                            className="md:hidden text-gray-400 hover:text-white"
                            onClick={() => setSidebarOpen(true)}
                        >
                            <Menu size={20} />
                        </button>
                        <h3 className="text-xl font-semibold">
                            Eternal AI - {sidebarMenuItems.find(item => item.id === activeMenuItem)?.label || 'Assessment'}
                        </h3>
                    </div>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={handleNewChat}
                            className="w-10 h-10 bg-gray-500 rounded-full flex items-center justify-center text-sm font-semibold hover:bg-gray-600 transition-colors"
                        >
                            <SquarePlus size={18} />
                        </button>
                        <div className="w-12 h-12 bg-cyan-500 rounded-full flex items-center justify-center text-sm font-semibold ms-2">
                            A
                        </div>
                    </div>
                </div>

                {/* Progress indicator */}
                {/* {assessmentStatus !== 'not_started' && assessmentStatus !== 'report_generated' && totalQuestions > 0 && (
                    <div className="px-6 py-2 border-b border-gray-800">
                        <div className="flex items-center justify-between text-sm text-gray-400 mb-2">
                            <span>Progress: {questionNumber}/{totalQuestions}</span>
                            <span>{Math.round((questionNumber / totalQuestions) * 100)}%</span>
                        </div>
                        <div className="w-full bg-gray-700 rounded-full h-2">
                            <div
                                className="bg-cyan-500 h-2 rounded-full transition-all duration-300"
                                style={{ width: `${(questionNumber / totalQuestions) * 100}%` }}
                            />
                        </div>
                    </div>
                )} */}

                <div className="flex-1 flex flex-col h-full relative overflow-hidden">
                    {/* Chat Messages Area - Scrollable */}
                    <div
                        ref={chatContainerRef}
                        className="flex-1 overflow-y-auto px-6 py-4 space-y-4 hide-scrollbar"
                        style={{
                            maxWidth: "65%",
                            margin: "0 auto",
                            width: "100%",
                            // scrollbarWidth: 'thin',
                            // scrollbarColor: '#4B5563 #1E2123'
                        }}
                    >
                        <style>{`
                        // .custom-scrollbar::-webkit-scrollbar {
                        //     width: 6px;
                        // }
                        // .custom-scrollbar::-webkit-scrollbar-track {
                        //     background: #1E2123;
                        // }
                        // .custom-scrollbar::-webkit-scrollbar-thumb {
                        //     background: #4B5563;
                        //     border-radius: 3px;
                        // }
                        // .custom-scrollbar::-webkit-scrollbar-thumb:hover {
                        //     background: #6B7280;
                        // }
                         /* Hide scrollbar for Chrome, Safari and Opera */
    .hide-scrollbar::-webkit-scrollbar {
      display: none;
    }

    /* Hide scrollbar for Firefox */
    .hide-scrollbar {
      scrollbar-width: none; /* Firefox */
      -ms-overflow-style: none; /* IE and Edge */
    }
                        `}</style>

                        {messages.length === 0 && assessmentStatus === 'not_started' ? (
                            <div className="flex-1 flex items-center justify-center h-full min-h-[60vh]">
                                <div className="text-center">
                                    <div className="mb-4">
                                        <div className="w-16 h-16 bg-cyan-500 rounded-full flex items-center justify-center mx-auto mb-4">
                                            <span className="text-2xl font-semibold">AI</span>
                                        </div>
                                    </div>
                                    <div className="text-white text-lg leading-relaxed">
                                        <div className="text-xl font-semibold text-white">Hi, I'm Eternal AI</div>
                                        <div className="text-sm text-gray-400 mt-1">Starting your {sidebarMenuItems.find(item => item.id === activeMenuItem)?.label} assessment...</div>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <>
                                {messages.map((message, index) => (
                                    <div key={index} className="w-full">
                                        {message.sender === 'user' ? (
                                            <div className="flex flex-col items-end gap-2 mb-4">
                                                <div className="w-8 h-8 bg-cyan-500 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                                                    <span className="text-xs font-semibold text-white"><User size={18} /></span>
                                                </div>
                                                <div className="bg-cyan-500 text-white rounded-2xl rounded-tr-md px-4 py-3 max-w-xs lg:max-w-md shadow-lg">
                                                    {message.imageList && message.imageList.length > 0 && (
                                                        <div className="mb-2">
                                                            {message.imageList.map((img, j) => (
                                                                <img
                                                                    key={j}
                                                                    src={img}
                                                                    alt="attachment"
                                                                    className="rounded max-w-full h-auto cursor-pointer"
                                                                    style={{ maxWidth: "200px", maxHeight: "200px", objectFit: "cover" }}
                                                                    onClick={() => setPreviewImage(img)}
                                                                />
                                                            ))}
                                                        </div>
                                                    )}
                                                    {message.audio && (
                                                        <VoiceMessage url={message.audio} duration={message.duration ?? 0} />
                                                    )}
                                                    {message.text && (
                                                        <div className="text-md leading-relaxed whitespace-pre-wrap break-words">
                                                            {message.text}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="flex flex-col items-start gap-2 mb-4">
                                                <div className="w-8 h-8 bg-cyan-500 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                                                    <span className="text-xs font-semibold text-white">AI</span>
                                                </div>
                                                <div className="bg-gray-800 text-white rounded-2xl rounded-tl-md px-4 py-3 max-w-xs lg:max-w-2xl shadow-lg">
                                                    <div className="text-md leading-relaxed whitespace-pre-wrap break-words">
                                                        {message.isThinking ? (
                                                            <div className="flex items-center gap-2">
                                                                <div className="animate-spin rounded-full h-4 w-4 border-2 border-cyan-500 border-t-transparent"></div>
                                                                <span>{message.text}</span>
                                                            </div>
                                                        ) : (
                                                            formatTextWithBold(message.text)
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                ))}
                                {(isLoading || isGeneratingReport) && (
                                    <div className="flex flex-col items-start gap-2 mb-4">
                                        <div className="w-8 h-8 bg-cyan-500 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                                            <span className="text-xs font-semibold text-white">AI</span>
                                        </div>
                                        <div className="bg-gray-800 text-white rounded-2xl rounded-tl-md px-4 py-3 shadow-lg">
                                            <div className="flex items-center gap-2">
                                                <div className="animate-spin rounded-full h-4 w-4 border-2 border-cyan-500 border-t-transparent"></div>
                                                <span className="text-sm">
                                                    {isGeneratingReport ? "Generating your report..." : "Processing..."}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </>
                        )}
                    </div>

                    {assessmentStatus === 'report_generated' && (
                        <div className="px-6 py-4 text-center">
                            <Button
                                variant="primary"
                                style={{
                                    backgroundColor: '#00B8F8',
                                    border: 'none',
                                    borderRadius: '20px',
                                    padding: '8px 20px',
                                    color: '#fff',
                                    fontWeight: 'bold',
                                    cursor: 'pointer'
                                }}
                                onClick={() => navigate('/result')}
                            >
                                Back to Spiritual
                            </Button>
                        </div>
                    )}

                    {/* Fixed Input Area at Bottom */}
                    {assessmentStatus !== 'report_generated' && (
                        <div className="sticky bottom-0 bg-black z-20 px-6 pb-4 pt-2 border-t border-gray-800">
                            <div className="bg-gray-800 rounded-2xl p-4 shadow-lg" style={{ maxWidth: '65%', margin: '0 auto', width: '100%' }}>
                                {(attachedImages.length > 0 || attachedVoices.length > 0) && (
                                    <div className="flex flex-col gap-3 mb-3">
                                        {attachedImages.length > 0 && (
                                            <div className="flex flex-wrap gap-2">
                                                {attachedImages.map((img, idx) => (
                                                    <div
                                                        key={idx}
                                                        className="relative"
                                                        style={{ width: "80px", height: "80px" }}
                                                    >
                                                        <img
                                                            src={img}
                                                            alt="preview"
                                                            className="rounded object-cover w-full h-full"
                                                        />
                                                        <button
                                                            className="absolute -top-2 -right-2 bg-danger text-white flex items-center justify-center text-xs hover:bg-red-600 p-1 rounded-full rounded-circle"
                                                            onClick={() => removeAttachedImage(idx)}
                                                        >
                                                            <X size={12} />
                                                        </button>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                        {attachedVoices.length > 0 && (
                                            <div className="flex flex-col gap-2">
                                                {attachedVoices.map((voice, idx) => (
                                                    <VoicePreview
                                                        key={idx}
                                                        voiceData={voice}
                                                        onRemove={() => removeAttachedVoice(idx)}
                                                    />
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                )}
                                <div className="flex items-end gap-4">
                                    {!isRecording ? (
                                        <>
                                            <div className="flex-1">
                                                <input
                                                    type="text"
                                                    placeholder="Enter your response here..."
                                                    value={inputValue}
                                                    onChange={(e) => setInputValue(e.target.value)}
                                                    onKeyPress={(e) => e.key === 'Enter' && !isLoading && !isGeneratingReport && sendAssessmentResponse()}
                                                    className="w-full bg-transparent text-white placeholder-gray-400 outline-none text-sm py-2 resize-none"
                                                    disabled={isLoading || isGeneratingReport}
                                                />
                                            </div>
                                            <div className="flex items-center gap-3">
                                                <label className="text-gray-400 hover:text-white transition-colors p-1 bg-transparent cursor-pointer">
                                                    <ImagePlus size={20} />
                                                    <input
                                                        type="file"
                                                        accept="image/*"
                                                        hidden
                                                        multiple
                                                        onChange={handleImageUpload}
                                                    />
                                                </label>
                                                <button
                                                    className="text-gray-400 hover:text-white transition-colors p-1 bg-transparent"
                                                    onClick={openCamera}
                                                >
                                                    <Camera size={20} />
                                                </button>
                                                <label className="text-gray-400 hover:text-white transition-colors p-1 bg-transparent cursor-pointer">
                                                    <Upload size={20} />
                                                    <input
                                                        type="file"
                                                        accept="audio/*,.mp3,.wav,.m4a"
                                                        hidden
                                                        onChange={handleAudioUpload}
                                                    />
                                                </label>
                                                <button
                                                    className="text-gray-400 hover:text-white transition-colors p-1 bg-transparent"
                                                    onClick={startRecording}
                                                >
                                                    <Mic size={20} />
                                                </button>
                                                <div className="border-l border-gray-600 pl-3">
                                                    <button
                                                        onClick={sendAssessmentResponse}
                                                        disabled={isLoading || isGeneratingReport || (!inputValue.trim() && attachedImages.length === 0 && attachedVoices.length === 0)}
                                                        className="bg-cyan-500 hover:bg-cyan-600 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded-full p-2 transition-colors shadow-lg bg-transparent"
                                                    >
                                                        <SendHorizontal size={20} />
                                                    </button>
                                                </div>
                                            </div>
                                        </>
                                    ) : (
                                        <div className="flex items-center bg-gray-700 rounded-xl px-4 py-2 flex-grow-1 w-full">
                                            <MicVisualizer stream={micStream} height={40} />
                                            <span className="ml-4 text-red-400 font-bold text-lg">{formatTime(recordingTime)}</span>
                                            <div className="ml-auto flex items-center gap-2">
                                                <button
                                                    className="bg-green-500 hover:bg-green-600 text-white rounded-full p-2 transition-colors bg-transparent"
                                                    onClick={stopRecording}
                                                >
                                                    <Check size={16} />
                                                </button>
                                                <button
                                                    className="bg-red-500 hover:bg-red-600 text-white rounded-full p-2 transition-colors bg-transparent"
                                                    onClick={cancelRecording}
                                                >
                                                    <X size={16} />
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Footer - Fixed at very bottom */}
                    <div className="sticky bottom-0 bg-black z-10 px-6 py-2 border-t border-gray-800">
                        <div className="text-center text-xs text-gray-500" style={{ maxWidth: '65%', margin: '0 auto', width: '100%' }}>
                            <div className="flex items-center justify-between text-xs">
                                <div>© 2025 EROS Universe. All Rights Reserved.</div>
                                <div className="flex items-center gap-6">
                                    <a href="#" className="hover:text-gray-300 transition-colors">FAQs</a>
                                    <a href="#" className="hover:text-gray-300 transition-colors">Privacy Policy</a>
                                    <a href="#" className="hover:text-gray-300 transition-colors">Terms & Conditions</a>
                                    <a href="#" className="hover:text-gray-300 transition-colors">Refund Policy</a>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {previewImage && (
                    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
                        <div className="relative max-w-4xl max-h-4xl p-4">
                            <button
                                onClick={() => setPreviewImage(null)}
                                className="absolute top-4 right-4 text-white hover:text-gray-300 z-10"
                            >
                                <X size={24} />
                            </button>
                            <img
                                src={previewImage}
                                alt="Preview"
                                className="max-w-full max-h-full object-contain rounded-lg"
                            />
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default LongevityTool;