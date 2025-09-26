// src/pages/TarotCard.tsx
import React, { useState, useEffect } from "react";
import "bootstrap/dist/css/bootstrap.min.css";

interface TarotCard {
  card: string;
  image_url: string;
  meaning: string;
  position: string;
  reversed: boolean;
}

interface TarotReading {
  card_backcover: string;
  dob: string;
  mode: string;
  name: string;
  reading: TarotCard[];
}

const API_URL = "http://eros-eternal.runai-project-immerso-innnovation-venture-pvt.inferencing.shakticloud.ai";

const TarotCard: React.FC = () => {
  const [data, setData] = useState<TarotReading | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [revealedCards, setRevealedCards] = useState<boolean[]>([
    false,
    false,
    false,
  ]);

  // Read from localStorage
  const userId = localStorage.getItem("user_id");
  const username = localStorage.getItem("username");
  const dob = localStorage.getItem("date_of_birth");

  useEffect(() => {
    const fetchTarot = async () => {
      if (!userId || !username || !dob) {
        setError("User data missing. Please log in.");
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const response = await fetch(
          `${API_URL}/api/v1/numerology/tarot_reading`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              user_id: userId,
              user_name: username,
              dob: dob,
            }),
          }
        );

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const result = await response.json();

        if (result.success && result.data) {
          const apiData = result.data;

          // Format to match frontend structure
          const formattedData: TarotReading = {
            card_backcover:
              apiData.card_backcover ||
              "https://res.cloudinary.com/ds64xs2lp/image/upload/v1746909534/backcover_dgkxji.png",
            dob: apiData.dob || dob,
            mode: apiData.mode || "random",
            name: apiData.name || username,
            reading:
              apiData.reading?.map((card: any) => ({
                card: card.card || "Unknown Card",
                image_url: card.image_url || "/placeholder-card.jpg",
                meaning: card.meaning || "No meaning available.",
                position: card.position || "unknown",
                reversed: Boolean(card.reversed),
              })) || [],
          };

          setData(formattedData);
        } else {
          setError(result.message || "Failed to fetch tarot reading.");
        }
      } catch (err: any) {
        console.error("Tarot Fetch Error:", err);
        setError("Failed to load tarot reading. Please try again later.");
      } finally {
        setLoading(false);
      }
    };

    fetchTarot();
  }, []);

  const revealCard = (index: number) => {
    const newRevealed = [...revealedCards];
    newRevealed[index] = true;
    setRevealedCards(newRevealed);
  };

  const revealAllCards = () => {
    setRevealedCards([true, true, true]);
  };

  const resetReading = () => {
    setRevealedCards([false, false, false]);
  };

  const getPositionColor = (position: string): string => {
    switch (position) {
      case "past":
        return "text-info";
      case "present":
        return "text-warning";
      case "future":
        return "text-success";
      default:
        return "text-light";
    }
  };

  const getPositionIcon = (position: string): string => {
    switch (position) {
      case "past":
        return "🌙";
      case "present":
        return "☀️";
      case "future":
        return "⭐";
      default:
        return "🔮";
    }
  };

  return (
    <div
      className="min-vh-100 vw-100"
      style={{
        background: "#000000",
        fontFamily:
          "-apple-system, BlinkMacSystemFont, Segoe UI, Roboto, sans-serif",
      }}
    >
      <div className="position-absolute w-100 h-100 pointer-events-none">
        {Array.from({ length: 50 }).map((_, i) => (
          <div
            key={i}
            className="position-absolute text-white star-blink"
            style={{
              top: `${Math.random() * 100}%`,
              left: `${Math.random() * 100}%`,
              fontSize: `${Math.random() * 10 + 10}px`,
              opacity: Math.random() * 0.7 + 0.3,
              animationDelay: `${Math.random() * 10}s`,
              animationDuration: `${Math.random() * 5 + 1}s`,
            }}
          >
            ✦
          </div>
        ))}
      </div>
      {/* Header */}
      <div className="container-fluid py-4">
        <div
          className="d-flex align-items-center justify-content-center position-relative w-100 mb-4"
          style={{ height: "80px" }}
        >
          {/* Go Back Button - Absolutely positioned to the left */}
          <button
            className="btn position-absolute start-0 ms-3"
            style={{
              backgroundColor: "skyblue",
              color: "white",
              fontWeight: "bold",
              border: "none",
              padding: "8px 24px",
              borderRadius: "6px",
              cursor: "pointer",
              zIndex: 1,
            }}
            onClick={() => window.history.back()}
          >
            ← Go Back
          </button>

          {/* Centered Title */}
          <h1
            className="display-4 m-0 text-center text-light"
            style={{
              fontWeight: "700",
              textShadow: "2px 2px 4px rgba(0,0,0,0.5)",
              zIndex: 0,
            }}
          >
            ✨ Mystical Tarot Reading ✨
          </h1>
        </div>

        {/* Action Buttons */}
        {!loading && !error && data && (
          <div className="text-center mb-5">
            <button
              className="btn btn-warning btn-lg me-3 px-4 py-2 shadow-lg"
              onClick={revealAllCards}
              style={{ fontWeight: "600", borderRadius: "25px" }}
            >
              🔮 Reveal All Cards
            </button>
            <button
              className="btn btn-outline-light btn-lg px-4 py-2"
              onClick={resetReading}
              style={{ fontWeight: "600", borderRadius: "25px" }}
            >
              🌙 Reset Reading
            </button>
          </div>
        )}

        {/* Cards Layout */}
        {loading ? (
          <div className="text-center py-5">
            <div
              className="spinner-border text-info"
              style={{ width: "3rem", height: "3rem" }}
            ></div>
            <p className="text-light mt-3">Drawing your cards...</p>
          </div>
        ) : error ? (
          <div className="text-center py-5">
            <div className="text-danger">{error}</div>
          </div>
        ) : data ? (
          <div className="container">
            <div className="row justify-content-center g-4">
              {data.reading.map((card, index) => (
                <div key={index} className="col-lg-4 col-md-6">
                  <div
                    className="card h-100 bg-dark bg-opacity-75 border-0 shadow-lg position-relative overflow-hidden"
                    style={{
                      borderRadius: "20px",
                      transition: "all 0.3s ease",
                      cursor: !revealedCards[index] ? "pointer" : "default",
                    }}
                    onClick={() => !revealedCards[index] && revealCard(index)}
                    onMouseEnter={(e) => {
                      if (!revealedCards[index]) {
                        e.currentTarget.style.transform = "translateY(-10px)";
                        e.currentTarget.style.boxShadow =
                          "0 20px 40px rgba(255,193,7,0.3)";
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!revealedCards[index]) {
                        e.currentTarget.style.transform = "translateY(0)";
                        e.currentTarget.style.boxShadow = "";
                      }
                    }}
                  >
                    {/* Position Header */}
                    <div className="position-absolute top-0 start-0 w-100 p-3">
                      <div className="d-flex justify-content-between align-items-center">
                        <span
                          className={`badge fs-6 ${getPositionColor(
                            card.position
                          )}`}
                          style={{ background: "rgba(0,0,0,0.7)" }}
                        >
                          {getPositionIcon(card.position)}{" "}
                          {card.position.toUpperCase()}
                        </span>
                        {card.reversed && (
                          <span className="badge bg-danger fs-6">REVERSED</span>
                        )}
                      </div>
                    </div>

                    {/* Card Image */}
                    <div className="text-center p-4 pt-5">
                      <div
                        className="position-relative d-inline-block"
                        style={{
                          perspective: "1000px",
                          width: "200px",
                          height: "300px",
                        }}
                      >
                        {/* Card Back */}
                        <div
                          className="position-absolute w-100 h-100"
                          style={{
                            backfaceVisibility: "hidden",
                            transition: "transform 0.8s ease",
                            transform: revealedCards[index]
                              ? "rotateY(180deg)"
                              : "rotateY(0deg)",
                            borderRadius: "15px",
                            overflow: "hidden",
                            boxShadow: "0 10px 30px rgba(0,0,0,0.5)",
                          }}
                        >
                          <img
                            src={data.card_backcover}
                            alt="Card Back"
                            className="w-100 h-100 object-fit-cover"
                            style={{ borderRadius: "15px" }}
                          />
                          {!revealedCards[index] && (
                            <div className="position-absolute top-50 start-50 translate-middle">
                              <div
                                className="text-warning"
                                style={{
                                  fontSize: "2rem",
                                  animation: "pulse 2s infinite",
                                }}
                              >
                                ✨
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Card Front */}
                        <div
                          className="position-absolute w-100 h-100"
                          style={{
                            backfaceVisibility: "hidden",
                            transition: "transform 0.8s ease",
                            transform: revealedCards[index]
                              ? "rotateY(0deg)"
                              : "rotateY(180deg)",
                            borderRadius: "15px",
                            overflow: "hidden",
                            boxShadow: "0 10px 30px rgba(0,0,0,0.5)",
                          }}
                        >
                          <img
                            src={card.image_url}
                            alt={card.card}
                            className="w-100 h-100 object-fit-cover"
                            style={{ borderRadius: "15px" }}
                          />
                        </div>
                      </div>
                    </div>

                    {/* Card Details */}
                    <div className="card-body pt-0">
                      {revealedCards[index] ? (
                        <>
                          <h5 className="card-title text-warning text-center mb-3 fw-bold">
                            {card.card}
                          </h5>
                          <div
                            className="card-text text-light"
                            style={{ lineHeight: "1.6" }}
                          >
                            <p className="mb-0" style={{ fontSize: "0.95rem" }}>
                              {card.meaning}
                            </p>
                          </div>
                        </>
                      ) : (
                        <div className="text-center py-4">
                          <div
                            className="text-warning mb-2"
                            style={{ fontSize: "1.5rem" }}
                          >
                            🎴
                          </div>
                          <p className="text-light mb-0">
                            Click to reveal your {card.position} card
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : null}

        {/* Footer */}
        {!loading && !error && data && (
          <div className="text-center mt-5 pt-4">
            <div className="text-light opacity-75">
              <small>
                ✨ The cards have spoken ✨<br />
                Trust in the wisdom revealed to guide your path forward
              </small>
            </div>
          </div>
        )}
      </div>

      <style jsx>{`
        @keyframes pulse {
          0%,
          100% {
            opacity: 1;
            transform: scale(1);
          }
          50% {
            opacity: 0.7;
            transform: scale(1.1);
          }
        }
        @import url("https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;600;700&display=swap");
      `}</style>
    </div>
  );
};

export default TarotCard;
