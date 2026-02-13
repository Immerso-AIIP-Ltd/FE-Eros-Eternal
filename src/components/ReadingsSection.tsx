// src/components/ReadingsSection.tsx
import React from "react";
import { useNavigate } from "react-router-dom";
import aibot from "../aibot.png";
import starsIcon from "../Rectangle.png";
import peopleIcon from "../age.png";
import heartIcon from "../healemoji.png";
import fileIcon from "../reports.png";

export const ReadingsSection: React.FC = () => {
  const navigate = useNavigate();

const readings = [
    {
      image: starsIcon,
      title: "Vibrational Frequency Intelligence System",
      description: "",
      backgroundColor: "#1e2123",
      textColor: "#fff",
      path: "/vibrational-frequency", // go here
    },
    {
      image: peopleIcon,
      title: "Eternal Biological Age Tracker",
      description: "(Analysis, Scan, etc)",
      backgroundColor: "#1e2123",
      textColor: "#fff",
      path: "/age-tracker",
    },
    {
      image: heartIcon,
      title: "Healing",
      description: "(Food, Mantra, Herbs, rituals, etc...)",
      backgroundColor: "#1e2123",
      textColor: "#fff",
      path: "/healing",
    },
    {
      image: fileIcon,
      title: "Daily Reports",
      description: "(VF Score, Food, Mantra, Kosha, etc)",
      backgroundColor: "#1e2123",
      textColor: "#fff",
      path: "/report",
    },
    {
      image: aibot,
      title: "AI Chat",
      description: "Your Smart Spiritual Assistant",
      backgroundColor: "linear-gradient(135deg, #00b8f8 0%, #87ceeb 100%)",
      textColor: "#ffffff",
      isSpecial: true,
      path: "/ai-chat",
    },
  ];

  return (
    <div>
      <div style={{ marginBottom: "24px" }}>
        <h2
          style={{
            fontSize: "18px",
            fontWeight: "600",
            color: "white",
            margin: "0",
            fontFamily:
              '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
          }}
        >
          Get the readings now!
        </h2>
      </div>

      {/* Horizontal scroll container */}
      <div
        style={{
          display: "flex",
          gap: "16px",
          overflowX: "auto",
          paddingBottom: "10px",
        }}
      >
        {readings.map((reading, index) => (
          <div
            key={index}
            className="flex-fill"
            style={{
              position: "relative",
              width: "280px",
              height: "242px",
              background: reading.backgroundColor,
              borderRadius: "12px",
              border: "1px solid #333",
              padding: "16px",
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
              cursor: reading.locked ? "default" : "pointer",
              transition: "transform 0.2s ease, box-shadow 0.2s ease",
              boxShadow: "0 2px 8px rgba(0, 0, 0, 0.3)",
            }}
            onMouseEnter={(e) => {
              if (!reading.locked) {
                e.currentTarget.style.transform = "translateY(-2px)";
                e.currentTarget.style.boxShadow = "0 4px 16px rgba(0, 0, 0, 0.4)";
              }
            }}
            onMouseLeave={(e) => {
              if (!reading.locked) {
                e.currentTarget.style.transform = "translateY(0)";
                e.currentTarget.style.boxShadow = "0 2px 8px rgba(0, 0, 0, 0.3)";
              }
            }}
            onClick={() => {
              if (!reading.locked) {
                navigate(reading.path);
              }
            }}
          >
            {/* Icon */}
            <div
              style={{
                position: "absolute",
                top: "12px",
                right: "12px",
                width: "32px",
                height: "32px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <img
                src={reading.image}
                alt={reading.title}
                style={{
                  width: "50px",
                  height: "50px",
                  objectFit: "contain",
                  filter: reading.isSpecial ? "none" : "brightness(0.8)",
                  opacity: reading.locked ? 0.7 : 1,
                }}
              />
            </div>

            {/* Text */}
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                justifyContent: "flex-end",
                height: "100%",
                paddingRight: "40px",
                zIndex: 1,
              }}
            >
              <div
                style={{
                  fontSize: reading.isSpecial ? "18px" : "16px",
                  fontWeight: reading.isSpecial ? "700" : "600",
                  color: reading.textColor,
                  lineHeight: "1.3",
                  marginBottom: reading.description ? "4px" : "0",
                  fontFamily:
                    '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
                  opacity: reading.locked ? 0.8 : 1,
                }}
              >
                {reading.title}
              </div>
              {reading.description && (
                <div
                  style={{
                    fontSize: "14px",
                    color:
                      reading.textColor === "#000"
                        ? "rgba(0, 0, 0, 0.7)"
                        : "rgba(255, 255, 255, 0.7)",
                    lineHeight: "1.2",
                    opacity: reading.locked ? 0.8 : 1,
                  }}
                >
                  {reading.description}
                </div>
              )}
            </div>

            {/* 🔒 Lock Overlay (Only if locked) */}
            {reading.locked && (
              <div
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  background: 'linear-gradient(180deg, rgba(0,0,0,0.2) 0%, rgba(0,0,0,0.8) 100%)',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'center',
                  alignItems: 'center',
                  textAlign: 'center',
                  color: 'white',
                  borderRadius: '12px',
                  zIndex: 10,
                }}
              >
                <i
                  className="bi bi-lock-fill"
                  style={{
                    fontSize: '2rem',
                    color: '#ccc',
                    marginBottom: '8px',
                  }}
                ></i>
                <p
                  style={{
                    fontSize: '0.95rem',
                    fontWeight: 500,
                    margin: 0,
                    lineHeight: 1.4,
                    padding: '0 16px',
                  }}
                >
                 Coming Soon
                </p>
              </div>
            )}

            {/* Special Background (Behind lock) */}
            {reading.isSpecial && !reading.locked && (
              <div
                style={{
                  position: "absolute",
                  top: "0",
                  left: "0",
                  right: "0",
                  bottom: "0",
                  borderRadius: "12px",
                  background: "linear-gradient(135deg, #00b8f8 0%, #ffffff 100%)",
                  zIndex: -1,
                }}
              />
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default ReadingsSection;