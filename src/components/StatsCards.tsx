import React from "react";
import { useNavigate } from "react-router-dom"; // <-- Import useNavigate
import "bootstrap/dist/css/bootstrap.min.css";
import "./StatsCard.css";
import fire from "../Fire.webm";
import gym from "../Gym dubble.webm";
import crystal from "../Magic Crystal Ball.webm";
import ArrowForwardIosIcon from "@mui/icons-material/ArrowForwardIos";

const StatsCards = () => {
  const navigate = useNavigate();

  const reportCards = [
    {
      id: 1,
      title: "Vibrational Frequency",
      subtitle: "View Report",
      action: "Recommendations",
      iconVideo: fire,
      type: "report",
      path: "/vibrational-frequency", // 👈 Path for navigation
    },
    {
      id: 2,
      title: "Star Map",
      subtitle: "Report",
      action: "Generate Report",
      iconVideo: crystal,
      type: "generate",
      path: "/star-map",
    },
    {
      id: 3,
      title: "Flame Score",
      subtitle: "View Report",
      action: "Recommendations",
      iconVideo: fire,
      type: "report",
      path: "/flame-score",
    },
    {
      id: 4,
      title: "Aura Profile",
      subtitle: "Report",
      action: "Generate Report",
      iconVideo: crystal,
      type: "generate",
      path: "/aura-profile",
    },
    {
      id: 5,
      title: "Kosha Map",
      subtitle: "View Report",
      action: "Recommendations",
      iconVideo: crystal,
      type: "report",
      path: "/kosha-map",
    },
    {
      id: 6,
      title: "Longevity Blueprint",
      subtitle: "Report",
      action: "Generate Report",
      iconVideo: gym,
      type: "generate",
      path: "/longevity-blueprint",
    },
  ];

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
        {reportCards.map((card) => (
          <div key={card.id} className="col-md-6 mb-4">
            <div className="card border-0 rounded-4 shadow-lg bg-dark hover-card top-outline-primary custom-top-border">
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
                  {card.subtitle}
                </p>

                <button
                  className={`btn btn-outline-primary btn-sm text-white rounded-pill px-4 ${
                    card.type === "report" ? "border-blue-500" : ""
                  }`}
                  onClick={() => navigate(card.path)} // 👈 navigate instead of alert
                  style={{ fontFamily: "Poppins" }}
                >
                  {card.action}
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      <style jsx>{`
        .top-outline-primary {
          box-shadow: 0 -2px 0 0 #0d6efd;
          border-top-left-radius: 0.5rem;
          border-top-right-radius: 0.5rem;
        }

        .hover-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 15px rgba(0, 0, 0, 0.3);
        }
      `}</style>
    </div>
  );
};

export default StatsCards;
