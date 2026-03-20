import { useMemo, useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { baseApiUrl } from "@/config/api";
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
  const displayButtonText = loading ? "..." : hasReport ? "View Report" : "Get Started";
  const shouldShowMetric = Boolean(hasReport && metricText && !loading);

  return (
    <div
      onClick={onCardClick}
      style={{
        borderRadius: "24px",
        padding: "24px",
        display: "flex",
        flexDirection: "column",
        gap: "12px",
        cursor: "pointer",
        background: "linear-gradient(145deg, #ffffff 0%, #f0f9ff 50%, #e6f4fd 100%)",
        boxShadow: "0 4px 24px rgba(0,0,0,0.06), 0 1px 3px rgba(0,0,0,0.04)",
        border: "1px solid rgba(157,202,230,0.35)",
        height: "100%",
        minHeight: "240px",
        transition: "all 0.2s ease",
        fontFamily: "'Poppins', sans-serif",
        position: "relative",
      }}
    >
      <div style={{ width: 40, height: 40, borderRadius: "12px", background: "#9DCAE6", display: "flex", alignItems: "center", justifyContent: "center", padding: "8px", flexShrink: 0 }}>
        <img src={icon} alt={title} style={{ width: "100%", height: "100%", objectFit: "contain" }} />
      </div>
      <h3 style={{ margin: 0, fontSize: "15px", fontWeight: 700, color: "#0d1f2d", lineHeight: 1.3 }}>{title}</h3>
      <div style={{ flex: 1, minHeight: "52px" }}>
        {shouldShowMetric ? (
          <div style={{ display: "flex", alignItems: "baseline", gap: "8px", flexWrap: "wrap" }}>
            <span style={{ fontSize: "36px", fontWeight: 800, color: "#0d1f2d", letterSpacing: "-0.5px", lineHeight: 1.1 }}>
              {metricText}
            </span>
            {metricUnitText ? (
              <span style={{ fontSize: "14px", fontWeight: 600, color: "#6b8aa0", marginBottom: "2px" }}>
                {metricUnitText}
              </span>
            ) : null}
          </div>
        ) : hasReport && !loading ? (
          <p style={{ margin: 0, fontSize: "13px", color: "#0d1f2d", fontWeight: 600, lineHeight: 1.5 }}>Report ready</p>
        ) : (
          <p style={{ margin: 0, fontSize: "13px", color: "#6b8aa0", lineHeight: 1.5 }}>{description}</p>
        )}
      </div>
      <div style={{ marginTop: "auto", paddingTop: "4px" }}>
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); onCardClick(); }}
          style={{ 
            display: "inline-flex", alignItems: "center", gap: "6px", background: "#9dcae6", 
            border: "none", borderRadius: "100px", padding: "8px 18px", color: "#fff", 
            fontSize: "13px", fontWeight: 600, cursor: "pointer",
            boxShadow: "0 2px 12px rgba(157,202,230,0.35)"
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
            `${baseApiUrl}/aitools/wellness/v2/reports/individual_report/?user_id=${userId}&report_type=${card.reportType}`
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