import React, { useState, useEffect, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import "bootstrap/dist/css/bootstrap.min.css";
import { Gauge } from "@mui/x-charts/Gauge";
import { Box, Typography } from "@mui/material";
import fire from "@/assets/fire.png";
import { ArrowLeft } from "lucide-react";
import { eternalUserIdHeaders, wellnessApiUrl } from "@/config/api";
import { hasWellnessIndividualReport } from "@/lib/wellnessReportPayload";
import { getWellnessStoredUserId } from "@/lib/wellnessUserId";
interface ReportData {
  timestamp?: string;
  report_type: string;
  report_data: {
    report_title: string;
    timestamp?: string;
    assessment: {
      vibrational_frequency?: number;
      current_status?: string;
      key_metrics?: string;
      strengths?: string[];
      areas_for_improvement?: string[];
      current_flame_score?: number;
      // calculated_vibrational_frequency?: number;
      current_energy_assessment: {
        vibrational_frequency?: number;
      };
      current_vibrational_frequency: number;
      current_energy_state?: string;
      spiritual_evolution: {
        current_flame_score?: string;
      };
      current_energy_score?: string;
      flame_score?: string;
      aura_intensity?: string;
      kosha_alignment?: string;
      star_magnitude?: string;
      longevity_score?: string;
      vitality_score?: number;
      calculated_vibrational_frequency?: number;
    };
    flame_vitality_assessment: {
      current_score?: number;
    }
    detailed_analysis?: string | unknown;
    recommendations?: {
      practices?: unknown[];
      guidance?: unknown[];
      considerations?: unknown[];
    };
  };
}

/** API sometimes returns strings; star_map / others may use { practice, explanation } objects. */
function renderRecommendationItem(item: unknown): React.ReactNode {
  if (item == null) return null;
  if (typeof item === "string" || typeof item === "number") {
    return String(item);
  }
  if (typeof item === "object") {
    const o = item as Record<string, unknown>;
    const practice = o.practice;
    const explanation = o.explanation;
    if (typeof practice === "string") {
      return (
        <>
          <strong>{practice}</strong>
          {typeof explanation === "string" && explanation.trim()
            ? `: ${explanation}`
            : null}
        </>
      );
    }
    const text =
      (typeof o.text === "string" && o.text) ||
      (typeof o.title === "string" && typeof o.description === "string"
        ? `${o.title}: ${o.description}`
        : null) ||
      (typeof o.guidance === "string" && o.guidance) ||
      (typeof o.point === "string" && o.point);
    if (text) return text;
    try {
      return JSON.stringify(item);
    } catch {
      return "[Invalid item]";
    }
  }
  return String(item);
}

/** Literal `\\n` in API strings → real newlines. */
function normalizeReportNewlines(raw: string): string {
  return raw.replace(/\\n/g, "\n").replace(/\r\n/g, "\n");
}

function detailedAnalysisToParagraphs(detail: unknown): string[] {
  if (detail == null) return [];
  if (typeof detail === "string") {
    return normalizeReportNewlines(detail)
      .split("\n")
      .map((p) => p.trim())
      .filter((p) => p.length > 0);
  }
  if (Array.isArray(detail)) {
    return detail
      .map((chunk) =>
        typeof chunk === "string"
          ? chunk.trim()
          : typeof chunk === "object" && chunk !== null && "text" in chunk
            ? String((chunk as { text: unknown }).text).trim()
            : JSON.stringify(chunk),
      )
      .filter((p) => p.length > 0);
  }
  if (typeof detail === "object") {
    try {
      return [JSON.stringify(detail, null, 2)];
    } catch {
      return [];
    }
  }
  return [String(detail)];
}

function hasDetailedAnalysisContent(detail: unknown): boolean {
  if (detail == null) return false;
  if (typeof detail === "string")
    return normalizeReportNewlines(detail).trim().length > 0;
  return detailedAnalysisToParagraphs(detail).length > 0;
}

/** Split before the next section: `A. ...:` or ALL-CAPS `WORD WORD:`. */
function splitDetailedAnalysisSections(norm: string): string[] {
  return norm
    .split(/\n(?=[A-Z](?:\.\s+[^:]+:\s*|[A-Z0-9\s,&\-]+:))/g)
    .map((s) => s.trim())
    .filter(Boolean);
}

function isAllCapsHeaderLine(s: string): boolean {
  const t = s.replace(/\s+/g, " ").trim();
  if (!/^[A-Z0-9][A-Z0-9\s,&\-]+$/.test(t)) return false;
  return t === t.toUpperCase();
}

/** View Report: section labels bold + uppercase; body respects `\n` / `\n\n` via pre-wrap. */
function ViewReportDetailedAnalysisFormatted({ text }: { text: string }) {
  const norm = normalizeReportNewlines(text).trim();
  const segments = splitDetailedAnalysisSections(norm);
  const bodyStyle: React.CSSProperties = {
    color: "#4B5563",
    fontSize: "14px",
    lineHeight: 1.6,
    whiteSpace: "pre-wrap",
    fontWeight: 400,
  };
  const labelStyle: React.CSSProperties = {
    fontWeight: 700,
    fontSize: "14px",
    color: "#111827",
    marginBottom: "0.5rem",
    display: "block",
  };

  return (
    <>
      {segments.map((seg, i) => {
        const star = seg.match(/^([A-Z]\.\s+[^:]+:\s*)([\s\S]*)$/);
        if (star) {
          return (
            <div key={i} className="mb-3">
              <strong className="fw-bold" style={labelStyle}>
                {star[1].trim().toUpperCase()}
              </strong>
              <div style={bodyStyle}>{star[2].trim()}</div>
            </div>
          );
        }
        const caps = seg.match(/^([A-Z][A-Z0-9\s,&\-]+):\s*([\s\S]*)$/);
        if (caps && isAllCapsHeaderLine(caps[1])) {
          return (
            <div key={i} className="mb-3">
              <strong className="fw-bold" style={labelStyle}>
                {`${caps[1].trim().toUpperCase()}:`}
              </strong>
              <div style={bodyStyle}>{caps[2].trim()}</div>
            </div>
          );
        }
        return (
          <div key={i} className="mb-3" style={bodyStyle}>
            {seg.trim()}
          </div>
        );
      })}
    </>
  );
}

const reportCards = [
  {
    id: 1,
    title: "Vibrational Frequency",
    route: "/vibrational-frequency",
    reportType: "vibrational_frequency",
  },
  {
    id: 2,
    label: "Birth Chart",
    route: "/star-map",
    reportType: "star_map",
  },
  {
    id: 3,
    title: "Flame Score",
    route: "/flame-score",
    reportType: "flame_score",
  },
  {
    id: 4,
    title: "Aura Profile",
    route: "/aura-profile",
    reportType: "aura_profile",
  },
  {
    id: 5,
    title: "Kosha Map",
    route: "/kosha-map",
    reportType: "kosha_map",
  },
  {
    id: 6,
    title: "Longevity Blueprint",
    route: "/longevity-blueprint",
    reportType: "longevity_blueprint",
  },
];

const ViewReport = () => {
  const [expandedFaq, setExpandedFaq] = useState<number[]>([0]);
  const [reportData, setReportData] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();
  const location = useLocation();
  const recommendationsRef = useRef(null);

  const reportsApiUrl = wellnessApiUrl("/reports/individual_report");

  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    const navState = location.state as
      | {
          reportType?: string;
          userId?: string;
          title?: string;
          scrollToRecommendations?: boolean;
        }
      | undefined;

    const userId =
      navState?.userId ??
      searchParams.get("user_id") ??
      getWellnessStoredUserId();
    const reportType =
      navState?.reportType ?? searchParams.get("report_type") ?? "";

    const fetchReportData = async () => {
      if (!reportType || !userId) {
        setError("Missing report information");
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);
        const response = await fetch(
          `${reportsApiUrl}?report_type=${encodeURIComponent(reportType)}`,
          { headers: eternalUserIdHeaders(userId) },
        );

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();

        if (hasWellnessIndividualReport(data)) {
          setReportData(data.data);

          if (navState?.scrollToRecommendations) {
            setTimeout(() => {
              recommendationsRef.current?.scrollIntoView({
                behavior: "smooth",
              });
            }, 500);
          }
        } else {
          throw new Error(data.message || "No report data found");
        }
      } catch (error: unknown) {
        console.error("Error fetching report data:", error);
        const message =
          error instanceof Error ? error.message : "Failed to load report";
        setError(message);
      } finally {
        setLoading(false);
      }
    };

    fetchReportData();
  }, [location.key, location.pathname, location.search]);

  const toggleFaq = (index: number) => {
    setExpandedFaq(prev =>
      prev.includes(index)
        ? prev.filter(i => i !== index)
        : [...prev, index]
    );
  };

  const getDisplayTitle = () => {
    if (location.state?.title) return location.state.title;
    if (reportData?.report_data?.report_title)
      return reportData.report_data.report_title;

    const reportType = location.state?.reportType || reportData?.report_type || "";
    return reportType
      .split("_")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  };

  const getFrequencyValue = () => {
    const assessment = reportData?.report_data?.assessment;
    const flameVitality = reportData?.report_data?.flame_vitality_assessment;

    if (!assessment && !flameVitality) return "N/A";

    return (
      assessment?.calculated_vibrational_frequency ||
      assessment?.current_energy_assessment?.vibrational_frequency ||
      assessment?.vibrational_frequency ||
      assessment?.current_energy_score ||
      assessment?.current_vibrational_frequency ||
      assessment?.spiritual_evolution?.current_flame_score ||
      assessment?.current_flame_score ||
      assessment?.flame_score ||
      assessment?.aura_intensity ||
      assessment?.kosha_alignment ||
      assessment?.star_magnitude ||
      assessment?.vitality_score ||
      assessment?.longevity_score ||
      flameVitality?.current_score ||
      "N/A"
    );
  };

  const getLevel = () => {
    const assessment = reportData?.report_data?.assessment;
    if (!assessment) return "High";

    const statusText = [
      assessment.current_energy_state,
      (assessment as { current_status?: string }).current_status,
    ]
      .filter(Boolean)
      .join(" ");
    if (statusText) {
      const s = statusText.toLowerCase();
      if (s.includes("high") || s.includes("strong") || s.includes("excellent"))
        return "High";
      if (s.includes("low") || s.includes("heavy burden")) return "Low";
      if (
        s.includes("medium") ||
        s.includes("balanced") ||
        s.includes("moderate") ||
        s.includes("slightly")
      )
        return "Medium";
    }

    const energyState = assessment.current_energy_state || "";
    if (energyState.toLowerCase().includes("high")) return "High";
    if (energyState.toLowerCase().includes("low")) return "Low";
    if (energyState.toLowerCase().includes("medium")) return "Medium";

    const frequency = getFrequencyValue();
    if (typeof frequency === "number" && !Number.isNaN(frequency)) {
      if (frequency > 70) return "High";
      if (frequency > 40) return "Medium";
      return "Low";
    }
    return "Medium";
  };

  const getGaugeValue = () => {
    const frequency = getFrequencyValue();
    return Math.max(0, Math.min(100, frequency));
  };

  const getReportItems = () => {
    const paragraphs = detailedAnalysisToParagraphs(
      reportData?.report_data?.detailed_analysis,
    );
    if (paragraphs.length === 0) return [];
    const joined = paragraphs.join(" ");
    return joined
      .split(/[.!?]+/)
      .map((sentence) => sentence.trim())
      .filter((sentence) => sentence.length > 20)
      .slice(0, 6);
  };

  const getRecommendations = () => {
    const recommendations = reportData?.report_data?.recommendations;
    if (!recommendations) return [];

    const sections = [];

    if (recommendations.practices && recommendations.practices.length > 0) {
      sections.push({
        title: "Practices",
        items: recommendations.practices,
      });
    }

    if (recommendations.guidance && recommendations.guidance.length > 0) {
      sections.push({
        title: "Guidance",
        items: recommendations.guidance,
      });
    }

    if (recommendations.considerations && recommendations.considerations.length > 0) {
      sections.push({
        title: "Considerations",
        items: recommendations.considerations,
      });
    }

    return sections;
  };

  if (loading) {
    return (
      <div
        className="d-flex justify-content-center align-items-center min-vh-100"
        style={{
          backgroundImage: "linear-gradient(to bottom, #E0F2FE 0%, #F0F9FF 20%, #FFFFFF 40%)"
        }}
      >
        <div className="spinner-border" style={{ color: "#06B6D4" }} role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  if (error || !reportData) {
    return (
      <div
        className="d-flex justify-content-center align-items-center min-vh-100"
        style={{
          backgroundImage: "linear-gradient(to bottom, #E0F2FE 0%, #F0F9FF 20%, #FFFFFF 40%)"
        }}
      >
        <div className="text-center">
          <h3 className="text-gray-800">{error || "No Report Data Found"}</h3>
          <button
            className="btn mt-3 px-4 py-2"
            style={{
              background: "#06B6D4",
              border: "none",
              borderRadius: "25px",
              color: "white",
            }}
            onClick={() => navigate("/result")}
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  const displayTitle = getDisplayTitle();
  const frequency = getFrequencyValue();
  const level = getLevel();
  const gaugeValue = getGaugeValue();
  const reportItems = getReportItems();
  const detailedAnalysisRaw = reportData?.report_data?.detailed_analysis;
  const showDetailedAnalysis = hasDetailedAnalysisContent(detailedAnalysisRaw);
  const recommendationSections = getRecommendations();

  const reportGenerationRoute = reportCards.find(
    (c) => c.reportType === reportData?.report_type,
  )?.route;

  return (
    <div
      className="d-flex flex-column min-vh-100 min-vw-100"
      style={{
        backgroundImage: "linear-gradient(to bottom, #E0F2FE 0%, #F0F9FF 20%, #FFFFFF 40%)",
        alignItems: "start",
        justifyContent: "start",
      }}
    >
      {/* Header */}
      <div className="container-fluid px-4 py-3">
        <div className="row align-items-center">
          <div className="col-auto">
            <button
              className="btn p-0 me-3"
              style={{ background: "none", border: "none", color: "#1F2937" }}
              onClick={() => navigate("/result")}
            >
              <ArrowLeft />
            </button>
            <span
              onClick={() => navigate("/result")}
              style={{
                fontSize: "16px",
                fontWeight: "500",
                cursor: "pointer",
                color: "#1F2937",
              }}
            >
              {displayTitle} Report
            </span>
          </div>
          <div className="col-auto ms-auto">
            <button
              className="btn p-0"
              style={{ background: "none", border: "none", color: "#6B7280" }}
              onClick={() => window.location.reload()}
            >
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
                <path d="M3 3v5h5" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container-fluid px-4">
        <div className="row justify-content-center">
          <div className="col-12 col-md-10 col-lg-8 col-xl-6">
            {/* Gauge Card */}
            {/* Gauge Card */}
            {(reportData?.report_type === "vibrational_frequency" ||
              reportData?.report_type === "flame_score" ||
              reportData?.report_type === "longevity_blueprint" ||
              reportData?.report_data?.assessment?.vibrational_frequency != null ||
              reportData?.report_data?.assessment?.calculated_vibrational_frequency != null ||
              reportData?.report_data?.flame_vitality_assessment?.current_score != null) && (
                <div
                  className="card mb-4"
                  style={{
                    background: "white",
                    border: "none",
                    borderRadius: "20px",
                    boxShadow: "0 4px 12px rgba(0, 0, 0, 0.08)",
                  }}
                >
                  <div className="card-body p-4 text-center">
                    <Box display="flex" flexDirection="column" alignItems="center" gap={2}>
                      <Box position="relative" display="inline-flex">
                        <Gauge
                          width={400}
                          height={200}
                          value={gaugeValue}
                          startAngle={-110}
                          endAngle={110}
                          cornerRadius="50%"
                          sx={{
                            "& .MuiGauge-valueText": { display: "none" },
                            "& .MuiGauge-valueArc": { fill: "#06B6D4" },
                            "& .MuiGauge-referenceArc": { fill: "#E5E7EB" },
                          }}
                        />
                        <Box
                          position="absolute"
                          top={26}
                          left={0}
                          width="100%"
                          height="100%"
                          display="flex"
                          flexDirection="column"
                          alignItems="center"
                          justifyContent="center"
                        >
                          <Box mb={1}>
                            <img
                              src={fire}
                              alt="Icon"
                              style={{
                                width: "40px",
                                height: "40px",
                                objectFit: "contain"
                              }}
                            />
                          </Box>
                          <Typography variant="h4" fontWeight="bold" mb={1} color="#1F2937">
                            {frequency}
                            <span style={{ fontSize: "0.6em" }}>
                              {reportData?.report_type === "vibrational_frequency" ||
                              String(location.state?.reportType ?? "").includes("frequency")
                                ? "Hz"
                                : reportData?.report_type === "longevity_blueprint"
                                  ? "%"
                                  : ""}
                            </span>
                          </Typography>
                          <Typography variant="body2" color="#6B7280">
                            {displayTitle}
                          </Typography>
                        </Box>
                      </Box>
                    </Box>
                    <div className="text-start mt-3">
                      <h6 className="mb-1" style={{ color: "#1F2937", fontWeight: "600" }}>
                        {displayTitle}
                      </h6>
                      <small style={{ color: "#06B6D4", fontSize: "12px" }}>
                        Report •{" "}
                        {new Date(
                          reportData.timestamp ??
                            reportData.report_data?.timestamp ??
                            Date.now(),
                        ).toLocaleDateString()}
                      </small>
                    </div>
                  </div>
                </div>
              )}

            {/* Report Section — string `detailed_analysis`: section labels bold+uppercase; `\n` / `\n\n` preserved */}
            {showDetailedAnalysis && (
              <div className="mb-4">
                <h4 className="mb-3" style={{ fontWeight: "700", color: "black" }}>
                  Report
                </h4>
                <div className="card-body p-0">
                  {typeof detailedAnalysisRaw === "string" ? (
                    <ViewReportDetailedAnalysisFormatted text={detailedAnalysisRaw} />
                  ) : (
                    <ul
                      className="mb-0"
                      style={{ paddingLeft: "20px", listStyleType: "disc" }}
                    >
                      {detailedAnalysisToParagraphs(detailedAnalysisRaw).map(
                        (paragraph, index) => (
                          <li
                            key={index}
                            className="mb-3"
                            style={{
                              color: "#4B5563",
                              fontSize: "14px",
                              lineHeight: "1.6",
                            }}
                          >
                            {paragraph}
                          </li>
                        ),
                      )}
                    </ul>
                  )}
                </div>
              </div>
            )}

            {/* Recommendations Section */}
            {recommendationSections.length > 0 && (
              <div className="mb-4" ref={recommendationsRef}>
                <h4 className="mb-3" style={{ fontWeight: "700", color: "black" }}>
                  Recommendations
                </h4>

                <div
                  style={{
                    background: "#E0F2FE",
                    borderRadius: "12px",
                    overflow: "hidden",
                  }}
                >
                  {recommendationSections.map((section, sectionIndex) => {
                    const isExpanded = expandedFaq.includes(sectionIndex);

                    return (
                      <div key={sectionIndex}>
                        <button
                          className="btn w-100 text-start p-3 d-flex justify-content-between align-items-center"
                          style={{
                            background: "transparent",
                            border: "none",
                            borderBottom:
                              !isExpanded && sectionIndex < recommendationSections.length - 1
                                ? "1px solid #dfdedeff"
                                : "none",
                            borderRadius: "0",
                            color: "#1F2937",
                            fontSize: "14px",
                            fontWeight: "500",
                          }}
                          onClick={() => toggleFaq(sectionIndex)}
                        >
                          <span>{section.title}</span>
                          <svg
                            width="16"
                            height="16"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            style={{
                              transform: isExpanded
                                ? "rotate(180deg)"
                                : "rotate(0deg)",
                              transition: "transform 0.2s ease",
                            }}
                          >
                            <polyline points="6,9 12,15 18,9"></polyline>
                          </svg>
                        </button>

                        {isExpanded && (
                          <div
                            className="p-3"
                            style={{
                              background: "transparent",
                              borderBottom:
                                sectionIndex < recommendationSections.length - 1
                                  ? "1px solid #dfdedeff"
                                  : "none",
                            }}
                          >
                            <ul
                              className="mb-0"
                              style={{
                                paddingLeft: "20px",
                                listStyleType: "disc",
                              }}
                            >
                              {section.items.map((item, itemIndex) => (
                                <li
                                  key={itemIndex}
                                  style={{
                                    color: "#1F2937",
                                    fontSize: "13px",
                                    lineHeight: "1.6",
                                    marginBottom: itemIndex < section.items.length - 1 ? "8px" : "0",
                                  }}
                                >
                                  {renderRecommendationItem(item)}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Bottom Section */}
            <div className="text-center mb-4 mt-5">
              <p
                style={{
                  color: "#6B7280",
                  fontSize: "13px",
                  lineHeight: "1.5",
                  maxWidth: "400px",
                  margin: "0 auto 16px",
                }}
              >
                Discover More insights into your {displayTitle.toLowerCase()} and connect to get more
                deeper insights
              </p>

              <button
                type="button"
                className="btn px-5 py-2"
                style={{
                  background: "#00B8F8",
                  border: "none",
                  borderRadius: "25px",
                  color: "white",
                  fontSize: "14px",
                  fontWeight: "500",
                  minWidth: "180px",
                  boxShadow: "0 2px 8px rgba(6, 182, 212, 0.3)",
                }}
                onClick={() => {
                  if (reportGenerationRoute) {
                    navigate(reportGenerationRoute, {
                      state: { regenerateFromViewReport: true },
                    });
                  } else {
                    navigate("/result");
                  }
                }}
              >
                Continue to Chat
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ViewReport;