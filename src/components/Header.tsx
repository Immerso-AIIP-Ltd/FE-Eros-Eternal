import React, { useState, useEffect } from 'react';
import { useNavigate } from "react-router-dom";
import StarmapIcon from "../assets/result-images/brightness_5.png";
import VibrationalIcon from "../assets/result-images/add_reaction.png";
import VitaScanIcon from "../assets/result-images/clinical_notes.png";
import FlameScoreIcon from "../assets/result-images/mode_heat.png";
import AuraProfileIcon from "../assets/result-images/background_replace.png";
import KoshaMapIcon from "../assets/result-images/map_search.png";
import LongevityIcon from "../assets/result-images/ecg_heart.png";
import { Paperclip, Mic, Send, Bell, Sparkles } from 'lucide-react';
import credits from "../assets/credits.png";
import erosLogo from "../assets/LogoEros.png";

// Report background images
import vibrationalBg from "../assets/reports/vibrational.jpg";
import birthChartBg from "../assets/reports/birthMap.png";
import flameScoreBg from "../assets/reports/flame.png";
import auraBg from "../assets/reports/aura.png";
import koshaBg from "../assets/reports/kosha.png";
import longevityBg from "../assets/reports/longevity.png";

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

export const Header: React.FC = () => {
  const navigate = useNavigate();
  const [hoveredCard, setHoveredCard] = useState<number | null>(null);
  const [reportStatuses, setReportStatuses] = useState<Record<string, boolean>>({});
  const [loadingStatuses, setLoadingStatuses] = useState(true);
  const [chatInput, setChatInput] = useState("");
  const [activeTab, setActiveTab] = useState("Analyze");

  const userId = localStorage.getItem('userId') || localStorage.getItem('user_id');
  const baseApiUrl = "http://164.52.205.108:8500/api/v1/reports/individual_report/";

  const cardsData: CardData[] = [
    {
      id: 1,
      icon: VitaScanIcon,
      title: "Vita Scan",
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
      backgroundImage: vibrationalBg
    },
    {
      id: 3,
      icon: AuraProfileIcon,
      title: "Aura Profile",
      buttonText: "Generate",
      reportType: "aura_profile",
      route: "/aura-profile",
      backgroundImage: auraBg
    },
    {
      id: 4,
      icon: StarmapIcon,
      title: "Star Map",
      buttonText: "Generate",
      reportType: "star_map",
      route: "/star-map",
      backgroundImage: birthChartBg
    },
    {
      id: 5,
      icon: FlameScoreIcon,
      title: "Flame Score",
      buttonText: "Generate",
      reportType: "flame_score",
      route: "/flame-score",
      backgroundImage: flameScoreBg
    },
    {
      id: 6,
      icon: KoshaMapIcon,
      title: "Kosha Map",
      buttonText: "Generate",
      reportType: "kosha_map",
      route: "/kosha-map",
      backgroundImage: koshaBg
    },
    {
      id: 7,
      icon: LongevityIcon,
      title: "Longevity Blueprint",
      buttonText: "Generate",
      reportType: "longevity_blueprint",
      route: "/longevity-blueprint",
      backgroundImage: longevityBg
    },
  ];

  useEffect(() => {
    const fetchReportStatuses = async () => {
      setLoadingStatuses(true);
      const statuses: Record<string, boolean> = {};

      try {
        // Check vita_scan from localStorage
        const vitaScanData = localStorage.getItem('faceReportData');
        if (vitaScanData) {
          try {
            const parsedData = JSON.parse(vitaScanData);
            statuses['vita_scan'] = parsedData && parsedData.success === true;
          } catch (err) {
            console.error('Error parsing vita_scan data:', err);
            statuses['vita_scan'] = false;
          }
        } else {
          statuses['vita_scan'] = false;
        }

        // Check other reports from API only if userId exists
        if (userId) {
          const reportChecks = cardsData
            .filter(card => card.reportType && card.reportType !== 'vita_scan')
            .map(async (card) => {
              try {
                const response = await fetch(
                  `${baseApiUrl}?user_id=${userId}&report_type=${card.reportType}`
                );
                const data = await response.json();
                const hasReport = data.success && data.data && data.data.report_data;
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
      if (e.key === 'faceReportData') {
        fetchReportStatuses();
      }
    };

    // Listen for custom event when navigating back from report page
    const handleVitaScanUpdate = () => {
      fetchReportStatuses();
    };

    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('vitaScanUpdated', handleVitaScanUpdate);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('vitaScanUpdated', handleVitaScanUpdate);
    };
  }, [userId]);

  const getButtonText = (card: CardData): string => {
    if (!card.reportType || loadingStatuses) return card.buttonText;
    const hasReport = reportStatuses[card.reportType];
    if (hasReport === undefined) return card.buttonText;
    return hasReport ? "View report" : "Generate";
  };

  const handleCardClick = (card: CardData) => {
    if (card.reportType === 'vita_scan') {
      // Special handling for vita_scan
      const hasReport = reportStatuses['vita_scan'];
      if (hasReport) {
        // Navigate to face-report page to view existing report
        navigate('/face-report');
      } else {
        // Navigate to facescan page to generate new report
        navigate('/facescan');
      }
    } else if (card.reportType && userId) {
      // Handle other report types
      const hasReport = reportStatuses[card.reportType];
      debugger
      if (hasReport) {
        navigate('/view-report', {
          state: { reportType: card.reportType, userId, title: card.title }
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

  return (
    <div
      style={{
        width: "100%",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        fontFamily: '"Poppins", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        position: "relative",
        backgroundColor: "#f8f8fa",
        overflowX: "hidden",
      }}
    >
      {/* Top Navbar */}
      <div
        style={{
          width: "100%",
          height: "60px",
          backgroundColor: "#fff",
          borderBottom: "1px solid #eee",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "0 24px 0 20px",
          boxSizing: "border-box",
          flexShrink: 0,
          position: "sticky",
          top: 0,
          zIndex: 100,
        }}
      >
        {/* Logo */}
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <img
            src={erosLogo}
            alt="Eros Wellness"
            style={{ height: "36px", objectFit: "contain" }}
          />
        </div>

        {/* Right Actions */}
        <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
          <button
            onClick={handleRasiClick}
            style={{
              background: "linear-gradient(135deg, rgb(137 219 255) 0%, rgb(74 164 227) 100%)",
              border: "none",
              borderRadius: "20px",
              padding: "8px 20px",
              fontSize: "13px",
              cursor: "pointer",
              color: "white",
              fontWeight: 600,
              transition: "transform 0.2s ease, box-shadow 0.2s ease",
              whiteSpace: "nowrap",
              boxShadow: "0 4px 12px rgba(115, 172, 212, 0.3)",
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.transform = "scale(1.03)";
              e.currentTarget.style.boxShadow = "0 6px 16px rgba(115, 172, 212, 0.4)";
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.transform = "scale(1)";
              e.currentTarget.style.boxShadow = "0 4px 12px rgba(115, 172, 212, 0.3)";
            }}
          >
            {/* View trial chart */}
            View Rasi chart
          </button>

          <div
            style={{
              width: "36px",
              height: "36px",
              borderRadius: "50%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
            }}
          >
            <Bell size={20} color="#555" />
          </div>

          <div
            style={{
              position: "relative",
              width: "36px",
              height: "36px",
              borderRadius: "50%",
              backgroundColor: "#fff5ed",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
            }}
          >
            <img
              src={credits}
              alt="Credits"
              style={{ width: "20px", height: "20px", objectFit: "contain" }}
            />
            <div
              style={{
                position: "absolute",
                top: "-4px",
                right: "-4px",
                backgroundColor: "#ff6b35",
                color: "white",
                fontSize: "10px",
                borderRadius: "10px",
                padding: "2px 6px",
                fontWeight: 700,
              }}
            >
              NEW
            </div>
          </div>
        </div>
      </div>

      {/* Hero Section - 100VH minus navbar */}
      <div
        style={{
          width: "100%",
          minHeight: "calc(100vh - 60px)",
          background: "linear-gradient(rgb(209 233 255) 40%, rgb(255 255 255 / 18%) 100%)",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "40px 40px",
          boxSizing: "border-box",
          position: "relative",
          // maskImage: "linear-gradient(180deg, rgba(0,0,0,1) 0%, rgba(0,0,0,0.95) 70%, rgba(0,0,0,0) 100%)",
          // WebkitMaskImage: "linear-gradient(180deg, rgba(0,0,0,1) 0%, rgba(0,0,0,0.95) 70%, rgba(0,0,0,0) 100%)",
        }}
      >
        {/* Top Section - Sparkle Icon & Heading & Description */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            flex: "0 1 auto",
            marginBottom: "20px",
          }}
        >
          {/* Sparkle Icon */}
          {/* <div
            style={{
              width: "60px",
              height: "60px",
              borderRadius: "50%",
              backgroundColor: "rgba(255,255,255,0.9)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              marginBottom: "24px",
              boxShadow: "0 4px 20px rgba(0,0,0,0.06)",
            }}
          >
            <Sparkles size={32} color="#73acd4" />
          </div> */}

          {/* Main Heading - Black, center-aligned, 2 lines */}
          <h1
            style={{
              fontSize: "clamp(22px, 3.5vw, 62px)",
              fontWeight: 700,
              fontStyle: "normal",
              textAlign: "center",
              margin: "0 0 16px 0",
              letterSpacing: "-0.02em",
              lineHeight: 1.5,
              color: "#1a1a2e",
              maxWidth: "1330px",
            }}
          >
            Unlimited AI-powered wellness solutions for results-driven personal growth & holistic living.
          </h1>

          {/* Description */}
          <p
            style={{
              fontSize: "clamp(13px, 2vw, 15px)",
              color: "#6b6380",
              textAlign: "center",
              marginBottom: "0",
              lineHeight: 1.6,
              maxWidth: "720px",
            }}
          >
            Your personal AI spiritual companion — illuminating your path through astrology, energy readings, and
            ancient wisdom tailored uniquely for you.
          </p>
        </div>

        {/* Middle Section - Cards Container */}
        <div
          style={{
            flex: "1 1 auto",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: "100%",
            minHeight: "220px",
            paddingTop: "20px",
            paddingBottom: "20px",
          }}
        >
          <div className="cards-container">
            {cardsData.map((card) => (
              <div
                key={card.id}
                className="feature-card"
                onClick={() => handleCardClick(card)}
                onMouseEnter={() => setHoveredCard(card.id)}
                onMouseLeave={() => setHoveredCard(null)}
                style={{
                  position: "relative",
                  padding: "24px 20px",
                  borderRadius: "30px",
                  border: "1px solid rgba(255,255,255,0.3)",
                  // backgroundColor: hoveredCard === card.id
                  //   ? "rgba(255,255,255,0.25)"
                  //   : "rgba(255,255,255,0.15)",
                  backgroundColor: 'white',
                  backdropFilter: "blur(10px)",
                  WebkitBackdropFilter: "blur(10px)",
                  cursor: "pointer",
                  transition: "all 0.4s cubic-bezier(0.4, 0, 0.2, 1)",
                  boxShadow: hoveredCard === card.id
                    ? "0 8px 32px rgba(115, 172, 212, 0.15), inset 0 1px 1px rgba(255,255,255,0.4)"
                    : "0 4px 16px rgba(115, 172, 212, 0.08), inset 0 1px 1px rgba(255,255,255,0.3)",
                  transform: hoveredCard === card.id ? "translateY(-8px) scale(1.02)" : "translateY(0) scale(1)",
                  overflow: "hidden",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "12px",
                  minHeight: "250px",
                }}
              >
                {/* Glitter Animation Overlay */}
                {hoveredCard === card.id && (
                  <div
                    className="glitter-effect"
                    style={{
                      position: "absolute",
                      top: 0,
                      left: 0,
                      right: 0,
                      bottom: 0,
                      pointerEvents: "none",
                    }}
                  />
                )}

                <div style={{ position: "relative", zIndex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: "8px", width: "100%" }}>
                  {/* Icon */}
                  <div
                    style={{
                      width: "52px",
                      height: "52px",
                      borderRadius: "12px",
                      // backgroundColor: "rgba(115, 172, 212, 0.1)",
                      background: 'linear-gradient(135deg, rgb(137 219 255) 0%, rgb(74 164 227) 100%)',
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      transition: "all 0.3s ease",
                      transform: hoveredCard === card.id ? "scale(1.1) rotate(5deg)" : "scale(1)",
                    }}
                  >
                    <img src={card.icon} alt="" style={{ width: "28px", height: "28px" }} />
                  </div>

                  {/* Title */}
                  <h3
                    style={{
                      fontSize: "15px",
                      fontWeight: 600,
                      color: "#2a2040",
                      margin: 0,
                      textAlign: "center",
                      lineHeight: 1.3,
                      minHeight: "32px",
                      display: "flex",
                      alignItems: "center",
                    }}
                  >
                    {card.title}
                  </h3>

                  {/* Button - Uniform size */}
                  <button
                    className="card-button"
                    style={{
                      background: "linear-gradient(135deg, rgb(137 219 255) 0%, rgb(74 164 227) 100%)",
                      border: "none",
                      borderRadius: "16px",
                      padding: "10px 18px",
                      fontSize: "13px",
                      fontWeight: 600,
                      color: "white",
                      cursor: "pointer",
                      transition: "all 0.3s ease",
                      transform: hoveredCard === card.id ? "scale(1.05)" : "scale(1)",
                      boxShadow: hoveredCard === card.id
                        ? "0 8px 16px rgba(115, 172, 212, 0.4)"
                        : "0 4px 12px rgba(115, 172, 212, 0.2)",
                      width: "100%",
                      minHeight: "40px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      top: '20%',
                      position: 'relative'
                    }}
                  >
                    {loadingStatuses ? "Loading..." : getButtonText(card)}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom Section - Tabs & Chat */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: "20px",
            flex: "0 1 auto",
            width: "100%",
            maxWidth: "100%",
          }}
        >
          {/* Tabs as Badges with shadow */}
          <div
            style={{
              display: "flex",
              gap: "10px",
              overflowX: "auto",
              scrollbarWidth: "none",
              msOverflowStyle: "none",
              maxWidth: "100%",
              width: "100%",
              justifyContent: "center",
              paddingBottom: "10px",
            }}
          >
            {chatTabs.map((tab) => {
              const isActive = activeTab === tab;
              return (
                <span
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  style={{
                    padding: "10px 24px",
                    borderRadius: "24px",
                    border: "1px solid #e0dce5",
                    background: "#fff",
                    color: "#7a7490",
                    fontSize: "14px",
                    fontWeight: isActive ? 600 : 400,
                    cursor: "pointer",
                    whiteSpace: "nowrap",
                    transition: "all 0.2s ease",
                    flexShrink: 0,
                    userSelect: "none",
                    minWidth: "90px",
                    textAlign: "center" as const,
                    boxShadow: isActive
                      ? "0 4px 12px rgba(115, 172, 212, 0.3)"
                      : "0 2px 8px rgba(0, 0, 0, 0.08)",
                  }}
                >
                  {tab}
                </span>
              );
            })}
          </div>

          {/* Chat Input Card with shadow */}
          {/* Chat Input Card with shadow */}
          <div
            style={{
              background: "linear-gradient(135deg, rgb(137, 219, 255) 0%, rgb(74, 164, 227) 100%)",
              borderRadius: "24px",
              padding: "16px 16px 14px",
              boxShadow: "0 8px 24px rgba(74, 164, 227, 0.12), 0 4px 12px rgba(74, 164, 227, 0.15)",
              maxWidth: "900px",
              width: "100%",
              position: "relative",
            }}
          >
            {/* Free trial notice */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                marginBottom: "10px",
                fontSize: "14px",
                color: "#ffffff",
                fontWeight: 600,
                padding: "0 4px",
              }}
            >
              <span style={{ fontSize: "18px" }}>&#9200;</span>
              Free Trial explore it soon
            </div>

            {/* White inner input card */}
            <div
              style={{
                background: "#fff",
                borderRadius: "16px",
                padding: "14px 16px",
                border: "1px solid #f0eef2",
                boxShadow: "inset 0 1px 3px rgba(0, 0, 0, 0.05)",
              }}
            >
              {/* Input area */}
              <textarea
                placeholder="Ask me anything..."
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    navigate('/ai-chat', { state: { initialMessage: chatInput } });
                    setChatInput("");
                  }
                }}
                style={{
                  width: "100%",
                  background: "transparent",
                  border: "none",
                  outline: "none",
                  color: "#3a3550",
                  fontSize: "14px",
                  resize: "none",
                  fontFamily: "Poppins, sans-serif",
                  lineHeight: 1.5,
                  minHeight: "32px",
                  maxHeight: "80px",
                  boxSizing: "border-box",
                }}
              />

              {/* Bottom actions - Only Send button */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "flex-end",
                  marginTop: "8px",
                }}
              >
                <button
                  onClick={() => {
                    navigate('/ai-chat', { state: { initialMessage: chatInput } });
                    setChatInput("");
                  }}
                  style={{
                    background: "linear-gradient(135deg, rgb(137, 219, 255) 0%, rgb(74, 164, 227) 100%)",
                    border: "none",
                    borderRadius: "14px",
                    padding: "8px 20px",
                    display: "flex",
                    alignItems: "center",
                    gap: "6px",
                    cursor: "pointer",
                    color: "white",
                    fontSize: "13px",
                    fontWeight: 600,
                    transition: "all 0.2s ease",
                    boxShadow: "0 4px 12px rgba(74, 164, 227, 0.3)",
                  }}
                  onMouseOver={(e) => {
                    e.currentTarget.style.transform = "scale(1.03)";
                    e.currentTarget.style.boxShadow = "0 6px 16px rgba(74, 164, 227, 0.4)";
                  }}
                  onMouseOut={(e) => {
                    e.currentTarget.style.transform = "scale(1)";
                    e.currentTarget.style.boxShadow = "0 4px 12px rgba(74, 164, 227, 0.3)";
                  }}
                >
                  <Send size={14} />
                  Send
                </button>
              </div>
            </div>

            {/* Mask gradient overlay - positioned absolutely */}
            <div
              style={{
                position: "absolute",
                bottom: 0,
                left: 0,
                right: 0,
                height: "120px",
                borderRadius: "24px",
                // background: "linear-gradient(to bottom, rgba(255, 255, 255, 0) 0%, rgba(255, 255, 255, 0.4) 60%, rgba(255, 255, 255, 0.75) 100%)",
                pointerEvents: "none",
              }}
            />
          </div>
        </div>
      </div>

      <style>{`
        .cards-container {
          display: grid;
          grid-template-columns: repeat(7, 1fr);
          gap: 16px;
          width: 100%;
          max-width: none;
          margin: 0 auto;
          padding: 0 30px;
          box-sizing: border-box;
        }

        .feature-card {
          flex: 1 1 0 !important;
          min-height: 180px;
        }

        .glitter-effect {
          background: linear-gradient(45deg, 
            transparent 0%, 
            rgba(255,255,255,0.3) 20%, 
            rgba(255,255,255,0.1) 40%, 
            transparent 60%
          );
          animation: glitterShimmer 0.8s ease-in-out infinite;
        }

        @keyframes glitterShimmer {
          0% {
            transform: translateX(-100%) translateY(-100%);
            opacity: 0;
          }
          50% {
            opacity: 1;
          }
          100% {
            transform: translateX(100%) translateY(100%);
            opacity: 0;
          }
        }

        @media (max-width: 1100px) {
          .cards-container {
            grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
            gap: 14px !important;
            padding: 0 24px !important;
          }
        }

        @media (max-width: 768px) {
          .cards-container {
            grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
            gap: 12px !important;
            padding: 0 20px !important;
          }
          .feature-card {
            min-height: 150px;
          }
          .card-button {
            padding: 6px 12px !important;
            font-size: 11px !important;
            min-height: 32px !important;
          }
        }

        @media (max-width: 480px) {
          .cards-container {
            grid-template-columns: repeat(auto-fit, minmax(100px, 1fr));
          }
        }
      `}</style>
    </div>
  );
};

export default Header;