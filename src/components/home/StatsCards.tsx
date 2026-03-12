import React, { useState, useEffect } from "react";
import { useNavigate } from 'react-router-dom';

import "bootstrap/dist/css/bootstrap.min.css";
import "./StatsCard.css";
import fire from "@/assets/webm/Fire.webm";
import gym from "@/assets/webm/Gym dubble.webm";
import crystal from "@/assets/webm/Magic Crystal Ball.webm";
import ArrowForwardIosIcon from "@mui/icons-material/ArrowForwardIos";
import vibrational from "@/assets/webm/vibrational.webm";
import kosha from "@/assets/webm/kosha.webm";
import aura from "@/assets/webm/aura.webm";
import starmap from "@/assets/webm/star-map.webm";
import longevity from "@/assets/webm/longevity.webm";

// Import background images
import vibrationalBg from "@/assets/reports/vibrational.jpg";
import birthChartBg from "@/assets/reports/birthMap.png";
import flameScoreBg from "@/assets/reports/flame.png";
import auraBg from "@/assets/reports/aura.png";
import koshaBg from "@/assets/reports/kosha.png";
import longevityBg from "@/assets/reports/longevity.png";
import { baseApiUrl } from "@/config/api";

const StatsCards = () => {
  const navigate = useNavigate();
  const [reportStatuses, setReportStatuses] = useState({});
  const [loading, setLoading] = useState(true);

  const userId = localStorage.getItem('userId') || localStorage.getItem('user_id');
  const reportsApiUrl = `${baseApiUrl}/api/v1/reports/individual_report/`;

  const reportCards = [
    {
      id: 1,
      title: "Vibrational Frequency",
      iconVideo: vibrational,
      route: "/vibrational-frequency",
      reportType: "vibrational_frequency",
      backgroundImage: vibrationalBg
    },
    {
      id: 2,
      title: "Birth Chart",
      iconVideo: starmap,
      route: "/star-map",
      reportType: "star_map",
      backgroundImage: birthChartBg
    },
    {
      id: 3,
      title: "Flame Score",
      iconVideo: fire,
      route: "/flame-score",
      reportType: "flame_score",
      backgroundImage: flameScoreBg
    },
    {
      id: 4,
      title: "Aura Profile",
      iconVideo: aura,
      route: "/aura-profile",
      reportType: "aura_profile",
      backgroundImage: auraBg
    },
    {
      id: 5,
      title: "Kosha Map",
      iconVideo: kosha,
      route: "/kosha-map",
      reportType: "kosha_map",
      backgroundImage: koshaBg
    },
    {
      id: 6,
      title: "Longevity Blueprint",
      iconVideo: longevity,
      route: "/longevity-blueprint",
      reportType: "longevity_blueprint",
      backgroundImage: longevityBg
    },
  ];

  // Check report status for each report type
  useEffect(() => {
    const checkReportStatuses = async () => {
      setLoading(true);
      const statuses = {};

      try {
        // Check all reports concurrently
        const promises = reportCards.map(async (card) => {
          try {
            const response = await fetch(
              `${reportsApiUrl}?user_id=${userId}&report_type=${card.reportType}`
            );
            const data = await response.json();

            // Check if report exists and has data
            const hasReport = data.success && data.data && data.data.report_data;
            return { reportType: card.reportType, hasReport };
          } catch (error) {
            console.error(`Error checking ${card.reportType}:`, error);
            return { reportType: card.reportType, hasReport: false };
          }
        });

        const results = await Promise.all(promises);
        results.forEach(result => {
          statuses[result.reportType] = result.hasReport;
        });

        setReportStatuses(statuses);
      } catch (error) {
        console.error("Error checking report statuses:", error);
      } finally {
        setLoading(false);
      }
    };

    checkReportStatuses();
  }, [userId]);

  const handleCardClick = (card, e) => {
    // Prevent navigation if the button was clicked
    if (e.target.tagName === 'BUTTON' || e.target.closest('button')) {
      return;
    }

    const hasReport = reportStatuses[card.reportType];

    if (hasReport) {
      // Navigate to view report page with report data
      navigate('/view-report', {
        state: {
          reportType: card.reportType,
          userId: userId,
          title: card.title
        }
      });
    } else {
      // Navigate to generation page or show generation UI
      navigate(card.route);
    }
  };

  const handleButtonClick = (card) => {
    const hasReport = reportStatuses[card.reportType];

    if (hasReport) {
      // Navigate to view report page and scroll to recommendations
      navigate('/view-report', {
        state: {
          reportType: card.reportType,
          userId: userId,
          title: card.title,
          scrollToRecommendations: true // This will trigger scroll to recommendations
        }
      });
    } else {
      // Navigate to generation page
      navigate(card.route);
    }
  };

  if (loading) {
    return (
      <div className="container-fluid p-0 m-0 d-flex justify-content-center align-items-center" style={{ minHeight: '50vh' }}>
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="container-fluid m-0" style={{ paddingRight: "100px" }}>

      <div className="header mb-4">
        <h1 className="text-white mb-1">
          Your Soul Reports Hub
        </h1>
        <p className="text-white mb-0">
          Tap any card to generate your personalized report
        </p>
      </div>

      <div className="row g-4">
        {reportCards.map((card) => {
          const hasReport = reportStatuses[card.reportType];

          return (
            <div key={card.id} className="col-md-6 col-lg-4 mb-4">
              <div
                className="card border-0 shadow-lg hover-card"
                onClick={(e) => handleCardClick(card, e)}
                style={{
                  borderRadius: "36px",
                  cursor: "pointer",
                  position: "relative",
                  overflow: "hidden",
                  minHeight: '260px',
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
                    backgroundImage: `url(${card.backgroundImage})`,
                    backgroundSize: "cover",
                    backgroundPosition: "center",
                    backgroundRepeat: "no-repeat",
                    zIndex: 0,
                  }}
                />

                {/* Optional dark overlay for better text readability */}
                <div
                  style={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    background: "rgba(0, 0, 0, 0.2)",
                    zIndex: 1,
                  }}
                />

                <div
                  className="card-body p-4"
                  style={{
                    border: "1px solid rgba(255, 255, 255, 0.5)",
                    borderRadius: "36px",
                    position: "relative",
                    zIndex: 2,
                  }}
                >
                  {/* <div className="d-flex justify-content-between align-items-start mb-3">
                    <video
                      src={card.iconVideo}
                      autoPlay
                      loop
                      muted
                      playsInline
                      className="icon-video"
                      style={{
                        width: "2.5em",
                        height: "2.5em",
                        verticalAlign: "middle",
                        borderRadius: "4px",
                        objectFit: "contain",
                        background: "transparent",
                        mixBlendMode: 'screen'
                      }}
                    />
                    <ArrowForwardIosIcon
                      sx={{
                        color: "rgba(102, 102, 102, 1)",
                        fontSize: "1.25rem",
                      }}
                    />
                  </div> */}

                  <h5
                    className="card-title text-white mb-4"
                    style={{
                      fontFamily: "Inter",
                      fontWeight: "600",
                      fontSize: "28px",
                    }}
                  >
                    {card.title}
                  </h5>
                  <p
                    className="card-text mb-3 small"
                    style={{ color: "#00B8F8", fontFamily: "Inter,sans-serif", fontSize: "20px" }}
                  >
                    {hasReport ? "View Report" : "Generate Report"}
                  </p>

                  <button
                    className={`btn btn-lg text-white rounded-pill mb-4 mx-2 px-4 ${hasReport ? "btn-recommendations" : "btn-generate"
                      }`}
                    onClick={() => handleButtonClick(card)}
                    style={{ fontFamily: "Poppins,sans-serif", position: "absolute", bottom: "16px", left: "16px" }}
                  >
                    {hasReport ? "Recommendations" : "Generate Report"}
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <style>{`
        .hover-card {
          transition: transform 0.3s ease, box-shadow 0.3s ease;
        }

        .hover-card:hover {
          transform: translateY(-5px);
          box-shadow: 0 8px 30px rgba(0, 184, 248, 0.4);
        }

        .btn-recommendations,
        .btn-generate {
          background: linear-gradient(90deg, #AAE127 0%, #00A2FF 100%);
          border: none;
          font-weight: 500;
          transition: all 0.3s ease;
        }

        .btn-recommendations:hover,
        .btn-generate:hover {
          background: linear-gradient(90deg, #AAE127 0%, #00A2FF 100%);
          transform: scale(1.05);
          box-shadow: 0 4px 15px rgba(95, 232, 127, 0.3);
        }
      `}</style>
    </div>
  );
};

export default StatsCards;