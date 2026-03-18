import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { UsersRound } from "lucide-react";
import { Card, Col, Row, Container } from "react-bootstrap";
import { baseApiUrl } from "@/config/api";

interface CompatibilityData {
  match_for: string;
  match_summary: string;
  dynamic_summary: string;
  compatibility_score: number;

  sign_main: string;
  sign_partner: string;

  strengths: string[];
  challenges: string[];
  shared_values: string[];
  ideal_roles: string[];
  warning_signs: string[];

  communication_style: string;
  growth_opportunities: string;

  advice_for_main: string;
  advice_for_partner: string;

  element_interaction: string;
  modality_interaction: string;
}

interface ApiResponse {
  success: boolean;
  message: string;
  data: CompatibilityData;
}

const RelationshipCompatibility: React.FC = () => {
  const navigate = useNavigate();

  const [yourName, setYourName] = useState("");
  const [yourDob, setYourDob] = useState("");
  const [partnerName, setPartnerName] = useState("");
  const [partnerDob, setPartnerDob] = useState("");

  const [compatibilityResult, setCompatibilityResult] =
    useState<ApiResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Data persists in component state during session
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const userId = localStorage.getItem("user_id") || "0";

    if (!yourName || !yourDob || !partnerName || !partnerDob) {
      alert("Please fill all fields");
      return;
    }

    setIsLoading(true);
    setError(null);

    const formData = new FormData();
    formData.append("user_id", userId || "123");
    formData.append("user_name", yourName);
    formData.append("dob", yourDob);
    formData.append("dob_partner", partnerDob);

    try {
      const response = await fetch(
        `http://192.168.1.171:6001/aitools/wellness/v2/numerology/career_compatibility`,
        {
          method: "POST",
          body: formData,
        }
      );

      if (!response.ok) throw new Error(`HTTP ${response.status}`);

      const result: ApiResponse = await response.json();

      if (result.success && result.data) {
        setCompatibilityResult(result);
      } else {
        setError("No compatibility data found.");
      }
    } catch (err) {
      console.error("Error submitting form:", err);
      setError("Something went wrong. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  // Function to format array items with bullet points
  const formatArrayItems = (items: string[]) => {
    if (!items || items.length === 0) return null;

    return items.map((item, index) => (
      <li
        key={index}
        className="mb-3"
        style={{
          listStyleType: "disc",
          marginLeft: "20px",
          lineHeight: "1.8",
          color: "#374151",
        }}
      >
        {item}
      </li>
    ));
  };

  // Circular Progress Component
  const CircularProgress: React.FC<{ score: number }> = ({ score }) => {
    const radius = 80;
    const circumference = 2 * Math.PI * radius;
    const offset = circumference - (score / 100) * circumference;

    // Determine color based on score
    const getColor = (score: number) => {
      if (score >= 80) return "#10B981"; // Green
      if (score >= 60) return "#F59E0B"; // Orange
      return "#EF4444"; // Red
    };

    const color = getColor(score);

    return (
      <div className="d-flex flex-column align-items-center w-100" style={{ maxWidth: "200px", margin: "0 auto" }}>
        <svg
          viewBox="0 0 200 200"
          style={{
            transform: "rotate(-90deg)",
            width: "100%",
            height: "auto",
            maxWidth: "200px"
          }}
        >
          {/* Background circle */}
          <circle
            cx="100"
            cy="100"
            r={radius}
            fill="none"
            stroke="#E5E7EB"
            strokeWidth="12"
          />
          {/* Progress circle */}
          <circle
            cx="100"
            cy="100"
            r={radius}
            fill="none"
            stroke={color}
            strokeWidth="12"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            style={{
              transition: "stroke-dashoffset 1s ease-in-out",
            }}
          />
        </svg>
        <div
          style={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            textAlign: "center",
          }}
        >
          <div
            style={{
              fontSize: "3rem",
              fontWeight: 700,
              color: color,
            }}
          >
            {score}%
          </div>
          <div
            style={{
              fontSize: "1rem",
              color: "#6B7280",
              fontWeight: 500,
            }}
          >
            Compatible
          </div>
        </div>
      </div>
    );
  };

  const renderResults = () => {
    if (!compatibilityResult) return null;

    const { data } = compatibilityResult;

    return (
      <div
        className="results-scroll-container w-100"
        style={{
          height: 'calc(100vh - 100px)',
          overflowY: 'auto',
          padding: '0.5rem 1rem',
          scrollbarWidth: 'none',
          msOverflowStyle: 'none'
        }}
      >
        <style>{`
          .results-scroll-container::-webkit-scrollbar {
            display: none;
          }
          .compatibility-card {
            transition: transform 0.2s ease;
          }
          .compatibility-card:hover {
            transform: translateY(-2px);
          }
        `}</style>
        <Container className="py-2">
          {/* Header Section */}
          <div className="text-center mb-4">
            <h2
              className="mb-2"
              style={{ fontSize: "clamp(1.25rem, 5vw, 1.75rem)", fontWeight: 700, color: "#1f2937" }}
            >
              Relationship Compatibility
            </h2>
            <div className="d-flex align-items-center justify-content-center gap-2 mb-1">
              <span style={{ color: "#00B8F8", fontWeight: 700, fontSize: "1.1rem" }}>{yourName}</span>
              <UsersRound size={16} className="text-muted" />
              <span style={{ color: "#00B8F8", fontWeight: 700, fontSize: "1.1rem" }}>{partnerName}</span>
            </div>
            <p className="text-muted small mb-0">{data.match_for}</p>
          </div>

          {/* Compatibility Score - Circular Progress */}
          <Row className="mb-4 justify-content-center">
            <Col xs={12} md={8} lg={6}>
              <Card
                className="shadow-sm border-0 compatibility-card"
                style={{
                  backgroundColor: "#ffffff",
                  borderRadius: "16px",
                }}
              >
                <Card.Body className="p-4 d-flex flex-column align-items-center">
                  <h4
                    className="mb-4 text-center"
                    style={{
                      fontSize: "1.25rem",
                      fontWeight: 700,
                      color: "#1f2937",
                    }}
                  >
                    Cosmic Connection
                  </h4>
                  <div style={{ position: "relative", marginBottom: "1rem", width: '100%', maxWidth: '160px' }}>
                    <CircularProgress score={data.compatibility_score} />
                  </div>
                  <p
                    className="text-center mb-0 small"
                    style={{
                      color: "#6b7280",
                      maxWidth: "400px",
                    }}
                  >
                    {data.compatibility_score >= 80
                      ? "Excellent compatibility! You share a strong connection."
                      : data.compatibility_score >= 60
                        ? "Good compatibility with room for growth."
                        : "Challenging compatibility that requires effort."}
                  </p>
                </Card.Body>
              </Card>
            </Col>
          </Row>

          {/* Tiles Grid */}
          <Row className="g-3">
            {[
              { title: "Match Summary", content: data.match_summary },
              { title: "Overview", content: data.dynamic_summary },
              { title: "Strengths", items: data.strengths },
              { title: "Challenges", items: data.challenges },
              { title: "Shared Values", items: data.shared_values },
              { title: "Ideal Roles", items: data.ideal_roles },
              { title: "Communication Style", content: data.communication_style },
              { title: "Growth Opportunities", content: data.growth_opportunities },
              { title: "Advice for " + data.sign_main, content: data.advice_for_main },
              { title: "Advice for " + data.sign_partner, content: data.advice_for_partner },
              { title: "Element Interaction", content: data.element_interaction },
              { title: "Modality Interaction", content: data.modality_interaction }
            ].map((section, idx) => (
              (section.content || (section.items && section.items.length > 0)) && (
                <Col xs={12} md={idx < 2 ? 12 : 6} key={idx}>
                  <Card
                    className="h-100 shadow-sm border-0 compatibility-card"
                    style={{
                      backgroundColor: "#ffffff",
                      borderRadius: "16px",
                    }}
                  >
                    <Card.Body className="p-3">
                      <h6
                        className="mb-3 pb-2"
                        style={{
                          fontSize: "1.1rem",
                          fontWeight: 700,
                          color: "#1f2937",
                          borderBottom: "1px solid #f3f4f6",
                        }}
                      >
                        {section.title}
                      </h6>
                      {section.content ? (
                        <p className="small mb-0" style={{ color: "#4b5563", lineHeight: "1.6" }}>
                          {section.content}
                        </p>
                      ) : (
                        <ul className="list-unstyled mb-0">
                          {formatArrayItems(section.items!)}
                        </ul>
                      )}
                    </Card.Body>
                  </Card>
                </Col>
              )
            ))}
          </Row>

          <div className="text-center mt-4 pb-5">
            <button
              className="btn btn-info text-white rounded-pill px-5 shadow-sm"
              onClick={() => {
                setCompatibilityResult(null);
                setYourName("");
                setYourDob("");
                setPartnerName("");
                setPartnerDob("");
              }}
              style={{ fontWeight: 600, background: 'linear-gradient(90deg, #00B8F8, #00D4FF)' }}
            >
              Analyze Another Connection
            </button>
          </div>
        </Container>
      </div>
    );
  };

  return (
    <div
      className="viewport-container"
      style={{
        position: "relative",
        width: "100%",
        color: "#000",
        background:
          "linear-gradient(to bottom, #E0F2FE 0%, #F0F9FF 40%, #FFFFFF 60%)",
      }}
    >
      {/* Header - Stays at top */}
      <div className="viewport-header d-flex justify-content-between align-items-center p-2">
        <button
          className="btn"
          onClick={() => navigate("/result")}
          style={{ fontSize: "1rem", position: "relative", zIndex: 1000 }}
        >
          ← Back
        </button>
      </div>

      {/* Main Content Area - Centered */}
      <div className="viewport-content" style={{ justifyContent: 'flex-start', paddingTop: '1rem' }}>
        <div
          className="w-100 mx-auto d-flex flex-column align-items-center"
          style={{
            maxWidth: "1000px",
            position: "relative",
            zIndex: 10
          }}
        >
          {/* Show Form OR Results */}
          {!compatibilityResult ? (
            <div
              className="w-100 d-flex flex-column align-items-center"
              style={{ position: "relative", zIndex: 10 }}
            >
              <div className="d-flex justify-content-center mb-1">
                <div
                  className="bg-info rounded-circle d-flex align-items-center justify-content-center shadow-sm"
                  style={{ width: "40px", height: "40px" }}
                >
                  <UsersRound size={16} color="#fff" />
                </div>
              </div>

              {/* Intro */}
              <div className="text-center mb-3">
                <h2
                  className="mb-1"
                  style={{
                    fontSize: "clamp(1.5rem, 5vw, 2.2rem)",
                    fontWeight: 700,
                    color: "#00B8F8",
                    lineHeight: 1.2
                  }}
                >
                  Relationship Compatibility
                </h2>
                <p
                  className="mx-auto"
                  style={{
                    color: "#6b7280",
                    fontSize: "0.85rem",
                    maxWidth: "500px",
                    lineHeight: "1.3",
                  }}
                >
                  Discover your spiritual and emotional compatibility with your
                  partner using vedic astrology
                </p>
              </div>

              {/* Form Section */}
              <Container fluid className="mb-2 px-0 px-md-3" style={{ maxWidth: '900px' }}>
                <Row className="g-3 mb-3">
                  {/* Your Details */}
                  <Col xs={12} md={6}>
                    <div
                      className="p-3 p-lg-4 rounded-3 h-100 shadow-sm"
                      style={{
                        backgroundColor: "#ffffff",
                        border: "1px solid #e5e7eb",
                      }}
                    >
                      <h6
                        className="mb-3"
                        style={{ color: "#00B8F8", fontWeight: 600 }}
                      >
                        Your Information
                      </h6>

                      <div className="mb-3">
                        <label
                          htmlFor="yourName"
                          className="form-label"
                          style={{ fontWeight: 500, color: "#374151" }}
                        >
                          Enter Your Name
                        </label>
                        <input
                          type="text"
                          id="yourName"
                          className="form-control"
                          placeholder="Your full name"
                          value={yourName}
                          onChange={(e) => setYourName(e.target.value)}
                          required
                          style={{
                            borderColor: "#e5e7eb",
                            padding: "0.75rem",
                          }}
                        />
                      </div>

                      <div className="mb-3">
                        <label
                          htmlFor="yourDob"
                          className="form-label"
                          style={{ fontWeight: 500, color: "#374151" }}
                        >
                          Date of Birth
                        </label>
                        <input
                          type="date"
                          id="yourDob"
                          className="form-control"
                          value={yourDob}
                          onChange={(e) => setYourDob(e.target.value)}
                          max={new Date().toISOString().split("T")[0]}
                          required
                          style={{
                            borderColor: "#e5e7eb",
                            padding: "0.75rem",
                            color: "#000",
                          }}
                        />
                      </div>
                    </div>
                  </Col>

                  {/* Partner Details */}
                  <Col xs={12} md={6}>
                    <div
                      className="p-3 p-lg-4 rounded-3 h-100 shadow-sm"
                      style={{
                        backgroundColor: "#ffffff",
                        border: "1px solid #e5e7eb",
                      }}
                    >
                      <h6
                        className="mb-3"
                        style={{ color: "#00B8F8", fontWeight: 600 }}
                      >
                        Partner Information
                      </h6>

                      <div className="mb-3">
                        <label
                          htmlFor="partnerName"
                          className="form-label"
                          style={{ fontWeight: 500, color: "#374151" }}
                        >
                          Partner's Name
                        </label>
                        <input
                          type="text"
                          id="partnerName"
                          className="form-control"
                          placeholder="Partner's full name"
                          value={partnerName}
                          onChange={(e) => setPartnerName(e.target.value)}
                          required
                          style={{
                            borderColor: "#e5e7eb",
                            padding: "0.75rem",
                          }}
                        />
                      </div>

                      <div className="mb-3">
                        <label
                          htmlFor="partnerDob"
                          className="form-label"
                          style={{ fontWeight: 500, color: "#374151" }}
                        >
                          Date of Birth
                        </label>
                        <input
                          type="date"
                          id="partnerDob"
                          className="form-control"
                          value={partnerDob}
                          onChange={(e) => setPartnerDob(e.target.value)}
                          max={new Date().toISOString().split("T")[0]}
                          required
                          style={{
                            borderColor: "#e5e7eb",
                            padding: "0.75rem",
                          }}
                        />
                      </div>
                    </div>
                  </Col>
                </Row>

                {/* How It Works */}
                <div
                  className="p-2 p-md-3 mb-2 rounded-3 shadow-sm"
                  style={{
                    backgroundColor: "#ffffff",
                    border: "1px solid #e5e7eb",
                    width: "100%",
                  }}
                >
                  <h6
                    className="mb-2 text-center"
                    style={{ fontWeight: 600, color: "#1f2937", fontSize: '0.85rem' }}
                  >
                    What We'll Analyze
                  </h6>
                  <div className="d-flex justify-content-center flex-wrap gap-x-4 gap-y-1">
                    {[
                      "Personalized insights",
                      "Strengths & challenges",
                      "Growth opportunities",
                    ].map((item, index) => (
                      <div key={index} className="d-flex align-items-center">
                        <div
                          className="rounded-circle me-2"
                          style={{
                            width: "6px",
                            height: "6px",
                            backgroundColor: "#00B8F8",
                            flexShrink: 0,
                          }}
                        />
                        <span style={{ color: "#374151", fontSize: '0.75rem' }}>{item}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Submit Button */}
                <div className="text-center mt-3 mb-3">
                  <button
                    onClick={handleSubmit}
                    disabled={
                      !yourName ||
                      !yourDob ||
                      !partnerName ||
                      !partnerDob ||
                      isLoading
                    }
                    className="btn btn-info text-white px-5 py-2 rounded-pill shadow"
                    style={{
                      fontSize: "1rem",
                      fontWeight: 600,
                      width: "auto",
                      minWidth: "240px",
                      maxWidth: "100%",
                      background: 'linear-gradient(90deg, #00B8F8, #00D4FF)'
                    }}
                  >
                    {isLoading ? (
                      <span className="d-flex align-items-center justify-content-center">
                        <span
                          className="spinner-border spinner-border-sm me-2"
                          role="status"
                          aria-hidden="true"
                        />
                        Processing...
                      </span>
                    ) : (
                      "Analyze Compatibility"
                    )}
                  </button>
                </div>
              </Container>
            </div>
          ) : (
            renderResults()
          )}
        </div>
      </div>

      {/* Global Error Message */}
      {error && (
        <div
          className="position-fixed bottom-0 end-0 m-4 p-3 bg-danger text-white rounded-3 shadow"
          style={{ zIndex: 1000, maxWidth: "400px" }}
        >
          <div className="d-flex align-items-center">
            <svg
              className="me-2"
              width="20"
              height="20"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                clipRule="evenodd"
              />
            </svg>
            <span style={{ fontSize: "0.875rem" }}>{error}</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default RelationshipCompatibility;