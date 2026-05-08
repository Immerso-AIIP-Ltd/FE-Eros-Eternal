import React from "react";
import { useNavigate } from "react-router-dom";
import background from "@/assets/images/welcome-screen.jpg";
import ErosClinicLogo from "@/assets/images/eros-wellness-ai-clinic-cropped.png";
import { usePhcSession } from "@/context/PhcSessionContext";
import { getPhcCopy } from "@/i18n/phcCopy";


const WellnessScreen = () => {
      const navigate = useNavigate();
      const { language } = usePhcSession();
      const t = getPhcCopy(language);

      const handleClick = () =>{
        navigate("/profile");
      }


  return (
    <div 
      style={{
        backgroundImage: `url(${background})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        height: '100vh',
        width: '100vw',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'flex-end', // Align content to bottom
        alignItems: 'center',
        color: 'white',
        textAlign: 'center',
        margin: 0,
        padding: 0,
        fontFamily: 'Arial, sans-serif',
        position: 'relative',
      }}
    >
      {/* Overlay with 64% opacity */}
      <div 
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.64)',
          zIndex: 1,
        }}
      />
      
      {/* Footer content */}
      <div 
        style={{
          width: 'min(748px, calc(100vw - 32px))',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          gap: '18px',
          marginBottom: '50px', // Adjust as needed for positioning
          zIndex: 2,
        }}
      >
        <div
          style={{
            background: "rgba(255,255,255,0.94)",
            borderRadius: 16,
            padding: "10px 16px",
            boxShadow: "0 14px 34px rgba(0,0,0,0.22)",
          }}
        >
          <img
            src={ErosClinicLogo}
            alt="EROS Wellness AI Clinic"
            style={{ width: 230, maxWidth: "70vw", height: "auto", display: "block" }}
          />
        </div>
        <h2 
          style={{
            fontSize: '38px',
            fontFamily: 'Lato, sans-serif',
            margin: 0,
            fontWeight: 'bold',
          }}
        >
          {t.welcomeTitle}
        </h2>
        <p
          style={{
            margin: "-12px 0 0",
            fontSize: "18px",
            fontWeight: 600,
            opacity: 0.92,
          }}
        >
          {t.welcomeSubtitle}
        </p>
        
        <button 
          style={{
            background: 'linear-gradient(135deg, rgb(170, 225, 39) 0%, rgb(0, 162, 255) 100%)',
            border: 'none',
            borderRadius: '20px',
            padding: '10px 24px',
            fontSize: '16px',
            cursor: 'pointer',
            color: 'white',
            fontWeight: 'bold',
            transition: 'transform 0.2s',
            boxShadow: '0 4px 8px rgba(0,0,0,0.2)',
            width: 'auto', 
          }}
          onMouseOver={(e) => e.target.style.transform = 'scale(1.05)'}
          onMouseOut={(e) => e.target.style.transform = 'scale(1)'}
          onClick={handleClick}
        >
          {t.continue}
        </button>
      </div>
    </div>
  );
};

export default WellnessScreen;
