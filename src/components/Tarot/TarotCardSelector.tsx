import React, { useState, useEffect } from "react";
import { Button } from "react-bootstrap";
import cardBg from "../../assets/cardbg.png";
import card2 from "../../assets/image.png";
import Stars from "../stars";
// import card2 from "../../assets/Tarot1.jpg";

const TarotCardSelector = ({ cardData, onStepChange, onShuffle }) => {
  const [selectedCards, setSelectedCards] = useState([]);
  const [hoveredCard, setHoveredCard] = useState(null);
  const [animationPhase, setAnimationPhase] = useState("initial");
  const [revealedCards, setRevealedCards] = useState([]);
  const [showReading, setShowReading] = useState(false);
  const [readingPhase, setReadingPhase] = useState("selecting");
  const [tornadoPhase, setTornadoPhase] = useState(false);
  const [showDescriptions, setShowDescriptions] = useState(false);
  // const API_URL = "http://192.168.29.154:6001";
  // Read from localStorage
  // const userId = localStorage.getItem("user_id");
  // const username = localStorage.getItem("username");
  // const dob = localStorage.getItem("date_of_birth");

  // Custom styles for the component
  const styles = {
    container: {
      position: "relative",
      width: "100%",
      height: "100vh",
      // background: 'linear-gradient(135deg, #0f0f23 0%, #1a1a2e 25%, #16213e 50%, #0f3460 75%, #533483 100%)',
      overflow: "hidden",
    },
    overlay: {
      position: "absolute",
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      // background: 'radial-gradient(ellipse at center, rgba(79, 70, 229, 0.3) 0%, rgba(139, 69, 193, 0.2) 50%, rgba(0, 0, 0, 0.4) 100%)'
    },
    star: {
      position: "absolute",
      width: "4px",
      height: "4px",
      backgroundColor: "#facc15",
      borderRadius: "50%",
      opacity: 0.4,
    },
    headerContainer: {
      position: "absolute",
      top: "10rem",
      left: "50%",
      transform: "translateX(-50%)",
      zIndex: 30,
    },
    counterContainer: {
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      gap: "1rem",
      marginBottom: "1rem",
    },
    counterBadge: {
      width: "3rem",
      height: "3rem",
      border: "2px solid rgba(196, 181, 253, 0.5)",
      borderRadius: "50%",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: "rgba(88, 28, 135, 0.3)",
      color: "#c4b5fd",
      fontSize: "1.125rem",
      fontWeight: "300",
    },
    cardContainer: {
      position: "relative",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      minHeight: "100vh",
    },
    card: {
      position: "absolute",
      cursor: "pointer",
      transformStyle: "preserve-3d",
    },
    cardBack: {
      width: "140px",
      height: "200px",
      position: "relative",
      backfaceVisibility: "hidden",
    },
    cardFront: {
      position: "absolute",
      top: 0,
      left: 0,
      width: "140px",
      height: "200px",
      backfaceVisibility: "hidden",
      transform: "rotateY(180deg)",
    },
    readingOverlay: {
      position: "absolute",
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      // background:
      //   "linear-gradient(135deg, rgba(15, 15, 35, 0.95) 0%, rgba(26, 26, 46, 0.95) 25%, rgba(22, 33, 62, 0.95) 50%, rgba(15, 52, 96, 0.95) 75%, rgba(83, 52, 131, 0.95) 100%)",
      overflowY: "auto",
      zIndex: 40,
      minHeight: "100vh",
      padding: "4rem 2rem",
    },
    readingCard: {
      width: "192px",
      height: "288px",
      borderRadius: "0.75rem",
      border: "2px solid #facc15",
      background: "linear-gradient(to bottom right, #fef3c7, #fed7aa)",
      position: "relative",
      overflow: "hidden",
      boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
    },
    timeLabelsContainer: {
      position: "absolute",
      top: "35%",
      left: "50%",
      transform: "translate(-50%, -32px)",
      zIndex: 20,
    },
    timeLabels: {
      display: "flex",
      gap: "13rem",
    },
  };

  useEffect(() => {
    console.log("cardData changed:", cardData);
  }, [cardData]);

  useEffect(() => {
    setTimeout(() => setAnimationPhase("entering"), 500);
    setTimeout(() => setAnimationPhase("entered"), 800);
  }, []);

  useEffect(() => {
    if (selectedCards.length === 3 && readingPhase === "selecting") {
      setTimeout(() => setReadingPhase("arranging"), 1000);
      setTimeout(() => setReadingPhase("positioning"), 2500);
    }
  }, [selectedCards, readingPhase]);

  useEffect(() => {
    if (
      revealedCards.length === selectedCards.length &&
      selectedCards.length === 3 &&
      showReading
    ) {
      setTimeout(() => setShowDescriptions(true), 1000);
    }
  }, [revealedCards, selectedCards, showReading]);

  const resetWithCardScatter = () => {
    setShowDescriptions(false);
    setTimeout(() => {
      setTornadoPhase(true);
      setTimeout(() => {
        setShowReading(false);
        setRevealedCards([]);
        setSelectedCards([]);
        setReadingPhase("selecting");
        setTornadoPhase(false);
        setAnimationPhase("entered");
      }, 2500);
    }, 500);
  };

  const totalCards = 25;
  const cards = Array.from({ length: totalCards }, (_, i) => i);

  const handleCardClick = (cardIndex) => {
    if (tornadoPhase) return;

    if (readingPhase === "selecting") {
      if (selectedCards.includes(cardIndex)) {
        setSelectedCards(selectedCards.filter((id) => id !== cardIndex));
      } else if (selectedCards.length < 3) {
        setSelectedCards([...selectedCards, cardIndex]);
      }
    } else if (readingPhase === "positioning" || readingPhase === "reading") {
      if (
        selectedCards.includes(cardIndex) &&
        !revealedCards.includes(cardIndex)
      ) {
        setRevealedCards((prev) => [...prev, cardIndex]);
        if (!showReading) {
          setShowReading(true);
          setReadingPhase("reading");
        }
      }
    }
  };

  const getCardTransform = (index) => {
    const startAngle = -45;
    const endAngle = 45;
    const totalAngle = endAngle - startAngle;
    const angleStep = totalAngle / (totalCards - 1);
    const finalAngle = startAngle + index * angleStep;
    const finalRadian = (finalAngle * Math.PI) / 180;
    const radius = 1000;
    const finalX = Math.sin(finalRadian) * radius;
    const finalY = -Math.cos(finalRadian) * radius + radius * 0.9;
    const finalRotation = finalAngle * 0.7; // Reduce rotation for better tilt

    if (tornadoPhase) {
      const scatterPhase = Date.now() % 2500;
      if (scatterPhase < 1000) {
        const randomX = (Math.random() - 0.5) * 1200;
        const randomY = (Math.random() - 0.5) * 800;
        const randomRotation = Math.random() * 720;
        const progress = scatterPhase / 1000;
        return {
          transform: `translate(${randomX * progress}px, ${
            randomY * progress
          }px) rotate(${randomRotation * progress}deg) scale(${
            1 - progress * 0.3
          })`,
          opacity: 1 - progress * 0.3,
          zIndex: 20,
          transition: "all 0.8s cubic-bezier(0.25, 0.46, 0.45, 0.94)",
        };
      } else if (scatterPhase < 1500) {
        const randomX = (Math.random() - 0.5) * 1200;
        const randomY = (Math.random() - 0.5) * 800;
        const randomRotation = Math.random() * 720;
        return {
          transform: `translate(${randomX}px, ${randomY}px) rotate(${randomRotation}deg) scale(0.7)`,
          opacity: 0.7,
          zIndex: 20,
          transition: "all 0.3s ease-out",
        };
      } else {
        const gatherProgress = (scatterPhase - 1500) / 1000;
        const spinRotation = 360 * gatherProgress;
        return {
          transform: `translate(${finalX}px, ${finalY}px) rotate(${
            finalRotation + spinRotation
          }deg) scale(${0.7 + gatherProgress * 0.3})`,
          opacity: 0.7 + gatherProgress * 0.3,
          zIndex: 20,
          transition: "all 0.6s cubic-bezier(0.68, -0.55, 0.265, 1.55)",
        };
      }
    }

    if (animationPhase === "initial") {
      const spinRotation = finalRotation + 720;
      return {
        transform: `translate(0px, 400px) rotate(${spinRotation}deg) scale(0.5)`,
        opacity: 0,
        zIndex: 1,
        transition: "none",
      };
    }

    const isSelected = selectedCards.includes(index);

    if (readingPhase === "arranging" && !isSelected) {
      const vanishType = index % 3;
      if (vanishType === 0) {
        const shatterX = finalX + (Math.random() - 0.5) * 800;
        const shatterY = finalY + Math.random() * 600 + 200;
        const shatterRotation = finalRotation + (Math.random() - 0.5) * 360;
        return {
          transform: `translate(${shatterX}px, ${shatterY}px) rotate(${shatterRotation}deg) scale(0.3)`,
          opacity: 0,
          zIndex: 1,
          transition: "all 1.2s cubic-bezier(0.25, 0.46, 0.45, 0.94)",
        };
      } else if (vanishType === 1) {
        return {
          transform: `translate(${finalX}px, 800px) rotate(${
            finalRotation + 180
          }deg) scale(0.5)`,
          opacity: 0,
          zIndex: 1,
          transition: "all 1s ease-in",
        };
      } else {
        return {
          transform: `translate(${finalX}px, ${finalY}px) rotate(${
            finalRotation + 720
          }deg) scale(0)`,
          opacity: 0,
          zIndex: 1,
          transition: "all 0.8s ease-out",
        };
      }
    }

    // if (readingPhase === "positioning" && isSelected) {
    //   const selectedIndex = selectedCards.indexOf(index);
    //   const cardSpacing = 300;
    //   const startX = (-(selectedCards.length - 1) * cardSpacing) / 2;
    //   const readingX = startX + selectedIndex * cardSpacing;
    //   const readingY = 0;
    //   const delay = selectedIndex * 200;

    //   return {
    //     transform: `translate(${readingX}px, ${readingY}px) rotate(0deg) scale(1.4)`,
    //     opacity: 1,
    //     zIndex: 10 + selectedIndex,
    //     transition: "all 0.8s cubic-bezier(0.25, 0.46, 0.45, 0.94)",
    //     transitionDelay: `${delay}ms`,
    //   };
    // }

    if (readingPhase === "positioning" && isSelected) {
      const selectedIndex = selectedCards.indexOf(index);
      const cardSpacing = 300;
      const startX = (-(selectedCards.length - 1) * cardSpacing) / 2;
      const readingX = startX + selectedIndex * cardSpacing - 50; // 👈 shifted left
      const readingY = 0;
      const delay = selectedIndex * 200;

      return {
        transform: `translate(${readingX}px, ${readingY}px) rotate(0deg) scale(1.4)`,
        opacity: 1,
        zIndex: 10 + selectedIndex,
        transition: "all 0.8s cubic-bezier(0.25, 0.46, 0.45, 0.94)",
        transitionDelay: `${delay}ms`,
      };
    }
    if ((readingPhase === "reading" || showReading) && isSelected) {
      const selectedIndex = selectedCards.indexOf(index);
      const cardSpacing = 300;
      const startX = (-(selectedCards.length - 1) * cardSpacing) / 2;
      const readingX = startX + selectedIndex * cardSpacing;
      const readingY = 0;

      return {
        transform: `translate(${readingX}px, ${readingY}px) rotate(0deg) scale(1.4)`,
        opacity: 1,
        zIndex: 10 + selectedIndex,
        transition: "all 0.3s ease-out",
      };
    }

    if (readingPhase !== "selecting" && !isSelected && !tornadoPhase) {
      return {
        transform: `translate(${finalX}px, ${finalY}px) rotate(${finalRotation}deg) scale(0)`,
        opacity: 0,
        zIndex: -1,
        transition: "none",
      };
    }

    let scale = 1;
    let zIndex = 1;
    let translateY = 0;

    if (selectedCards.includes(index)) {
      scale = 1.1;
      zIndex = 10;
      translateY = -20;
    } else if (hoveredCard === index) {
      scale = 1.05;
      zIndex = 5;
      translateY = -10;
    }

    return {
      transform: `translate(${finalX}px, ${
        finalY + translateY
      }px) rotate(${finalRotation}deg) scale(${scale})`,
      opacity: 1,
      zIndex,
      transition:
        animationPhase === "entered"
          ? "all 0.1s cubic-bezier(0.4, 0, 0.2, 1)"
          : "all 0.8s cubic-bezier(0.25, 0.46, 0.45, 0.94)",
    };
  };

  return (
    <div style={styles.container}>
      <div style={styles.overlay}></div>
      <button
        type="button"
        className="btn btn-primary absolute "
        style={{
          top: "2%",
          left: "2%",
          fontSize: "large",
          background: "none",
          width: "10%",
          border: "none",
          zIndex: 100,
        }}
        onClick={() => onStepChange(2)}
      >
        <i className="bi bi-arrow-left m-3"></i> Back
      </button>
      <Stars />

      {/* Suit symbols background */}
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          overflow: "hidden",
          opacity: 0.3,
        }}
      >
        <div
          style={{
            position: "absolute",
            top: "8rem",
            left: "33%",
            color: "rgba(196, 181, 253, 0.3)",
            fontSize: "2.5rem",
          }}
        >
          ♠
        </div>
        <div
          style={{
            position: "absolute",
            top: "12rem",
            right: "25%",
            color: "rgba(250, 204, 21, 0.3)",
            fontSize: "1.875rem",
          }}
        >
          ♦
        </div>
        <div
          style={{
            position: "absolute",
            bottom: "10rem",
            left: "25%",
            color: "rgba(147, 197, 253, 0.3)",
            fontSize: "1.875rem",
          }}
        >
          ♣
        </div>
        <div
          style={{
            position: "absolute",
            bottom: "14rem",
            right: "33%",
            color: "rgba(248, 113, 113, 0.3)",
            fontSize: "2.5rem",
          }}
        >
          ♥
        </div>
        <div
          style={{
            position: "absolute",
            top: "15rem",
            left: "4rem",
            color: "rgba(196, 181, 253, 0.2)",
            fontSize: "1.5rem",
          }}
        >
          ⭐
        </div>
        <div
          style={{
            position: "absolute",
            bottom: "5rem",
            right: "5rem",
            color: "rgba(250, 204, 21, 0.2)",
            fontSize: "1.5rem",
          }}
        >
          ⭐
        </div>
      </div>

      {/* Header */}
      {readingPhase === "selecting" && (
        <div style={styles.headerContainer}>
          <div className="text-center mb-4">
            <div style={styles.counterContainer}>
              <span
                className="text-white fw-light"
                style={{ fontSize: "1.125rem", letterSpacing: "0.1em" }}
              >
                Selected:
              </span>
              <div style={styles.counterBadge}>
                <span>{selectedCards.length}</span>
              </div>
              <span
                className="text-white fw-light"
                style={{ fontSize: "1.125rem", letterSpacing: "0.1em" }}
              >
                / 3
              </span>
            </div>
          </div>

          {readingPhase === "selecting" && (
            <div className="text-center">
              <h2
                className="text-white fw-bolder mb-2"
                style={{
                  opacity: 0.8,
                  // fontSize: "1.125rem",
                  letterSpacing: "0.1em",
                }}
              >
                {/* Thinking about your life situation */}
                Three-Card Spread
              </h2>
              <div className="fw-light" style={{ fontSize: "0.875rem" }}>
                {/* Select 3 cards for your mystical reading */}
                Select 3 cards from the deck
              </div>
            </div>
          )}

          {selectedCards.length === 3 && readingPhase === "selecting" && (
            <div className="text-center mt-4">
              <div
                className="fw-light mb-2"
                style={{ color: "#facc15", fontSize: "1.125rem" }}
              >
                ✨ Perfect! You've selected 3 cards ✨
              </div>
            </div>
          )}

          {readingPhase === "positioning" && !showReading && (
            <div className="text-center">
              <h2
                className="text-white fw-light mb-2"
                style={{
                  opacity: 0.8,
                  fontSize: "1.25rem",
                  letterSpacing: "0.1em",
                }}
              >
                Your Path Through Time
              </h2>
              <div style={{ color: "#c4b5fd", fontSize: "0.875rem" }}>
                Click any card to reveal your reading
              </div>
            </div>
          )}

          {showReading && readingPhase === "reading" && !showDescriptions && (
            <div className="text-center">
              <h3
                className="fw-light mb-2"
                style={{
                  color: "#facc15",
                  fontSize: "1.25rem",
                  letterSpacing: "0.1em",
                }}
              >
                Your Mystical Reading Unfolds...
              </h3>
              <div
                className="text-white mb-4"
                style={{ opacity: 0.8, fontSize: "0.875rem" }}
              >
                Click each card to reveal its meaning
              </div>
            </div>
          )}

          {tornadoPhase && (
            <div className="text-center">
              <div
                className="fw-light mb-2"
                style={{
                  color: "#facc15",
                  fontSize: "1.5rem",
                  letterSpacing: "0.1em",
                  animation: "pulse 2s infinite",
                }}
              >
                ✨ Mystical Card Reshuffling ✨
              </div>
              <div
                className="text-white"
                style={{ opacity: 0.7, fontSize: "0.875rem" }}
              >
                The cards scatter and realign with cosmic forces...
              </div>
            </div>
          )}
        </div>
      )}

      {/* Reading descriptions overlay */}
      {showDescriptions && (
        <div style={styles.readingOverlay}>
          <div className="text-center mb-5">
            <h1
              className="text-white fw-light mb-3"
              style={{ fontSize: "2.5rem", letterSpacing: "0.1em" }}
            >
              Your Reading
            </h1>
            <div
              style={{
                width: "6rem",
                height: "2px",
                background: "linear-gradient(to right, #facc15, #a855f7)",
                margin: "0 auto",
              }}
            ></div>

            <div className="mt-4">
              <Button
                variant="outline-warning"
                onClick={()=>{
                  resetWithCardScatter();
                  // onShuffle();
                }}
                style={{
                  padding: "0.75rem 2rem",
                  borderWidth: "2px",
                  borderColor: "rgba(250, 204, 21, 0.6)",
                  color: "#facc15",
                  backgroundColor: "transparent",
                  fontSize: "0.875rem",
                  fontWeight: "300",
                  letterSpacing: "0.1em",
                }}
                onMouseEnter={(e) => {
                  e.target.style.borderColor = "#facc15";
                  e.target.style.backgroundColor = "rgba(250, 204, 21, 0.1)";
                }}
                onMouseLeave={(e) => {
                  e.target.style.borderColor = "rgba(250, 204, 21, 0.6)";
                  e.target.style.backgroundColor = "transparent";
                }}
              >
                Draw New Cards
              </Button>
            </div>
          </div>

          <div className="container" style={{ maxWidth: "64rem" }}>
            <div
              style={{ display: "flex", flexDirection: "column", gap: "4rem" }}
            >
              {cardData.reading.map((card, i) => {
                const isLeft = i % 2 === 0;
                const timeLabels = ["Past", "Present", "Future"];

                return (
                  // <div
                  //   key={cardIndex}
                  //   className={`d-flex align-items-center ${
                  //     isLeft ? "" : "flex-row-reverse"
                  //   }`}
                  //   style={{ gap: "2rem" }}
                  // >
                  //   <div style={{ flexShrink: 0 }}>
                  //     <div style={styles.readingCard}>
                  //       <div
                  //         style={{
                  //           position: "absolute",
                  //           top: 0,
                  //           left: 0,
                  //           right: 0,
                  //           bottom: 0,
                  //           background:
                  //             "linear-gradient(to bottom right, rgba(88, 28, 135, 0.2), rgba(30, 58, 138, 0.3))",
                  //         }}
                  //       />
                  //       <div
                  //         style={{
                  //           position: "absolute",
                  //           top: 0,
                  //           left: 0,
                  //           right: 0,
                  //           bottom: 0,
                  //           display: "flex",
                  //           flexDirection: "column",
                  //           alignItems: "center",
                  //           justifyContent: "center",
                  //           color: "#581c87",
                  //         }}
                  //       >
                  //         <div
                  //           style={{ fontSize: "1.5rem", marginBottom: "1rem" }}
                  //         >
                  //           {["★", "◆", "♦", "●", "▲"][cardIndex % 5]}
                  //         </div>
                  //         <div
                  //           style={{
                  //             width: "4rem",
                  //             height: "4rem",
                  //             border: "4px solid #581c87",
                  //             borderRadius: "50%",
                  //             display: "flex",
                  //             alignItems: "center",
                  //             justifyContent: "center",
                  //             marginBottom: "1rem",
                  //           }}
                  //         >
                  //           <div
                  //             style={{
                  //               width: "2rem",
                  //               height: "2rem",
                  //               background:
                  //                 "linear-gradient(to bottom right, #facc15, #f97316)",
                  //               borderRadius: "50%",
                  //             }}
                  //           />
                  //         </div>
                  //         <div
                  //           style={{
                  //             fontSize: "1.5rem",
                  //             transform: "rotate(180deg)",
                  //           }}
                  //         >
                  //           {["★", "◆", "♦", "●", "▲"][cardIndex % 5]}
                  //         </div>
                  //       </div>
                  //     </div>
                  //   </div>

                  //   <div style={{ flex: 1, maxWidth: "32rem" }}>
                  //     <div className="mb-4">
                  //       <div
                  //         className="d-flex align-items-center mb-2"
                  //         style={{ gap: "0.75rem" }}
                  //       >
                  //         <div
                  //           style={{
                  //             width: "2rem",
                  //             height: "2rem",
                  //             borderRadius: "50%",
                  //             border: "2px solid rgba(250, 204, 21, 0.5)",
                  //             display: "flex",
                  //             alignItems: "center",
                  //             justifyContent: "center",
                  //             color: "#facc15",
                  //             fontSize: "0.875rem",
                  //             fontWeight: "300",
                  //           }}
                  //         >
                  //           {i + 1}
                  //         </div>
                  //         <span
                  //           style={{
                  //             color: "rgba(250, 204, 21, 0.8)",
                  //             fontSize: "0.875rem",
                  //             fontWeight: "300",
                  //             letterSpacing: "0.1em",
                  //             textTransform: "uppercase",
                  //           }}
                  //         >
                  //           {timeLabels[i]}
                  //         </span>
                  //       </div>
                  //       <h2
                  //         className="text-white fw-light mb-4"
                  //         style={{
                  //           fontSize: "1.875rem",
                  //           letterSpacing: "0.05em",
                  //         }}
                  //       >
                  //         {card.title}
                  //       </h2>
                  //     </div>

                  //     <p
                  //       className="text-white fw-light"
                  //       style={{
                  //         opacity: 0.8,
                  //         fontSize: "1rem",
                  //         lineHeight: "1.6",
                  //       }}
                  //     >
                  //       {card.description}
                  //     </p>
                  //   </div>
                  // </div>
                  <div
                    key={card.id}
                    className={`d-flex align-items-center ${
                      isLeft ? "" : "flex-row-reverse"
                    }`}
                    style={{ gap: "2rem" }}
                  >
                    <div style={{ flexShrink: 0 }}>
                      <div style={styles.readingCard}>
                        <img
                          src={card.image_url}
                          alt={card.card}
                          style={{
                            width: "100%",
                            height: "100%",
                            objectFit: "cover",
                            borderRadius: "0.75rem",
                          }}
                        />
                      </div>
                    </div>

                    <div style={{ flex: 1, maxWidth: "32rem" }}>
                      <div className="mb-4">
                        <div
                          className="d-flex align-items-center mb-2"
                          style={{ gap: "0.75rem" }}
                        >
                          <div
                            style={{
                              width: "2rem",
                              height: "2rem",
                              borderRadius: "50%",
                              border: "2px solid rgba(250, 204, 21, 0.5)",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              color: "#facc15",
                              fontSize: "0.875rem",
                              fontWeight: "300",
                            }}
                          >
                            {i + 1}
                          </div>
                          <span
                            style={{
                              color: "rgba(250, 204, 21, 0.8)",
                              fontSize: "0.875rem",
                              fontWeight: "300",
                              letterSpacing: "0.1em",
                              textTransform: "uppercase",
                            }}
                          >
                            {card.position}
                          </span>
                        </div>
                        <h2
                          className="text-white fw-light mb-4"
                          style={{
                            fontSize: "1.875rem",
                            letterSpacing: "0.05em",
                          }}
                        >
                          {card.card} {card.reversed && "(Reversed)"}
                        </h2>
                      </div>

                      <p
                        className="text-white fw-light"
                        style={{
                          opacity: 0.8,
                          fontSize: "1rem",
                          lineHeight: "1.6",
                        }}
                      >
                        {card.meaning}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Time labels */}
      {(readingPhase === "positioning" || readingPhase === "reading") &&
        selectedCards.length === 3 &&
        !showDescriptions && (
          <div style={styles.timeLabelsContainer}>
            <div style={styles.timeLabels}>
              {["Past", "Present", "Future"].map((timeLabel, i) => (
                <div key={timeLabel} className="text-center">
                  <div
                    className="fw-light mb-2"
                    style={{
                      color: "rgba(250, 204, 21, 0.9)",
                      fontSize: "1.125rem",
                      letterSpacing: "0.1em",
                    }}
                  >
                    {timeLabel}
                  </div>
                  <div
                    style={{
                      width: "4rem",
                      height: "2px",
                      background:
                        "linear-gradient(to right, transparent, rgba(250, 204, 21, 0.6), transparent)",
                      margin: "0 auto",
                    }}
                  ></div>
                </div>
              ))}
            </div>
          </div>
        )}

      {/* Cards container */}
      <div
        style={{
          ...styles.cardContainer,
          opacity: showDescriptions ? 0 : 1,
          pointerEvents: showDescriptions ? "none" : "auto",
          transition: "opacity 0.5s ease-out",
        }}
      >
        {cards.map((cardIndex) => (
          <div
            key={cardIndex}
            style={{
              ...styles.card,
              ...getCardTransform(cardIndex),
              transitionDelay:
                animationPhase === "entered" ? `${cardIndex * 60}ms` : "0ms",
              pointerEvents: tornadoPhase ? "none" : "auto",
            }}
            onMouseEnter={() =>
              readingPhase === "selecting" && setHoveredCard(cardIndex)
            }
            onMouseLeave={() => setHoveredCard(null)}
            onClick={() => handleCardClick(cardIndex)}
          >
            <div
              style={{
                transformStyle: "preserve-3d",
                transform: revealedCards.includes(cardIndex)
                  ? "rotateY(180deg)"
                  : "rotateY(0deg)",
                transition: "transform 0.8s cubic-bezier(0.4, 0, 0.2, 1)",
              }}
            >
              {/* Card back */}
              <div style={styles.cardBack}>
                <div
                  style={{
                    width: "150%",
                    height: "160%",
                    borderRadius: "0.75rem",
                    // border: "3px solid",
                    // borderColor: selectedCards.includes(cardIndex)
                    //   ? "#8b5fbf"
                    //   : "rgba(139, 95, 191, 0.6)",
                    // background: selectedCards.includes(cardIndex)
                    //   ? 'linear-gradient(135deg, #4c1d95, #6b21a8, #312e81)'
                    //   : 'linear-gradient(135deg, #1e1b4b, #4c1d95, #312e81)',
                    backgroundImage: `url(${card2})`,
                    backgroundSize: "cover", // Ensures image covers the whole div
                    // backgroundPosition: "center",
                    position: "relative",
                    overflow: "hidden",
                  }}
                >
                  {/* Selection glow */}
                  {selectedCards.includes(cardIndex) && (
                    <div
                      style={{
                        position: "absolute",
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        borderRadius: "0.5rem",
                        // backgroundColor: "rgba(168, 85, 247, 0.2)",
                        animation: "pulse 2s infinite",
                      }}
                    />
                  )}

                  {/* Hover glow */}
                  {hoveredCard === cardIndex &&
                    !selectedCards.includes(cardIndex) && (
                      <div
                        style={{
                          position: "absolute",
                          top: 0,
                          left: 0,
                          right: 0,
                          bottom: 0,
                          borderRadius: "0.5rem",
                          // backgroundColor: "rgba(196, 181, 253, 0.15)",
                          animation: "pulse 2s infinite",
                        }}
                      />
                    )}
                </div>
              </div>

              {/* Card front */}
              <div style={styles.cardFront}>
                {/* <div
                  style={{
                    width: "150%",
                    height: "150%",
                    borderRadius: "0.75rem",
                    border: "3px solid #8b5fbf",
                    background: "linear-gradient(135deg, #4c1d95, #6b21a8)",
                    position: "relative",
                    overflow: "hidden",
                  }}
                >
                  <div
                    style={{
                      position: "relative",
                      top: 0,
                      left: 0,
                      right: 0,
                      bottom: 0,
                      background:
                        "radial-gradient(circle at center, rgba(139, 95, 191, 0.3), rgba(76, 29, 149, 0.6))",
                    }}
                  />
                  <div
                    style={{
                      position: "absolute",
                      top: 0,
                      left: 0,
                      right: 0,
                      bottom: 0,
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      justifyContent: "center",
                      color: "#c4b5fd",
                    }}
                  >
                    <div style={{ fontSize: "1.2rem", marginBottom: "8px" }}>
                      {["★", "◆", "♦", "●", "▲"][cardIndex % 5]}
                    </div>
                    <div
                      style={{
                        width: "50px",
                        height: "50px",
                        border: "3px solid #c4b5fd",
                        borderRadius: "50%",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        marginBottom: "8px",
                      }}
                    >
                      <div
                        style={{
                          width: "20px",
                          height: "20px",
                          background:
                            "linear-gradient(135deg, #facc15, #f97316)",
                          borderRadius: "50%",
                        }}
                      />
                    </div>
                    <div
                      style={{
                        fontSize: "1.2rem",
                        transform: "rotate(180deg)",
                      }}
                    >
                      {["★", "◆", "♦", "●", "▲"][cardIndex % 5]}
                    </div>
                  </div>
                </div> */}
                {showReading &&
                revealedCards.includes(cardIndex) &&
                cardData?.reading?.[revealedCards.indexOf(cardIndex)] ? (
                  <img
                    src={
                      cardData.reading[revealedCards.indexOf(cardIndex)]
                        .image_url
                    }
                    alt={
                      cardData.reading[revealedCards.indexOf(cardIndex)].card
                    }
                    style={{
                      width: "170%",
                      height: "150%",
                      objectFit: "cover",
                      borderRadius: "0.75rem",
                    }}
                  />
                ) : (
                  <div
                    style={{
                      width: "100%",
                      height: "100%",
                      background: "linear-gradient(135deg, #4c1d95, #6b21a8)",
                      borderRadius: "0.75rem",
                    }}
                  />
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      <style jsx>{`
        @keyframes pulse {
          0%,
          100% {
            opacity: 1;
          }
          50% {
            opacity: 0.5;
          }
        }
      `}</style>
    </div>
  );
};

export default TarotCardSelector;
