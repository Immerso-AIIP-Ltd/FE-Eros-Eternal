// src/components/LuckSection.tsx
import React, { useState, useEffect } from "react";
import moment from "moment";
import StartlightBg from "@/assets/images/horoscope.png";
import SpiritualBg from "@/assets/images/personalMonth.png";
import LuckyBg from "@/assets/images/luckyNumber.png";
import { baseApiUrl } from "@/config/api";

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

export const LuckSection: React.FC<{ embedded?: boolean }> = ({ embedded = false }) => {
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
        const response = await fetch(`https://unrefrangible-eddy-magnanimously.ngrok-free.dev/aitools/wellness/v2/numerology/planetary_horoscope`, { method: "POST", body: formData });
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
        const response = await fetch(`https://unrefrangible-eddy-magnanimously.ngrok-free.dev/aitools/wellness/v2/numerology/personal_month`, { method: "POST", body: formData });
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
        const response = await fetch(`https://unrefrangible-eddy-magnanimously.ngrok-free.dev/aitools/wellness/v2/numerology/lucky_numbers`, { method: "POST", body: formData });
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
    <div style={backContainerStyle} className="luck-back-scroll">
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
    <div style={backContainerStyle} className="luck-back-scroll">
      <h4 style={backTitleStyle}>Personal Month: <strong>{personalMonth?.personal_month_number || "?"}</strong></h4>
      {loading[1] ? <p style={loadingStyle}>Calculating your energy...</p> : error[1] ? <p style={errorStyle}>{error[1]}</p> : personalMonth ? (
        <p style={backQuote}>"{personalMonth.detailed_meaning}"</p>
      ) : null}
    </div>
  );

  const renderLuckyNumbersBack = () => (
    <div style={backContainerStyle} className="luck-back-scroll">
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
    overflowY: "auto", maxHeight: "100%", width: "100%", boxSizing: "border-box",
  };
  const backTitleStyle: React.CSSProperties = {
    margin: "0 0 10px 0", color: "#2a2040", fontSize: "17px", fontWeight: 700,
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
        padding: embedded ? 0 : "56px 24px 64px",
        backgroundColor: embedded ? "transparent" : "#ffffff",
        fontFamily: "'Poppins', sans-serif",
      }}
    >
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700;800&display=swap');

        .luck-back-scroll::-webkit-scrollbar { display: none; }
        .luck-back-scroll { scrollbar-width: none; }

        .luck-cards-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
          gap: 24px;
          width: 100%;
          max-width: 100%;
          margin: 0;
        }

        .luck-flip-card {
          width: 100%;
          height: 320px;
          border-radius: 22px;
          position: relative;
          cursor: pointer;
          overflow: hidden;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
          transition: transform 0.3s ease, box-shadow 0.3s ease;
        }

        .luck-flip-card:hover {
          transform: translateY(-6px);
          box-shadow: 0 12px 36px rgba(0, 0, 0, 0.14);
        }

        .luck-flip-inner {
          width: 100%;
          height: 100%;
          position: relative;
          transform-style: preserve-3d;
          transition: transform 0.65s cubic-bezier(0.4, 0, 0.2, 1);
        }

        .luck-flip-inner.flipped {
          transform: rotateY(180deg);
        }

        .luck-card-front,
        .luck-card-back {
          position: absolute;
          width: 100%;
          height: 100%;
          backface-visibility: hidden;
          -webkit-backface-visibility: hidden;
          border-radius: 22px;
        }

        .luck-card-back {
          transform: rotateY(180deg);
          background: linear-gradient(135deg, rgba(240,230,246,0.92) 0%, rgba(224,236,248,0.92) 50%, rgba(216,240,232,0.92) 100%);
          backdrop-filter: blur(12px);
          -webkit-backdrop-filter: blur(12px);
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 28px 20px;
          box-sizing: border-box;
          border: 1px solid rgba(255,255,255,0.4);
        }

        @media (max-width: 900px) {
          .luck-cards-grid {
            grid-template-columns: repeat(2, 1fr) !important;
          }
        }

        @media (max-width: 580px) {
          .luck-cards-grid {
            grid-template-columns: 1fr !important;
            max-width: 360px;
          }
          .luck-flip-card {
            height: 280px;
          }
        }
      `}</style>

      {/* Header — centered */}
      <div
        style={{
          textAlign: "center",
          marginBottom: "44px",
          maxWidth: "600px",
          margin: "0 auto 44px",
        }}
      >
        <h1
          style={{
            fontSize: "clamp(28px, 4vw, 42px)",
            fontWeight: 600,
            color: "#0d1020",
            margin: "0 0 14px",
            letterSpacing: "-0.02em",
            fontFamily: "'Inter', sans-serif",
            lineHeight: 1.15,
          }}
        >
          Discover your luck
        </h1>
        <p
          style={{
            fontSize: "14.5px",
            color: "#8a8aa0",
            margin: 0,
            lineHeight: 1.65,
            fontFamily: "'Poppins', sans-serif",
            fontWeight: 400,
          }}
        >
          Lorem ipsum dolor sit amet consectetur. Pulvinar vestibulum cras
          aliquam tempus nullam arcu sed.
        </p>
      </div>

      {/* Cards Grid */}
      <div className="luck-cards-grid">
        {luckItems.map((item, index) => (
          <div
            key={index}
            className="luck-flip-card"
            onClick={() => toggleFlip(index)}
            onMouseEnter={() => setHoveredCard(index)}
            onMouseLeave={() => setHoveredCard(null)}
          >
            <div className={`luck-flip-inner${flippedIndexes.has(index) ? " flipped" : ""}`}>

              {/* Front Face */}
              <div
                className="luck-card-front"
                style={{
                  backgroundImage: `url('${item.bg}')`,
                  backgroundSize: "cover",
                  backgroundPosition: "center",
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "flex-end",
                }}
              >
                {/* Dark gradient overlay at bottom */}
                <div
                  style={{
                    position: "absolute",
                    bottom: 0,
                    left: 0,
                    right: 0,
                    height: "55%",
                    background: "linear-gradient(to top, rgba(0,0,0,0.62) 0%, rgba(0,0,0,0.1) 70%, transparent 100%)",
                    borderRadius: "0 0 22px 22px",
                    pointerEvents: "none",
                  }}
                />

                {/* Text at bottom-left */}
                <div
                  style={{
                    position: "relative",
                    zIndex: 1,
                    padding: "20px 22px 22px",
                  }}
                >
                  <h3
                    style={{
                      fontSize: "18px",
                      fontWeight: 600,
                      color: "#ffffff",
                      margin: 0,
                      fontFamily: "'Poppins', sans-serif",
                      letterSpacing: "-0.01em",
                      lineHeight: 1.25,
                    }}
                  >
                    {item.title}
                  </h3>
                  <p
                    style={{
                      fontSize: "13px",
                      margin: "5px 0 0",
                      fontWeight: 400,
                      color: "rgba(255,255,255,0.78)",
                      fontFamily: "'Poppins', sans-serif",
                    }}
                  >
                    {item.subtitle}
                  </p>
                </div>
              </div>

              {/* Back Face */}
              <div className="luck-card-back">
                {index === 0 && renderHoroscopeBack()}
                {index === 1 && renderPersonalMonthBack()}
                {index === 2 && renderLuckyNumbersBack()}
              </div>

            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default LuckSection;