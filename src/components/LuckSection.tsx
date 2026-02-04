// src/components/LuckSection.tsx
import React, { useState, useEffect } from "react";
import planetIcon from "../planet.png";
import Month from "../Month.png";
import number from "../number.png";
import moment from "moment";
import StartlightBg from "../assets/discover/planetary.png";
import SpiritualBg from "../assets/discover/personalMonth.jpg";
import LuckyBg from "../assets/discover/luckyNumber.jpg";

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
// const API_URL = "http://192.168.18.5:7001";

export const LuckSection: React.FC = () => {
  const [flippedIndexes, setFlippedIndexes] = useState<Set<number>>(new Set());
  const [luckyNumbers, setLuckyNumbers] = useState<LuckyNumbers | null>(null);
  const [horoscope, setHoroscope] = useState<HoroscopeResponse | null>(null);
  const [personalMonth, setPersonalMonth] = useState<PersonalMonthResponse | null>(null);
  const [loading, setLoading] = useState<Record<number, boolean>>({});
  const [error, setError] = useState<Record<number, string>>({});

  // 🔹 Read user data from localStorage
  const userId = localStorage.getItem("user_id");
  const username = localStorage.getItem("username");
  const dob = localStorage.getItem("date_of_birth");

  // ✅ Validate required data
  const hasUserData = userId && username && dob;

  // Helper to set loading/error states
  const setLoadingState = (index: number, loading: boolean) => {
    setLoading((prev) => ({ ...prev, [index]: loading }));
  };

  const setErrorState = (index: number, message: string) => {
    setError((prev) => ({ ...prev, [index]: message }));
  };

  // 🔁 Fetch Planetary Horoscope (index 0)
  useEffect(() => {
    const fetchHoroscope = async () => {
      const index = 0;
      if (!hasUserData) {
        setErrorState(index, "User data missing.");
        return;
      }

      setLoadingState(index, true);
      setErrorState(index, "");

      try {
        const formData = new FormData();
        formData.append("user_id", userId);
        formData.append("user_name", username);
        // formData.append("dob", dob);

        if (dob) {
          // Split dd-mm-yyyy into parts
          const [day, month, year] = dob.split("-");

          // Reformat to yyyy-mm-dd (with zero-padding for safety)
          const formattedDob = `${year}-${month.padStart(
            2,
            "0"
          )}-${day.padStart(2, "0")}`;

          formData.append("dob", moment(formattedDob).format("YYYY-MM-DD")); // Now sends "1990-08-15"
        }
        const response = await fetch(
          `${API_URL}/api/v1/numerology/planetary_horoscope`,
          {
            method: "POST",
            body: formData,
          }
        );

        if (!response.ok) throw new Error(`HTTP ${response.status}`);

        const data = await response.json();
        if (data.success && data.data) {
          setHoroscope(data.data);
        } else {
          setErrorState(index, "No horoscope available.");
        }
      } catch (err) {
        console.error("Horoscope Error:", err);
        setErrorState(index, "Failed to load horoscope.");
      } finally {
        setLoadingState(index, false);
      }
    };

    fetchHoroscope();
  }, [hasUserData, userId, username, dob]);

  // 🔁 Fetch Personal Month Number (index 1)
  useEffect(() => {
    const fetchPersonalMonth = async () => {
      const index = 1;
      if (!hasUserData) {
        setErrorState(index, "User data missing.");
        return;
      }

      setLoadingState(index, true);
      setErrorState(index, "");

      try {
        const formData = new FormData();
        formData.append("user_id", userId);
        formData.append("user_name", username);
        // formData.append("dob", dob);


        if (dob) {
          // Split dd-mm-yyyy into parts
          const [day, month, year] = dob.split("-");

          // Reformat to yyyy-mm-dd (with zero-padding for safety)
          const formattedDob = `${year}-${month.padStart(
            2,
            "0"
          )}-${day.padStart(2, "0")}`;

          formData.append("dob", moment(formattedDob).format("YYYY-MM-DD")); // Now sends "1990-08-15"
        }
        const response = await fetch(
          `${API_URL}/api/v1/numerology/personal_month`,
          {
            method: "POST",
            body: formData
          }
        );

        if (!response.ok) throw new Error(`HTTP ${response.status}`);

        const data = await response.json();
        if (data.success && data.data) {
          setPersonalMonth(data.data);
        } else {
          setErrorState(index, "No personal month data.");
        }
      } catch (err) {
        console.error("Personal Month Error:", err);
        setErrorState(index, "Failed to load personal month.");
      } finally {
        setLoadingState(index, false);
      }
    };

    fetchPersonalMonth();
  }, [hasUserData, userId, username, dob]);

  // 🔁 Fetch Lucky Numbers (index 2)
  useEffect(() => {
    const fetchLuckyNumbers = async () => {
      const index = 2;
      if (!hasUserData) {
        setErrorState(index, "User data missing.");
        return;
      }

      setLoadingState(index, true);
      setErrorState(index, "");

      try {
        const formData = new FormData();
        formData.append("user_id", userId);
        formData.append("user_name", username);

        if (dob) {
          const [day, month, year] = dob.split("-");
          const formattedDob = `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
          formData.append("dob", moment(formattedDob).format("YYYY-MM-DD"));
        }

        const response = await fetch(
          `${API_URL}/api/v1/numerology/lucky_numbers`,
          {
            method: "POST",
            body: formData,
          }
        );

        if (!response.ok) throw new Error(`HTTP ${response.status}`);

        const result = await response.json();

        // ✅ FIX: result.data is the LuckyNumbers object
        if (result.success && result.data) {
          setLuckyNumbers(result.data);
        } else {
          setErrorState(index, "No lucky numbers found.");
        }
      } catch (err) {
        console.error("Lucky Numbers Error:", err);
        setErrorState(index, "Failed to load lucky numbers.");
      } finally {
        setLoadingState(index, false);
      }
    };

    fetchLuckyNumbers();
  }, [hasUserData, userId, username, dob]);

  // 🔁 Toggle flip on card click
  const toggleFlip = (index: number) => {
    const newFlipped = new Set(flippedIndexes);
    if (newFlipped.has(index)) {
      newFlipped.delete(index);
    } else {
      newFlipped.add(index);
    }
    setFlippedIndexes(newFlipped);
  };

  // 🃏 Cards Data
  const luckItems = [
    {
      title: "Starlight Journal",
      subtitle: "Planetary Daily",
      icon: planetIcon,
    },
    {
      title: "Spiritual Phase",
      subtitle: "Personal Month Number",
      icon: Month,
    },
    {
      title: "Lucky Number",
      subtitle: "Your lucky number of the day",
      icon: number,
    },
  ];

  // 🔙 Back Content Renderers

  const renderHoroscopeBack = () => (
    <div style={backContainerStyle}>
      <h4 style={backTitleStyle}>Horoscope: {horoscope?.zodiac_sign}</h4>
      {loading[0] ? (
        <p style={loadingStyle}>Loading horoscope...</p>
      ) : error[0] ? (
        <p style={errorStyle}>{error[0]}</p>
      ) : (
        <>
          <p style={backText}>
            <strong>Zodiac:</strong> {horoscope?.zodiac_sign}
          </p>
          <p style={backQuote}>
            "{horoscope?.horoscope}"
          </p>
        </>
      )}
    </div>
  );

  const renderPersonalMonthBack = () => (
    <div style={backContainerStyle}>
      <h4 style={backTitleStyle}>
        Personal Month:{" "}
        <strong>{personalMonth?.personal_month_number || "?"}</strong>
      </h4>
      {loading[1] ? (
        <p style={loadingStyle}>Calculating your energy...</p>
      ) : error[1] ? (
        <p style={errorStyle}>{error[1]}</p>
      ) : personalMonth ? (
        <>
          {/* <p style={backText}>
            <strong>Theme:</strong> {personalMonth.meaning}
          </p> */}

          <p style={backQuote}>"{personalMonth.detailed_meaning}"</p>
        </>
      ) : null}
    </div>
  );

  const renderLuckyNumbersBack = () => (
    <div style={backContainerStyle}>
      <h4 style={backTitleStyle}>Your Numerology Numbers</h4>
      {loading[2] ? (
        <p style={loadingStyle}>Loading numbers...</p>
      ) : error[2] ? (
        <p style={errorStyle}>{error[2]}</p>
      ) : luckyNumbers ? (
        <>
          <p style={backText}>
            <strong>Destiny:</strong> {luckyNumbers.destiny_number}
          </p>
          <p style={backText}>
            <strong>Life Path:</strong> {luckyNumbers.life_path_number}
          </p>
          <p style={backText}>
            <strong>Lucky Number:</strong> {luckyNumbers.lucky_number}
          </p>
          <p style={backText}>
            <strong>Soul Urge:</strong> {luckyNumbers.soul_urge_number}
          </p>
          <p style={backText}>
            <strong>Soul:</strong> {luckyNumbers.soul_number}
          </p>
        </>
      ) : (
        <p style={errorStyle}>Unable to load data.</p>
      )}
    </div>
  );

  // ✨ Inline Styles
  const backContainerStyle: React.CSSProperties = {
    display: "flex",
    flexDirection: "column",
    gap: "10px",
    textAlign: "center",
    color: "#00B8F8",
    fontSize: "14px",
    fontWeight: 500,
    lineHeight: 1.6,
    padding: "0 14px",
  };

  const backTitleStyle: React.CSSProperties = {
    margin: "0 0 12px 0",
    color: "#fff",
    fontSize: "18px",
    fontWeight: '700'
  };

  const backText: React.CSSProperties = {
    margin: 0,
    color: "#fff",
    fontSize: "16px",
  };

  const backQuote: React.CSSProperties = {
    margin: "6px 0 0 0",
    color: "#fff",
    fontSize: "14px",
    textAlign: 'justify',
    marginTop: '20px'
  };

  const smallText: React.CSSProperties = {
    margin: "8px 0 0 0",
    fontSize: "12px",
    color: "#888",
  };

  const loadingStyle: React.CSSProperties = {
    color: "#fff",
    margin: 0,
  };

  const errorStyle: React.CSSProperties = {
    color: "#ff6b6b",
    margin: 0,
    fontSize: "13px",
  };

  return (
    <div
      style={{
        padding: "40px 0",
        backgroundColor: "#000",
        // paddingRight: "100px",
        // paddingLeft: "100px"
      }}
    >
      {/* Header */}
      <div style={{ 
        marginBottom: "32px",
        paddingLeft: "40px",
        paddingRight: "40px"
      }}>
        <h1
          style={{
            fontSize: "28px",
            fontWeight: "700",
            color: "#fff",
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
          gap: "24px",
          overflowX: "auto",
          padding: "0 40px 40px",
          scrollbarWidth: "none",
          // maxWidth: "1400px",
          margin: "0 auto"
        }}
        css={`
    &::-webkit-scrollbar { display: none; }
    -ms-overflow-style: none;
  `}
      >
        {luckItems.map((item, index) => (
          <div
            key={index}
            className={`flip-card ${flippedIndexes.has(index) ? "flipped" : ""}`}
            onClick={() => toggleFlip(index)}
            style={{
              minWidth: "320px",
              width: "320px",
              height: "420px",
              borderRadius: "16px",
              border: "1px solid rgba(255, 255, 255, 0.1)",
              backgroundColor: "rgba(20, 20, 30, 0.6)",
              backdropFilter: "blur(10px)",
              position: "relative",
              cursor: "pointer",
              overflow: "hidden",
              boxShadow: "0 8px 32px rgba(0, 0, 0, 0.3)",
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
          >
            {/* Flip Inner */}
            <div
              className="flip-card-inner"
              style={{
                width: "100%",
                height: "100%",
                position: "relative",
                transformStyle: "preserve-3d",
                transition: "transform 0.6s ease",
                transform: flippedIndexes.has(index)
                  ? "rotateY(180deg)"
                  : "none",
              }}
            >
              {/* Front */}
              <div
                className="flip-card-front"
                style={{
                  position: "absolute",
                  width: "100%",
                  height: "100%",
                  backfaceVisibility: "hidden",
                  backgroundImage:
                    index === 0 ? `url('${StartlightBg}')` :
                      index === 1 ? `url('${SpiritualBg}')` :
                        `url('${LuckyBg}')`,
                  backgroundSize: "cover",
                  backgroundPosition: "center",
                  padding: "24px",
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "space-between",
                }}
              >
                {/* Card Content */}
                <div style={{ 
                  position: "absolute", 
                  bottom: "24px", 
                  left: "24px", 
                  right: "24px",
                  // background: "rgba(0, 0, 0, 0.4)",
                  borderRadius: "8px",
                  padding: "16px",
                  backdropFilter: "blur(4px)"
                }}>
                  <h3 style={{
                    fontSize: "22px",
                    fontWeight: "600",
                    color: "#FFFFFF",
                    margin: 0,
                    fontFamily: "'Poppins', sans-serif",
                    textShadow: "0 1px 2px rgba(0,0,0,0.5)"
                  }}>
                    {item.title}
                  </h3>
                  <p style={{
                    fontSize: "16px",
                    margin: "8px 0 0",
                    fontWeight: "400",
                    color: "rgba(255,255,255,0.85)",
                    textShadow: "0 1px 2px rgba(0,0,0,0.5)"
                  }}>
                    {item.subtitle}
                  </p>
                </div>
              </div>

              {/* Back */}
              <div
                className="flip-card-back"
                style={{
                  position: "absolute",
                  width: "100%",
                  height: "100%",
                  backfaceVisibility: "hidden",
                  transform: "rotateY(180deg)",
                  background: "linear-gradient(135deg, #1E3A8A 0%, #10B981 100%)",
                  borderRadius: "12px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  padding: "32px 24px",
                  boxSizing: "border-box",
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

      {/* Responsive Scrollbar & Layout */}
      <style jsx>{`
        .luck-cards-container {
          scroll-behavior: smooth;
        }
        .luck-cards-container::-webkit-scrollbar {
          height: 4px;
        }
        .luck-cards-container::-webkit-scrollbar-track {
          background: rgba(255, 255, 255, 0.05);
          border-radius: 2px;
        }
        .luck-cards-container::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.2);
          border-radius: 2px;
        }
        .luck-cards-container::-webkit-scrollbar-thumb:hover {
          background: rgba(255, 255, 255, 0.3);
        }
        .luck-cards-container {
          scrollbar-width: thin;
          scrollbar-color: rgba(255, 255, 255, 0.2) rgba(255, 255, 255, 0.05);
        }

        @media (min-width: 768px) and (max-width: 1023px) {
          .flip-card {
            width: 280px;
            height: 320px;
          }
          .flip-card h3 {
            font-size: 18px;
          }
        }

        @media (min-width: 1024px) {
          .luck-cards-container {
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 24px;
            padding: 0;
            overflow: visible;
          }
          .flip-card {
            min-width: unset !important;
            width: 100% !important;
          }
        }

        @media (max-width: 767.98px) {
          .flip-card {
            min-width: 300px;
            width: 300px;
            height: 360px;
          }
          .flip-card h3 {
            font-size: 18px;
          }
          .flip-card p {
            font-size: 14px;
          }
        }
      `}</style>
    </div>
  );
};

// Inline styles reused
const cardTitleStyle: React.CSSProperties = {
  fontSize: "16px",
  fontWeight: "500",
  color: "#ffffff",
  margin: "0",
  lineHeight: "1.3",
};

const cardSubtitleStyle: React.CSSProperties = {
  fontSize: "14px",
  color: "#aaa",
  margin: "4px 0 0 0",
};

export default LuckSection;