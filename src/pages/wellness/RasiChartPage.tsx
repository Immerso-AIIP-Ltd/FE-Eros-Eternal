// RasiChartPage.tsx
import React, { useEffect, useState } from "react";
import "./RasiChartPage.css";
import {
  Container,
  Row,
  Col,
  Card,
  Button,
  Spinner,
  Alert,
} from "react-bootstrap";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Download, Eye, RefreshCw } from "lucide-react";
import Stars from "@/components/ui/stars";
import ChartImage from "@/components/charts/ChartImage";
import { baseApiUrl } from "@/config/api";

// Define proper types
interface ChartImage {
  // original?: string;
  inline?: string;
  attachment?: string;
}

interface AstrologyResponse {
  success: boolean;
  message: string;
  data: {
    astrologyData?: string; // The API returns this as a string
    chartImages?: {
      rasiChart: ChartImage;
      navamshaChart: ChartImage;
    };
  };
}

const RasiChartPage: React.FC = () => {
  const [data, setData] = useState<AstrologyResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  const fetchAstrologyData = async (opts?: { isRefresh?: boolean }) => {
    const isRefresh = Boolean(opts?.isRefresh);
    try {
      if (isRefresh) {
        setRefreshing(true);
        setError(null);
      } else {
        setLoading(true);
      }
      const user_id = localStorage.getItem("user_id");
      const placeOfBirth =
        localStorage.getItem("place_of_birth") || "Chennai, India";
      let dateOfBirth = localStorage.getItem("date_of_birth") || "07/04/2002";
      const timeOfBirth = localStorage.getItem("time_of_birth") || "01:55";

      if (!placeOfBirth || !dateOfBirth || !timeOfBirth) {
        throw new Error(
          "Missing birth details. Please complete your profile first.",
        );
      }

      // Normalize date to dd/mm/yyyy (API requirement)
      dateOfBirth = normalizeDateToDDMMYYYY(dateOfBirth);

      const payload = {
        user_id,
        location: placeOfBirth,
        dob: dateOfBirth,
        tob: timeOfBirth,
        timezone: "5:30",
      };

      const response = await fetch(
        `${baseApiUrl}/api/v1/vedastro/get_astrology_data`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        },
      );

      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const result = await response.json();

      if (!result.success)
        throw new Error(result.message || "Failed to fetch data");

      const api = result.data;
      const apiCharts = api?.chartImages;
      const rasiInline = apiCharts?.rasiChart?.inline?.trim() ?? "";
      const navInline = apiCharts?.navamshaChart?.inline?.trim() ?? "";

      // Prefer structured chartImages.inline from API (Rasi D1 / Navamsha D9)
      if (rasiInline || navInline) {
        const transformedResult: AstrologyResponse = {
          ...result,
          data: {
            ...(api ?? {}),
            chartImages: {
              rasiChart: {
                inline: rasiInline,
                attachment:
                  apiCharts?.rasiChart?.attachment?.trim() || rasiInline,
              },
              navamshaChart: {
                inline: navInline,
                attachment:
                  apiCharts?.navamshaChart?.attachment?.trim() || navInline,
              },
            },
          },
        };
        setData(transformedResult);
      } else if (api?.astrologyData) {
        // Fallback: parse markdown/text in astrologyData for URLs
        const astrologyText = api.astrologyData;
        const rasiMatch = astrologyText.match(
          /Rasi D1 Chart URL:\s*(https?:\/\/[^\s\n]+)/,
        );
        const navamshaMatch = astrologyText.match(
          /Navamsha D9 Chart URL:\s*(https?:\/\/[^\s\n]+)/,
        );
        const rasiUrl = rasiMatch?.[1]?.trim() ?? "";
        const navamshaUrl = navamshaMatch?.[1]?.trim() ?? "";

        const transformedResult: AstrologyResponse = {
          ...result,
          data: {
            ...(api ?? {}),
            chartImages: {
              rasiChart: { inline: rasiUrl, attachment: rasiUrl },
              navamshaChart: {
                inline: navamshaUrl,
                attachment: navamshaUrl,
              },
            },
          },
        };
        setData(transformedResult);
      } else {
        setData(result);
      }
    } catch (err) {
      console.error("Fetch error:", err);
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      if (isRefresh) setRefreshing(false);
      else setLoading(false);
    }
  };

  function normalizeDateToDDMMYYYY(input: string): string {
    const trimmed = input.trim();
    // Already dd/mm/yyyy
    if (/^\d{1,2}\/\d{1,2}\/\d{4}$/.test(trimmed)) {
      return trimmed;
    }
    // yyyy-mm-dd (ISO / input type="date")
    if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
      const [year, month, day] = trimmed.split("-");
      return `${day}/${month}/${year}`;
    }
    // dd-mm-yyyy
    if (/^\d{1,2}-\d{1,2}-\d{4}$/.test(trimmed)) {
      const [day, month, year] = trimmed.split("-");
      return `${day}/${month}/${year}`;
    }
    const cleaned = trimmed.replace(/[\.\s]/g, "/");
    if (/^\d{1,2}\/\d{1,2}\/\d{4}$/.test(cleaned)) {
      return cleaned;
    }
    console.warn("Unrecognized date format:", input);
    return trimmed;
  }

  useEffect(() => {
    fetchAstrologyData();
  }, []);

  // ✅ Fixed download function with null checks
  const downloadImage = (url: string | undefined, filename: string) => {
    if (!url) {
      alert("Chart URL not available");
      return;
    }

    const cleanUrl = url.trim();

    // Handle data URLs
    if (cleanUrl.startsWith("data:")) {
      const link = document.createElement("a");
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
        if (!response.ok) throw new Error("Network response was not ok");
        return response.blob();
      })
      .then((blob) => {
        const link = document.createElement("a");
        link.href = URL.createObjectURL(blob);
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(link.href);
      })
      .catch((err) => {
        console.error("Download error:", err);
        alert("Failed to download image. Try opening in new tab.");
      });
  };

  const [stars] = useState(() =>
    Array.from({ length: 80 }, () => ({
      x: Math.random() * 100,
      y: Math.random() * 100,
      opacity: 0.15 + Math.random() * 0.25,
      size: Math.random() * 1.5 + 0.5,
    })),
  );

  // === Loading State ===
  if (loading) {
    return (
      <div
        className="tarot-container d-flex flex-column min-vh-100 min-vw-100 text-white"
        style={{
          // backgroundColor: '#000',
          backgroundColor: "#FFFFFF",
          color: "#000",
          position: "fixed",
          top: 0,
          left: 0,
          zIndex: 1050,
        }}
      >
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {stars.map((star, i) => (
            <div
              key={i}
              className="absolute rounded-full animate-pulse"
              style={{
                width: `${star.size}px`,
                height: `${star.size}px`,
                opacity: star.opacity * 0.4,
                top: `${star.y}%`,
                left: `${star.x}%`,
                background: "#60A5FA",
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
                width: "3rem",
                height: "3rem",
                borderWidth: "0.25em",
              }}
            />
            <div
              className="position-absolute top-50 start-50 translate-middle"
              style={{
                width: "4.5rem",
                height: "4.5rem",
                borderRadius: "50%",
                boxShadow: "0 0 0 0 rgba(0, 184, 248, 0.4)",
                animation: "pulse 2s infinite",
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
      <div
        className="vh-100 d-flex flex-column align-items-center justify-content-center p-4"
        style={{ backgroundColor: "#000" }}
      >
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
      <div
        className="vh-100 d-flex flex-column align-items-center justify-content-center"
        style={{ backgroundColor: "#000" }}
      >
        <Alert variant="warning">
          <div>No chart data available.</div>
          <div className="mt-2 small">
            <pre
              style={{
                textAlign: "left",
                maxHeight: "200px",
                overflow: "auto",
              }}
            >
              {JSON.stringify(data, null, 2)}
            </pre>
          </div>
        </Alert>
        <Button variant="outline-light" onClick={() => navigate(-1)}>
          ← Go Back
        </Button>
      </div>
    );
  }

  const username = localStorage.getItem("username");
  const dob = localStorage.getItem("date_of_birth");
  const tob = localStorage.getItem("time_of_birth");
  const birthPlace = localStorage.getItem("place_of_birth");

  const { rasiChart, navamshaChart } = data.data.chartImages;

  // ✅ DEBUG: Log the chart objects
  console.log("=== RENDERING CHARTS ===");
  console.log("rasiChart object:", rasiChart);
  console.log("rasiChart.inline:", rasiChart?.inline);
  console.log("navamshaChart object:", navamshaChart);
  console.log("navamshaChart.inline:", navamshaChart?.inline);

  // ✅ Additional safety check before rendering
  if (!rasiChart || !navamshaChart) {
    return (
      <div
        className="vh-100 d-flex flex-column align-items-center justify-content-center"
        style={{ backgroundColor: "#000" }}
      >
        <Alert variant="warning">
          <div>Chart data is incomplete.</div>
          <div className="mt-2 small">
            rasiChart exists: {rasiChart ? "Yes" : "No"}
            <br />
            navamshaChart exists: {navamshaChart ? "Yes" : "No"}
          </div>
        </Alert>
        <Button variant="outline-light" onClick={() => navigate(-1)}>
          ← Go Back
        </Button>
      </div>
    );
  }

  return (
    <div
      className="rasi-chart-page vh-100 vw-100 p-4"
      style={{ backgroundColor: "#FFFFFF", color: "#000" }}
    >
      {/* Header — Figma: back arrow + title left, refresh right */}
      <header className="rasi-chart-top-bar">
        <button
          type="button"
          className="rasi-chart-back"
          onClick={() => navigate(-1)}
          aria-label="Go back"
        >
          <ArrowLeft
            className="rasi-chart-back-icon"
            size={22}
            strokeWidth={1.75}
          />
          <span className="rasi-chart-back-title">Rasi Chart</span>
        </button>
        <button
          type="button"
          className="rasi-chart-refresh"
          onClick={() => fetchAstrologyData({ isRefresh: true })}
          disabled={refreshing}
          aria-label="Refresh charts"
        >
          <RefreshCw
            size={20}
            strokeWidth={1.75}
            className={refreshing ? "rasi-chart-refresh-spin" : ""}
          />
        </button>
      </header>

      <div className="rasi-chart-user-info d-flex flex-column align-items-center justify-content-center mb-3">
        <h3>{username}</h3>
        <p>
          {dob}, {tob}, {birthPlace}
        </p>
      </div>

      <Container
        fluid
        className="rasi-chart-cards-wrapper flex-grow-1 d-flex flex-column"
        style={{ minHeight: 0 }}
      >
        <Row className="g-4">
          {/* Rasi Chart */}
          <Col md={6} className="rasi-chart-card">
            <Card
              className="h-100"
              style={{ backgroundColor: "#FFFFFF", color: "#000" }}
            >
              <Card.Body className="d-flex flex-column">
                <Card.Title className="text-center" style={{ color: "#000" }}>
                  Rasi Chart
                </Card.Title>
                <p className=" text-center" style={{ color: "#000" }}>
                  Individual Chart
                </p>
                <div className="chart-iframe-wrapper flex-grow-1 d-flex align-items-center justify-content-center p-2">
                  {rasiChart?.inline ? (
                    <div className="w-100 h-100 d-flex flex-column align-items-center justify-content-center">
                      <ChartImage
                        src={rasiChart.inline}
                        alt="Rasi Chart"
                        className="rasi-chart-img"
                        onLoad={() =>
                          console.log("✅ Rasi chart loaded successfully")
                        }
                      />
                    </div>
                  ) : (
                    <div className="text-center">
                      <div className="text-muted mb-3">Chart not available</div>
                      <div className="small text-info">
                        No Rasi chart URL found in response
                      </div>
                    </div>
                  )}
                </div>
                <div className="btn-group-row mt-3 d-flex justify-content-end">
                  <Button
                    variant="outline-info"
                    size="sm"
                    className="me-2"
                    onClick={() =>
                      rasiChart?.inline &&
                      window.open(rasiChart.inline.trim(), "_blank")
                    }
                    disabled={!rasiChart?.inline}
                  >
                    <Eye />
                  </Button>
                  <Button
                    variant="info"
                    size="sm"
                    onClick={() =>
                      downloadImage(rasiChart?.attachment, "rasi_chart.svg")
                    }
                    disabled={!rasiChart?.attachment}
                  >
                    <Download />
                  </Button>
                </div>
              </Card.Body>
            </Card>
          </Col>

          {/* Navamsha Chart */}
          <Col md={6} className="rasi-chart-card">
            <Card
              className="h-100"
              style={{ backgroundColor: "#FFFFFF", color: "#000" }}
            >
              <Card.Body className="d-flex flex-column">
                <Card.Title className=" text-center" style={{ color: "#000" }}>
                  Navamsha Chart
                </Card.Title>
                <p className=" text-center" style={{ color: "#000" }}>
                  Life Partner Chart
                </p>
                <div className="chart-iframe-wrapper flex-grow-1 d-flex align-items-center justify-content-center p-2">
                  {navamshaChart?.inline ? (
                    <div className="w-100 h-100 d-flex flex-column align-items-center justify-content-center">
                      <ChartImage
                        src={navamshaChart.inline}
                        alt="Navamsha Chart"
                        className="rasi-chart-img"
                        onLoad={() =>
                          console.log("✅ Navamsha chart loaded successfully")
                        }
                      />
                    </div>
                  ) : (
                    <div className="text-center">
                      <div className="text-muted mb-3">Chart not available</div>
                      <div className="small text-info">
                        No Navamsha chart URL found in response
                      </div>
                    </div>
                  )}
                </div>
                <div className="btn-group-row mt-3 d-flex justify-content-end">
                  <Button
                    variant="outline-info"
                    size="sm"
                    className="me-2"
                    onClick={() =>
                      navamshaChart?.inline &&
                      window.open(navamshaChart.inline.trim(), "_blank")
                    }
                    disabled={!navamshaChart?.inline}
                  >
                    <Eye />
                  </Button>
                  <Button
                    variant="info"
                    size="sm"
                    onClick={() =>
                      downloadImage(
                        navamshaChart?.attachment,
                        "navamsha_chart.svg",
                      )
                    }
                    disabled={!navamshaChart?.attachment}
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
