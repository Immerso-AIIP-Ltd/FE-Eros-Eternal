// PalmReadingReportPage.tsx
import React, { useEffect, useState } from 'react';
import { Card, Button, Container, Row, Col, Badge, Alert } from 'react-bootstrap';
import { useLocation, useNavigate } from 'react-router-dom';
import { PalmReadingResponse } from './types'; // Import your type

const PalmReadingReportPage: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [report, setReport] = useState<PalmReadingResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (location.state && (location.state as PalmReadingResponse).success) {
      setReport(location.state as PalmReadingResponse);
    } else {
      setError('No report data found. Please upload a palm image first.');
    }
  }, [location.state]);

  if (error) {
    return (
      <div className="vh-100 vw-100 d-flex flex-column align-items-center justify-content-center p-4" style={{ backgroundColor: '#000' }}>
        <Alert variant="danger" className="w-100" style={{ maxWidth: 600 }}>
          {error}
        </Alert>
        <Button variant="outline-light" onClick={() => navigate('/')}>
          Go Back
        </Button>
      </div>
    );
  }

  if (!report) {
    return (
      <div className="vh-100 vw-100 d-flex flex-column align-items-center justify-content-center p-4" style={{ backgroundColor: '#000' }}>
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
    <div className="vh-100 vw-100 d-flex flex-column p-4" style={{ backgroundColor: '#000', backgroundImage: 'linear-gradient(45deg, rgba(255,255,255,0.02) 25%, transparent 25%, transparent 75%, rgba(255,255,255,0.02) 75%, rgba(255,255,255,0.02) 25%), linear-gradient(45deg, rgba(255,255,255,0.02) 25%, transparent 25%, transparent 75%, rgba(255,255,255,0.02) 75%, rgba(255,255,255,0.02) 25%)', backgroundSize: '20px 20px' }}>
      {/* Header */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <button
          className="btn btn-link text-white"
          onClick={() => navigate(-1)}
          style={{ fontSize: '1rem' }}
        >
          ← Back
        </button>
        <button
          className="btn btn-link text-white"
          onClick={() => window.location.reload()}
          style={{ fontSize: '1.2rem' }}
        >
          ↻
        </button>
      </div>

      {/* Title */}
      <div className="text-center mb-4">
        <h2 className="fw-bold text-white">Palm Reading Report</h2>
        <p className="text-white">
          Generated on: {new Date(data.reading_timestamp).toLocaleString()}
        </p>
      </div>

      {/* Image Preview */}
      <div className="d-flex justify-content-center mb-4">
        <img
          src={data.image_url}
          alt="Uploaded Palm"
          className="img-fluid rounded"
          style={{ maxWidth: '80%', maxHeight: '300px', objectFit: 'contain' }}
        />
      </div>

      {/* Report Sections */}
      <Container>
        <Row>
          <Col md={6}>
            <Card className="mb-4" style={{ backgroundColor: '#121212', border: '1px solid #333',color:"#ffffff"}}>
              <Card.Body>
                <Card.Title>Hand Shape</Card.Title>
                <Card.Text>{palm_reading_detail.hand_shape}</Card.Text>
              </Card.Body>
            </Card>

            <Card className="mb-4" style={{ backgroundColor: '#121212', border: '1px solid #333',color:"#ffffff" }}>
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
            </Card>
          </Col>

          <Col md={6}>
            <Card className="mb-4" style={{ backgroundColor: '#121212', border: '1px solid #333',color:"#ffffff" }}>
              <Card.Body>
                <Card.Title>Personality Traits</Card.Title>
                <ul className="list-unstyled">
                  {palm_reading_detail.personality_traits.map((trait, i) => (
                    <li key={i} className="mb-2">
                      <Badge bg="info" className="me-2">•</Badge>
                      {trait}
                    </li>
                  ))}
                </ul>
              </Card.Body>
            </Card>

            <Card className="mb-4" style={{ backgroundColor: '#121212', border: '1px solid #333',color:"#ffffff" }}>
              <Card.Body>
                <Card.Title>Life Patterns</Card.Title>
                <ul className="list-unstyled">
                  {palm_reading_detail.life_patterns.map((pattern, i) => (
                    <li key={i} className="mb-2">
                      <Badge bg="info" className="me-2">•</Badge>
                      {pattern}
                    </li>
                  ))}
                </ul>
              </Card.Body>
            </Card>

            <Card className="mb-4" style={{ backgroundColor: '#121212', border: '1px solid #333',color:"#ffffff" }}>
              <Card.Body>
                <Card.Title>Career Insights</Card.Title>
                <ul className="list-unstyled">
                  {palm_reading_detail.career_insights.map((insight, i) => (
                    <li key={i} className="mb-2">
                      <Badge bg="info" className="me-2">•</Badge>
                      {insight}
                    </li>
                  ))}
                </ul>
              </Card.Body>
            </Card>

            <Card className="mb-4" style={{ backgroundColor: '#121212', border: '1px solid #333' ,color:"#ffffff"}}>
              <Card.Body>
                <Card.Title>Health Observations</Card.Title>
                <ul className="list-unstyled">
                  {palm_reading_detail.health_observations.map((obs, i) => (
                    <li key={i} className="mb-2">
                      <Badge bg="info" className="me-2">•</Badge>
                      {obs}
                    </li>
                  ))}
                </ul>
              </Card.Body>
            </Card>

            <Card className="mb-4" style={{ backgroundColor: '#121212', border: '1px solid #333',color:"#ffffff"}}>
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
            </Card>
          </Col>
        </Row>

        {/* Raw Analysis */}
        <Card className="mb-4" style={{ backgroundColor: '#121212', border: '1px solid #333',color:"#ffffff"}}>
          <Card.Body>
            <Card.Title>Raw Analysis</Card.Title>
            <pre className="bg-dark text-white p-3 rounded" style={{ whiteSpace: 'pre-wrap', fontFamily: 'monospace' }}>
              {data.raw_analysis}
            </pre>
          </Card.Body>
        </Card>

        {/* Footer */}
        <div className="d-flex justify-content-center mt-4">
          <Button variant="outline-light" onClick={() => navigate('/')}>
            ← Start Over
          </Button>
        </div>
      </Container>
    </div>
  );
};

export default PalmReadingReportPage;