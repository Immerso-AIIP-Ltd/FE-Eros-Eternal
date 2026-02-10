import React, { useState, useEffect } from 'react';
import { useNavigate } from "react-router-dom";
import HeaderBg from "../assets/background.png";
import StarmapIcon from "../assets/result-images/brightness_5.png";
import VibrationalIcon from "../assets/result-images/add_reaction.png";
import VitaScanIcon from "../assets/result-images/clinical_notes.png";
import FlameScoreIcon from "../assets/result-images/mode_heat.png";
import AuraProfileIcon from "../assets/result-images/background_replace.png";
import KoshaMapIcon from "../assets/result-images/map_search.png";
import LongevityIcon from "../assets/result-images/ecg_heart.png";
import { Paperclip, ArrowRight, Bell, ChevronDown } from 'lucide-react';
import notification from "../assets/notification.png";
import credits from "../assets/credits.png";
import overlay from "../assets/result-images/overlay.png";

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

export const Header: React.FC = () => {
  const navigate = useNavigate();
  const [activeCard, setActiveCard] = useState<number | null>(null);
  const [hoveredCard, setHoveredCard] = useState<number | null>(null);
  const [reportStatuses, setReportStatuses] = useState<Record<string, boolean>>({});
  const [loadingStatuses, setLoadingStatuses] = useState(true);
  const [chatInput, setChatInput] = useState("");

  // Get user ID from localStorage
  const userId = localStorage.getItem('userId') || localStorage.getItem('user_id');
  const baseApiUrl = "http://164.52.205.108:8500/api/v1/reports/individual_report/";

  // Enhanced cards data with report mappings
  const cardsData: CardData[] = [
    {
      id: 1,
      icon: VitaScanIcon,
      title: "Vita Scan",
      buttonText: "View Report",
      reportType: "vita_scan",
      route: "/face-report",
    },
    {
      id: 2,
      icon: VibrationalIcon,
      title: "Vibrational Frequency",
      buttonText: "Generate",
      reportType: "vibrational_frequency",
      route: "/vibrational-frequency",
      backgroundImage: vibrationalBg
    },
    {
      id: 3,
      icon: StarmapIcon,
      title: "Star Map",
      buttonText: "Generate",
      reportType: "star_map",
      route: "/star-map",
      backgroundImage: birthChartBg
    },
    {
      id: 4,
      icon: FlameScoreIcon,
      title: "Flame Score",
      buttonText: "Generate",
      reportType: "flame_score",
      route: "/flame-score",
      backgroundImage: flameScoreBg
    },
    {
      id: 5,
      icon: AuraProfileIcon,
      title: "Aura Profile",
      buttonText: "Generate",
      reportType: "aura_profile",
      route: "/aura-profile",
      backgroundImage: auraBg
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

  // Fetch report statuses on mount and when userId changes
  useEffect(() => {
    const fetchReportStatuses = async () => {
      if (!userId) {
        setLoadingStatuses(false);
        return;
      }

      setLoadingStatuses(true);
      const statuses: Record<string, boolean> = {};

      try {
        // Fetch all report statuses concurrently
        const reportChecks = cardsData
          .filter(card => card.reportType) // Only check cards with reportType
          .map(async (card) => {
            try {
              const response = await fetch(
                `${baseApiUrl}?user_id=${userId}&report_type=${card.reportType}`
              );
              const data = await response.json();

              // Check if report exists and has data
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
        setReportStatuses(statuses);
      } catch (error) {
        console.error("Error checking report statuses:", error);
      } finally {
        setLoadingStatuses(false);
      }
    };

    fetchReportStatuses();
  }, [userId]);

  // Get dynamic button text based on report status
  const getButtonText = (card: CardData): string => {
    if (!card.reportType || loadingStatuses) return card.buttonText;

    const hasReport = reportStatuses[card.reportType];
    if (hasReport === undefined) return card.buttonText;

    return hasReport ? "View Report" : "Generate";
  };

  // Handle card click with report status awareness
  const handleCardClick = (card: CardData) => {
    console.log(`Clicked on ${card.title}`);
    setActiveCard(card.id);

    // For cards with report functionality
    if (card.reportType && userId) {
      const hasReport = reportStatuses[card.reportType];

      if (hasReport) {
        // Navigate to view report page
        navigate('/view-report', {
          state: {
            reportType: card.reportType,
            userId,
            title: card.title
          }
        });
      } else if (card.route) {
        // Navigate to generation page
        navigate(card.route);
      }
    } else {
      // Fallback navigation if no status available
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
        justifyContent: "flex-start",
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        position: "relative",
        backgroundColor: "#000",
        overflowX: "hidden",
      }}
    >
      {/* Background Image */}
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          height: "100%",
          zIndex: 0,

          backgroundImage: `
      linear-gradient(
        to bottom,
        rgba(0, 0, 0, 0.5),
        rgba(0, 0, 0, 1)
      ),
      url(${HeaderBg})
    `,
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundRepeat: "no-repeat",
          // transform: "rotate(180deg)",
        }}
      />

      {/* Top Navbar */}
      <div
        style={{
          position: "relative",
          zIndex: 10,
          width: "100%",
          height: "52px",
          backgroundColor: "#000",
          borderBottom: "1px solid rgba(255, 255, 255, 0.07)",
          display: "flex",
          alignItems: "center",
          justifyContent: "flex-end",
          padding: "0 36px",
          gap: "18px",
          boxSizing: "border-box",
          flexShrink: 0,
        }}
      >
        <button
          style={{
            background: "linear-gradient(135deg, rgb(170, 225, 39) 0%, rgb(0, 162, 255) 100%)",
            border: "none",
            borderRadius: "20px",
            padding: "8px 22px",
            fontSize: "13.5px",
            cursor: "pointer",
            color: "white",
            fontWeight: 600,
            transition: "transform 0.2s ease, box-shadow 0.2s ease",
            boxShadow: "0 3px 8px rgba(0, 0, 0, 0.3)",
            whiteSpace: "nowrap",
          }}
          onMouseOver={(e) => (e.currentTarget.style.transform = "scale(1.05)")}
          onMouseOut={(e) => (e.currentTarget.style.transform = "scale(1)")}
          onClick={handleRasiClick}
        >
          View Rasi chart
        </button>

        <img
          src={notification}
          alt="Notifications"
          style={{ width: "24px", height: "24px", cursor: "pointer", objectFit: "contain" }}
        />

        <div style={{ display: "flex", alignItems: "center", gap: "0px" }}>
          <img
            src={credits}
            alt="Credits"
            style={{
              height: "34px",
              width: "auto",
              marginLeft: "-6px",
              objectFit: "contain",
            }}
          />
        </div>
      </div>

      {/* Overlay */}
      {/* <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundImage: `url('${overlay}')`,
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundRepeat: "no-repeat",
          zIndex: 0,
        }}
      /> */}

      {/* Main Content */}
      <div
        style={{
          position: "relative",
          zIndex: 5,
          width: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          marginTop: "44px",
          padding: "0 40px",
          boxSizing: "border-box",
        }}
      >
        <h1
          style={{
            fontSize: "56px",
            fontWeight: 700,
            marginBottom: "48px",
            textAlign: "center",
            letterSpacing: "-0.02em",
            fontFamily: "Poppins, sans-serif",
            lineHeight: 1.1,
            background: 'linear-gradient(135deg, rgb(170, 225, 39) 0%, rgb(100, 200, 255) 50%, rgb(0, 162, 255) 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
          }}
        >
          <span>EROS</span>{" "}
          <span>Wellness</span>
        </h1>

        {/* Cards Row */}
        <div
          className="cards-container"
          style={{
            display: "flex",
            justifyContent: "center",
            gap: "clamp(8px, 1.5vw, 24px)",
            flexWrap: "nowrap",
            width: "100%",
            maxWidth: "100%", // ✅ Allow full width
            marginBottom: "48px",
            padding: "0 clamp(10px, 3vw, 40px)", // ✅ Responsive padding
            margin: "0 auto 48px",
          }}
        >
          {cardsData.map((card) => {
            const isHov = hoveredCard === card.id;
            const buttonText = getButtonText(card);
            const hasReport = card.reportType ? reportStatuses[card.reportType] : false;

            return (
              <div
                key={card.id}
                style={{
                  flex: "1 1 0px",       // Allows cards to grow equally
                  minWidth: "120px",     // Minimum size for small screens
                  maxWidth: "220px",     // Maximum size for big screens
                  position: "relative",
                }}
              >
                <div
                  onClick={() => handleCardClick(card)}
                  onMouseEnter={() => setHoveredCard(card.id)}
                  onMouseLeave={() => setHoveredCard(null)}
                  style={{
                    width: "100%",
                    aspectRatio: "1 / 1", // Forces card to stay square as it scales
                    borderRadius: "16px",
                    background: hasReport && card.backgroundImage
                      ? `url(${card.backgroundImage})`
                      : "transparent",
                    backgroundSize: "cover",
                    backgroundPosition: "center",
                    display: "flex",
                    flexDirection: "column",
                    cursor: "pointer",
                    backdropFilter: "blur(10px)",
                    WebkitBackdropFilter: "blur(10px)",
                    boxShadow: hasReport
                      ? "0 0 20px rgba(170, 225, 39, 0.4)"
                      : "0 0 25px rgba(0, 0, 0, 0.25)",
                    transition: "all 0.28s ease",
                    transform: isHov ? "scale(1.05)" : "scale(1)",
                    position: "relative",
                    overflow: "hidden",
                    border: "1px solid rgba(255, 255, 255, 0.1)",
                  }}
                >
                  <div style={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    width: "100%",
                    height: "100%",
                    backgroundColor: "#00B8F833",
                    position: "relative",
                    padding: "10%", // Relative padding
                    boxSizing: "border-box",
                  }}>
                    {/* Icon - Scalable size */}
                    <div style={{
                      marginTop: "10%",
                      height: "40%",
                      display: "flex",
                      alignItems: "center"
                    }}>
                      <img
                        src={card.icon}
                        alt={card.title}
                        style={{
                          width: "clamp(30px, 4vw, 55px)",
                          height: "auto",
                          objectFit: "contain",
                          filter: "brightness(1.2) saturate(1.3)",
                        }}
                      />
                    </div>

                    {/* Button - Scalable but LOCKED to bottom */}
                    <div
                      className="card-button"
                      style={{
                        background: 'linear-gradient(135deg, rgb(170, 225, 39) 0%, rgb(0, 162, 255) 100%)',
                        borderRadius: "12px",
                        width: "85%",
                        height: "clamp(28px, 3vw, 36px)", // Grows with screen
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: "clamp(9px, 1vw, 12px)", // Text scales too
                        fontWeight: 700,
                        color: "white",
                        position: "absolute",
                        bottom: "10%",           // Always same relative distance from bottom
                        left: "50%",
                        transform: "translateX(-50%)",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {loadingStatuses ? "Loading..." : buttonText}
                    </div>
                  </div>
                </div>

                {/* Title - Outside the square to prevent pushing */}
                <div
                  style={{
                    color: "#fff",
                    fontSize: "clamp(18px, 1.2vw, 14px)",
                    fontWeight: 600,
                    marginTop: "12px",
                    textAlign: "center",
                    minHeight: "2.5em", // Ensures 2-line titles don't move the cards
                    display: "flex",
                    justifyContent: "center",
                    alignItems: "flex-start"
                  }}
                >
                  {card.title}
                </div>
              </div>
            );
          })}


        </div>

        {/* Search Bar */}
        <div
          style={{
            width: "100%",
            maxWidth: "880px",
            height: "140px",
            background: "rgba(0, 0, 0, 0.35)",
            border: "3px solid rgba(21, 167, 216, 0.3)",
            borderRadius: "26px",
            padding: "20px 28px",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            boxShadow: "0 0 22px rgba(21, 167, 216, 0.08), inset 0 0 20px rgba(0,0,0,0.45)",
            backdropFilter: "blur(10px)",
            WebkitBackdropFilter: "blur(10px)",
            position: "relative",
            boxSizing: "border-box",
          }}
        >
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
              flex: 1,
              background: "transparent",
              border: "none",
              outline: "none",
              // color: "rgba(255,255,255,0.55)",
              color: "#fff",
              fontSize: "17px",
              resize: "none",
              fontFamily: "Poppins, sans-serif",
              lineHeight: 1.5,
            }}
          />

          <div
            style={{
              position: "absolute",
              bottom: "18px",
              right: "24px",
              display: "flex",
              gap: "10px",
              alignItems: "center",
            }}
          >
            {/* <button

              style={{
                width: "56px",
                height: "56px",
                borderRadius: "50%",
                background: "transparent",
                border: "2px solid rgba(21, 167, 216, 0.5)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
                transition: "border-color 0.2s",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.borderColor = "#15A7D8")}
              onMouseLeave={(e) => (e.currentTarget.style.borderColor = "#15A7D8")}
            >
              <Paperclip color="#15A7D8" size={25} />
            </button> */}


            <button
              style={{
                width: "56px",
                height: "56px",
                borderRadius: "50%",
                background: "#15A7D8",
                border: "none",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
                transition: "background 0.2s",
              }}
              onClick={() => {
                navigate('/ai-chat', { state: { initialMessage: chatInput } });
                setChatInput("");
              }}

              onMouseEnter={(e) => (e.currentTarget.style.background = "#15A7D8")}
              onMouseLeave={(e) => (e.currentTarget.style.background = "#15A7D8")}
            >
              <ArrowRight color="white" size={25} />
            </button>
          </div>
        </div>
      </div>
      <style>{`
        .card-button {
          padding: 10px 20px !important;
          font-size: 12px !important;
        }

        .cards-container {
    display: flex;
    justify-content: center;
    align-items: flex-start;
    gap: 1.5vw;
    width: 100%;
    max-width: 1400px;
    margin: 0 auto 48px;
    padding: 0 20px;
    box-sizing: border-box;
  }

        @media (min-width: 1101px) {
          .card-button {
            padding: 14px 48px !important;
            font-size: 14px !important;
          }
        }

 @media (max-width: 1100px) {
  .cards-container {
      flex-wrap: wrap !important;
    }
  .cards-container > div {
    flex: 0 0 auto !important;
    width: 180px !important;
    min-width: 180px !important;
    max-width: 180px !important;
  }
  /* ✅ Force card inner div to be square */
  .cards-container > div > div:first-child {
    height: 180px !important; /* Change to match width */
  }
  .card-button {
    padding: 10px 24px !important;
    font-size: 12px !important;
  }
}
@media (max-width: 1000px) {
    .cards-container {
      flex-wrap: wrap;
      gap: 20px;
    }
  }
@media (max-width: 768px) {
  .cards-container {
    flex-wrap: wrap !important;
    justify-content: center !important;
    gap: 16px !important;
  }
  .cards-container > div {
    flex: 0 0 auto !important;
    width: 160px !important;
    min-width: 160px !important;
    max-width: 160px !important;
  }
  /* ✅ Force card inner div to be square */
  .cards-container > div > div:first-child {
    height: 160px !important; /* Change to match width */
  }
  .card-button {
    padding: 8px 16px !important;
    font-size: 11px !important;
  }
}
      `}
      </style>
    </div>
  );
};

export default Header;