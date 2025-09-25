// RasiChartPage.tsx
import React, { useEffect, useState } from 'react';
import { Container, Row, Col, Card, Button, Spinner, Alert } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import html2canvas from 'html2canvas';

interface AstrologyResponse {
  success: boolean;
  message: string;
  data: {
    chartImages: {
      rasiChart: string; // URL
      navamshaChart: string; // URL
    };
    // Add other fields if needed (e.g., planets, dosha, etc.)
  };
}

const RasiChartPage: React.FC = () => {
  const [data, setData] = useState<AstrologyResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  const fetchAstrologyData = async () => {
    try {
      const placeOfBirth = localStorage.getItem("place_of_birth") || "Chennai, India";
      const dateOfBirth = localStorage.getItem("date_of_birth") || "07/04/2002"; // MM/DD/YYYY
      const timeOfBirth = localStorage.getItem("time_of_birth") || "01:55";

      if (!placeOfBirth || !dateOfBirth || !timeOfBirth) {
        throw new Error("Missing birth details. Please complete your profile first.");
      }

      const payload = {
        location: placeOfBirth,
        dob: dateOfBirth,
        tob: timeOfBirth,
        timezone: "5:30",
      };

      const response = await fetch(
        'http://192.168.29.154:6001/api/v1/vedastro/get_astrology_data',
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

  // Fetch on mount
  useEffect(() => {
    fetchAstrologyData();
  }, []);

  // Download image helper
  const downloadImage = (url: string, filename: string) => {
    fetch(url)
      .then((response) => response.blob())
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
        alert('Failed to download image. Try opening in new tab.');
        console.error('Download error:', err);
      });
  };

  if (loading) {
    return (
      <div 
  className="vh-100 vw-100 d-flex flex-column align-items-center justify-content-center"
  style={{ 
    backgroundColor: '#000',
    position: 'fixed',
    top: 0,
    left: 0,
    zIndex: 1050 // Ensures it stays on top
  }}
>
  <div className="text-center">
    {/* Animated Spinner with Pulse */}
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
      {/* Optional: Add subtle pulsing glow */}
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

    {/* Loading Text with Typing Effect (Optional) */}
    <h5 className="text-white mb-1">Generating your Vedic charts</h5>
    <p className="text-white">
      Analyzing planetary positions... 
    </p>
  </div>
</div>
    );
  }

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

  if (!data?.data?.chartImages) {
    return (
      <div className="vh-100 d-flex flex-column align-items-center justify-content-center" style={{ backgroundColor: '#000' }}>
        <Alert variant="warning">No chart data available.</Alert>
        <Button variant="outline-light" onClick={() => navigate(-1)}>← Go Back</Button>
      </div>
    );
  }

  const { rasiChart, navamshaChart } = data.data.chartImages;


//   const downloadIframeAsImage = async (url: string, filename: string) => {
//   try {
//     // Create a temporary iframe to load the chart
//     const iframe = document.createElement('iframe');
//     iframe.src = url;
//     iframe.style.display = 'none';
//     document.body.appendChild(iframe);

//     iframe.onload = () => {
//       // Wait for iframe to load
//       setTimeout(() => {
//         // Use html2canvas to capture iframe content as image
//         import('html2canvas').then(({ default: html2canvas }) => {
//           html2canvas(iframe.contentDocument?.body || document.body, {
//             scale: 2, // Higher quality
//             backgroundColor: null,
//           })
//             .then((canvas) => {
//               const link = document.createElement('a');
//               link.download = filename;
//               link.href = canvas.toDataURL('image/png');
//               link.click();
//               document.body.removeChild(iframe);
//             })
//             .catch((err) => {
//               alert('Failed to capture image. Try opening in new tab.');
//               console.error('Capture error:', err);
//               document.body.removeChild(iframe);
//             });
//         });
//       }, 1000); // Wait 1 second for content to load
//     };

//     iframe.onerror = () => {
//       alert('Failed to load chart for download.');
//       document.body.removeChild(iframe);
//     };
//   } catch (err) {
//     alert('Download failed. Please try viewing in new tab.');
//     console.error('Download error:', err);
//   }
// };

  return (
    <div className="vh-100 vw-100 p-4" style={{ backgroundColor: '#000', color: 'white' }}>
      {/* Header */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <button
          className="btn btn-link text-white"
          onClick={() => navigate(-1)}
          style={{ fontSize: '1.2rem' }}
        >
          ← Back
        </button>
        <h2 className="mb-0">Rasi & Navamsha Charts</h2>
        <div></div>
      </div>

      <Container fluid>
        <Row className="g-4">
          {/* Rasi Chart */}
        <Col md={6}>
  <Card className="bg-dark text-white border-secondary h-100">
    <Card.Body className="d-flex flex-column">
      <Card.Title className="text-info">Rasi Chart (D1)</Card.Title>
      <div className="flex-grow-1 d-flex align-items-center justify-content-center p-2">
      <iframe
  src={rasiChart}
  title="Rasi Chart"
  width="100%"
  height="400"
  style={{
    border: '2px solid #FF8C00',
    borderRadius: '8px',
    backgroundColor: '#fff',
    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)',
    overflow: 'hidden'
  }}
/>
      </div>
      {/* <div className="mt-3 d-flex justify-content-center">
        <Button
          variant="outline-info"
          size="sm"
          className="me-2"
          onClick={() => window.open(rasiChart, '_blank')}
        >
          View Full
        </Button>
        <Button
          variant="info"
          size="sm"
          onClick={() => downloadIframeAsImage(rasiChart, 'rasi_chart.png')}
        >
          Download
        </Button>
      </div> */}
    </Card.Body>
  </Card>
</Col>

          {/* Navamsha Chart */}
<Col md={6}>
  <Card className="bg-dark text-white border-secondary h-100">
    <Card.Body className="d-flex flex-column">
      <Card.Title className="text-info">Navamsha Chart (D9)</Card.Title>
      <div className="flex-grow-1 d-flex align-items-center justify-content-center p-2">
        <iframe
          src={navamshaChart}
          title="Navamsha Chart"
          width="100%"
          height="400"
          style={{ border: 'none', backgroundColor: '#fff' }}
          sandbox="allow-scripts allow-same-origin"
          onError={(e) => {
            (e.target as HTMLIFrameElement).src = 'https://via.placeholder.com/400x400/333/999?text=Navamsha+Chart+Not+Loaded';
          }}
        />
      </div>
      {/* <div className="mt-3 d-flex justify-content-center">
        <Button
          variant="outline-info"
          size="sm"
          className="me-2"
          onClick={() => window.open(navamshaChart, '_blank')}
        >
          View Full
        </Button>
        <Button
          variant="info"
          size="sm"
          onClick={() => downloadIframeAsImage(navamshaChart, 'navamsha_chart.png')}
        >
          Download
        </Button>
      </div> */}
    </Card.Body>
  </Card>
</Col>
        </Row>
      </Container>
    </div>
  );
};

export default RasiChartPage;