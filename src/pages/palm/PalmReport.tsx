// PalmReadingReportPage.tsx
import React, { useEffect, useState } from "react";
import {
  Card,
  Button,
  Container,
  Row,
  Col,
  Badge,
  Alert,
} from "react-bootstrap";
import { useLocation, useNavigate } from "react-router-dom";
import "./PalmReport.css";

const PalmReadingReportPage: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [report, setReport] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [username, setUsername] = useState<string>("");

  useEffect(() => {
    if (location.state && location.state.success) {
      setReport(location.state);
    } else {
      setError("No report data found. Please upload a palm image first.");
    }
    const storedUsername = localStorage.getItem("username");
    if (storedUsername) {
      setUsername(storedUsername);
    }
  }, [location.state]);

  // Function to format text with ** for bold and - for bullet points
  const formatText = (text: string) => {
    if (!text) return null;

    // Split by lines
    const lines = text.split('\n').filter(line => line.trim());
    
    return lines.map((line, index) => {
      // Check if line starts with - (bullet point)
      const isBullet = line.trim().startsWith('-');
      const cleanLine = isBullet ? line.trim().substring(1).trim() : line.trim();
      
      // Replace **text** with <strong>text</strong>
      const formattedLine = cleanLine.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
      
      if (isBullet) {
        return (
          <li key={index} className="mb-2" style={{ listStyleType: 'disc', marginLeft: '20px' }}>
            <span dangerouslySetInnerHTML={{ __html: formattedLine }} />
          </li>
        );
      } else {
        return (
          <p key={index} className="mb-2">
            <span dangerouslySetInnerHTML={{ __html: formattedLine }} />
          </p>
        );
      }
    });
  };

  // Function to format array items
  const formatArrayItems = (items: string[]) => {
    if (!items || items.length === 0) return null;
    
    return items.map((item, index) => {
      const formattedItem = item.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
      const cleanItem = item.trim().startsWith('-') 
        ? item.trim().substring(1).trim() 
        : item.trim();
      const finalFormatted = cleanItem.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
      
      return (
        <li key={index} className="mb-3" style={{ listStyleType: 'disc', marginLeft: '20px', lineHeight: '1.8' }}>
          <span dangerouslySetInnerHTML={{ __html: finalFormatted }} />
        </li>
      );
    });
  };

  if (error) {
    return (
      <div
        className="palm-report-page min-vh-100 d-flex flex-column align-items-center justify-content-center"
        style={{ backgroundColor: "#fff", padding: "clamp(16px, 4vw, 24px)" }}
      >
        <Alert variant="danger" className="w-100" style={{ maxWidth: "min(600px, 100%)" }}>
          {error}
        </Alert>
        <Button variant="outline-dark" onClick={() => navigate("/result")} className="mt-3">
          Go Back
        </Button>
      </div>
    );
  }

  if (!report) {
    return (
      <div
        className="palm-report-page min-vh-100 d-flex flex-column align-items-center justify-content-center"
        style={{ backgroundColor: "#fff", padding: "clamp(16px, 4vw, 24px)" }}
      >
        <div className="text-center">
          <div className="spinner-border text-info mb-3" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
          <p className="text-dark">Generating your palm reading...</p>
        </div>
      </div>
    );
  }

  const { data } = report;
  const { palm_reading_detail } = data;

  return (
    <div
      className="palm-report-page d-flex flex-column"
      style={{
        background: "linear-gradient(to bottom, #E0F2FE 0%, #F0F9FF 40%, #FFFFFF 60%)",
        minHeight: "100vh",
        color: "#000",
      }}
    >
      <div className="palm-report-inner flex-grow-1 d-flex flex-column">
      {/* Header */}
      <div className="palm-report-header d-flex justify-content-between align-items-center mb-3 mb-md-4">
        <button
          type="button"
          className="btn btn-outline-dark"
          onClick={() => navigate("/result")}
          style={{ position: "relative", zIndex: 1000 }}
        >
          ← Back
        </button>
      </div>

      {/* User Info */}
      <div className="palm-report-user d-flex flex-column align-items-center justify-content-center mb-3 mb-md-4">
        <div className="text-center px-2">
          {username && <h2 className="mt-0 mt-md-2 fw-bold" style={{ color: "#1f2937" }}>{username}</h2>}
          <h6 className="mt-2 mb-0" style={{ color: "#6b7280", fontWeight: 500 }}>Palm Analysis</h6>
        </div>
      </div>

      {/* Image Preview */}
      <div className="palm-report-image-wrap d-flex justify-content-center mb-4 mb-md-5">
        <img
          src={data.image_url}
          alt="Uploaded Palm"
          className="palm-report-image img-fluid rounded shadow"
          style={{
            border: "1px solid #e5e7eb",
          }}
        />
      </div>

      {/* Report Sections - Tile Based Design */}
      <Container fluid className="palm-report-container px-0">
        <Row className="g-3 g-md-4">
          {/* Personality Traits */}
          {palm_reading_detail.personality_traits && palm_reading_detail.personality_traits.length > 0 && (
            <Col xs={12} md={6}>
              <Card
                className="palm-report-card h-100 shadow-sm"
                style={{
                  backgroundColor: "#ffffff",
                  border: '1px solid #e5e7eb',
                  borderRadius: '16px'
                }}
              >
                <Card.Body className="p-4">
                  <Card.Title 
                    className="mb-4 pb-3" 
                    style={{ 
                      fontSize: '1.5rem', 
                      fontWeight: 700,
                      color: '#1f2937',
                      borderBottom: '2px solid #e5e7eb'
                    }}
                  >
                    Personality Traits
                  </Card.Title>
                  <ul className="list-unstyled mb-0">
                    {formatArrayItems(palm_reading_detail.personality_traits)}
                  </ul>
                </Card.Body>
              </Card>
            </Col>
          )}

          {/* Life Patterns */}
          {palm_reading_detail.life_patterns && palm_reading_detail.life_patterns.length > 0 && (
            <Col xs={12} md={6}>
              <Card
                className="palm-report-card h-100 shadow-sm"
                style={{
                  backgroundColor: "#ffffff",
                  border: '1px solid #e5e7eb',
                  borderRadius: '16px'
                }}
              >
                <Card.Body className="p-4">
                  <Card.Title 
                    className="mb-4 pb-3" 
                    style={{ 
                      fontSize: '1.5rem', 
                      fontWeight: 700,
                      color: '#1f2937',
                      borderBottom: '2px solid #e5e7eb'
                    }}
                  >
                    Life Patterns
                  </Card.Title>
                  <ul className="list-unstyled mb-0">
                    {formatArrayItems(palm_reading_detail.life_patterns)}
                  </ul>
                </Card.Body>
              </Card>
            </Col>
          )}

          {/* Career Insights */}
          {palm_reading_detail.career_insights && palm_reading_detail.career_insights.length > 0 && (
            <Col xs={12} md={6}>
              <Card
                className="palm-report-card h-100 shadow-sm"
                style={{
                  backgroundColor: "#ffffff",
                  border: '1px solid #e5e7eb',
                  borderRadius: '16px'
                }}
              >
                <Card.Body className="p-4">
                  <Card.Title 
                    className="mb-4 pb-3" 
                    style={{ 
                      fontSize: '1.5rem', 
                      fontWeight: 700,
                      color: '#1f2937',
                      borderBottom: '2px solid #e5e7eb'
                    }}
                  >
                    Career Insights
                  </Card.Title>
                  <ul className="list-unstyled mb-0">
                    {formatArrayItems(palm_reading_detail.career_insights)}
                  </ul>
                </Card.Body>
              </Card>
            </Col>
          )}

          {/* Health Observations */}
          {palm_reading_detail.health_observations && palm_reading_detail.health_observations.length > 0 && (
            <Col xs={12} md={6}>
              <Card
                className="palm-report-card h-100 shadow-sm"
                style={{
                  backgroundColor: "#ffffff",
                  border: '1px solid #e5e7eb',
                  borderRadius: '16px'
                }}
              >
                <Card.Body className="p-4">
                  <Card.Title 
                    className="mb-4 pb-3" 
                    style={{ 
                      fontSize: '1.5rem', 
                      fontWeight: 700,
                      color: '#1f2937',
                      borderBottom: '2px solid #e5e7eb'
                    }}
                  >
                    Health Observations
                  </Card.Title>
                  <ul className="list-unstyled mb-0">
                    {formatArrayItems(palm_reading_detail.health_observations)}
                  </ul>
                </Card.Body>
              </Card>
            </Col>
          )}

          {/* Spiritual Guidance */}
          {palm_reading_detail.spiritual_guidance && palm_reading_detail.spiritual_guidance.length > 0 && (
            <Col xs={12} md={6}>
              <Card
                className="palm-report-card h-100 shadow-sm"
                style={{
                  backgroundColor: "#ffffff",
                  border: '1px solid #e5e7eb',
                  borderRadius: '16px'
                }}
              >
                <Card.Body className="p-4">
                  <Card.Title 
                    className="mb-4 pb-3" 
                    style={{ 
                      fontSize: '1.5rem', 
                      fontWeight: 700,
                      color: '#1f2937',
                      borderBottom: '2px solid #e5e7eb'
                    }}
                  >
                    Spiritual Guidance
                  </Card.Title>
                  <ul className="list-unstyled mb-0">
                    {formatArrayItems(palm_reading_detail.spiritual_guidance)}
                  </ul>
                </Card.Body>
              </Card>
            </Col>
          )}
        </Row>

        {/* Raw Analysis - Full Width */}
        <Row className="mt-3 mt-md-4">
          <Col xs={12}>
            <Card
              className="palm-report-card shadow-sm"
              style={{
                backgroundColor: "#ffffff",
                border: '1px solid #e5e7eb',
                borderRadius: '16px'
              }}
            >
              <Card.Body className="p-4">
                <Card.Title 
                  className="mb-4 pb-3" 
                  style={{ 
                    fontSize: '1.5rem', 
                    fontWeight: 700,
                    color: '#1f2937',
                    borderBottom: '2px solid #e5e7eb'
                  }}
                >
                  Detailed Analysis
                </Card.Title>
                <div className="palm-report-detail" style={{ color: "#374151" }}>
                  {formatText(data.raw_analysis)}
                </div>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </Container>

      <style>{`
        .palm-report-page strong {
          font-weight: 700;
          color: #1f2937;
        }
        .palm-report-page ul {
          padding-left: 0;
        }
        .palm-report-page .palm-report-card li {
          color: #374151;
        }
        .palm-report-page .palm-report-card {
          transition: transform 0.2s ease, box-shadow 0.2s ease;
        }
        .palm-report-page .palm-report-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 12px 24px rgba(0, 0, 0, 0.1) !important;
        }
      `}</style>
      </div>
    </div>
  );
};

export default PalmReadingReportPage;