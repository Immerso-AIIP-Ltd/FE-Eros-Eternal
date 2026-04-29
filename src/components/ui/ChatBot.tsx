// src/components/ChatBot.tsx
import React from 'react';

export const ChatBot: React.FC = () => {
  return (
    <div 
      className="position-fixed bottom-0 end-0 m-3"
      style={{
        width: '320px', // ~w-80 in Tailwind
        zIndex: 1000,
      }}
    >
      {/* Chat Widget */}
      <div
        className="rounded-4 p-4"
        style={{
          background: 'linear-gradient(to bottom right, #30d0b8, #14b8a6)',
          color: 'black',
        }}
      >
        {/* Header */}
        <div className="d-flex align-items-center gap-3 mb-3">
          <strong className="fs-5">AI Chat</strong>
        </div>

        {/* Subtitle */}
        <p className="text-sm mb-4" style={{ opacity: 0.9 }}>
          Your Smart Spiritual Assistant
        </p>

        {/* Image */}
        <div className="d-flex justify-content-center mb-2">
          <img
            src="/placeholder.svg?height=80&width=80"
            alt="AI Assistant"
            className="rounded-circle"
            style={{
              width: '80px',
              height: '80px',
              objectFit: 'cover',
            }}
          />
        </div>
      </div>
    </div>
  );
};

export default ChatBot;