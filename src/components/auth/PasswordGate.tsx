import { useEffect, useState, type FormEvent } from "react";
import ErosClinicLogo from "@/assets/images/eros-wellness-ai-clinic-cropped.png";

/**
 * Temporary password gate — until real auth lands.
 *
 * - Wrap the entire app's routes in this component. Every path the user
 *   navigates to is blocked until the correct password is entered.
 * - Once unlocked, the flag persists for the current browser tab/session
 *   (sessionStorage) — closing the browser re-locks the app.
 *
 * Password is hardcoded by design — this is NOT a security control, just
 * a stop-gap so the app isn't publicly browsable in dev/staging.
 */

const STORAGE_KEY = "eros:gatePassed";
const PASSWORD = "eros@2026";

interface PasswordGateProps {
  children: React.ReactNode;
}

export default function PasswordGate({ children }: PasswordGateProps) {
  const [unlocked, setUnlocked] = useState<boolean>(() => {
    try {
      return sessionStorage.getItem(STORAGE_KEY) === "1";
    } catch {
      return false;
    }
  });
  const [value, setValue] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    if (!unlocked) document.title = "Locked — Eros Wellness";
  }, [unlocked]);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (value === PASSWORD) {
      try {
        sessionStorage.setItem(STORAGE_KEY, "1");
      } catch {
        /* ignore (private mode etc.) */
      }
      setError(null);
      setUnlocked(true);
    } else {
      setError("Incorrect password.");
    }
  };

  if (unlocked) return <>{children}</>;

  return (
    <div
      style={{
        minHeight: "100vh",
        width: "100vw",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background:
          "linear-gradient(135deg, rgba(240,249,255,0.96), rgba(255,255,255,0.98)), radial-gradient(circle at 18% 12%, rgba(0,184,248,0.16), transparent 34%)",
        color: "#0f172a",
        fontFamily:
          "'DM Sans', system-ui, -apple-system, BlinkMacSystemFont, sans-serif",
        padding: "24px",
      }}
    >
      <form
        onSubmit={handleSubmit}
        autoComplete="off"
        style={{
          width: "100%",
          maxWidth: "440px",
          background: "#ffffff",
          border: "1px solid rgba(148, 163, 184, 0.22)",
          borderTop: "4px solid #00b8f8",
          borderRadius: "18px",
          padding: "38px 34px",
          boxShadow: "0 22px 55px rgba(15, 23, 42, 0.10)",
        }}
      >
        <div style={{ textAlign: "center", marginBottom: "28px" }}>
          <div
            style={{
              width: "220px",
              maxWidth: "78%",
              margin: "0 auto 22px",
              padding: "10px 18px",
              borderRadius: "16px",
              background: "#ffffff",
              border: "1px solid #dbeafe",
              boxShadow: "0 10px 28px rgba(14, 165, 233, 0.10)",
            }}
          >
            <img
              src={ErosClinicLogo}
              alt="EROS Wellness AI Clinic"
              style={{
                width: "100%",
                height: "auto",
                objectFit: "contain",
                display: "block",
              }}
            />
          </div>
          <h1
            style={{
              fontSize: "24px",
              fontWeight: 800,
              margin: 0,
              letterSpacing: "0",
              color: "#0f172a",
            }}
          >
            Restricted Access
          </h1>
          <p
            style={{
              marginTop: "8px",
              marginBottom: 0,
              fontSize: "14px",
              color: "#64748b",
              lineHeight: 1.5,
            }}
          >
            Enter the password to continue to Eros Wellness.
          </p>
        </div>

        <label
          htmlFor="gate-password"
          style={{
            display: "block",
            fontSize: "13px",
            fontWeight: 800,
            color: "#0f172a",
            marginBottom: "8px",
          }}
        >
          Password
        </label>
        <div style={{ position: "relative" }}>
          <input
            id="gate-password"
            name="gate-password"
            type={showPassword ? "text" : "password"}
            value={value}
            onChange={(e) => {
              setValue(e.target.value);
              if (error) setError(null);
            }}
            autoFocus
            autoComplete="off"
            spellCheck={false}
            style={{
              width: "100%",
              height: "46px",
              padding: "0 44px 0 14px",
              borderRadius: "10px",
              border: error
                ? "1px solid rgba(239,68,68,0.6)"
                : "1.5px solid #dbeafe",
              background: "#ffffff",
              color: "#0f172a",
              fontSize: "15px",
              outline: "none",
              transition: "border-color 0.2s",
            }}
            onFocus={(e) => {
              e.currentTarget.style.borderColor = error
                ? "rgba(239,68,68,0.8)"
                : "#00b8f8";
            }}
            onBlur={(e) => {
              e.currentTarget.style.borderColor = error
                ? "rgba(239,68,68,0.6)"
                : "#dbeafe";
            }}
          />
          <button
            type="button"
            onClick={() => setShowPassword((s) => !s)}
            aria-label={showPassword ? "Hide password" : "Show password"}
            style={{
              position: "absolute",
              right: "10px",
              top: "50%",
              transform: "translateY(-50%)",
              background: "transparent",
              border: "none",
              color: "#64748b",
              cursor: "pointer",
              padding: "6px",
              borderRadius: "6px",
            }}
          >
            {showPassword ? (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                <line x1="1" y1="1" x2="23" y2="23" />
              </svg>
            ) : (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                <circle cx="12" cy="12" r="3" />
              </svg>
            )}
          </button>
        </div>

        {error && (
          <p
            role="alert"
            style={{
              color: "#ef4444",
              fontSize: "13px",
              margin: "10px 0 0",
            }}
          >
            {error}
          </p>
        )}

        <button
          type="submit"
          style={{
            marginTop: "22px",
            width: "100%",
            height: "46px",
            borderRadius: "10px",
            border: "none",
            background: "#00b8f8",
            color: "#fff",
            fontSize: "15px",
            fontWeight: 800,
            cursor: "pointer",
            letterSpacing: "0.01em",
            boxShadow: "0 10px 24px rgba(0, 184, 248, 0.26)",
            transition: "opacity 0.18s, transform 0.18s",
          }}
          onMouseDown={(e) => (e.currentTarget.style.transform = "scale(0.99)")}
          onMouseUp={(e) => (e.currentTarget.style.transform = "scale(1)")}
        >
          Unlock
        </button>
      </form>
    </div>
  );
}
