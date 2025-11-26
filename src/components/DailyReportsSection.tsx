// src/components/DailyReportsSection.tsx
import React from "react";
import { useNavigate } from "react-router-dom";
import fileIcon from "../L-File.png";

export const DailyReportsSection: React.FC = () => {
  const navigate = useNavigate();
const reports = [
  { title: "Frequency Alignment Report", icon: fileIcon, reportType: "vibrational_frequency" },
  { title: "Aura Profile", icon: fileIcon, reportType: "aura_profile" },
  // { title: "Star Map", icon: fileIcon, reportType: "star_map" },
   { title: "Birth Chart", icon: fileIcon, reportType: "star_map" },
  { title: "Kosha Map", icon: fileIcon, reportType: "kosha_map" },
  { title: "Flame Score", icon: fileIcon, reportType: "flame_score" },
  { title: "Longevity Blueprint", icon: fileIcon, reportType: "longevity_blueprint" },
];

  return (
    <div
      style={{
        padding: "20px 0",
        backgroundColor: "#000",
        fontFamily:
          '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      }}
    >
      {/* Header */}
      <div style={{ marginBottom: "20px" }}>
        <h2
          style={{
            fontSize: "18px",
            fontWeight: "600",
            color: "#ffffff",
            margin: "0",
            letterSpacing: "-0.02em",
          }}
        >
          Your Soul Reports
        </h2>
      </div>

      {/* Cards Container */}
      <div
        className="daily-reports-container"
        style={{
          display: "flex",
          gap: "12px",
          overflowX: "auto",
          paddingBottom: "8px",
          paddingLeft: "2px",
          paddingRight: "2px",
          scrollbarWidth: "thin",
          msOverflowStyle: "none",
          WebkitOverflowScrolling: "touch",
        }}
      >
        {reports.map((report, index) => (
          <div
            key={index}
            className="daily-report-card"
            style={{
              // Mobile: fixed size
              minWidth: "260px",
              width: "280px",
              height: "178px",
              backgroundColor: "#2a2d30",
              borderRadius: "12px",
              border: "1px solid #3a3d40",
              padding: "16px",
              position: "relative",
              cursor: "pointer",
              transition: "all 0.2s ease",
              overflow: "hidden",
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = "#353a3e";
              e.currentTarget.style.borderColor = "#4a4f53";
              e.currentTarget.style.transform = "translateY(-2px)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = "#2a2d30";
              e.currentTarget.style.borderColor = "#3a3d40";
              e.currentTarget.style.transform = "translateY(0)";
            }}
            onClick={() => {
  navigate(`/chat?reportType=${report.reportType}&title=${encodeURIComponent(report.title)}`);
}}
          >
            {/* File Icon - Top Right */}
            <div
              style={{
                position: "absolute",
                top: "0",
                right: "0",
                width: "48px",
                height: "48px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                backgroundColor: "rgba(189, 181, 181, 0.1)",
                borderRadius: "0 0 0 30px",
              }}
            >
              <img
                src={report.icon}
                alt="File Icon"
                style={{
                  width: "30px",
                  height: "48px",
                  objectFit: "contain",
                }}
              />
            </div>

            {/* Title - Bottom Left */}
            <div
              style={{
                alignSelf: "flex-start",
                marginTop: "auto",
                paddingRight: "56px",
              }}
            >
              <h3
                style={{
                  fontSize: "16px",
                  fontWeight: "500",
                  color: "#ffffff",
                  margin: "0",
                  lineHeight: "1.3",
                  textAlign: "left",
                  whiteSpace: "normal",
                  wordBreak: "break-word",
                }}
              >
                {report.title}
              </h3>
            </div>
          </div>
        ))}
      </div>

      {/* Responsive Styles */}
      <style >{`
        .daily-reports-container {
          scroll-behavior: smooth;
        }

        /* Hide scrollbar but keep functionality */
        .daily-reports-container::-webkit-scrollbar {
          height: 4px;
        }
        .daily-reports-container::-webkit-scrollbar-track {
          background: rgba(255, 255, 255, 0.05);
          border-radius: 2px;
        }
        .daily-reports-container::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.2);
          border-radius: 2px;
        }
        .daily-reports-container::-webkit-scrollbar-thumb:hover {
          background: rgba(255, 255, 255, 0.3);
        }
        .daily-reports-container {
          scrollbar-width: thin;
          scrollbar-color: rgba(255, 255, 255, 0.2) rgba(255, 255, 255, 0.05);
        }

        /* Desktop: Use CSS Grid to fill full width */
        @media (min-width: 1024px) {
          .daily-reports-container {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
            gap: 16px;
            overflow-x: hidden;
            padding: 0;
          }

          .daily-report-card {
            width: 100% !important;
            min-width: 0;
            height: 180px;
            transition: all 0.2s ease;
          }
        }

        @media (min-width: 768px) and (max-width: 1023px) {
          .daily-reports-container {
            gap: 14px;
          }
          .daily-report-card {
            width: 270px;
            height: 175px;
          }
        }

        @media (max-width: 767.98px) {
          .daily-reports-container {
            gap: 12px;
            padding-left: 2px;
            padding-right: 2px;
          }
          .daily-report-card {
            min-width: 260px;
            width: 280px;
            height: 178px;
          }
          .daily-report-card h3 {
            font-size: 15px;
          }
        }
      `}</style>
    </div>
  );
};

export default DailyReportsSection;