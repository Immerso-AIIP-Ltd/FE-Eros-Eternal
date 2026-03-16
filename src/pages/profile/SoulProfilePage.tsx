import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import BackgroundImage from "../../assets/images/background.png";

const baseApiUrl = "http://164.52.205.108:8500";

interface FormData {
  name: string;
  gender: string;
  placeOfBirth: string;
  currentLocation: string;
  dateOfBirth: string;
  timeOfBirth: string;
}

/* ─── Icons ─── */
const IcoLocation = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 10c0 7-9 13-9 13S3 17 3 10a9 9 0 0 1 18 0z" /><circle cx="12" cy="10" r="3" />
  </svg>
);
const IcoCalendar = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="4" width="18" height="18" rx="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" />
  </svg>
);
const IcoClock = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
  </svg>
);
const IcoChevronDown = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="6 9 12 15 18 9" />
  </svg>
);

const SoulProfilePage: React.FC = () => {
  const navigate = useNavigate();
  const dobRef = useRef<HTMLInputElement>(null);
  const timeRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [formData, setFormData] = useState<FormData>({
    name: "", gender: "", placeOfBirth: "",
    currentLocation: "", dateOfBirth: "", timeOfBirth: "",
  });

  useEffect(() => {
    const saved = localStorage.getItem("soulProfile");
    if (!saved) return;
    try {
      const p = JSON.parse(saved);
      const isDate = (v: string) => !!v && /^\d{4}-\d{2}-\d{2}$/.test(v) && !isNaN(+new Date(v));
      const isTime = (v: string) => !!v && /^([01]?\d|2[0-3]):[0-5]\d/.test(v);
      setFormData({
        name: p.name || "", gender: p.gender || "",
        placeOfBirth: p.placeOfBirth || "", currentLocation: p.currentLocation || "",
        dateOfBirth: isDate(p.dateOfBirth) ? p.dateOfBirth : "",
        timeOfBirth: isTime(p.timeOfBirth) ? p.timeOfBirth.slice(0, 5) : "",
      });
    } catch { localStorage.removeItem("soulProfile"); }
  }, []);

  const set = (field: keyof FormData, value: string) => {
    setFormData(prev => {
      const next = { ...prev, [field]: value };
      localStorage.setItem("soulProfile", JSON.stringify(next));
      return next;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    if (!formData.name.trim()) return setErrorMsg("Please enter your name.");
    if (!formData.dateOfBirth) return setErrorMsg("Please select date of birth.");
    if (!formData.timeOfBirth) return setErrorMsg("Please select time of birth.");

    const [y, m, d] = formData.dateOfBirth.split("-");
    const fd = new FormData();
    fd.append("gender", formData.gender);
    fd.append("username", formData.name.trim());
    fd.append("place_of_birth", formData.placeOfBirth.trim());
    fd.append("current_location", formData.currentLocation.trim());
    fd.append("date_of_birth", `${d}-${m}-${y}`);
    fd.append("time_of_birth", formData.timeOfBirth);

    setLoading(true);
    try {
      const res = await fetch(`${baseApiUrl}/api/v1/users/profile/`, { method: "POST", body: fd });
      const text = await res.text();
      let result: any;
      try { result = JSON.parse(text); } catch { throw new Error(text || "Invalid response"); }
      if (!res.ok) throw new Error(result?.message || result?.error || "Server error");
      if (result.success) {
        ["user_id", "username", "date_of_birth", "gender", "place_of_birth", "current_location", "time_of_birth"]
          .forEach(k => localStorage.setItem(k, result.data[k] ?? ""));
        localStorage.removeItem("soulProfile");
        navigate("/eros-home");
      } else throw new Error(result.message || "Profile creation failed");
    } catch (err: any) {
      setErrorMsg(err.message || "Something went wrong.");
    } finally { setLoading(false); }
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Montserrat:wght@600;700;800&family=DM+Sans:wght@300;400;500;600&display=swap');

        /* ── Reset & lock viewport ── */
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        html, body {
          height: 100%;
          width: 100%;
          overflow: hidden;        /* no page scroll ever */
          scrollbar-width: none;   /* Firefox */
        }
        html::-webkit-scrollbar,
        body::-webkit-scrollbar { display: none; }  /* Chrome/Safari */

        /* ══════════ ROOT — full viewport, no overflow ══════════ */
        .sp-root {
          display: flex;
          height: 100vh;
          width: 100vw;
          overflow: hidden;
          font-family: 'DM Sans', sans-serif;
          background: #FFFFFF;
          padding: 32px;
          gap: 0;
        }

        /* ══════════ LEFT PANEL ══════════ */
        /* Fixed Figma ratio 676:960, fills available height within padding */
        .sp-left {
          /* width auto-derives from height via aspect-ratio */
          height: 100%;
          aspect-ratio: 960 / 960;
          max-width: 50%;          /* never wider than half the screen */
          min-width: 200px;
          border-radius: 20px;
        background: linear-gradient(180deg,
  rgba(70, 95, 241, 0.37) 0%,      /* Transparent start */
  #8b9bf8 18%,
  #6e7ef4 38%,
  #5264ef 58%,
  #6070ec 78%,
  #9aaaf6 100%                      /* Solid blue end */
);

          position: relative;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: flex-start;
          overflow: hidden;
          flex-shrink: 0;
        }

        /* top glow + bottom depth */
        .sp-left::before {
          content: '';
          position: absolute;
          inset: 0;
          border-radius: 20px;
          background:
            radial-gradient(ellipse 75% 40% at 50% 0%, rgba(255,255,255,0.18) 0%, transparent 60%),
            radial-gradient(ellipse 90% 40% at 50% 110%, rgba(30,50,190,0.25) 0%, transparent 65%);
          pointer-events: none;
          z-index: 0;
        }

        .sp-left-text {
          position: relative;
          z-index: 2;
          text-align: center;
          padding: 0 1.75rem;
          margin-top: clamp(1.5rem, 7%, 4.5rem);
        }

        .sp-title {
          font-family: 'Montserrat', sans-serif;
          font-weight: 700;
          color: #fff;
          line-height: 1.22;
          font-size: clamp(0.95rem, 1.8vw, 1.85rem);
          letter-spacing: -0.01em;
          margin-bottom: 0.35rem;
          margin-top: clamp(40px, 8vw, 108px);
        }

        .sp-sub {
          font-family: 'DM Sans', sans-serif;
          font-weight: 400;
          color: rgba(255,255,255,0.82);
          font-size: clamp(0.65rem, 0.9vw, 0.85rem);
          letter-spacing: 0.015em;
        }

        /* ── Zodiac wheel: centered on left panel, rotates forever ── */
        .sp-wheel-wrap {
          position: absolute;
          /* center exactly in the panel */
          top: 80%;
          left: 50%;
          transform: translate(-50%, -50%);
          /* large enough to fill/bleed at edges */
          width: 110%;
          aspect-ratio: 1 / 1;
          z-index: 1;
          pointer-events: none;
          /* push it toward the bottom so top half is cropped */
          margin-top: 35%;
        }

        .sp-wheel {
          width: 100%;
          height: 100%;
          object-fit: contain;
          filter: brightness(0) invert(1) opacity(0.78);
          animation: spinWheel 60s linear infinite;
          transform-origin: center center;
        }

        @keyframes spinWheel {
          from { transform: rotate(0deg); }
          to   { transform: rotate(360deg); }
        }

        /* ══════════ RIGHT PANEL ══════════ */
        .sp-right {
          flex: 1;
          display: flex;
          align-items: center;
          justify-content: center;
          padding-left: 32px;
          overflow: hidden;        /* no scroll on right either */
          scrollbar-width: none;
        }
        .sp-right::-webkit-scrollbar { display: none; }

        /* ══════════ CARD ══════════ */
        .sp-card {
          background: #ffffff;
          border-radius: 20px;
          // border: 1px solid #e8edf5;
          // box-shadow: 0 2px 8px rgba(0,0,0,0.04), 0 8px 24px rgba(0,0,0,0.05);
          /* Scale padding with viewport so card always fits */
          padding: clamp(1.1rem, 2.2vh, 2rem) clamp(1.1rem, 2vw, 2rem);
          width: 100%;
          max-width: 430px;
        }

        .sp-card-title {
          font-family: 'Montserrat', sans-serif;
          font-weight: 700;
          font-size: clamp(1rem, 1.5vw, 1.4rem);
          color: #0f172a;
          letter-spacing: -0.02em;
          margin-bottom: clamp(0.9rem, 1.8vh, 1.5rem);
          line-height: 1.2;
        }

        /* ══════════ FORM ══════════ */
        .sp-fields {
          display: flex;
          flex-direction: column;
          gap: clamp(8px, 1.2vh, 14px);
        }

        .sp-field-label {
          display: block;
          font-size: 0.78rem;
          font-weight: 500;
          color: #050505;
          margin-bottom: 4px;
          font-family: 'DM Sans', sans-serif;
        }

        .sp-wrap { position: relative; width: 100%; }

        .sp-input,
        .sp-select {
          width: 100%;
          height: clamp(38px, 4.5vh, 46px);
          border: 1.5px solid #e2e8f0;
          border-radius: 10px;
          padding: 0 14px 0 40px;
          font-size: clamp(0.8rem, 1vw, 0.875rem);
          font-family: 'DM Sans', sans-serif;
          color: #1e293b;
          background: #fff;
          outline: none;
          transition: border-color 0.18s, box-shadow 0.18s;
          appearance: none;
          -webkit-appearance: none;
        }

        .sp-input.no-icon { padding-left: 14px; }

        .sp-input:focus,
        .sp-select:focus {
          border-color: #00b8f8;
          box-shadow: 0 0 0 3px rgba(0,184,248,0.1);
        }

        .sp-input::placeholder { color: #b8c0cc; }
        .sp-select { cursor: pointer; padding-right: 36px; }
        .sp-select option[value=""] { color: #94a3b8; }

        .sp-ico {
          position: absolute;
          left: 13px; top: 50%;
          transform: translateY(-50%);
          color: #94a3b8;
          display: flex; align-items: center;
          pointer-events: none; z-index: 1;
        }
        .sp-ico-btn { cursor: pointer; pointer-events: all; }

        .sp-arr {
          position: absolute;
          right: 12px; top: 50%;
          transform: translateY(-50%);
          color: #94a3b8;
          display: flex; pointer-events: none;
        }

        /* Hide native picker icons */
        .sp-input[type=date]::-webkit-calendar-picker-indicator,
        .sp-input[type=time]::-webkit-calendar-picker-indicator {
          opacity: 0; position: absolute;
          inset: 0; width: 100%; height: 100%; cursor: pointer;
        }

        /* Error */
        .sp-error {
          font-size: 0.78rem; color: #ef4444;
          padding: 7px 11px;
          background: #fef2f2; border: 1px solid #fecaca;
          border-radius: 8px; margin-bottom: 4px;
        }

        /* Button */
        .sp-btn {
          width: 100%;
          height: clamp(40px, 4.8vh, 48px);
          background: #00b8f8;
          color: #fff; border: none; border-radius: 10px;
          font-family: 'DM Sans', sans-serif;
          font-size: clamp(0.82rem, 1vw, 0.95rem);
          font-weight: 600; cursor: pointer;
          letter-spacing: 0.01em; margin-top: 4px;
          box-shadow: 0 4px 14px rgba(0,184,248,0.28);
          transition: background 0.18s, transform 0.12s, box-shadow 0.18s;
        }
        .sp-btn:hover:not(:disabled) {
          background: #00a4de; transform: translateY(-1px);
          box-shadow: 0 6px 20px rgba(0,184,248,0.38);
        }
        .sp-btn:active:not(:disabled) { transform: translateY(0); }
        .sp-btn:disabled { opacity: 0.65; cursor: not-allowed; }

        /* ══════════ RESPONSIVE ══════════ */

        /* Tablet landscape 769–1024 */
        @media (max-width: 1024px) and (min-width: 769px) {
          .sp-root { padding: 24px; }
          .sp-right { padding-left: 24px; }
          .sp-left { max-width: 44%; }
          .sp-card { max-width: 360px; }
        }

        /* Tablet portrait + mobile ≤768 — stack */
        @media (max-width: 768px) {
          html, body { overflow-y: auto; }

          .sp-root {
            flex-direction: column;
            height: auto;
            min-height: 100vh;
            padding: 20px;
            gap: 20px;
            overflow-y: auto;
            overflow-x: hidden;
          }
          .sp-root::-webkit-scrollbar { display: none; }

          .sp-left {
            width: 100%;
            height: auto;
            min-height: 240px;
            aspect-ratio: unset;
            max-width: 100%;
            border-radius: 16px;
          }

          .sp-wheel-wrap {
            width: 85%;
            margin-top: 25%;
          }

          .sp-right {
            padding-left: 0;
            overflow-y: visible;
          }

          .sp-card { max-width: 100%; }
        }

        /* Mobile ≤480 */
        @media (max-width: 480px) {
          .sp-root { padding: 16px; gap: 16px; }
          .sp-left { min-height: 210px; border-radius: 14px; }
          .sp-title { font-size: 1.15rem; }
          .sp-sub { font-size: 0.72rem; }
          .sp-wheel-wrap { width: 90%; margin-top: 22%; }
          .sp-card { border-radius: 14px; }
          .sp-card-title { font-size: 1rem; }
        }

        /* Small mobile ≤360 */
        @media (max-width: 360px) {
          .sp-left { min-height: 185px; }
          .sp-card-title { font-size: 0.95rem; }
        }

        /* Large desktop 1440+ */
        @media (min-width: 1440px) {
          .sp-left { max-width: 46%; }
          .sp-card { max-width: 480px; }
        }

        /* XL 1920+ */
        @media (min-width: 1920px) {
          .sp-root { padding: 40px; }
          .sp-right { padding-left: 40px; }
          .sp-left { max-width: 42%; }
          .sp-card { max-width: 540px; }
          .sp-card-title { font-size: 1.55rem; }
        }
      `}</style>

      <div className="sp-root">

        {/* ══════════ LEFT ══════════ */}
        <div className="sp-left">
          <div className="sp-left-text">
            <h1 className="sp-title">Welcome to EROS Wellness</h1>
            <p className="sp-sub">Your AI-driven holistic growth</p>
          </div>

          {/* Centered + rotating zodiac wheel */}
          <div className="sp-wheel-wrap">
            <img src={BackgroundImage} alt="Zodiac Wheel" className="sp-wheel" />
          </div>
        </div>

        {/* ══════════ RIGHT ══════════ */}
        <div className="sp-right">
          <div className="sp-card">
            <h2 className="sp-card-title">Create Your Soul Profile</h2>

            {errorMsg && <div className="sp-error">{errorMsg}</div>}

            <form onSubmit={handleSubmit} noValidate>
              <div className="sp-fields">

                {/* Gender */}
                <div>
                  <label className="sp-field-label">Gender</label>
                  <div className="sp-wrap">
                    <span className="sp-ico"><IcoChevronDown /></span>
                    <select className="sp-select" value={formData.gender}
                      onChange={e => set("gender", e.target.value)}>
                      <option value="">--</option>
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                      <option value="Other">Other</option>
                    </select>
                    <span className="sp-arr"><IcoChevronDown /></span>
                  </div>
                </div>

                {/* Name */}
                <div>
                  <label className="sp-field-label">Name</label>
                  <div className="sp-wrap">
                    <input className="sp-input no-icon" type="text"
                      placeholder="Your full name" value={formData.name}
                      onChange={e => set("name", e.target.value)} required />
                  </div>
                </div>

                {/* Place of Birth */}
                <div>
                  <label className="sp-field-label">Place of birth</label>
                  <div className="sp-wrap">
                    <span className="sp-ico"><IcoLocation /></span>
                    <input className="sp-input" type="text" placeholder="Place of Birth"
                      value={formData.placeOfBirth}
                      onChange={e => set("placeOfBirth", e.target.value)} />
                  </div>
                </div>

                {/* Current Location */}
                <div>
                  <label className="sp-field-label">Current location</label>
                  <div className="sp-wrap">
                    <span className="sp-ico"><IcoLocation /></span>
                    <input className="sp-input" type="text" placeholder="Current Location (optional)"
                      value={formData.currentLocation}
                      onChange={e => set("currentLocation", e.target.value)} />
                  </div>
                </div>

                {/* Date of Birth */}
                <div>
                  <label className="sp-field-label">Date of birth</label>
                  <div className="sp-wrap">
                    <span className="sp-ico sp-ico-btn"
                      onClick={() => dobRef.current?.showPicker?.()}>
                      <IcoCalendar />
                    </span>
                    <input ref={dobRef} className="sp-input" type="date"
                      value={formData.dateOfBirth}
                      onChange={e => set("dateOfBirth", e.target.value)} required />
                  </div>
                </div>

                {/* Time of Birth */}
                <div>
                  <label className="sp-field-label">Time of birth</label>
                  <div className="sp-wrap">
                    <span className="sp-ico sp-ico-btn"
                      onClick={() => timeRef.current?.showPicker?.()}>
                      <IcoClock />
                    </span>
                    <input ref={timeRef} className="sp-input" type="time"
                      value={formData.timeOfBirth}
                      onChange={e => set("timeOfBirth", e.target.value)} required />
                  </div>
                </div>

                {/* Submit */}
                <button type="submit" className="sp-btn" disabled={loading}>
                  {loading ? "Creating…" : "Create your soul profile"}
                </button>

              </div>
            </form>
          </div>
        </div>

      </div>
    </>
  );
};

export default SoulProfilePage;