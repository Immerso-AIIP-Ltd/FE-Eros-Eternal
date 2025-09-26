// FaceReadingReportPage.tsx
import React, { useEffect, useState } from 'react';
import { Card, Button, Container, Row, Col, Alert, Badge } from 'react-bootstrap';
import { useLocation, useNavigate } from 'react-router-dom';
import { FaceReadingResponse } from './types'; // Import your type

const FaceReadingReportPage: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [report, setReport] = useState<FaceReadingResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (location.state && (location.state as FaceReadingResponse).success) {
      setReport(location.state as FaceReadingResponse);
    } else {
      setError('No report data found. Please upload a face image first.');
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
          <p className="text-white">Analyzing your face...</p>
        </div>
      </div>
    );
  }

  const { data } = report;

  return (
    <div className="vw-100 d-flex flex-column p-4">
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
        <h2 className="fw-bold text-white">Face Reading Report</h2>
        {/* <p className="text-white">
          Generated for User ID: {data.user_id}
        </p> */}
      </div>

      {/* Face Analysis Text */}
      <Container>
        <Row>
          <Col md={12}>
            {/* <Card className="mb-4" style={{ backgroundColor: '#121212', border: '1px solid #333', color: "#ffffff" }}>
              <Card.Body>
                <Card.Title>Comprehensive Model Analysis</Card.Title>
                <pre className="bg-dark text-white p-3 rounded" style={{ whiteSpace: 'pre-wrap', fontFamily: 'monospace' }}>
                  {data.face_analysis_text}
                </pre>
              </Card.Body>
            </Card> */}

            <Card className="mb-4" style={{ backgroundColor: '#121212', border: '1px solid #333', color: "#ffffff" }}>
              <Card.Body>
                <Card.Title>Spiritual Interpretation & Wellness Guidance</Card.Title>
                <pre
                  className="bg-dark text-white p-3 rounded"
                  style={{
                    whiteSpace: 'pre-wrap',
                    fontFamily: 'sans-serif',
                    overflowWrap: 'break-word',
                    fontSize: '16px',
                    lineHeight: '2'
                  }}
                >
                  {data.raw_analysis
                    ?.split('\n')
                    .filter(line => !/^[=-]+\s*$/.test(line)) // Remove lines with only = or -
                    .map(line => {
                      // Replace *text* with <strong>text</strong> for bold
                      const formattedLine = line.replace(/\*(.*?)\*/g, '<strong>$1</strong>');
                      // Use dangerouslySetInnerHTML to render HTML
                      return <span dangerouslySetInnerHTML={{ __html: formattedLine }} />;
                    })
                    .map((line, index) => (
                      <span key={index}>
                        {line}
                        <br />
                      </span>
                    )) || ''}
                </pre>
              </Card.Body>
            </Card>
          </Col>
        </Row>

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

export default FaceReadingReportPage;