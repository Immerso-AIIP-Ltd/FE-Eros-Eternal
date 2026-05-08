import { Home } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import { usePhcSession } from "@/context/PhcSessionContext";
import { getPhcCopy } from "@/i18n/phcCopy";

export default function ReportsHomeButton() {
  const navigate = useNavigate();
  const location = useLocation();
  const { language } = usePhcSession();
  const t = getPhcCopy(language);
  const isReportsPage = location.pathname === "/reports";

  return (
    <button
      type="button"
      onClick={() => navigate("/reports")}
      aria-label={t.home}
      aria-current={isReportsPage ? "page" : undefined}
      style={{
        position: "fixed",
        left: 18,
        bottom: 18,
        zIndex: 1200,
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        gap: 8,
        minHeight: 44,
        padding: "10px 16px",
        borderRadius: 999,
        border: "1px solid rgba(14, 165, 233, 0.28)",
        background: isReportsPage ? "#0f172a" : "rgba(255, 255, 255, 0.96)",
        color: isReportsPage ? "#ffffff" : "#0369a1",
        boxShadow: "0 14px 34px rgba(15, 23, 42, 0.16)",
        cursor: "pointer",
        fontFamily: "'DM Sans', system-ui, -apple-system, BlinkMacSystemFont, sans-serif",
        fontSize: 14,
        fontWeight: 800,
      }}
    >
      <Home size={17} />
      {t.home}
    </button>
  );
}
