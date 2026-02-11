import React, { useEffect, useState } from 'react';
import { Card, Button, Container, Row, Col, Alert, Badge } from 'react-bootstrap';
import { useLocation, useNavigate } from 'react-router-dom';

const FaceAnalyseReport: React.FC = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const [report, setReport] = useState<any>(null);
    const [error, setError] = useState<string | null>(null);
    const [uploadedImage, setUploadedImage] = useState<string | null>(null);
    const [username, setUsername] = useState<string>('');

    useEffect(() => {
        if (location.state && location.state.success) {
            setReport(location.state);
            // Get uploaded image from location state
            if (location.state.uploadedImage) {
                setUploadedImage(location.state.uploadedImage);
            }
        } else {
            setError('No report data found. Please upload a face image first.');
        }

        // Get username from localStorage
        const storedUsername = localStorage.getItem('username');
        if (storedUsername) {
            setUsername(storedUsername);
        }
    }, [location.state]);

    if (error) {
        return (
            <div className="vh-100 vw-100 d-flex flex-column align-items-center justify-content-center p-4" style={{ background: "linear-gradient(to bottom, #E0F2FE 0%, #F0F9FF 40%, #FFFFFF 60%)" }}>
                <Alert variant="danger" className="w-100" style={{ maxWidth: 600 }}>
                    {error}
                </Alert>
                <Button variant="outline-dark" onClick={() => navigate('/')}>
                    Go Back
                </Button>
            </div>
        );
    }

    if (!report) {
        return (
            <div className="vh-100 vw-100 d-flex flex-column align-items-center justify-content-center p-4" style={{ background: "linear-gradient(to bottom, #E0F2FE 0%, #F0F9FF 40%, #FFFFFF 60%)" }}>
                <div className="text-center">
                    <div className="spinner-border text-info mb-3" role="status">
                        <span className="visually-hidden">Loading...</span>
                    </div>
                    <p>Analyzing your face...</p>
                </div>
            </div>
        );
    }

    const { data } = report;

    return (
        <div className="vw-100 d-flex flex-column p-4" style={{
            background: "linear-gradient(to bottom, #E0F2FE 0%, #F0F9FF 40%, #FFFFFF 60%)",
            minHeight: "100vh",
            color: "#000"
        }}>
            {/* Header */}
            <div className="d-flex justify-content-between align-items-center mb-4">
                <button
                    className="btn"
                    onClick={() => navigate("/result")}
                    style={{ fontSize: '1rem', position: 'relative', zIndex: 1000 }}
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
            <div className="d-flex flex-column align-items-center justify-content-center mb-4">
                {/* User Image and Name */}
                {uploadedImage && (
                    <div className="text-center">
                        <img
                            src={uploadedImage}
                            alt="Uploaded face"
                            style={{
                                width: '150px',
                                height: '150px',
                                borderRadius: '50%',
                                objectFit: 'cover',
                                border: '3px solid #ccc'
                            }}
                        />
                        {username && (
                            <h2 className="mt-3">{username}</h2>
                        )}
                        <h6 className="mt-4">Face Analysis</h6>
                    </div>
                )}
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
                        {/* <Card.Title className='mb-5'>Spiritual Interpretation & Wellness Guidance</Card.Title> */}
                        <Card className="mb-4" style={{
                            backgroundColor: "#ffffff",
                            color: "#000",
                        }}>
                            <Card.Body>

                                <pre
                                    className="p-3 rounded"
                                    style={{
                                        whiteSpace: 'pre-wrap',
                                        fontFamily: 'sans-serif',
                                        overflowWrap: 'break-word',
                                        fontSize: '16px',
                                        lineHeight: '2'
                                    }}
                                >
                                    {data.spiritual_interpretation
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

export default FaceAnalyseReport;