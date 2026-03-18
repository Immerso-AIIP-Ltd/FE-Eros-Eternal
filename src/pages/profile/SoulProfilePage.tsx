import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import BackgroundImage from "../../assets/images/background.png";
import { baseApiUrl } from "../../config/api";

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
  const hourRef = useRef<HTMLDivElement>(null);
  const minuteRef = useRef<HTMLDivElement>(null);
  const periodRef = useRef<HTMLDivElement>(null);
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

  // Date picker state
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [pickerMonth, setPickerMonth] = useState<number>(new Date().getMonth());
  const [pickerYear, setPickerYear] = useState<number>(new Date().getFullYear());
  const [pickerSelected, setPickerSelected] = useState<Date | null>(null);

  // Time picker state (12‑hour UI, stored as 24‑hour HH:MM)
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [tpHour, setTpHour] = useState(12);      // 1‑12
  const [tpMinute, setTpMinute] = useState(0);   // 0‑59
  const [tpPeriod, setTpPeriod] = useState<"AM" | "PM">("AM");
  const [tpActive, setTpActive] = useState<"hour" | "minute" | "period">("hour");

  const stepHour = (delta: number) => {
    setTpHour(prev => {
      const base = ((prev - 1 + delta) % 12 + 12) % 12; // 0-11
      return base + 1; // 1-12
    });
  };

  const stepMinute = (delta: number) => {
    setTpMinute(prev => {
      const v = ((prev + delta) % 60 + 60) % 60;
      return v;
    });
  };

  const stepPeriod = () => {
    setTpPeriod(prev => (prev === "AM" ? "PM" : "AM"));
  };

  const formatTimeDisplay = (value: string) => {
    if (!value) return "";
    const [hhStr, mmStr] = value.split(":");
    let hh = parseInt(hhStr || "0", 10);
    const mm = parseInt(mmStr || "0", 10);
    const period = hh >= 12 ? "PM" : "AM";
    let displayHour = hh % 12;
    if (displayHour === 0) displayHour = 12;
    const pad = (n: number) => n.toString().padStart(2, "0");
    return `${pad(displayHour)}:${pad(isNaN(mm) ? 0 : mm)} ${period}`;
  };

  // Keyboard shortcuts for dialogs
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      // Time picker: Enter to confirm, Esc to close
      if (showTimePicker) {
        if (e.key === "Escape") {
          e.preventDefault();
          setShowTimePicker(false);
          return;
        }
        if (e.key === "Enter") {
          e.preventDefault();
          const hour24 = (tpHour % 12) + (tpPeriod === "PM" ? 12 : 0);
          const pad = (n: number) => n.toString().padStart(2, "0");
          const val = `${pad(hour24)}:${pad(tpMinute)}`;
          set("timeOfBirth", val);
          setShowTimePicker(false);
          return;
        }
      }

      // Date picker: Enter to confirm, Esc to close
      if (showDatePicker) {
        if (e.key === "Escape") {
          e.preventDefault();
          setShowDatePicker(false);
          return;
        }
        if (e.key === "Enter") {
          if (!pickerSelected) return;
          e.preventDefault();
          const y = pickerSelected.getFullYear();
          const m = String(pickerSelected.getMonth() + 1).padStart(2, "0");
          const d = String(pickerSelected.getDate()).padStart(2, "0");
          set("dateOfBirth", `${y}-${m}-${d}`);
          setShowDatePicker(false);
          return;
        }
      }
    };

    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [showTimePicker, tpHour, tpMinute, tpPeriod, showDatePicker, pickerSelected]);

  // When timepicker opens, always start with hour active and focused
  useEffect(() => {
    if (showTimePicker) {
      setTpActive("hour");
      setTimeout(() => {
        hourRef.current?.focus();
      }, 0);
    }
  }, [showTimePicker]);

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
      const res = await fetch(`${baseApiUrl}/aitools/wellness/v2/users/profile`, { method: "POST", body: fd });
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
          min-height: 100vh;
          width: 100vw;
          overflow-y: auto;      /* allow page to scroll instead of cutting */
          overflow-x: hidden;
          font-family: 'DM Sans', sans-serif;
          background: #FFFFFF;
          padding: 24px 28px;    /* white space top & bottom like design */
          gap: 0;
        }

        /* ══════════ LEFT PANEL ══════════ */
        /* Fixed Figma ratio 676:960, fills available height within padding */
        .sp-left {
          /* left and right panels share space equally */
          flex: 1;
          max-width: 50%;
          min-width: 0;
          border-radius: 20px;
          padding: 24px 0;        /* top & bottom breathing room */
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
          max-width: 50%;
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
          /* subtle container framing without touching inputs */
          border-top: 3px solid #00b8f8;
          box-shadow:
            0 10px 30px rgba(15, 23, 42, 0.10),
            0 0 0 1px rgba(148, 163, 184, 0.18);
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
          height: clamp(34px, 3.6vh, 40px);
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

        /* ══════════ DATE PICKER ══════════ */

        .sp-datepicker-backdrop {
          position: fixed;
          inset: 0;
          background: rgba(15,23,42,0.35);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 999;
        }

        .sp-datepicker {
          width: 380px;           /* wider so all 7 columns fit comfortably */
          max-width: 96vw;
          background: linear-gradient(180deg, #ffffff 0%, #f8fafc 100%);
          border-radius: 22px;
          box-shadow:
            0 24px 60px rgba(15,23,42,0.28),
            0 0 0 1px rgba(148,163,184,0.18);
          padding: 18px 22px 14px;
          font-family: 'DM Sans', sans-serif;
          color: #0f172a;
        }

        .sp-datepicker-header {
          margin-bottom: 12px;
        }

        .sp-datepicker-title {
          font-size: 0.80rem;
          color: #64748b;
          margin-bottom: 2px;
        }

        .sp-datepicker-value {
          display: flex;
          align-items: center;
          justify-content: space-between;
          font-size: 1.15rem;
          font-weight: 600;
          color: #0f172a;
        }

        .sp-datepicker-body {
          margin-top: 6px;
        }

        .sp-datepicker-month-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 12px;
          font-size: 0.85rem;
          gap: 10px;
        }

        .sp-datepicker-month-row-center {
          display: flex;
          align-items: center;
          gap: 8px;
          flex: 1;
          justify-content: center;
        }

        .sp-datepicker-select-wrap {
          position: relative;
          display: inline-flex;
          align-items: center;
        }

        .sp-datepicker-select {
          border-radius: 999px;
          border: 1px solid #e2e8f0;
          padding: 5px 26px 5px 12px; /* extra right padding for pencil */
          font-size: 0.8rem;
          background: #ffffff;
          color: #0f172a;
          outline: none;
          cursor: pointer;
          box-shadow: 0 1px 2px rgba(15,23,42,0.06);
          transition: border-color 0.16s ease, box-shadow 0.16s ease, background 0.16s ease;
          appearance: none;
          -webkit-appearance: none;
        }

        .sp-datepicker-select:focus {
          border-color: #00b8f8;
          box-shadow: 0 0 0 2px rgba(0,184,248,0.20);
          background: #f0f9ff;
        }

        .sp-datepicker-pencil {
          position: absolute;
          right: 8px;
          pointer-events: none;
          color: #9ca3af;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .sp-datepicker-arrow-btn {
          border: none;
          background: transparent;
          cursor: pointer;
          padding: 4px 6px;
          border-radius: 999px;
          color: #64748b;
        }

        .sp-datepicker-arrow-btn:hover {
          background: rgba(148,163,184,0.16);
        }

        .sp-datepicker-grid {
          display: grid;
          grid-template-columns: repeat(7, 1fr);
          gap: 3px;               /* slightly smaller gap to avoid overflow */
          font-size: 0.78rem;
        }

        .sp-datepicker-weekday {
          text-align: center;
          color: #94a3b8;
          padding: 4px 0;
        }

        .sp-datepicker-day {
          height: 32px;
          border-radius: 999px;
          border: none;
          background: transparent;
          cursor: pointer;
          font-size: 0.80rem;
          color: #0f172a;
        }

        .sp-datepicker-day.sp-outside {
          visibility: hidden;
        }

        .sp-datepicker-day.sp-selected {
          background: #00b8f8;
          color: #ffffff;
        }

        .sp-datepicker-day:not(.sp-selected):hover {
          background: rgba(148,163,184,0.18);
        }

        .sp-datepicker-footer {
          display: flex;
          justify-content: flex-end;
          gap: 12px;
          margin-top: 10px;
          padding-top: 8px;
          border-top: 1px solid #e2e8f0;
          font-size: 0.80rem;
        }

        .sp-datepicker-btn {
          border: none;
          background: transparent;
          cursor: pointer;
          padding: 6px 10px;
          border-radius: 999px;
          font-weight: 500;
        }

        .sp-datepicker-btn.sp-cancel {
          color: #f97373;
        }

        .sp-datepicker-btn.sp-ok {
          color: #0f172a;
          opacity: 0.35;
        }

        .sp-datepicker-btn.sp-ok.sp-enabled {
          color: #00b8f8;
          opacity: 1;
        }

        /* ══════════ TIME PICKER ══════════ */

        .sp-timepicker {
          width: 320px;
          max-width: 94vw;
          background: #ffffff;
          border-radius: 20px;
          box-shadow:
            0 22px 55px rgba(15,23,42,0.25),
            0 0 0 1px rgba(148,163,184,0.18);
          padding: 16px 20px 14px;
          font-family: 'DM Sans', sans-serif;
          color: #0f172a;
        }

        .sp-timepicker-title {
          font-size: 0.80rem;
          color: #64748b;
          margin-bottom: 6px;
        }

        .sp-timepicker-main {
          text-align: center;
          font-size: 1.15rem;
          font-weight: 600;
          margin-bottom: 10px;
        }

        .sp-timepicker-wheel {
          display: flex;
          justify-content: center;
          align-items: center;
          gap: 14px;
          margin-bottom: 10px;
        }

        .sp-timepicker-column {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 4px;
          min-width: 40px;
        }

        .sp-timepicker-faded {
          font-size: 0.78rem;
          color: #cbd5e1;
          height: 16px;
        }

        .sp-timepicker-value {
          font-size: 1.05rem;
          font-weight: 600;
          color: #0f172a;
          height: 26px;
          padding: 4px 10px;
          border-radius: 999px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          min-width: 32px;
        }

        .sp-timepicker-tap {
          cursor: pointer;
          user-select: none;
        }

        .sp-timepicker-value.sp-active {
          background: #e0f2fe;
          color: #0f172a;
          box-shadow: 0 0 0 2px rgba(14,165,233,0.70);
        }

        .sp-timepicker-colon {
          font-size: 1.1rem;
          font-weight: 600;
          color: #94a3b8;
          padding: 0 2px;
        }

        .sp-timepicker-period {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 4px;
          margin-left: 8px;
          min-width: 40px;
        }

        .sp-timepicker-footer {
          display: flex;
          justify-content: flex-end;
          gap: 12px;
          margin-top: 12px;
          padding-top: 10px;
          border-top: 1px solid #e2e8f0;
          font-size: 0.80rem;
        }

        /* ══════════ RESPONSIVE ══════════ */

        /* Laptop / tablet landscape 769–1200 */
        @media (max-width: 1200px) and (min-width: 769px) {
          .sp-root {
            padding: 14px 16px;
          }
          .sp-left {
            max-width: 40%;
          }
          .sp-right {
            padding-left: 16px;
          }
          .sp-card {
            max-width: 340px;
          }
          .sp-card-title {
            font-size: 0.95rem;
            margin-bottom: 0.7rem;
          }
          .sp-field-label {
            font-size: 0.75rem;
          }
          .sp-fields {
            gap: 8px;
          }
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
                      onClick={() => {
                        const existing = formData.dateOfBirth;
                        if (existing) {
                          const [y, m, d] = existing.split("-").map(Number);
                          const dt = new Date(y, (m || 1) - 1, d || 1);
                          setPickerSelected(dt);
                          setPickerMonth(dt.getMonth());
                          setPickerYear(dt.getFullYear());
                        } else {
                          const today = new Date();
                          setPickerSelected(today);
                          setPickerMonth(today.getMonth());
                          setPickerYear(today.getFullYear());
                        }
                        setShowDatePicker(true);
                      }}>
                      <IcoCalendar />
                    </span>
                    <input
                      ref={dobRef}
                      className="sp-input"
                      type="text"
                      readOnly
                      placeholder="dd-mm-yyyy"
                      value={formData.dateOfBirth
                        ? formData.dateOfBirth.split("-").reverse().join("-")
                        : ""}
                      onClick={() => {
                        const existing = formData.dateOfBirth;
                        if (existing) {
                          const [y, m, d] = existing.split("-").map(Number);
                          const dt = new Date(y, (m || 1) - 1, d || 1);
                          setPickerSelected(dt);
                          setPickerMonth(dt.getMonth());
                          setPickerYear(dt.getFullYear());
                        } else {
                          const today = new Date();
                          setPickerSelected(today);
                          setPickerMonth(today.getMonth());
                          setPickerYear(today.getFullYear());
                        }
                        setShowDatePicker(true);
                      }}
                      required
                    />
                  </div>
                </div>

                {/* Time of Birth */}
                <div>
                  <label className="sp-field-label">Time of birth</label>
                  <div className="sp-wrap">
                    <span className="sp-ico sp-ico-btn"
                      onClick={() => {
                        const t = formData.timeOfBirth || "12:00";
                        const [hhStr, mmStr] = t.split(":");
                        let hh = parseInt(hhStr || "12", 10);
                        const mm = parseInt(mmStr || "0", 10);
                        const period = hh >= 12 ? "PM" : "AM";
                        let displayHour = hh % 12;
                        if (displayHour === 0) displayHour = 12;
                        setTpHour(displayHour);
                        setTpMinute(isNaN(mm) ? 0 : mm);
                        setTpPeriod(period as "AM" | "PM");
                        setTpActive("hour");
                        setShowTimePicker(true);
                      }}>
                      <IcoClock />
                    </span>
                    <input
                      ref={timeRef}
                      className="sp-input"
                      type="text"
                      readOnly
                      placeholder="hh:mm --"
                      value={formatTimeDisplay(formData.timeOfBirth)}
                      onClick={() => {
                        const t = formData.timeOfBirth || "12:00";
                        const [hhStr, mmStr] = t.split(":");
                        let hh = parseInt(hhStr || "12", 10);
                        const mm = parseInt(mmStr || "0", 10);
                        const period = hh >= 12 ? "PM" : "AM";
                        let displayHour = hh % 12;
                        if (displayHour === 0) displayHour = 12;
                        setTpHour(displayHour);
                        setTpMinute(isNaN(mm) ? 0 : mm);
                        setTpPeriod(period as "AM" | "PM");
                        setTpActive("minute");
                        setShowTimePicker(true);
                      }}
                      required
                    />
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

      {showDatePicker && (
        <div
          className="sp-datepicker-backdrop"
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowDatePicker(false);
          }}
        >
          <div className="sp-datepicker">
            <div className="sp-datepicker-header">
              <div className="sp-datepicker-title">Select date</div>
              <div className="sp-datepicker-value">
                <span>
                  {pickerSelected
                    ? pickerSelected.toLocaleDateString("en-GB", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                      })
                    : "—"}
                </span>
              </div>
            </div>

            <div className="sp-datepicker-body">
              <div className="sp-datepicker-month-row">
                <button
                  type="button"
                  className="sp-datepicker-arrow-btn"
                  onClick={() => {
                    const prevMonth = pickerMonth - 1;
                    if (prevMonth < 0) {
                      setPickerMonth(11);
                      setPickerYear(pickerYear - 1);
                    } else {
                      setPickerMonth(prevMonth);
                    }
                  }}
                >
                  {"<"}
                </button>

                <div className="sp-datepicker-month-row-center">
                  <div className="sp-datepicker-select-wrap">
                    <select
                      className="sp-datepicker-select"
                      value={pickerMonth}
                      onChange={(e) => setPickerMonth(Number(e.target.value))}
                    >
                      {[
                        "January",
                        "February",
                        "March",
                        "April",
                        "May",
                        "June",
                        "July",
                        "August",
                        "September",
                        "October",
                        "November",
                        "December",
                      ].map((m, idx) => (
                        <option key={m} value={idx}>
                          {m}
                        </option>
                      ))}
                    </select>
                    <span className="sp-datepicker-pencil">
                      <svg
                        width="12"
                        height="12"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.8"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <path d="M12 20h9" />
                        <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L8 18l-4 1 1-4 11.5-11.5z" />
                      </svg>
                    </span>
                  </div>

                  <div className="sp-datepicker-select-wrap">
                    <select
                      className="sp-datepicker-select"
                      value={pickerYear}
                      onChange={(e) => setPickerYear(Number(e.target.value))}
                    >
                      {Array.from({ length: 121 }).map((_, i) => {
                        const year = new Date().getFullYear() - 100 + i;
                        return (
                          <option key={year} value={year}>
                            {year}
                          </option>
                        );
                      })}
                    </select>
                    <span className="sp-datepicker-pencil">
                      <svg
                        width="12"
                        height="12"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.8"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <path d="M12 20h9" />
                        <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L8 18l-4 1 1-4 11.5-11.5z" />
                      </svg>
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  className="sp-datepicker-arrow-btn"
                  onClick={() => {
                    const nextMonth = pickerMonth + 1;
                    if (nextMonth > 11) {
                      setPickerMonth(0);
                      setPickerYear(pickerYear + 1);
                    } else {
                      setPickerMonth(nextMonth);
                    }
                  }}
                >
                  {">"}
                </button>
              </div>

              <div className="sp-datepicker-grid">
                {["S", "M", "T", "W", "T", "F", "S"].map((d) => (
                  <div key={d} className="sp-datepicker-weekday">
                    {d}
                  </div>
                ))}
                {(() => {
                  const firstDay = new Date(
                    pickerYear,
                    pickerMonth,
                    1
                  ).getDay();
                  const daysInMonth = new Date(
                    pickerYear,
                    pickerMonth + 1,
                    0
                  ).getDate();
                  const cells = [];
                  for (let i = 0; i < firstDay; i++) {
                    cells.push(
                      <button
                        key={`empty-${i}`}
                        className="sp-datepicker-day sp-outside"
                        disabled
                      />
                    );
                  }
                  for (let day = 1; day <= daysInMonth; day++) {
                    const current = new Date(pickerYear, pickerMonth, day);
                    const isSelected =
                      pickerSelected &&
                      current.toDateString() ===
                        pickerSelected.toDateString();
                    cells.push(
                      <button
                        key={day}
                        type="button"
                        className={
                          "sp-datepicker-day" +
                          (isSelected ? " sp-selected" : "")
                        }
                        onClick={() => {
                          setPickerSelected(current);
                        }}
                      >
                        {day}
                      </button>
                    );
                  }
                  return cells;
                })()}
              </div>
            </div>

            <div className="sp-datepicker-footer">
              <button
                type="button"
                className="sp-datepicker-btn sp-cancel"
                onClick={() => setShowDatePicker(false)}
              >
                Cancel
              </button>
              <button
                type="button"
                className={
                  "sp-datepicker-btn sp-ok" +
                  (pickerSelected ? " sp-enabled" : "")
                }
                disabled={!pickerSelected}
                onClick={() => {
                  if (!pickerSelected) return;
                  const y = pickerSelected.getFullYear();
                  const m = String(pickerSelected.getMonth() + 1).padStart(
                    2,
                    "0"
                  );
                  const d = String(pickerSelected.getDate()).padStart(2, "0");
                  set("dateOfBirth", `${y}-${m}-${d}`);
                  setShowDatePicker(false);
                }}
              >
                OK
              </button>
            </div>
          </div>
        </div>
      )}

      {showTimePicker && (
        <div
          className="sp-datepicker-backdrop"
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowTimePicker(false);
          }}
        >
          <div className="sp-timepicker">
            <div className="sp-timepicker-title">Set time</div>
            <div className="sp-timepicker-main">
              {(() => {
                const pad = (n: number) => n.toString().padStart(2, "0");
                return `${pad(tpHour)} : ${pad(tpMinute)} ${tpPeriod}`;
              })()}
            </div>

            <div
              className="sp-timepicker-wheel"
              onWheel={(e) => {
                e.preventDefault();
                const delta = e.deltaY < 0 ? 1 : -1;
                if (tpActive === "hour") {
                  stepHour(delta);
                } else if (tpActive === "minute") {
                  stepMinute(delta);
                } else if (tpActive === "period") {
                  // treat any scroll as toggle
                  stepPeriod();
                }
              }}
            >
              {(() => {
                const pad = (n: number) => n.toString().padStart(2, "0");

                const prevHour = ((tpHour + 10) % 12) + 1;
                const nextHour = (tpHour % 12) + 1;
                const prevMin = (tpMinute + 59) % 60;
                const nextMin = (tpMinute + 1) % 60;
                return (
                  <>
                    <div className="sp-timepicker-column">
                      <div
                        className="sp-timepicker-faded sp-timepicker-tap"
                        onClick={() =>
                          setTpHour(((tpHour + 10) % 12) + 1)
                        }
                      >
                        {pad(prevHour)}
                      </div>
                      <div
                        ref={hourRef}
                        className={
                          "sp-timepicker-value sp-timepicker-tap" +
                          (tpActive === "hour" ? " sp-active" : "")
                        }
                        tabIndex={0}
                        onWheel={(e) => {
                          e.preventDefault();
                          stepHour(e.deltaY < 0 ? 1 : -1);
                        }}
                        onKeyDown={(e) => {
                          if (e.key === "ArrowUp") {
                            e.preventDefault();
                            stepHour(1);
                          } else if (e.key === "ArrowDown") {
                            e.preventDefault();
                            stepHour(-1);
                          } else if (e.key === "ArrowRight") {
                            e.preventDefault();
                            setTpActive("minute");
                            setTimeout(() => {
                              minuteRef.current?.focus();
                            }, 0);
                          }
                        }}
                        onFocus={() => setTpActive("hour")}
                        onClick={() => setTpActive("hour")}
                      >
                        {pad(tpHour)}
                      </div>
                      <div
                        className="sp-timepicker-faded sp-timepicker-tap"
                        onClick={() => setTpHour(nextHour)}
                      >
                        {pad(nextHour)}
                      </div>
                    </div>

                    <div className="sp-timepicker-colon">:</div>

                    <div className="sp-timepicker-column">
                      <div
                        className="sp-timepicker-faded sp-timepicker-tap"
                        onClick={() => setTpMinute(prevMin)}
                      >
                        {pad(prevMin)}
                      </div>
                      <div
                        ref={minuteRef}
                        className={
                          "sp-timepicker-value sp-timepicker-tap" +
                          (tpActive === "minute" ? " sp-active" : "")
                        }
                        tabIndex={0}
                        onWheel={(e) => {
                          e.preventDefault();
                          stepMinute(e.deltaY < 0 ? 1 : -1);
                        }}
                        onKeyDown={(e) => {
                          if (e.key === "ArrowUp") {
                            e.preventDefault();
                            stepMinute(1);
                          } else if (e.key === "ArrowDown") {
                            e.preventDefault();
                            stepMinute(-1);
                          } else if (e.key === "ArrowLeft") {
                            e.preventDefault();
                            setTpActive("hour");
                            setTimeout(() => {
                              hourRef.current?.focus();
                            }, 0);
                          } else if (e.key === "ArrowRight") {
                            e.preventDefault();
                            setTpActive("period");
                            setTimeout(() => {
                              periodRef.current?.focus();
                            }, 0);
                          }
                        }}
                        onFocus={() => setTpActive("minute")}
                        onClick={() => setTpActive("minute")}
                      >
                        {pad(tpMinute)}
                      </div>
                      <div
                        className="sp-timepicker-faded sp-timepicker-tap"
                        onClick={() => setTpMinute(nextMin)}
                      >
                        {pad(nextMin)}
                      </div>
                    </div>

                    <div className="sp-timepicker-period">
                      <div
                        className="sp-timepicker-faded sp-timepicker-tap"
                        onClick={stepPeriod}
                      >
                        {tpPeriod === "AM" ? "PM" : "AM"}
                      </div>
                      <div
                        ref={periodRef}
                        className={
                          "sp-timepicker-value sp-timepicker-tap" +
                          (tpActive === "period" ? " sp-active" : "")
                        }
                        tabIndex={0}
                        onWheel={(e) => {
                          e.preventDefault();
                          stepPeriod();
                        }}
                        onKeyDown={(e) => {
                          if (e.key === "ArrowUp" || e.key === "ArrowDown") {
                            e.preventDefault();
                            stepPeriod();
                          } else if (e.key === "ArrowLeft") {
                            e.preventDefault();
                            setTpActive("minute");
                            setTimeout(() => {
                              minuteRef.current?.focus();
                            }, 0);
                          }
                        }}
                        onFocus={() => setTpActive("period")}
                        onClick={() => setTpActive("period")}
                      >
                        {tpPeriod}
                      </div>
                      <div className="sp-timepicker-faded">&nbsp;</div>
                    </div>
                  </>
                );
              })()}
            </div>

            <div className="sp-timepicker-footer">
              <button
                type="button"
                className="sp-datepicker-btn sp-cancel"
                onClick={() => setShowTimePicker(false)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="sp-datepicker-btn sp-ok sp-enabled"
                onClick={() => {
                  const hour24 =
                    (tpHour % 12) + (tpPeriod === "PM" ? 12 : 0);
                  const pad = (n: number) => n.toString().padStart(2, "0");
                  const val = `${pad(hour24)}:${pad(tpMinute)}`;
                  set("timeOfBirth", val);
                  setShowTimePicker(false);
                }}
              >
                OK
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default SoulProfilePage;