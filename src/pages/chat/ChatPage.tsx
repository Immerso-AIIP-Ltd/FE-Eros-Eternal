// src/ErosChatUI.tsx
import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Row, Col, Button, Form, OverlayTrigger, Tooltip } from "react-bootstrap";
import starone from "@/assets/images/star1.png";
import startwo from "@/assets/images/star2.png";
import starthree from "@/assets/images/star3.png";
import starfour from "@/assets/images/star4.png";
import sparkle from "@/assets/images/sparkle.png";
import Stars from "@/components/ui/stars";
import VoiceMessage from "@/VoiceMessage";
import MicVisualizer from "@/MicVisualizer";
import Fire from "@/assets/webm/Fire.webm";
import Earth from "@/assets/webm/Earth Globe Looped Icon.webm";
import Food from "@/assets/webm/Food animation.webm";
import Gym from "@/assets/webm/Gym dubble.webm";
import Magic from "@/assets/webm/Magic Crystal Ball.webm";
import Star from "@/assets/webm/Star.webm";

import "@/components/layout/header.css";
import { baseApiUrl } from "@/config/api";

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
  icon?: any;
  audioBlob?: any;
  fileList?: { name: string; size: number; type: string }[];
}

const ChatPage: React.FC = () => {
  const navigate = useNavigate();
  const [activeModel, setActiveModel] = useState<"gpt1" | "gpt2pro">("gpt1");
  const [inputValue, setInputValue] = useState<string>("");
  const [isRecording, setIsRecording] = useState(false);
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(
    null
  );
  const [recordingTime, setRecordingTime] = useState(0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const [conversationActive, setConversationActive] = useState(false);
  const [reportType, setReportType] = useState<string | null>(null);
  const [answers, setAnswers] = useState<string[]>([]);
  const [reportGenerated, setReportGenerated] = useState(false);
  const [isLoadingResponse, setIsLoadingResponse] = useState(false);
  const [isGeneratingReport, setIsGeneratingReport] = useState(false);
  const [attachedFiles, setAttachedFiles] = useState<File[]>([]);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const attachmentInputRef = useRef<HTMLInputElement | null>(null);
  const [completedReports, setCompletedReports] = useState<string[]>([]);
  const textAreaRef = useRef<HTMLTextAreaElement | null>(null);
  const [spiritualSessionId, setSpiritualSessionId] = useState<string | null>(
    null
  );

  const [messages, setMessages] = useState<Message[]>([]);

  let animationId: number;
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [showCamera, setShowCamera] = useState(false);

  const [previewImage, setPreviewImage] = useState<string | null>(null);

  const [attachedImages, setAttachedImages] = useState<string[]>([]);
  const [micStream, setMicStream] = useState<MediaStream | null>(null);
  const [chatMode, setChatMode] = useState<"default" | "spiritual">("default");

  const messagesContainerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (messagesContainerRef.current) {
      messagesContainerRef.current.scrollTop =
        messagesContainerRef.current.scrollHeight;
    }
  }, [messages]);

  const ALL_REPORTS = [
    "vibrational_frequency",
    "aura_profile",
    "star_map",
    "kosha_map",
    "flame_score",
    "longevity_blueprint",
  ];

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

  // Initialize the chat with welcome message and questions
  useEffect(() => {
    const welcomeMessage = `👋 Hey ${localStorage.getItem(
      "username"
    )}!, What do you want from EROS Wellness.`;
    const questionMessages = questions.map((question) => ({
      sender: "ai" as const,
      text: question?.message,
      icon: question?.icon,
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

  const handleFileAttachment = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const filesArr = Array.from(files);
    setAttachedFiles((prev) => [...prev, ...filesArr]);
  };

  const removeAttachedFile = (index: number) => {
    setAttachedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const sendMessage = async () => {
    const userId = localStorage.getItem("user_id");
    const message = (inputValue ?? "").toString();
    const hasText = message.trim().length > 0;
    const hasFiles = attachedFiles.length > 0;

    if (!hasText && !hasFiles) return;

    setMessages((prev) => [
      ...prev,
      {
        sender: "user",
        text: message || undefined,
        imageList: attachedImages.length ? [...attachedImages] : undefined,
        fileList: attachedFiles.length
          ? attachedFiles.map(f => ({ name: f.name, size: f.size, type: f.type }))
          : undefined,
        userAvatar: true,
      },
    ]);

    setInputValue("");
    setAttachedImages([]);
    setAttachedFiles([]);
    if (fileInputRef.current) fileInputRef.current.value = "";
    if (attachmentInputRef.current) attachmentInputRef.current.value = "";

    setIsLoadingResponse(true);
    setMessages((prev) => [
      ...prev,
      { sender: "ai", text: "Thinking...", isThinking: true },
    ]);

    if (textAreaRef.current) {
      textAreaRef.current.style.height = "40px";
    }
    try {
      let url = "";
      const form = new FormData();

      if (chatMode === "spiritual") {
        url = `http://192.168.1.171:6001/aitools/wellness/v2/chat/spiritual/${userId}`;
        form.append("user_id", userId || "0");
        form.append("message", message);
        // if (spiritualSessionId) {
        //   form.append("session_id", spiritualSessionId);
        // }
      } else {
        url = `http://192.168.1.171:6001/aitools/wellness/v2/chat/answer_question/${userId}`;
        form.append("report_type", reportType || "vibrational_frequency");
        form.append("answer", message);
        if (hasFiles) {
          attachedFiles.forEach((f) => form.append("file", f, f.name));
        }
      }

      const res = await fetch(url, { method: "POST", body: form });
      const data = await res.json();

      setMessages((prev) => prev.filter((m) => !m.isThinking));

      if (chatMode === "spiritual") {
        if (data?.data?.session_id && !spiritualSessionId) {
          setSpiritualSessionId(data.data.session_id);
        }
        setMessages((prev) => [
          ...prev,
          {
            sender: "ai",
            text: data?.data?.response || "Got response",
            aiAvatar: true,
          },
        ]);
      } else {
        if (data) {
          if (data?.data?.assessment_status === "completed") {
            setMessages((prev) => [
              ...prev,
              {
                sender: "ai",
                text: "Generating your report...",
                aiAvatar: true,
              },
            ]);
            await generateReport();
          } else {
            setMessages((prev) => [
              ...prev,
              {
                sender: "ai",
                text:
                  data?.data?.current_question ||
                  "Please Select a Report in above suggestions",
                aiAvatar: true,
              },
            ]);
          }
        }
      }
    } catch (err) {
      console.error("Process answer error:", err);
      setMessages((prev) => [
        ...prev,
        {
          sender: "ai",
          text: "Sorry, something went wrong. Please try again.",
        },
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
          { sender: "user", audio: audioUrl, duration: 0 },
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

  useEffect(() => {
    console.log("messages:", messages);
  }, [messages]);

  const stopRecording = () => {
    if (mediaRecorder && isRecording) {
      mediaRecorder.stop();
      setIsRecording(false);
    }
    cancelAnimationFrame(animationId);
  };

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60)
      .toString()
      .padStart(2, "0");
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

    const imageUrl = canvas.toDataURL("image/png");

    setAttachedImages([imageUrl]);
    setShowCamera(false);

    const stream = video.srcObject as MediaStream;
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
    }

    setMessages((prev) => [
      ...prev,
      { sender: "user", text: inputValue || "", imageList: [imageUrl] },
    ]);
    setInputValue("");
    setAttachedImages([]);

    setTimeout(() => {
      setMessages((prev) => [
        ...prev,
        { sender: "ai", text: "📷 Nice photo! AI is ready to chat." },
      ]);
    }, 600);
  };

  const closeCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      (videoRef.current.srcObject as MediaStream)
        .getTracks()
        .forEach((t) => t.stop());
    }
    setShowCamera(false);
  };

  const cancelRecording = () => {
    if (mediaRecorder) {
      mediaRecorder.stop();
    }
    cancelAnimationFrame(animationId);
    setIsRecording(false);
  };

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

  const formatKey = (key: string) => {
    return key.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
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
    const reportTypes: Record<string, string> = {
      "What's my vibe right now?": "vibrational_frequency",
      "What's my aura saying?": "aura_profile",
      "What planet is affecting me?": "star_map",
      "What should I eat for energy today?": "longevity_blueprint",
      "How bright is my inner flame burning?": "flame_score",
      "Which of my energy bodies needs the most love today?": "kosha_map",
    };

    const type = reportTypes[question];
    setReportType(type);
    setAnswers([]);
    setConversationActive(true);
    setReportGenerated(false);
    setMessages((prev) => prev.filter((m) => !m.isSuggestion));

    setMessages((prev) => [
      ...prev,
      { sender: "user", text: question, userAvatar: true },
    ]);

    const userId = localStorage.getItem("user_id") || "0";
    const form = new FormData();
    form.append("report_type", type);

    try {
      const res = await fetch(
        `http://192.168.1.171:6001/aitools/wellness/v2/chat/select_soul_report/${userId}`,
        { method: "POST", body: form }
      );
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
      const res = await fetch(
        `http://192.168.1.171:6001/aitools/wellness/v2/chat/generate_soul_report/${userId}`,
        { method: "POST", body: form }
      );
      const data = await res.json();
      setMessages((prev) => [
        ...prev,
        { sender: "ai", text: "Your soul report is ready!" },
      ]);
      setMessages((prev) => [
        ...prev,
        { sender: "ai", report: data?.data?.report },
      ]);

      if (data?.data?.report) {
        setCompletedReports((prev) => [...prev, reportType || ""]);

        setMessages((prev) => [
          ...prev.filter((m) => !m.isThinking),
          { sender: "ai", text: "Your report is ready ✅" },
        ]);

        showPostReportOptions();
      }

      setReportGenerated(true);
    } catch (err) {
      console.error("Error generating report:", err);
      setMessages((prev) => [
        ...prev,
        { sender: "ai", text: "Failed to generate report." },
      ]);
    }
  };

  const reportTypes: Record<string, string> = {
    "What's my vibe right now?": "vibrational_frequency",
    "What's my aura saying?": "aura_profile",
    "What planet is affecting me?": "star_map",
    "What should I eat for energy today?": "longevity_blueprint",
    "How bright is my inner flame burning?": "flame_score",
    "Which of my energy bodies needs the most love today?": "kosha_map",
  };

  const showRemainingQuestions = () => {
    const remaining = questions.filter(
      (q) => !completedReports.includes(reportTypes[q.message])
    );
    console.log("remaining", remaining);
    const questionMessages = remaining.map((question) => ({
      sender: "ai" as const,
      text: question.message,
      icon: question.icon,
      isSuggestion: true,
    }));

    const introText = {
      sender: "ai" as const,
      text: "Here are the remaining questions for your report:",
      aiAvatar: true,
    };

    setMessages((prev) => [...prev, introText, ...questionMessages]);
  };

  const showPostReportOptions = () => {
    const newSuggestions: Message[] = [
      {
        sender: "ai",
        text: "Explore Current Report",
        isSuggestion: true,
        aiAvatar: true,
      },
      {
        sender: "ai",
        text: "See More Reports",
        isSuggestion: true,
      },
      {
        sender: "ai",
        text: "Continue to Spiritual Journey",
        isSuggestion: true,
      },
    ];
    setMessages((prev) => [...prev, ...newSuggestions]);
  };

  const handleAudioUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const file = files[0];
    const audioUrl = URL.createObjectURL(file);

    setMessages((prev) => [
      ...prev,
      {
        sender: "user",
        audio: audioUrl,
        audioBlob: file,
        duration: 0,
      },
    ]);

    await handleVoiceAnalysis(file, audioUrl);
  };

  const handleNewSuggestionClick = async (choice: string) => {
    if (choice === "Explore Current Report") {
      setChatMode("spiritual");
      const userId = localStorage.getItem("user_id") || "0";
      const form = new FormData();
      form.append("user_id", userId);
      form.append("message", "hi");

      if (spiritualSessionId) {
        form.append("session_id", spiritualSessionId);
      }

      setReportGenerated(false);
      try {
        const res = await fetch(
          `http://192.168.1.171:6001/aitools/wellness/v2/chat/spiritual/${userId}`,
          {
            method: "POST",
            body: form,
          }
        );
        const data = await res.json();

        if (data?.data?.session_id && !spiritualSessionId) {
          setSpiritualSessionId(data.data.session_id);
        }

        setMessages((prev) => [
          ...prev,
          { sender: "user", text: choice, userAvatar: true },
          {
            sender: "ai",
            text: data?.data?.response || "Received response",
            aiAvatar: true,
          },
        ]);
      } catch (err) {
        console.error("Error calling spiritual API:", err);
      }
    }

    if (choice === "See More Reports") {
      setChatMode("default");
      setMessages((prev) => [
        ...prev,
        { sender: "user", text: choice, userAvatar: true },
      ]);
      showRemainingQuestions();
    }

    if (choice === "Continue to Spiritual Journey") {
      setMessages((prev) => [
        ...prev,
        { sender: "user", text: choice, userAvatar: true },
      ]);
      navigate("/result");
    }
  };

  const handleVoiceAnalysis = async (audioBlob: Blob, audioUrl: string) => {
    try {
      const userId = localStorage.getItem("user_id") || "0";
      console.log("=== Voice Analysis Debug Info ===");
      console.log("Audio URL:", audioUrl);
      console.log("Audio blob size:", audioBlob.size, "bytes");
      console.log("Audio blob type:", audioBlob.type);
      console.log("Recording duration:", recordingTime, "seconds");

      const formData = new FormData();
      const fileExtension = audioBlob.type.includes("wav")
        ? ".wav"
        : audioBlob.type.includes("mp3")
          ? ".mp3"
          : ".webm";
      const fileName = `voice_recording${fileExtension}`;

      formData.append("file", audioBlob, fileName);
      formData.append("user_id", userId || "123");
      formData.append("report_type", reportType || "vibrational_frequency");
      formData.append("answer", "");

      console.log("Sending converted audio file:", fileName);
      console.log("File size:", audioBlob.size, "bytes");

      const voiceUrl = `http://192.168.1.171:6001/aitools/wellness/v2/chat/answer_question/${userId}`;
      const response = await fetch(voiceUrl, {
        method: "POST",
        body: formData,
      });

      console.log("Response status:", response.status);
      const voiceData = await response.json();
      console.log("Voice API response:", voiceData);

      if (voiceData.success && voiceData.data) {
        setMessages((prev) => [
          ...prev,
          {
            sender: "ai",
            text: voiceData?.data?.current_question,
            aiAvatar: true,
          },
        ]);
      } else {
        console.error("Voice analysis failed:", voiceData);
        setMessages((prev) => [
          ...prev,
          {
            sender: "ai",
            text:
              voiceData.message ||
              "Voice analysis failed. Please try a longer recording with clear speech.",
          },
        ]);
      }
    } catch (error) {
      console.error("Voice API error:", error);
      setMessages((prev) => [
        ...prev,
        {
          sender: "ai",
          text: "Network error during voice analysis. Please try again.",
        },
      ]);
    }
  };

  const handleMagicButtonClick = () => {
    const magicSuggestions: Message[] = [
      {
        sender: "ai",
        text: "Explore Current Report",
        isSuggestion: true,
        aiAvatar: true,
      },
      {
        sender: "ai",
        text: "See More Reports",
        isSuggestion: true,
      },
      {
        sender: "ai",
        text: "Continue to Spiritual Journey",
        isSuggestion: true,
      },
    ];

    const message: Message[] = [
      {
        sender: "ai",
        text: "Continue to Spiritual Journey",
        isSuggestion: true,
        aiAvatar: true,
      },
    ];

    if (chatMode === "default" && completedReports.length > 0) {
      setMessages((prev) => [
        ...prev.filter((m) => !m.isSuggestion),
        ...message,
      ]);
    } else {
      setMessages((prev) => [
        ...prev.filter((m) => !m.isSuggestion),
        ...magicSuggestions,
      ]);
    }
  };

  return (
    <div className="d-flex w-100 h-100 min-vh-100 min-vw-100 bg-black text-white overflow-hidden">
      <Stars />

      <div className="flex-grow-1 w-100 d-flex flex-column position-relative">
        <div className="container z-10 d-flex justify-content-between align-items-center p-4">
          <h2
            className="h4 fw-bold"
            style={{
              color:
                "linear-gradient(90deg, rgb(74, 222, 128), rgb(96, 165, 250))",
            }}
          >

            EROS Wellness
          </h2>

          <button
            type="button"
            className="btn d-flex align-items-center gap-2 px-3 py-2"
            style={{
              borderRadius: "999px",
              color: "#fff",
            }}
            aria-label={`Open profile for ${displayName}`}
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
                background: "deepskyblue",
                color: "white",

              }}
            >
              {initials}
            </span>
          </button>
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
          <div
            className="container d-flex flex-column px-3"
            style={{
              paddingBottom: "140px",
              paddingTop: "20px",
              overflowY: "auto",
              maxHeight: "calc(100vh - 180px)",
              scrollbarWidth: "none",
              msOverflowStyle: "none",
            }}
            ref={messagesContainerRef}
          >
            <style>
              {`
                div[ref="messagesContainerRef"]::-webkit-scrollbar {
                  display: none;
                }
              `}
            </style>
            {messages.map((msg, i) => {
              const isUser = msg.sender === "user";
              const isSuggestion = msg.isSuggestion;

              return (
                <div
                  key={i}
                  className={`d-flex flex-column mb-4 ${isUser ? "align-items-end" : "align-items-start"
                    }`}
                >
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
                      {msg.aiAvatar ? (
                        <i className="bi bi-robot"></i>
                      ) : (
                        <i className="bi bi-person"></i>
                      )}
                    </div>
                  )}

                  <div
                    className={
                      isSuggestion && msg.icon != null
                        ? "px-3 py-2"
                        : "px-3 py-3"
                    }
                    style={{
                      maxWidth: "80%",
                      minWidth: isSuggestion ? "40%" : "auto",
                      whiteSpace: "pre-wrap",
                      background: isUser
                        ? "linear-gradient(90deg, #00c6ff, #0072ff)"
                        : "linear-gradient(175deg, rgb(0 0 0), rgb(97 134 179 / 30%))",
                      color: "white",
                      border: "1px solid #4a4a4a",
                      cursor: isSuggestion ? "pointer" : "default",
                      userSelect: "none",
                      display: "flex",
                      alignItems: "center",
                      position: "relative",
                      borderRadius: msg.aiAvatar
                        ? "0px 10px 10px 10px"
                        : msg.userAvatar
                          ? "10px 0px 10px 10px"
                          : "10px",
                    }}
                    onClick={() => {
                      if (isSuggestion) {
                        if (
                          msg.text === "Explore Current Report" ||
                          msg.text === "See More Reports" ||
                          msg.text === "Continue to Spiritual Journey"
                        ) {
                          handleNewSuggestionClick(msg.text!);
                        } else {
                          handleSuggestionClick(msg.text!);
                        }
                      }
                    }}
                  >
                    {isSuggestion && msg.icon != null && (
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

                    <div>{msg.text}</div>

                    {msg.fileList && msg.fileList.length > 0 && (
                      <div className="d-flex flex-column gap-2 mt-2" style={{ maxWidth: "100%" }}>
                        {msg.fileList.map((file, j) => (
                          <div
                            key={j}
                            className="d-flex align-items-center gap-2 bg-dark bg-opacity-50 rounded px-3 py-2"
                            style={{ minWidth: "200px" }}
                          >
                            <i className="bi bi-file-earmark-pdf fs-4 text-danger"></i>
                            <div className="flex-grow-1">
                              <div className="text-white" style={{ fontSize: "0.9rem" }}>
                                {file.name}
                              </div>
                              <div className="text-muted" style={{ fontSize: "0.75rem" }}>
                                {(file.size / 1024).toFixed(1)} KB
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {msg.imageList && msg.imageList.length > 0 && (
                      <div
                        className="d-flex flex-wrap gap-2 mt-2"
                        style={{ maxWidth: "100%" }}
                      >
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

                    {msg.audio && (
                      <VoiceMessage
                        url={msg.audio}
                        duration={msg.duration ?? 0}
                      />
                    )}

                    {msg.report && (
                      <div className="mt-2">
                        {renderReportDynamic(msg.report)}
                      </div>
                    )}

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
          </div>
        )}

        {!reportGenerated && (
          <div className="position-fixed bottom-0 start-0 end-0 z-10 p-3">
            <div className="d-flex justify-content-center w-100">
              <OverlayTrigger
                key={"top"}
                placement={"top"}
                overlay={
                  <Tooltip id={`tooltip-${"top"}`}>
                    Quick Actions
                  </Tooltip>
                }
              >
                <Button
                  variant="link"
                  className="border-0 p-0 me-2 d-flex align-items-center justify-content-center"
                  style={{
                    width: "40px",
                    height: "40px",
                    borderRadius: "50%",
                    backgroundImage:
                      "linear-gradient(90deg, rgb(0, 198, 255), rgb(0, 114, 255))",
                    color: "white",
                    fontSize: "1.2rem",
                    position: "relative",
                    top: "5px",
                  }}
                  onClick={handleMagicButtonClick}
                  data-tooltip="true"
                >
                  <i className="bi bi-stars"></i>
                </Button>
              </OverlayTrigger>

              <div
                className="bg-dark bg-opacity-75 rounded-4 p-2 shadow-sm"
                style={{ width: "100%", maxWidth: "1000px" }}
              >
                {/* File attachments preview */}
                {attachedFiles.length > 0 && (
                  <div className="d-flex flex-wrap gap-2 mb-2 p-2 bg-dark bg-opacity-50 rounded">
                    {attachedFiles.map((file, idx) => (
                      <div
                        key={idx}
                        className="d-flex align-items-center gap-2 bg-secondary bg-opacity-25 rounded px-2 py-1"
                        style={{ fontSize: "0.85rem" }}
                      >
                        <i className="bi bi-file-earmark"></i>
                        <span className="text-truncate" style={{ maxWidth: "150px" }}>
                          {file.name}
                        </span>
                        <span className="text-muted">
                          ({(file.size / 1024).toFixed(1)} KB)
                        </span>
                        <Button
                          variant="link"
                          size="sm"
                          className="p-0 text-danger border-0"
                          style={{ fontSize: "1rem" }}
                          onClick={() => removeAttachedFile(idx)}
                        >
                          <i className="bi bi-x-circle"></i>
                        </Button>
                      </div>
                    ))}
                  </div>
                )}

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
                          style={{
                            width: "20px",
                            height: "20px",
                            lineHeight: "1",
                          }}
                          onClick={() =>
                            setAttachedImages((prev) =>
                              prev.filter((_, i) => i !== idx)
                            )
                          }
                        >
                          ✕
                        </Button>
                      </div>
                    ))}
                  </div>
                )}

                <div className="bottom-0 d-flex align-items-end w-100">
                  {!isRecording ? (
                    <>
                      <Form.Control
                        id="chat-input-textarea"
                        as="textarea"
                        rows={1}
                        placeholder="Enter a prompt here"
                        className="bg-transparent text-white border-0 shadow-none flex-grow-1 white-placeholder"
                        style={{
                          resize: "none",
                          overflow: "hidden",
                          minHeight: "40px",
                          maxHeight: "150px",
                        }}
                        ref={textAreaRef}
                        value={inputValue}
                        onChange={(e) => {
                          setInputValue(e.target.value);
                          e.currentTarget.style.height = "40px";
                          e.currentTarget.style.height =
                            e.currentTarget.scrollHeight + "px";
                        }}
                        onKeyDown={(e) =>
                          e.key === "Enter" &&
                          !e.shiftKey &&
                          (e.preventDefault(), sendMessage())
                        }
                      />

                      <div className="d-flex align-items-center ms-2">
                        {chatMode !== "spiritual" && (
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
                            <i className="bi bi-image"></i>
                            <input
                              ref={fileInputRef}
                              type="file"
                              accept="image/*"
                              hidden
                              multiple
                              onChange={handleImageUpload}
                            />
                          </Button>
                        )}

                        {chatMode !== "spiritual" && (
                          <Button
                            variant="link"
                            className="border-0 p-2"
                            style={{ color: "#ccc", fontSize: "1.2rem" }}
                            onClick={openCamera}
                          >
                            <i className="bi bi-camera"></i>
                          </Button>
                        )}

                        {chatMode !== "spiritual" && (
                          <Button
                            variant="link"
                            className="border-0 p-2"
                            style={{ color: "#ccc", fontSize: "1.2rem" }}
                            onClick={startRecording}
                          >
                            <i className="bi bi-mic"></i>
                          </Button>
                        )}

                        {chatMode !== "spiritual" && (
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
                            <i className="bi bi-paperclip"></i>
                            <input
                              ref={attachmentInputRef}
                              type="file"
                              accept="*/*"
                              hidden
                              multiple
                              onChange={handleFileAttachment}
                            />
                          </Button>
                        )}

                        <Button
                          variant="info"
                          className="rounded-pill px-3 py-2 ms-2"
                          disabled={
                            !inputValue.trim() &&
                            attachedImages.length === 0 &&
                            attachedFiles.length === 0
                          }
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
                            <div
                              className="spinner-border spinner-border-sm"
                              role="status"
                            >
                              <span className="visually-hidden">
                                Loading...
                              </span>
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

                      <span className="ms-3 text-danger fw-bold">
                        {formatTime(recordingTime)}
                      </span>

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
            {/* <div className="position-relative z-10 px-3 pb-3">
              <div className="d-flex flex-wrap justify-content-center align-items-center text-secondary small">
                <span className="mb-2 mb-md-0">
                  © 2025 EROS Universe. All Rights Reserved.
                </span>
              </div>
            </div> */}
          </div>
        )}

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
                    style={{
                      maxWidth: "100%",
                      maxHeight: "80vh",
                      borderRadius: "8px",
                    }}
                  />
                </div>
                <div className="modal-footer border-0 d-flex justify-content-center">
                  <Button variant="light" onClick={() => setPreviewImage(null)}>
                    Close
                  </Button>
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
                  <video
                    ref={videoRef}
                    style={{ width: "100%", borderRadius: "8px" }}
                  />
                  <canvas ref={canvasRef} style={{ display: "none" }} />
                </div>
                <div className="modal-footer border-0 d-flex justify-content-between">
                  <Button variant="secondary" onClick={closeCamera}>
                    Cancel
                  </Button>
                  <Button variant="info" onClick={capturePhoto}>
                    Capture
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ChatPage;