import React, { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "react-bootstrap";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";

interface MetricCardProps {
    icon: string;
    label: string;
    value: string;
    unit?: string;
    status: "Low" | "Good" | "High" | "Normal";
    iconBg: string;
}

const MetricCard: React.FC<MetricCardProps> = ({
    icon,
    label,
    value,
    unit,
    status,
    iconBg,
}) => {
    const getStatusColor = () => {
        switch (status) {
            case "Good":
            case "Normal":
                return "#10B981";
            case "Low":
                return "#F59E0B";
            case "High":
                return "#EF4444";
            default:
                return "#6B7280";
        }
    };

    return (
        <div
            className="rounded-3 p-3 h-100"
            style={{
                background: "rgba(30, 30, 30, 0.6)",
                border: "1px solid rgba(255, 255, 255, 0.1)",
            }}
        >
            <div className="d-flex justify-content-between align-items-start mb-3">
                <div
                    className="rounded-2 d-flex align-items-center justify-content-center"
                    style={{
                        width: "40px",
                        height: "40px",
                        background: iconBg,
                    }}
                >
                    <i className={`bi ${icon} text-white`} style={{ fontSize: "20px" }}></i>
                </div>
                <span
                    className="badge rounded-pill px-3 py-1"
                    style={{
                        backgroundColor:
                            status === "Good" || status === "Normal"
                                ? "rgba(16, 185, 129, 0.15)"
                                : status === "Low"
                                    ? "rgba(245, 158, 11, 0.15)"
                                    : "rgba(239, 68, 68, 0.15)",
                        color: getStatusColor(),
                        border: `1px solid ${getStatusColor()}`,
                        fontSize: "11px",
                        fontWeight: "500",
                    }}
                >
                    {status}
                </span>
            </div>
            <div className="text-secondary mb-1" style={{ fontSize: "13px" }}>
                {label}
            </div>
            <div className="d-flex align-items-baseline">
                <span className="fw-bold text-white" style={{ fontSize: "32px" }}>
                    {value}
                </span>
                {unit && (
                    <span className="text-secondary ms-2" style={{ fontSize: "13px" }}>
                        {unit}
                    </span>
                )}
            </div>
        </div>
    );
};

const VitaScanReport: React.FC = () => {
    const navigate = useNavigate();
    const reportRef = useRef<HTMLDivElement>(null);
    const [isExporting, setIsExporting] = useState(false);

    const waveformData = Array.from({ length: 150 }, (_, i) => {
        const x = (i / 150) * Math.PI * 6;
        return (
            Math.sin(x) * 0.4 +
            Math.sin(x * 1.5) * 0.3 +
            Math.sin(x * 2.5) * 0.2 +
            Math.cos(x * 0.5) * 0.1
        );
    });

const handleExportPDF = async () => {
    if (!reportRef.current) return;

    setIsExporting(true);

    // Wait for state change to hide buttons
    setTimeout(async () => {
        try {
            const element = reportRef.current!;
            
            const canvas = await html2canvas(element, {
                scale: 2, // High DPI for crisp text
                useCORS: true,
                backgroundColor: "#0a0a0a", // Solid background to avoid transparency issues
                windowWidth: 1400, // Forces the 4-column desktop layout
                onclone: (clonedDoc) => {
                    // Ensure the cloned element doesn't have scrollbars or cropped height
                    const el = clonedDoc.getElementById('report-container') as HTMLElement;
                    if (el) {
                        el.style.height = "auto";
                        el.style.width = "1400px";
                    }
                }
            });

            const imgData = canvas.toDataURL("image/png");
            
            // Calculate dimensions for A4 Paper
            const pdf = new jsPDF({
                orientation: "portrait",
                unit: "mm",
                format: "a4"
            });

            const pdfWidth = pdf.internal.pageSize.getWidth();
            const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

            pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, pdfHeight);
            pdf.save("VitaScan-Report.pdf");

        } catch (error) {
            console.error("PDF Generation Error:", error);
        } finally {
            setIsExporting(false);
        }
    }, 150);
};

    const handleContinueToChat = () => {
        navigate("/chat");
    };

    return (
        <div
            ref={reportRef}
            className="text-white p-5 p-md-5"
            style={{
                background: "linear-gradient(135deg, #0a0a0a 0%, #1a1a1a 100%)",
                minHeight: "100vh",
                width: "100vw",
                overflowX: "hidden",
                padding: "48px 64px"
            }}
        >
            {/* Header */}
            <div className="mb-4">
                {!isExporting && (
                    <Button
                        variant="link"
                        className="text-white text-decoration-none p-0 mb-4 d-flex align-items-center"
                        onClick={() => navigate(-1)}
                        style={{ fontSize: "16px" }}
                    >
                        <i className="bi bi-arrow-left me-2"></i>
                        Back
                    </Button>
                )}

                <div className="d-flex justify-content-between align-items-start">
                    <div>
                        <h1 className="h2 fw-bold mb-1">Vita Scan Report</h1>
                        <p className="text-secondary mb-0" style={{ fontSize: "14px" }}>
                            Biometric analysis & monitoring
                        </p>
                    </div>
                    {!isExporting && (
                        <Button
                            variant="dark"
                            className="d-flex align-items-center px-3 py-2"
                            onClick={handleExportPDF}
                            style={{
                                background: "rgba(30, 30, 30, 0.8)",
                                border: "1px solid rgba(255, 255, 255, 0.1)",
                                fontSize: "13px",
                            }}
                        >
                            <i className="bi bi-upload me-2"></i>
                            Export PDF
                        </Button>
                    )}
                </div>
            </div>

            {/* Metrics Grid */}
            <div className="row g-3 mb-4">
                <div className="col-12 col-md-6 col-lg-3">
                    <MetricCard
                        icon="bi-heart-pulse"
                        label="Heart Rate"
                        value="57"
                        unit="BPM"
                        status="Low"
                        iconBg="rgba(59, 130, 246, 0.2)"
                    />
                </div>
                <div className="col-12 col-md-6 col-lg-3">
                    <MetricCard
                        icon="bi-lungs"
                        label="Breathing Rate"
                        value="17.5"
                        unit="breaths/min"
                        status="Good"
                        iconBg="rgba(59, 130, 246, 0.2)"
                    />
                </div>
                <div className="col-12 col-md-6 col-lg-3">
                    <MetricCard
                        icon="bi-emoji-neutral"
                        label="Stress Index"
                        value="44"
                        status="Low"
                        iconBg="rgba(59, 130, 246, 0.2)"
                    />
                </div>
                <div className="col-12 col-md-6 col-lg-3">
                    <MetricCard
                        icon="bi-activity"
                        label="Signal Quality"
                        value="0.78"
                        status="Good"
                        iconBg="rgba(59, 130, 246, 0.2)"
                    />
                </div>
            </div>

            {/* Main Content Grid */}
            <div className="row g-3 mb-4">
                <div className="col-12 col-lg-5">
                    <div
                        className="rounded-3 p-4 h-100"
                        style={{
                            background: "rgba(30, 30, 30, 0.6)",
                            border: "1px solid rgba(255, 255, 255, 0.1)",
                            minHeight: "300px",
                        }}
                    >
                        <div className="d-flex align-items-center mb-3">
                            <div
                                className="rounded-2 d-flex align-items-center justify-content-center me-2"
                                style={{
                                    width: "32px",
                                    height: "32px",
                                    background: "rgba(59, 130, 246, 0.2)",
                                }}
                            >
                                <i className="bi bi-activity text-info" style={{ fontSize: "16px" }}></i>
                            </div>
                            <h3 className="h6 fw-semibold mb-0">Live Scan Waveform</h3>
                        </div>

                        <svg
                            width="100%"
                            height="200"
                            viewBox="0 0 500 200"
                            preserveAspectRatio="none"
                            className="mt-3"
                        >
                            <defs>
                                <linearGradient id="waveGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                                    <stop offset="0%" style={{ stopColor: "#06b6d4", stopOpacity: 0.5 }} />
                                    <stop offset="100%" style={{ stopColor: "#06b6d4", stopOpacity: 0.1 }} />
                                </linearGradient>
                            </defs>
                            <path
                                d={`M 0 100 ${waveformData
                                    .map((y, i) => {
                                        const x = (i / waveformData.length) * 500;
                                        const yPos = 100 - y * 80;
                                        return `L ${x} ${yPos}`;
                                    })
                                    .join(" ")} L 500 200 L 0 200 Z`}
                                fill="url(#waveGradient)"
                            />
                            <path
                                d={`M 0 100 ${waveformData
                                    .map((y, i) => {
                                        const x = (i / waveformData.length) * 500;
                                        const yPos = 100 - y * 80;
                                        return `L ${x} ${yPos}`;
                                    })
                                    .join(" ")}`}
                                fill="none"
                                stroke="#06b6d4"
                                strokeWidth="2"
                            />
                        </svg>
                    </div>
                </div>

                <div className="col-12 col-lg-7">
                    <div
                        className="rounded-3 p-4 h-100"
                        style={{
                            background: "rgba(30, 30, 30, 0.6)",
                            border: "1px solid rgba(255, 255, 255, 0.1)",
                        }}
                    >
                        <div className="d-flex align-items-center mb-3">
                            <div
                                className="rounded-2 d-flex align-items-center justify-content-center me-2"
                                style={{
                                    width: "32px",
                                    height: "32px",
                                    background: "rgba(59, 130, 246, 0.2)",
                                }}
                            >
                                <i className="bi bi-chat-dots text-info" style={{ fontSize: "16px" }}></i>
                            </div>
                            <h3 className="h6 fw-semibold mb-0">AI Health Insights</h3>
                        </div>

                        <div className="mt-3">
                            {[1, 2, 3, 4].map((_, idx) => (
                                <div key={idx} className="d-flex align-items-start mb-3">
                                    <span className="text-white fw-semibold me-3" style={{ fontSize: "14px", minWidth: "20px" }}>
                                        {idx + 1}.
                                    </span>
                                    <p className="text-secondary mb-0" style={{ fontSize: "13px", lineHeight: "1.6" }}>
                                        Lorem ipsum dolor sit amet consectetur. Sed imperdiet luctus vestibulum ereu. Massa amet cursus ultricies elementum venenatis et. Volutpat at nisi mattis in morbi quis.
                                    </p>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* Bottom Grid */}
            <div className="row g-3 mb-4">
                <div className="col-12 col-lg-7">
                    <div
                        className="rounded-3 p-4 mb-3"
                        style={{
                            background: "rgba(30, 30, 30, 0.6)",
                            border: "1px solid rgba(255, 255, 255, 0.1)",
                        }}
                    >
                        <div className="d-flex align-items-center mb-4">
                            <div
                                className="rounded-2 d-flex align-items-center justify-content-center me-2"
                                style={{
                                    width: "32px",
                                    height: "32px",
                                    background: "rgba(59, 130, 246, 0.2)",
                                }}
                            >
                                <i className="bi bi-graph-up text-info" style={{ fontSize: "16px" }}></i>
                            </div>
                            <h3 className="h6 fw-semibold mb-0">HRV Time Domain</h3>
                        </div>
                        <div>
                            {[
                                { label: "SDNN", value: "76ms", status: "Normal" },
                                { label: "RMSSD", value: "106.1ms", status: "High" },
                                { label: "pNN50", value: "61.5%", status: "High" },
                            ].map((item, idx) => (
                                <div key={idx} className="d-flex justify-content-between align-items-center mb-3 pb-3" style={{ borderBottom: "1px solid rgba(255, 255, 255, 0.1)" }}>
                                    <span className="text-white" style={{ fontSize: "14px" }}>{item.label}</span>
                                    <div className="d-flex align-items-center">
                                        <span className="text-white fw-semibold me-3" style={{ fontSize: "14px" }}>{item.value}</span>
                                        <span className="badge rounded-pill px-3 py-1" style={{
                                            backgroundColor: item.status === "Normal" ? "rgba(16, 185, 129, 0.15)" : "rgba(239, 68, 68, 0.15)",
                                            color: item.status === "Normal" ? "#10B981" : "#EF4444",
                                            border: `1px solid ${item.status === "Normal" ? "#10B981" : "#EF4444"}`,
                                            fontSize: "11px"
                                        }}>{item.status}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div
                        className="rounded-3 p-4"
                        style={{
                            background: "rgba(30, 30, 30, 0.6)",
                            border: "1px solid rgba(255, 255, 255, 0.1)",
                        }}
                    >
                        <h4 className="h6 fw-semibold mb-4">Advanced Analysis</h4>
                        {[
                            { label: "SD1 (Poincare)", value: "76.5ms", status: "Normal" },
                            { label: "SD2 (Poincare)", value: "76.5ms", status: "High" },
                        ].map((item, idx) => (
                            <div key={idx} className="d-flex justify-content-between align-items-center mb-3 pb-3" style={{ borderBottom: "1px solid rgba(255, 255, 255, 0.1)" }}>
                                <span className="text-secondary" style={{ fontSize: "13px" }}>{item.label}</span>
                                <div className="d-flex align-items-center">
                                    <span className="text-white fw-semibold me-3" style={{ fontSize: "14px" }}>{item.value}</span>
                                    <span className="badge rounded-pill px-3 py-1" style={{
                                        backgroundColor: item.status === "Normal" ? "rgba(16, 185, 129, 0.15)" : "rgba(239, 68, 68, 0.15)",
                                        color: item.status === "Normal" ? "#10B981" : "#EF4444",
                                        border: `1px solid ${item.status === "Normal" ? "#10B981" : "#EF4444"}`,
                                        fontSize: "11px"
                                    }}>{item.status}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="col-12 col-lg-5">
                    <div
                        className="rounded-3 p-4 h-100"
                        style={{
                            background: "rgba(30, 30, 30, 0.6)",
                            border: "1px solid rgba(255, 255, 255, 0.1)",
                        }}
                    >
                        <div className="d-flex align-items-center mb-4">
                            <div
                                className="rounded-2 d-flex align-items-center justify-content-center me-2"
                                style={{
                                    width: "32px",
                                    height: "32px",
                                    background: "rgba(16, 185, 129, 0.2)",
                                }}
                            >
                                <i className="bi bi-check-circle text-success" style={{ fontSize: "16px" }}></i>
                            </div>
                            <h3 className="h6 fw-semibold mb-0">Recommendations</h3>
                        </div>
                        <div className="mt-3">
                            {[1, 2, 3, 4, 5, 6].map((_, idx) => (
                                <div key={idx} className="d-flex align-items-start mb-3">
                                    <i className="bi bi-dot text-success me-2" style={{ fontSize: "24px", lineHeight: "1" }}></i>
                                    <p className="text-secondary mb-0" style={{ fontSize: "13px", lineHeight: "1.6" }}>
                                        Lorem ipsum dolor sit amet consectetur. Tincidunt tempor in velit orcu purus habitant sed. Accumsan duplicating locus dui ut egestas urna facilisi. Euismod tortor eget eu sit erat in et lorem non.
                                    </p>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* Footer */}
            <div className="text-center mt-5">
                <p className="text-secondary mb-3" style={{ fontSize: "13px" }}>
                    Discover More insights into your Vita Scan and interact to get more deeper insights
                </p>
                {!isExporting && (
                    <Button
                        className="px-5 py-3 rounded-pill fw-semibold"
                        onClick={handleContinueToChat}
                        style={{
                            background: "#06b6d4",
                            border: "none",
                            fontSize: "15px",
                        }}
                    >
                        Continue to Chat
                    </Button>
                )}
            </div>
        </div>
    );
};

export default VitaScanReport;