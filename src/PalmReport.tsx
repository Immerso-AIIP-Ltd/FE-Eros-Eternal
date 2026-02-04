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
import Stars from "./components/stars";

const PalmReadingReportPage: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [stars] = useState(() =>
    Array.from({ length: 50 }, () => ({
      x: Math.random() * 100,
      y: Math.random() * 100,
      opacity: 0.3 + Math.random() * 0.7,
      size: Math.random() * 2 + 1,
    }))
  );
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

  if (error) {
    return (
      <div
        className="vh-100 vw-100 d-flex flex-column align-items-center justify-content-center p-4"
        style={{ backgroundColor: "#000" }}
      >
        <Alert variant="danger" className="w-100" style={{ maxWidth: 600 }}>
          {error}
        </Alert>
        <Button variant="outline-light" onClick={() => navigate("/result")}>
          Go Back
        </Button>
      </div>
    );
  }

  if (!report) {
    return (
      <div
        className="vh-100 vw-100 d-flex flex-column align-items-center justify-content-center p-4"
        style={{ backgroundColor: "#000" }}
      >
        <div className="text-center">
          <div className="spinner-border text-info mb-3" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
          <p className="text-white">Generating your palm reading...</p>
        </div>
      </div>
    );
  }

  const { data } = report;
  const { palm_reading_detail } = data;

  return (
    <div className="vw-100 d-flex flex-column p-4">
      <Stars />
      <div className="absolute inset-0 overflow-hidden ">
        {stars.map((star, i) => (
          <div
            key={i}
            className="absolute bg-white rounded-full animate-pulse"
            style={{
              width: `${star.size}px`,
              height: `${star.size}px`,
              opacity: star.opacity,
              top: `${star.y}%`,
              left: `${star.x}%`,
              animationDelay: `${Math.random() * 3}s`,
              animationDuration: `${2 + Math.random() * 2}s`,
            }}
          />
        ))}
      </div>
      {/* Header */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <button
          className="btn text-white"
          onClick={() => navigate("/result")}
          style={{ fontSize: "1rem", position: "relative", zIndex: 1000 }}
        >
          ← Back
        </button>
        {/* <button
          className="btn  text-white"
          onClick={() => window.location.reload()}
          style={{ fontSize: '1.2rem' }}
        >
          ↻
        </button> */}
      </div>

      {/* Title */}
      {/* <div className="text-center mb-4">
        <h2 className="fw-bold text-white">Palm Reading Report</h2>
        <p className="text-white">
          Generated on: {new Date(data.reading_timestamp).toLocaleString()}
        </p>
      </div> */}

      <div className="d-flex flex-column align-items-center justify-content-center mb-4">
        {/* User Image and Name */}
        <div className="text-center">
          {username && <h2 className="text-white mt-3">{username}</h2>}
          <h6 className="text-white mt-4">Face Analysis</h6>
        </div>
      </div>

      {/* Image Preview */}
      <div className="d-flex justify-content-center mb-4">
        <img
          src={data.image_url}
          alt="Uploaded Palm"
          className="img-fluid rounded"
          style={{ maxWidth: "80%", maxHeight: "300px", objectFit: "contain" }}
        />
      </div>

      {/* Report Sections */}
      <Container>
        <Row>
          {/* <Col md={6}> */}
          {/* <Card className="mb-4" style={{ backgroundColor: '#121212', border: '1px solid #333',color:"#ffffff",height:""}}>
              <Card.Body>
                <Card.Title>Hand Shape</Card.Title>
                <Card.Text>{palm_reading_detail.hand_shape}</Card.Text>
              </Card.Body>
            </Card> */}

          {/* <Card className="mb-4" style={{ backgroundColor: '#121212', border: '1px solid #333',color:"#ffffff" }}>
              <Card.Body>
                <Card.Title>Finger Analysis</Card.Title>
                <Card.Text>{palm_reading_detail.finger_analysis}</Card.Text>
              </Card.Body>
            </Card>

            <Card className="mb-4" style={{ backgroundColor: '#121212', border: '1px solid #333',color:"#ffffff"}}>
              <Card.Body>
                <Card.Title>Palm Lines</Card.Title>
                <Card.Text>{palm_reading_detail.palm_lines}</Card.Text>
              </Card.Body>
            </Card>

            <Card className="mb-4" style={{ backgroundColor: '#121212', border: '1px solid #333',color:"#ffffff" }}>
              <Card.Body>
                <Card.Title>Characteristics</Card.Title>
                <Card.Text>{palm_reading_detail.characteristics}</Card.Text>
              </Card.Body>
            </Card> */}
          {/* </Col> */}

          <Col md={12}>
            {palm_reading_detail.personality_traits && (
              <>
                <Card.Title className="mb-3">Personality Traits</Card.Title>
                <Card
                  className="mb-4"
                  style={{
                    background:
                      "linear-gradient(180deg, rgba(42, 22, 159, 0.3) 0%, rgba(145, 174, 232, 0.3) 100%)",
                    color: "white",
                  }}
                >
                  <Card.Body>
                    <ul className="list-unstyled">
                      {palm_reading_detail.personality_traits.map(
                        (trait, i) => (
                          <li key={i} className="mb-2">
                            {trait}
                          </li>
                        )
                      )}
                    </ul>
                  </Card.Body>
                </Card>
              </>
            )}

            {palm_reading_detail.life_patterns && (
              <>
                <Card.Title className="mb-3">Life Patterns</Card.Title>
                <Card
                  className="mb-4"
                  style={{
                    background:
                      "linear-gradient(180deg, rgba(42, 22, 159, 0.3) 0%, rgba(145, 174, 232, 0.3) 100%)",
                    color: "white",
                  }}
                >
                  <Card.Body>
                    <ul className="list-unstyled">
                      {palm_reading_detail.life_patterns.map((pattern, i) => (
                        <li key={i} className="mb-2">
                          {pattern}
                        </li>
                      ))}
                    </ul>
                  </Card.Body>
                </Card>
              </>
            )}

            {palm_reading_detail.career_insights && (
              <>
                <Card.Title className="mb-3">Career Insights</Card.Title>
                <Card
                  className="mb-4"
                  style={{
                    background:
                      "linear-gradient(180deg, rgba(42, 22, 159, 0.3) 0%, rgba(145, 174, 232, 0.3) 100%)",
                    color: "white",
                  }}
                >
                  <Card.Body>
                    <ul className="list-unstyled">
                      {palm_reading_detail.career_insights.map((insight, i) => (
                        <li key={i} className="mb-2">
                          {insight}
                        </li>
                      ))}
                    </ul>
                  </Card.Body>
                </Card>
              </>
            )}

            {palm_reading_detail.health_observations && (
              <>
                <Card.Title className="mb-3">Health Observations</Card.Title>
                <Card
                  className="mb-4"
                  style={{
                    background:
                      "linear-gradient(180deg, rgba(42, 22, 159, 0.3) 0%, rgba(145, 174, 232, 0.3) 100%)",
                    color: "white",
                  }}
                >
                  <Card.Body>
                    <ul className="list-unstyled">
                      {palm_reading_detail.health_observations.map((obs, i) => (
                        <li key={i} className="mb-2">
                          {obs}
                        </li>
                      ))}
                    </ul>
                  </Card.Body>
                </Card>
              </>
            )}

            {/* <Card className="mb-4" style={{ backgroundColor: '#121212', border: '1px solid #333',color:"#ffffff"}}>
              <Card.Body>
                <Card.Title>Spiritual Guidance</Card.Title>
                <ul className="list-unstyled">
                  {palm_reading_detail.spiritual_guidance.map((guide, i) => (
                    <li key={i} className="mb-2">
                      <Badge bg="info" className="me-2">•</Badge>
                      {guide}
                    </li>
                  ))}
                </ul>
              </Card.Body>
            </Card> */}
          </Col>
        </Row>

        {/* Raw Analysis */}
        <Card.Title className="mb-3">Raw Analysis</Card.Title>
        <Card
          className="mb-4"
          style={{
            background:
              "linear-gradient(180deg, rgba(42, 22, 159, 0.3) 0%, rgba(145, 174, 232, 0.3) 100%)",
            color: "white",
          }}
        >
          <Card.Body>
            <pre
              className="text-white p-3 rounded"
              style={{
                whiteSpace: "pre-wrap",
                fontFamily: "sans-serif",
                overflowWrap: "break-word",
                fontSize: "16px",
                lineHeight: "2",
              }}
            >
              {data.raw_analysis
                ?.split("\n")
                .filter((line) => !/^[=-]+\s*$/.test(line)) // Remove lines with only = or -
                .map((line) => {
                  // Replace *text* with <strong>text</strong> for bold
                  const formattedLine = line.replace(
                    /\*(.*?)\*/g,
                    "<strong>$1</strong>"
                  );
                  // Use dangerouslySetInnerHTML to render HTML
                  return (
                    <span dangerouslySetInnerHTML={{ __html: formattedLine }} />
                  );
                })
                .map((line, index) => (
                  <span key={index}>
                    {line}
                    <br />
                  </span>
                )) || ""}
            </pre>

            {/* <pre className="bg-dark text-white p-3 rounded" style={{ whiteSpace: 'pre-wrap', fontFamily: 'monospace' }}>
              {data.raw_analysis}
            </pre> */}
          </Card.Body>
        </Card>

        {/* Footer */}
        {/* <div className="d-flex justify-content-center mt-4">
          <Button variant="outline-light" onClick={() => navigate('/')}>
            ← Start Over
          </Button>
        </div> */}
      </Container>
    </div>
  );
};

export default PalmReadingReportPage;
