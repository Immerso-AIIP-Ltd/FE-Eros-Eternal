// src/SplashScreen.tsx
import React from "react";
import { useNavigate } from "react-router-dom";

import "./SplashScreen.css"; // <-- Add this at the top

// Import image (ensure it's in public/images/ or src/assets/)
import backgroundImg from "./background.png"; // Adjust path if needed

const SplashScreen: React.FC = () => {
  const navigate = useNavigate();
  return (
    // Full viewport width and height
    <div className="min-vh-100 vw-100 bg-black text-white d-flex align-items-center justify-content-center position-relative overflow-hidden">
      {/* Animated Rotating Background Image */}
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
          transform: "translate(-50%, -50%) rotate(0deg)",
          width: "800px",
          height: "800px",
          filter:
            "brightness(4) saturate(0%) contrast(150%) invert(1) hue-rotate(0deg)",
        }}
      />

      {/* Decorative Stars */}
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

      {/* Main Content */}
      <div
        className="text-center px-4"
        style={{ maxWidth: "640px", zIndex: 10 }}
      >
        {/* Overlay Content */}
        <div className="mb-4">
          <div
            className="text-light opacity-70 fw-medium mb-1"
            style={{ fontSize: "24px", letterSpacing: "1px",color:"rgba(255, 255, 255, 1)",fontFamily:"Manrope" }}
          >
            EROS Universe
          </div>
           {/* <h1 
    className=" fw-bold" 
    style={{
      background: 'linear-gradient(90deg, rgb(74, 222, 128), rgb(96, 165, 250))',
      WebkitBackgroundClip: 'text',
      WebkitTextFillColor: 'transparent',
      backgroundClip: 'text',
      color: 'transparent',
      margin: 0,
      fontFamily: "'Poppins', sans-serif"
    }}
  >
    Eternal AI
  </h1> */}
              <h2 style={{ color: "rgba(0, 184, 248, 1)", fontSize: "64px",fontFamily:"Montserrat" ,}}> Eternal AI</h2>
          {/* <h2 className="h4 fw-bold" style={{color: "#00A2FF",}}> Eternal AI</h2> */}
          <p
            className="text-light opacity-80 mb-4"
            style={{ fontSize: "1.9rem",fontFamily:"Manrope"}}
          >
            Eternal AI is your personal companion for inner growth and
            exploration.
          </p>

          {/* Action Buttons */}
          <div className="d-flex flex-wrap justify-content-center gap-3 mt-4">
            {/* Outline Button with Rocket Icon */}
            <button
              className="btn btn-outline-light rounded-pill px-4 py-2 d-flex align-items-center"
              style={{ borderColor: "#ffffff",fontFamily:"Poppins" }}
            >
              {/* <svg
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                fill="currentColor"
                viewBox="0 0 16 16"
                className="me-2"
              >
                <path d="M14.5 3a1 1 0 0 1-1 1h-2.9l-1.7 1.1-2.5-2.5L8 4.4l1.1-1.7H6a1 1 0 0 1 0-2h6a1 1 0 0 1 1 1v2zM7.5 6.5l-1.5 1.5-2.5-2.5L4.5 4l1.5 1.5L8 3.5 7.5 6.5zm-5 5a1 1 0 0 1 1-1h6.4l1.5 1.5-1.5 1.5H2.5a1 1 0 0 1-1-1v-2zm6.5 3a1 1 0 0 1-1-1v-2.9l1.7 1.1 2.5-2.5 1.1 1.1-1.7 1.7H12a1 1 0 0 1 1 1v2a1 1 0 0 1-1 1H8z"/>
              </svg> */}
             How it works
            </button>

            {/* Solid Info Button */}
            <button
              onClick={() => {
                console.log("check its working");
                navigate("/founder");
              }}
              className="btn btn-info text-white rounded-pill px-4 py-2 fw-medium" style={{fontFamily:"Poppins"}}
            >
              Begin your journey
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SplashScreen;
