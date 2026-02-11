import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { UsersRound } from "lucide-react";
import { Card, Col, Row, Container } from "react-bootstrap";

const API_URL = "http://164.52.205.108:8500";

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
        `${API_URL}/api/v1/numerology/career_compatibility`,
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
      <div className="d-flex flex-column align-items-center">
        <svg width="200" height="200" style={{ transform: "rotate(-90deg)" }}>
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
      <Container className="py-4">
        {/* Header Section */}
        <div className="text-center mb-5">
          <h2
            className="mb-3"
            style={{ fontSize: "2rem", fontWeight: 700, color: "#1f2937" }}
          >
            Relationship Compatibility
          </h2>
          <p className="mb-2" style={{ fontSize: "1.25rem", color: "#6b7280" }}>
            <span
              style={{ color: "#00B8F8", fontWeight: 600, fontSize: "1.5rem" }}
            >
              {yourName}
            </span>{" "}
            &{" "}
            <span
              style={{ color: "#00B8F8", fontWeight: 600, fontSize: "1.5rem" }}
            >
              {partnerName}
            </span>
          </p>
          <p style={{ fontSize: "1rem", color: "#6b7280" }}>
            {data.match_for}
          </p>
        </div>

        {/* Compatibility Score - Circular Progress */}
        <Row className="mb-5">
          <Col md={12}>
            <Card
              className="shadow-sm"
              style={{
                backgroundColor: "#ffffff",
                border: "1px solid #e5e7eb",
                borderRadius: "16px",
              }}
            >
              <Card.Body className="p-5 d-flex flex-column align-items-center">
                <h3
                  className="mb-4"
                  style={{
                    fontSize: "1.75rem",
                    fontWeight: 700,
                    color: "#1f2937",
                  }}
                >
                  Compatibility Score
                </h3>
                <div style={{ position: "relative", marginBottom: "20px" }}>
                  <CircularProgress score={data.compatibility_score} />
                </div>
                <p
                  className="text-center mb-0"
                  style={{
                    color: "#6b7280",
                    fontSize: "1rem",
                    maxWidth: "500px",
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
        <Row className="g-4">
          {/* Match Summary */}
          <Col md={12}>
            <Card
              className="h-100 shadow-sm"
              style={{
                backgroundColor: "#ffffff",
                border: "1px solid #e5e7eb",
                borderRadius: "16px",
              }}
            >
              <Card.Body className="p-4">
                <Card.Title
                  className="mb-4 pb-3"
                  style={{
                    fontSize: "1.5rem",
                    fontWeight: 700,
                    color: "#1f2937",
                    borderBottom: "2px solid #e5e7eb",
                  }}
                >
                  Match Summary
                </Card.Title>
                <p style={{ color: "#374151", lineHeight: "1.8", margin: 0 }}>
                  {data.match_summary}
                </p>
              </Card.Body>
            </Card>
          </Col>

          {/* Overview */}
          <Col md={12}>
            <Card
              className="h-100 shadow-sm"
              style={{
                backgroundColor: "#ffffff",
                border: "1px solid #e5e7eb",
                borderRadius: "16px",
              }}
            >
              <Card.Body className="p-4">
                <Card.Title
                  className="mb-4 pb-3"
                  style={{
                    fontSize: "1.5rem",
                    fontWeight: 700,
                    color: "#1f2937",
                    borderBottom: "2px solid #e5e7eb",
                  }}
                >
                  Overview
                </Card.Title>
                <p style={{ color: "#374151", lineHeight: "1.8", margin: 0 }}>
                  {data.dynamic_summary}
                </p>
              </Card.Body>
            </Card>
          </Col>

          {/* Strengths */}
          {data.strengths && data.strengths.length > 0 && (
            <Col md={6}>
              <Card
                className="h-100 shadow-sm"
                style={{
                  backgroundColor: "#ffffff",
                  border: "1px solid #e5e7eb",
                  borderRadius: "16px",
                }}
              >
                <Card.Body className="p-4">
                  <Card.Title
                    className="mb-4 pb-3"
                    style={{
                      fontSize: "1.5rem",
                      fontWeight: 700,
                      color: "#1f2937",
                      borderBottom: "2px solid #e5e7eb",
                    }}
                  >
                    Strengths
                  </Card.Title>
                  <ul className="list-unstyled mb-0">
                    {formatArrayItems(data.strengths)}
                  </ul>
                </Card.Body>
              </Card>
            </Col>
          )}

          {/* Challenges */}
          {data.challenges && data.challenges.length > 0 && (
            <Col md={6}>
              <Card
                className="h-100 shadow-sm"
                style={{
                  backgroundColor: "#ffffff",
                  border: "1px solid #e5e7eb",
                  borderRadius: "16px",
                }}
              >
                <Card.Body className="p-4">
                  <Card.Title
                    className="mb-4 pb-3"
                    style={{
                      fontSize: "1.5rem",
                      fontWeight: 700,
                      color: "#1f2937",
                      borderBottom: "2px solid #e5e7eb",
                    }}
                  >
                    Challenges
                  </Card.Title>
                  <ul className="list-unstyled mb-0">
                    {formatArrayItems(data.challenges)}
                  </ul>
                </Card.Body>
              </Card>
            </Col>
          )}

          {/* Shared Values */}
          {data.shared_values && data.shared_values.length > 0 && (
            <Col md={6}>
              <Card
                className="h-100 shadow-sm"
                style={{
                  backgroundColor: "#ffffff",
                  border: "1px solid #e5e7eb",
                  borderRadius: "16px",
                }}
              >
                <Card.Body className="p-4">
                  <Card.Title
                    className="mb-4 pb-3"
                    style={{
                      fontSize: "1.5rem",
                      fontWeight: 700,
                      color: "#1f2937",
                      borderBottom: "2px solid #e5e7eb",
                    }}
                  >
                    Shared Values
                  </Card.Title>
                  <ul className="list-unstyled mb-0">
                    {formatArrayItems(data.shared_values)}
                  </ul>
                </Card.Body>
              </Card>
            </Col>
          )}

          {/* Ideal Roles */}
          {data.ideal_roles && data.ideal_roles.length > 0 && (
            <Col md={6}>
              <Card
                className="h-100 shadow-sm"
                style={{
                  backgroundColor: "#ffffff",
                  border: "1px solid #e5e7eb",
                  borderRadius: "16px",
                }}
              >
                <Card.Body className="p-4">
                  <Card.Title
                    className="mb-4 pb-3"
                    style={{
                      fontSize: "1.5rem",
                      fontWeight: 700,
                      color: "#1f2937",
                      borderBottom: "2px solid #e5e7eb",
                    }}
                  >
                    Ideal Roles
                  </Card.Title>
                  <ul className="list-unstyled mb-0">
                    {formatArrayItems(data.ideal_roles)}
                  </ul>
                </Card.Body>
              </Card>
            </Col>
          )}

          {/* Communication Style */}
          {data.communication_style && (
            <Col md={6}>
              <Card
                className="h-100 shadow-sm"
                style={{
                  backgroundColor: "#ffffff",
                  border: "1px solid #e5e7eb",
                  borderRadius: "16px",
                }}
              >
                <Card.Body className="p-4">
                  <Card.Title
                    className="mb-4 pb-3"
                    style={{
                      fontSize: "1.5rem",
                      fontWeight: 700,
                      color: "#1f2937",
                      borderBottom: "2px solid #e5e7eb",
                    }}
                  >
                    Communication Style
                  </Card.Title>
                  <p
                    style={{ color: "#374151", lineHeight: "1.8", margin: 0 }}
                  >
                    {data.communication_style}
                  </p>
                </Card.Body>
              </Card>
            </Col>
          )}

          {/* Growth Opportunities */}
          {data.growth_opportunities && (
            <Col md={6}>
              <Card
                className="h-100 shadow-sm"
                style={{
                  backgroundColor: "#ffffff",
                  border: "1px solid #e5e7eb",
                  borderRadius: "16px",
                }}
              >
                <Card.Body className="p-4">
                  <Card.Title
                    className="mb-4 pb-3"
                    style={{
                      fontSize: "1.5rem",
                      fontWeight: 700,
                      color: "#1f2937",
                      borderBottom: "2px solid #e5e7eb",
                    }}
                  >
                    Growth Opportunities
                  </Card.Title>
                  <p
                    style={{ color: "#374151", lineHeight: "1.8", margin: 0 }}
                  >
                    {data.growth_opportunities}
                  </p>
                </Card.Body>
              </Card>
            </Col>
          )}

          {/* Warning Signs */}
          {data.warning_signs && data.warning_signs.length > 0 && (
            <Col md={12}>
              <Card
                className="h-100 shadow-sm"
                style={{
                  backgroundColor: "#ffffff",
                  border: "1px solid #e5e7eb",
                  borderRadius: "16px",
                }}
              >
                <Card.Body className="p-4">
                  <Card.Title
                    className="mb-4 pb-3"
                    style={{
                      fontSize: "1.5rem",
                      fontWeight: 700,
                      color: "#1f2937",
                      borderBottom: "2px solid #e5e7eb",
                    }}
                  >
                    Warning Signs
                  </Card.Title>
                  <ul className="list-unstyled mb-0">
                    {formatArrayItems(data.warning_signs)}
                  </ul>
                </Card.Body>
              </Card>
            </Col>
          )}

          {/* Advice for Main */}
          {data.advice_for_main && (
            <Col md={6}>
              <Card
                className="h-100 shadow-sm"
                style={{
                  backgroundColor: "#ffffff",
                  border: "1px solid #e5e7eb",
                  borderRadius: "16px",
                }}
              >
                <Card.Body className="p-4">
                  <Card.Title
                    className="mb-4 pb-3"
                    style={{
                      fontSize: "1.5rem",
                      fontWeight: 700,
                      color: "#1f2937",
                      borderBottom: "2px solid #e5e7eb",
                    }}
                  >
                    Advice for {data.sign_main}
                  </Card.Title>
                  <p
                    style={{ color: "#374151", lineHeight: "1.8", margin: 0 }}
                  >
                    {data.advice_for_main}
                  </p>
                </Card.Body>
              </Card>
            </Col>
          )}

          {/* Advice for Partner */}
          {data.advice_for_partner && (
            <Col md={6}>
              <Card
                className="h-100 shadow-sm"
                style={{
                  backgroundColor: "#ffffff",
                  border: "1px solid #e5e7eb",
                  borderRadius: "16px",
                }}
              >
                <Card.Body className="p-4">
                  <Card.Title
                    className="mb-4 pb-3"
                    style={{
                      fontSize: "1.5rem",
                      fontWeight: 700,
                      color: "#1f2937",
                      borderBottom: "2px solid #e5e7eb",
                    }}
                  >
                    Advice for {data.sign_partner}
                  </Card.Title>
                  <p
                    style={{ color: "#374151", lineHeight: "1.8", margin: 0 }}
                  >
                    {data.advice_for_partner}
                  </p>
                </Card.Body>
              </Card>
            </Col>
          )}

          {/* Element Interaction */}
          {data.element_interaction && (
            <Col md={6}>
              <Card
                className="h-100 shadow-sm"
                style={{
                  backgroundColor: "#ffffff",
                  border: "1px solid #e5e7eb",
                  borderRadius: "16px",
                }}
              >
                <Card.Body className="p-4">
                  <Card.Title
                    className="mb-4 pb-3"
                    style={{
                      fontSize: "1.5rem",
                      fontWeight: 700,
                      color: "#1f2937",
                      borderBottom: "2px solid #e5e7eb",
                    }}
                  >
                    Element Interaction
                  </Card.Title>
                  <p
                    style={{ color: "#374151", lineHeight: "1.8", margin: 0 }}
                  >
                    {data.element_interaction}
                  </p>
                </Card.Body>
              </Card>
            </Col>
          )}

          {/* Modality Interaction */}
          {data.modality_interaction && (
            <Col md={6}>
              <Card
                className="h-100 shadow-sm"
                style={{
                  backgroundColor: "#ffffff",
                  border: "1px solid #e5e7eb",
                  borderRadius: "16px",
                }}
              >
                <Card.Body className="p-4">
                  <Card.Title
                    className="mb-4 pb-3"
                    style={{
                      fontSize: "1.5rem",
                      fontWeight: 700,
                      color: "#1f2937",
                      borderBottom: "2px solid #e5e7eb",
                    }}
                  >
                    Modality Interaction
                  </Card.Title>
                  <p
                    style={{ color: "#374151", lineHeight: "1.8", margin: 0 }}
                  >
                    {data.modality_interaction}
                  </p>
                </Card.Body>
              </Card>
            </Col>
          )}
        </Row>

        <style>{`
          .card {
            transition: transform 0.2s ease, box-shadow 0.2s ease;
          }
          
          .card:hover {
            transform: translateY(-4px);
            box-shadow: 0 12px 24px rgba(0, 0, 0, 0.1) !important;
          }
        `}</style>
      </Container>
    );
  };

  return (
    <div
      className="vw-100 d-flex flex-column"
      style={{
        position: "relative",
        minHeight: "100vh",
        color: "#000",
        background:
          "linear-gradient(to bottom, #E0F2FE 0%, #F0F9FF 40%, #FFFFFF 60%)",
      }}
    >
      <div
        style={{
          background:
            "linear-gradient(to bottom, #E0F2FE 0%, #F0F9FF 40%, #FFFFFF 60%)",
          minHeight: "100vh",
          color: "#000",
        }}
      >
        {/* Header */}
        <div className="d-flex justify-content-between align-items-center p-4">
          <button
            className="btn btn-outline-dark"
            onClick={() => navigate("/result")}
            style={{ fontSize: "1rem", position: "relative", zIndex: 1000 }}
          >
            ← Back
          </button>
        </div>

        <div
          className="flex-grow flex p-4"
          style={{ position: "relative", zIndex: 10 }}
        >
          {/* Show Form OR Results */}
          {!compatibilityResult ? (
            <div
              className="w-full max-w-4xl mx-auto"
              style={{ position: "relative", zIndex: 10 }}
            >
              <div className="d-flex justify-content-center mb-4">
                <div
                  className="bg-info rounded-circle d-flex align-items-center justify-content-center"
                  style={{ width: "48px", height: "48px" }}
                >
                  <UsersRound size={18} color="#fff" />
                </div>
              </div>

              {/* Intro */}
              <div className="text-center mb-5">
                <h2
                  className="mb-3"
                  style={{
                    fontSize: "2.5rem",
                    fontWeight: 700,
                    color: "#00B8F8",
                  }}
                >
                  Relationship Compatibility
                </h2>
                <p
                  className="mx-auto"
                  style={{
                    color: "#6b7280",
                    fontSize: "1.125rem",
                    maxWidth: "600px",
                    lineHeight: "1.6",
                  }}
                >
                  Discover your spiritual and emotional compatibility with your
                  partner using vedic astrology
                </p>
              </div>

              {/* Form */}
              <div className="mb-5">
                <div className="row g-4 mb-4">
                  {/* Your Details */}
                  <div className="col-lg-6">
                    <div
                      className="p-4 rounded-3"
                      style={{
                        backgroundColor: "#ffffff",
                        border: "1px solid #e5e7eb",
                      }}
                    >
                      <h5
                        className="mb-4"
                        style={{ color: "#00B8F8", fontWeight: 600 }}
                      >
                        Your Information
                      </h5>

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
                  </div>

                  {/* Partner Details */}
                  <div className="col-lg-6">
                    <div
                      className="p-4 rounded-3"
                      style={{
                        backgroundColor: "#ffffff",
                        border: "1px solid #e5e7eb",
                      }}
                    >
                      <h5
                        className="mb-4"
                        style={{ color: "#EC4899", fontWeight: 600 }}
                      >
                        Partner Information
                      </h5>

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
                  </div>
                </div>

                {/* How It Works */}
                <div
                  className="p-4 mb-4 rounded-3"
                  style={{
                    backgroundColor: "#ffffff",
                    border: "1px solid #e5e7eb",
                  }}
                >
                  <h5
                    className="mb-3"
                    style={{ fontWeight: 600, color: "#1f2937" }}
                  >
                    What We'll Analyze
                  </h5>
                  <div className="d-flex flex-column gap-2">
                    {[
                      "Provides personalized relationship insights",
                      "Identifies relationship strengths",
                      "Identifies relationship Challenges",
                      "Suggest growth opportunities",
                    ].map((item, index) => (
                      <div key={index} className="d-flex align-items-center">
                        <div
                          className="rounded-circle me-2"
                          style={{
                            width: "8px",
                            height: "8px",
                            backgroundColor: "#00B8F8",
                            flexShrink: 0,
                          }}
                        />
                        <span style={{ color: "#374151" }}>{item}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Submit Button */}
                <div className="text-center">
                  <button
                    onClick={handleSubmit}
                    disabled={
                      !yourName ||
                      !yourDob ||
                      !partnerName ||
                      !partnerDob ||
                      isLoading
                    }
                    className="btn btn-info text-white px-5 py-3 rounded-pill"
                    style={{
                      fontSize: "1.125rem",
                      fontWeight: 600,
                    }}
                  >
                    {isLoading ? (
                      <span className="d-flex align-items-center justify-content-center">
                        <span
                          className="spinner-border spinner-border-sm me-2"
                          role="status"
                          aria-hidden="true"
                        />
                        Generating Compatibility...
                      </span>
                    ) : (
                      "Analyze Compatibility"
                    )}
                  </button>
                </div>
              </div>
            </div>
          ) : (
            renderResults()
          )}

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
      </div>
    </div>
  );
};

export default RelationshipCompatibility;