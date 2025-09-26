import React, { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import 'bootstrap/dist/css/bootstrap.min.css';
import { Gauge } from "@mui/x-charts/Gauge";
import {
    Box,
    Typography,
} from "@mui/material";

const ViewReport = () => {
    const [expandedFaq, setExpandedFaq] = useState(null);
    const [reportData, setReportData] = useState(null);
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();
    const location = useLocation();
    const recommendationsRef = useRef(null);

    // Get report data from navigation state
    useEffect(() => {
        if (location.state?.reportData) {
            setReportData(location.state.reportData);

            // Scroll to recommendations if requested
            if (location.state.scrollToRecommendations) {
                setTimeout(() => {
                    recommendationsRef.current?.scrollIntoView({
                        behavior: 'smooth'
                    });
                }, 500);
            }
        } else {
            // If no data in state, redirect back to reports hub
            navigate('/');
        }
    }, [location.state, navigate]);

    const toggleFaq = (index) => {
        setExpandedFaq(expandedFaq === index ? null : index);
    };

    // Parse report data to extract different sections
    const parseReportData = (data) => {
        if (!data) return { items: [], recommendations: [], frequency: null, level: null };

        // Try to parse if it's a string
        let parsedData = data;
        if (typeof data === 'string') {
            try {
                parsedData = JSON.parse(data);
            } catch (error) {
                // If not JSON, treat as plain text and split into sections
                const sections = data.split('\n').filter(line => line.trim());
                return {
                    items: sections.slice(0, Math.ceil(sections.length / 2)),
                    recommendations: sections.slice(Math.ceil(sections.length / 2)),
                    frequency: extractFrequency(data),
                    level: extractLevel(data)
                };
            }
        }

        // If it's already an object
        return {
            items: parsedData.report_items || parsedData.items || [],
            recommendations: parsedData.recommendations || [],
            frequency: parsedData.frequency || extractFrequency(JSON.stringify(parsedData)),
            level: parsedData.level || extractLevel(JSON.stringify(parsedData))
        };
    };

    // Extract frequency from text (look for Hz patterns)
    const extractFrequency = (text) => {
        const frequencyMatch = text.match(/(\d+)\s*Hz/i);
        return frequencyMatch ? parseInt(frequencyMatch[1]) : 528;
    };

    // Extract level from text (look for level indicators)
    const extractLevel = (text) => {
        const levelMatch = text.match(/(high|medium|low)/i);
        return levelMatch ? levelMatch[1].charAt(0).toUpperCase() + levelMatch[1].slice(1) : 'High';
    };

    // Get gauge value based on frequency
    const getGaugeValue = (frequency) => {
        // Convert frequency to gauge value (0-100)
        // Common frequencies: 174Hz-963Hz, 528Hz is considered optimal
        const minFreq = 100;
        const maxFreq = 1000;
        const normalizedValue = ((frequency - minFreq) / (maxFreq - minFreq)) * 100;
        return Math.max(0, Math.min(100, normalizedValue));
    };

    // Default fallback data
    const defaultReportItems = [
        "Your vibrational frequency indicates a strong connection to positive energy.",
        "Current readings show alignment with your higher self and spiritual purpose.",
        "Energy centers are functioning optimally with good flow throughout your system.",
        "Recommendations include maintaining current practices and exploring deeper meditation.",
    ];

    const defaultRecommendations = [
        {
            question: "How to increase my vibration?",
            answer: "Focus on positive thoughts, practice gratitude daily, spend time in nature, and engage in activities that bring you joy and fulfillment."
        },
        {
            question: "What affects my frequency?",
            answer: "Your thoughts, emotions, diet, environment, relationships, and daily practices all contribute to your vibrational frequency."
        },
        {
            question: "How often should I check my frequency?",
            answer: "Monthly assessments are recommended to track your progress and make necessary adjustments to your spiritual practices."
        }
    ];

    if (loading) {
        return (
            <div className='tarot-container d-flex justify-content-center align-items-center min-vh-100'>
                <div className="spinner-border text-primary" role="status">
                    <span className="visually-hidden">Loading...</span>
                </div>
            </div>
        );
    }

    if (!reportData) {
        return (
            <div className='tarot-container d-flex justify-content-center align-items-center min-vh-100'>
                <div className="text-center text-white">
                    <h3>No Report Data Found</h3>
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

    const parsedReport = parseReportData(reportData);
    const reportItems = parsedReport.items.length > 0 ? parsedReport.items : defaultReportItems;
    const recommendations = parsedReport.recommendations.length > 0
        ? parsedReport.recommendations.map((rec, idx) => ({
            question: rec.title || rec.question || `Recommendation ${idx + 1}`,
            answer: rec.content || rec.answer || rec
        }))
        : defaultRecommendations;

    const frequency = parsedReport.frequency;
    const level = parsedReport.level;
    const gaugeValue = getGaugeValue(frequency);

    return (
        <div className='tarot-container d-flex flex-column min-vh-100 min-vw-100 text-white'>
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
                            onClick={() => navigate('/')}
                            style={{ fontSize: '18px', fontWeight: '500', cursor: 'pointer' }}
                        >
                            Go Back
                        </span>
                    </div>
                    <div className="col-auto ms-auto">
                        <button className="btn p-0" style={{ background: 'none', border: 'none', color: '#666' }}>
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
                                                <span style={{ fontSize: "0.6em" }}>Hz</span>
                                            </Typography>
                                            <Typography variant="body2">
                                                {location.state?.reportType?.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase()) || 'Vibrational Frequency'}
                                            </Typography>
                                        </Box>
                                    </Box>
                                </Box>

                                {/* Card footer */}
                                <div className="text-start">
                                    <h6 className="mb-1" style={{ color: 'white', fontWeight: '600' }}>
                                        {location.state?.reportType?.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase()) || 'Vibrational Frequency'}
                                    </h6>
                                    <small style={{ color: '#00bcd4', fontSize: '12px' }}>Report</small>
                                </div>
                            </div>
                        </div>

                        {/* Report Section */}
                        <div className="mb-5">
                            <h5 className="mb-3" style={{ fontWeight: '600', color: 'white' }}>Report</h5>
                            <ul className="list-unstyled">
                                {reportItems.map((item, index) => (
                                    <li key={index} className="mb-2 d-flex align-items-start">
                                        <span className="me-2" style={{ color: '#00bcd4', fontSize: '12px', marginTop: '6px' }}>•</span>
                                        <span style={{ color: '#a0aec0', fontSize: '14px', lineHeight: '1.5' }}>
                                            {typeof item === 'string' ? item : item.content || item.description || 'Report item'}
                                        </span>
                                    </li>
                                ))}
                            </ul>
                        </div>

                        {/* Recommendations Section */}
                        <div className="mb-4" ref={recommendationsRef}>
                            <h5 className="mb-4" style={{ fontWeight: '600', color: 'white' }}>Recommendations</h5>

                            {recommendations.map((item, index) => (
                                <div key={index} className="mb-3">
                                    <button
                                        className="btn w-100 text-start p-3 d-flex justify-content-between align-items-center"
                                        style={{
                                            background: 'rgba(255,255,255,0.05)',
                                            border: '1px solid #30363d',
                                            borderRadius: '8px',
                                            color: '#e6edf3',
                                            fontSize: '14px'
                                        }}
                                        onClick={() => toggleFaq(index)}
                                    >
                                        <span>{item.question}</span>
                                        <svg
                                            width="16"
                                            height="16"
                                            viewBox="0 0 24 24"
                                            fill="none"
                                            stroke="currentColor"
                                            strokeWidth="2"
                                            style={{
                                                transform: expandedFaq === index ? 'rotate(180deg)' : 'rotate(0deg)',
                                                transition: 'transform 0.2s ease'
                                            }}
                                        >
                                            <polyline points="6,9 12,15 18,9"></polyline>
                                        </svg>
                                    </button>

                                    {expandedFaq === index && (
                                        <div
                                            className="mt-2 p-3"
                                            style={{
                                                background: 'rgba(255,255,255,0.02)',
                                                border: '1px solid #30363d',
                                                borderRadius: '8px',
                                                fontSize: '13px',
                                                color: '#a0aec0',
                                                lineHeight: '1.6'
                                            }}
                                        >
                                            {item.answer}
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>

                        {/* Bottom Section */}
                        <div className="text-center mb-4">
                            <p style={{ color: '#718096', fontSize: '13px', lineHeight: '1.5', maxWidth: '400px', margin: '0 auto' }}>
                                Discover More insights into your {location.state?.reportType?.replace('_', ' ') || 'Vibrational frequency'} and Interact to get more deeper insights
                            </p>

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
                                    // Navigate to chat or relevant page
                                    console.log('Continue Chat clicked');
                                }}
                            >
                                Continue Chat
                            </button>
                        </div>

                    </div>
                </div>
            </div>
        </div>
    );
};

export default ViewReport;