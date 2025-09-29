// src/components/Header.tsx
import React, { useState, } from "react";
import { useNavigate } from 'react-router-dom';
import headerBg from "../header-bg.png"; // Ensure this path is correct

export const Header: React.FC = () => {
  const navigate = useNavigate();
  const [chartUrls, setChartUrls] = useState({
    rasi: "",
    navamsha: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fetchAstrologyData = async () => {
    try {
      // Get data from localStorage
      const placeOfBirth =
        localStorage.getItem("place_of_birth") || "Chennai, India";
      const dateOfBirth = localStorage.getItem("date_of_birth") || "07/04/2002"; // Format: MM/DD/YYYY
      const timeOfBirth = localStorage.getItem("time_of_birth") || "01:55";

      const timezone = "5:30";

      // Validate required fields
      if (!placeOfBirth || !dateOfBirth || !timeOfBirth) {
        alert("Missing birth details. Please complete your profile first.");
        return;
      }

      const payload = {
        location: placeOfBirth,
        dob: dateOfBirth,
        tob: timeOfBirth,
        timezone: timezone,
      };

      const response = await fetch(
        `http://eros-eternal.runai-project-immerso-innnovation-venture-pvt.inferencing.shakticloud.ai/api/v1/vedastro/get_astrology_data`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.message || "Failed to fetch astrology data");
      }

      // Extract chart URLs
      const { rasiChart, navamshaChart } = result.data.chartImages;

      // Navigate to chart page or show modal — here we'll open in new tab for demo
      window.open(rasiChart, "_blank");
      window.open(navamshaChart, "_blank");

      // Optional: Show success message
      alert("Charts loaded successfully!");
    } catch (err) {
      console.error("Error fetching astrology data:", err);
      alert(`Error: ${err instanceof Error ? err.message : "Unknown error"}`);
    }
  };

  const username = localStorage.getItem('username') || 'Guest';
  return (
    <div
      style={{
        width: "100%",
        height: "40vh", // Full viewport height
        backgroundImage: `url(${headerBg})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        alignItems: "center",
        position: "relative",
        overflow: "hidden",
        fontFamily:
          '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      }}
    >
      {/* Background Overlay */}
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: "rgba(0, 0, 0, 0.4)",
          zIndex: 1,
        }}
      />

      {/* Additional Atmospheric Gradient Overlay */}
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background:
            "linear-gradient(180deg, rgba(0, 26, 60, 0.3) 0%, rgba(5, 5, 5, 0.6) 100%)",
          zIndex: 1,
          pointerEvents: "none",
        }}
      />

      {/* Main Content */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: "16px",
          zIndex: 2,
          textAlign: "center",
          padding: "0 2rem",
          flex: 1,
          justifyContent: "center",
        }}
      >
        {/* Title */}
        <h1
          style={{
            fontSize: "4rem",
            fontWeight: "700",
            background: "linear-gradient(90deg, #AAE127 0%, #00A2FF 100%)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            backgroundClip: "text",
            margin: 0,
            lineHeight: 1,
            letterSpacing: "-0.02em",
            textShadow: "0 0 20px rgba(170, 225, 39, 0.3)",
            fontFamily: "Poppins",
          }}
        >
          Eternal
        </h1>

        {/* How it works Button */}
        <button
          style={{
            backgroundColor: "#00b8f8",
            color: "#ffffff",
            border: "none",
            borderRadius: "24px",
            padding: "10px 20px",
            fontSize: "14px",
            fontWeight: "600",
            cursor: "pointer",
            transition: "all 0.2s ease",
            boxShadow: "0 4px 12px rgba(0, 184, 248, 0.3)",
            outline: "none",
            fontFamily: "Poppins",
            width: "100%",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = "#0099d9";
            e.currentTarget.style.transform = "translateY(-1px)";
            e.currentTarget.style.boxShadow =
              "0 6px 16px rgba(0, 184, 248, 0.4)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = "#00b8f8";
            e.currentTarget.style.transform = "translateY(0)";
            e.currentTarget.style.boxShadow =
              "0 4px 12px rgba(0, 184, 248, 0.3)";
          }}
          onMouseDown={(e) => {
            e.currentTarget.style.transform = "translateY(0)";
          }}
          onMouseUp={(e) => {
            e.currentTarget.style.transform = "translateY(-1px)";
          }}
        >
          How it works
        </button>

        {/* Subtitle */}
        <div
          style={{
            fontSize: "14px",
            color: "rgba(255, 255, 255, 0.7)",
            fontWeight: "500",
            margin: 0,
            fontFamily: "Poppins",
          }}
        >
          Get started with
        </div>
      </div>

      {/* Welcome Card */}
      <div
        style={{
          width: "100%",
          // maxWidth: '1200px',
          padding: "2rem",
          backgroundColor: "rgba(25, 70, 160, 0.8)",
          backdropFilter: "blur(10px)",
          border: "1px solid rgba(255, 255, 255, 0.1)",
          borderRadius: "24px",
          display: "flex",
          alignItems: "flex-start",
          gap: "16px",
          marginTop: "auto",
          marginBottom: "2rem",
          zIndex: 2,
          boxShadow: "0 8px 32px rgba(0, 0, 0, 0.2)",
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* Grid Pattern Background */}
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background:
              "repeating-linear-gradient(45deg, transparent, transparent 10px, rgba(255, 255, 255, 0.05) 10px, rgba(255, 255, 255, 0.05) 20px)",
            pointerEvents: "none",
            opacity: 0.3,
          }}
        />

        {/* Avatar */}
        <div
          style={{
            width: "48px",
            height: "48px",
            borderRadius: "50%",
            backgroundColor: "#00b8f8",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "white",
            fontSize: "1.2rem",
            fontWeight: "bold",
            boxShadow: "0 4px 12px rgba(0, 184, 248, 0.3)",
          }}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="currentColor"
            width="20"
            height="20"
          >
            <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" />
          </svg>
        </div>

        {/* Text Content */}
        <div style={{ flex: 1 }}>
          <h2
            style={{
              fontSize: "1.5rem",
              fontWeight: "600",
              color: "white",
              margin: "0 0 8px 0",
              fontFamily: "Poppins",
            }}
          >
            Welcome, {username}
          </h2>

          <p
            style={{
              fontSize: "1rem",
              color: "rgba(255, 255, 255, 0.9)",
              margin: "0 0 12px 0",
              lineHeight: 1.5,
              fontFamily: "Poppins",
            }}
          >
            "Your aura is a map, your spirit a compass — step into Eternal and
            unlock the blueprint of your infinite journey."
          </p>
          <button
            style={{
              backgroundColor: "rgba(255, 255, 255, 0.9)",
              color: "#00b8f8",
              border: "1px solid rgba(255, 255, 255, 0.3)",
              borderRadius: "20px",
              padding: "8px 16px",
              fontSize: "0.875rem",
              fontWeight: "500",
              cursor: "pointer",
              transition: "all 0.2s ease",
              outline: "none",
              fontFamily: "Poppins",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor =
                "rgba(255, 255, 255, 0.3)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor =
                "rgba(255, 255, 255, 0.2)";
            }}
            // onClick={fetchAstrologyData}
            onClick={() => navigate('/rasi-chart')}
          >
            View Your Rasi Chart
          </button>

          {loading && (
            <div
              style={{
                textAlign: "center",
                padding: "20px",
                color: "#00b8f8",
                fontSize: "1rem",
                fontWeight: "500",
              }}
            >
              🌀 Fetching your Rasi & Navamsha charts...
            </div>
          )}

          {error && (
            <div
              style={{
                backgroundColor: "#ffcccc",
                color: "#cc0000",
                padding: "12px",
                borderRadius: "8px",
                margin: "10px 0",
                textAlign: "center",
                fontSize: "0.9rem",
              }}
            >
              ❌ {error}
            </div>
          )}

          {chartUrls.rasi && (
            <div
              style={{
                display: "flex",
                gap: "20px",
                flexWrap: "wrap",
                justifyContent: "center",
                marginTop: "20px",
                padding: "20px",
                backgroundColor: "#0a0a0a", // Dark background like your screenshot
                borderRadius: "12px",
              }}
            >
              {/* Rasi Chart */}
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  width: "400px",
                  backgroundColor: "#121212",
                  border: "2px solid #00b8f8",
                  borderRadius: "12px",
                  padding: "16px",
                  boxShadow: "0 4px 12px rgba(0, 184, 248, 0.1)",
                  position: "relative",
                }}
              >
                <h3
                  style={{
                    color: "#ffffff",
                    fontSize: "1.2rem",
                    marginBottom: "4px",
                    fontWeight: "600",
                  }}
                >
                  Rasi Chart
                </h3>
                <p
                  style={{
                    color: "#aaaaaa",
                    fontSize: "0.85rem",
                    marginBottom: "16px",
                  }}
                >
                  Individual Chart
                </p>
                <img
                  src={chartUrls.rasi}
                  alt="Rasi D1 Chart"
                  style={{
                    maxWidth: "100%",
                    maxHeight: "500px",
                    objectFit: "contain",
                    borderRadius: "8px",
                    border: "1px solid #333",
                    backgroundColor: "#0d0d0d",
                  }}
                />
                <div
                  style={{
                    position: "absolute",
                    bottom: "10px",
                    right: "10px",
                    display: "flex",
                    gap: "6px",
                  }}
                >
                  <button
                    style={{
                      backgroundColor: "#222",
                      color: "#fff",
                      border: "1px solid #444",
                      borderRadius: "4px",
                      padding: "4px 8px",
                      cursor: "pointer",
                      fontSize: "0.75rem",
                    }}
                    onClick={() => window.open(chartUrls.rasi, "_blank")}
                  >
                    ↗️
                  </button>
                  <button
                    style={{
                      backgroundColor: "#222",
                      color: "#fff",
                      border: "1px solid #444",
                      borderRadius: "4px",
                      padding: "4px 8px",
                      cursor: "pointer",
                      fontSize: "0.75rem",
                    }}
                    onClick={() => {
                      const link = document.createElement("a");
                      link.href = chartUrls.rasi;
                      link.download = "rasi_chart.png";
                      link.click();
                    }}
                  >
                    ⬇️
                  </button>
                </div>
              </div>

              {/* Navamsha Chart */}
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  width: "400px",
                  backgroundColor: "#121212",
                  border: "2px solid #00b8f8",
                  borderRadius: "12px",
                  padding: "16px",
                  boxShadow: "0 4px 12px rgba(0, 184, 248, 0.1)",
                  position: "relative",
                }}
              >
                <h3
                  style={{
                    color: "#ffffff",
                    fontSize: "1.2rem",
                    marginBottom: "4px",
                    fontWeight: "600",
                  }}
                >
                  Navamsha Chart
                </h3>
                <p
                  style={{
                    color: "#aaaaaa",
                    fontSize: "0.85rem",
                    marginBottom: "16px",
                  }}
                >
                  Life Partner Chart
                </p>
                <img
                  src={chartUrls.navamsha}
                  alt="Navamsha D9 Chart"
                  style={{
                    maxWidth: "100%",
                    maxHeight: "500px",
                    objectFit: "contain",
                    borderRadius: "8px",
                    border: "1px solid #333",
                    backgroundColor: "#0d0d0d",
                  }}
                />
                <div
                  style={{
                    position: "absolute",
                    bottom: "10px",
                    right: "10px",
                    display: "flex",
                    gap: "6px",
                  }}
                >
                  <button
                    style={{
                      backgroundColor: "#222",
                      color: "#fff",
                      border: "1px solid #444",
                      borderRadius: "4px",
                      padding: "4px 8px",
                      cursor: "pointer",
                      fontSize: "0.75rem",
                    }}
                    onClick={() => window.open(chartUrls.navamsha, "_blank")}
                  >
                    ↗️
                  </button>
                  <button
                    style={{
                      backgroundColor: "#222",
                      color: "#fff",
                      border: "1px solid #444",
                      borderRadius: "4px",
                      padding: "4px 8px",
                      cursor: "pointer",
                      fontSize: "0.75rem",
                    }}
                    onClick={() => {
                      const link = document.createElement("a");
                      link.href = chartUrls.navamsha;
                      link.download = "navamsha_chart.png";
                      link.click();
                    }}
                  >
                    ⬇️
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Header;
