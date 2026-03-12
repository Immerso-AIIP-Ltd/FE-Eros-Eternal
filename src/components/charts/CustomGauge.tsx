// src/components/VibrationalFrequencyGauge.tsx
import React, { useState, useEffect } from "react";
import { Gauge } from "@mui/x-charts/Gauge";
import {
  Box,
  Typography,
  Button,
  Modal,
  Paper,
  Grid,
  Chip,
} from "@mui/material";
import { FaFire, FaInfoCircle, FaTimes } from "react-icons/fa";
 
// Define interfaces for the API response
interface CurrentAssessment {
  vf_score: string; // e.g., "700/1000"
  hz_frequency: string; // e.g., "200 Hz"
  energy_level: string; // e.g., "Medium"
  sleep_impact: string;
  environmental_factors: string;
}
 
interface PredictiveAnalysis {
  next_3_days: string[];
  optimal_timing: string;
  warning_signs: string;
}
 
interface SpiritualInsights {
  soul_lessons: string;
  past_life_connections: string;
  growth_opportunities: string;
}
 
interface Recommendations {
  immediate_actions: string[];
  mantras: string[];
  energy_practices: string[];
  avoidance_list: string[];
}
 
interface ReportData {
  report_title: string;
  timestamp: string;
  current_assessment: CurrentAssessment;
  predictive_analysis: PredictiveAnalysis;
  spiritual_insights: SpiritualInsights;
  detailed_analysis: string;
  recommendations: Recommendations;
}
 
interface ApiResponse {
  success: boolean;
  message: string;
  data: {
    id: number;
    user_id: number;
    report_type: string;
    timestamp: string;
    report_data: ReportData; // Fixed: corrected property name
  };
}
 
const VibrationalFrequencyGauge: React.FC = () => {
  const [reportData, setReportData] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [showFullReport, setShowFullReport] = useState<boolean>(false);
 
  // Get user ID from localStorage or use default for testing
  const userId = localStorage.getItem("user_id") || "11";
 
  useEffect(() => {
    const fetchVibrationalFrequency = async () => {
      if (!userId) {
        setError("User not logged in.");
        setLoading(false);
        return;
      }
 
      setLoading(true);
      setError(null);
 
      try {
        const response = await fetch(
          `http://192.168.29.154:8002/api/v1/reports/individual_report/?report_type=vibrational_frequency&user_id=${userId}`,
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
 
        // Fixed: Proper variable declaration
        const data: ApiResponse = await response.json();
 
        if (data.success && data.data?.report_data) {
          setReportData(data.data.report_data);
        } else {
          setError("No vibrational frequency data available.");
        }
      } catch (err: any) {
        console.error("Vibrational Frequency Error:", err);
        setError(
          err.message || "Failed to load Vibrational Frequency. Check connection."
        );
      } finally {
        setLoading(false);
      }
    };
 
    fetchVibrationalFrequency();
  }, [userId]);
 
  // Helper functions
  const parseVfScore = (scoreStr: string): number => {
    const match = scoreStr.match(/(\d+)\/1000/);
    return match ? parseInt(match[1], 10) : 0;
  };
 
  const parseHzFrequency = (hzStr: string): number => {
    const match = hzStr.match(/(\d+)\s*Hz/);
    return match ? parseInt(match[1], 10) : 0;
  };
 
  const getEnergyLevelColor = (level: string): string => {
    switch (level.toLowerCase()) {
      case "high":
        return "#0096D1";
      case "medium":
        return "#0096D1";
      case "low":
        return "#0096D1";
      default:
        return "#00B8F8";
    }
  };
 
  const getEnergyLevelIcon = (level: string): string => {
    switch (level.toLowerCase()) {
      case "high":
        return "🔥";
      case "medium":
        return "⚡";
      case "low":
        return "💧";
      default:
        return "✨";
    }
  };
 
  // Loading state
  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" p={4}>
        <div
          className="spinner-border text-info"
          role="status"
          style={{ width: "3rem", height: "3rem" }}
        ></div>
        <Typography ml={2} color="text.secondary">
          Loading Vibrational Frequency...
        </Typography>
      </Box>
    );
  }
 
  // Error state
  if (error) {
    return (
      <Box textAlign="center" color="error.main" p={3}>
        <Typography>⚠️ {error}</Typography>
      </Box>
    );
  }
 
  if (!reportData) {
    return (
      <Box textAlign="center" p={3}>
        <Typography>No data available</Typography>
      </Box>
    );
  }
 
  const vfScore = parseVfScore(reportData.current_assessment.vf_score);
  const hzFrequency = parseHzFrequency(reportData.current_assessment.hz_frequency);
  const energyLevel = reportData.current_assessment.energy_level;
  const gaugeValue = (vfScore / 1000) * 100; // Convert to percentage for gauge
 
  return (
    <>
      {/* Main Gauge Display */}
      <Box display="flex" flexDirection="column" alignItems="center" gap={2}>
        <Box position="relative" display="inline-flex">
          {/* The Gauge Component */}
          <Gauge
            width={400}
            height={200}
            value={gaugeValue}
            startAngle={-110}
            endAngle={110}
            cornerRadius="50%"
            sx={{
              "& .MuiGauge-valueText": { display: "none" },
              "& .MuiGauge-valueArc": { fill: getEnergyLevelColor(energyLevel) },
            }}
          />
 
          {/* Custom Overlay Text */}
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
            color="white"
          >
            <Typography fontSize="1.5em" mb={1}>
              {getEnergyLevelIcon(energyLevel)}
            </Typography>
            <Typography fontWeight="bold" mb={1}>
              {energyLevel}
            </Typography>
            <Typography variant="h4" fontWeight="bold" mb={1}>
              {hzFrequency}
              <span style={{ fontSize: "0.6em" }}>Hz</span>
            </Typography>
            <Typography variant="body2">Vibrational Frequency</Typography>
          </Box>
        </Box>
 
        {/* Score and Energy Level Chips */}
        <Box display="flex" alignItems="center" gap={2}>
          <Chip
            label={`Score: ${reportData.current_assessment.vf_score}`}
            color="primary"
            size="medium"
          />
          <Chip
            label={`Energy: ${energyLevel}`}
            sx={{
              backgroundColor: getEnergyLevelColor(energyLevel),
              color: "white",
            }}
            size="medium"
          />
        </Box>
 
        {/* View Full Report Button */}
        <Button
          variant="contained"
          startIcon={<FaInfoCircle />}
          onClick={() => setShowFullReport(true)}
          sx={{
            backgroundColor: "#00B8F8",
            "&:hover": { backgroundColor: "#0096D1" },
            mt: 2,
            px: 3,
            py: 1,
          }}
        >
          View Full Report
        </Button>
      </Box>
 
      {/* Full Report Modal */}
      <Modal
        open={showFullReport}
        onClose={() => setShowFullReport(false)}
        aria-labelledby="full-report-modal"
      >
        <Box
          sx={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            width: { xs: "95%", md: "80%" },
            maxWidth: "900px",
            maxHeight: "90vh",
            overflow: "auto",
            bgcolor: "background.paper",
            borderRadius: 2,
            boxShadow: 24,
            p: 4,
          }}
        >
          {/* Modal Header */}
          <Box
            display="flex"
            justifyContent="space-between"
            alignItems="center"
            mb={3}
          >
            <Typography variant="h4" component="h2" color="primary">
              {reportData.report_title}
            </Typography>
            <Button
              onClick={() => setShowFullReport(false)}
              sx={{
                minWidth: "auto",
                p: 1,
                color: "text.secondary",
                "&:hover": {
                  backgroundColor: "action.hover",
                }
              }}
            >
              <FaTimes />
            </Button>
          </Box>
 
          {/* Report Content */}
          <Grid container spacing={3}>
            {/* Current Assessment Section */}
            <Grid item xs={12} md={6}>
              <Paper elevation={2} sx={{ p: 3, height: "100%" }}>
                <Typography variant="h6" gutterBottom color="primary">
                  Current Assessment
                </Typography>
                <Box mb={2}>
                  <Typography variant="subtitle2" color="text.secondary" paragraph>
                    <strong>VF Score:</strong> {reportData.current_assessment.vf_score}
                  </Typography>
                  <Typography variant="subtitle2" color="text.secondary" paragraph>
                    <strong>Frequency:</strong> {reportData.current_assessment.hz_frequency}
                  </Typography>
                  <Typography variant="subtitle2" color="text.secondary" paragraph>
                    <strong>Energy Level:</strong> {energyLevel}
                  </Typography>
                </Box>
                <Typography variant="body2" paragraph>
                  <strong>Sleep Impact:</strong> {reportData.current_assessment.sleep_impact}
                </Typography>
                <Typography variant="body2">
                  <strong>Environmental Factors:</strong>{" "}
                  {reportData.current_assessment.environmental_factors}
                </Typography>
              </Paper>
            </Grid>
 
            {/* Predictive Analysis Section */}
            <Grid item xs={12} md={6}>
              <Paper elevation={2} sx={{ p: 3, height: "100%" }}>
                <Typography variant="h6" gutterBottom color="primary">
                  Predictive Analysis
                </Typography>
                <Typography variant="subtitle2" gutterBottom>
                  <strong>Next 3 Days:</strong>
                </Typography>
                {reportData.predictive_analysis.next_3_days.map((day, i) => (
                  <Typography key={i} variant="body2" paragraph sx={{ ml: 2 }}>
                    • {day}
                  </Typography>
                ))}
                <Typography variant="body2" paragraph>
                  <strong>Optimal Timing:</strong> {reportData.predictive_analysis.optimal_timing}
                </Typography>
                <Typography variant="body2">
                  <strong>Warning Signs:</strong> {reportData.predictive_analysis.warning_signs}
                </Typography>
              </Paper>
            </Grid>
 
            {/* Spiritual Insights Section */}
            <Grid item xs={12}>
              <Paper elevation={2} sx={{ p: 3 }}>
                <Typography variant="h6" gutterBottom color="primary">
                  Spiritual Insights
                </Typography>
                <Typography variant="body2" paragraph>
                  <strong>Soul Lessons:</strong> {reportData.spiritual_insights.soul_lessons}
                </Typography>
                <Typography variant="body2" paragraph>
                  <strong>Past Life Connections:</strong>{" "}
                  {reportData.spiritual_insights.past_life_connections}
                </Typography>
                <Typography variant="body2">
                  <strong>Growth Opportunities:</strong>{" "}
                  {reportData.spiritual_insights.growth_opportunities}
                </Typography>
              </Paper>
            </Grid>
 
            {/* Detailed Analysis Section */}
            <Grid item xs={12}>
              <Paper elevation={2} sx={{ p: 3 }}>
                <Typography variant="h6" gutterBottom color="primary">
                  Detailed Analysis
                </Typography>
                <Typography variant="body2" sx={{ lineHeight: 1.6 }}>
                  {reportData.detailed_analysis}
                </Typography>
              </Paper>
            </Grid>
 
            {/* Recommendations Section */}
            <Grid item xs={12}>
              <Paper elevation={2} sx={{ p: 3 }}>
                <Typography variant="h6" gutterBottom color="primary">
                  Recommendations
                </Typography>
                <Grid container spacing={2}>
                  {[
                    { title: "Immediate Actions", items: reportData.recommendations.immediate_actions },
                    { title: "Mantras", items: reportData.recommendations.mantras },
                    { title: "Energy Practices", items: reportData.recommendations.energy_practices },
                    { title: "Things to Avoid", items: reportData.recommendations.avoidance_list },
                  ].map((section, idx) => (
                    <Grid item xs={12} sm={6} key={idx}>
                      <Typography variant="subtitle2" gutterBottom color="primary">
                        <strong>{section.title}:</strong>
                      </Typography>
                      {section.items.map((item, i) => (
                        <Typography key={i} variant="body2" paragraph sx={{ ml: 1 }}>
                          • {item}
                        </Typography>
                      ))}
                    </Grid>
                  ))}
                </Grid>
              </Paper>
            </Grid>
          </Grid>
 
          {/* Modal Footer */}
          <Box mt={3} display="flex" justifyContent="center">
            <Button
              variant="contained"
              onClick={() => setShowFullReport(false)}
              sx={{
                backgroundColor: "#00B8F8",
                "&:hover": { backgroundColor: "#0096D1" },
                px: 4,
                py: 1.5,
              }}
            >
              Close Report
            </Button>
          </Box>
        </Box>
      </Modal>
    </>
  );
};
 
export default VibrationalFrequencyGauge;
 