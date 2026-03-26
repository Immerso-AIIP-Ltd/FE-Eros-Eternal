import React, { useEffect, useRef, useState } from "react";
import {
  Menu,
  X,
  SendHorizontal,
  Mic,
  Camera,
  ImagePlus,
  LogOut,
  SquarePlus,
  CircleFadingPlus,
  User,
  Upload,
  Play,
  Pause,
  Check,
} from "lucide-react";
import { Row, Col, Button, Form } from "react-bootstrap";
import ReactMarkdown from "react-markdown";
import starone from "@/assets/images/star1.png";
import startwo from "@/assets/images/star2.png";
import starthree from "@/assets/images/star3.png";
import starfour from "@/assets/images/star4.png";
import sparkle from "@/assets/images/sparkle.png";
import Stars from "@/components/ui/stars";
import VoiceMessage from "@/VoiceMessage";
import MicVisualizer from "@/MicVisualizer";
import eroslogo from "@/assets/eros-logo.png";
import credits from "@/assets/credits.png";
import { useNavigate, useLocation } from "react-router-dom";
import { baseApiUrl } from "@/config/api";
import { PanelLeft } from "lucide-react";
import { getAndClearPendingAttachments } from "@/lib/pendingChatAttachments";

const AiChat: React.FC = () => {
  const [inputValue, setInputValue] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordedChunksRef = useRef<Blob[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const initialMessageSentRef = useRef(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sessionId, setSessionId] = useState<number | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [showCamera, setShowCamera] = useState(false);
  const [attachedImages, setAttachedImages] = useState<string[]>([]);
  const [attachedFiles, setAttachedFiles] = useState<File[]>([]);
  const [micStream, setMicStream] = useState<MediaStream | null>(null);
  const [attachedVoices, setAttachedVoices] = useState<
    Array<{ url: string; file: File; duration?: number }>
  >([]);
  const [sessions, setSessions] = useState<any[]>([]);
  const [sessionsLoading, setSessionsLoading] = useState(true);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const [tooltip, setTooltip] = useState({ show: false, text: "", x: 0, y: 0 });

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
    voiceData: { url: string; file: File; duration?: number };
    onRemove: () => void;
  }

  const VoicePreview: React.FC<VoicePreviewProps> = ({
    voiceData,
    onRemove,
  }) => {
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
        if (
          actualDuration &&
          !isNaN(actualDuration) &&
          actualDuration < 86400
        ) {
          setDuration(Math.floor(actualDuration));
        } else if (voiceData.duration && voiceData.duration < 86400) {
          setDuration(Math.floor(voiceData.duration));
        } else {
          setDuration(0);
        }
      };
      const onEnded = () => setIsPlaying(false);

      audio.addEventListener("timeupdate", updateTime);
      audio.addEventListener("loadedmetadata", updateDuration);
      audio.addEventListener("ended", onEnded);

      return () => {
        audio.removeEventListener("timeupdate", updateTime);
        audio.removeEventListener("loadedmetadata", updateDuration);
        audio.removeEventListener("ended", onEnded);
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
      if (!secs || isNaN(secs) || secs === 0) return "0:00";

      let totalSeconds = Math.floor(secs);

      const minutes = Math.floor(totalSeconds / 60);
      const seconds = totalSeconds % 60;

      if (minutes < 10) {
        return `${minutes}:${seconds.toString().padStart(2, "0")}`;
      } else {
        return `${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
      }
    };

    return (
      <div className="bg-white rounded-lg p-3 flex items-center gap-3 max-w-xs shadow-md border border-gray-200">
        <audio ref={audioRef} src={voiceData.url} preload="metadata" />

        <button
          onClick={togglePlay}
          className="bg-cyan-500 hover:bg-cyan-600 text-white rounded-full p-2 transition-colors flex-shrink-0"
        >
          {isPlaying ? <Pause size={16} /> : <Play size={16} />}
        </button>

        <div className="flex-1 min-w-0">
          <div className="text-sm text-gray-800 font-medium truncate">
            {voiceData.file.name}
          </div>
          <div className="text-xs text-gray-600">
            {formatTime(currentTime)} / {formatTime(duration)}
          </div>
          <div className="w-full bg-gray-200 rounded-full h-1 mt-1">
            <div
              className="bg-cyan-500 h-1 rounded-full transition-all duration-100"
              style={{
                width: `${duration > 0 ? (currentTime / duration) * 100 : 0}%`,
              }}
            />
          </div>
        </div>

        <button
          onClick={onRemove}
          className="text-gray-500 hover:text-red-500 transition-colors flex-shrink-0 bg-transparent"
        >
          <X size={16} />
        </button>
      </div>
    );
  };

  const formatTextWithBold = (text) => {
    if (!text || typeof text !== "string") return text;

    const parts = text.split(/(\*\*[^*]+\*\*)/g);

    return parts.map((part, index) => {
      if (part.startsWith("**") && part.endsWith("**")) {
        const boldText = part.slice(2, -2);
        return <strong key={index}>{boldText}</strong>;
      }

      const singleAsteriskParts = part.split(/(\*[^*]+\*)/g);

      if (singleAsteriskParts.length === 1) {
        return part;
      }

      return singleAsteriskParts.map((subPart, subIndex) => {
        if (
          subPart.startsWith("*") &&
          subPart.endsWith("*") &&
          !subPart.startsWith("**")
        ) {
          const boldText = subPart.slice(1, -1);
          return <strong key={`${index}-${subIndex}`}>{boldText}</strong>;
        }
        return subPart;
      });
    });
  };

  const [stars] = useState(() =>
    Array.from({ length: 80 }, () => ({
      x: Math.random() * 100,
      y: Math.random() * 100,
      opacity: 0.15 + Math.random() * 0.25,
      size: Math.random() * 1.5 + 0.5,
    })),
  );

  useEffect(() => {
    if (!isInitialized && messages.length === 0) {
      initializeChat();
      fetchSessions();

      const savedMessage = sessionStorage.getItem("initialMessage");
      if (savedMessage) {
        setInputValue(savedMessage);
        sessionStorage.removeItem("initialMessage");
      }

      const pending = getAndClearPendingAttachments();
      if (
        pending.files?.length ||
        pending.imageUrls?.length ||
        pending.voices?.length
      ) {
        if (pending.files?.length) setAttachedFiles(pending.files);
        if (pending.imageUrls?.length) setAttachedImages(pending.imageUrls);
        if (pending.voices?.length) setAttachedVoices(pending.voices);
      }
    }
  }, [isInitialized, messages.length]);

  useEffect(() => {
    if (
      isInitialized &&
      messages.length === 1 &&
      !sessionId &&
      !initialMessageSentRef.current &&
      inputValue
    ) {
      const hasUserMessage = messages.some((m) => m.sender === "user");
      if (!hasUserMessage) {
        initialMessageSentRef.current = true;
        const timer = setTimeout(() => {
          sendMessage();
        }, 800);
        return () => clearTimeout(timer);
      }
    }
  }, [isInitialized, messages.length, inputValue, sessionId]);

  const initializeChat = async () => {
    if (isInitialized) return;
    setIsInitialized(true);
    setMessages([
      {
        sender: "ai",
        text: "🌟  WELCOME TO YOUR SPIRITUAL GUIDE  🌟\n\nI'm here to offer wisdom, guidance, and spiritual reflection.\nAsk me anything about your spiritual journey, meditation, life purpose,\ninner peace, or any other spiritual topic that's on your heart.\n\nType 'help' for commands, or just start chatting!\n\n🧘 Spiritual Guide: Welcome, dear soul. I invite you to share the whispers of your heart. What stirs within you today?",
        centered: true,
      },
    ]);
  };

  const handleNewChat = async () => {
    sessionStorage.removeItem("initialMessage");
    initialMessageSentRef.current = false;
    window.history.replaceState({}, document.title);
    setMessages([]);
    setInputValue("");
    setAttachedImages([]);
    setAttachedFiles([]);
    setAttachedVoices([]);
    setIsLoading(false);
    setSessionId(null);
    setIsInitialized(false);

    initializeChat();
    fetchSessions();
  };

  // const fetchSessions = async () => {
  //   const userId = localStorage.getItem("user_id");
  //   if (!userId) return;

  //   try {
  //     const response = await fetch(
  //       `${baseApiUrl}/api/v1/chat/sessions/?user_id=${userId}`,
  //     );
  //     const data = await response.json();
  //     if (
  //       data.success &&
  //       data.data &&
  //       data.data.sessions &&
  //       Array.isArray(data.data.sessions)
  //     ) {
  //       setSessions(data.data.sessions);
  //     } else {
  //       setSessions([]);
  //     }
  //   } catch (error) {
  //     console.error("Error fetching sessions:", error);
  //     setSessions([]);
  //   }
  // };

  const fetchSessions = async () => {
    const userId = localStorage.getItem("user_id");
    if (!userId) return;

    setSessionsLoading(true);
    try {
      const response = await fetch(
        `${baseApiUrl}/api/v1/chat/sessions/?user_id=${userId}`,
      );
      const data = await response.json();
      if (
        data.success &&
        data.data &&
        data.data.sessions &&
        Array.isArray(data.data.sessions)
      ) {
        setSessions(data.data.sessions);
      } else {
        setSessions([]);
      }
    } catch (error) {
      console.error("Error fetching sessions:", error);
      setSessions([]);
    } finally {
      setSessionsLoading(false);
    }
  };

  const loadConversation = async (sessionId: number | string) => {
    const userId = localStorage.getItem("user_id");
    if (!userId) return;

    try {
      const response = await fetch(
        `${baseApiUrl}/api/v1/chat/conversation/${sessionId}`,
      );
      const data = await response.json();
      if (
        data.success &&
        data.data &&
        data.data.conversation_history &&
        Array.isArray(data.data.conversation_history)
      ) {
        const formattedMessages = data.data.conversation_history.map(
          (msg: any) => ({
            sender: msg.role === "assistant" ? "ai" : "user",
            text: msg.content,
          }),
        );
        setMessages(formattedMessages);
        setSessionId(
          typeof sessionId === "string" ? parseInt(sessionId) : sessionId,
        );
      }
    } catch (error) {
      console.error("Error loading conversation:", error);
    }
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

      setAttachedVoices((prev) => [
        ...prev,
        {
          url: audioUrl,
          file,
          duration:
            duration && !isNaN(duration) ? Math.floor(duration) : undefined,
        },
      ]);
    };

    tempAudio.onerror = () => {
      setAttachedVoices((prev) => [...prev, { url: audioUrl, file }]);
    };

    e.target.value = "";
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
        setAttachedImages((prev) => [...prev, imageUrl]);

        const file = new File([blob], "camera-photo.png", {
          type: "image/png",
        });
        setAttachedFiles((prev) => [...prev, file]);
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
      (videoRef.current.srcObject as MediaStream)
        .getTracks()
        .forEach((t) => t.stop());
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
        const audioBlob = new Blob(recordedChunksRef.current, {
          type: "audio/webm;codecs=opus",
        });
        const audioUrl = URL.createObjectURL(audioBlob);
        const recordedFile = new File(
          [audioBlob],
          `recording_${Date.now()}.webm`,
          { type: "audio/webm" },
        );

        setAttachedVoices((prev) => [
          ...prev,
          {
            url: audioUrl,
            file: recordedFile,
            duration: finalDuration,
          },
        ]);
      };

      mediaRecorderRef.current.stop();
      setIsRecording(false);

      if (timerRef.current) clearInterval(timerRef.current);
      if (micStream) {
        micStream.getTracks().forEach((track) => track.stop());
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
      micStream.getTracks().forEach((track) => track.stop());
      setMicStream(null);
    }
    setIsRecording(false);
    setRecordingTime(0);
  };

  const sendMessage = async () => {
    if (
      !inputValue.trim() &&
      attachedImages.length === 0 &&
      attachedVoices.length === 0
    )
      return;

    const userMessage: Message = {
      sender: "user",
      text: inputValue,
      imageList: attachedImages.length > 0 ? [...attachedImages] : undefined,
      audio: attachedVoices.length > 0 ? attachedVoices[0].url : undefined,
      duration:
        attachedVoices.length > 0 ? attachedVoices[0].duration : undefined,
    };

    setMessages((prev) => [...prev, userMessage]);

    const currentInput = inputValue;
    setInputValue("");
    setAttachedImages([]);
    setAttachedFiles([]);
    setAttachedVoices([]);
    setIsLoading(true);

    try {
      const userId = localStorage.getItem("user_id");
      if (!userId) {
        setMessages((prev) => [
          ...prev,
          { sender: "ai", text: "User ID not found. Please log in." },
        ]);
        setIsLoading(false);
        return;
      }

      // Get report_type from URL query params
      const searchParams = new URLSearchParams(location.search);
      const reportType = searchParams.get("report_type");

      let currentSessionId = sessionId;

      if (!currentSessionId) {
        const initParams: any = {
          user_id: userId,
          message: "start",
        };
        if (reportType) {
          initParams.report_type = reportType;
        }

        const initResponse = await fetch(
          `${baseApiUrl}/api/v1/chat/spiritual/${userId}`,
          {
            method: "POST",
            headers: { "Content-Type": "application/x-www-form-urlencoded" },
            body: new URLSearchParams(initParams),
          },
        );

        const initData = await initResponse.json();
        if (initData.success) {
          currentSessionId = initData.data.session_id;
          setSessionId(currentSessionId);
          fetchSessions();
        } else {
          setMessages((prev) => [
            ...prev,
            { sender: "ai", text: "Failed to initialize chat session." },
          ]);
          setIsLoading(false);
          return;
        }
      }

      const messageParams: any = {
        user_id: userId,
        message: currentInput,
        session_id: currentSessionId?.toString() || "",
      };
      if (reportType) {
        messageParams.report_type = reportType;
      }

      const response = await fetch(
        `${baseApiUrl}/api/v1/chat/spiritual/${userId}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
          body: new URLSearchParams(messageParams),
        },
      );

      const data = await response.json();
      if (data.success) {
        setMessages((prev) => [
          ...prev,
          {
            sender: "ai",
            text: data.data.response,
          },
        ]);
      } else {
        setMessages((prev) => [
          ...prev,
          { sender: "ai", text: "Failed to get response." },
        ]);
      }
    } catch (error) {
      console.error("Error:", error);
      setMessages((prev) => [
        ...prev,
        {
          sender: "ai",
          text: "Sorry, there was an error processing your request. Please try again.",
        },
      ]);
    }
    setIsLoading(false);
  };

  const formatTime = (secs) => {
    if (!secs || isNaN(secs) || secs === 0) return "0:00";

    let totalSeconds = Math.floor(secs);

    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;

    if (minutes < 10) {
      return `${minutes}:${seconds.toString().padStart(2, "0")}`;
    } else {
      return `${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
    }
  };

  const removeAttachedImage = (index: number) => {
    setAttachedImages((prev) => prev.filter((_, i) => i !== index));
    setAttachedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const removeAttachedVoice = (index: number) => {
    setAttachedVoices((prev) => prev.filter((_, i) => i !== index));
  };

  const showTooltip = (text: string, event: React.MouseEvent) => {
    const rect = event.currentTarget.getBoundingClientRect();
    setTooltip({
      show: true,
      text,
      x: rect.right + 10,
      y: rect.top + rect.height / 2,
    });
  };

  const hideTooltip = () => setTooltip({ show: false, text: "", x: 0, y: 0 });

  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
      if (micStream) {
        micStream.getTracks().forEach((track) => track.stop());
      }
      attachedImages.forEach((url) => URL.revokeObjectURL(url));
      attachedVoices.forEach((voice) => URL.revokeObjectURL(voice.url));
    };
  }, [micStream]);

  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop =
        chatContainerRef.current.scrollHeight;
    }
  }, [messages, isLoading]);

  useEffect(() => {
    if (!isLoading && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isLoading, messages]);

  return (
    <div
      className="d-flex w-100 h-100 min-vh-100 min-vw-100 text-gray-800 overflow-hidden"
      style={{
        backgroundImage:
          "linear-gradient(to bottom, #E0F2FE 0%, #F0F9FF 20%, #FFFFFF 40%)",
      }}
    >
      {/* <Stars /> */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {stars.map((star, i) => (
          <div
            key={i}
            className="absolute rounded-full animate-pulse"
            style={{
              width: `${star.size}px`,
              height: `${star.size}px`,
              opacity: star.opacity * 0.4,
              top: `${star.y}%`,
              left: `${star.x}%`,
              background: "#60A5FA",
              animationDelay: `${Math.random() * 3}s`,
              animationDuration: `${2 + Math.random() * 2}s`,
            }}
          />
        ))}
      </div>

      {showCamera && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4 shadow-xl">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-800">
                Take Photo
              </h3>
              <button
                onClick={closeCamera}
                className="text-gray-600 hover:text-gray-800"
              >
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
                className="bg-gray-300 hover:bg-gray-400 text-gray-800 px-6 py-2 rounded-lg transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-30 z-40 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <div
        className={`${sidebarOpen ? "translate-x-0" : "-translate-x-full"} md:translate-x-0 fixed md:relative h-screen z-50 bg-white bg-opacity-90 backdrop-blur-sm transition-all duration-300 ease-in-out shadow-lg overflow-hidden ${sidebarCollapsed ? "w-14" : "w-48 sm:w-56 md:w-50"}`}
        style={{
          marginLeft: "8px",
          marginTop: "8px",
          marginBottom: "8px",
          height: "calc(100vh - 16px)",
          borderRadius: "12px",
        }}
      >
        <style>{`
                    div::-webkit-scrollbar {
                        width: 6px;
                    }
                    div::-webkit-scrollbar-track {
                        background: #F7FAFC;
                    }
                    div::-webkit-scrollbar-thumb {
                        background: #CBD5E0;
                        border-radius: 3px;
                    }
                    div::-webkit-scrollbar-thumb:hover {
                        background: #A0AEC0;
                    }
                `}</style>

        <div
          className={`mx-3 ${!sidebarCollapsed ? "border-b border-gray-300" : ""}`}
          style={{
            paddingTop: "25px",
            paddingBottom: sidebarCollapsed ? "0px" : "16px",
          }}
        >
          <div
            className={`flex items-center ${sidebarCollapsed ? "justify-center" : "justify-between"}`}
          >
            {!sidebarCollapsed && (
              <img
                src={eroslogo}
                alt="EROS Wellness Logo"
                style={{
                  width: "clamp(60px, 7vw, 110px)",
                  height: "auto",
                  objectFit: "contain",
                }}
              />
            )}
            <button
              className="text-gray-500 hover:text-gray-800 bg-transparent outline-none border-0"
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              onMouseEnter={(e) =>
                showTooltip(
                  sidebarCollapsed ? "Open Sidebar" : "Close Sidebar",
                  e,
                )
              }
              onMouseLeave={hideTooltip}
            >
              <PanelLeft size={18} />
            </button>
            {!sidebarCollapsed && (
              <button
                className="md:hidden text-gray-600 hover:text-gray-800 bg-transparent"
                onClick={() => setSidebarOpen(false)}
              >
                <X size={20} />
              </button>
            )}
          </div>
        </div>

        {/* <button
            onClick={handleNewChat}
            className="w-full flex items-center gap-3 px-4 py-3 bg-transparent rounded-lg text-gray-700 hover:bg-gray-100 transition-all duration-200 group"
            style={{
              border: "1px solid #E5E7EB",
              borderRadius: "20px",
              boxShadow: "0 2px 8px rgba(0, 0, 0, 0.08)",
            }}
            disabled={
              messages.length === 0 ||
              (messages.length === 1 && messages[0].centered)
            }
          >
            <SquarePlus
              size={18}
              className="group-hover:scale-110 transition-transform duration-200"
            />
            <span className="text-sm font-medium">New Chat</span>
          </button> */}
        <div
          onMouseEnter={(e) => sidebarCollapsed && showTooltip("New Chat", e)}
          onMouseLeave={hideTooltip}
          className="mt-3"
        >
          <button
            onClick={handleNewChat}
            className={`w-full flex items-center py-2 hover:bg-gray-100 transition-all duration-200 rounded-lg text-gray-700 text-sm mb-2 ${sidebarCollapsed ? "justify-center px-0" : "gap-2 px-3"}`}
            style={{ border: "none", background: "transparent" }}
            disabled={
              messages.length === 0 ||
              (messages.length === 1 && messages[0].centered)
            }
          >
            <CircleFadingPlus
              size={18}
              className="text-gray-500 flex-shrink-0"
            />
            {!sidebarCollapsed && (
              <span style={{ fontSize: "14px", fontWeight: "normal" }}>
                New chat
              </span>
            )}
          </button>
        </div>

        {!sidebarCollapsed && (
          <div className="px-3 py-2 overflow-y-auto">
            <p className="text-xs text-gray-400 font-medium tracking-wider mb-2 px-1">
              History
            </p>
            <div className="space-y-2">
              {sessionsLoading ? (
                <div className="flex items-center gap-2 px-1 py-2">
                  <div className="animate-spin rounded-full h-3 w-3 border-2 border-gray-300 border-t-cyan-500" />
                  <span className="text-xs text-gray-400">
                    Loading history...
                  </span>
                </div>
              ) : Array.isArray(sessions) && sessions.length > 0 ? (
                sessions.map((session) => (
                  <div
                    key={session.id}
                    className="text-xs hover:text-gray-700 hover:bg-gray-100 cursor-pointer py-1.5 px-3 rounded-md transition-all duration-200 truncate"
                    onClick={() => loadConversation(session.id)}
                  >
                    {session.session_name}
                  </div>
                ))
              ) : (
                <div className="text-xs text-gray-500">No recent chats</div>
              )}
            </div>
          </div>
        )}
      </div>

      {tooltip.show && (
        <div
          className="fixed z-50 bg-gray-800 text-white text-xs px-2 py-1 rounded shadow-lg pointer-events-none"
          style={{
            left: tooltip.x,
            top: tooltip.y,
            transform: "translateY(-50%)",
          }}
        >
          {tooltip.text}
        </div>
      )}

      <div className="flex-1 flex flex-col relative z-10 h-screen">
        <div
          className="fixed top-0 left-0 right-0 z-10 flex items-center justify-between px-3 py-2 sm:p-4 backdrop-blur-sm"
          style={{
            marginLeft: sidebarOpen ? "200px" : "0px",
            transition: "margin-left 0.3s ease-in-out",
          }}
        >
          <div className="flex items-center gap-3">
            <button
              className="md:hidden text-gray-600 hover:text-gray-800"
              onClick={() => setSidebarOpen(true)}
            >
              <Menu size={20} />
            </button>
          </div>
          <div className="flex items-center gap-4">
            <div
              className="w-8 h-8 sm:w-10 sm:h-10 bg-white rounded-full flex items-center justify-center text-sm font-semibold cursor-pointer hover:bg-gray-400 transition-colors"
              onClick={() => navigate("/result")}
              style={{ cursor: "pointer" }}
            >
              <LogOut size={18} className="text-gray-700" />
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "0px" }}>
              <img
                src={credits}
                alt="Credits"
                style={{
                  height: "clamp(22px, 3.5vw, 34px)",
                  width: "auto",
                  marginLeft: "-6px",
                  objectFit: "contain",
                }}
              />
            </div>
          </div>
        </div>

        <div className="flex-1 flex flex-col h-full relative overflow-hidden">
          <div
            ref={chatContainerRef}
            className="flex-1 overflow-y-auto px-6 py-4 space-y-4 hide-scrollbar z-20"
            style={{
              maxWidth: "min(65%, 90vw)",
              margin: "0 auto",
              width: "100%",
            }}
          >
            <style>{`
                            .hide-scrollbar::-webkit-scrollbar {
                                display: none;
                            }
                            .hide-scrollbar {
                                scrollbar-width: none;
                                -ms-overflow-style: none;
                            }
                        `}</style>

            {messages.filter((m) => m.sender === "user").length === 0 &&
            messages.length === 1 &&
            messages[0].centered ? (
              <div className="flex-1 flex items-center justify-center h-full min-h-[60vh]">
                <div className="text-center">
                  <div className="mb-4">
                    <div
                      className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4"
                      style={{
                        background:
                          "linear-gradient(135deg, #0061FF 0%, #60EFFF 100%)",
                      }}
                    >
                      <i
                        className="bi bi-stars"
                        style={{
                          color: "#fff",
                          fontSize: "24px",
                          textShadow: "0 0 12px rgba(173, 162, 162, 0.8)",
                        }}
                      ></i>
                    </div>
                  </div>
                  <div className="leading-relaxed">
                    <div className="text-xl font-semibold text-gray-800 mb-3">
                      Hi, I'm EROS Wellness AI
                    </div>
                    <div className="text-sm text-gray-600 mt-1">
                      How can I help you today?
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <>
                {messages.map((message, index) => (
                  <div key={index} className="w-full">
                    {message.sender === "user" ? (
                      <div className="flex flex-col items-end gap-2 mb-4">
                        <div
                          className="w-7 h-7 bg-white rounded-full flex items-center justify-center flex-shrink-0 mt-1"
                          style={{
                            border: "1px solid rgba(169, 174, 179, 0.35)",
                          }}
                        >
                          <User
                            size={18}
                            style={{ color: "#0061FF" }}
                            stroke="none"
                            fill="currentColor"
                          />
                        </div>
                        <div
                          className="text-dark rounded-2xl rounded-tr-md px-3 py-2 sm:px-4 sm:py-3 max-w-[85vw] sm:max-w-xs lg:max-w-md text-sm sm:text-md"
                          style={{
                            backgroundColor: "#188BEF1F",
                            border: "1px solid #188BEF1F",
                          }}
                        >
                          {message.imageList &&
                            message.imageList.length > 0 && (
                              <div className="mb-2">
                                {message.imageList.map((img, j) => (
                                  <img
                                    key={j}
                                    src={img}
                                    alt="attachment"
                                    className="rounded max-w-full h-auto cursor-pointer"
                                    style={{
                                      maxWidth: "200px",
                                      maxHeight: "200px",
                                      objectFit: "cover",
                                    }}
                                    onClick={() => setPreviewImage(img)}
                                  />
                                ))}
                              </div>
                            )}
                          {message.audio && (
                            <VoiceMessage
                              url={message.audio}
                              duration={message.duration ?? 0}
                            />
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
                        <div
                          className="w-7 h-7 bg-cyan-500 rounded-full flex items-center justify-center flex-shrink-0 mt-1"
                          style={{
                            background:
                              "linear-gradient(135deg, #0061FF 0%, #60EFFF 100%)",
                          }}
                        >
                          <i
                            className="bi bi-stars"
                            style={{
                              color: "#fff",
                              fontSize: "16px",
                              textShadow: "0 0 12px rgba(173, 162, 162, 0.8)",
                            }}
                          ></i>
                        </div>
                        <div
                          className="bg-white text-gray-800 rounded-2xl rounded-tl-md px-3 py-2 sm:px-4 sm:py-3 max-w-[85vw] sm:max-w-xs lg:max-w-2xl text-sm sm:text-md"
                          style={{
                            border: "1px solid rgba(0, 0, 0, 0.1)",
                          }}
                        >
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
                {isLoading && (
                  <div className="flex flex-col items-start gap-2 mb-4">
                    <div
                      className="w-7 h-7 bg-cyan-500 rounded-full flex items-center justify-center flex-shrink-0 mt-1"
                      style={{
                        background:
                          "linear-gradient(135deg, #0061FF 0%, #60EFFF 100%)",
                      }}
                    >
                      <i
                        className="bi bi-stars"
                        style={{
                          color: "#fff",
                          fontSize: "16px",
                          textShadow: "0 0 12px rgba(173, 162, 162, 0.8)",
                        }}
                      ></i>
                    </div>
                    <div
                      className="bg-white text-gray-800 rounded-2xl rounded-tl-md px-4 py-2"
                      style={{ border: "1px solid rgba(0, 0, 0, 0.1)" }}
                    >
                      <div className="flex items-center gap-2">
                        <div className="animate-spin rounded-full h-4 w-4 border-2 border-cyan-500 border-t-transparent"></div>
                        <span className="text-sm">Thinking...</span>
                      </div>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>

          <div className="sticky bottom-0 bg-transparent z-20 px-6 pb-4 pt-2">
            <div
              className="bg-white bg-opacity-90 backdrop-blur-sm rounded-2xl p-4 shadow-lg"
              style={{
                maxWidth: "min(65%, 92vw)",
                margin: "0 auto",
                width: "100%",
                border: "1px solid rgba(0, 0, 0, 0.1)",
              }}
            >
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
                            className="rounded object-cover w-full h-full border border-gray-300"
                          />
                          <button
                            className="absolute -top-2 -right-2 bg-danger text-white flex items-center justify-center text-xs hover:bg-red-600 p-1 rounded"
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

              <div className="flex flex-col gap-3">
                {!isRecording ? (
                  <>
                    <div className="flex-1">
                      <input
                        ref={inputRef}
                        type="text"
                        placeholder="Message to Wellness AI"
                        value={inputValue}
                        onChange={(e) => setInputValue(e.target.value)}
                        onKeyPress={(e) => {
                          if (e.key === "Enter" && !isLoading) {
                            sendMessage();
                          }
                        }}
                        className="w-full bg-transparent text-gray-800 placeholder-gray-500 outline-none text-sm py-2 resize-none"
                        disabled={isLoading}
                      />
                    </div>

                    <div className="flex items-center justify-end gap-3">
                      {/* <label className="text-gray-600 hover:text-gray-800 transition-colors p-1 bg-transparent cursor-pointer">
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
                                                className="text-gray-600 hover:text-gray-800 transition-colors p-1 bg-transparent"
                                                onClick={openCamera}
                                            >
                                                <Camera size={20} />
                                            </button>

                                            <label className="text-gray-600 hover:text-gray-800 transition-colors p-1 bg-transparent cursor-pointer">
                                                <Upload size={20} />
                                                <input
                                                    type="file"
                                                    accept="audio/*,.mp3,.wav,.m4a"
                                                    hidden
                                                    onChange={handleAudioUpload}
                                                />
                                            </label>

                                            <button
                                                className="text-gray-600 hover:text-gray-800 transition-colors p-1 bg-transparent"
                                                onClick={startRecording}
                                            >
                                                <Mic size={20} />
                                            </button> */}

                      <div className="border-gray-300 pl-3">
                        <button
                          onClick={sendMessage}
                          disabled={
                            isLoading ||
                            (!inputValue.trim() &&
                              attachedImages.length === 0 &&
                              attachedVoices.length === 0)
                          }
                          className="d-flex align-items-center justify-content-center border-0 rounded-pill px-3 py-2"
                          style={{
                            backgroundColor:
                              isLoading ||
                              (!inputValue.trim() &&
                                attachedImages.length === 0 &&
                                attachedVoices.length === 0)
                                ? "#E5E7EB"
                                : "#00B8F8",
                            color: "white",
                            fontSize: "14px",
                            fontWeight: "500",
                            gap: "6px",
                            minWidth: "70px",
                            cursor:
                              isLoading ||
                              (!inputValue.trim() &&
                                attachedImages.length === 0 &&
                                attachedVoices.length === 0)
                                ? "not-allowed"
                                : "pointer",
                          }}
                        >
                          Send
                          <SendHorizontal size={16} />
                        </button>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="flex items-center bg-gray-200 rounded-xl px-4 py-2 flex-grow-1 w-full">
                    <MicVisualizer stream={micStream} height={40} />
                    <span className="ml-4 text-red-500 font-bold text-lg">
                      {formatTime(recordingTime)}
                    </span>
                    <div className="ml-auto flex items-center gap-2">
                      <button
                        className="bg-green-500 hover:bg-green-600 text-white rounded-full p-2 transition-colors"
                        onClick={stopRecording}
                      >
                        <Check size={16} />
                      </button>
                      <button
                        className="bg-red-500 hover:bg-red-600 text-white rounded-full p-2 transition-colors"
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

          <div className="sticky bottom-0 bg-transparent z-10 px-6 py-2">
            <div
              className="text-center text-xs text-gray-600"
              style={{ maxWidth: "65%", margin: "0 auto", width: "100%" }}
            >
              <div className="flex items-center justify-center text-xs"></div>
            </div>
          </div>
        </div>

        {previewImage && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
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

export default AiChat;
