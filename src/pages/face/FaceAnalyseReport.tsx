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
            if (location.state.uploadedImage) {
                setUploadedImage(location.state.uploadedImage);
            }
        } else {
            setError('No report data found. Please upload a face image first.');
        }

        const storedUsername = localStorage.getItem('username');
        if (storedUsername) {
            setUsername(storedUsername);
        }
    }, [location.state]);

    // Function to parse and categorize the spiritual interpretation
    const parseInterpretation = (text: string) => {
        if (!text) return [];

        const lines = text.split('\n').filter(line => line.trim() && !/^[=-]+\s*$/.test(line));
        const sections: Array<{ title: string; content: string[] }> = [];
        let currentSection: { title: string; content: string[] } | null = null;

        lines.forEach(line => {
            const trimmedLine = line.trim();
            
            // Check if line is a section header (contains ** at start and end or is all caps)
            const isHeader = /^\*\*(.*?)\*\*:?$/.test(trimmedLine) || 
                           (/^[A-Z\s]+:?$/.test(trimmedLine) && trimmedLine.length < 50);
            
            if (isHeader) {
                // Save previous section
                if (currentSection && currentSection.content.length > 0) {
                    sections.push(currentSection);
                }
                
                // Start new section
                const title = trimmedLine.replace(/\*\*/g, '').replace(/:$/, '').trim();
                currentSection = { title, content: [] };
            } else if (currentSection) {
                // Add content to current section
                if (trimmedLine.startsWith('-')) {
                    currentSection.content.push(trimmedLine.substring(1).trim());
                } else if (trimmedLine) {
                    currentSection.content.push(trimmedLine);
                }
            } else {
                // No section yet, create a general one
                if (!currentSection) {
                    currentSection = { title: 'Overview', content: [] };
                }
                if (trimmedLine.startsWith('-')) {
                    currentSection.content.push(trimmedLine.substring(1).trim());
                } else if (trimmedLine) {
                    currentSection.content.push(trimmedLine);
                }
            }
        });

        // Add last section
        if (currentSection && currentSection.content.length > 0) {
            sections.push(currentSection);
        }

        return sections;
    };

    // Function to format text with bold
    const formatText = (text: string) => {
        const formatted = text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
        return <span dangerouslySetInnerHTML={{ __html: formatted }} />;
    };

    if (error) {
        return (
            <div className="vh-100 vw-100 d-flex flex-column align-items-center justify-content-center p-4" 
                 style={{ background: "linear-gradient(to bottom, #E0F2FE 0%, #F0F9FF 40%, #FFFFFF 60%)" }}>
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
            <div className="vh-100 vw-100 d-flex flex-column align-items-center justify-content-center p-4" 
                 style={{ background: "linear-gradient(to bottom, #E0F2FE 0%, #F0F9FF 40%, #FFFFFF 60%)" }}>
                <div className="text-center">
                    <div className="spinner-border text-info mb-3" role="status">
                        <span className="visually-hidden">Loading...</span>
                    </div>
                    <p style={{ color: '#374151' }}>Analyzing your face...</p>
                </div>
            </div>
        );
    }

    const { data } = report;
    const sections = parseInterpretation(data.spiritual_interpretation);

    return (
        <div className="vw-100 d-flex flex-column p-4" style={{
            background: "linear-gradient(to bottom, #E0F2FE 0%, #F0F9FF 40%, #FFFFFF 60%)",
            minHeight: "100vh",
            color: "#000"
        }}>
            {/* Header */}
            <div className="d-flex justify-content-between align-items-center mb-4">
                <button
                    className="btn btn-outline-dark"
                    onClick={() => navigate("/result")}
                    style={{ fontSize: '1rem', position: 'relative', zIndex: 1000 }}
                >
                    ← Back
                </button>
            </div>

            {/* User Info with Image */}
            <div className="d-flex flex-column align-items-center justify-content-center mb-5">
                {uploadedImage && (
                    <div className="text-center">
                        <img
                            src={uploadedImage}
                            alt="Uploaded face"
                            className="shadow"
                            style={{
                                width: '150px',
                                height: '150px',
                                borderRadius: '50%',
                                objectFit: 'cover',
                                border: '3px solid #e5e7eb'
                            }}
                        />
                        {/* {username && (
                            <h2 className="mt-3 fw-bold" style={{ color: '#1f2937' }}>
                                {username}
                            </h2>
                        )} */}
                        <h6 className="mt-2" style={{ color: '#6b7280', fontWeight: 500 }}>
                            Face Analysis
                        </h6>
                    </div>
                )}
            </div>

            {/* Analysis Sections - Tile Design */}
            <Container>
                <Row className="g-4">
                    {sections.map((section, index) => {
                        // Determine if section should be full width or half
                        const isFullWidth = section.content.length > 3 || 
                                          section.content.join(' ').length > 200 ||
                                          section.title.toLowerCase().includes('overview') ||
                                          section.title.toLowerCase().includes('summary');

                        return (
                            <Col key={index} md={isFullWidth ? 12 : 6}>
                                <Card 
                                    className="h-100 shadow-sm"
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
                                            {section.title}
                                        </Card.Title>
                                        
                                        {section.content.length === 1 ? (
                                            // Single paragraph
                                            <p style={{ 
                                                color: '#374151', 
                                                lineHeight: '1.8', 
                                                margin: 0,
                                                fontSize: '1rem'
                                            }}>
                                                {formatText(section.content[0])}
                                            </p>
                                        ) : (
                                            // Multiple items as list
                                            <ul className="list-unstyled mb-0">
                                                {section.content.map((item, idx) => (
                                                    <li 
                                                        key={idx} 
                                                        className="mb-3"
                                                        style={{
                                                            listStyleType: 'disc',
                                                            marginLeft: '20px',
                                                            lineHeight: '1.8',
                                                            color: '#374151',
                                                            fontSize: '1rem'
                                                        }}
                                                    >
                                                        {formatText(item)}
                                                    </li>
                                                ))}
                                            </ul>
                                        )}
                                    </Card.Body>
                                </Card>
                            </Col>
                        );
                    })}

                    {/* If no sections parsed, show full text */}
                    {sections.length === 0 && (
                        <Col md={12}>
                            <Card 
                                className="shadow-sm"
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
                                        Spiritual Interpretation
                                    </Card.Title>
                                    <div style={{
                                        fontSize: "1rem",
                                        lineHeight: "1.8",
                                        color: '#374151'
                                    }}>
                                        {data.spiritual_interpretation
                                            ?.split('\n')
                                            .filter(line => line.trim() && !/^[=-]+\s*$/.test(line))
                                            .map((line, index) => {
                                                const trimmedLine = line.trim();
                                                const isBullet = trimmedLine.startsWith('-');
                                                const cleanLine = isBullet ? trimmedLine.substring(1).trim() : trimmedLine;
                                                const formattedLine = cleanLine.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
                                                
                                                if (isBullet) {
                                                    return (
                                                        <li 
                                                            key={index}
                                                            className="mb-2"
                                                            style={{
                                                                listStyleType: 'disc',
                                                                marginLeft: '20px',
                                                                lineHeight: '1.8'
                                                            }}
                                                        >
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
                                            })}
                                    </div>
                                </Card.Body>
                            </Card>
                        </Col>
                    )}
                </Row>
            </Container>

            <style>{`
                strong {
                    font-weight: 700;
                    color: #1f2937;
                }
                
                ul {
                    padding-left: 0;
                }
                
                li {
                    color: #374151;
                    font-size: 1rem;
                }
                
                .card {
                    transition: transform 0.2s ease, box-shadow 0.2s ease;
                }
                
                .card:hover {
                    transform: translateY(-4px);
                    box-shadow: 0 12px 24px rgba(0, 0, 0, 0.1) !important;
                }
            `}</style>
        </div>
    );
};

export default FaceAnalyseReport;