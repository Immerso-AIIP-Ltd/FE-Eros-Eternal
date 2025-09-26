// src/ErosChatUI.tsx
import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Menu, X, SendHorizontal, Mic, Camera, ImagePlus, LogOut, SquarePlus, User, Upload, Play, Pause, Check } from "lucide-react";
import { Row, Col, Button, Form } from "react-bootstrap";
import starone from "./star1.png";
import startwo from "./star2.png";
import starthree from "./star3.png";
import starfour from "./star4.png";
import sparkle from "./sparkle.png";
import Stars from "./components/stars";
import VoiceMessage from "./VoiceMessage";
import MicVisualizer from "./MicVisualizer";
import Fire from "./assets/webm/Fire.webm";
import Earth from "./assets/webm/Earth Globe Looped Icon.webm";
import Food from "./assets/webm/Food animation.webm";
import Gym from "./assets/webm/Gym dubble.webm";
import Magic from "./assets/webm/Magic Crystal Ball.webm";
import Star from "./assets/webm/Star.webm";
import "./header.css";

// Define the structure for the sidebar menu items
const sidebarMenuItems = [
  { id: 'star-map', label: 'Star Map', icon: <SquarePlus size={16} /> },
  { id: 'aura-profile', label: 'Aura Profile', icon: <User size={16} /> },
  { id: 'vibrational-frequency', label: 'Vibrational Frequency', icon: <ImagePlus size={16} /> },
  { id: 'kosha-map', label: 'Kosha Map', icon: <Camera size={16} /> },
  { id: 'flame-score', label: 'Flame Score', icon: <Upload size={16} /> },
  { id: 'longevity-blueprint', label: 'Longevity Blueprint', icon: <Mic size={16} /> },
];

interface Message {
  sender: "user" | "ai";
  text?: string;
  imageList?: string[];
  audio?: string;
  duration?: number;
  isSuggestion?: boolean;
  report?: any;
  isThinking?: boolean;
  aiAvatar?: boolean;
  userAvatar?: boolean;
  icon?: string; // For suggestion icons
}

const ErosChatUI: React.FC = () => {
  const navigate = useNavigate();
  const [inputValue, setInputValue] = useState<string>("");
  const [isRecording, setIsRecording] = useState(false);
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
  const [recordingTime, setRecordingTime] = useState(0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const [conversationActive, setConversationActive] = useState(false);
  const [reportType, setReportType] = useState<string | null>(null);
  const [answers, setAnswers] = useState<string[]>([]);
  const [reportGenerated, setReportGenerated] = useState(false);
  const [isLoadingResponse, setIsLoadingResponse] = useState(false);
  const [attachedFiles, setAttachedFiles] = useState<File[]>([]);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [completedReports, setCompletedReports] = useState<string[]>([]);
  const textAreaRef = useRef<HTMLTextAreaElement | null>(null);
  const [spiritualSessionId, setSpiritualSessionId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [showCamera, setShowCamera] = useState(false);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [attachedImages, setAttachedImages] = useState<string[]>([]);
  const [micStream, setMicStream] = useState<MediaStream | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const questions = [
    { message: "What's my vibe right now?", icon: Star },
    { message: "What's my aura saying?", icon: Magic },
    { message: "What planet is affecting me?", icon: Earth },
    { message: "What should I eat for energy today?", icon: Food },
    { message: "How bright is my inner flame burning?", icon: Fire },
    {
      message: "Which of my energy bodies needs the most love today?",
      icon: Gym,
    },
  ];

  const reportTypes: Record<string, string> = {
    "What's my vibe right now?": "vibrational_frequency",
    "What's my aura saying?": "aura_profile",
    "What planet is affecting me?": "star_map",
    "What should I eat for energy today?": "longevity_blueprint",
    "How bright is my inner flame burning?": "flame_score",
    "Which of my energy bodies needs the most love today?": "kosha_map",
  };

  // Initialize the chat with welcome message and questions
  useEffect(() => {
    const welcomeMessage = `👋 Hey ${localStorage.getItem("username") || "Guest"}!, What do you want from Eternal AI.`;
    const questionMessages = questions.map((question) => ({
      sender: "ai",
      text: question.message,
      icon: question.icon,
      isSuggestion: true,
    }));
    setMessages([
      { sender: "ai", text: welcomeMessage, aiAvatar: true },
      ...questionMessages,
    ]);
  }, []);

  const getDisplayName = () => {
    const raw = localStorage.getItem("username") || "Guest";
    return raw
      .trim()
      .toLowerCase()
      .replace(/\b\w/g, (c) => c.toUpperCase());
  };

  const displayName = getDisplayName();
  const initials = displayName
    .split(/\s+/)
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    const filesArr = Array.from(files);
    const urls = filesArr.map((f) => URL.createObjectURL(f));
    setAttachedImages((prev) => [...prev, ...urls]);
    setAttachedFiles((prev) => [...prev, ...filesArr]);
  };

  const sendMessage = async () => {
    const userId = localStorage.getItem("user_id");
    const BASE_URL = "http://192.168.29.154:6001";
    const message = inputValue.trim();
    const hasText = message.length > 0;
    const hasFiles = attachedFiles.length > 0;
    if (!hasText && !hasFiles) return;

    setMessages((prev) => [
      ...prev,
      {
        sender: "user",
        text: message || undefined,
        imageList: attachedImages.length ? [...attachedImages] : undefined,
        userAvatar: true,
      },
    ]);

    setInputValue("");
    if (textAreaRef.current) {
      textAreaRef.current.style.height = "40px";
    }
    setAttachedImages([]);
    setAttachedFiles([]);
    if (fileInputRef.current) fileInputRef.current.value = "";
    setIsLoadingResponse(true);
    setMessages((prev) => [
      ...prev,
      { sender: "ai", text: "Thinking...", isThinking: true },
    ]);

    const form = new FormData();
    form.append("report_type", reportType || "vibrational_frequency");
    if (hasFiles) {
      attachedFiles.forEach((f) => form.append("file", f, f.name));
      if (hasText) form.append("answer", message);
    } else {
      form.append("answer", message);
    }

    try {
      const res = await fetch(`${BASE_URL}/api/v1/chat/answer_question/${userId}`, {
        method: "POST",
        body: form,
      });
      const data = await res.json();
      setMessages((prev) => prev.filter((m) => !m.isThinking));
      if (data?.data?.assessment_status === "completed") {
        setMessages((prev) => [
          ...prev,
          { sender: "ai", text: "Generating your report...", aiAvatar: true },
        ]);
        await generateReport();
      } else {
        setMessages((prev) => [
          ...prev,
          { sender: "ai", text: data?.data?.current_question, aiAvatar: true },
        ]);
      }
    } catch (err) {
      console.error("Process answer error:", err);
      setMessages((prev) => [
        ...prev,
        { sender: "ai", text: "Sorry, something went wrong. Please try again." },
      ]);
    } finally {
      setIsLoadingResponse(false);
    }
  };

  const handleGoHome = () => {
    navigate("/result");
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
      recorder.onstop = () => {
        const audioBlob = new Blob(chunks, { type: "audio/webm;codecs=opus" });
        const audioUrl = URL.createObjectURL(audioBlob);
        setMessages((prev) => [
          ...prev,
          { sender: "user", audio: audioUrl, duration: 0, userAvatar: true },
        ]);
        const tempAudio = new Audio(audioUrl);
        tempAudio.onloadedmetadata = () => {
          const duration = Math.floor(tempAudio.duration);
          setMessages((prev) =>
            prev.map((m, i) => (i === prev.length - 1 ? { ...m, duration } : m))
          );
        };
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
    }
  };

  const stopRecording = () => {
    if (mediaRecorder && isRecording) {
      mediaRecorder.stop();
      setIsRecording(false);
      if (timerRef.current) clearInterval(timerRef.current);
    }
  };

  const cancelRecording = () => {
    if (mediaRecorder) {
      mediaRecorder.stop();
    }
    if (timerRef.current) clearInterval(timerRef.current);
    setIsRecording(false);
    setRecordingTime(0);
  };

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60).toString().padStart(2, "0");
    const s = (secs % 60).toString().padStart(2, "0");
    return `${m}:${s}`;
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
        setAttachedImages([imageUrl]);
        const file = new File([blob], 'camera-photo.png', { type: 'image/png' });
        setAttachedFiles([file]);
        // Auto-send
        setMessages((prev) => [
          ...prev,
          { sender: "user", text: "", imageList: [imageUrl], userAvatar: true },
        ]);
        setInputValue("");
        setAttachedImages([]);
        setTimeout(() => {
          setMessages((prev) => [
            ...prev,
            { sender: "ai", text: "📷 Nice photo! AI is ready to chat.", aiAvatar: true },
          ]);
        }, 600);
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

  const renderValue = (val: any): JSX.Element | string => {
    if (val === null || val === undefined) return "";
    if (typeof val === "string" || typeof val === "number" || typeof val === "boolean") {
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
              <b>{formatKey(k)}:</b> {typeof v === "object" ? renderValue(v) : String(v)}
            </div>
          ))}
        </div>
      );
    }
    return String(val);
  };

  const formatKey = (key: string) => {
    return key
      .replace(/_/g, " ")
      .replace(/\b\w/g, (c) => c.toUpperCase());
  };

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

  const handleSuggestionClick = async (question: string) => {
    const type = reportTypes[question];
    if (!type) return;

    setReportType(type);
    setAnswers([]);
    setConversationActive(true);
    setReportGenerated(false);
    setMessages((prev) => prev.filter((m) => !m.isSuggestion));
    setMessages((prev) => [...prev, { sender: "user", text: question, userAvatar: true }]);

    const userId = localStorage.getItem("user_id") || "0";
    const form = new FormData();
    form.append("report_type", type);
    try {
      const res = await fetch(`http://192.168.29.154:6001/api/v1/chat/select_soul_report/${userId}`, {
        method: "POST",
        body: form,
      });
      const data = await res.json();
      setMessages((prev) => [
        ...prev,
        { sender: "ai", text: data?.data?.current_question, aiAvatar: true },
      ]);
    } catch (err) {
      console.error("Error starting report:", err);
      setMessages((prev) => [
        ...prev,
        { sender: "ai", text: "Sorry, something went wrong." },
      ]);
    }
  };

  const generateReport = async () => {
    const userId = localStorage.getItem("user_id") || "0";
    const form = new FormData();
    form.append("user_id", userId);
    form.append("report_type", reportType || "");
    try {
      const res = await fetch(`http://192.168.29.154:6001/api/v1/chat/generate_soul_report/${userId}`, {
        method: "POST",
        body: form,
      });
      const data = await res.json();
      if (data?.data?.report) {
        setCompletedReports((prev) => [...prev, reportType || ""]);
        setMessages((prev) => [
          ...prev.filter((m) => !m.isThinking),
          { sender: "ai", text: "Your report is ready ✅", aiAvatar: true },
          { sender: "ai", report: data.data.report },
        ]);
        showPostReportOptions();
        setReportGenerated(true);
      }
    } catch (err) {
      console.error("Error generating report:", err);
      setMessages((prev) => [
        ...prev,
        { sender: "ai", text: "Failed to generate report." },
      ]);
    }
  };

  const showPostReportOptions = () => {
    const newSuggestions = [
      { sender: "ai", text: "Explore Current Report", isSuggestion: true },
      { sender: "ai", text: "See More Reports", isSuggestion: true },
      { sender: "ai", text: "Continue to Spiritual Journey", isSuggestion: true },
    ];
    setMessages((prev) => [...prev, ...newSuggestions]);
  };

  const handleNewSuggestionClick = async (choice: string) => {
    if (choice === "Explore Current Report") {
      const userId = localStorage.getItem("user_id") || "0";
      const form = new FormData();
      form.append("user_id", userId);
      form.append("message", "explore");
      if (spiritualSessionId) {
        form.append("session_id", spiritualSessionId);
      }
      try {
        const res = await fetch("http://192.168.29.154:6001/api/v1/chat/spiritual", {
          method: "POST",
          body: form,
        });
        const data = await res.json();
        if (data?.data?.session_id && !spiritualSessionId) {
          setSpiritualSessionId(data.data.session_id);
        }
        setMessages((prev) => [
          ...prev,
          { sender: "user", text: choice, userAvatar: true },
          { sender: "ai", text: data?.message || "Received response", aiAvatar: true },
        ]);
      } catch (err) {
        console.error("Error calling spiritual API:", err);
      }
    }
    if (choice === "See More Reports") {
      setMessages((prev) => [...prev, { sender: "user", text: choice, userAvatar: true }]);
      // Could show remaining reports here if needed
    }
    if (choice === "Continue to Spiritual Journey") {
      setMessages((prev) => [...prev, { sender: "user", text: choice, userAvatar: true }]);
      navigate("/result");
    }
  };

  const handleAudioUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    const file = files[0];
    const audioUrl = URL.createObjectURL(file);
    setMessages((prev) => [
      ...prev,
      { sender: "user", audio: audioUrl, audioBlob: file, duration: 0, userAvatar: true },
    ]);
    // You can add voice analysis logic here if needed
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (micStream) micStream.getTracks().forEach(track => track.stop());
      attachedImages.forEach(url => URL.revokeObjectURL(url));
    };
  }, [micStream]);

  return (
    <div className="d-flex w-100 h-100 min-vh-100 min-vw-100 bg-black text-white overflow-hidden">
      <Stars />
      {/* Sidebar */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
      <div
        className={`${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0 fixed md:relative h-screen z-50 w-64 backdrop-blur-sm transition-transform duration-300 ease-in-out overflow-y-auto`}
        style={{ backgroundColor: '#1E2123' }}
      >
        <div className="p-4 border-b border-gray-700">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold" style={{ color: '#00B8F8' }}>Eternal Reports</h2>
            <button
              className="md:hidden text-gray-400 hover:text-white"
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
                className={`btn d-flex align-items-center gap-2 text-start w-100 px-3 py-2 rounded ${
                  item.id === "vibrational-frequency"
                    ? "btn-info text-white"
                    : "btn-dark text-secondary"
                }`}
                // Optional: Add onClick to navigate or trigger report flow
                // onClick={() => handleSuggestionClick(questions.find(q => reportTypes[q.message] === item.id.replace(/-/g, '_'))?.message || "")}
              >
                {item.icon}
                <span>{item.label}</span>
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-grow-1 d-flex flex-column position-relative">
        <div className="container position-relative z-10 d-flex justify-content-between align-items-center p-4">
          <div className="d-flex align-items-center gap-3">
            <button
              className="md:hidden text-gray-400 hover:text-white"
              onClick={() => setSidebarOpen(true)}
            >
              <Menu size={20} />
            </button>
            <h2 className="h4 fw-bold" style={{ color: '#00B8F8' }}>Eternal AI</h2>
          </div>
          <button
            type="button"
            className="btn d-flex align-items-center gap-2 px-3 py-2 rounded-circle"
            style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.12)", color: "#fff" }}
          >
            <span
              style={{
                width: 36,
                height: 36,
                borderRadius: "50%",
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                fontWeight: 700,
                background: "linear-gradient(90deg, rgb(74, 222, 128), rgb(96, 165, 250))",
                color: "#0B1117",
              }}
            >
              {initials}
            </span>
          </button>
        </div>

        {/* Messages Area */}
        <div className="flex-grow-1 container d-flex flex-column px-3 mb-3 overflow-auto">
          {messages.map((msg, i) => {
            const isUser = msg.sender === "user";
            const isSuggestion = msg.isSuggestion;
            return (
              <div
                key={i}
                className={`d-flex flex-column mb-4 ${isUser ? "align-items-end" : "align-items-start"}`}
              >
                {/* Avatar */}
                {(msg.aiAvatar || msg.userAvatar) && (
                  <div
                    className="mb-1 d-flex align-items-center justify-content-center"
                    style={{
                      width: "36px",
                      height: "36px",
                      borderRadius: "50%",
                      backgroundImage: isUser 
                        ? "linear-gradient(90deg, rgb(0, 198, 255), rgb(0, 114, 255))"
                        : "linear-gradient(45deg, rgb(0, 198, 255), rgb(0, 114, 255))",
                      color: "white",
                      fontSize: "16px",
                      fontWeight: "bold",
                    }}
                  >
                    {msg.aiAvatar ? <span>AI</span> : <span>{initials}</span>}
                  </div>
                )}
                {/* Message Bubble */}
                <div
                  className="px-3 py-2"
                  style={{
                    maxWidth: "80%",
                    minWidth: isSuggestion ? "40%" : "auto",
                    whiteSpace: "pre-wrap",
                    background: isUser
                      ? "linear-gradient(90deg, #00c6ff, #0072ff)"
                      : "#1d1d1d",
                    color: "white",
                    border: "1px solid #4a4a4a",
                    cursor: isSuggestion ? "pointer" : "default",
                    userSelect: "none",
                    display: "flex",
                    alignItems: "center",
                    position: "relative",
                    borderRadius: msg.aiAvatar 
                      ? "0px 10px 10px 10px" 
                      : (msg.userAvatar ? "10px 0px 10px 10px" : "10px"),
                  }}
                  onClick={() => {
                    if (isSuggestion && msg.text) {
                      if (["Explore Current Report", "See More Reports", "Continue to Spiritual Journey"].includes(msg.text)) {
                        handleNewSuggestionClick(msg.text);
                      } else {
                        handleSuggestionClick(msg.text);
                      }
                    }
                  }}
                >
                  {/* Suggestion Icon */}
                  {isSuggestion && msg.icon && (
                    <video
                      autoPlay
                      loop
                      muted
                      playsInline
                      width="30px"
                      style={{ marginRight: "3%", mixBlendMode: "screen" }}
                    >
                      <source src={msg.icon} type="video/webm" />
                    </video>
                  )}
                  {/* Text */}
                  <div>{msg.text}</div>
                  {msg.imageList && msg.imageList.length > 0 && (
                    <div className="d-flex flex-wrap gap-2 mt-2" style={{ maxWidth: "100%" }}>
                      {msg.imageList.map((img, j) => (
                        <img
                          key={j}
                          src={img}
                          alt="attachment"
                          className="rounded"
                          style={{ width: "120px", height: "120px", objectFit: "cover", cursor: "pointer" }}
                          onClick={(e) => {
                            e.stopPropagation();
                            setPreviewImage(img);
                          }}
                        />
                      ))}
                    </div>
                  )}
                  {msg.audio && (
                    <VoiceMessage url={msg.audio} duration={msg.duration ?? 0} />
                  )}
                  {msg.report && (
                    <div className="mt-2">{renderReportDynamic(msg.report)}</div>
                  )}
                  {/* Suggestion Arrow */}
                  {isSuggestion && (
                    <span
                      style={{
                        position: "absolute",
                        right: "8px",
                        backgroundColor: "#00b8f8",
                        color: "white",
                        borderRadius: "50%",
                        padding: "3px 6px",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <i className="bi bi-arrow-right"></i>
                    </span>
                  )}
                </div>
              </div>
            );
          })}
          {isLoadingResponse && (
            <div className="d-flex flex-column align-items-start mb-4">
              <div
                className="mb-1 d-flex align-items-center justify-content-center"
                style={{
                  width: "36px",
                  height: "36px",
                  borderRadius: "50%",
                  backgroundImage: "linear-gradient(45deg, rgb(0, 198, 255), rgb(0, 114, 255))",
                  color: "white",
                  fontSize: "16px",
                  fontWeight: "bold",
                }}
              >
                <span>AI</span>
              </div>
              <div className="px-3 py-2 bg-gray-800 text-white rounded-2xl rounded-tl-md">
                <div className="d-flex align-items-center gap-2">
                  <div className="spinner-border spinner-border-sm" role="status">
                    <span className="visually-hidden">Loading...</span>
                  </div>
                  <span>Thinking...</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {reportGenerated && (
          <div className="d-flex justify-content-center mt-4 mb-3">
            <Button
              variant="primary"
              size="lg"
              className="px-5 py-3 rounded-pill fw-semibold"
              style={{
                backgroundColor: "#00b8f8",
                borderColor: "#00b8f8",
                fontSize: "1.1rem",
                boxShadow: "0 4px 12px rgba(0, 184, 248, 0.3)",
              }}
              onClick={handleGoHome}
            >
              Start your soul journey
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
                        style={{ width: "100%", height: "100%", objectFit: "cover" }}
                      />
                      <Button
                        variant="light"
                        size="sm"
                        className="position-absolute top-0 end-0 rounded-circle p-0"
                        style={{ width: "20px", height: "20px", lineHeight: "1" }}
                        onClick={() => setAttachedImages((prev) => prev.filter((_, i) => i !== idx))}
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
                      as="textarea"
                      rows={1}
                      placeholder="Enter a prompt here"
                      className="bg-transparent text-white border-0 shadow-none flex-grow-1"
                      style={{ resize: "none", overflow: "hidden", minHeight: "40px", maxHeight: "150px" }}
                      ref={textAreaRef}
                      value={inputValue}
                      onChange={(e) => {
                        setInputValue(e.target.value);
                        e.currentTarget.style.height = "40px";
                        e.currentTarget.style.height = e.currentTarget.scrollHeight + "px";
                      }}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && !e.shiftKey) {
                          e.preventDefault();
                          sendMessage();
                        }
                      }}
                    />
                    <div className="d-flex align-items-center ms-2">
                      <label className="border-0 p-2" style={{ color: "#ccc", fontSize: "1.2rem", cursor: "pointer" }}>
                        <ImagePlus size={20} />
                        <input
                          ref={fileInputRef}
                          type="file"
                          accept="image/*"
                          hidden
                          multiple
                          onChange={handleImageUpload}
                        />
                      </label>
                      <button
                        className="border-0 p-2"
                        style={{ color: "#ccc", fontSize: "1.2rem" }}
                        onClick={openCamera}
                      >
                        <Camera size={20} />
                      </button>
                      <label className="border-0 p-2" style={{ color: "#ccc", fontSize: "1.2rem", cursor: "pointer" }}>
                        <Upload size={20} />
                        <input
                          type="file"
                          accept="audio/*,.mp3,.wav,.m4a"
                          hidden
                          onChange={handleAudioUpload}
                        />
                      </label>
                      <button
                        className="border-0 p-2"
                        style={{ color: "#ccc", fontSize: "1.2rem" }}
                        onClick={startRecording}
                      >
                        <Mic size={20} />
                      </button>
                      <Button
                        variant="info"
                        className="rounded-pill px-3 py-2 ms-2"
                        disabled={!inputValue.trim() && attachedImages.length === 0}
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
                          <SendHorizontal size={20} />
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
                      <Check size={16} />
                    </Button>
                    <Button
                      variant="danger"
                      className="ms-2 rounded-circle d-flex align-items-center justify-content-center"
                      style={{ width: 36, height: 36 }}
                      onClick={cancelRecording}
                    >
                      <X size={16} />
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Modals */}
        {previewImage && (
          <div
            className="modal fade show d-block"
            style={{ background: "rgba(0,0,0,0.7)" }}
            onClick={() => setPreviewImage(null)}
          >
            <div className="modal-dialog modal-dialog-centered" onClick={(e) => e.stopPropagation()}>
              <div className="modal-content bg-transparent border-0">
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
            style={{ background: "rgba(0,0,0,0.8)" }}
            onClick={closeCamera}
          >
            <div className="modal-dialog modal-dialog-centered" onClick={(e) => e.stopPropagation()}>
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

export default ErosChatUI;