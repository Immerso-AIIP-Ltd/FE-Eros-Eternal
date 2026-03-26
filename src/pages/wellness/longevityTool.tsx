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
import { useNavigate, useLocation } from "react-router-dom";
import eroslogo from "@/assets/eros-logo.png";
import { baseApiUrl } from "@/config/api";
import credits from "@/assets/credits.png";

const sidebarMenuItems = [
  {
    id: "vibrational-frequency",
    label: "Vibrational Frequency",
    icon: <ImagePlus size={16} />,
    reportType: "vibrational_frequency",
  },
  {
    id: "aura-profile",
    label: "Aura Profile",
    icon: <User size={16} />,
    reportType: "aura_profile",
  },
  {
    id: "star-map",
    label: "Birth Chart",
    icon: <SquarePlus size={16} />,
    reportType: "star_map",
  },
  {
    id: "kosha-map",
    label: "Kosha Map",
    icon: <Camera size={16} />,
    reportType: "kosha_map",
  },
  {
    id: "flame-score",
    label: "Flame Score",
    icon: <Upload size={16} />,
    reportType: "flame_score",
  },
  {
    id: "longevity-blueprint",
    label: "Longevity Blueprint",
    icon: <Mic size={16} />,
    reportType: "longevity_blueprint",
  },
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
  const [attachedVoices, setAttachedVoices] = useState<
    Array<{ url: string; file: File; duration?: number }>
  >([]);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  // FIX: added inputRef for auto-focus
  const inputRef = useRef<HTMLInputElement>(null);
  // FIX: added refs for timer
  const elapsedTimeRef = useRef<number>(0);
  const recordingStartTimeRef = useRef<number>(0);
  const animFrameRef = useRef<number | null>(null);
  const [activeMenuItem, setActiveMenuItem] = useState("vibrational-frequency");

  const [currentReportType, setCurrentReportType] = useState<string>(
    "vibrational_frequency",
  );
  const [assessmentStatus, setAssessmentStatus] =
    useState<string>("not_started");
  const [currentQuestion, setCurrentQuestion] = useState<string>("");
  const [questionNumber, setQuestionNumber] = useState<number>(0);
  const [totalQuestions, setTotalQuestions] = useState<number>(0);
  const [isGeneratingReport, setIsGeneratingReport] = useState(false);
  const [reportData, setReportData] = useState<any>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const audioInputRef = useRef<HTMLInputElement>(null);

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
      // FIX: reset currentTime on ended
      const onEnded = () => {
        setIsPlaying(false);
        setCurrentTime(0);
      };
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
      if (secs === undefined || secs === null || isNaN(secs)) return "0:00";
      let totalSeconds = Math.floor(secs);
      const minutes = Math.floor(totalSeconds / 60);
      const seconds = totalSeconds % 60;
      return `${minutes}:${seconds.toString().padStart(2, "0")}`;
    };

    return (
      <div className="bg-white rounded-lg p-3 flex items-center gap-3 max-w-xs shadow-md border border-gray-200">
        <audio ref={audioRef} src={voiceData.url} preload="metadata" />
        <button
          onClick={togglePlay}
          className="hover:bg-cyan-600 text-white rounded-full p-2 transition-colors flex-shrink-0"
          style={{ backgroundColor: "#00B8DB" }}
        >
          {isPlaying ? <Pause size={16} /> : <Play size={16} />}
        </button>
        <div className="flex-1 min-w-0">
          {/* FIX: show "Voice Recording" instead of filename */}
          <div className="text-sm text-gray-800 font-medium truncate">
            Voice Recording
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
        <span
          onClick={onRemove}
          className="text-gray-500 hover:text-red-500 transition-colors flex-shrink-0 bg-transparent"
          role="button"
        >
          <X size={16} />
        </span>
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
    const initializeAssessment = async () => {
      const pathname = location.pathname;
      let reportType = "vibrational_frequency";

      if (pathname.includes("aura-profile")) reportType = "aura_profile";
      else if (pathname.includes("star-map")) reportType = "star_map";
      else if (pathname.includes("kosha-map")) reportType = "kosha_map";
      else if (pathname.includes("flame-score")) reportType = "flame_score";
      else if (pathname.includes("longevity-blueprint"))
        reportType = "longevity_blueprint";

      setCurrentReportType(reportType);
      setActiveMenuItem(reportType.replace("_", "-"));

      const reportExists = await checkReportExists(reportType);

      if (reportExists) {
        navigate("/view-report", {
          state: {
            reportType: reportType,
            userId: localStorage.getItem("user_id"),
            title: sidebarMenuItems.find(
              (item) => item.reportType === reportType,
            )?.label,
          },
        });
      } else {
        await startSoulReportAssessment(reportType);
      }
    };

    initializeAssessment();
  }, [location.pathname]);

  const startSoulReportAssessment = async (reportType: string) => {
    setIsLoading(true);
    setMessages([]);
    setAssessmentStatus("starting");

    try {
      const userId = localStorage.getItem("user_id");
      if (!userId) {
        setMessages([
          { sender: "ai", text: "User ID not found. Please log in." },
        ]);
        setIsLoading(false);
        return;
      }

      const response = await fetch(
        `${baseApiUrl}/api/v1/chat/select_soul_report/${userId}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
          body: new URLSearchParams({
            report_type: reportType,
          }),
        },
      );

      const data = await response.json();

      if (data.success) {
        setAssessmentStatus(data.data.assessment_status);
        setCurrentQuestion(data.data.current_question);
        setQuestionNumber(data.data.question_number || 0);
        setTotalQuestions(data.data.total_questions || 0);

        setMessages([
          {
            sender: "ai",
            text: data.message || "Let's start your soul report assessment.",
            centered: false,
          },
          {
            sender: "ai",
            text: data.data.current_question,
            centered: false,
          },
        ]);
      } else {
        setMessages([
          {
            sender: "ai",
            text: "Failed to start assessment. Please try again.",
          },
        ]);
      }
    } catch (error) {
      console.error("Error starting assessment:", error);
      setMessages([
        { sender: "ai", text: "Error starting assessment. Please try again." },
      ]);
    }

    setIsLoading(false);
  };

  const sendAssessmentResponse = async () => {
    if (
      !inputValue.trim() &&
      attachedImages.length === 0 &&
      attachedVoices.length === 0 &&
      attachedFiles.length === 0
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

    // ✅ Snapshot before clearing
    const currentFiles = [...attachedFiles];
    const currentImages = [...attachedImages];
    const currentVoices = [...attachedVoices];

    setIsLoading(true);
    setAttachedImages([]);
    setAttachedFiles([]);
    setAttachedVoices([]);

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

      const formData = new FormData();
      formData.append("report_type", currentReportType);
      formData.append("answer", currentInput.trim() ? currentInput : "");

      // ✅ Use snapshots
      if (currentImages.length > 0 && currentFiles.length > 0) {
        formData.append("file", currentFiles[0]);
      } else if (currentVoices.length > 0) {
        formData.append("file", currentVoices[0].file);
      }

      const response = await fetch(
        `${baseApiUrl}/api/v1/chat/answer_question/${userId}`,
        {
          method: "POST",
          body: formData,
        },
      );

      const data = await response.json();

      if (data.success) {
        setAssessmentStatus(data.data.assessment_status);

        if (data.data.assessment_status === "completed") {
          setMessages((prev) => [
            ...prev,
            {
              sender: "ai",
              text:
                data.message ||
                "All questions answered. Generating your report...",
            },
          ]);

          setTimeout(() => generateSoulReport(userId), 1000);
        } else {
          setCurrentQuestion(data.data.current_question);
          setQuestionNumber(data.data.question_number || 0);
          setTotalQuestions(data.data.total_questions || 0);

          setMessages((prev) => [
            ...prev,
            {
              sender: "ai",
              text: data.data.current_question,
            },
          ]);
        }
      } else {
        setMessages((prev) => [
          ...prev,
          {
            sender: "ai",
            text: data?.data?.current_question || "Failed to process response.",
          },
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

    setIsLoading(false);

    if (imageInputRef.current) imageInputRef.current.value = "";
    if (audioInputRef.current) audioInputRef.current.value = "";
  };

  const generateSoulReport = async (userId: string) => {
    setIsGeneratingReport(true);

    try {
      const response = await fetch(
        `${baseApiUrl}/api/v1/chat/generate_soul_report/${userId}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
          body: new URLSearchParams({
            report_type: currentReportType,
          }),
        },
      );

      const data = await response.json();

      if (data.success) {
        setReportData(data.data);
        setAssessmentStatus("report_generated");

        const reportContent = formatReportContent(data.data);
        setMessages((prev) => [
          ...prev,
          {
            sender: "ai",
            text: reportContent,
          },
        ]);
      } else {
        setMessages((prev) => [
          ...prev,
          {
            sender: "ai",
            text: "Failed to generate report. Please try again.",
          },
        ]);
      }
    } catch (error) {
      console.error("Error generating report:", error);
      setMessages((prev) => [
        ...prev,
        {
          sender: "ai",
          text: "Error generating report. Please try again.",
        },
      ]);
    }

    setIsGeneratingReport(false);
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

  const formatReportContent = (reportData: any) => {
    if (!reportData || !reportData.report)
      return "Report generated successfully!";

    return renderReportDynamic(reportData.report);
  };

  const handleNewChat = async () => {
    setMessages([]);
    setInputValue("");
    setAttachedImages([]);
    setAttachedFiles([]);
    setAttachedVoices([]);
    setIsLoading(false);
    setAssessmentStatus("not_started");
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

    if (file.type.startsWith("image/")) {
      const imageUrl = URL.createObjectURL(file);
      setAttachedFiles((prev) => [...prev, file]);
      setAttachedImages((prev) => [...prev, imageUrl]);
    } else if (file.type === "application/pdf") {
      setAttachedFiles((prev) => [...prev, file]);
      setAttachedImages((prev) => [...prev, "pdf"]); // placeholder to track pdf
    } else {
      // audio
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
    }

    e.target.value = "";
  };

  const openCamera = async () => {
    try {
      setShowCamera(true);

      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user" },
        audio: false,
      });

      setTimeout(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play();
        }
      }, 200);
    } catch (error: any) {
      console.error("Camera error:", error);
      alert("Unable to access camera.");
      setShowCamera(false);
    }
  };

  const closeCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach((track) => track.stop());
      videoRef.current.srcObject = null;
    }
    setShowCamera(false);
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

  // FIX: WAV conversion function
  const convertToWav = async (blob: Blob): Promise<Blob> => {
    const audioContext = new AudioContext();
    const arrayBuffer = await blob.arrayBuffer();
    const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);

    const numChannels = audioBuffer.numberOfChannels;
    const sampleRate = audioBuffer.sampleRate;
    const numSamples = audioBuffer.length;
    const bufferLength = 44 + numSamples * numChannels * 2;
    const buffer = new ArrayBuffer(bufferLength);
    const view = new DataView(buffer);

    const writeString = (offset: number, str: string) => {
      for (let i = 0; i < str.length; i++)
        view.setUint8(offset + i, str.charCodeAt(i));
    };

    writeString(0, "RIFF");
    view.setUint32(4, bufferLength - 8, true);
    writeString(8, "WAVE");
    writeString(12, "fmt ");
    view.setUint32(16, 16, true);
    view.setUint16(20, 1, true);
    view.setUint16(22, numChannels, true);
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, sampleRate * numChannels * 2, true);
    view.setUint16(32, numChannels * 2, true);
    view.setUint16(34, 16, true);
    writeString(36, "data");
    view.setUint32(40, numSamples * numChannels * 2, true);

    let offset = 44;
    for (let i = 0; i < numSamples; i++) {
      for (let ch = 0; ch < numChannels; ch++) {
        const sample = Math.max(
          -1,
          Math.min(1, audioBuffer.getChannelData(ch)[i]),
        );
        view.setInt16(
          offset,
          sample < 0 ? sample * 0x8000 : sample * 0x7fff,
          true,
        );
        offset += 2;
      }
    }

    await audioContext.close();
    return new Blob([buffer], { type: "audio/wav" });
  };

  // FIX: startRecording with working timer (setTimeout to avoid cleanup effect killing interval)
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

      const recorder = new MediaRecorder(stream);
      recordedChunksRef.current = [];

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) recordedChunksRef.current.push(e.data);
      };

      recorder.start(100);
      mediaRecorderRef.current = recorder;
      elapsedTimeRef.current = 0;
      recordingStartTimeRef.current = Date.now();

      setMicStream(stream);
      setRecordingTime(0);
      setIsRecording(true);

      // FIX: setTimeout so micStream useEffect cleanup doesn't kill the interval
      setTimeout(() => {
        if (timerRef.current) clearInterval(timerRef.current);
        timerRef.current = setInterval(() => {
          const elapsed = Math.floor(
            (Date.now() - recordingStartTimeRef.current) / 1000,
          );
          elapsedTimeRef.current = elapsed;
          setRecordingTime(elapsed);
        }, 500);
      }, 100);
    } catch (err) {
      console.error("Microphone error:", err);
    }
  };

  // FIX: stopRecording converts to WAV
  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      const finalDuration = elapsedTimeRef.current;

      mediaRecorderRef.current.onstop = async () => {
        const rawBlob = new Blob(recordedChunksRef.current, {
          type: "audio/webm",
        });
        try {
          const wavBlob = await convertToWav(rawBlob);
          const audioUrl = URL.createObjectURL(wavBlob);
          const recordedFile = new File(
            [wavBlob],
            `recording_${Date.now()}.wav`,
            { type: "audio/wav" },
          );
          setAttachedVoices((prev) => [
            ...prev,
            { url: audioUrl, file: recordedFile, duration: finalDuration },
          ]);
        } catch (err) {
          const audioUrl = URL.createObjectURL(rawBlob);
          const recordedFile = new File(
            [rawBlob],
            `recording_${Date.now()}.webm`,
            { type: "audio/webm" },
          );
          setAttachedVoices((prev) => [
            ...prev,
            { url: audioUrl, file: recordedFile, duration: finalDuration },
          ]);
        }
      };

      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (timerRef.current) clearInterval(timerRef.current);
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
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
    if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    if (micStream) {
      micStream.getTracks().forEach((track) => track.stop());
      setMicStream(null);
    }
    setIsRecording(false);
    elapsedTimeRef.current = 0;
    setRecordingTime(0);
  };

  // FIX: formatTime handles 0 correctly
  const formatTime = (secs) => {
    if (secs === undefined || secs === null || isNaN(secs)) return "0:00";
    const totalSeconds = Math.max(0, Math.floor(secs));
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${seconds.toString().padStart(2, "0")}`;
  };

  const removeAttachedImage = (index: number) => {
    setAttachedImages((prev) => prev.filter((_, i) => i !== index));
    setAttachedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const removeAttachedVoice = (index: number) => {
    setAttachedVoices((prev) => prev.filter((_, i) => i !== index));
  };

  const checkReportExists = async (reportType: string) => {
    const userId = localStorage.getItem("user_id");
    if (!userId) return false;

    try {
      const response = await fetch(
        `${baseApiUrl}/api/v1/reports/individual_report/?user_id=${userId}&report_type=${reportType}`,
      );
      return response.ok && response.status === 200;
    } catch (error) {
      console.error("Error checking report:", error);
      return false;
    }
  };

  // FIX: cleanup useEffect with animFrameRef
  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
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
  }, [messages, isLoading, isGeneratingReport]);

  useEffect(() => {
    if (isGeneratingReport || isLoading) {
      setTimeout(() => {
        if (chatContainerRef.current) {
          chatContainerRef.current.scrollTop =
            chatContainerRef.current.scrollHeight;
        }
      }, 100);
    }
  }, [isGeneratingReport, isLoading]);

  // FIX: auto-focus input when not loading
  useEffect(() => {
    if (!isLoading && !isGeneratingReport && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isLoading, isGeneratingReport, messages]);

  return (
    <div
      className="d-flex w-100 h-100 min-vh-100 min-vw-100 text-gray-800 overflow-hidden"
      style={{
        backgroundColor: "red",
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
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-2xl w-[400px] max-w-[95%] p-4 relative">
            <button
              onClick={closeCamera}
              className="absolute top-3 right-3 bg-red-500 hover:bg-red-600 text-white rounded-full p-2"
            >
              <X size={18} />
            </button>
            <h3 className="text-center font-semibold mb-3 text-gray-800">
              Capture Photo
            </h3>
            <div className="rounded-xl overflow-hidden bg-black">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-[300px] object-cover"
              />
            </div>
            <canvas ref={canvasRef} className="hidden" />
            <div className="flex justify-center gap-4 mt-4">
              <button
                onClick={capturePhoto}
                className="bg-cyan-500 hover:bg-cyan-600 text-white px-6 py-2 rounded-full"
              >
                Capture
              </button>
              <button
                onClick={closeCamera}
                className="bg-gray-400 hover:bg-gray-500 text-white px-6 py-2 rounded-full"
              >
                Close
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

      <div className="flex-1 flex flex-col relative z-10 h-screen">
        <div className="fixed top-0 left-0 right-0 z-10 flex items-center justify-between px-3 py-2 sm:p-4 backdrop-blur-sm">
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
              className="w-10 h-10 sm:w-8 sm:h-8 bg-white rounded-full flex items-center justify-center text-sm font-semibold cursor-pointer hover:bg-gray-400 transition-colors"
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
              .hide-scrollbar::-webkit-scrollbar { display: none; }
              .hide-scrollbar { scrollbar-width: none; -ms-overflow-style: none; }
            `}</style>

            {messages.length === 0 && assessmentStatus === "not_started" ? (
              <div className="flex-1 flex items-center justify-center h-full min-h-[60vh]">
                <div className="text-center">
                  <div className="mb-4">
                    <div
                      className="w-16 h-16 bg-cyan-500 rounded-full flex items-center justify-center mx-auto mb-4"
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
                    <div className="text-xl font-semibold text-gray-800">
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
                          {/* {message.imageList &&
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
                            )} */}
                          {message.imageList &&
                            message.imageList.length > 0 && (
                              <div className="mb-2 flex flex-wrap gap-2">
                                {message.imageList.map((img, j) =>
                                  img === "pdf" ? (
                                    // ✅ Render PDF chip instead of broken <img>
                                    <div
                                      key={j}
                                      className="flex items-center gap-2 bg-gray-100 border border-gray-300 rounded-lg px-3 py-2"
                                      style={{
                                        fontSize: "13px",
                                        color: "#555",
                                      }}
                                    >
                                      <span style={{ fontSize: "20px" }}>
                                        📄
                                      </span>
                                      <span>PDF attached</span>
                                    </div>
                                  ) : (
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
                                  ),
                                )}
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
                          style={{ border: "1px solid rgba(0, 0, 0, 0.1)" }}
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
                {(isLoading || isGeneratingReport) && (
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
                      style={{ border: "1px solid #E6E6E6" }}
                    >
                      <div className="flex items-center gap-2">
                        <div className="animate-spin rounded-full h-4 w-4 border-2 border-cyan-500 border-t-transparent"></div>
                        <span className="text-sm">
                          {isGeneratingReport
                            ? "Generating your report..."
                            : "Processing..."}
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>

          {assessmentStatus === "report_generated" && (
            <div className="px-6 py-4 text-center">
              <Button
                variant="primary"
                style={{
                  backgroundColor: "#00B8F8",
                  border: "none",
                  borderRadius: "20px",
                  padding: "8px 20px",
                  color: "#fff",
                  fontWeight: "bold",
                  cursor: "pointer",
                }}
                onClick={() => navigate("/result")}
              >
                Back to Spiritual
              </Button>
            </div>
          )}

          {assessmentStatus !== "report_generated" && (
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
                        {/* {attachedImages.map((img, idx) => (
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
                              className="absolute -top-2 -right-2 bg-danger flex items-center justify-center text-xs hover:bg-red-600 p-1 rounded text-white"
                              onClick={() => removeAttachedImage(idx)}
                            >
                              <X size={12} />
                            </button>
                          </div>
                        ))} */}
                        {attachedImages.map((img, idx) => (
                          <div
                            key={idx}
                            className="relative"
                            style={{ width: "80px", height: "80px" }}
                          >
                            {img === "pdf" ? (
                              <div className="w-full h-full rounded border border-gray-300 bg-gray-100 flex flex-col items-center justify-center text-xs text-gray-600">
                                <span style={{ fontSize: "24px" }}>📄</span>
                                <span>PDF</span>
                              </div>
                            ) : (
                              <img
                                src={img}
                                alt="preview"
                                className="rounded object-cover w-full h-full"
                              />
                            )}
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
                <div className="flex flex-col gap-3">
                  {!isRecording ? (
                    <>
                      <div className="flex-1">
                        {/* FIX: added ref and removed autoFocus in favour of useEffect */}
                        <input
                          ref={inputRef}
                          type="text"
                          placeholder="Message to Wellness AI"
                          value={inputValue}
                          onChange={(e) => setInputValue(e.target.value)}
                          onKeyPress={(e) =>
                            e.key === "Enter" &&
                            !isLoading &&
                            !isGeneratingReport &&
                            sendAssessmentResponse()
                          }
                          className="w-full bg-transparent text-gray-800 placeholder-gray-500 outline-none text-sm py-2 resize-none"
                          disabled={isLoading || isGeneratingReport}
                        />
                      </div>
                      <div className="flex items-center justify-end gap-3">
                        <label className="text-gray-600 hover:text-gray-800 transition-colors p-1 bg-transparent cursor-pointer">
                          <ImagePlus size={20} />
                          <input
                            ref={imageInputRef}
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
                            ref={audioInputRef}
                            type="file"
                            // accept="audio/*,.mp3,.wav,.m4a"
                            accept="audio/*,.mp3,.wav,.m4a,image/*,.jpg,.jpeg,.png,.gif,.webp,application/pdf,.pdf"
                            hidden
                            onChange={handleAudioUpload}
                          />
                        </label>
                        <button
                          className="text-gray-600 hover:text-gray-800 transition-colors p-1 bg-transparent"
                          onClick={startRecording}
                        >
                          <Mic size={20} />
                        </button>
                        <button
                          onClick={sendAssessmentResponse}
                          disabled={
                            isLoading ||
                            isGeneratingReport ||
                            (!inputValue.trim() &&
                              attachedImages.length === 0 &&
                              attachedVoices.length === 0)
                          }
                          className="d-flex align-items-center justify-content-center border-0 rounded-pill px-4 py-2"
                          style={{
                            backgroundColor:
                              isLoading ||
                              isGeneratingReport ||
                              (!inputValue.trim() &&
                                attachedImages.length === 0 &&
                                attachedVoices.length === 0)
                                ? "#E5E7EB"
                                : "#00B8F8",
                            color: "white",
                            fontSize: "14px",
                            fontWeight: "500",
                            gap: "6px",
                            minWidth: "80px",
                            cursor:
                              isLoading ||
                              isGeneratingReport ||
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
                    </>
                  ) : (
                    // FIX: recording bar with working timer display and visible buttons
                    <div
                      className="flex items-center gap-3 w-full"
                      style={{
                        background: "#f1f5f9",
                        borderRadius: "12px",
                        padding: "10px 16px",
                      }}
                    >
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <MicVisualizer stream={micStream} height={36} />
                      </div>
                      <span
                        style={{
                          color: "#ef4444",
                          fontWeight: "700",
                          fontSize: "16px",
                          minWidth: "52px",
                          textAlign: "center",
                          flexShrink: 0,
                          fontVariantNumeric: "tabular-nums",
                        }}
                      >
                        {formatTime(recordingTime)}
                      </span>
                      <button
                        type="button"
                        style={{
                          backgroundColor: "#22c55e",
                          border: "none",
                          borderRadius: "50%",
                          width: "36px",
                          height: "36px",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          cursor: "pointer",
                          flexShrink: 0,
                          padding: 0,
                          color: "white",
                          fontSize: "16px",
                          fontWeight: "bold",
                        }}
                        onClick={stopRecording}
                      >
                        ✓
                      </button>
                      <button
                        type="button"
                        style={{
                          backgroundColor: "#ef4444",
                          border: "none",
                          borderRadius: "50%",
                          width: "36px",
                          height: "36px",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          cursor: "pointer",
                          flexShrink: 0,
                          padding: 0,
                          color: "white",
                          fontSize: "16px",
                          fontWeight: "bold",
                        }}
                        onClick={cancelRecording}
                      >
                        ✕
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

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

export default LongevityTool;
