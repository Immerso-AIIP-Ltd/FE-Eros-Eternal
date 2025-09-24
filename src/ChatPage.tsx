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
import "./header.css";

interface Message {
  sender: "user" | "ai";
  text?: string;
  imageList?: string[];
  audio?: string;
  duration?: number;
  isSuggestion?: boolean;
  report?: any;
  isThinking?: boolean; // Add this line
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
  const [reportGenerated, setReportGenerated] = useState(false); // Track if report is generated
  const [isLoadingResponse, setIsLoadingResponse] = useState(false);
  const [isGeneratingReport, setIsGeneratingReport] = useState(false);

  interface Message {
    sender: "user" | "ai";
    text?: string;
    imageList?: string[];
    audio?: string; // blob URL for audio messages
  }

  const [messages, setMessages] = useState<
    {
      sender: "user" | "ai";
      text?: string;
      imageList?: string[];
      audio?: string;
      duration?: number;
      isSuggestion?: boolean;
      report?: any; // 👈 added
    }[]
  >([]);

  let animationId: number;
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [showCamera, setShowCamera] = useState(false);

  const [previewImage, setPreviewImage] = useState<string | null>(null);

  const [attachedImages, setAttachedImages] = useState<string[]>([]);
  const [micStream, setMicStream] = useState<MediaStream | null>(null);

  // ✅ Fetch welcome message on mount
  useEffect(() => {
    const userId = localStorage.getItem("user_id");
    const fetchWelcome = async () => {
      try {
        const res = await fetch(
          "http://192.168.29.154:8002/api/v1/welcome/welcome/${userId}"
        );
        const data = await res.json();

        if (data?.message) {
          const intro = data.message.message;
          const questions = data.message.questions || [];

          // Build messages array
          const welcomeMsgs = [
            { sender: "ai", text: intro },
            ...questions.map((q: string) => ({
              sender: "ai",
              text: q,
              isSuggestion: true,
            })),
          ];

          setMessages(welcomeMsgs);
        }
      } catch (err) {
        console.error("Welcome fetch error:", err);
        setMessages([
          { sender: "ai", text: "👋 Welcome! I’m your AI assistant." },
        ]);
      }
    };

    fetchWelcome();
  }, []);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      const urls = Array.from(files).map((file) => URL.createObjectURL(file));
      setAttachedImages((prev) => [...prev, ...urls]);
    }
  };

  const sendMessage = async (textArg?: string) => {
    const userId = localStorage.getItem("user_id");
    
    const message = (textArg ?? inputValue ?? "").toString();
    const BASE_URL = "http://192.168.29.154:8002";
    if (!message.trim()) return;

    // Show user bubble
    setMessages((prev) => [...prev, { sender: "user", text: message }]);
    setInputValue("");
    setIsLoadingResponse(true); // Start loading

    // Add thinking message
    setMessages((prev) => [...prev, { sender: "ai", text: "Thinking...", isThinking: true }]);

    if (conversationActive) {
      // Always save the user's answer
      setAnswers((prev) => [...prev, message]);

      try {
        const form = new FormData();
        form.append("user_message", message);

        const res = await fetch(`${BASE_URL}/api/v1/welcome/process_message/${userId}`, {
          method: "POST",
          body: form,
        });

        const data = await res.json();

        // Remove thinking message
        setMessages((prev) => prev.filter(msg => !msg.isThinking));

        if (data?.message) {
          if (data.message.includes("Generating your detailed report")) {
            setIsGeneratingReport(true);
            setMessages((prev) => [...prev, { sender: "ai", text: data.message }]);
            // Call generateReport AFTER storing last answer
            await generateReport([...answers, message]);
          } else {
            setMessages((prev) => [...prev, { sender: "ai", text: data.message }]);
          }
        }
      } catch (err) {
        // Remove thinking message on error
        setMessages((prev) => prev.filter(msg => !msg.isThinking));
        console.error("Process answer error:", err);
        setMessages((prev) => [...prev, { sender: "ai", text: "Sorry, something went wrong. Please try again." }]);
      } finally {
        setIsLoadingResponse(false);
      }
    } else {
      // Normal chat logic if outside the flow
      // Remove thinking message and add response after delay (simulate API call)
      setTimeout(() => {
        setMessages((prev) => prev.filter(msg => !msg.isThinking));
        setMessages((prev) => [...prev, { sender: "ai", text: "I'm here to help! What would you like to know?" }]);
        setIsLoadingResponse(false);
      }, 1000);
    }
  };

  const generateReport = async (finalAnswers?: string[]) => {
    try {
      const BASE_URL = "http://192.168.29.154:8002";
      const userId = localStorage.getItem("user_id") || "0";

      const body = {
        user_id: userId,
        report_type: reportType,
        process_message_report: finalAnswers ?? answers,
      };

      const res = await fetch(`${BASE_URL}/api/v1/welcome/generate_report`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const data = await res.json();

      setMessages((prev) => [
        ...prev,
        { sender: "ai", report: data.report },
      ]);

      setConversationActive(false);
      setReportGenerated(true);
    } catch (err) {
      console.error("Report generation error:", err);
      setMessages((prev) => [...prev, { sender: "ai", text: "Failed to generate report. Please try again." }]);
    } finally {
      setIsGeneratingReport(false);
    }
  };

  // Navigate to result page
  const handleGoHome = () => {
    navigate('/result');
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
          { sender: "user", audio: audioUrl, duration: 0 }, // duration handled later
        ]);

        // extract duration
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

      // timer
      setRecordingTime(0);
      timerRef.current = setInterval(() => {
        setRecordingTime((prev) => prev + 1);
      }, 1000);
    } catch (err) {
      console.error("Microphone error:", err);
    }
  };

  // const startRecording = async () => {
  //   try {
  //     const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
  //     const recorder = new MediaRecorder(stream, {
  //       mimeType: "audio/webm;codecs=opus",
  //     });

  //     const chunks: Blob[] = [];
  //     recorder.ondataavailable = (e) => {
  //       if (e.data.size > 0) chunks.push(e.data);
  //     };

  //     recorder.onstop = () => {
  //       const audioBlob = new Blob(chunks, { type: "audio/webm;codecs=opus" });
  //       const audioUrl = URL.createObjectURL(audioBlob);

  //       const tempAudio = new Audio(audioUrl);
  //       tempAudio.onloadedmetadata = () => {
  //         const duration = Math.floor(tempAudio.duration) || 0;
  //         setMessages((prev) => [
  //           ...prev,
  //           { sender: "user", audio: audioUrl, duration },
  //         ]);
  //       };

  //       // ✅ stop visualization
  //       cancelAnimationFrame(animationId);
  //       if (audioContextRef.current) audioContextRef.current.close();

  //       setIsRecording(false);
  //     };

  //     recorder.start();
  //     setMediaRecorder(recorder);
  //     setIsRecording(true);

  //     // ✅ waveform setup
  //     audioContextRef.current = new (window.AudioContext ||
  //       (window as any).webkitAudioContext)();
  //     analyserRef.current = audioContextRef.current.createAnalyser();
  //     sourceRef.current =
  //       audioContextRef.current.createMediaStreamSource(stream);
  //     sourceRef.current.connect(analyserRef.current);

  //     analyserRef.current.fftSize = 256;
  //     const bufferLength = analyserRef.current.frequencyBinCount;
  //     const dataArray = new Uint8Array(bufferLength);

  //     const canvas = waveformRef.current;
  //     const ctx = canvas?.getContext("2d");

  //     const draw = () => {
  //       if (!ctx || !canvas || !analyserRef.current) return;

  //       analyserRef.current.getByteTimeDomainData(dataArray);

  //       ctx.fillStyle = "black";
  //       ctx.fillRect(0, 0, canvas.width, canvas.height);

  //       ctx.lineWidth = 2;
  //       ctx.strokeStyle = "#00b8f8";
  //       ctx.beginPath();

  //       const sliceWidth = (canvas.width * 1.0) / bufferLength;
  //       let x = 0;

  //       for (let i = 0; i < bufferLength; i++) {
  //         const v = dataArray[i] / 128.0;
  //         const y = (v * canvas.height) / 2;

  //         if (i === 0) ctx.moveTo(x, y);
  //         else ctx.lineTo(x, y);

  //         x += sliceWidth;
  //       }

  //       ctx.lineTo(canvas.width, canvas.height / 2);
  //       ctx.stroke();

  //       animationId = requestAnimationFrame(draw);
  //     };

  //     draw();
  //   } catch (err) {
  //     console.error("Microphone error:", err);
  //   }
  // };

  useEffect(() => {
    console.log("messages:", messages);
  }, [messages]);

  // const stopRecording = () => {
  //   if (mediaRecorder && isRecording) {
  //     mediaRecorder.stop();
  //     setIsRecording(false);

  //     if (timerRef.current) {
  //       clearInterval(timerRef.current);
  //       timerRef.current = null;
  //     }
  //   }
  // };

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

  // ✅ Generate star positions only once on component mount
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

    // Attach to preview and send
    setAttachedImages([imageUrl]);
    setShowCamera(false);

    // stop stream
    const stream = video.srcObject as MediaStream;
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
    }

    // auto-send message
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
  

  const handleSuggestionClick = async (question: string) => {
    const BASE_URL = "http://192.168.29.154:8002";

    const reportTypes: Record<string, string> = {
      "What's my vibe right now?": "vibrational_frequency",
      "What's my aura saying?": "aura_profile",
      "What planet is affecting me?": "star_map",
      "What should I eat for energy today?": "longevity_blueprint",
    };

    const type = reportTypes[question] ?? "vibrational_frequency";
    setReportType(type);
    setAnswers([]);
    setConversationActive(true);

    // Show user bubble
    setMessages((prev) => [...prev, { sender: "user", text: question }]);
    setIsLoadingResponse(true);

    // Add thinking message
    setMessages((prev) => [...prev, { sender: "ai", text: "Thinking...", isThinking: true }]);

    try {
            const userId = localStorage.getItem("user_id") || "0";

      const form = new FormData();
      form.append("user_message", question);

      const res = await fetch(`${BASE_URL}/api/v1/welcome/process_message/${userId}`, {
        method: "POST",
        body: form,
      });

      const data = await res.json();

      // Remove thinking message
      setMessages((prev) => prev.filter(msg => !msg.isThinking));

      if (data?.message) {
        setMessages((prev) => [...prev, { sender: "ai", text: data.message }]);
      }
    } catch (err) {
      // Remove thinking message on error
      setMessages((prev) => prev.filter(msg => !msg.isThinking));
      console.error("Process message error:", err);
      setMessages((prev) => [...prev, { sender: "ai", text: "Sorry, something went wrong. Please try again." }]);
    } finally {
      setIsLoadingResponse(false);
    }
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

  return (
    <div className="d-flex w-100 h-100 min-vh-100 min-vw-100 bg-black text-white overflow-hidden">
      {/* Sidebar */}
      <Stars />

      {/* Main Content */}
      <div className="flex-grow-1 d-flex flex-column position-relative">
        {/* ✅ Starfield Background - Positions now stable */}
        {/* <div className="position-absolute w-100 h-100 overflow-hidden">
          {stars.map((pos, i) => (
            <div
              key={i}
              className="position-absolute bg-white rounded-circle"
              style={{
                width: "4px",
                height: "4px",
                opacity: pos.opacity,
                top: `${pos.y}%`,
                left: `${pos.x}%`,
              }}
            ></div>
          ))}
        </div> */}

        {/* Header */}
        <div className="position-relative z-10 d-flex justify-content-between align-items-center p-4">
          <h2 className="h4 fw-bold eternal-header" style={{color: "#00A2FF",}}> Eternal AI</h2>
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

                  {/* Optional: Small Green Star (if not in image) */}
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
            {messages.length > 0 && (
              <div className="flex-grow-1 container d-flex flex-column px-3 mb-3 overflow-auto">
                {messages.map((msg, i) => {
                  const isUser = msg.sender === "user";
                  const isSuggestion = msg.isSuggestion;

                  return (
                    <div
                      key={i}
                      className={`d-flex mb-2 ${isUser ? "justify-content-end" : "justify-content-start"
                        }`}
                    >
                      <div
                        className={`px-3 py-2 rounded-3`}
                        style={{
                          maxWidth: "70%",
                          whiteSpace: "pre-wrap",
                          background: isUser
                            ? "#00b8f8"
                            : isSuggestion
                              ? "#e9ecef"
                              : "#6c757d",
                          color: isUser
                            ? "white"
                            : isSuggestion
                              ? "black"
                              : "white",
                          cursor: isSuggestion ? "pointer" : "default",
                          userSelect: "none", // prevent text selection blocking click
                        }}
                        onClick={() => {
                          if (isSuggestion) {
                            console.log("Suggestion clicked:", msg.text); // debug
                            handleSuggestionClick(msg.text!);
                          }
                        }}
                      >
                        {/* ✅ Images */}
                        {msg.imageList && msg.imageList.length > 0 && (
                          <div
                            className="d-flex flex-wrap gap-2 mb-2"
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
                                  e.stopPropagation(); // ✅ prevent interfering with bubble click
                                  setPreviewImage(img);
                                }}
                              />
                            ))}
                          </div>
                        )}

                        {/* ✅ Text */}
                        {msg.text && <div>{msg.text}</div>}

                        {msg.report && (
                          <div className="mt-2">
                            {renderReportDynamic(msg.report)}{" "}
                            {/* ✅ our dynamic formatter */}
                          </div>
                        )}

                        {/* ✅ Voice Message */}
                        {msg.audio && (
                          <VoiceMessage
                            url={msg.audio}
                            duration={msg.duration ?? 0}
                          />
                        )}
                      </div>
                    </div>
                  );
                })}

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
                        transition: "all 0.2s ease",
                      }}
                      onClick={handleGoHome}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.transform = "translateY(-2px)";
                        e.currentTarget.style.boxShadow = "0 6px 16px rgba(0, 184, 248, 0.4)";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.transform = "translateY(0)";
                        e.currentTarget.style.boxShadow = "0 4px 12px rgba(0, 184, 248, 0.3)";
                      }}
                    >
                      <i className="bi bi-house-door me-2"></i>
                      Go Home
                    </Button>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Chat Input */}
        <div className="position-relative z-10 p-3">
          <div className="d-flex justify-content-center w-100">
            <div
              className="bg-dark bg-opacity-75 rounded-4 p-2 shadow-sm"
              style={{ width: "100%", maxWidth: "1000px" }}
            >
              {/* ✅ Image Previews Row */}
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

              {/* ✅ Input + Buttons Row */}
              <div className="d-flex align-items-end w-100">
                {!isRecording ? (
                  <>
                    {/* ✨ Normal Chat Input Mode */}
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
                        e.currentTarget.style.height = "40px"; // reset first
                        e.currentTarget.style.height =
                          e.currentTarget.scrollHeight + "px";
                      }}
                      onKeyDown={(e) =>
                        e.key === "Enter" &&
                        !e.shiftKey &&
                        (e.preventDefault(), sendMessage())
                      }
                    />

                    {/* Icons + Send */}
                    <div className="d-flex align-items-center ms-2">
                      {/* <Button
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
                          type="file"
                          accept="image/*"
                          hidden
                          multiple
                          onChange={handleImageUpload}
                        />
                      </Button> */}

                      {/* <Button
                        variant="link"
                        className="border-0 p-2"
                        style={{ color: "#ccc", fontSize: "1.2rem" }}
                        onClick={openCamera}
                      >
                        <i className="bi bi-camera"></i>
                      </Button> */}

                      {/* 🎙️ Mic button */}
                      {/* <Button
                        variant="link"
                        className="border-0 p-2"
                        style={{ color: "#ccc", fontSize: "1.2rem" }}
                        onClick={startRecording}
                      >
                        <i className="bi bi-mic"></i>
                      </Button> */}

                      {/* Send Button */}
                      <Button
                        variant="info"
                        className="rounded-pill px-3 py-2 ms-2"
                        disabled={!inputValue || isLoadingResponse}
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
                  /* ✨ Recording Mode (WhatsApp style) */
                  <div className="d-flex align-items-center bg-dark rounded-3 px-3 py-2 flex-grow-1">
                    <MicVisualizer stream={micStream} height={40} />

                    <span className="ms-3 text-danger fw-bold">
                      {formatTime(recordingTime)}
                    </span>

                    {/* ✅ OK / Cancel buttons styled */}
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

        {/* Footer */}
        <div className="position-relative z-10 px-3 pb-3">
          <div className="d-flex flex-wrap justify-content-center align-items-center text-secondary small">
            <span className="mb-2 mb-md-0">
              © 2025 EROS Universe. All Rights Reserved.
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatPage;
