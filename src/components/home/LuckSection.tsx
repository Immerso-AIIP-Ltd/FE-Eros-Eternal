// src/components/LuckSection.tsx
import React, { useState, useEffect } from "react";
import moment from "moment";
// import StartlightBg from "../assets/discover/planetary.png";
// import SpiritualBg from "../assets/discover/personalMonth.jpg";
// import LuckyBg from "../assets/discover/luckyNumber.jpg";
// import StartlightBg from "../images/lightphase.png";
// import SpiritualBg from "../images/lightjournal.png";
// import LuckyBg from "../images/lightnumber.png"
import StartlightBg from "@/assets/images/horoscope.png";
import SpiritualBg from "@/assets/images/personalMonth.png";
import LuckyBg from "@/assets/images/luckyNumber.png";

interface LuckyNumbers {
  destiny_number: number;
  life_path_number: number;
  soul_number: number;
  lucky_number: number;
  soul_urge_number: number;
}

interface HoroscopeResponse {
  day: string;
  horoscope: string;
  zodiac_sign: string;
}

interface PersonalMonthResponse {
  birthdate: string;
  personal_month_number: number;
  meaning: string;
  detailed_meaning: string;
  target_date: string;
  status: number;
}

const API_URL = "http://164.52.205.108:8500";

export const LuckSection: React.FC = () => {
  const [flippedIndexes, setFlippedIndexes] = useState<Set<number>>(new Set());
  const [luckyNumbers, setLuckyNumbers] = useState<LuckyNumbers | null>(null);
  const [horoscope, setHoroscope] = useState<HoroscopeResponse | null>(null);
  const [personalMonth, setPersonalMonth] = useState<PersonalMonthResponse | null>(null);
  const [loading, setLoading] = useState<Record<number, boolean>>({});
  const [error, setError] = useState<Record<number, string>>({});
  const [hoveredCard, setHoveredCard] = useState<number | null>(null);

  const userId = localStorage.getItem("user_id");
  const username = localStorage.getItem("username");
  const dob = localStorage.getItem("date_of_birth");
  const hasUserData = userId && username && dob;

  const setLoadingState = (index: number, isLoading: boolean) => {
    setLoading((prev) => ({ ...prev, [index]: isLoading }));
  };

  const setErrorState = (index: number, message: string) => {
    setError((prev) => ({ ...prev, [index]: message }));
  };

  const formatDob = (dobStr: string) => {
    const [day, month, year] = dobStr.split("-");
    const formattedDob = `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
    return moment(formattedDob).format("YYYY-MM-DD");
  };

  useEffect(() => {
    const fetchHoroscope = async () => {
      const index = 0;
      if (!hasUserData) { setErrorState(index, "User data missing."); return; }
      setLoadingState(index, true);
      setErrorState(index, "");
      try {
        const formData = new FormData();
        formData.append("user_id", userId);
        formData.append("user_name", username);
        if (dob) formData.append("dob", formatDob(dob));
        const response = await fetch(`${API_URL}/api/v1/numerology/planetary_horoscope`, { method: "POST", body: formData });
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const data = await response.json();
        if (data.success && data.data) setHoroscope(data.data);
        else setErrorState(index, "No horoscope available.");
      } catch (err) {
        console.error("Horoscope Error:", err);
        setErrorState(index, "Failed to load horoscope.");
      } finally { setLoadingState(index, false); }
    };
    fetchHoroscope();
  }, [hasUserData, userId, username, dob]);

  useEffect(() => {
    const fetchPersonalMonth = async () => {
      const index = 1;
      if (!hasUserData) { setErrorState(index, "User data missing."); return; }
      setLoadingState(index, true);
      setErrorState(index, "");
      try {
        const formData = new FormData();
        formData.append("user_id", userId);
        formData.append("user_name", username);
        if (dob) formData.append("dob", formatDob(dob));
        const response = await fetch(`${API_URL}/api/v1/numerology/personal_month`, { method: "POST", body: formData });
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const data = await response.json();
        if (data.success && data.data) setPersonalMonth(data.data);
        else setErrorState(index, "No personal month data.");
      } catch (err) {
        console.error("Personal Month Error:", err);
        setErrorState(index, "Failed to load personal month.");
      } finally { setLoadingState(index, false); }
    };
    fetchPersonalMonth();
  }, [hasUserData, userId, username, dob]);

  useEffect(() => {
    const fetchLuckyNumbers = async () => {
      const index = 2;
      if (!hasUserData) { setErrorState(index, "User data missing."); return; }
      setLoadingState(index, true);
      setErrorState(index, "");
      try {
        const formData = new FormData();
        formData.append("user_id", userId);
        formData.append("user_name", username);
        if (dob) formData.append("dob", formatDob(dob));
        const response = await fetch(`${API_URL}/api/v1/numerology/lucky_numbers`, { method: "POST", body: formData });
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const result = await response.json();
        if (result.success && result.data) setLuckyNumbers(result.data);
        else setErrorState(index, "No lucky numbers found.");
      } catch (err) {
        console.error("Lucky Numbers Error:", err);
        setErrorState(index, "Failed to load lucky numbers.");
      } finally { setLoadingState(index, false); }
    };
    fetchLuckyNumbers();
  }, [hasUserData, userId, username, dob]);

  const toggleFlip = (index: number) => {
    const newFlipped = new Set(flippedIndexes);
    if (newFlipped.has(index)) newFlipped.delete(index);
    else newFlipped.add(index);
    setFlippedIndexes(newFlipped);
  };

  const luckItems = [
    { title: "Starlight Journal", subtitle: "Planetary Daily", bg: StartlightBg },
    { title: "Spiritual Phase", subtitle: "Personal Month Number", bg: SpiritualBg },
    { title: "Spiritual Numbers", subtitle: "Lucky number of the day", bg: LuckyBg },
  ];

  const renderHoroscopeBack = () => (
    <div style={backContainerStyle} className="back-scroll">
      <h4 style={backTitleStyle}>Horoscope: {horoscope?.zodiac_sign}</h4>
      {loading[0] ? <p style={loadingStyle}>Loading horoscope...</p> : error[0] ? <p style={errorStyle}>{error[0]}</p> : (
        <>
          <p style={backText}><strong>Zodiac:</strong> {horoscope?.zodiac_sign}</p>
          <p style={backQuote}>"{horoscope?.horoscope}"</p>
        </>
      )}
    </div>
  );

  const renderPersonalMonthBack = () => (
    <div style={backContainerStyle} className="back-scroll">
      <h4 style={backTitleStyle}>Personal Month: <strong>{personalMonth?.personal_month_number || "?"}</strong></h4>
      {loading[1] ? <p style={loadingStyle}>Calculating your energy...</p> : error[1] ? <p style={errorStyle}>{error[1]}</p> : personalMonth ? (
        <p style={backQuote}>"{personalMonth.detailed_meaning}"</p>
      ) : null}
    </div>
  );

  const renderLuckyNumbersBack = () => (
    <div style={backContainerStyle} className="back-scroll">
      <h4 style={backTitleStyle}>Your Numerology Numbers</h4>
      {loading[2] ? <p style={loadingStyle}>Loading numbers...</p> : error[2] ? <p style={errorStyle}>{error[2]}</p> : luckyNumbers ? (
        <>
          <p style={backText}><strong>Destiny:</strong> {luckyNumbers.destiny_number}</p>
          <p style={backText}><strong>Life Path:</strong> {luckyNumbers.life_path_number}</p>
          <p style={backText}><strong>Lucky Number:</strong> {luckyNumbers.lucky_number}</p>
          <p style={backText}><strong>Soul Urge:</strong> {luckyNumbers.soul_urge_number}</p>
          <p style={backText}><strong>Soul:</strong> {luckyNumbers.soul_number}</p>
        </>
      ) : <p style={errorStyle}>Unable to load data.</p>}
    </div>
  );

  const backContainerStyle: React.CSSProperties = {
    display: "flex", flexDirection: "column", gap: "8px",
    textAlign: "center", color: "#6b6380", fontSize: "14px",
    fontWeight: 500, lineHeight: 1.6, padding: "10px 14px",
    overflowY: "auto", maxHeight: "100%", width: "100%", boxSizing: "border-box"
  };
  const backTitleStyle: React.CSSProperties = {
    margin: "0 0 10px 0", color: "#2a2040", fontSize: "17px", fontWeight: "700",
  };
  const backText: React.CSSProperties = { margin: 0, color: "#3a3550", fontSize: "15px" };
  const backQuote: React.CSSProperties = {
    margin: "6px 0 0 0", color: "#3a3550", fontSize: "13px", textAlign: "justify", marginTop: "12px",
  };
  const loadingStyle: React.CSSProperties = { color: "#6b6380", margin: 0 };
  const errorStyle: React.CSSProperties = { color: "#e06b6b", margin: 0, fontSize: "13px" };

  return (
    <div
      style={{
        padding: "40px 0",
        backgroundColor: "#f8f8fa",
      }}
    >
      {/* Header */}
      <div style={{ marginBottom: "24px", paddingLeft: "40px", paddingRight: "40px" }}>
        <h1
          style={{
            fontSize: "24px",
            fontWeight: "700",
            color: "#2a2040",
            margin: 0,
            letterSpacing: "-0.02em",
            fontFamily: "Poppins, sans-serif",
          }}
        >
          Discover your luck
        </h1>
      </div>

      {/* Cards Container */}
      <div
        className="luck-cards-container"
        style={{
          display: "flex",
          gap: "20px",
          overflowX: "auto",
          padding: "0 40px 20px",
          scrollbarWidth: "none",
          margin: "0 auto",
        }}
      >
        {luckItems.map((item, index) => (
          <div
            key={index}
            className="flip-card"
            onClick={() => toggleFlip(index)}
            onMouseEnter={() => setHoveredCard(index)}
            onMouseLeave={() => setHoveredCard(null)}
            style={{
              minWidth: "300px",
              width: "300px",
              height: "380px",
              borderRadius: "20px",
              border: hoveredCard === index 
                ? "1px solid rgba(255,255,255,0.4)" 
                : "1px solid #e8e5ec",
              backgroundColor: hoveredCard === index 
                ? "rgba(255,255,255,0.2)" 
                : "#fff",
              position: "relative",
              cursor: "pointer",
              overflow: "hidden",
              boxShadow: hoveredCard === index
                ? "0 8px 32px rgba(0, 0, 0, 0.15), inset 0 1px 1px rgba(255,255,255,0.3)"
                : "0 4px 20px rgba(0, 0, 0, 0.06)",
              transition: "all 0.4s cubic-bezier(0.4, 0, 0.2, 1)",
              backdropFilter: hoveredCard === index ? "blur(10px)" : "none",
              WebkitBackdropFilter: hoveredCard === index ? "blur(10px)" : "none",
              transform: hoveredCard === index ? "translateY(-8px)" : "translateY(0)",
            }}
          >
            {/* Glitter Effect Overlay */}
            {hoveredCard === index && (
              <div
                className="card-glitter"
                style={{
                  position: "absolute",
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  pointerEvents: "none",
                  zIndex: 1,
                }}
              />
            )}

            {/* Flip Inner */}
            <div
              style={{
                width: "100%",
                height: "100%",
                position: "relative",
                transformStyle: "preserve-3d",
                transition: "transform 0.6s ease",
                transform: flippedIndexes.has(index) ? "rotateY(180deg)" : "none",
              }}
            >
              {/* Front */}
              <div
                style={{
                  position: "absolute",
                  width: "100%",
                  height: "100%",
                  backfaceVisibility: "hidden",
                  backgroundImage: `url('${item.bg}')`,
                  backgroundSize: "cover",
                  backgroundPosition: "center",
                  borderRadius: "20px",
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "flex-end",
                }}
              >
                {/* Gradient overlay at bottom */}
                <div
                  style={{
                    position: "absolute",
                    bottom: 0,
                    left: 0,
                    right: 0,
                    height: "50%",
                    background: "linear-gradient(to top, rgba(0,0,0,0.55) 0%, transparent 100%)",
                    borderRadius: "0 0 20px 20px",
                  }}
                />
                <div style={{
                  position: "relative",
                  zIndex: 1,
                  padding: "20px 24px",
                }}>
                  <h3 style={{
                    fontSize: "20px",
                    fontWeight: "600",
                    color: "#fff",
                    margin: 0,
                    fontFamily: "'Poppins', sans-serif",
                  }}>
                    {item.title}
                  </h3>
                  <p style={{
                    fontSize: "14px",
                    margin: "6px 0 0",
                    fontWeight: "400",
                    color: "rgba(255,255,255,0.85)",
                  }}>
                    {item.subtitle}
                  </p>
                </div>
              </div>

              {/* Back */}
              <div
                style={{
                  position: "absolute",
                  width: "100%",
                  height: "100%",
                  backfaceVisibility: "hidden",
                  transform: "rotateY(180deg)",
                  background: "linear-gradient(135deg, rgba(240,230,246,0.8) 0%, rgba(224,236,248,0.8) 50%, rgba(216,240,232,0.8) 100%)",
                  backdropFilter: "blur(10px)",
                  WebkitBackdropFilter: "blur(10px)",
                  borderRadius: "20px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  padding: "28px 20px",
                  boxSizing: "border-box",
                  border: "1px solid rgba(255,255,255,0.3)",
                }}
              >
                {index === 0 && renderHoroscopeBack()}
                {index === 1 && renderPersonalMonthBack()}
                {index === 2 && renderLuckyNumbersBack()}
              </div>
            </div>
          </div>
        ))}
      </div>

      <style>{`
        .luck-cards-container::-webkit-scrollbar, .back-scroll::-webkit-scrollbar { display: none; }
        .luck-cards-container, .back-scroll { scrollbar-width: none; }

        .card-glitter {
          background: linear-gradient(45deg, 
            transparent 0%, 
            rgba(255,255,255,0.4) 25%, 
            rgba(255,255,255,0.2) 50%, 
            transparent 75%
          );
          animation: cardGlitter 0.8s ease-in-out infinite;
        }

        @keyframes cardGlitter {
          0% {
            transform: translateX(-100%) translateY(-100%) rotate(-45deg);
            opacity: 0;
          }
          50% {
            opacity: 0.8;
          }
          100% {
            transform: translateX(100%) translateY(100%) rotate(-45deg);
            opacity: 0;
          }
        }

        @media (min-width: 1024px) {
          .luck-cards-container {
            display: grid !important;
            grid-template-columns: repeat(3, 1fr) !important;
            gap: 20px !important;
            padding: 0 40px !important;
            overflow: visible !important;
          }
          .flip-card {
            min-width: unset !important;
            width: 100% !important;
          }
        }

        @media (max-width: 767.98px) {
          .flip-card {
            min-width: 280px !important;
            width: 280px !important;
            height: 340px !important;
          }
        }
      `}</style>
    </div>
  );
};

export default LuckSection;