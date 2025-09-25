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
import { useNavigate } from "react-router-dom";

const AiChat: React.FC = () => {
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

    // New state for voice preview
    const [attachedVoices, setAttachedVoices] = useState<Array<{ url: string, file: File, duration?: number }>>([]);

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

    const [stars] = useState(() =>
        Array.from({ length: 50 }, () => ({
            x: Math.random() * 100,
            y: Math.random() * 100,
            opacity: 0.3 + Math.random() * 0.7,
            size: Math.random() * 2 + 1,
        }))
    );

    const historyItems = [
        "How is my aura profile?",
        "How stars are located for me?",
        "Tell about my kosha's?"
    ];

    useEffect(() => {
        if (!isInitialized && messages.length === 0) {
            initializeChat();
        }
    }, []);

    const initializeChat = async () => {
        if (isInitialized) return;
        setIsInitialized(true);
        setMessages([
            {
                sender: "ai",
                text: (
                    <div className="text-center">
                        <div className="text-2xl font-600 text-white">
                            Hi, I'm Eternal AI
                        </div>
                        <div className="text-sm text-white mt-3">
                            How can I help you today?
                        </div>
                    </div>
                ),
                centered: true
            }
        ]);
    };

    const handleNewChat = () => {
        setMessages([]);
        setInputValue("");
        setAttachedImages([]);
        setAttachedFiles([]);
        setAttachedVoices([]);
        setIsLoading(false);
        setIsInitialized(false);

        setTimeout(() => {
            setIsInitialized(true);
            setMessages([
                {
                    sender: "ai",
                    text: (
                        <div className="text-center">
                            <div className="text-2xl font-600 text-white">
                                Hi, I'm Eternal AI
                            </div>
                            <div className="text-sm text-white mt-3">
                                How can I help you today?
                            </div>
                        </div>
                    ),
                    centered: true
                }
            ]);
        }, 50);
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

            // Timer
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

    const sendMessage = async () => {
        if (!inputValue.trim() && attachedImages.length === 0 && attachedVoices.length === 0) return;

        const userMessage: Message = {
            sender: "user",
            text: inputValue,
            imageList: attachedImages.length > 0 ? [...attachedImages] : undefined,
            audio: attachedVoices.length > 0 ? attachedVoices[0].url : undefined,
            duration: attachedVoices.length > 0 ? attachedVoices[0].duration : undefined
        };

        setMessages((prev) => [...prev, userMessage]);

        const currentInput = inputValue;
        const hasVoice = attachedVoices.length > 0;
        const hasImages = attachedImages.length > 0;

        setInputValue("");
        setAttachedImages([]);
        setAttachedFiles([]);
        setAttachedVoices([]);
        setIsLoading(true);

        try {
            setTimeout(() => {
                let responseText = "I understand your ";
                if (hasVoice) responseText += "voice message";
                if (hasImages) responseText += hasVoice ? " and images" : "images";
                if (currentInput.trim()) responseText += (hasVoice || hasImages) ? " and text" : "question";
                responseText += ". Let me provide you with spiritual guidance on this matter.";

                setMessages((prev) => [
                    ...prev,
                    {
                        sender: "ai",
                        text: responseText
                    },
                ]);
                setIsLoading(false);
            }, 1000);

        } catch (error) {
            console.error('Error:', error);
            setTimeout(() => {
                setMessages((prev) => [
                    ...prev,
                    {
                        sender: "ai",
                        text: "Sorry, there was an error processing your request. Please try again."
                    },
                ]);
                setIsLoading(false);
            }, 600);
        }
    };

    // const formatTime = (secs: number) => {
    //     const m = Math.floor(secs / 60)
    //         .toString()
    //         .padStart(2, "0");
    //     const s = (secs % 60).toString().padStart(2, "0");
    //     return `${m}:${s}`;
    // };

    // const formatTime = (secs) => {
    //     if (!secs || isNaN(secs)) return '00:00';
    //     const m = Math.floor(secs / 60)
    //         .toString()
    //         .padStart(2, "0");
    //     const s = (secs % 60).toString().padStart(2, "0");
    //     return `${m}:${s}`;
    // };

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

            {/* Camera Modal */}
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

            {/* Mobile Sidebar Overlay */}
            {sidebarOpen && (
                <div
                    className="fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden"
                    onClick={() => setSidebarOpen(false)}
                />
            )}

            {/* Sidebar */}
            <div className={`${sidebarOpen ? 'translate-x-0' : '-translate-x-full'
                } md:translate-x-0 fixed md:relative h-screen z-50 w-64 backdrop-blur-sm transition-transform duration-300 ease-in-out`} style={{ backgroundColor: '#1E2123' }}>

                {/* Sidebar Header */}
                <div className="p-4 border-b border-gray-700">
                    <div className="flex items-center justify-between">
                        <h2 className="text-lg font-bold" style={{ color: '#00B8F8' }}>Eternal AI</h2>
                        <button
                            className="md:hidden text-gray-400 hover:text-white bg-transparent"
                            onClick={() => setSidebarOpen(false)}
                        >
                            <X size={20} />
                        </button>
                    </div>
                </div>

                {/* New Chat Button */}
                <div className="p-4">
                    <button
                        onClick={handleNewChat}
                        className="w-full flex items-center gap-3 px-4 py-3 bg-transparent rounded text-gray-300 hover:text-white hover:bg-gray-800 transition-all duration-200 group"
                        style={{ border: '1px solid grey' }}
                    >
                        <SquarePlus size={18} className="group-hover:scale-110 transition-transform duration-200" />
                        <span className="text-sm font-medium">New Chat</span>
                    </button>
                </div>

                {/* History Section */}
                <div className="p-4 border-t border-gray-700">
                    <h5 className="font-medium text-gray-400 mb-3 text-sm">Recent Chats</h5>
                    <div className="space-y-2">
                        {historyItems.map((item, index) => (
                            <div
                                key={index}
                                className="text-sm text-gray-300 hover:text-white hover:bg-gray-800 cursor-pointer py-2 px-3 rounded-lg transition-all duration-200 truncate"
                                title={item}
                            >
                                {item}
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Main Content Area */}
            <div className="flex-1 flex flex-col relative z-10">
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-gray-800">
                    <div className="flex items-center gap-3">
                        <button
                            className="md:hidden text-gray-400 hover:text-white"
                            onClick={() => setSidebarOpen(true)}
                        >
                            <Menu size={20} />
                        </button>
                        <h3 className="text-xl font-semibold">Eternal AI</h3>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-10 h-10 bg-gray-500 rounded-full flex items-center justify-center text-sm font-semibold">
                            <LogOut size={18} />
                        </div>
                        <div className="w-12 h-12 bg-cyan-500 rounded-full flex items-center justify-center text-sm font-semibold ms-2">
                            A
                        </div>
                    </div>
                </div>

                {/* Chat Messages Area - Centered layout for initial message */}
                <div className="flex-1 flex flex-col relative">
                    {messages.length === 1 && messages[0].centered ? (
                        // Centered initial greeting
                        <div className="flex-1 flex items-center justify-center">
                            <div className="text-center">
                                <div className="mb-4">
                                    <div className="w-16 h-16 bg-cyan-500 rounded-full flex items-center justify-center mx-auto mb-4">
                                        <span className="text-2xl font-semibold">AI</span>
                                    </div>
                                </div>
                                <div className="text-white text-lg leading-relaxed whitespace-pre-line">
                                    {messages[0].text}
                                </div>
                            </div>
                        </div>
                    ) : (
                        // Regular chat layout with updated styling
                        <div className="flex-1 overflow-y-auto px-6 py-8 space-y-4" style={{ maxWidth: '65%', margin: '0 auto', width: '100%' }}>
                            {messages.map((message, index) => (
                                <div key={index} className="w-full">
                                    {message.sender === 'user' ? (
                                        // User message - right aligned
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
                                        // AI message - left aligned with avatar
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
                                                        message.text
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ))}

                            {isLoading && (
                                <div className="flex flex-col items-start gap-2 mb-4">
                                    <div className="w-8 h-8 bg-cyan-500 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                                        <span className="text-xs font-semibold text-white">AI</span>
                                    </div>
                                    <div className="bg-gray-800 text-white rounded-2xl rounded-tl-md px-4 py-3 shadow-lg">
                                        <div className="flex items-center gap-2">
                                            <div className="animate-spin rounded-full h-4 w-4 border-2 border-cyan-500 border-t-transparent"></div>
                                            <span className="text-sm">Thinking...</span>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Input Area - Updated positioning */}
                    <div className="px-6 pb-6" style={{ maxWidth: '65%', margin: '0 auto', width: '100%' }}>
                        <div className="bg-gray-800 rounded-2xl p-4 shadow-lg">
                            {/* Attached Files Preview */}
                            {(attachedImages.length > 0 || attachedVoices.length > 0) && (
                                <div className="flex flex-col gap-3 mb-3">
                                    {/* Images Preview */}
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

                                    {/* Voice Previews */}
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
                                                placeholder="Enter a prompt here"
                                                value={inputValue}
                                                onChange={(e) => setInputValue(e.target.value)}
                                                onKeyPress={(e) => e.key === 'Enter' && !isLoading && sendMessage()}
                                                className="w-full bg-transparent text-white placeholder-gray-400 outline-none text-sm py-2 resize-none"
                                                disabled={isLoading}
                                            />
                                        </div>

                                        {/* Action buttons */}
                                        <div className="flex items-center gap-3">
                                            {/* Image Upload */}
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

                                            {/* Camera */}
                                            <button
                                                className="text-gray-400 hover:text-white transition-colors p-1 bg-transparent"
                                                onClick={openCamera}
                                            >
                                                <Camera size={20} />
                                            </button>

                                            {/* Audio Upload */}
                                            <label className="text-gray-400 hover:text-white transition-colors p-1 bg-transparent cursor-pointer">
                                                <Upload size={20} />
                                                <input
                                                    type="file"
                                                    accept="audio/*,.mp3,.wav,.m4a"
                                                    hidden
                                                    onChange={handleAudioUpload}
                                                />
                                            </label>

                                            {/* Audio Record */}
                                            <button
                                                className="text-gray-400 hover:text-white transition-colors p-1 bg-transparent"
                                                onClick={startRecording}
                                            >
                                                <Mic size={20} />
                                            </button>

                                            <div className="border-l border-gray-600 pl-3">
                                                <button
                                                    onClick={sendMessage}
                                                    disabled={isLoading || (!inputValue.trim() && attachedImages.length === 0 && attachedVoices.length === 0)}
                                                    className="bg-cyan-500 hover:bg-cyan-600 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded-full p-2 transition-colors shadow-lg bg-transparent"
                                                >
                                                    <SendHorizontal size={20} />
                                                </button>
                                            </div>
                                        </div>
                                    </>
                                ) : (
                                    // Recording UI
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
                </div>

                {/* Footer */}
                <div className="px-6 pb-4">
                    <div className="text-center text-xs text-gray-500">
                        <div className="flex items-center justify-between text-xs mb-2">
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

            {/* Image Preview Modal */}
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
    );
};

export default AiChat;