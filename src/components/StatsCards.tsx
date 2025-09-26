import React, { useState, useEffect } from "react";
import { useNavigate } from 'react-router-dom';

import "bootstrap/dist/css/bootstrap.min.css";
import "./StatsCard.css";
import fire from "../Fire.webm";
import gym from "../Gym dubble.webm";
import vibe from '../vibe.webm';
import star from '../starmap.webm'
import crystal from "../Magic Crystal Ball.webm";
import galaxy from "../galaxy.webm"
import ArrowForwardIosIcon from "@mui/icons-material/ArrowForwardIos";

const StatsCards = () => {
  const navigate = useNavigate();
  const [reportStatuses, setReportStatuses] = useState({});
  const [loading, setLoading] = useState(true);

  const userId = localStorage.getItem('userId') || localStorage.getItem('user_id');
  const baseApiUrl = "http://eros-eternal.runai-project-immerso-innnovation-venture-pvt.inferencing.shakticloud.ai/api/v1/reports/individual_report/";

  const reportCards = [
    {
      id: 1,
      title: "Vibrational Frequency",
      iconVideo: vibe,
      route: "/vibrational-frequency",
      reportType: "vibrational_frequency"

    },
    {
      id: 2,
      title: "Star Map",
      iconVideo: galaxy,
      route: "/star-map",
      reportType: "star_map"

    },
    {
      id: 3,
      title: "Flame Score",
      iconVideo: fire,
      route: "/flame-score",
      reportType: "flame_score"
    },
    {
      id: 4,
      title: "Aura Profile",
      iconVideo: crystal,
      route: "/aura-profile",
      reportType: "aura_profile"
    },
    {
      id: 5,
      title: "Kosha Map",
      iconVideo: star,
      route: "/kosha-map",
      reportType: "kosha_map"

    },
    {
      id: 6,
      title: "Longevity Blueprint",
      iconVideo: gym,
      route: "/longevity-blueprint",
      reportType: "longevity_blueprint"
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
              `${baseApiUrl}?user_id=${userId}&report_type=${card.reportType}`
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
    <div className="container-fluid p-0 m-0">
      <div className="header mb-4">
        <h1 className="text-white mb-1" style={{ fontFamily: "Poppins" }}>
          Your Soul Reports Hub
        </h1>
        <p className="text-white mb-0" style={{ fontFamily: "Poppins" }}>
          Tap any card to generate your personalized report
        </p>
      </div>

      <div className="row g-4">
        {reportCards.map((card) => {
          const hasReport = reportStatuses[card.reportType];

          return (
            <div key={card.id} className="col-md-6 mb-4">
              <div
                className="card border-0 rounded-4 shadow-lg bg-dark hover-card top-outline-primary custom-top-border"
                onClick={(e) => handleCardClick(card, e)}
                style={{
                  borderImage:
                    "linear-gradient(113.64deg, #0061FF 7.83%, #60EFFF 100.26%) 1",
                  borderTop: "3px solid transparent",
                  borderRadius: "18px",
                  cursor: "pointer",
                }}
              >
                <div
                  className="card-body p-4"
                  style={{
                    borderImage:
                      "linear-gradient(113.64deg, #0061FF 7.83%, #60EFFF 100.26%) 1",
                    borderTop: "3px solid transparent",
                    borderRadius: "18px",
                  }}
                >
                  <div className="d-flex justify-content-between align-items-start mb-3">
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
                  </div>

                  <h5
                    className="card-title text-white mb-2"
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
                    style={{ color: "#00B8F8", fontFamily: "Inter" }}
                  >
                    {hasReport ? "View Report" : "Report"}
                  </p>

                  <button
                    className={`btn btn-outline-primary btn-sm text-white rounded-pill px-4 ${hasReport ? "border-blue-500" : ""
                      }`}
                    onClick={() => handleButtonClick(card)}
                    style={{ fontFamily: "Poppins" }}
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
        .top-outline-primary {
          box-shadow: 0 -2px 0 0 #0d6efd;
          border-top-left-radius: 0.5rem;
          border-top-right-radius: 0.5rem;
        }

        .hover-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 15px rgba(0, 0, 0, 0.3);
        }

        .custom-top-border {
          border: #0d6efd;
        }
      `}</style>
    </div>
  );
};

export default StatsCards;