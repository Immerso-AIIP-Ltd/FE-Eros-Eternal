import React from "react";
import { useNavigate } from "react-router-dom";
import background from "../src/images/welcome-screen.jpg";


const WellnessScreen = () => {
      const navigate = useNavigate();

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
          width: '748px',
          height: '104px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          gap: '24px',
          marginBottom: '50px', // Adjust as needed for positioning
          zIndex: 2,
        }}
      >
        <h2 
          style={{
            fontSize: '38px',
            fontFamily: 'Lato, sans-serif',
            margin: 0,
            fontWeight: 'bold',
          }}
        >
          Welcome to EROS Wellness
        </h2>
        
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
          Continue
        </button>
      </div>
    </div>
  );
};

export default WellnessScreen;