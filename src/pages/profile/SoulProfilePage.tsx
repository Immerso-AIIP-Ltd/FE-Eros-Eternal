import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import BackgroundImage from "../../assets/images/background.png"; // adjust path as needed

const API_URL = "http://164.52.205.108:8500"; // or use your baseApiUrl

interface FormData {
  name: string;
  gender: string;
  placeOfBirth: string;
  currentLocation: string;
  dateOfBirth: string;     // YYYY-MM-DD
  timeOfBirth: string;     // HH:mm
}

/* ─── Tiny SVG icons ─── */
const IcoLocation = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 10c0 7-9 13-9 13S3 17 3 10a9 9 0 0 1 18 0z" />
    <circle cx="12" cy="10" r="3" />
  </svg>
);

const IcoCalendar = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="4" width="18" height="18" rx="2" />
    <line x1="16" y1="2" x2="16" y2="6" />
    <line x1="8" y1="2" x2="8" y2="6" />
    <line x1="3" y1="10" x2="21" y2="10" />
  </svg>
);

const IcoClock = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" />
    <polyline points="12 6 12 12 16 14" />
  </svg>
);

const IcoChevron = () => (
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
    name: "",
    gender: "",
    placeOfBirth: "",
    currentLocation: "",
    dateOfBirth: "",
    timeOfBirth: "",
  });

  // Load from localStorage + validate formats
  useEffect(() => {
    const saved = localStorage.getItem("soulProfile");
    if (!saved) return;

    try {
      const parsed = JSON.parse(saved);

      const isValidDate = (v: string) =>
        !!v && /^\d{4}-\d{2}-\d{2}$/.test(v) && !isNaN(new Date(v).getTime());

      const isValidTime = (v: string) =>
        !!v && /^([01]?\d|2[0-3]):[0-5]\d$/.test(v);

      setFormData({
        name: parsed.name || "",
        gender: parsed.gender || "",
        placeOfBirth: parsed.placeOfBirth || "",
        currentLocation: parsed.currentLocation || "",
        dateOfBirth: isValidDate(parsed.dateOfBirth) ? parsed.dateOfBirth : "",
        timeOfBirth: isValidTime(parsed.timeOfBirth) ? parsed.timeOfBirth : "",
      });
    } catch {
      localStorage.removeItem("soulProfile");
    }
  }, []);

  const updateField = (field: keyof FormData, value: string) => {
    setFormData((prev) => {
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
    const formattedDob = `${d}-${m}-${y}`;

    const fd = new FormData();
    fd.append("gender", formData.gender);
    fd.append("username", formData.name.trim());
    fd.append("place_of_birth", formData.placeOfBirth.trim());
    fd.append("current_location", formData.currentLocation.trim());
    fd.append("date_of_birth", formattedDob);
    fd.append("time_of_birth", formData.timeOfBirth);

    setLoading(true);

    try {
      const res = await fetch(`${API_URL}/api/v1/users/profile/`, {
        method: "POST",
        body: fd,
      });

      const text = await res.text();
      let result: any;

      try {
        result = JSON.parse(text);
      } catch {
        throw new Error(text || "Invalid server response");
      }

      if (!res.ok) {
        throw new Error(result?.message || result?.error || "Server error");
      }

      if (result.success) {
        ["user_id", "username", "date_of_birth", "gender", "place_of_birth", "current_location", "time_of_birth"].forEach((k) => {
          localStorage.setItem(k, result.data[k] ?? "");
        });
        localStorage.removeItem("soulProfile"); // optional: clean temp data
        navigate("/eros-home");
      } else {
        throw new Error(result.message || "Profile creation failed");
      }
    } catch (err: any) {
      setErrorMsg(err.message || "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Montserrat:wght@600;700;800&family=DM+Sans:wght@300;400;500;600&display=swap');

        *, *::before, *::after { box-sizing: border-box; margin:0; padding:0; }
        html, body { height: 100%; }

        .ep { display: flex; height: 100vh; width: 100vw; overflow: hidden; font-family: 'DM Sans', sans-serif; }

        /* Left panel */
        .ep-l {
          flex: 0 0 42%;
          background: linear-gradient(175deg, #6872d6 0%, #7b87e8 20%, #8f9cf0 45%, #a8aeef 70%, #bbbff0 100%);
          position: relative;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: flex-start;
          padding-top: clamp(2rem, 7vh, 5rem);
          overflow: hidden;
        }
        .ep-l::before {
          content: ''; position: absolute; inset: 0;
          background:
            radial-gradient(ellipse 65% 50% at 50% 25%, rgba(255,255,255,0.09) 0%, transparent 65%),
            radial-gradient(ellipse 90% 55% at 50% 105%, rgba(0,0,0,0.22) 0%, transparent 65%);
          pointer-events: none;
        }

        .ep-l-txt { position: relative; z-index: 2; text-align: center; padding: 0 1.75rem; }
        .ep-title {
          font-family: 'Montserrat', sans-serif; font-weight: 700; color: #fff;
          line-height: 1.22; font-size: clamp(1.3rem, 2.4vw, 2rem);
          letter-spacing: -0.015em; margin-bottom: .45rem;
        }
        .ep-sub {
          font-family: 'DM Sans', sans-serif; font-weight: 300;
          color: rgba(255,255,255,.7); font-size: clamp(.7rem,1.05vw,.88rem);
          letter-spacing: .03em;
        }

        .ep-wheel {
          position: absolute; bottom: -38%; left: 50%;
          transform: translateX(-50%);
          width: clamp(260px, 85%, 420px); aspect-ratio: 1/1;
          object-fit: contain; pointer-events: none; opacity: 0.9;
        }

        /* Right panel */
        .ep-r {
          flex: 1; background: #f5f7fb;
          display: flex; align-items: center; justify-content: center;
          padding: 2rem; overflow-y: auto;
        }

        .ep-card {
          background: #fff; border-radius: 18px;
          border: 1px solid #eaeef5; border-top: 3px solid #00B8F8;
          box-shadow: 0 4px 28px rgba(99,102,241,.08), 0 1px 4px rgba(0,0,0,.04);
          padding: clamp(1.6rem, 2.8vw, 2.4rem);
          width: 100%; max-width: 430px;
        }

        .ep-h2 {
          font-family: 'Montserrat', sans-serif; font-weight: 700; color: #0f172a;
          font-size: clamp(1.15rem,1.9vw,1.45rem); letter-spacing: -.02em;
          margin-bottom: 1.65rem; line-height: 1.2;
        }

        .ep-error { color: #ef4444; font-size: 0.875rem; margin-bottom: 1rem; text-align: center; }

        .ep-fields { display: flex; flex-direction: column; gap: 1rem; }

        .ep-label {
          display: block; font-size: .775rem; font-weight: 500; color: #64748b;
          margin-bottom: 5px; letter-spacing: .005em;
        }

        .ep-wrap { position: relative; width: 100%; }

        .ep-input, .ep-select {
          width: 100%; height: 44px;
          border: 1.5px solid #e2e8f0; border-radius: 10px;
          padding: 0 12px 0 40px;
          font-size: .875rem; font-family: 'DM Sans', sans-serif; color: #1e293b;
          background: #fff; outline: none;
          transition: border-color .18s, box-shadow .18s;
        }

        .ep-input:focus, .ep-select:focus {
          border-color: #6366f1; box-shadow: 0 0 0 3px rgba(99,102,241,.1);
        }

        .ep-input::placeholder { color: #b0bac9; }

        .ep-select { appearance: none; -webkit-appearance: none; cursor: pointer; padding-right: 36px; }
        .ep-select option[value=""] { color: #94a3b8; }

        .ep-ico {
          position: absolute; left: 12px; top: 50%; transform: translateY(-50%);
          color: #94a3b8; display: flex; align-items: center; pointer-events: none; z-index: 1;
        }
        .ep-ico-btn { cursor: pointer; pointer-events: all; }

        .ep-arr {
          position: absolute; right: 11px; top: 50%; transform: translateY(-50%);
          color: #94a3b8; display: flex; pointer-events: none;
        }

        /* Hide native date/time picker icons */
        .ep-input[type=date]::-webkit-calendar-picker-indicator,
        .ep-input[type=time]::-webkit-calendar-picker-indicator,
        .ep-input[type=date]::-webkit-inner-spin-button,
        .ep-input[type=time]::-webkit-inner-spin-button {
          opacity: 0; position: absolute; inset: 0; width: 100%; height: 100%; cursor: pointer;
        }

        .ep-btn {
          width: 100%; height: 48px;
          background: #00B8F8; color: #fff; border: none; border-radius: 10px;
          font-family: 'DM Sans', sans-serif; font-size: .92rem; font-weight: 600;
          cursor: pointer; letter-spacing: .01em; margin-top: .3rem;
          box-shadow: 0 4px 16px rgba(0,184,248,.3);
          transition: background .18s, transform .12s, box-shadow .18s;
        }

        .ep-btn:hover:not(:disabled) {
          background: #00a3de; transform: translateY(-1px);
          box-shadow: 0 6px 22px rgba(0,184,248,.4);
        }

        .ep-btn:active:not(:disabled) { transform: translateY(0); }
        .ep-btn:disabled { opacity: .62; cursor: not-allowed; }

        /* Responsive */
        @media (max-width:860px) {
          .ep { flex-direction: column; height: auto; min-height: 100vh; overflow-y: auto; }
          .ep-l { flex: 0 0 auto; min-height: 195px; padding: 1.8rem 1.5rem 5.5rem; }
          .ep-wheel { width: clamp(180px,55%,260px); bottom: -35%; }
          .ep-r { padding: 1.5rem 1.25rem 2.5rem; }
          .ep-card { max-width: 100%; padding: 1.5rem; }
        }
        @media (max-width:480px) {
          .ep-l { min-height: 170px; padding-bottom: 5rem; }
          .ep-title { font-size: 1.25rem; }
          .ep-wheel { width: 200px; bottom: -33%; }
          .ep-card { border-radius: 14px; padding: 1.2rem; }
          .ep-h2 { font-size: 1.12rem; margin-bottom: 1.2rem; }
          .ep-fields { gap: .875rem; }
        }
      `}</style>

      <div className="ep">

        {/* Left decorative panel */}
        <div className="ep-l">
          <div className="ep-l-txt">
            <h1 className="ep-title">Welcome to EROS Wellness</h1>
            <p className="ep-sub">Your AI-driven holistic growth</p>
          </div>
          <img src={BackgroundImage} alt="Zodiac Wheel" className="ep-wheel" />
        </div>

        {/* Right form panel */}
        <div className="ep-r">
          <div className="ep-card">
            <h2 className="ep-h2">Create Your Soul Profile</h2>

            {errorMsg && <div className="ep-error">{errorMsg}</div>}

            <form onSubmit={handleSubmit} noValidate>
              <div className="ep-fields">

                {/* Gender */}
                <div>
                  <label className="ep-label">Gender</label>
                  <div className="ep-wrap">
                    <span className="ep-ico"><IcoChevron /></span>
                    <select
                      className="ep-select"
                      value={formData.gender}
                      onChange={(e) => updateField("gender", e.target.value)}
                    >
                      <option value="">-- Select --</option>
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                      <option value="Other">Other</option>
                    </select>
                    <span className="ep-arr"><IcoChevron /></span>
                  </div>
                </div>

                {/* Name */}
                <div>
                  <label className="ep-label">Name</label>
                  <div className="ep-wrap">
                    <input
                      className="ep-input"
                      type="text"
                      placeholder="Your full name"
                      value={formData.name}
                      onChange={(e) => updateField("name", e.target.value)}
                      required
                    />
                  </div>
                </div>

                {/* Place of Birth */}
                <div>
                  <label className="ep-label">Place of birth</label>
                  <div className="ep-wrap">
                    <span className="ep-ico"><IcoLocation /></span>
                    <input
                      className="ep-input"
                      type="text"
                      placeholder="Place of Birth"
                      value={formData.placeOfBirth}
                      onChange={(e) => updateField("placeOfBirth", e.target.value)}
                    />
                  </div>
                </div>

                {/* Current Location (optional) */}
                <div>
                  <label className="ep-label">Current location</label>
                  <div className="ep-wrap">
                    <span className="ep-ico"><IcoLocation /></span>
                    <input
                      className="ep-input"
                      type="text"
                      placeholder="Current Location (optional)"
                      value={formData.currentLocation}
                      onChange={(e) => updateField("currentLocation", e.target.value)}
                    />
                  </div>
                </div>

                {/* Date of Birth */}
                <div>
                  <label className="ep-label">Date of birth</label>
                  <div className="ep-wrap">
                    <span className="ep-ico ep-ico-btn" onClick={() => dobRef.current?.showPicker?.()}>
                      <IcoCalendar />
                    </span>
                    <input
                      ref={dobRef}
                      className="ep-input"
                      type="date"
                      value={formData.dateOfBirth}
                      onChange={(e) => updateField("dateOfBirth", e.target.value)}
                      required
                    />
                  </div>
                </div>

                {/* Time of Birth */}
                <div>
                  <label className="ep-label">Time of birth</label>
                  <div className="ep-wrap">
                    <span className="ep-ico ep-ico-btn" onClick={() => timeRef.current?.showPicker?.()}>
                      <IcoClock />
                    </span>
                    <input
                      ref={timeRef}
                      className="ep-input"
                      type="time"
                      value={formData.timeOfBirth}
                      onChange={(e) => updateField("timeOfBirth", e.target.value)}
                      required
                    />
                  </div>
                </div>

                <button type="submit" className="ep-btn" disabled={loading}>
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