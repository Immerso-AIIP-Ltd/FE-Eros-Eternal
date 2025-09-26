import React, { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import 'bootstrap/dist/css/bootstrap.min.css';
import { Gauge } from "@mui/x-charts/Gauge";
import {
    Box,
    Typography,
} from "@mui/material";


interface ReportData {
    timestamp: string;
    report_data: {
        report_title: string;
        assessment: {
            vibrational_frequency?: number;
            current_energy_state?: string;
            current_flame_score?: string;
            flame_score?: string;
            aura_intensity?: string;
            kosha_alignment?: string;
            star_magnitude?: string;
            longevity_score?: string;
        };
        detailed_analysis?: string;
        recommendations?: {
            practices?: string[];
            guidance?: string[];
            considerations?: string[];
        };
        // Add other fields as needed
    };
    // Add other top-level fields as needed
}

const ViewReport = () => {
    const [expandedFaq, setExpandedFaq] = useState(null);
    const [reportData, setReportData] = useState<ReportData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const navigate = useNavigate();
    const location = useLocation();
    const recommendationsRef = useRef(null);

    const baseApiUrl = "http://192.168.29.154:6001/api/v1/reports/individual_report/";


    // Fetch report data from API
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
                    `${baseApiUrl}?user_id=${location.state.userId}&report_type=${location.state.reportType}`
                );

                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }

                const data = await response.json();

                if (data.success && data.data && data.data.report_data) {
                    setReportData(data.data);

                    // Scroll to recommendations if requested
                    // Scroll to recommendations if requested
                    if (location.state.scrollToRecommendations) {
                        setTimeout(() => {
                            recommendationsRef.current?.scrollIntoView({
                                behavior: 'smooth'
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

    const toggleFaq = (index) => {
        setExpandedFaq(expandedFaq === index ? null : index);
    };

    // Get display title from report type
    const getDisplayTitle = () => {
        if (location.state?.title) return location.state.title;
        if (reportData?.report_data?.report_title) return reportData.report_data.report_title;

        // Fallback to formatted report type
        const reportType = location.state?.reportType || reportData?.report_type || '';
        return reportType.split('_').map(word =>
            word.charAt(0).toUpperCase() + word.slice(1)
        ).join(' ');
    };

    // Extract frequency/score from assessment
    const getFrequencyValue = () => {
        const assessment = reportData?.report_data?.assessment;
        if (!assessment) return 'N/A    ';

        return assessment.vibrational_frequency ||
            assessment.current_flame_score ||
            assessment.flame_score ||
            assessment.aura_intensity ||
            assessment.kosha_alignment ||
            assessment.star_magnitude ||
            assessment.longevity_score ||
           'N/A';
    };

    // Extract level from assessment
    const getLevel = () => {
        const assessment = reportData?.report_data?.assessment;
        if (!assessment) return 'High';

        const energyState = assessment.current_energy_state || '';
        if (energyState.toLowerCase().includes('high')) return 'High';
        if (energyState.toLowerCase().includes('low')) return 'Low';
        if (energyState.toLowerCase().includes('medium')) return 'Medium';

        // Default based on frequency/score value
        const frequency = getFrequencyValue();
        if (frequency > 70) return 'High';
        if (frequency > 40) return 'Medium';
        return 'Low';
    };

    // Get gauge value (0-100 scale)
    const getGaugeValue = () => {
        const frequency = getFrequencyValue();
        // Convert to 0-100 scale
        return Math.max(0, Math.min(100, frequency));
    };

    // Get assessment sections
    const getAssessmentSections = () => {
        const assessment = reportData?.report_data?.assessment;
        if (!assessment) return [];

        const sections = [];

        // Personal Context
        if (assessment.personal_context) {
            sections.push({
                title: "Personal Context",
                content: assessment.personal_context
            });
        }

        // Astrological Insights
        if (assessment.astrological_insights) {
            sections.push({
                title: "Astrological Insights",
                content: assessment.astrological_insights
            });
        }

        // Karmic Life Path
        if (assessment.karmic_life_path) {
            sections.push({
                title: "Karmic Life Path",
                content: assessment.karmic_life_path
            });
        }

        // Actionable Recommendations
        if (assessment.actionable_recommendations) {
            sections.push({
                title: "Actionable Recommendations",
                content: assessment.actionable_recommendations
            });
        }

        return sections;
    };

    // Parse detailed analysis into bullet points
    const getReportItems = () => {
        const detailedAnalysis = reportData?.report_data?.detailed_analysis;
        if (!detailedAnalysis) return [];

        // Split by sentences and filter meaningful ones
        return detailedAnalysis
            .split(/[.!?]+/)
            .map(sentence => sentence.trim())
            .filter(sentence => sentence.length > 20)
            .slice(0, 6); // Limit to 6 items
    };

    // Parse recommendations into expandable sections
    const getRecommendations = () => {
        const recommendations = reportData?.report_data?.recommendations;
        if (!recommendations) return [];

        const sections = [];

        // Add practices
        if (recommendations.practices && recommendations.practices.length > 0) {
            sections.push({
                title: "Practices",
                items: recommendations.practices
            });
        }

        // Add guidance
        if (recommendations.guidance && recommendations.guidance.length > 0) {
            sections.push({
                title: "Guidance",
                items: recommendations.guidance
            });
        }

        // Add considerations
        if (recommendations.considerations && recommendations.considerations.length > 0) {
            sections.push({
                title: "Considerations",
                items: recommendations.considerations
            });
        }

        return sections;
    };

    if (loading) {
        return (
            <div className='tarot-container d-flex justify-content-center align-items-center min-vh-100'>
                <div className="spinner-border text-primary" role="status">
                    <span className="visually-hidden">Loading...</span>
                </div>
            </div>
        );
    }

    if (error || !reportData) {
        return (
            <div className='tarot-container d-flex justify-content-center align-items-center min-vh-100'>
                <div className="text-center text-white">
                    <h3>{error || "No Report Data Found"}</h3>
                    <button
                        className="btn btn-primary mt-3"
                        onClick={() => navigate('/')}
                    >
                        Go Back to Reports Hub
                    </button>
                </div>
            </div>
        );
    }

    const displayTitle = getDisplayTitle();
    const frequency = getFrequencyValue();
    const level = getLevel();
    const gaugeValue = getGaugeValue();
    const assessmentSections = getAssessmentSections();
    const reportItems = getReportItems();
    const recommendationSections = getRecommendations();

    const reportTimestamp = new Date(reportData?.timestamp || '');
    const currentTimestamp = new Date();
    const reportDateStr = reportTimestamp.toISOString().split('T')[0];
    const currentDateStr = currentTimestamp.toISOString().split('T')[0];
    const shouldShowContinueChat = reportDateStr > currentDateStr;
    return (
        <div className='tarot-container d-flex flex-column min-vh-100 min-vw-100 text-white' style={{ alignItems: 'start', justifyContent: 'start' }}>
            {/* Header */}
            <div className="container-fluid px-3 py-3">
                <div className="row align-items-center">
                    <div className="col-auto">
                        <button
                            className="btn p-0 me-3"
                            style={{ background: 'none', border: 'none', color: 'white' }}
                            onClick={() => navigate('/')}
                        >
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="m15 18-6-6 6-6" />
                            </svg>
                        </button>
                        <span
                            onClick={() => navigate('/result')}
                            style={{ fontSize: '18px', fontWeight: '500', cursor: 'pointer' }}
                        >
                            Go Back
                        </span>
                    </div>
                    <div className="col-auto ms-auto">
                        <button
                            className="btn p-0"
                            style={{ background: 'none', border: 'none', color: '#666' }}
                            onClick={() => window.location.reload()}
                        >
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
                                <path d="M3 3v5h5" />
                            </svg>
                        </button>
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="container-fluid px-3">
                <div className="row justify-content-center">
                    <div className="col-12 col-md-10 col-lg-8 col-xl-6">

                        {/* Gauge Card */}
                        <div className="card mb-4" style={{
                            background: 'linear-gradient(135deg, #1a2332 0%, #0d1117 100%)',
                            border: '1px solid #30363d',
                            borderRadius: '16px'
                        }}>
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
                                                "& .MuiGauge-valueArc": { fill: "#00B8F8" },
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
                                            color="white"
                                        >
                                            <Typography fontSize="1.5em" mb={1}>
                                                🔥
                                            </Typography>
                                            <Typography fontWeight="bold" mb={1}>
                                                {level}
                                            </Typography>
                                            <Typography variant="h4" fontWeight="bold" mb={1}>
                                                {frequency}
                                                <span style={{ fontSize: "0.6em" }}>
                                                    {location.state?.reportType?.includes('frequency') ? 'Hz' : ''}
                                                </span>
                                            </Typography>
                                            <Typography variant="body2">
                                                test
                                            </Typography>
                                        </Box>
                                    </Box>
                                </Box>

                                {/* Card footer */}
                                <div className="text-start">
                                    <h6 className="mb-1" style={{ color: 'white', fontWeight: '600' }}>
                                        {displayTitle}
                                    </h6>
                                    <small style={{ color: '#00bcd4', fontSize: '12px' }}>
                                        Report • {new Date(reportData.timestamp).toLocaleDateString()}
                                    </small>
                                </div>
                            </div>
                        </div>

                        {/* Assessment Section */}
                        {assessmentSections.length > 0 && (
                            <div className="mb-5">
                                <h4 className="mb-4" style={{ fontWeight: '600', color: 'white' }}>Report</h4>
                                {assessmentSections.map((section, index) => (
                                    <div key={index} className="mb-4">
                                        <div className="card" style={{
                                            background: 'rgba(255,255,255,0.03)',
                                            border: '1px solid #30363d',
                                            borderRadius: '12px'
                                        }}>
                                            <div className="card-body p-4">
                                                <h6 className="mb-3" style={{
                                                    color: '#00bcd4',
                                                    fontWeight: '600',
                                                    fontSize: '16px'
                                                }}>
                                                    {section.title}
                                                </h6>
                                                <p style={{
                                                    color: '#e6edf3',
                                                    fontSize: '14px',
                                                    lineHeight: '1.6',
                                                    margin: '0'
                                                }}>
                                                    {section.content}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* Report Section */}
                        {reportItems.length > 0 && (
                            <div className="mb-5">
                                <h5 className="mb-3" style={{ fontWeight: '600', color: 'white' }}>Detailed Analysis</h5>
                                <ul className="list-unstyled">
                                    {reportItems.map((item, index) => (
                                        <li key={index} className="mb-2 d-flex align-items-start">
                                            <span className="me-2" style={{ color: '#00bcd4', fontSize: '12px', marginTop: '6px' }}>•</span>
                                            <span style={{ color: '#a0aec0', fontSize: '14px', lineHeight: '1.5' }}>
                                                {item}
                                            </span>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}

                        {/* Recommendations Section */}
                        {recommendationSections.length > 0 && (
                            <div className="mb-4" ref={recommendationsRef}>
                                <h4 className="mb-4" style={{ fontWeight: '600', color: 'white' }}>Recommendations</h4>

                                {recommendationSections.map((section, sectionIndex) => (
                                    <div key={sectionIndex} className="mb-4">
                                        <div className="mb-3">
                                            <button
                                                className="btn w-100 text-start p-3 d-flex justify-content-between align-items-center"
                                                style={{
                                                    background: 'rgba(255,255,255,0.05)',
                                                    border: '1px solid #30363d',
                                                    borderRadius: '8px',
                                                    color: '#e6edf3',
                                                    fontSize: '14px',
                                                    fontWeight: '600'
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
                                                        transform: expandedFaq === sectionIndex ? 'rotate(180deg)' : 'rotate(0deg)',
                                                        transition: 'transform 0.2s ease'
                                                    }}
                                                >
                                                    <polyline points="6,9 12,15 18,9"></polyline>
                                                </svg>
                                            </button>

                                            {expandedFaq === sectionIndex && (
                                                <div
                                                    className="mt-2 p-3"
                                                    style={{
                                                        background: 'rgba(255,255,255,0.02)',
                                                        border: '1px solid #30363d',
                                                        borderRadius: '8px'
                                                    }}
                                                >
                                                    <ul className="list-unstyled mb-0">
                                                        {section.items.map((item, itemIndex) => (
                                                            <li key={itemIndex} className="mb-2 d-flex align-items-start">
                                                                <span className="me-2" style={{ color: '#00bcd4', fontSize: '12px', marginTop: '6px' }}>•</span>
                                                                <span style={{
                                                                    color: '#a0aec0',
                                                                    fontSize: '13px',
                                                                    lineHeight: '1.6'
                                                                }}>
                                                                    {item}
                                                                </span>
                                                            </li>
                                                        ))}
                                                    </ul>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* Bottom Section */}
                        <div className="text-center mb-4">
                            <p style={{ color: '#718096', fontSize: '13px', lineHeight: '1.5', maxWidth: '400px', margin: '0 auto' }}>
                                Discover More insights into your {displayTitle.toLowerCase()} and Interact to get more deeper insights
                            </p>

                            {shouldShowContinueChat && (
                                <button
                                    className="btn mt-3 px-4 py-2"
                                    style={{
                                        background: '#00bcd4',
                                        border: 'none',
                                        borderRadius: '25px',
                                        color: 'white',
                                        fontSize: '14px',
                                        fontWeight: '600',
                                        minWidth: '140px'
                                    }}
                                    onClick={() => {
                                        console.log('Continue Chat clicked');
                                    }}
                                >
                                    Continue Chat
                                </button>
                            )}
                        </div>

                    </div>
                </div>
            </div>
        </div>
    );
};

export default ViewReport;