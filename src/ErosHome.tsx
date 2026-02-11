import React from "react";
import { useNavigate } from "react-router-dom";
import videoBackground from "../src/assets/webm/eroswellness.mp4";
import notification from "../src/assets/notification.png";
import credits from "../src/assets/credits.png";
import eroslogo from "../src/assets/eros-logo.png"



const ErosHome = () => {
  const navigate = useNavigate();

  const handleClick = () => {
    navigate("/facescan");
  };
  const handleRasiClick = () => {

    navigate("/rasi-chart");
  };

  const scrollToContent = () => {
    window.scrollTo({
      top: window.innerHeight,
      behavior: 'smooth'
    });
  };

  return (
    <div style={{ position: 'relative', width: '100vw', height: '100vh' }}>
      {/* Main Hero Section */}
      <div

        style={{
          position: 'relative',
          height: '100vh',
          width: '100vw',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          color: 'white',
          textAlign: 'center',
          overflow: 'hidden',
        }}
      >
        {/* Video Background */}
        <video
          autoPlay
          loop
          muted
          playsInline
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            minWidth: '100%',
            minHeight: '100%',
            width: 'auto',
            height: 'auto',
            transform: 'translate(-50%, -50%)',
            zIndex: 0,
            objectFit: 'cover',
          }}
        >
          <source src={videoBackground} type="video/mp4" />
        </video>

        {/* Dark Overlay */}
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

        {/* Top Navigation Bar */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            background: 'linear-gradient(to bottom, #000 95%, transparent 95%)', // Creates the "design line" effect
            backdropFilter: 'blur(4px)', // Subtle frosted glass effect (optional but modern)
            WebkitBackdropFilter: 'blur(4px)', // Safari support
            display: 'flex',
            justifyContent: 'flex-end',
            alignItems: 'center',
            padding: '20px 40px',
            gap: '20px',
            zIndex: 3,
            borderBottom: '1px solid rgba(255, 255, 255, 0.08)', // Secondary subtle line
            boxShadow: '0 2px 10px rgba(0, 0, 0, 0.3)', // Depth enhancement
          }}
        >
          <button
            style={{
              // background: 'linear-gradient(135deg, rgb(170, 225, 39) 0%, rgb(0, 162, 255) 100%)',
              border: 'none',
              borderRadius: '20px',
              padding: '10px 24px',
              fontSize: '14px',
              cursor: 'pointer',
              color: 'white',
              fontWeight: '600',
              transition: 'transform 0.2s ease, box-shadow 0.2s ease',
              boxShadow: '0 4px 8px rgba(0, 0, 0, 0.25)',
              minWidth: '140px',
              background:"linear-gradient(135deg, rgb(137, 219, 255) 0%, rgb(74, 164, 227) 100%)"
            }}
            onClick={handleRasiClick}
            onMouseOver={(e) => (e.currentTarget.style.transform = 'scale(1.05)')}
            onMouseOut={(e) => (e.currentTarget.style.transform = 'scale(1)')}
            aria-label="View Rasi Chart"
          >
            View Rasi Chart
          </button>

          <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
            {/* Notification Button */}

            <img
              src={notification}
              alt=""
              style={{ width: '28px', height: '28px', display: 'block' }}
            />


            {/* Credits Display */}

            <img
              src={credits}
              alt="Credits icon"
              style={{ width: '100%', height: '38px' }}
            />




          </div>
        </div>


        <div

          style={{
            zIndex: 2,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '32px',
            maxWidth: '90%',
            padding: '0 20px',
          }}
        >

          <div
            style={{
              fontSize: '16px',
              fontFamily: '"Inter", sans-serif',
              letterSpacing: '2px',
              textTransform: 'uppercase',
              opacity: 0.9,
              marginBottom: '-10px',
            }}
          >
            EROS Universe's
          </div>


          {/* <h1 

            style={{
              fontSize: 'clamp(40px, 8vw, 96px)',
              fontFamily: '"Poppins", "Inter", system-ui, -apple-system, sans-serif',
              margin: 0,
              fontWeight: '600',
              background: 'linear-gradient(135deg, rgb(170, 225, 39) 0%, rgb(100, 200, 255) 50%, rgb(0, 162, 255) 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
              lineHeight: 1.1,
            }}
          >
            EROS Wellness
          </h1> */}

          <img
            src={eroslogo}
            alt="EROS Wellness Logo"
            style={{
              width: 'clamp(200px, 40vw, 500px)',
              height: 'auto',
              maxWidth: '500px',
              margin: 0,
              objectFit: 'contain',
              filter: 'drop-shadow(0 4px 12px rgba(0, 0, 0, 0.2))',
              transition: 'transform 0.3s ease',
            }}
            onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.02)'}
            onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
          />


          <p
            style={{
              fontSize: 'clamp(20px, 3vw, 25px)',
              fontFamily: '"Poppins", "Inter", system-ui, -apple-system, sans-serif',

              margin: 0,
              maxWidth: '800px',
              opacity: 0.95,
              fontWeight: '300',
            }}
          >
            Your personal AI spiritual companion — illuminating your path through astrology, energy
            readings, and ancient wisdom tailored uniquely for you.
          </p>
        </div>

        {/* Bottom Section */}
        <div
          style={{
            position: 'absolute',
            bottom: '20px',
            left: 0,
            right: 0,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '20px',
            zIndex: 2,
          }}
        >
          {/* Early Access Section */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '12px',
            }}
          >
            <h2
              style={{
                fontSize: 'clamp(14px, 5vw, 36px)',
                fontFamily: 'Inter, system-ui, -apple-system, sans-serif',
                margin: 0,
                fontWeight: '700',
              }}
            >
              You're Among the First
            </h2>
            <p
              style={{
                fontSize: 'clamp(20px, 3vw, 25px)',
                fontFamily: 'Inter, system-ui, -apple-system, sans-serif',
                margin: 0,
                opacity: 0.85,
                fontWeight: '300',
              }}
            >
              You've unlocked early access. Get ready to experience what's next.
            </p>
          </div>

          {/* Scroll Down Indicator */}
          <button
            onClick={handleClick}
            style={{
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              color: 'white',
              fontSize: '24px',
              animation: 'bounce 2s infinite',
              padding: '10px',
              marginTop: '10px',
            }}
          >
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              style={{ transform: 'rotate(0deg)' }}
            >
              <path
                d="M9 18l6-6-6-6"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
        </div>
      </div>

      {/* Welcome Section Below Fold */}


      {/* Add bounce animation for scroll indicator */}
      <style>{`
        @keyframes bounce {
          0%, 20%, 50%, 80%, 100% {
            transform: rotate(90deg) translateY(0);
          }
          40% {
            transform: rotate(90deg) translateY(-10px);
          }
          60% {
            transform: rotate(90deg) translateY(-5px);
          }
        }

        /* Responsive adjustments */
        @media (max-width: 768px) {
          video {
            object-fit: cover;
          }
        }
      `}</style>
    </div>
  );
};

export default ErosHome;