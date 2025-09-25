import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import logo from '../logo-sidebar.png';
import spirtual from '../spirtual.png';
export const Sidebar: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const [isOpen, setIsOpen] = useState(false); // Controls sidebar on mobile

  // Determine active path from URL
  const activePath = location.pathname;

  // Navigation handler
  const handleNavigation = (path: string) => {
    navigate(path);
    setIsOpen(false); 
  };

  // Menu items data
  const menuItems = [
    // { label: 'Home', path: '/home', iconClass: 'bi bi-house' },
    { label: 'Spiritual', path: '/result',  iconImage: spirtual, },
    { label: 'Chat', path: '/ai-chat',  iconImage: spirtual, },
  ];

  return (
    <>
      {/* Hamburger Button - visible on mobile only */}
      <button
        className="d-md-none"
        style={{
          position: 'fixed',
          top: '1rem',
          left: '1rem',
          backgroundColor: '#000',
          color: '#fff',
          width: '50px',
          height: '50px',
          display: 'flex !important',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1055,
          border: '2px solid #00b8f8',
          borderRadius: '12px',
          cursor: 'pointer',
          outline: 'none',
          transition: 'all 0.2s ease',
          // boxShadow: '0 4px 12px rgba(0, 184, 248, 0.3)',
          fontFamily:"Poppins"
        }}
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Toggle Sidebar"
        onMouseEnter={(e) => {
          e.currentTarget.style.backgroundColor = '#00b8f8';
          e.currentTarget.style.transform = 'scale(1.05)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundColor = '#000';
          e.currentTarget.style.transform = 'scale(1)';
        }}
      >
        {/* Custom hamburger icon using CSS */}
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '4px',
          width: '20px',
        }}>
          <div style={{
            width: '100%',
            height: '2px',
            backgroundColor: '#fff',
            borderRadius: '1px',
            transition: 'all 0.3s ease',
            transform: isOpen ? 'rotate(45deg) translateY(6px)' : 'none',
          }}></div>
          <div style={{
            width: '100%',
            height: '2px',
            backgroundColor: '#fff',
            borderRadius: '1px',
            transition: 'all 0.3s ease',
            opacity: isOpen ? 0 : 1,
          }}></div>
          <div style={{
            width: '100%',
            height: '2px',
            backgroundColor: '#fff',
            borderRadius: '1px',
            transition: 'all 0.3s ease',
            transform: isOpen ? 'rotate(-45deg) translateY(-6px)' : 'none',
          }}></div>
        </div>
      </button>

      {/* Desktop Sidebar - visible on medium screens and up */}
      <div
        className="d-none d-md-flex flex-column h-100"
        style={{
          width: '256px',
          backgroundColor: '#000000',
          padding: '1.5rem',
          position: 'fixed',
          top: 0,
          left: 0,
          zIndex: 1040,
          boxShadow: '4px 0 12px rgba(0, 0, 0, 0.15)',
        }}
      >
        {/* Logo */}
        <div className="mb-5">
          <img src={logo} alt="EROS Universe Logo" style={{ width: '220px', height: 'auto' }} />
        </div>

        {/* Navigation */}
        <nav className="d-flex flex-column" style={{ gap: '1.25rem', flexGrow: 1 }}>
          {menuItems.map(({ label, path, iconClass }) => {
            const isActive = activePath === path;
            return (
              <div
                key={label}
                className="d-flex align-items-center gap-3"
                style={{
                  color: isActive ? '#00b8f8' : '#9ca3af',
                  fontSize: '1rem',
                  transition: 'all 0.2s ease',
                  cursor: 'pointer',
                  padding: '0.75rem',
                  borderRadius: '8px',
                  backgroundColor: isActive ? 'rgba(0, 184, 248, 0.1)' : 'transparent',
                }}
                onMouseEnter={(e) => {
                  if (!isActive) {
                    e.currentTarget.style.color = '#fff';
                    e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.05)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isActive) {
                    e.currentTarget.style.color = '#9ca3af';
                    e.currentTarget.style.backgroundColor = 'transparent';
                  }
                }}
                onClick={() => handleNavigation(path)}
                aria-current={isActive ? 'page' : undefined}
              >
                <i className={iconClass} style={{ 
                  fontSize: '1.25rem', 
                  color: isActive ? '#00b8f8' : 'inherit',
                  minWidth: '20px'
                }}></i>
                <span>{label}</span>
              </div>
            );
          })}
        </nav>
      </div>

      {/* Mobile Sidebar - with proper animation */}
      <div
        className="d-md-none position-fixed d-flex flex-column h-100"
        style={{
          width: '280px',
          backgroundColor: '#000000',
          padding: '1.5rem',
          top: 0,
          left: 0,
          zIndex: 1050,
          boxShadow: '4px 0 20px rgba(0, 0, 0, 0.3)',
          transform: isOpen ? 'translateX(0)' : 'translateX(-100%)',
          transition: 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        }}
      >
        {/* Close button inside mobile sidebar */}
        <div className="d-flex justify-content-between align-items-center mb-4">
          <div></div>
          <button
            className="btn p-2"
            style={{
              backgroundColor: 'transparent',
              color: '#9ca3af',
              border: 'none',
              borderRadius: '6px',
              width: '36px',
              height: '36px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.2s ease',
            }}
            onClick={() => setIsOpen(false)}
            aria-label="Close Sidebar"
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.1)';
              e.currentTarget.style.color = '#fff';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent';
              e.currentTarget.style.color = '#9ca3af';
            }}
          >
            <i className="bi bi-x-lg" style={{ fontSize: '1.2rem' }}></i>
          </button>
        </div>

        {/* Logo */}
        <div className="mb-5">
          <img src={logo} alt="EROS Universe Logo" style={{ width: '240px', height: 'auto' }} />
        </div>

        {/* Navigation */}
        <nav className="d-flex flex-column" style={{ gap: '1rem', flexGrow: 1 }}>
          {menuItems.map(({ label, path, iconImage }) => {
            const isActive = activePath === path;
            return (
              <div
                key={label}
                className="d-flex align-items-center gap-3"
                style={{
                  color: isActive ? '#00b8f8' : '#9ca3af',
                  fontSize: '1.1rem',
                  transition: 'all 0.2s ease',
                  cursor: 'pointer',
                  padding: '1rem',
                  borderRadius: '10px',
                  backgroundColor: isActive ? 'rgba(0, 184, 248, 0.15)' : 'transparent',
                  border: isActive ? '1px solid rgba(0, 184, 248, 0.3)' : '1px solid transparent',
                }}
                onMouseEnter={(e) => {
                  if (!isActive) {
                    e.currentTarget.style.color = '#fff';
                    e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.08)';
                    e.currentTarget.style.transform = 'translateX(4px)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isActive) {
                    e.currentTarget.style.color = '#9ca3af';
                    e.currentTarget.style.backgroundColor = 'transparent';
                    e.currentTarget.style.transform = 'translateX(0)';
                  }
                }}
                onClick={() => handleNavigation(path)}
                aria-current={isActive ? 'page' : undefined}
              >
                <img src={iconImage} className="menu-icon"  style={{ 
                  fontSize: '1.4rem', 
                  color: isActive ? '#00b8f8' : 'inherit',
                  minWidth: '24px'
                }}></img>
                <span style={{ fontWeight: isActive ? '500' : '400' }}>{label}</span>
              </div>
            );
          })}
        </nav>
      </div>

      {/* Backdrop Overlay - closes mobile sidebar when clicking outside */}
      {isOpen && (
        <div
          className="d-md-none position-fixed w-100 h-100"
          style={{
            backgroundColor: 'rgba(0, 0, 0, 0.6)',
            backdropFilter: 'blur(2px)',
            zIndex: 1045,
            top: 0,
            left: 0,
            cursor: 'pointer',
            opacity: isOpen ? 1 : 0,
            transition: 'opacity 0.3s ease',
          }}
          onClick={() => setIsOpen(false)}
          aria-hidden="true"
        />
      )}
    </>
  );
};

export default Sidebar;