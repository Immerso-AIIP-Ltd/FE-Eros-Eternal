// RasiChartPage.tsx
import React, { useEffect, useState } from 'react';
import { Container, Row, Col, Card, Button, Spinner, Alert } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import { Eye, Download } from "lucide-react";
import Stars from "./components/stars";

// Define proper types
interface ChartImage {
  original: string;
  inline: string;
  attachment: string;
}

interface AstrologyResponse {
  success: boolean;
  message: string;
  data: {
    chartImages: {
      rasiChart: ChartImage;
      navamshaChart: ChartImage;
    };
    // Add other fields if needed later
  };
}

const RasiChartPage: React.FC = () => {
  const [data, setData] = useState<AstrologyResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  const fetchAstrologyData = async () => {
    try {
      const user_id = localStorage.getItem("user_id");
      const placeOfBirth = localStorage.getItem("place_of_birth") || "Chennai, India";
      let dateOfBirth = localStorage.getItem("date_of_birth") || "07/04/2002";
      const timeOfBirth = localStorage.getItem("time_of_birth") || "01:55";

      if (!placeOfBirth || !dateOfBirth || !timeOfBirth) {
        throw new Error("Missing birth details. Please complete your profile first.");
      }

      // Normalize date to MM/DD/YYYY
      dateOfBirth = normalizeDateToMMDDYYYY(dateOfBirth);

      const payload = {
        user_id,
        location: placeOfBirth,
        dob: dateOfBirth,
        tob: timeOfBirth,
        timezone: "5:30",
      };

      const response = await fetch(
        'http://eros-eternal.runai-project-immerso-innnovation-venture-pvt.inferencing.shakticloud.ai/api/v1/vedastro/get_astrology_data',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        }
      );

      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const result: AstrologyResponse = await response.json();
      if (!result.success) throw new Error(result.message || 'Failed to fetch data');

      setData(result);
    } catch (err) {
      console.error('Fetch error:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  function normalizeDateToMMDDYYYY(input: string): string {
    if (/^\d{1,2}\/\d{1,2}\/\d{4}$/.test(input)) {
      return input;
    }
    if (/^\d{4}-\d{2}-\d{2}$/.test(input)) {
      const [year, month, day] = input.split('-');
      return `${month}/${day}/${year}`;
    }
    if (/^\d{2}-\d{2}-\d{4}$/.test(input)) {
      const [part1, part2, year] = input.split('-');
      return `${part2}/${part1}/${year}`;
    }
    const cleaned = input.replace(/[\.\s]/g, '/');
    if (/^\d{1,2}\/\d{1,2}\/\d{4}$/.test(cleaned)) {
      return cleaned;
    }
    console.warn("Unrecognized date format:", input);
    return input;
  }

  useEffect(() => {
    fetchAstrologyData();
  }, []);

  // ✅ Fixed download function
  const downloadImage = (url: string, filename: string) => {
    const cleanUrl = url.trim();

    // Handle data URLs (though not used here, kept for safety)
    if (cleanUrl.startsWith('')) {
      const link = document.createElement('a');
      link.href = cleanUrl;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      return;
    }

    // Fetch remote URL (SVG in this case)
    fetch(cleanUrl)
      .then((response) => {
        if (!response.ok) throw new Error('Network response was not ok');
        return response.blob();
      })
      .then((blob) => {
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(link.href);
      })
      .catch((err) => {
        console.error('Download error:', err);
        alert('Failed to download image. Try opening in new tab.');
      });
  };

  const [stars] = useState(() =>
    Array.from({ length: 50 }, () => ({
      x: Math.random() * 100,
      y: Math.random() * 100,
      opacity: 0.3 + Math.random() * 0.7,
      size: Math.random() * 2 + 1,
    }))
  );

  // === Loading State ===
  if (loading) {
    return (
      <div
        className='tarot-container d-flex flex-column min-vh-100 min-vw-100 text-white'
        style={{
          backgroundColor: '#000',
          position: 'fixed',
          top: 0,
          left: 0,
          zIndex: 1050
        }}
      >
        <Stars />
        <div className="absolute inset-0 overflow-hidden z-50">
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
        <div className="text-center">
          <div className="mb-4">
            <Spinner
              animation="border"
              variant="info"
              style={{
                width: '3rem',
                height: '3rem',
                borderWidth: '0.25em'
              }}
            />
            <div
              className="position-absolute top-50 start-50 translate-middle"
              style={{
                width: '4.5rem',
                height: '4.5rem',
                borderRadius: '50%',
                boxShadow: '0 0 0 0 rgba(0, 184, 248, 0.4)',
                animation: 'pulse 2s infinite'
              }}
            />
          </div>
          <h5 className="text-white mb-1">Generating your Vedic charts</h5>
          <p className="text-white">Analyzing planetary positions...</p>
        </div>
      </div>
    );
  }

  // === Error State ===
  if (error) {
    return (
      <div className="vh-100 d-flex flex-column align-items-center justify-content-center p-4" style={{ backgroundColor: '#000' }}>
        <Alert variant="danger" className="text-center">
          {error}
        </Alert>
        <Button variant="outline-light" onClick={() => navigate(-1)}>
          ← Go Back
        </Button>
      </div>
    );
  }

  // === No Data State ===
  if (!data?.data?.chartImages) {
    return (
      <div className="vh-100 d-flex flex-column align-items-center justify-content-center" style={{ backgroundColor: '#000' }}>
        <Alert variant="warning">No chart data available.</Alert>
        <Button variant="outline-light" onClick={() => navigate(-1)}>← Go Back</Button>
      </div>
    );
  }

  const username = localStorage.getItem("username");
  const dob = localStorage.getItem("date_of_birth");
  const tob = localStorage.getItem("time_of_birth");
  const birthPlace = localStorage.getItem("place_of_birth");

  const { rasiChart, navamshaChart } = data.data.chartImages;

  return (
    <div className="vh-100 vw-100 p-4" style={{ backgroundColor: '#000', color: 'white' }}>
      {/* Header */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <button
          className="btn btn-link text-white"
          onClick={() => navigate(-1)}
          style={{ fontSize: '1.2rem', textDecoration: 'none' }}
        >
          ← Rasi Chart
        </button>
        {/* <h2 className="mb-5">Rasi & Navamsha Charts</h2> */}
        <div></div>
      </div>

      <div className='d-flex align-items-center justify-content-center mb-3'>
        <h3>{username}</h3>
      </div>

      <div className='d-flex align-items-center justify-content-center mb-5'>
        <p>{dob}, {tob}, {birthPlace}</p>
      </div>

      <Container fluid>
        <Row className="g-4">
          {/* Rasi Chart */}
          <Col md={6}>
            <Card className="bg-dark text-white border-secondary h-100">
              <Card.Body className="d-flex flex-column">
                <Card.Title className="text-white text-center">Rasi Chart</Card.Title>
                <p className="text-white text-center">Individual Chart</p>
                <div className="flex-grow-1 d-flex align-items-center justify-content-center p-2" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <iframe
                    src={rasiChart.inline.trim()}
                    title="Rasi Chart"
                    width="100%"
                    height="600"
                    style={{
                      borderRadius: '8px',
                      overflow: 'hidden',
                      border: 'none'
                    }}
                  />
                </div>
                <div className="mt-3 d-flex justify-content-end">
                  <Button
                    variant="outline-info"
                    size="sm"
                    className="me-2"
                    onClick={() => window.open(rasiChart.inline.trim(), '_blank')}
                  >
                    <Eye />
                  </Button>
                  <Button
                    variant="info"
                    size="sm"
                    onClick={() => downloadImage(rasiChart.attachment.trim(), 'rasi_chart.svg')}
                  >
                    <Download />
                  </Button>
                </div>
              </Card.Body>
            </Card>
          </Col>

          {/* Navamsha Chart */}
          <Col md={6}>
            <Card className="bg-dark text-white border-secondary h-100">
              <Card.Body className="d-flex flex-column">
                <Card.Title className="text-white text-center">Navamsha Chart</Card.Title>
                <p className="text-white text-center">Life Partner Chart</p>
                <div className="flex-grow-1 d-flex align-items-center justify-content-center p-2" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <iframe
                    src={navamshaChart.inline.trim()}
                    title="Navamsha Chart"
                    width="100%"
                    height="600"
                    style={{ border: 'none' }}
                    sandbox="allow-scripts allow-same-origin"
                    onError={(e) => {
                      (e.target as HTMLIFrameElement).src = 'https://via.placeholder.com/400x400/333/999?text=Navamsha+Chart+Not+Loaded';
                    }}
                  />
                </div>
                <div className="mt-3 d-flex justify-content-end">
                  <Button
                    variant="outline-info"
                    size="sm"
                    className="me-2"
                    onClick={() => window.open(navamshaChart.inline.trim(), '_blank')}
                  >
                    <Eye />
                  </Button>
                  <Button
                    variant="info"
                    size="sm"
                    onClick={() => downloadImage(navamshaChart.attachment.trim(), 'navamsha_chart.svg')}
                  >
                    <Download />
                  </Button>
                </div>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </Container>
    </div>
  );
};

export default RasiChartPage;