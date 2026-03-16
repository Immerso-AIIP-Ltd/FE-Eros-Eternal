// src/pages/HarmonyIndexPage.tsx
import React, { useState } from 'react';
import { baseApiUrl } from "@/config/api";

interface CompatibilityData {
  match_for: string;
  match_summary: string;
  sign_main: string;
  sign_partner: string;
}

const HarmonyIndexPage: React.FC = () => {
  // Read from localStorage
  const userId = localStorage.getItem('user_id');
  const username = localStorage.getItem('username');
  const userDob = localStorage.getItem('date_of_birth') || ''; // e.g., "2000-03-20"

  const [yourDob, setYourDob] = useState<string>(userDob);
  const [partnerDob, setPartnerDob] = useState<string>(''); // Will be YYYY-MM-DD
  const [data, setData] = useState<CompatibilityData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!yourDob) {
      setError("Please enter your date of birth.");
      return;
    }
    if (!partnerDob) {
      setError("Please select your partner's date of birth.");
      return;
    }

    setLoading(true);
    setError(null);
    setData(null);

    try {
      const response = await fetch(`${baseApiUrl}/numerology/career_compatibility`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user_id: userId,
          user_name: username,
          dob: yourDob,         // Already YYYY-MM-DD
          dob_partner: partnerDob, // Also YYYY-MM-DD from <input type="date">
        }),
      });

      if (!response.ok) throw new Error(`HTTP ${response.status}`);

      const result = await response.json();

      if (result.success && result.data) {
        setData(result.data);
      } else {
        setError(result.message || "Failed to fetch compatibility.");
      }
    } catch (err: any) {
      console.error("Harmony Index Error:", err);
      setError("Failed to load compatibility. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        minWidth: '100vw',
        background: 'linear-gradient(135deg, #000000, #1a1a2e)',
        color: '#fff',
        fontFamily: "'Playfair Display', serif",
        padding: '20px',
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
      <div className="position-relative w-100 mb-5" style={{ height: '100px' }}>
        {/* Go Back Button - pinned to left */}
        <button
          className="btn position-absolute start-0 top-50 translate-middle-y ms-3"
          style={{
            backgroundColor: 'skyblue',
            color: 'white',
            fontWeight: 'bold',
            border: 'none',
            padding: '8px 20px',
            borderRadius: '6px',
            cursor: 'pointer',
            zIndex: 2
          }}
          onClick={() => window.history.back()}
        >
          ← Go Back
        </button>

        {/* Centered Content (Title + Subtitle) */}
        <div className="text-center" style={{ zIndex: 1 }}>
          <h1 className="display-5 fw-bold text-light" style={{ textShadow: '2px 2px 6px rgba(0,0,0,0.7)' }}>
            Harmony Index
          </h1>
          <p className="text-light opacity-75">
            Discover your career compatibility with your partner
          </p>
        </div>
      </div>

      {/* Form */}
      <div
        className="bg-dark bg-opacity-50 p-4 rounded-4 shadow-lg mx-auto"
        style={{ maxWidth: '600px' }}
      >
        <form onSubmit={handleSubmit}>
          {/* Your DOB */}
          <div className="mb-4">
            <label className="form-label text-warning fw-semibold">
              Your Date of Birth
            </label>
            <input
              type="date"
              className="form-control bg-black text-white border-secondary"
              value={yourDob}
              onChange={(e) => setYourDob(e.target.value)}
              required
            />
          </div>

          {/* Partner's DOB - Now with Calendar Picker */}
          <div className="mb-4">
            <label className="form-label text-warning fw-semibold">
              Partner's Date of Birth
            </label>
            <input
              type="date"
              className="form-control bg-black text-white border-secondary"
              value={partnerDob}
              onChange={(e) => setPartnerDob(e.target.value)}
              required
              // Optional: Add min/max dates
              min="1900-01-01"
              max="2025-12-31"
            />
            <small className="text-white d-block mt-1">
              Click to open calendar and select a date
            </small>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="btn btn-info w-100 py-3 fs-5 fw-bold rounded-pill shadow"
            style={{ background: '#00B8F8', borderColor: '#00B8F8' }}
          >
            {loading ? 'Analyzing...' : '🔍 Analyze Compatibility'}
          </button>
        </form>

        {/* Error Message */}
        {error && (
          <div className="alert alert-danger mt-4 mb-0">
            <strong>Error:</strong> {error}
          </div>
        )}
      </div>

      {/* Result */}
      {data && !loading && (
        <div
          className="mt-5 bg-gradient text-white p-5 rounded-4 shadow-lg mx-auto"
          style={{
            maxWidth: '800px',
            background: 'radial-gradient(circle, #1e3a8a, #000000)',
            border: '1px solid #00B8F8',
          }}
        >
          <div className="text-center mb-4">
            <h2 className="fw-bold" style={{ color: '#00B8F8' }}>
              ✨ {data.match_for} ✨
            </h2>
            <div className="d-flex justify-content-center gap-4 fs-4">
              <span>🧑‍💼 <strong>{data.sign_main}</strong></span>
              <span>❤️</span>
              <span>🧑‍💼 <strong>{data.sign_partner}</strong></span>
            </div>
          </div>

          <div
            className="lead text-light"
            style={{
              lineHeight: '1.8',
              textAlign: 'justify',
              padding: '0 10px',
            }}
          >
            {data.match_summary}
          </div>

          <div className="text-center mt-4">
            <div className="badge bg-info fs-5 px-4 py-2">
              💼 Ideal For: Creative Arts, Music, Healing Professions
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      {/* <div className="text-center mt-5 text-muted">
        <small>
          ✨ Let the stars guide your professional journey together ✨
        </small>
      </div> */}
    </div>
  );
};

export default HarmonyIndexPage;