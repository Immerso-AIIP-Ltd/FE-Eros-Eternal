// src/components/Header.tsx
import React, { useState } from "react";
import { useNavigate } from 'react-router-dom';
import HeaderBg from "../assets/background.png";
import ProfileBg from "../assets/profileBg.png";

export const Header: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const username = localStorage.getItem('username') || 'Guest';

  return (
    <div
      style={{
        width: "100%",
        minHeight: "40vh",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
        position: "relative",
        overflow: "hidden",
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        padding: "0",
        margin: "0",
      }}
    >
      {/* Background Image Layer */}
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundImage: `url('${HeaderBg}')`,
          transform: "scaleY(-1)",
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundRepeat: "no-repeat",
          zIndex: 0,
        }}
      />

      {/* Dark Overlay */}
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: "rgba(0, 0, 0, 0.7)",
          zIndex: 1,
        }}
      />

      {/* Bottom Fade Overlay */}
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: "linear-gradient(180deg, transparent 0%, transparent 50%, rgba(0, 0, 0, 0.4) 70%, rgba(0, 0, 0, 0.8) 90%, rgba(0, 0, 0, 1) 100%)",
          zIndex: 1,
        }}
      />

      {/* Main Content Container */}
      <div
        style={{
          width: "100%",
          // maxWidth: "1400px",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: "50px",
          zIndex: 2,
          padding: "0 1rem",
        }}
      >
        {/* Top Section - Title and Button */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: "18px",
            textAlign: "center",
          }}
        >
          {/* Title */}
          <h1
            style={{
              fontSize: "clamp(2.5rem, 8vw, 3rem)",
              fontWeight: "700",
              background: "linear-gradient(90deg, #AAE127 0%, #00A2FF 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
              margin: 0,
              lineHeight: 1,
              letterSpacing: "-0.02em",
              fontFamily: "Poppins, sans-serif",
            }}
          >
            {/* Eternal */}
            EROS Wellness
          </h1>

          {/* How it works Button */}
          {/* <button
            style={{
              backgroundColor: "#00b8f8",
              color: "#ffffff",
              border: "none",
              borderRadius: "30px",
              padding: "11px 30px",
              fontSize: "14px",
              fontWeight: "600",
              cursor: "pointer",
              transition: "all 0.2s ease",
              boxShadow: "0 4px 20px rgba(0, 184, 248, 0.4)",
              outline: "none",
              fontFamily: "Poppins, sans-serif",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = "#0099d9";
              e.currentTarget.style.transform = "translateY(-2px)";
              e.currentTarget.style.boxShadow = "0 6px 24px rgba(0, 184, 248, 0.5)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = "#00b8f8";
              e.currentTarget.style.transform = "translateY(0)";
              e.currentTarget.style.boxShadow = "0 4px 20px rgba(0, 184, 248, 0.4)";
            }}
          >
            How it works
          </button> */}

          {/* Subtitle */}
          {/* <div
            style={{
              fontSize: "14px",
              color: "rgba(255, 255, 255, 0.75)",
              fontWeight: "400",
              margin: 0,
              fontFamily: "Poppins, sans-serif",
            }}
          >
            Get started with
          </div> */}
        </div>

        {/* Welcome Card */}
        <div
          style={{
            width: "100%",
            maxWidth: "100%",
            padding: "0",
            backgroundColor: "transparent",
            border: "1px solid rgba(255, 255, 255, 0.15)",
            borderRadius: "20px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: "0",
            zIndex: 2,
            boxShadow: "0 8px 32px rgba(0, 0, 0, 0.4)",
            position: "relative",
            overflow: "hidden",
            minHeight: "clamp(200px, 30vh, 200px)",
            marginBottom: "clamp(60px, 10vh, 80px)",
          }}
        >
          {/* Background Image for Card - Responsive */}
          <div
            style={{
              position: "absolute",
              top: "-150%",
              left: 0,
              right: 0,
              bottom: 0,
              backgroundImage: `url('${ProfileBg}')`,
              backgroundSize: "cover",
              backgroundPosition: "center",
              backgroundRepeat: "no-repeat",
              zIndex: 0,
            }}
          />

          {/* Dark gradient overlay for card */}
          <div
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: "linear-gradient(90deg, rgba(0, 0, 0, 0.4) 0%, transparent 100%)",
              zIndex: 1,
            }}
          />

          {/* Text Content - Left Side */}
          <div
            style={{
              zIndex: 2,
              position: "relative",
              padding: "clamp(20px, 4vw, 40px) clamp(25px, 5vw, 50px)",
              display: "flex",
              flexDirection: "column",
              gap: "10px",
              flex: "0 0 auto",
              maxWidth: "100%",
            }}
          >
            <h2
              style={{
                fontSize: "clamp(1.5rem, 4vw, 2.3rem)",
                fontWeight: "600",
                color: "white",
                margin: 0,
                fontFamily: "Poppins, sans-serif",
                lineHeight: 1.2,
                wordBreak: "break-word",
              }}
            >
              Welcome, {username}
            </h2>

            <p
              style={{
                fontSize: "clamp(1.2rem, 2vw, 0.95rem)",
                color: "rgba(255, 255, 255, 0.9)",
                margin: 0,
                lineHeight: 1.5,
                fontFamily: "Poppins, sans-serif",
              }}
            >
              "Reset starts with one mindful minute"
            </p>

            {loading && (
              <div
                style={{
                  color: "#00b8f8",
                  fontSize: "0.9rem",
                  fontWeight: "500",
                  marginTop: "8px",
                }}
              >
                🌀 Loading...
              </div>
            )}

            {error && (
              <div
                style={{
                  backgroundColor: "#ffcccc",
                  color: "#cc0000",
                  padding: "12px",
                  borderRadius: "8px",
                  fontSize: "0.9rem",
                  marginTop: "8px",
                }}
              >
                ❌ {error}
              </div>
            )}
          </div>
        </div>

        {/* Button - Below the Card, Right Aligned */}
        <div
          style={{
            width: "100%",
            display: "flex",
            justifyContent: "flex-end",
            position: "relative",
            marginTop: "clamp(-150px, -15vh, -160px)",
            zIndex: 3,
            paddingRight: "clamp(20px, 4vw, 40px)",
          }}
        >
          <button
            style={{
              background: "linear-gradient(135deg, #AAE127 0%, #00A2FF 100%)",
              color: "white",
              border: "none",
              borderRadius: "12px",
              padding: "clamp(12px, 2vh, 16px) clamp(24px, 4vw, 40px)",
              fontSize: "clamp(0.875rem, 2vw, 1rem)",
              fontWeight: "600",
              cursor: "pointer",
              transition: "all 0.3s ease",
              outline: "none",
              fontFamily: "Poppins, sans-serif",
              boxShadow: "0 4px 20px rgba(170, 225, 39, 0.3)",
              whiteSpace: "nowrap",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = "translateY(-2px)";
              e.currentTarget.style.boxShadow = "0 6px 24px rgba(170, 225, 39, 0.5)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = "translateY(0)";
              e.currentTarget.style.boxShadow = "0 4px 20px rgba(170, 225, 39, 0.3)";
            }}
            onClick={() => navigate('/rasi-chart')}
          >
            View Rasi Charts
          </button>
        </div>
      </div>
    </div>
  );
};

export default Header;