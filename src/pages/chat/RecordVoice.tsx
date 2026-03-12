// src/RecordVoice.tsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './RecordVoice.css';
import {  Button, Card } from 'react-bootstrap';

import aura from '@/assets/images/aura profile.png';
import star from '@/assets/images/star.png';
import vibrational from '@/assets/images/vibrational.png';
import kosha from '@/assets/images/kosha.png';
import flame from '@/assets/images/flame.png';
import longevity from '@/assets/images/longevity.png';
import Stars from '@/components/ui/stars';

const RecordVoice: React.FC = () => {
  const navigate = useNavigate();
  const [isListening, setIsListening] = useState(false);
  const [activeItem, setActiveItem] = useState<string | null>('Vibrational Frequency');

  const handleItemClick = (itemName: string) => {
    setActiveItem(itemName);
  };

  const handleMicrophoneClick = () => {
    setIsListening(!isListening);
  };

  const handleMicrophone = () =>{
    navigate('/chat')
  }

  return (
    <div className="min-vh-100 min-vw-100 d-flex bg-black position-relative overflow-hidden">
      {/* Star Background */}
      {/* <div className="position-absolute w-100 h-100 pointer-events-none">
        {Array.from({ length: 12 }).map((_, i) => (
          <div
            key={i}
            className="position-absolute text-white"
            style={{
              top: `${Math.random() * 100}%`,
              left: `${Math.random() * 100}%`,
              fontSize: `${Math.random() * 10 + 10}px`,
              opacity: Math.random() * 0.7 + 0.3,
            }}
          >
            ✦
          </div>
        ))}
      </div> */}
      <Stars />
      {/* Sidebar - Left Side */}
      <div
        className="d-flex flex-column text-white m-3 rounded-lg"
        style={{
          width: '286px',
          backgroundColor: '#1E2123',
          zIndex: 10,
          color: 'white',
        }}
      >
        {/* Header */}
        <div className="p-4 border-bottom border-secondary">
          <h1 className="text-info fw-bold fs-4">EROS CHAT AI</h1>
        </div>

        {/* Navigation */}
        <div className="p-3 flex-grow-1">
          {[
            { name: 'Vibrational Frequency', icon: vibrational },
            { name: 'Aura Profile', icon: aura },
            // { name: 'Star Map', icon: star },
             { name: 'Birth Chart', icon: star },
            { name: 'Kosha Map', icon: kosha },
            { name: 'Flame Score', icon: flame },
            { name: 'Longevity Blueprint', icon: longevity },
          ].map((item) => (
            <button
              key={item.name}
              className="d-flex align-items-center p-3 text-secondary border-0 w-100 text-start"
              style={{
                fontSize: '0.9rem',
                cursor: 'pointer',
                backgroundColor: activeItem === item.name ? '#00b8f8' : 'transparent',
                color: activeItem === item.name ? 'white' : '#ccc',
                borderRadius: '8px',
                outline: 'none',
                border: 'none',
                width: '100%',
                transition: 'background-color 0.2s ease, color 0.2s ease',
              }}
              onClick={() => handleItemClick(item.name)}
            >
              <img
                src={item.icon}
                alt={item.name}
                style={{ width: '16px', height: '16px', marginRight: '12px' }}
              />
              {item.name}
            </button>
          ))}
        </div>

        {/* Upgrade Card */}
        <div className="p-3">
          <Card className="bg-info text-white rounded-4 text-center">
            <Card.Body>
              <div
                className="rounded-circle bg-opacity-20 d-flex align-items-center justify-content-center mx-auto mb-3"
                style={{ width: '48px', height: '48px' }}
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 0l2.4 7.2L22 8l-5.6 5.6L18 22l-7.2-3.6L3.6 22 5 14.4 0 8l7.6-0.8L12 0z" />
                </svg>
              </div>
              <h3 className="h5 fw-bold">Upgrade to Pro</h3>
              <p className="small opacity-80 mb-3">
                Unlock powerful features with our pro upgrade today!
              </p>
              <Button variant="light" className="w-100 rounded-pill py-2 fw-medium">
                Upgrade now <i className="bi bi-arrow-right"></i>
              </Button>
            </Card.Body>
          </Card>
        </div>
      </div>

      {/* Main Content - Centered */}
      <div className="flex-grow-1 d-flex flex-column justify-content-center align-items-center position-relative z-10 px-3 py-5">
        {/* Animated Blue Dots */}
        <div className="d-flex gap-1 justify-content-center mb-4">
          {[...Array(4)].map((_, i) => (
            <div
              key={i}
              className={`dot ${isListening ? 'pulse' : ''}`}
              style={{
                width: '36px',
                height: '48px',
                borderRadius: '50%',
                backgroundColor: '#00BFFF',
                animationDelay: `${i * 0.2}s`,
                transition: 'all 0.5s ease',
              }}
            ></div>
          ))}
        </div>

        {/* Microphone & Close Buttons */}
        <div className="d-flex gap-3">
          <button
            onClick={handleMicrophoneClick}
            className="btn btn-light rounded-circle p-3"
            aria-label="Toggle microphone"
            style={{
              width: '50px',
              height: '50px',
              border: 'none',
              boxShadow: '0 4px 8px rgba(0,0,0,0.3)',
              transition: 'all 0.2s ease',
            }}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="text-danger"
            >
              <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"></path>
              <path d="M19 10v2a7 7 0 0 1-14 0v-2"></path>
              <line x1="12" y1="19" x2="12" y2="23"></line>
              <line x1="8" y1="23" x2="16" y2="23"></line>
            </svg>
          </button>
          <button
           onClick={handleMicrophone}
            className="btn btn-light rounded-circle p-3"
            aria-label="Close"
            style={{
              width: '50px',
              height: '50px',
              border: 'none',
              boxShadow: '0 4px 8px rgba(0,0,0,0.3)',
              transition: 'all 0.2s ease',
            }}
          >
            <span className="text-dark">×</span>
          </button>
        </div>

        {/* Optional Text */}
        <p className="text-white mt-3 text-center small">
          Enable microphone access in settings
        </p>
      </div>
    </div>
  );
};

export default RecordVoice;