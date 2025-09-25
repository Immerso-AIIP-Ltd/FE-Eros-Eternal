// src/EternalAIPage.tsx
import React from "react";
import { useNavigate } from "react-router-dom";
import backgroundImg from "./background.png";
import personImg from "./main-person.png";
import "./SplashScreen.css";
import { PiStarFourFill } from "react-icons/pi";
import { BsStars } from "react-icons/bs";
import Stars from "./components/stars";
const EternalAIPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-vh-100 vw-100 bg-black text-white position-relative overflow-hidden">
      {/* Stars */}
      {/* <div className="position-absolute w-100 h-100 pointer-events-none">
        {Array.from({ length: 50 }).map((_, i) => (
          <div
            key={i}
            className="text-white star-blink"
            style={{
              position: "absolute",
              top: `${Math.random() * 100}%`,
              left: `${Math.random() * 100}%`,
              fontSize: `${Math.random() * 15 + 6}px`,
              opacity: Math.random() * 0.7 + 0.3,
              animationDelay: `${Math.random() * 10}s`,
              animationDuration: `${Math.random() * 5 + 1}s`,
            }}
          >
            <PiStarFourFill />
          </div>
        ))}
      </div> */}

      <Stars/>

      {/* Main Content */}
      <div
        className="container-fluid px-4 py-5 d-flex flex-column flex-lg-row align-items-center justify-content-center"
        style={{ minHeight: "100vh" }}
      >
        {/* Left Side - Zodiac Wheel + Person */}
        <div className="col-12 col-lg-6 d-flex justify-content-center mb-5 mb-lg-0">
          <div
            className="position-relative"
            style={{ width: "850px", height: "620px" }}
          >
            {/* Zodiac Wheel Background (Faint White) */}
            {/* <img
              src={backgroundImg}
              alt="Zodiac wheel"
              className="w-100 h-100 object-fit-contain "
              style={{
                maxWidth: "100%",
                maxHeight: "100%",
                filter: "brightness(3) saturate(0%) contrast(200%) invert(1)",
                zIndex: 1,
                opacity: 5.3,
              }}
            /> */}

            <img
              src={backgroundImg}
              alt="Rotating Cosmic Background"
              className="rotate-image-bg position-absolute"
              style={{
                zIndex: 0,
                opacity: 3.15,
                pointerEvents: "none",
                top: "50%",
                left: "50%",
                transform: "translate(-1%, 3%) rotate(100deg);",
                animation: "rotateAnimation 10s linear infinte",
                width: "100%",
                // height: "800px",
                filter:
                  "brightness(2) saturate(0%) contrast(150%) invert(1) hue-rotate(0deg)",
              }}
            />

            {/* Meditating Person Overlay (Clear & Slightly Brighter) */}
            <img
              src={personImg}
              alt="Meditating figure"
              className="position-absolute top-0 start-0 w-100 h-100 object-fit-contain "
              style={{
                maxWidth: "100%",
                maxHeight: "100%",
                zIndex: 2,
                filter: "brightness(1.2) contrast(1.1)",
                pointerEvents: "none", // ✅ allow clicks through
              }}
            />
          </div>
        </div>

        {/* Right Side - Content */}
        <div className="col-12 col-lg-5 col-xl-4 d-flex flex-column align-items-center text-center text-lg-start">
          {/* Header */}
          <div className="mb-4" style={{ textAlign: "center" }}>
            <p
              className=" mb-2"
              style={{ opacity: 0.8, fontSize: "1.5rem" ,color:"rgba(255, 255, 255, 1)",fontFamily:"Manrope"}}
            >
              Welcome to
            </p>
            <h2  style={{color: "rgba(0, 184, 248, 1)",fontSize:"64px"}}> Eternal AI</h2>
          </div>

          {/* Subtitle */}
          <p
            className="text-white mb-3"
            style={{ opacity: 0.9, fontSize: "20px", lineHeight: 1.6 ,fontFamily:"Inter"}}
          >
            Decode your aura. Track your vibe. Align with your cosmic path.
          </p>

          {/* Features List */}
          <div className="mb-5 text-start">
            <div className="d-flex align-items-center gap-2 mb-3  justify-content-center" style={{fontFamily:"Inter"}}>
              <span style={{ fontSize: "1.2rem" }}>✨</span>
              <span style={{ opacity: 0.9, fontSize: "0.9rem",color:"" }}>
                You'll unlock:
              </span>
            </div>

            <ul className="list-unstyled" style={{ opacity: 0.9 }}>
              <li className="d-flex align-items-center gap-3 mb-2">
                <span style={{ opacity: 0.6, fontSize: "1.2rem" }}><BsStars /></span>
                <span>Your Vibe Score (Vibe Unlocked)</span>
              </li>
              <li className="d-flex align-items-center gap-3 mb-2">
                <span style={{ opacity: 0.6, fontSize: "1.2rem" }}><BsStars /></span>
                <span>Aura Mood & Color (Farm your Aura)</span>
              </li>
              <li className="d-flex align-items-center gap-3 mb-2">
                <span style={{ opacity: 0.6, fontSize: "1.2rem" }}><BsStars /></span>
                <span>Star Map (Sync with galaxy)</span>
              </li>
              <li className="d-flex align-items-center gap-3 mb-2">
                <span style={{ opacity: 0.6, fontSize: "1.2rem" }}><BsStars /></span>
                <span>Flame Score (Inner flame reveal)</span>
              </li>
              <li className="d-flex align-items-center gap-3">
                <span style={{ opacity: 0.6, fontSize: "1.2rem" }}><BsStars /></span>
                <span>Health & Longevity Blueprint</span>
              </li>
            </ul>
          </div>

          {/* CTA Button */}

          <button
            onClick={() => navigate("/ques")}

            className="btn btn-info text-white  py-3 fs-5  fw-medium"

            style={{
              backgroundColor: "rgba(0, 184, 248, 1)",
              borderColor: "rgba(0, 184, 248, 1)",
              cursor: "pointer",
              position: "relative",
              zIndex: 10,
              fontFamily:"Inter",
              width:"480px"
            }}
          >
            Start Your Soul Journey
          </button>
        </div>
      </div>
    </div>
  );
};

export default EternalAIPage;
