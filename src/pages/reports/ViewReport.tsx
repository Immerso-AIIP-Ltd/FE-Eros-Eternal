import React, { useState, useEffect, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import "bootstrap/dist/css/bootstrap.min.css";
import { Gauge } from "@mui/x-charts/Gauge";
import { Box, Typography } from "@mui/material";
import fire from "@/assets/fire.png";
import { ArrowLeft } from "lucide-react";
import { baseApiUrl } from "@/config/api";

interface ReportData {
  timestamp: string;
  report_type: string;
  report_data: {
    report_title: string;
    assessment: {
      vibrational_frequency?: number;
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
      calculated_vibrational_frequency?: number;
    };
    flame_vitality_assessment: {
      current_score?: number;
    }
    detailed_analysis?: string;
    recommendations?: {
      practices?: string[];
      guidance?: string[];
      considerations?: string[];
    };
  };
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
  const [error, setError] = useState(null);
  const navigate = useNavigate();
  const location = useLocation();
  const recommendationsRef = useRef(null);

  const reportsApiUrl = `${baseApiUrl}/aitools/wellness/v2/reports/individual_report/`;

  useEffect(() => {
    const fetchReportData = async () => {
      if (!location.state?.reportType || !location.state?.userId) {
        setError("Missing report information");
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const response = await fetch(
          `${reportsApiUrl}?user_id=${location.state.userId}&report_type=${location.state.reportType}`
        );

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();

        if (data.success && data.data && data.data.report_data) {
          setReportData(data.data);

          if (location.state.scrollToRecommendations) {
            setTimeout(() => {
              recommendationsRef.current?.scrollIntoView({
                behavior: "smooth",
              });
            }, 500);
          }
        } else {
          throw new Error(data.message || "No report data found");
        }
      } catch (error) {
        console.error("Error fetching report data:", error);
        setError(error.message || "Failed to load report");
      } finally {
        setLoading(false);
      }
    };

    fetchReportData();
  }, [location.state]);

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
      assessment?.longevity_score ||
      flameVitality?.current_score ||
      "N/A"
    );
  };

  const getLevel = () => {
    const assessment = reportData?.report_data?.assessment;
    if (!assessment) return "High";

    const energyState = assessment.current_energy_state || "";
    if (energyState.toLowerCase().includes("high")) return "High";
    if (energyState.toLowerCase().includes("low")) return "Low";
    if (energyState.toLowerCase().includes("medium")) return "Medium";

    const frequency = getFrequencyValue();
    if (frequency > 70) return "High";
    if (frequency > 40) return "Medium";
    return "Low";
  };

  const getGaugeValue = () => {
    const frequency = getFrequencyValue();
    return Math.max(0, Math.min(100, frequency));
  };

  const getReportContent = () => {
    const detailedAnalysis = reportData?.report_data?.detailed_analysis;
    if (!detailedAnalysis) return [];

    // Split by newlines to get paragraphs
    return detailedAnalysis
      .split('\n')
      .map(paragraph => paragraph.trim())
      .filter(paragraph => paragraph.length > 0);
  };

  const getReportItems = () => {
    const detailedAnalysis = reportData?.report_data?.detailed_analysis;
    if (!detailedAnalysis) return [];

    return detailedAnalysis
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
  const reportContent = getReportContent();
  const reportItems = getReportItems();
  const recommendationSections = getRecommendations();

  const reportTimestamp = new Date(reportData?.timestamp || "");
  const currentTimestamp = new Date();
  const reportDateStr = reportTimestamp.toISOString().split("T")[0];
  const currentDateStr = currentTimestamp.toISOString().split("T")[0];

  const isReportTypeMatch = reportCards.some(
    (card) => card.reportType === reportData?.report_type
  );

  const shouldShowContinueChat = isReportTypeMatch && reportDateStr !== currentDateStr;

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
                              {location.state?.reportType?.includes("frequency") ? "Hz" : ""}
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
                        Report • {new Date(reportData.timestamp).toLocaleDateString()}
                      </small>
                    </div>
                  </div>
                </div>
              )}

            {/* Report Section */}
            {/* Report Section */}
            {reportContent.length > 0 && (
              <div className="mb-4">
                <h4 className="mb-3" style={{ fontWeight: "700", color: "black" }}>
                  Report
                </h4>
                <div className="card-body p-0">
                  <ul className="mb-0" style={{ paddingLeft: "20px", listStyleType: "disc" }}>
                    {reportContent.map((paragraph, index) => (
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
                    ))}
                  </ul>
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
                                  {item}
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

              {/* <button
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
                  navigate('/ai-chat');
                }}
              >
                Continue to Chat
              </button> */}
              <button
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
                  navigate("/ai-chat", {
                    state: {
                      userId: location.state?.userId,
                      reportType: reportData?.report_type,
                      fromContinueChat: true,
                    },
                  });
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