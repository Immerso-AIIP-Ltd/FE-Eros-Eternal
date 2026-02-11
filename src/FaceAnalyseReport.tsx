import React, { useEffect, useState } from 'react';
import { Card, Button, Container, Row, Col, Alert, Badge } from 'react-bootstrap';
import { useLocation, useNavigate } from 'react-router-dom';
import Stars from "./components/stars";

const FaceAnalyseReport: React.FC = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const [report, setReport] = useState<any>(null);
    const [error, setError] = useState<string | null>(null);
    const [uploadedImage, setUploadedImage] = useState<string | null>(null);
    const [username, setUsername] = useState<string>('');
    const [stars] = useState(() =>
        Array.from({ length: 50 }, () => ({
            x: Math.random() * 100,
            y: Math.random() * 100,
            opacity: 0.3 + Math.random() * 0.7,
            size: Math.random() * 2 + 1,
        }))
    );

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
                            animationDuration: `${2 + Math.random() * 2}s`
                        }}
                    />
                ))}
            </div>

            {/* Header */}
            <div className="d-flex justify-content-between align-items-center mb-4">
                <button
                    className="btn  text-white"
                    onClick={() => navigate("/result")}
                    style={{ fontSize: '1rem', zIndex: '10' }}
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
                                border: '3px solid #333'
                            }}
                        />
                        {username && (
                            <h2 className="text-white mt-3">{username}</h2>
                        )}
                        <h6 className="text-white mt-4">Face Analysis</h6>
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
                            background:
                                "linear-gradient(180deg, rgba(42, 22, 159, 0.3) 0%, rgba(145, 174, 232, 0.3) 100%)",
                            border: '1px solid grey'
                        }}>
                            <Card.Body>

                                <pre
                                    className="text-white p-3 rounded"
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