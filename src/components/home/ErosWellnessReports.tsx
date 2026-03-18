import { useMemo, useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import Vibration from "../../assets/result-images/add_reaction.png";
import Aura from "../../assets/result-images/background_replace.png";
import StarMap from "../../assets/result-images/brightness_5.png";
import Flame from "../../assets/result-images/mode_heat.png";
import Kosha from "../../assets/result-images/clinical_notes.png";
import Longevity from "../../assets/result-images/ecg_heart.png";

const ArrowIcon = () => (
  <svg width="10" height="10" viewBox="0 0 12 12" fill="none">
    <path
      d="M2 10 L10 2 M10 2 H5 M10 2 V7"
      stroke="white"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const cardsData = [
  { id: 2, icon: Vibration, title: "Vibrational Frequency", description: "Analyze your energetic resonance and frequency levels.", reportType: "vibrational_frequency", route: "/vibrational-frequency" },
  { id: 3, icon: Aura, title: "Aura Profile", description: "Discover the colors and layers of your personal aura field.", reportType: "aura_profile", route: "/aura-profile" },
  { id: 4, icon: StarMap, title: "Star Map", description: "Map your celestial alignment and cosmic origin points.", reportType: "star_map", route: "/star-map" },
  { id: 5, icon: Flame, title: "Flame Score", description: "Measure your inner vitality and passionate drive.", reportType: "flame_score", route: "/flame-score" },
  { id: 6, icon: Kosha, title: "Kosha Map", description: "Navigate the five layers of your physical and spiritual body.", reportType: "kosha_map", route: "/kosha-map" },
  { id: 7, icon: Longevity, title: "Longevity Blueprint", description: "Actionable insights for a longer, healthier, conscious life.", reportType: "longevity_blueprint", route: "/longevity-blueprint" },
];

type ReportType = (typeof cardsData)[number]["reportType"];

type GeneratedReportStatus = {
  hasReport: boolean;
  metricText?: string;
  metricUnitText?: string;
};

type WellnessCardProps = {
  icon: string;
  title: string;
  description: string;
  hasReport: boolean;
  loading: boolean;
  metricText?: string;
  metricUnitText?: string;
  onCardClick: () => void;
};

const CheckBadgeIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
    <path
      d="M20 6L9 17l-5-5"
      stroke="#0EA5B7"
      strokeWidth="2.2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const WellnessCard = ({
  icon,
  title,
  description,
  hasReport,
  loading,
  metricText,
  metricUnitText,
  onCardClick,
}: WellnessCardProps) => {
  const displayButtonText = loading ? "..." : hasReport ? "View Report" : "Generate";
  const shouldShowMetric = Boolean(hasReport && metricText && !loading);

  return (
    <div
      onClick={onCardClick}
      style={{
        borderRadius: "18px",
        padding: "22px 18px",
        display: "flex",
        flexDirection: "column",
        gap: "10px",
        cursor: "pointer",
        // RESTORED GRADIENT
        background: "linear-gradient(139.22deg, #ffffff 44.67%, #00b8f8 281.29%)",
        boxShadow: "8px 4px 25px 0px #00000014",
        border: "1px solid rgba(255,255,255,0.9)",
        height: "100%",
        minHeight: "200px",
        transition: "all 0.2s ease",
        fontFamily: "'Poppins', sans-serif",
        position: "relative",
      }}
    >
      {hasReport && !loading && (
        <div
          style={{
            position: "absolute",
            top: 12,
            right: 12,
            display: "inline-flex",
            alignItems: "center",
            gap: "6px",
            padding: "5px 9px",
            borderRadius: "999px",
            background: "rgba(14, 165, 183, 0.12)",
            border: "1px solid rgba(14, 165, 183, 0.25)",
            color: "#0EA5B7",
            fontSize: "10.5px",
            fontWeight: 700,
            letterSpacing: "0.2px",
            userSelect: "none",
          }}
        >
          <CheckBadgeIcon />
          Generated
        </div>
      )}

      <div style={{ width: 34, height: 34, borderRadius: "10px", background: "#9DCAE6", display: "flex", alignItems: "center", justifyContent: "center", padding: "6px" }}>
        <img src={icon} alt={title} style={{ width: "100%", height: "100%", objectFit: "contain" }} />
      </div>
      <div>
        <h3 style={{ margin: "0 0 4px 0", fontSize: "14px", fontWeight: 700, color: "#1a2a3a" }}>{title}</h3>
        {shouldShowMetric ? (
          <div style={{ display: "flex", alignItems: "baseline", gap: "6px" }}>
            <div style={{ fontSize: "30px", fontWeight: 800, color: "#0d1f2d", letterSpacing: "-0.5px", lineHeight: 1.1 }}>
              {metricText}
            </div>
            {metricUnitText ? (
              <div style={{ fontSize: "11px", fontWeight: 700, color: "#6b8aa0" }}>
                {metricUnitText}
              </div>
            ) : null}
          </div>
        ) : (
          <p style={{ margin: 0, fontSize: "11.5px", color: "#6b8aa0", lineHeight: 1.45 }}>{description}</p>
        )}
      </div>
      <div style={{ marginTop: "auto" }}>
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); onCardClick(); }}
          style={{ 
            display: "inline-flex", alignItems: "center", gap: "6px", background: "#9dcae6", 
            border: "none", borderRadius: "20px", padding: "7px 15px", color: "#fff", 
            fontSize: "11.5px", fontWeight: 600, cursor: "pointer",
            boxShadow: "0 4px 10px rgba(74, 164, 227, 0.2)"
          }}
        >
          {displayButtonText}
          <ArrowIcon />
        </button>
      </div>
    </div>
  );
};

type IndividualReportApiResponse = {
  success?: boolean;
  data?: {
    report_data?: {
      assessment?: {
        calculated_vibrational_frequency?: number;
        current_energy_assessment?: {
          vibrational_frequency?: number;
        };
        vibrational_frequency?: number;
        current_vibrational_frequency?: number;
        current_flame_score?: number;
        flame_score?: string;
        aura_intensity?: string;
        kosha_alignment?: string;
        star_magnitude?: string;
        longevity_score?: string;
      };
      flame_vitality_assessment?: {
        current_score?: number;
      };
    };
  };
};

function formatMetricValue(value: unknown): string | undefined {
  if (value == null) return undefined;
  if (typeof value === "number") {
    if (Number.isNaN(value)) return undefined;
    if (!Number.isFinite(value)) return undefined;
    return Math.round(value).toString();
  }

  if (typeof value === "string") {
    const trimmedValue = value.trim();
    if (!trimmedValue) return undefined;

    const numericMatch = trimmedValue.match(/-?\d+(\.\d+)?/);
    if (!numericMatch) return trimmedValue;

    const parsed = Number(numericMatch[0]);
    if (!Number.isFinite(parsed)) return trimmedValue;
    return Math.round(parsed).toString();
  }

  return undefined;
}

function extractMetricFromReportResponse(
  reportType: ReportType,
  responseData: IndividualReportApiResponse
): Pick<GeneratedReportStatus, "metricText" | "metricUnitText"> {
  const assessment = responseData.data?.report_data?.assessment;
  const flameVitalityAssessment = responseData.data?.report_data?.flame_vitality_assessment;

  if (!assessment) return {};

  if (reportType === "vibrational_frequency") {
    const metricText =
      formatMetricValue(assessment.calculated_vibrational_frequency) ??
      formatMetricValue(assessment.current_energy_assessment?.vibrational_frequency) ??
      formatMetricValue(assessment.vibrational_frequency) ??
      formatMetricValue(assessment.current_vibrational_frequency);

    return metricText ? { metricText, metricUnitText: "Hz" } : {};
  }

  if (reportType === "flame_score") {
    const metricText =
      formatMetricValue(assessment.current_flame_score) ??
      formatMetricValue(assessment.flame_score) ??
      formatMetricValue(flameVitalityAssessment?.current_score);

    return metricText ? { metricText, metricUnitText: "%" } : {};
  }

  if (reportType === "aura_profile") {
    const metricText = formatMetricValue(assessment.aura_intensity);
    return metricText ? { metricText, metricUnitText: "%" } : {};
  }

  if (reportType === "longevity_blueprint") {
    const metricText = formatMetricValue(assessment.longevity_score);
    return metricText ? { metricText, metricUnitText: "%" } : {};
  }

  if (reportType === "star_map") {
    const metricText = formatMetricValue(assessment.star_magnitude);
    return metricText ? { metricText } : {};
  }

  if (reportType === "kosha_map") {
    const metricText = formatMetricValue(assessment.kosha_alignment);
    return metricText ? { metricText } : {};
  }

  return {};
}

export default function ErosWellnessReports({ embedded = false }: { embedded?: boolean }) {
  const navigate = useNavigate();
  const location = useLocation();

  const [reportStatuses, setReportStatuses] = useState<Record<ReportType, GeneratedReportStatus>>(
    {} as Record<ReportType, GeneratedReportStatus>
  );
  const [loadingStatuses, setLoadingStatuses] = useState(true);
  const userId = localStorage.getItem("userId") || localStorage.getItem("user_id");
  const reportStatusQueryKey = useMemo(() => `${userId ?? "no-user"}:${location.pathname}`, [location.pathname, userId]);

  useEffect(() => {
    const fetchStatuses = async () => {
      if (!userId) { setLoadingStatuses(false); return; }
      const statuses: Record<ReportType, GeneratedReportStatus> = {} as Record<ReportType, GeneratedReportStatus>;
      try {
        await Promise.all(cardsData.map(async (card) => {
          const res = await fetch(
            `https://unrefrangible-eddy-magnanimously.ngrok-free.dev/aitools/wellness/v2/reports/individual_report/?user_id=${userId}&report_type=${card.reportType}`
          );
          const data = (await res.json()) as IndividualReportApiResponse;
          const hasReport = Boolean(data.success && data.data?.report_data);
          statuses[card.reportType] = {
            hasReport,
            ...(hasReport ? extractMetricFromReportResponse(card.reportType, data) : {}),
          };
        }));
        setReportStatuses(statuses);
      } finally { setLoadingStatuses(false); }
    };
    fetchStatuses();
  }, [reportStatusQueryKey, userId]);

  return (
    <div style={{
      height: embedded ? "auto" : "100vh",
      width: embedded ? "100%" : "100vw",
      background: embedded ? "transparent" : "#FFFFFF",
      display: "flex",
      flexDirection: "column",
      justifyContent: embedded ? "flex-start" : "center",
      alignItems: "center",
      overflow: embedded ? "visible" : "hidden",
      padding: embedded ? "0" : "20px",
      boxSizing: "border-box",
      fontFamily: "'Poppins', sans-serif"
    }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Poppins:wght@400;600;700&display=swap');`}</style>
      <style>{`
        .eros-wellness-grid {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 24px;
          width: 100%;
        }

        @media (max-width: 900px) {
          .eros-wellness-grid {
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }
        }

        @media (max-width: 520px) {
          .eros-wellness-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>

      <header style={{ textAlign: "center", marginBottom: embedded ? "18px" : "4vh" }}>
        <h1 style={{ margin: 0, fontSize: "min(34px, 5.5vh)", fontWeight: 700, color: "#0d1f2d", lineHeight: 1.2 }}>
          EROS Wellness Intelligence Reports
        </h1>
        <p style={{ margin: "1vh auto 0", fontSize: "13px", color: "#7a99b0", maxWidth: "450px" }}>
          Advanced AI-powered reports decoding your energy, soul alignment, and inner potential.
        </p>
      </header>

      <div
        className="eros-wellness-grid"
        style={{
          maxWidth: embedded ? "100%" : "880px",
          maxHeight: embedded ? "none" : "70vh",
        }}
      >
        {cardsData.map((card) => (
          <WellnessCard
            key={card.id}
            {...card}
            hasReport={Boolean(reportStatuses[card.reportType]?.hasReport)}
            loading={loadingStatuses}
            metricText={reportStatuses[card.reportType]?.metricText}
            metricUnitText={reportStatuses[card.reportType]?.metricUnitText}
            onCardClick={() => {
              const hasReport = reportStatuses[card.reportType]?.hasReport;
              if (hasReport) {
                navigate("/view-report", { state: { reportType: card.reportType, userId, title: card.title } });
                return;
              }

              navigate(card.route);
            }}
          />
        ))}
      </div>

      <style>{`
        @media (max-width: 480px) {
          h1 { font-size: 24px !important; }
        }
      `}</style>
    </div>
  );
}