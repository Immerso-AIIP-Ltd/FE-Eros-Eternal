import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import StarmapIcon from "@/assets/result-images/brightness_5.png";
import VibrationalIcon from "@/assets/result-images/add_reaction.png";
import VitaScanIcon from "@/assets/result-images/clinical_notes.png";
import FlameScoreIcon from "@/assets/result-images/mode_heat.png";
import AuraProfileIcon from "@/assets/result-images/background_replace.png";
import KoshaMapIcon from "@/assets/result-images/map_search.png";
import LongevityIcon from "@/assets/result-images/ecg_heart.png";
import { Paperclip, Mic, Send, Bell, Sparkles } from "lucide-react";
import credits from "@/assets/credits.png";
import erosLogo from "@/assets/LogoEros.png";
import ErosLogo from "../../assets/LogoEros.png";

// Report background images
import vibrationalBg from "@/assets/reports/vibrational.jpg";
import birthChartBg from "@/assets/reports/birthMap.png";
import flameScoreBg from "@/assets/reports/flame.png";
import auraBg from "@/assets/reports/aura.png";
import koshaBg from "@/assets/reports/kosha.png";
import longevityBg from "@/assets/reports/longevity.png";
import { eternalUserIdHeaders, wellnessApiUrl } from "@/config/api";
import {
  setPendingAttachments,
  type PendingVoice,
} from "@/lib/pendingChatAttachments";
import {
  FACE_REPORT_STORAGE_KEY,
  hasVitaScanReportCached,
  LATEST_HEALTH_SCAN_KEY,
} from "@/lib/vitaScanCache";
import { hasWellnessIndividualReport } from "@/lib/wellnessReportPayload";
import { getWellnessStoredUserId } from "@/lib/wellnessUserId";

interface CardData {
  id: number;
  icon: string;
  title: string;
  buttonText: string;
  reportType?: string;
  route?: string;
  backgroundImage?: string;
}

const chatTabs = ["Analyze", "Guide", "Recommend", "Health", "Astro", "Report"];

type HeaderLayoutDensity = "hero" | "compact";

export type HeaderProps = {
  layoutDensity?: HeaderLayoutDensity;
};

export default function Header({ layoutDensity = "hero" }: HeaderProps) {
  const navigate = useNavigate();
  const [hoveredCard, setHoveredCard] = useState<number | null>(null);
  const [reportStatuses, setReportStatuses] = useState<Record<string, boolean>>(
    {},
  );
  const [loadingStatuses, setLoadingStatuses] = useState(true);
  const [chatInput, setChatInput] = useState("");
  const [attachedFiles, setAttachedFiles] = useState<
    Array<{ file: File; objectUrl?: string }>
  >([]);
  const [attachedVoices, setAttachedVoices] = useState<PendingVoice[]>([]);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordedChunksRef = useRef<Blob[]>([]);
  const recordingStartTimeRef = useRef<number>(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const micStreamRef = useRef<MediaStream | null>(null);

  const handleAttachClick = () => fileInputRef.current?.click();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files?.length) return;
    const newItems: Array<{ file: File; objectUrl?: string }> = [];
    for (const f of Array.from(files)) {
      if (f.type.startsWith("image/")) {
        newItems.push({ file: f, objectUrl: URL.createObjectURL(f) });
      } else {
        newItems.push({ file: f });
      }
    }
    setAttachedFiles((prev) => [...prev, ...newItems]);
    e.target.value = "";
  };

  const removeAttachedFile = (index: number) => {
    setAttachedFiles((prev) => {
      const item = prev[index];
      if (item?.objectUrl) URL.revokeObjectURL(item.objectUrl);
      return prev.filter((_, i) => i !== index);
    });
  };

  const removeAttachedVoice = (index: number) => {
    setAttachedVoices((prev) => {
      const item = prev[index];
      if (item?.url) URL.revokeObjectURL(item.url);
      return prev.filter((_, i) => i !== index);
    });
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      micStreamRef.current = stream;
      const recorder = new MediaRecorder(stream, {
        mimeType: MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
          ? "audio/webm;codecs=opus"
          : "audio/webm",
      });
      recordedChunksRef.current = [];
      recorder.ondataavailable = (ev) => {
        if (ev.data.size > 0) recordedChunksRef.current.push(ev.data);
      };
      recorder.start();
      mediaRecorderRef.current = recorder;
      recordingStartTimeRef.current = Date.now();
      setRecordingTime(0);
      setIsRecording(true);
      timerRef.current = setInterval(() => {
        setRecordingTime(
          Math.floor((Date.now() - recordingStartTimeRef.current) / 1000),
        );
      }, 500);
    } catch (err) {
      console.error("Microphone error:", err);
    }
  };

  const stopRecording = () => {
    if (!mediaRecorderRef.current || !isRecording) return;
    const start = recordingStartTimeRef.current;
    mediaRecorderRef.current.onstop = () => {
      const blob = new Blob(recordedChunksRef.current, {
        type: mediaRecorderRef.current?.mimeType || "audio/webm",
      });
      const url = URL.createObjectURL(blob);
      const file = new File(
        [blob],
        `recording_${Date.now()}.webm`,
        { type: blob.type },
      );
      const duration = Math.floor((Date.now() - start) / 1000);
      setAttachedVoices((prev) => [...prev, { url, file, duration }]);
    };
    mediaRecorderRef.current.stop();
    mediaRecorderRef.current = null;
    if (micStreamRef.current) {
      micStreamRef.current.getTracks().forEach((t) => t.stop());
      micStreamRef.current = null;
    }
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = null;
    setIsRecording(false);
    setRecordingTime(0);
  };

  const cancelRecording = () => {
    if (mediaRecorderRef.current) mediaRecorderRef.current.stop();
    mediaRecorderRef.current = null;
    if (micStreamRef.current) {
      micStreamRef.current.getTracks().forEach((t) => t.stop());
      micStreamRef.current = null;
    }
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = null;
    setIsRecording(false);
    setRecordingTime(0);
  };

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${s.toString().padStart(2, "0")}`;
  };

  const handleSendToChat = () => {
    const hasText = chatInput.trim().length > 0;
    const hasAttachments =
      attachedFiles.length > 0 || attachedVoices.length > 0;
    if (!hasText && !hasAttachments) return;

    if (hasText) {
      sessionStorage.setItem("initialMessage", chatInput.trim());
    }
    if (hasAttachments) {
      setPendingAttachments({
        files: attachedFiles.map((a) => a.file),
        imageUrls: attachedFiles
          .map((a) => a.objectUrl)
          .filter((u): u is string => !!u),
        voices: attachedVoices,
      });
    }
    setChatInput("");
    attachedFiles.forEach((a) => a.objectUrl && URL.revokeObjectURL(a.objectUrl));
    setAttachedFiles([]);
    attachedVoices.forEach((v) => v.url && URL.revokeObjectURL(v.url));
    setAttachedVoices([]);
    navigate("/ai-chat");
  };
  const [activeTab, setActiveTab] = useState("Reports");
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  const userId = getWellnessStoredUserId();
  const reportsApiUrl = wellnessApiUrl("/reports/individual_report");

  const ReportsIcon = () => (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M3 3h18v18H3zM9 9h6M9 12h6M9 15h4" />
    </svg>
  );

  const HealthIcon = () => (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
    </svg>
  );

  const AstrologyIcon = () => (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z" />
    </svg>
  );

  const TarotsIcon = () => (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect x="4" y="2" width="16" height="20" rx="2" />
      <path d="M12 6v4M10 8h4" />
      <path d="M9 14h6M9 17h4" />
    </svg>
  );

  const FaceReadIcon = () => (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="12" cy="12" r="10" />
      <path d="M8 14s1.5 2 4 2 4-2 4-2" />
      <line x1="9" y1="9" x2="9.01" y2="9" />
      <line x1="15" y1="9" x2="15.01" y2="9" />
    </svg>
  );

  const AttachIcon = () => (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="#555"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M21.44 11.05l-9.19 9.19a6 6 0 01-8.49-8.49l9.19-9.19a4 4 0 015.66 5.66l-9.2 9.19a2 2 0 01-2.83-2.83l8.49-8.48" />
    </svg>
  );

  const VoiceIcon = () => (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="#555"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M12 1a3 3 0 00-3 3v8a3 3 0 006 0V4a3 3 0 00-3-3z" />
      <path d="M19 10v2a7 7 0 01-14 0v-2M12 19v4M8 23h8" />
    </svg>
  );

  const SendIcon = () => (
    <svg
      width="12"
      height="12"
      viewBox="0 0 24 24"
      fill="none "
      stroke="#FFFFFF"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <line x1="22" y1="2" x2="11" y2="13" />
      <polygon points="22 2 15 22 11 13 2 9 22 2" />
    </svg>
  );

  const TimerIcon = () => (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="#fe842b"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 3" />
      <path d="M9 2h6" />
    </svg>
  );

  // const ErosLogo = () => (
  //   <svg width="120" height="40" viewBox="0 0 120 40" fill="none">
  //     <text x="0" y="22" fontFamily="Georgia, serif" fontSize="22" fontWeight="700" letterSpacing="1">
  //       <tspan fill="#9dcae6">E</tspan>
  //       <tspan fill="#c9a0c4">R</tspan>
  //       <tspan fill="#e0b7c0">O</tspan>
  //       <tspan fill="#a097c7">S</tspan>
  //     </text>
  //     <text x="1" y="35" fontFamily="'Poppins', sans-serif" fontSize="9" fontWeight="300" fill="#aaa" letterSpacing="3">wellness</text>
  //   </svg>
  // );

  // ── Data ──────────────────────────────────────────────────────────────────────

  const chatTabs = [
    { label: "Reports", Icon: ReportsIcon },
    { label: "Health", Icon: HealthIcon },
    { label: "Astrology", Icon: AstrologyIcon },
    { label: "Tarots", Icon: TarotsIcon },
    { label: "Face Read", Icon: FaceReadIcon },
  ];

  // ── Component ─────────────────────────────────────────────────────────────────

  const cardsData: CardData[] = [
    {
      id: 1,
      icon: VitaScanIcon,
      title: "Bio Care",
      buttonText: "Generate",
      reportType: "vita_scan",
      route: "/facescan",
      // route: "/face-report",
    },
    {
      id: 2,
      icon: VibrationalIcon,
      title: "Vibrational frequency",
      buttonText: "Generate",
      reportType: "vibrational_frequency",
      route: "/vibrational-frequency",
      backgroundImage: vibrationalBg,
    },
    {
      id: 3,
      icon: AuraProfileIcon,
      title: "Aura Profile",
      buttonText: "Generate",
      reportType: "aura_profile",
      route: "/aura-profile",
      backgroundImage: auraBg,
    },
    {
      id: 4,
      icon: StarmapIcon,
      title: "Star Map",
      buttonText: "Generate",
      reportType: "star_map",
      route: "/star-map",
      backgroundImage: birthChartBg,
    },
    {
      id: 5,
      icon: FlameScoreIcon,
      title: "Flame Score",
      buttonText: "Generate",
      reportType: "flame_score",
      route: "/flame-score",
      backgroundImage: flameScoreBg,
    },
    {
      id: 6,
      icon: KoshaMapIcon,
      title: "Kosha Map",
      buttonText: "Generate",
      reportType: "kosha_map",
      route: "/kosha-map",
      backgroundImage: koshaBg,
    },
    {
      id: 7,
      icon: LongevityIcon,
      title: "Longevity Blueprint",
      buttonText: "Generate",
      reportType: "longevity_blueprint",
      route: "/longevity-blueprint",
      backgroundImage: longevityBg,
    },
  ];

  useEffect(() => {
    const fetchReportStatuses = async () => {
      setLoadingStatuses(true);
      const statuses: Record<string, boolean> = {};

      try {
        statuses["vita_scan"] = hasVitaScanReportCached();

        // Check other reports from API only if userId exists
        if (userId) {
          const reportChecks = cardsData
            .filter(
              (card) => card.reportType && card.reportType !== "vita_scan",
            )
            .map(async (card) => {
              try {
                const response = await fetch(
                  `${reportsApiUrl}?report_type=${card.reportType}`,
                  { headers: eternalUserIdHeaders(userId) },
                );
                const data = await response.json();
                const hasReport = hasWellnessIndividualReport(data);
                statuses[card.reportType!] = hasReport;
                return { reportType: card.reportType!, hasReport };
              } catch (error) {
                console.error(`Error checking ${card.reportType}:`, error);
                statuses[card.reportType!] = false;
                return { reportType: card.reportType!, hasReport: false };
              }
            });

          await Promise.all(reportChecks);
        }

        setReportStatuses(statuses);
      } catch (error) {
        console.error("Error checking report statuses:", error);
      } finally {
        setLoadingStatuses(false);
      }
    };

    fetchReportStatuses();

    // Listen for storage changes (e.g., when vita_scan is completed)
    const handleStorageChange = (e: StorageEvent) => {
      if (
        e.key === FACE_REPORT_STORAGE_KEY ||
        e.key === LATEST_HEALTH_SCAN_KEY ||
        e.key === null
      ) {
        fetchReportStatuses();
      }
    };

    // Listen for custom event when navigating back from report page
    const handleVitaScanUpdate = () => {
      fetchReportStatuses();
    };

    window.addEventListener("storage", handleStorageChange);
    window.addEventListener("vitaScanUpdated", handleVitaScanUpdate);

    return () => {
      window.removeEventListener("storage", handleStorageChange);
      window.removeEventListener("vitaScanUpdated", handleVitaScanUpdate);
    };
  }, [userId]);

  const getButtonText = (card: CardData): string => {
    if (!card.reportType || loadingStatuses) return card.buttonText;
    const hasReport = reportStatuses[card.reportType];
    if (hasReport === undefined) return card.buttonText;
    return hasReport ? "View report" : "Generate";
  };

  const handleCardClick = (card: CardData) => {
    if (card.reportType === "vita_scan") {
      // Special handling for vita_scan
      const hasReport = reportStatuses["vita_scan"];
      if (hasReport) {
        // Navigate to face-report page to view existing report
        navigate("/face-report");
      } else {
        // Navigate to facescan page to generate new report
        navigate("/facescan");
      }
    } else if (card.reportType && userId) {
      // Handle other report types
      const hasReport = reportStatuses[card.reportType];
      if (hasReport) {
        const qs = new URLSearchParams({
          report_type: card.reportType,
          user_id: String(userId),
        });
        navigate(`/view-report?${qs.toString()}`, {
          state: { reportType: card.reportType, userId, title: card.title },
        });
      } else if (card.route) {
        navigate(card.route);
      }
    } else {
      // Fallback: navigate to route if available
      if (card.route) navigate(card.route);
    }
  };

  const handleRasiClick = () => {
    navigate("/rasi-chart");
  };

  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (!element) return;

    const nav = document.querySelector(".eros-nav") as HTMLElement | null;
    const navHeight = nav?.getBoundingClientRect().height ?? 0;
    const computedStyle = window.getComputedStyle(element);
    const paddingTop = Number.parseFloat(computedStyle.paddingTop || "0") || 0;
    const y =
      element.getBoundingClientRect().top +
      window.scrollY -
      navHeight -
      0 +
      paddingTop;
    window.scrollTo({ top: Math.max(0, y), behavior: "smooth" });
    setMobileNavOpen(false);
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700&family=Geist:wght@400;500;600;700&display=swap');

        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        .eros-root {
          width: 100%;
          background: #f0f8ff;
          font-family: 'Poppins', sans-serif;
          overflow-x: hidden;
          position: relative;
          box-sizing: border-box;
          min-height: 100vh;
        }

        /* Desktop only: relaxed root height so content flows naturally */
        @media (min-width: 1024px) {
          .eros-root { min-height: auto; }
        }

        /* ── NAVBAR ── */
        .eros-nav {
          width: 100%;
          height: var(--eros-nav-h, 70px);
          background: #ffffff;
          position: sticky;
          top: 0;
          z-index: 1000;
          box-shadow: 0 4px 25px 0 rgba(0,0,0,0.07);
          box-sizing: border-box;
        }
        .eros-nav-container {
          width: 100%;
          height: 100%;
          margin: 0 auto;
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0 clamp(16px, 5vw, 80px);
          box-sizing: border-box;
        }
        .eros-nav-links {
          display: flex;
          gap: 32px;
          align-items: center;
        }
        .eros-nav-link {
          font-size: 15px;
          color: #6b7589;
          font-weight: 400;
          cursor: pointer;
          text-decoration: none;
          transition: color 0.15s;
        }
        .eros-nav-link:hover { color: #0a0a0a; }
        .eros-nav-right { display: flex; align-items: center; gap: 16px; }
        .eros-nav-toggle {
          display: none;
          width: 42px;
          height: 42px;
          border-radius: 10px;
          border: 1px solid rgba(0,0,0,0.08);
          background: rgba(255,255,255,0.9);
          cursor: pointer;
          align-items: center;
          justify-content: center;
        }

        .eros-mobile-panel {
          display: none;
          position: absolute;
          top: 100%;
          left: 0;
          right: 0;
          background: rgba(255,255,255,0.98);
          border-bottom: 1px solid rgba(0,0,0,0.06);
          box-shadow: 0 12px 24px rgba(0,0,0,0.08);
          padding: 12px 0;
        }
        .eros-mobile-panel.open { display: block; }
        .eros-mobile-links {
          display: flex;
          flex-direction: column;
          gap: 4px;
          padding: 0 clamp(16px, 5vw, 80px);
        }
        .eros-mobile-link {
          padding: 10px 10px;
          border-radius: 10px;
          font-size: 14px;
          color: #1f2937;
          cursor: pointer;
          user-select: none;
        }
        .eros-mobile-link:hover { background: rgba(157,202,230,0.22); }
        .eros-rasi-btn {
          background: #9dcae6;
          border: none;
          border-radius: 8px;
          padding: 0 22px;
          height: 46px;
          font-size: 15px;
          font-weight: 500;
          color: #fff;
          cursor: pointer;
          font-family: 'Poppins', sans-serif;
          display: flex;
          align-items: center;
          gap: 8px;
          transition: opacity 0.18s, transform 0.18s;
          letter-spacing: 0.1px;
        }
        .eros-rasi-btn:hover { opacity: 0.88; transform: translateY(-1px); }
        .eros-rasi-btn svg { flex-shrink: 0; }

        /* ── BODY ─ */
        .eros-body {
          position: relative;
          z-index: 1;
          width: 100%;
          padding: clamp(64px, 10vh, 100px) clamp(24px, 5vw, 80px) clamp(48px, 6vh, 72px);
          box-sizing: border-box;
          flex: 1;
          min-height: calc(100vh - var(--eros-nav-h, 70px));
          display: flex;
          align-items: center;
          justify-content: center;
        }
        @media (min-width: 1024px) {
          .eros-body {
            min-height: auto;
            height: auto;
          }
        }
        .eros-inner {
          width: 100%;
          max-width: 900px;
          margin: 0 auto;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 0;
          gap: 0;
          max-height: calc(100vh - var(--eros-nav-h, 70px) - 120px);
          min-height: 0;
        }

        /* ── AI ICON CIRCLE ── */
        .eros-ai-icon {
          width: 62px;
          height: 62px;
          border-radius: 50%;
          background: #ffffff;
          box-shadow: 0 0 0 1px rgba(157,202,230,0.3), 0 4px 20px rgba(157,202,230,0.4);
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 0;
          flex-shrink: 0;
        }

        /* ── TITLE BLOCK ── */
        .eros-title-block {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 24px;
          margin-bottom: 0;
        }
        .eros-title {
          font-family: 'Geist', 'Poppins', sans-serif;
          font-weight: 600;
          font-size: clamp(28px, 3.2vw, 40px);
          letter-spacing: -1.5px;
          line-height: 1.2;
          text-align: center;
          max-width: 600px;
          margin: 0;
        }
        .eros-title-line {
          display: block;
        }
        .eros-title-line1 {
          white-space: nowrap;
        }
        .eros-title-grad {
          background: linear-gradient(135deg, #9dcae6 0%, #e0b7c0 40%, #d29cb9 65%, #a097c7 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }
        .eros-title-dark {
          color: #0a0a0a;
          -webkit-text-fill-color: #0a0a0a;
        }
        .eros-subtitle {
          font-size: clamp(13px, 1.15vw, 15px);
          font-weight: 400;
          color: #475569;
          opacity: 0.7;
          text-align: center;
          line-height: 1.65;
          max-width: 560px;
          margin: 0;
        }

        /* ── CHAT SECTION ── */
        .eros-chat-section {
          width: 100%;
          max-width: min(640px, 100%);
          display: flex;
          flex-direction: column;
          gap: 14px;
          align-items: stretch;
          margin-top: clamp(60px, 8vh, 100px);
        }

        /* Laptop/tablet: centered in viewport */
        @media (min-width: 768px) and (max-width: 1439px) {
          .eros-body {
            min-height: calc(100vh - var(--eros-nav-h, 70px));
            display: flex;
            align-items: center;
            padding-top: clamp(48px, 8vh, 80px);
            padding-bottom: clamp(48px, 8vh, 80px);
          }
          .eros-chat-section { margin-top: clamp(56px, 7vh, 88px); }
        }

        /* ── TABS ── */
        .eros-tabs-wrap {
          position: relative;
          width: 100%;
        }
        .eros-tabs {
          display: flex;
          gap: 40px;
          align-items: center;
          flex-wrap: nowrap;
          overflow-x: auto;
          padding-bottom: 2px;
          scrollbar-width: none;
        }
        .eros-tabs::-webkit-scrollbar { display: none; }
        .eros-tab {
          display: flex;
          align-items: center;
          gap: 6px;
          height: 38px;
          padding: 7px 18px;
          width: 124px;
          justify-content: center;
          border: 1px solid rgba(0,0,0,0.1);
          border-radius: 100px;
          background: rgba(255,255,255,0.6);
          cursor: pointer;
          font-family: 'Poppins', sans-serif;
          font-size: 13.5px;
          font-weight: 400;
          color: #1e0e06;
          opacity: 0.75;
          white-space: nowrap;
          transition: background 0.16s, opacity 0.16s, box-shadow 0.16s, transform 0.16s;
          flex-shrink: 0;
          backdrop-filter: blur(8px);
        }
        .eros-tab:hover {
          background: rgba(255,255,255,0.9);
          opacity: 1;
          transform: translateY(-1px);
          box-shadow: 0 2px 10px rgba(157,202,230,0.25);
        }
        .eros-tab.active {
          background: rgba(255,255,255,0.95);
          opacity: 1;
          box-shadow: 0 2px 10px rgba(157,202,230,0.3);
          border-color: rgba(157,202,230,0.4);
        }
        .eros-tab-fade {
          position: absolute;
          right: 0; top: 0;
          width: 80px; height: 38px;
          background: linear-gradient(to left, #f0f8ff, transparent);
          pointer-events: none;
        }

        /* ── CHAT OUTER ── */
        .eros-chat-outer {
          width: 100%;
          border-radius: 22px;
          background: rgba(157,202,230,0.72);
          border: 1px solid rgba(157,202,230,0.55);
          backdrop-filter: blur(10px);
          -webkit-backdrop-filter: blur(24px);
          box-shadow:
            inset 0 0 0 1px rgba(255,255,255,0.6),
            0 8px 32px rgba(157,202,230,0.28),
            0 2px 8px rgba(0,0,0,0.04);
          overflow: hidden;
          position: relative;
        }
        .eros-chat-outer::before {
          content: '';
          position: absolute;
          inset: 0;
          background: linear-gradient(135deg, rgba(255,255,255,0.18) 0%, rgba(255,255,255,0) 62%);
          pointer-events: none;
          z-index: 0;
          border-radius: 22px;
        }
        .eros-chat-inner-wrap {
          position: relative;
          z-index: 1;
          padding: 12px 12px 12px;
          background: transparent;
        }

        /* ── FREE TRIAL ROW ── */
        .eros-trial-row {
          display: flex;
          align-items: center;
          gap: 7px;
          padding: 0 6px;
          margin-bottom: 8px;
        }
        .eros-trial-text {
          font-size: 13px;
          font-weight: 400;
          color: #1a1a1a;
          letter-spacing: -0.1px;
          line-height: 1.6;
        }

        /* ── CHAT INPUT CARD ── */
        .eros-chat-card {
          position: relative;
          width: 100%;
          background: rgba(255,255,255,0.98);
          border: 1px solid rgba(15, 23, 42, 0.10);
          border-radius: 16px;
          min-height: 96px;
          display: flex;
          flex-direction: column;
          justify-content: flex-end;
          margin-top: 0;
          box-shadow: 0 6px 18px rgba(15,23,42,0.06);
        }
        .eros-chat-ta {
          width: 100%;
          background: transparent;
          border: none;
          outline: none;
          font-family: 'Poppins', sans-serif;
          font-size: 13.5px;
          font-weight: 400;
          color: #222;
          resize: none;
          line-height: 1.6;
          min-height: 46px;
          max-height: 84px;
          padding: 12px 14px 6px;
          letter-spacing: -0.1px;
        }
        .eros-chat-ta::placeholder { color: #aaa; }

        .eros-chat-card .hidden { position: absolute; opacity: 0; width: 0; height: 0; pointer-events: none; }
        .eros-chat-attachments {
          display: flex; flex-wrap: wrap; gap: 6px; padding: 8px 12px 4px;
        }
        .eros-chat-attachment-tag {
          display: inline-flex; align-items: center; gap: 4px;
          padding: 2px 8px; background: rgba(157,202,230,0.25);
          border-radius: 12px; font-size: 11px; color: #444;
        }
        .eros-chat-attachment-remove {
          background: none; border: none; cursor: pointer; padding: 0 2px;
          font-size: 14px; line-height: 1; color: #888;
        }
        .eros-chat-attachment-remove:hover { color: #c00; }
        .eros-chat-recording {
          display: flex; align-items: center; gap: 8px; padding: 6px 12px;
          background: rgba(255,100,100,0.12); border-radius: 10px; margin: 6px 10px 2px;
          font-size: 12px; color: #c33;
        }
        .eros-chat-recording-dot {
          width: 8px; height: 8px; background: #c33; border-radius: 50%;
          animation: eros-pulse 1s ease-in-out infinite;
        }
        @keyframes eros-pulse { 0%,100%{opacity:1} 50%{opacity:0.4} }
        .eros-record-stop { color: #0a6; }
        .eros-record-cancel { color: #888; }

        .eros-logo {
  width: 120px;   /* adjust based on your design */
  height: auto;
  object-fit: contain;
}

        /* ── CHAT ACTIONS ── */
        .eros-chat-actions {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 8px 10px 10px;
        }
        .eros-chat-left { display: flex; align-items: center; gap: 8px; }
        .eros-chat-right { display: flex; align-items: center; gap: 8px; margin-left: auto; }
        .eros-action-btn {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 0 12px;
          border: 1px solid rgba(15, 23, 42, 0.10);
          border-radius: 24px;
          background: rgba(255,255,255,0.70);
          cursor: pointer;
          font-family: 'Poppins', sans-serif;
          font-size: 12.5px;
          font-weight: 400;
          color: #555;
          transition: background 0.15s;
          height: 32px;
          white-space: nowrap;
        }
        .eros-action-btn:hover { background: rgba(157,202,230,0.18); }
        .eros-action-btn:disabled { opacity: 0.5; cursor: not-allowed; }
        // .eros-send-btn {
        //     display: flex;
        //   align-items: center;
        //   gap: 6px;
        //   padding: 6px 14px;
        //   border: 1px solid rgba(0,0,0,0.1);
        //   border-radius: 24px;
        //   background: transparent;
        //   cursor: pointer;
        //   font-family: 'Poppins', sans-serif;
        //   font-size: 12.5px;
        //   font-weight: 400;
        //   color: #555;
        //   transition: background 0.15s;
        //   height: 30px;
        //   white-space: nowrap;
        //   background:"#9dcae6"
        // }

        .eros-send-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 0 16px; /* Pill shape */

  /* Background and Border */
  background-color: #9dcae6; 
  border: none;
  border-radius: 100px; /* Ensures a perfect pill shape */

  /* Text and Icon Styling */
  color: #ffffff; 
  font-family: 'Poppins', sans-serif;
  font-size: 13px;
  font-weight: 500;

  /* Sizing */
  height: 32px;
  min-width: 88px;
  cursor: pointer;
  white-space: nowrap;

  /* Smooth interaction */
  transition: opacity 0.2s ease, transform 0.1s ease;
 
}

.eros-send-btn:hover {
  opacity: 0.9;
}

.eros-send-btn:active {
  transform: scale(0.98);
}
        .eros-send-btn:hover { transform: scale(1.08); opacity: 0.92; }

        /* ── RESPONSIVE ── */
        @media (max-width: 1100px) {
          .eros-nav-container { padding-inline: 40px; }
          .eros-body { padding: clamp(48px, 8vh, 80px) 40px clamp(40px, 6vh, 64px); }
        }
        @media (max-width: 900px) {
          .eros-nav-container { padding-inline: 24px; }
          .eros-nav-links { display: none; }
          .eros-nav-toggle { display: inline-flex; }
          .eros-body { padding: clamp(40px, 6vh, 64px) 20px clamp(32px, 5vh, 56px); }
          .eros-title { font-size: clamp(24px, 4vw, 32px); }
          .eros-chat-section { margin-top: clamp(40px, 6vh, 72px); }
        }
        @media (max-width: 600px) {
          .eros-nav { height: 68px; }
          :root { --eros-nav-h: 68px; }
          .eros-body { padding: clamp(32px, 5vh, 56px) 16px clamp(24px, 4vh, 40px); }
          .eros-title { font-size: 24px; letter-spacing: -0.8px; }
          .eros-title-block { gap: 16px; }
          .eros-chat-section { margin-top: clamp(32px, 5vh, 56px); }
        }
        @media (max-width: 380px) {
          .eros-title-line1 { white-space: normal; }
        }

        /* Short-height laptops: reduce vertical density */
        @media (max-height: 820px) and (min-width: 901px) {
          .eros-body { padding-top: clamp(40px, 6vh, 64px); padding-bottom: clamp(32px, 5vh, 48px); }
          .eros-title { font-size: clamp(32px, 3vw, 40px); }
          .eros-title-block { gap: 18px; }
          .eros-subtitle { font-size: 14px; }
          .eros-chat-section { margin-top: clamp(40px, 6vh, 64px); }
          .eros-chat-card { min-height: 88px; }
          .eros-chat-ta { min-height: 44px; max-height: 64px; }
        }

        /* Very short heights: compress a bit more to avoid overflow */
        @media (max-height: 740px) and (min-width: 900px) {
          .eros-title { font-size: 48px; }
          .eros-subtitle { font-size: 14px; }
          .eros-tabs { gap: 18px; }
          .eros-tab { height: 34px; padding: 6px 14px; font-size: 13px; width: 116px; }
          .eros-chat-card { min-height: 80px; margin-top: 8px; }
          .eros-chat-ta { min-height: 40px; max-height: 58px; padding: 10px 14px 4px; }
          .eros-chat-actions { padding: 4px 10px 10px; }
        }

        /* Large desktops: scale up spacing */
        @media (min-width: 1440px) {
          .eros-nav-container { padding-inline: clamp(48px, 5vw, 80px); }
          .eros-body { padding: clamp(80px, 10vh, 120px) clamp(48px, 5vw, 80px) clamp(64px, 8vh, 96px); }
          .eros-title { font-size: clamp(38px, 2.8vw, 48px); max-width: 800px; }
          .eros-title-block { gap: 28px; }
          .eros-subtitle { font-size: 17px; max-width: 680px; }
          .eros-chat-section { margin-top: clamp(72px, 9vh, 120px); max-width: min(600px, 100%); gap: 18px; }
          .eros-tabs { gap: 24px; }
          .eros-tab { height: 40px; padding: 8px 20px; font-size: 14px; min-width: 120px; }
          .eros-chat-card { min-height: 104px; }
          .eros-chat-ta { min-height: 52px; max-height: 88px; font-size: 15px; }
        }

        @media (min-width: 1680px) {
          .eros-body { padding-inline: 80px; }
          .eros-title { font-size: clamp(42px, 2.5vw, 52px); }
          .eros-subtitle { font-size: 18px; }
        }

        /* Compact: long scroll pages (e.g. /wellness/result) — no full-viewport hero, tight vertical rhythm */
        .eros-root.eros-header--compact {
          min-height: auto;
        }
        .eros-header--compact .eros-body {
          min-height: 0;
          align-items: flex-start;
          justify-content: flex-start;
          padding: 24px clamp(20px, 4vw, 64px) 28px;
        }
        .eros-header--compact .eros-inner {
          justify-content: flex-start;
        }
        .eros-header--compact .eros-title-block {
          gap: 14px;
        }
        .eros-header--compact .eros-chat-section {
          margin-top: 20px;
        }
        @media (min-width: 768px) and (max-width: 1439px) {
          .eros-header--compact .eros-body {
            min-height: 0;
            align-items: flex-start;
            padding-top: 20px;
            padding-bottom: 24px;
          }
          .eros-header--compact .eros-chat-section {
            margin-top: 18px;
          }
        }
        @media (min-width: 1440px) {
          .eros-header--compact .eros-body {
            padding: 28px clamp(32px, 5vw, 72px) 32px;
          }
          .eros-header--compact .eros-title-block {
            gap: 18px;
          }
          .eros-header--compact .eros-chat-section {
            margin-top: 22px;
          }
          .eros-header--compact .eros-title {
            font-size: clamp(32px, 2.5vw, 44px);
          }
          .eros-header--compact .eros-subtitle {
            font-size: clamp(14px, 1.1vw, 16px);
          }
        }
      `}</style>

      <div
        className={`eros-root${layoutDensity === "compact" ? " eros-header--compact" : ""}`}
      >
        {/* ── NAVBAR ── */}
        <nav className="eros-nav">
          <div className="eros-nav-container">
            <img
              src={ErosLogo}
              alt="Eros Wellness Logo"
              className="eros-logo"
            />

            <div className="eros-nav-links">
              {[
                // { label: "Header", id: "header" },
                { label: "Bio Care", id: "vita-scan" },
                { label: "Reports", id: "reports" },
                { label: "Discover Luck", id: "lucky" },
                { label: "Explore", id: "explore" },
                { label: "About", id: "footer" },
              ].map((link) => (
                <span
                  key={link.label}
                  className="eros-nav-link"
                  onClick={() => scrollToSection(link.id)}
                >
                  {link.label}
                </span>
              ))}
            </div>

            <div className="eros-nav-right">
              <button
                type="button"
                className="eros-nav-toggle"
                aria-label={mobileNavOpen ? "Close menu" : "Open menu"}
                onClick={() => setMobileNavOpen((v) => !v)}
              >
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="#111827"
                  strokeWidth="2"
                  strokeLinecap="round"
                >
                  {mobileNavOpen ? (
                    <>
                      <path d="M18 6L6 18" />
                      <path d="M6 6l12 12" />
                    </>
                  ) : (
                    <>
                      <path d="M4 7h16" />
                      <path d="M4 12h16" />
                      <path d="M4 17h16" />
                    </>
                  )}
                </svg>
              </button>
              <button
                className="eros-rasi-btn"
                onClick={() => navigate("/rasi-chart")}
              >
                Rasi Chart
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="white"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <line x1="7" y1="17" x2="17" y2="7" />
                  <polyline points="7 7 17 7 17 17" />
                </svg>
              </button>
            </div>
          </div>

          <div className={`eros-mobile-panel${mobileNavOpen ? " open" : ""}`}>
            <div className="eros-mobile-links">
              {[
                { label: "Header", id: "header" },
                { label: "Bio Care", id: "vita-scan" },
                { label: "Reports", id: "reports" },
                { label: "Lucky Section", id: "lucky" },
                { label: "Explore Sections", id: "explore" },
                { label: "About", id: "footer" },
              ].map((link) => (
                <div
                  key={link.label}
                  className="eros-mobile-link"
                  role="button"
                  tabIndex={0}
                  onClick={() => scrollToSection(link.id)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ")
                      scrollToSection(link.id);
                  }}
                >
                  {link.label}
                </div>
              ))}
            </div>
          </div>
        </nav>

        {/* ── BODY ── */}
        <div className="eros-body">
          <div className="eros-inner">
            {/* AI Icon Circle */}
            {/* <div className="eros-ai-icon">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
                <defs>
                  <linearGradient id="aiGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#9dcae6"/>
                    <stop offset="50%" stopColor="#d29cb9"/>
                    <stop offset="100%" stopColor="#a097c7"/>
                  </linearGradient>
                </defs>
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z" fill="url(#aiGrad)" opacity="0.15"/>
                <path d="M8 12h8M12 8v8" stroke="url(#aiGrad)" strokeWidth="2" strokeLinecap="round"/>
                <circle cx="12" cy="12" r="3" stroke="url(#aiGrad)" strokeWidth="1.5" fill="none"/>
              </svg>
            </div> */}

            {/* Title + Subtitle */}
            <div className="eros-title-block">
              <h1 className="eros-title">
                <span className="eros-title-line eros-title-line1">
                  <span className="eros-title-grad">EROS Wellness</span>
                  <span className="eros-title-dark"> – AI-driven</span>
                </span>
                <span className="eros-title-line eros-title-dark">
                  holistic growth.
                </span>
              </h1>
              <p className="eros-subtitle">
                Your personal AI spiritual companion — illuminating your path
                through astrology, energy readings, and ancient wisdom tailored
                uniquely for you.
              </p>
            </div>

            {/* ── CHAT SECTION ── */}
            <div className="eros-chat-section">
              {/* Tabs */}
              <div className="eros-tabs-wrap">
                <div className="eros-tabs">
                  {chatTabs.map((tab) => (
                    <button
                      key={tab.label}
                      className={`eros-tab${activeTab === tab.label ? " active" : ""}`}
                      onClick={() => setActiveTab(tab.label)}
                    >
                      <tab.Icon />
                      {tab.label}
                    </button>
                  ))}
                </div>
                <div className="eros-tab-fade" />
              </div>

              {/* Chat Outer */}
              <div className="eros-chat-outer">
                <div className="eros-chat-inner-wrap">
                  {/* Free Trial Row */}
                  <div className="eros-trial-row">
                    <TimerIcon />
                    <span className="eros-trial-text">
                      Free Trial explore it soon
                    </span>
                  </div>

                  {/* Chat Input Card */}
                  <div className="eros-chat-card">
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*,application/pdf,audio/*"
                      multiple
                      className="hidden"
                      aria-hidden
                      onChange={handleFileChange}
                    />
                    {(attachedFiles.length > 0 || attachedVoices.length > 0) && (
                      <div className="eros-chat-attachments">
                        {attachedFiles.map((item, i) => (
                          <span
                            key={i}
                            className="eros-chat-attachment-tag"
                            title={item.file.name}
                          >
                            {item.file.name.length > 12
                              ? item.file.name.slice(0, 10) + "…"
                              : item.file.name}
                            <button
                              type="button"
                              className="eros-chat-attachment-remove"
                              onClick={() => removeAttachedFile(i)}
                              aria-label="Remove"
                            >
                              ×
                            </button>
                          </span>
                        ))}
                        {attachedVoices.map((v, i) => (
                          <span
                            key={`v-${i}`}
                            className="eros-chat-attachment-tag"
                            title="Voice recording"
                          >
                            🎤 {formatTime(v.duration || 0)}
                            <button
                              type="button"
                              className="eros-chat-attachment-remove"
                              onClick={() => removeAttachedVoice(i)}
                              aria-label="Remove"
                            >
                              ×
                            </button>
                          </span>
                        ))}
                      </div>
                    )}
                    {isRecording && (
                      <div className="eros-chat-recording">
                        <span className="eros-chat-recording-dot" />
                        Recording {formatTime(recordingTime)}
                        <button
                          type="button"
                          className="eros-action-btn eros-record-stop"
                          onClick={stopRecording}
                        >
                          Stop
                        </button>
                        <button
                          type="button"
                          className="eros-action-btn eros-record-cancel"
                          onClick={cancelRecording}
                        >
                          Cancel
                        </button>
                      </div>
                    )}
                    <textarea
                      className="eros-chat-ta"
                      placeholder="Ask me anything..."
                      value={chatInput}
                      onChange={(e) => setChatInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && !e.shiftKey) {
                          e.preventDefault();
                          handleSendToChat();
                        }
                      }}
                      rows={2}
                    />
                    <div className="eros-chat-actions">
                      {/* <div className="eros-chat-left">
                        <button
                          type="button"
                          className="eros-action-btn"
                          onClick={handleAttachClick}
                          disabled={isRecording}
                        >
                          <AttachIcon /> Attach
                        </button>
                      </div> */}
                      <div className="eros-chat-right">
                        {/* <button
                          type="button"
                          className="eros-action-btn"
                          onClick={isRecording ? stopRecording : startRecording}
                          disabled={false}
                          title={isRecording ? "Stop recording" : "Record voice"}
                        >
                          <VoiceIcon /> {isRecording ? "Stop" : "Voice"}
                        </button> */}
                        <button
                          type="button"
                          className="eros-send-btn"
                          aria-label="Send"
                          onClick={handleSendToChat}
                        >
                          <SendIcon /> Send
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
