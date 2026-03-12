// src/components/KoshaPieChart.tsx
import React, { useState, useEffect } from "react";
import { PieChart } from "@mui/x-charts/PieChart";
 
// Define Kosha types
interface KoshaScore {
  score: string; // e.g., "70/100"
  [key: string]: any;
}
 
interface KoshaAssessment {
  annamaya: KoshaScore;
  pranamaya: KoshaScore;
  manomaya: KoshaScore;
  vijnanamaya: KoshaScore;
  anandamaya: KoshaScore;
}
 
interface InterKoshaDynamics {
  strongest_kosha: string;
  weakest_kosha: string;
  interactions: string;
  balance_score: string;
}
 
interface ReportData {
  report_title: string;
  timestamp: string;
  kosha_assessment: KoshaAssessment;
  inter_kosha_dynamics: InterKoshaDynamics;
  detailed_analysis: string;
  recommendations: {
    [key: string]: string[];
  };
}
 
interface ApiResponse {
  success: boolean;
  message: string;
  data: {
    id: number;
    user_id: number;
    report_type: string;
    timestamp: string;
    report_data: ReportData;
  };
}
 
// Format label: "annamaya" → "Annamaya"
const formatLabel = (key: string): string =>
  key
    .replace(/([A-Z])/g, " $1")
    .replace(/^./, (str) => str.toUpperCase());
 
const KoshaPieChart: React.FC = () => {
  const [values, setValues] = useState<
    { id: number; value: number; label: string; color: string }[]
  >([]);
  const [avgScore, setAvgScore] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
 
  // Get user ID from localStorage or use fallback
  const userId = localStorage.getItem("user_id") || "990199";
 
  useEffect(() => {
    const fetchKoshaMap = async () => {
      if (!userId) {
        setError("User not logged in.");
        setLoading(false);
        return;
      }
 
      setLoading(true);
      setError(null);
 
      try {
        const response = await fetch(
          `http://192.168.29.154:8002/api/v1/reports/individual_report/?report_type=kosha_map&user_id=${userId}`,
          {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
            },
          }
        );
 
        if (!response.ok) {
          throw new Error(`Failed to fetch: ${response.status} ${response.statusText}`);
        }
 
        const data: ApiResponse = await response.json();
 
        if (data.success && data.data?.report_data?.kosha_assessment) {
          const assessment = data.data.report_data.kosha_assessment;
 
          // Define colors for each kosha
          const colors = ["#2196F3", "#FFC107", "#E91E63", "#4CAF50", "#9C27B0"];
 
          // Function to parse score from "70/100" format
          const parseScore = (scoreStr: string): number => {
            const match = scoreStr.match(/(\d+)\/100/);
            return match ? parseInt(match[1], 10) : 0;
          };
 
          // Create chart data from assessment
          const newValues = (Object.keys(assessment) as Array<keyof KoshaAssessment>).map(
            (kosha, i) => ({
              id: i,
              value: parseScore(assessment[kosha].score),
              label: formatLabel(kosha),
              color: colors[i % colors.length], // Ensure we don't go out of bounds
            })
          );
 
          setValues(newValues);
 
          // Calculate average score
          const total = newValues.reduce((acc, v) => acc + v.value, 0);
          const average = newValues.length > 0 ? Math.round(total / newValues.length) : 0;
          setAvgScore(average);
        } else {
          setError("No kosha data available in response.");
        }
      } catch (err: any) {
        console.error("Kosha Map Error:", err);
        setError(err.message || "Failed to load Kosha Map. Please check your connection.");
      } finally {
        setLoading(false);
      }
    };
 
    fetchKoshaMap();
  }, [userId]);
 
  // Loading state
  if (loading) {
    return (
      <div style={{
        textAlign: "center",
        color: "#aaa",
        padding: "40px",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center"
      }}>
        <div
          style={{
            width: "3rem",
            height: "3rem",
            border: "4px solid #f3f3f3",
            borderTop: "4px solid #3498db",
            borderRadius: "50%",
            animation: "spin 2s linear infinite",
            marginBottom: "20px"
          }}
        />
        <p style={{ margin: 0, fontSize: "14px" }}>Loading Kosha Map...</p>
        <style>{`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }
 
  // Error state
  if (error) {
    return (
      <div style={{
        textAlign: "center",
        color: "#ff6b6b",
        padding: "20px",
        fontSize: "14px",
        backgroundColor: "#ffe6e6",
        borderRadius: "8px",
        border: "1px solid #ffcccc"
      }}>
        <p style={{ margin: 0 }}>⚠️ {error}</p>
      </div>
    );
  }
 
  // No data state
  if (values.length === 0) {
    return (
      <div style={{
        textAlign: "center",
        color: "#666",
        padding: "20px",
        fontSize: "14px"
      }}>
        <p>No kosha data available</p>
      </div>
    );
  }
 
  // Main render
  return (
    <div
      style={{
        position: "relative",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: "30px",
        padding: "20px",
        maxWidth: "600px",
        margin: "0 auto",
        flexDirection: "row"
      }}
    >
      {/* Pie Chart Container - Left Side */}
      <div style={{
        position: "relative",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        order: 1
      }}>
        <PieChart
          series={[
            {
              data: values,
              innerRadius: 60,
              outerRadius: 100,
              paddingAngle: 2,
              cornerRadius: 5,
              startAngle: -90,
              endAngle: 180,
              arcLabel: (item) => `${item.value}`,
              arcLabelStyle: {
                fill: "white",
                fontSize: 12,
                fontWeight: "bold",
              },
            },
          ]}
          width={220}
          height={220}
          slotProps={{ legend: { hidden: true } }}
        />
 
        {/* Center Text - Average Score */}
        <div
          style={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            textAlign: "center",
            color: "white",
            fontWeight: "bold",
            pointerEvents: "none",
            zIndex: 10
          }}
        >
          <div style={{
            fontSize: "0.9rem",
            opacity: 0.9,
            marginBottom: "4px",
            fontWeight: "normal",
            color: "white"
          }}>
            Average
          </div>
          <div style={{
            fontSize: "2rem",
            lineHeight: "1",
            color: "white"
          }}>
            {avgScore}
          </div>
        </div>
      </div>
 
      {/* Legend/Content - Right Side */}
      <div style={{
        flex: 1,
        minWidth: 0,
        paddingLeft: "8px"
      }}>
        <div style={{
          fontSize: "14px",
          fontWeight: "bold",
          marginBottom: "12px",
          color: "white"
        }}>
          Kosha Scores
        </div>
        {values.map((item) => (
          <div
            key={item.id}
            style={{
              display: "flex",
              alignItems: "center",
              marginBottom: "8px",
              fontSize: "12px",
              padding: "2px 0"
            }}
          >
            <div
              style={{
                width: "12px",
                height: "12px",
                backgroundColor: item.color,
                borderRadius: "2px",
                marginRight: "8px",
                flexShrink: 0,
                boxShadow: "0 1px 3px rgba(0,0,0,0.3)"
              }}
            />
            <span style={{
              flex: 1,
              color: "white",
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis"
            }}>
              {item.label}
            </span>
            <span style={{
              fontWeight: "bold",
              color: item.color,
              marginLeft: "8px",
              fontSize: "13px"
            }}>
              {item.value}
            </span>
          </div>
        ))}
       
        {/* Overall Balance Score */}
        <div style={{
          marginTop: "12px",
          padding: "8px",
          backgroundColor: "rgba(255, 255, 255, 0.08)",
          borderRadius: "6px",
          textAlign: "center",
          border: "1px solid rgba(255, 255, 255, 0.15)"
        }}>
          <div style={{
            fontSize: "11px",
            color: "rgba(255, 255, 255, 0.8)",
            marginBottom: "4px"
          }}>
            Overall Balance
          </div>
          <div style={{
            fontSize: "18px",
            fontWeight: "bold",
            color: avgScore >= 70 ? "#4CAF50" : avgScore >= 50 ? "#FF9800" : "#F44336"
          }}>
            {avgScore}%
          </div>
        </div>
      </div>
    </div>
  );
};
 
export default KoshaPieChart;