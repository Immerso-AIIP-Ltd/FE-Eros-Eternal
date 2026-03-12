// src/pages/DailyReportsPage.tsx
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

// Types for the response
interface Report {
  id: number;
  report_type: string;
  timestamp: string;
  report_data: {
    report_title: string;
    timestamp?: string;
    [key: string]: any;
  };
}

// Format ISO date string
const formatDate = (iso: string): string => {
  try {
    return new Date(iso).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return "Invalid Date";
  }
};

// Format keys like "vitality_score" → "Vitality Score"
const formatKey = (key: string): string => {
  return key
    .replace(/_/g, " ")
    .replace(/\b\w/g, (l) => l.toUpperCase())
    .replace("Hz", "Hz");
};

// const API_URL = import.meta.env.VITE_API_BASE_URL;
const API_URL = "http://192.168.29.154:8002";

const DailyReportsPage: React.FC = () => {
  const navigate = useNavigate();
  const userId = localStorage.getItem("user_id");

  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchReports = async () => {
      if (!userId) {
        setError("User not logged in.");
        setLoading(false);
        return;
      }

      try {
        const response = await fetch(
          `${API_URL}/api/v1/reports/user_reports/${userId}`,
          {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
            },
          }
        );

        if (!response.ok) {
          throw new Error(`Failed to fetch reports: ${response.status}`);
        }

        const data = await response.json();
        if (data.success && Array.isArray(data.data)) {
          setReports(data.data);
        } else {
          setError("No reports found or invalid data format.");
        }
      } catch (err: any) {
        console.error("Error fetching reports:", err);
        setError(err.message || "Failed to load reports. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    fetchReports();
  }, [userId]);

  // Icons by report type
  const getIcon = (type: string) => {
    const icons: Record<string, string> = {
      vibrational_frequency: "⚡",
      longevity_blueprint: "🌿",
      flame_score: "🔥",
      kosha_map: "🧘",
      star_map: "🌌",
      aura_profile: "🌈",
      daily_report: "📊",
      healing_guide: "💚",
      food_plan: "🍎",
      mantra_guide: "🕉️",
    };
    return icons[type] || "📄";
  };

  return (
    <div
      style={{
        width: "100vw",
        minHeight: "100vh",
        margin: 0,
        padding: 0,
        backgroundColor: "#000",
        color: "#fff",
        fontFamily: "'Segoe UI', sans-serif",
        boxSizing: "border-box",
      }}
    >
      {/* Header */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          padding: "20px 20px 10px 20px",
          borderBottom: "1px solid #333",
        }}
      >
        <h1
          style={{
            fontSize: "24px",
            fontWeight: "600",
            background: "linear-gradient(90deg, #00B8F8, #0080C8)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            margin: 0,
          }}
        >
          📊 Daily Reports
        </h1>
        <button
          onClick={() => navigate(-1)}
          style={{
            backgroundColor: "#00B8F8",
            color: "#fff",
            border: "none",
            padding: "10px 16px",
            borderRadius: "8px",
            cursor: "pointer",
            fontSize: "14px",
            fontWeight: "500",
          }}
        >
          ← Back
        </button>
      </div>

      {/* Content */}
      <div style={{ padding: "20px" }}>
        {error && (
          <div
            style={{
              backgroundColor: "#ff6b6b20",
              border: "1px solid #ff6b6b",
              borderRadius: "12px",
              padding: "16px",
              textAlign: "center",
              color: "#ff6b6b",
              marginBottom: "20px",
            }}
          >
            <strong>Error:</strong> {error}
          </div>
        )}

        {loading ? (
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              height: "60vh",
              gap: "16px",
            }}
          >
            <div className="spinner-border text-info" role="status">
              <span className="visually-hidden">Loading...</span>
            </div>
            <p style={{ color: "#aaa" }}>Fetching your cosmic insights...</p>
          </div>
        ) : reports.length === 0 ? (
          <div
            style={{
              textAlign: "center",
              padding: "60px 20px",
              color: "#888",
              fontSize: "16px",
            }}
          >
            <p style={{ fontSize: "24px", marginBottom: "12px" }}>📄</p>
            <p>
              <strong>No reports available yet.</strong>
            </p>
            <small>Your AI soul engine is preparing your first insight.</small>
          </div>
        ) : (
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "24px",
            }}
          >
            {reports.map((report, index) => (
              <ReportCard
                key={report.id || index}
                report={report}
                getIcon={getIcon}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

// Individual Report Card
const ReportCard: React.FC<{
  report: Report;
  getIcon: (type: string) => string;
}> = ({ report, getIcon }) => {
  const [expandedSections, setExpandedSections] = useState<
    Record<string, boolean>
  >({});

  const toggleSection = (section: string) => {
    setExpandedSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  // const renderSection = (title: string, data: any, icon: string) => {
  //   if (!data) return null;

  //   return (
  //     <div
  //       key={title}
  //       style={{
  //         borderBottom: '1px solid #333',
  //         paddingBottom: '12px',
  //         marginBottom: '12px',
  //       }}
  //     >
  //       <button
  //         onClick={() => toggleSection(title)}
  //         style={{
  //           background: 'none',
  //           border: 'none',
  //           color: '#00B8F8',
  //           fontSize: '16px',
  //           fontWeight: '600',
  //           cursor: 'pointer',
  //           width: '100%',
  //           textAlign: 'left',
  //           display: 'flex',
  //           alignItems: 'center',
  //           gap: '8px',
  //         }}
  //       >
  //         {icon} {title} {expandedSections[title] ? '▼' : '▶'}
  //       </button>

  //       {expandedSections[title] && (
  //         <div
  //           style={{
  //             marginTop: '12px',
  //             paddingLeft: '20px',
  //             borderLeft: '2px solid #00B8F8',
  //             fontSize: '14px',
  //             color: '#ccc',
  //             lineHeight: 1.6,
  //           }}
  //         >
  //           {typeof data === 'string' ? (
  //             <p>{data}</p>
  //           ) : Array.isArray(data) ? (
  //             <ul style={{ margin: '8px 0', paddingLeft: '20px' }}>
  //               {data.map((item, i) => (
  //                 <li key={i} style={{ marginBottom: '6px' }}>
  //                   {typeof item === 'object' ? JSON.stringify(item) : String(item)}
  //                 </li>
  //               ))}
  //             </ul>
  //           ) :
  //           typeof data === 'object' ? (
  //             Object.entries(data).map(([key, value]) => (
  //               <div key={key} style={{ marginBottom: '8px' }}>
  //                 <strong>{formatKey(key)}:</strong>{' '}
  //                 {typeof value === 'string' ? (
  //                   value
  //                 ) : Array.isArray(value) ? (
  //                   <ul style={{ margin: '4px 0', paddingLeft: '16px' }}>
  //                     {value.map((v, i) => (
  //                       <li key={i}>{String(v)}</li>
  //                     ))}
  //                   </ul>
  //                 ) : typeof value === 'object' ? (
  //                   <span style={{ opacity: 0.8 }}>(Object)</span>
  //                 ) : (
  //                   String(value)
  //                 )}
  //               </div>
  //             ))
  //           )
  //           : (
  //             <p>{String(data)}</p>
  //           )}
  //         </div>
  //       )}
  //     </div>
  //   );
  // };

  const renderSection = (title: string, data: any, icon: string) => {
    if (!data) return null;

    return (
      <div
        key={title}
        style={{
          borderBottom: "1px solid #333",
          paddingBottom: "12px",
          marginBottom: "12px",
        }}
      >
        <button
          onClick={() => toggleSection(title)}
          style={{
            background: "none",
            border: "none",
            color: "#00B8F8",
            fontSize: "16px",
            fontWeight: "600",
            cursor: "pointer",
            width: "100%",
            textAlign: "left",
            display: "flex",
            alignItems: "center",
            gap: "8px",
          }}
        >
          {icon} {title} {expandedSections[title] ? "▼" : "▶"}
        </button>

        {expandedSections[title] && (
          <div
            style={{
              marginTop: "12px",
              paddingLeft: "20px",
              borderLeft: "2px solid #00B8F8",
              fontSize: "14px",
              color: "#ccc",
              lineHeight: 1.6,
            }}
          >
            {typeof data === "string" ? (
              <p>{data}</p>
            ) : Array.isArray(data) ? (
              <ul style={{ margin: "8px 0", paddingLeft: "20px" }}>
                {data.map((item, i) => (
                  <li key={i} style={{ marginBottom: "6px" }}>
                    {typeof item === "object"
                      ? JSON.stringify(item)
                      : String(item)}
                  </li>
                ))}
              </ul>
            ) : typeof data === "object" ? (
              title === "Kosha Assessment" ? (
                <ul style={{ paddingLeft: "16px" }}>
                  {Object.entries(data).map(([koshaName, koshaDetails]) => (
                    <li key={koshaName} style={{ marginBottom: "6px" }}>
                      <strong>{formatKey(koshaName)}:</strong>{" "}
                      {koshaDetails.score || "N/A"}
                    </li>
                  ))}
                </ul>
              ) : (
                Object.entries(data).map(([key, value]) => (
                  <div key={key} style={{ marginBottom: "8px" }}>
                    <strong>{formatKey(key)}:</strong>{" "}
                    {typeof value === "string" ? (
                      value
                    ) : Array.isArray(value) ? (
                      <ul style={{ margin: "4px 0", paddingLeft: "16px" }}>
                        {value.map((v, i) => (
                          <li key={i}>{String(v)}</li>
                        ))}
                      </ul>
                    ) : typeof value === "object" ? (
                      <span style={{ opacity: 0.8 }}>(Object)</span>
                    ) : (
                      String(value)
                    )}
                  </div>
                ))
              )
            ) : (
              <p>{String(data)}</p>
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <div
      style={{
        backgroundColor: "#1a1a1a",
        borderRadius: "16px",
        border: "1px solid #333",
        padding: "20px",
        boxShadow: "0 4px 12px rgba(0, 184, 248, 0.1)",
        transition: "transform 0.2s ease",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = "translateY(-2px)";
        e.currentTarget.style.boxShadow = "0 6px 16px rgba(0, 184, 248, 0.2)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = "translateY(0)";
        e.currentTarget.style.boxShadow = "0 4px 12px rgba(0, 184, 248, 0.1)";
      }}
    >
      {/* Header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "12px",
          marginBottom: "16px",
        }}
      >
        <span style={{ fontSize: "28px" }}>{getIcon(report.report_type)}</span>
        <div>
          <h3
            style={{
              margin: "0",
              fontSize: "18px",
              color: "#00B8F8",
              fontWeight: "600",
            }}
          >
            {report.report_data.report_title || "Untitled Report"}
          </h3>
          <p style={{ margin: "4px 0 0 0", fontSize: "12px", color: "#aaa" }}>
            Generated on: {formatDate(report.timestamp)}
          </p>
        </div>
      </div>

      {/* Sections */}
      <div>
        {/* General Assessments */}
        {report.report_data.current_assessment &&
          renderSection(
            "Current Assessment",
            report.report_data.current_assessment,
            "📊"
          )}
        {report.report_data.vitality_assessment &&
          renderSection(
            "Vitality Assessment",
            report.report_data.vitality_assessment,
            "🌿"
          )}
        {report.report_data.spiritual_assessment &&
          renderSection(
            "Spiritual Assessment",
            report.report_data.spiritual_assessment,
            "🔥"
          )}

        {/* Predictive & Growth */}
        {report.report_data.predictive_analysis &&
          renderSection(
            "Predictive Analysis",
            report.report_data.predictive_analysis,
            "🔮"
          )}
        {report.report_data.longevity_factors &&
          renderSection(
            "Longevity Factors",
            report.report_data.longevity_factors,
            "⏳"
          )}
        {report.report_data.growth_trajectory &&
          renderSection(
            "Growth Trajectory",
            report.report_data.growth_trajectory,
            "📈"
          )}

        {/* Kosha & Astrology */}
        {report.report_data.kosha_assessment &&
          renderSection(
            "Kosha Assessment",
            report.report_data.kosha_assessment,
            "🧘"
          )}
        {report.report_data.astrological_insights &&
          renderSection(
            "Astrological Insights",
            report.report_data.astrological_insights,
            "🌌"
          )}

        {/* Other Common Sections */}
        {report.report_data.detailed_analysis &&
          renderSection(
            "Detailed Analysis",
            report.report_data.detailed_analysis,
            "📝"
          )}
        {report.report_data.recommendations &&
          renderSection(
            "Recommendations",
            report.report_data.recommendations,
            "✅"
          )}
        {report.report_data.food_recommendations &&
          renderSection(
            "Food Recommendations",
            report.report_data.food_recommendations,
            "🍎"
          )}
        {report.report_data.mantra_suggestions &&
          renderSection(
            "Mantra Suggestions",
            report.report_data.mantra_suggestions,
            "🕉️"
          )}
        {report.report_data.healing_energy &&
          renderSection(
            "Healing Energy",
            report.report_data.healing_energy,
            "💚"
          )}

        {/* Fallback: Show raw if nothing else */}
        {Object.keys(report.report_data).length > 2 &&
          !report.report_data.report_title &&
          !report.report_data.current_assessment &&
          !report.report_data.vitality_assessment && (
            <div style={{ color: "#888", fontSize: "14px" }}>
              <p>This report contains raw data. Expand to view.</p>
              {renderSection("Raw Data", report.report_data, "🧪")}
            </div>
          )}
      </div>
    </div>
  );
};

export default DailyReportsPage;
