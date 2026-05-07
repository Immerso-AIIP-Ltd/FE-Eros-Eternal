import { getPhcCopy } from "@/i18n/phcCopy";
import { usePhcSession } from "@/context/PhcSessionContext";

export default function LanguageToggle() {
  const { language, setLanguage } = usePhcSession();
  const t = getPhcCopy(language);

  return (
    <div
      style={{
        position: "fixed",
        top: 16,
        right: 16,
        zIndex: 1000,
        display: "inline-flex",
        gap: 4,
        padding: 4,
        borderRadius: 999,
        background: "rgba(255, 255, 255, 0.92)",
        border: "1px solid rgba(17, 24, 39, 0.12)",
        boxShadow: "0 10px 30px rgba(0,0,0,0.14)",
      }}
      aria-label="Language selector"
    >
      {(["en", "gu"] as const).map((item) => {
        const active = language === item;
        return (
          <button
            key={item}
            type="button"
            onClick={() => setLanguage(item)}
            style={{
              border: 0,
              borderRadius: 999,
              padding: "8px 12px",
              minWidth: 82,
              cursor: "pointer",
              fontWeight: 700,
              color: active ? "#ffffff" : "#374151",
              background: active ? "#00B8D4" : "transparent",
              fontSize: 13,
            }}
          >
            {item === "en" ? t.english : t.gujarati}
          </button>
        );
      })}
    </div>
  );
}

