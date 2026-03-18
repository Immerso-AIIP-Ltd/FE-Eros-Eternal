// src/pages/PalmReadingPage.tsx
import React, { useState } from 'react';
import { useNavigate } from "react-router-dom";
import { baseApiUrl } from "@/config/api";

interface PalmReadingDetail {
  hand_shape: string;
  finger_analysis: string;
  palm_lines: string;
  characteristics: string;
  personality_traits: string[];
  life_patterns: string[];
  career_insights: string[];
  health_observations: string[];
  spiritual_guidance: string[];
}

interface PalmReadingResponse {
  image_url: string;
  reading_type: string;
  palm_reading_detail: PalmReadingDetail;
  raw_analysis: string;
  reading_timestamp: string;
}

const PalmReadingPage: React.FC = () => {
  const navigate = useNavigate();
  const userId = localStorage.getItem('user_id');
  const [image, setImage] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [data, setData] = useState<PalmReadingResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Handle file selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.match(/image\/(jpeg|jpg|png)$/)) {
      setError("Please upload a valid image (JPG, PNG)");
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setError("Image is too large. Max 10MB allowed.");
      return;
    }

    setImage(file);
    setPreview(URL.createObjectURL(file));
    setData(null); // Reset previous result
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!image) {
      setError("Please upload a palm image.");
      return;
    }
    if (!userId) {
      setError("User not logged in.");
      return;
    }

    setLoading(true);
    setError(null);
    setData(null);

    const formData = new FormData();
    formData.append('user_id', userId);
    formData.append('image_data', image);

    try {
      const response = await fetch(`http://192.168.1.171:6001/aitools/wellness/v2/analysis/palm/`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.message || `HTTP ${response.status}`);
      }

      const result = await response.json();

      if (result.success && result.data) {
        setData(result.data);
      } else {
        throw new Error(result.message || "Invalid response from server");
      }
    } catch (err: any) {
      console.error("Palm Reading Error:", err);
      setError(err.message || "Failed to process palm reading. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        minWidth: "100vw",
        background: 'linear-gradient(135deg, #000000, #0c0f1d)',
        color: '#e0e6ed',
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
        {/* Go Back Button - pinned to left, vertically centered */}
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
          onClick={() => navigate("/result")}
        >
          ← Go Back
        </button>

        {/* Centered Content (Title + Subtitle) — your original design, untouched */}
        <div className="text-center" style={{ zIndex: 1 }}>
          <h1 className="display-5 fw-bold" style={{ color: '#00B8F8', textShadow: '2px 2px 8px rgba(0,184,248,0.3)' }}>
            ✋ Palm Reading
          </h1>
          <p className="text-white opacity-75">
            Upload your palm image for a mystical AI-powered reading
          </p>
        </div>
      </div>

      {/* Upload Section */}
      {!data ? (
        <div
          className="bg-dark bg-opacity-50 p-5 rounded-4 shadow-lg mx-auto"
          style={{ maxWidth: '700px' }}
        >
          <form onSubmit={handleSubmit}>
            {/* File Upload */}
            <div className="mb-4 text-center">
              <label
                htmlFor="palm-upload"
                className="d-block"
                style={{
                  border: '3px dashed #00B8F8',
                  borderRadius: '12px',
                  padding: '30px',
                  cursor: 'pointer',
                  backgroundColor: '#1a1d24',
                  transition: 'all 0.3s ease',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#222630';
                  e.currentTarget.style.transform = 'scale(1.02)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = '#1a1d24';
                  e.currentTarget.style.transform = 'scale(1)';
                }}
              >
                <div style={{ fontSize: '3rem', marginBottom: '10px' }}>🖼️</div>
                <h5 className="text-info">Upload Your Palm Image</h5>
                <p className="text-white small mt-2">
                  Click to browse or drag & drop (JPG, PNG, max 10MB)
                </p>
                <input
                  id="palm-upload"
                  type="file"
                  accept="image/jpeg,image/jpg,image/png"
                  onChange={handleFileChange}
                  style={{ display: 'none' }}
                />
              </label>

              {preview && (
                <div className="mt-3">
                  <img
                    src={preview}
                    alt="Palm Preview"
                    style={{
                      maxWidth: '100%',
                      maxHeight: '200px',
                      borderRadius: '10px',
                      border: '2px solid #00B8F8',
                    }}
                  />
                  <p className="text-success mt-2 small">✅ Image selected!</p>
                </div>
              )}
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading || !image}
              className="btn btn-info w-100 py-3 fs-5 fw-bold rounded-pill shadow"
              style={{ background: '#00B8F8', borderColor: '#00B8F8' }}
            >
              {loading ? (
                <>
                  <span className="spinner-border spinner-border-sm me-2 text-white" role="status" aria-hidden="true"></span>
                  Analyzing Your Palm...
                </>
              ) : (
                '🔮 Start Palm Reading'
              )}
            </button>
          </form>

          {error && (
            <div className="alert alert-danger mt-4 mb-0">
              <strong>⚠️ Error:</strong> {error}
            </div>
          )}
        </div>
      ) : null}

      {/* Result Section */}
      {data && (
        <div className="mt-4">
          {/* Palm Image */}
          <div className="text-center mb-5">
            <h3 className="text-info fw-bold">Your Palm</h3>
            <div className='d-flex justify-content-center align-item-center'>
              <img
                src={data.image_url}
                alt="Analyzed Palm"
                style={{
                  maxWidth: '100%',
                  maxHeight: '300px',
                  borderRadius: '12px',
                  border: '3px solid #00B8F8',
                  boxShadow: '0 10px 30px rgba(0,184,248,0.2)',
                }}
              />
              {/* <p className="text-muted mt-2">
              Analyzed on {new Date(data.reading_timestamp).toLocaleString()}
            </p> */}
            </div>
          </div>

          {/* Reading Content */}
          <div
            className="bg-gradient p-5 rounded-4 shadow-lg mx-auto"
            style={{
              maxWidth: '900px',
              background: 'radial-gradient(circle at top, #1a3a5f, #000000)',
              border: '1px solid #00B8F8',
              lineHeight: '1.8',
            }}
          >
            <h2 className="text-center text-warning mb-5" style={{ fontSize: '2rem' }}>
              🔮 Mystical Palm Reading
            </h2>

            {/* Personality Traits */}
            <Section
              title="🌟 Personality Traits"
              items={data.palm_reading_detail.personality_traits}
            />

            {/* Life Patterns */}
            <Section
              title="🌀 Life Patterns"
              items={data.palm_reading_detail.life_patterns}
            />

            {/* Health Observations */}
            <Section
              title="🩺 Health & Vitality"
              items={data.palm_reading_detail.health_observations}
            />

            {/* Career Insights */}
            <Section
              title="💼 Career Insights"
              items={data.palm_reading_detail.career_insights}
            />

            {/* Spiritual Guidance */}
            <Section
              title="🧘 Spiritual Guidance"
              items={data.palm_reading_detail.spiritual_guidance}
            />

            {/* Raw Analysis (Optional) */}
            <div className="mt-5 p-4 bg-black bg-opacity-30 rounded">
              <h5 className="text-info">📜 Full Reading</h5>
              <pre
                style={{
                  whiteSpace: 'pre-wrap',
                  fontFamily: 'inherit',
                  fontSize: '0.95rem',
                  color: '#ccc',
                  lineHeight: '1.7',
                }}
              >
                {data.raw_analysis}
              </pre>
            </div>
          </div>

          {/* Footer */}
          <div className="text-center mt-5 text-muted">
            <small>
              ✨ Let the lines of your palm guide your destiny ✨
            </small>
          </div>
        </div>
      )}
    </div>
  );
};

// Reusable Section Component
const Section: React.FC<{ title: string; items: string[] }> = ({ title, items }) => {
  return (
    <div className="mb-5">
      <h4 className="text-warning fw-bold border-bottom pb-2" style={{ borderColor: '#00B8F8' }}>
        {title}
      </h4>
      <ul className="list-unstyled">
        {items.map((item, idx) => (
          <li key={idx} className="mb-3 text-light">
            <span style={{ color: '#00B8F8' }}>✦</span> {item}
          </li>
        ))}
      </ul>
    </div>
  );
};

export default PalmReadingPage;