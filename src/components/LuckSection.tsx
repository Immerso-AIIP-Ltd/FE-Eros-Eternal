// src/components/LuckSection.tsx
import React, { useState, useEffect } from "react";
import planetIcon from "../planet.png";
import Month from "../Month.png";
import number from "../number.png";

interface LuckyNumbersResponse {
  destiny_number: number;
  inner_dream_number: number;
  life_path_number: number;
  lucky_number: number;
  soul_number: number;
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

const API_URL = "http://192.168.29.154:6001";

export const LuckSection: React.FC = () => {
  const [flippedIndexes, setFlippedIndexes] = useState<Set<number>>(new Set());
  const [luckyNumbers, setLuckyNumbers] = useState<LuckyNumbersResponse | null>(
    null
  );
  const [horoscope, setHoroscope] = useState<HoroscopeResponse | null>(null);
  const [personalMonth, setPersonalMonth] =
    useState<PersonalMonthResponse | null>(null);
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
        formData.append("dob", dob);
            if (dob) {
          // Split dd-mm-yyyy into parts
          const [day, month, year] = dob.split("-");

          // Reformat to yyyy-mm-dd (with zero-padding for safety)
          const formattedDob = `${year}-${month.padStart(
            2,
            "0"
          )}-${day.padStart(2, "0")}`;

          formData.append("dob", formattedDob); // Now sends "1990-08-15"
        }
        const response = await fetch(
          `${API_URL}/api/v1/numerology/planetary_horoscope`,
          {
            method: "POST",
             body: formData,
            // headers: { "Content-Type": "application/json" },
            // body: JSON.stringify({ user_id: userId, user_name: username, dob }),
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
          formData.append("dob", dob);

              if (dob) {
            // Split dd-mm-yyyy into parts
            const [day, month, year] = dob.split("-");

            // Reformat to yyyy-mm-dd (with zero-padding for safety)
            const formattedDob = `${year}-${month.padStart(
              2,
              "0"
            )}-${day.padStart(2, "0")}`;

            formData.append("dob", formattedDob); // Now sends "1990-08-15"
          }
        const response = await fetch(
          `${API_URL}/api/v1/numerology/personal_month`,
          {
            method: "POST",
            body:formData
            // headers: { "Content-Type": "application/json" },
            // body: JSON.stringify({ user_id: userId, user_name: username, dob }),
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
  // useEffect(() => {
  //   const fetchLuckyNumbers = async () => {
  //     const index = 2;
  //     if (!hasUserData) {
  //       setErrorState(index, "User data missing.");
  //       return;
  //     }

  //     setLoadingState(index, true);
  //     setErrorState(index, "");

  //     try {
  //       const response = await fetch(`${API_URL}/api/v1/numerology/lucky_numbers`, {
  //         method: 'POST',
  //         headers: { 'Content-Type': 'application/json' },
  //         body: JSON.stringify({ user_id: userId, user_name: username, dob }),
  //       });

  //       if (!response.ok) throw new Error(`HTTP ${response.status}`);

  //       const data = await response.json();
  //       if (data.success && data.data?.lucky_numbers) {
  //         setLuckyNumbers(data.data.lucky_numbers);
  //       } else {
  //         setErrorState(index, "No lucky numbers found.");
  //       }
  //     } catch (err) {
  //       console.error("Lucky Numbers Error:", err);
  //       setErrorState(index, "Failed to load lucky numbers.");
  //     } finally {
  //       setLoadingState(index, false);
  //     }
  //   };

  //   fetchLuckyNumbers();
  // }, [hasUserData, userId, username, dob]);

  useEffect(
    () => {
      const fetchLuckyNumbers = async () => {
        const index = 2;
        if (!hasUserData) {
          setErrorState(index, "User data missing.");
          return;
        }

        setLoadingState(index, true);
        setErrorState(index, "");

        try {
          // Create FormData
          const formData = new FormData();
          formData.append("user_id", userId);
          formData.append("user_name", username);
          formData.append("dob", dob);

          if (dob) {
            // Split dd-mm-yyyy into parts
            const [day, month, year] = dob.split("-");

            // Reformat to yyyy-mm-dd (with zero-padding for safety)
            const formattedDob = `${year}-${month.padStart(
              2,
              "0"
            )}-${day.padStart(2, "0")}`;

            formData.append("dob", formattedDob); // Now sends "1990-08-15"
          }

          const response = await fetch(
            `${API_URL}/api/v1/numerology/lucky_numbers`,
            {
              method: "POST",
              // ⚠️ Do NOT set Content-Type — browser sets it automatically with boundary
              body: formData,
            }
          );

          if (!response.ok) throw new Error(`HTTP ${response.status}`);

          const data = await response.json();
          if (data.success && data.data?.lucky_number) {
            setLuckyNumbers(data.data.lucky_number);
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
    },
    [
      /* your dependencies */
    ]
  );

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
            "{horoscope?.horoscope?.substring(0, 160)}..."
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
          <p style={backText}>
            <strong>Theme:</strong> {personalMonth.meaning}
          </p>
          <p style={backQuote}>"{personalMonth.detailed_meaning}"</p>
          <p style={smallText}>
            <strong>Target:</strong> {personalMonth.target_date}
          </p>
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
          {/* <p style={backText}><strong>Inner Dream:</strong> {luckyNumbers.inner_dream_number}</p> */}
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
    fontSize: "16px",
  };

  const backText: React.CSSProperties = {
    margin: 0,
    color: "#ccc",
    fontSize: "14px",
  };

  const backQuote: React.CSSProperties = {
    margin: "6px 0 0 0",
    fontStyle: "italic",
    color: "#aaa",
    fontSize: "13.5px",
  };

  const smallText: React.CSSProperties = {
    margin: "8px 0 0 0",
    fontSize: "12px",
    color: "#888",
  };

  const loadingStyle: React.CSSProperties = {
    color: "#aaa",
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
        padding: "20px 0",
        backgroundColor: "#000",
        // fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      }}
    >
      {/* Header */}
      <div style={{ marginBottom: "20px" }}>
        <h2
          style={{
            fontSize: "18px",
            fontWeight: "600",
            color: "#fff",
            margin: 0,
            letterSpacing: "-0.02em",
            fontFamily: "Poppins",
          }}
        >
          Discover your luck
        </h2>
      </div>

      {/* Cards Container */}
      <div
        className="luck-cards-container"
        style={{
          display: "flex",
          gap: "12px",
          overflowX: "auto",
          paddingBottom: "8px",
          paddingLeft: "2px",
          paddingRight: "2px",
          scrollbarWidth: "thin",
          msOverflowStyle: "none",
        }}
      >
        {luckItems.map((item, index) => (
          <div
            key={index}
            className={`flip-card ${
              flippedIndexes.has(index) ? "flipped" : ""
            }`}
            onClick={() => toggleFlip(index)}
            style={{
              width: "412px",
              height: "480px",
              borderRadius: "12px",
              border: "1px solid #3a3d40",
              backgroundColor: "#2a2d30",
              position: "relative",
              cursor: "pointer",
              transition: "all 0.2s ease",
              overflow: "hidden",
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
              fontFamily: "Inter",
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
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "space-between",
                  padding: "16px",
                  boxSizing: "border-box",
                }}
              >
                {/* Title */}
                <div>
                  <h3 style={cardTitleStyle}>{item.title}</h3>
                  <p style={cardSubtitleStyle}>{item.subtitle}</p>
                </div>

                {/* Center Icon */}
                <div
                  style={{
                    position: "absolute",
                    top: "50%",
                    left: "50%",
                    transform: "translate(-50%, -50%)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <img
                    src={item.icon}
                    alt={item.title}
                    style={{
                      width: "223px",
                      height: "223px",
                      objectFit: "contain",
                    }}
                  />
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
                  backgroundColor: "#1a1a1a",
                  borderRadius: "12px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  padding: "16px",
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
            width: 270px;
            height: 175px;
          }
        }

        @media (min-width: 1024px) {
          .luck-cards-container {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
            gap: 16px;
            overflow-x: hidden;
            padding: 0;
          }
          .flip-card {
            width: 100% !important;
            height: 180px;
            min-width: 0;
          }
        }

        @media (max-width: 767.98px) {
          .flip-card {
            min-width: 260px;
            width: 280px;
            height: 178px;
          }
          .flip-card h3 {
            font-size: 15px;
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
