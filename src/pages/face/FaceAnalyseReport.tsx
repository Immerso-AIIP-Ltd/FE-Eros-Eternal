import React, { useEffect, useState } from "react";
import { Button, Container, Row, Col, Alert } from "react-bootstrap";
import { useLocation, useNavigate } from "react-router-dom";
import "../palm/PalmReport.css";

type FaceAnalyseReportState = {
  success?: boolean;
  data?: {
    spiritual_interpretation?: string;
  };
  uploadedImage?: string;
};

type ParsedSection = { title: string; content: string[] };

type FaceDetailTile = {
  key: string;
  title: string;
  prose?: string;
  items?: string[];
};

/** Same grid rule as palm / compatibility: first two full width, then pairs. */
function detailColMd(idx: number, total: number): number {
  if (total <= 0) return 12;
  if (idx < 2) return 12;
  const rest = total - 2;
  if (rest % 2 === 1 && idx === total - 1) return 12;
  return 6;
}

function normalizeProseLine(line: string): string {
  return line
    .replace(/^\*\s+/, "")
    .replace(/^-\s+/, "")
    .trim();
}

function formatBoldAndItalic(line: string): string {
  if (!line) return "";
  const t = normalizeProseLine(line);
  return t
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/\*([^*]+?)\*/g, "<em>$1</em>");
}

function renderApiProse(text: string | null | undefined): React.ReactNode {
  if (text == null || String(text).trim() === "") return null;
  const paragraphs = String(text).split(/\n\n+/);
  return (
    <div className="palm-prose">
      {paragraphs.map((para, i) => {
        const trimmed = para.trim();
        if (!trimmed) return null;
        const lines = trimmed.split("\n");
        return (
          <p key={i} className="palm-prose-paragraph">
            {lines.map((line, j) => (
              <React.Fragment key={j}>
                {j > 0 ? <br /> : null}
                <span
                  dangerouslySetInnerHTML={{
                    __html: formatBoldAndItalic(line.trim()),
                  }}
                />
              </React.Fragment>
            ))}
          </p>
        );
      })}
    </div>
  );
}

function parseInterpretation(text: string): ParsedSection[] {
  if (!text) return [];

  const lines = text
    .split("\n")
    .filter((line) => line.trim() && !/^[=-]+\s*$/.test(line));
  const sections: ParsedSection[] = [];
  let current: ParsedSection | null = null;

  const flush = () => {
    if (current && current.content.length > 0) {
      sections.push(current);
    }
    current = null;
  };

  for (const line of lines) {
    const trimmedLine = line.trim();
    const isHeader =
      /^\*\*(.*?)\*\*:?$/.test(trimmedLine) ||
      (/^[A-Z][a-z]+(\s[A-Z][a-z]+)*:?$/.test(trimmedLine) &&
        trimmedLine.length < 50);

    if (isHeader) {
      flush();
      const title = trimmedLine
        .replace(/\*\*/g, "")
        .replace(/:$/, "")
        .trim();
      current = { title, content: [] };
    } else if (current) {
      if (trimmedLine.startsWith("-")) {
        current.content.push(trimmedLine.substring(1).trim());
      } else if (trimmedLine) {
        current.content.push(trimmedLine);
      }
    } else {
      if (!current) {
        current = { title: "Overall analysis", content: [] };
      }
      if (trimmedLine.startsWith("-")) {
        current.content.push(trimmedLine.substring(1).trim());
      } else if (trimmedLine) {
        current.content.push(trimmedLine);
      }
    }
  }
  flush();

  return sections;
}

function parsedSectionsToTiles(sections: ParsedSection[]): FaceDetailTile[] {
  return sections.map((s, i) => {
    const key = `${i}-${s.title.replace(/\s+/g, "-").slice(0, 40)}`;
    if (s.content.length === 1) {
      return { key, title: s.title, prose: s.content[0] };
    }
    return { key, title: s.title, items: s.content };
  });
}

function buildFaceDetailTiles(
  spiritualInterpretation: string | undefined,
): FaceDetailTile[] {
  const raw = spiritualInterpretation?.trim() ?? "";
  if (!raw) return [];

  const parsed = parseInterpretation(raw);
  if (parsed.length === 0) {
    return [{ key: "fallback", title: "Spiritual interpretation", prose: raw }];
  }
  return parsedSectionsToTiles(parsed);
}

const FaceAnalyseReport: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [report, setReport] = useState<FaceAnalyseReportState | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [username, setUsername] = useState<string>("");

  useEffect(() => {
    const state = location.state as FaceAnalyseReportState | null;
    if (state?.success) {
      setReport(state);
      if (state.uploadedImage) {
        setUploadedImage(state.uploadedImage);
      }
    } else {
      setError("No report data found. Please upload a face image first.");
    }

    const storedUsername = localStorage.getItem("username");
    if (storedUsername) {
      setUsername(storedUsername);
    }
  }, [location.state]);

  if (error) {
    return (
      <div
        className="palm-report-page min-vh-100 d-flex flex-column align-items-center justify-content-center"
        style={{ backgroundColor: "#fff", padding: "clamp(16px, 4vw, 24px)" }}
      >
        <Alert
          variant="danger"
          className="w-100"
          style={{ maxWidth: "min(600px, 100%)" }}
        >
          {error}
        </Alert>
        <Button
          variant="outline-dark"
          onClick={() => navigate("/result")}
          className="mt-3"
        >
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
          <div className="spinner-border text-secondary mb-3" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
          <p className="text-dark">Analyzing your face...</p>
        </div>
      </div>
    );
  }

  const spiritual = report.data?.spiritual_interpretation;
  const detailTiles = buildFaceDetailTiles(spiritual);

  return (
    <div
      className="palm-report-page d-flex flex-column"
      style={{
        background:
          "linear-gradient(to bottom, #E0F2FE 0%, #F0F9FF 45%, #f8fafc 100%)",
        minHeight: "100vh",
        color: "#0a0a0a",
      }}
    >
      <div className="palm-report-inner flex-grow-1 d-flex flex-column">
        <div className="palm-report-header d-flex justify-content-between align-items-center mb-3">
          <button
            type="button"
            className="btn btn-outline-dark palm-report-back"
            onClick={() => navigate("/result")}
          >
            ← Back
          </button>
        </div>

        <Container fluid className="palm-report-container px-0">
          <Row className="g-3 palm-tile-stack">
            <Col xs={12}>
              <article>
                <header className="palm-tile__head palm-tile__head--center">
                  <h2 className="palm-tile__title">Face Analysis</h2>
                </header>
              </article>
            </Col>

            {uploadedImage ? (
              <Col xs={12}>
                <article className="palm-tile--media mb-3">
                  <div className="palm-tile__body palm-tile__body--media">
                    <div className="face-report-avatar-wrap">
                      <img
                        src={uploadedImage}
                        alt="Uploaded face for analysis"
                        className="face-report-avatar img-fluid"
                      />
                    </div>
                  </div>
                </article>
              </Col>
            ) : null}
          </Row>

          <div className="palm-report-detail-grid">
            <Row className="g-3">
              {detailTiles.length === 0 ? (
                <Col xs={12}>
                  <article className="palm-tile palm-tile--report-section palm-tile--compat-grid h-100">
                    <header className="palm-tile__head">
                      <h2 className="palm-tile__title">Spiritual interpretation</h2>
                      <div className="palm-tile__divider" aria-hidden />
                    </header>
                    <div className="palm-tile__body">
                      <p className="mb-0 text-muted small">
                        No interpretation text was included in this result.
                      </p>
                    </div>
                  </article>
                </Col>
              ) : (
                detailTiles.map((tile, idx) => (
                  <Col
                    xs={12}
                    md={detailColMd(idx, detailTiles.length)}
                    key={tile.key}
                  >
                    <article className="palm-tile palm-tile--report-section palm-tile--compat-grid h-100">
                      <header className="palm-tile__head">
                        <h2 className="palm-tile__title">{tile.title}</h2>
                        <div className="palm-tile__divider" aria-hidden />
                      </header>
                      <div className="palm-tile__body">
                        {tile.prose != null ? (
                          renderApiProse(tile.prose)
                        ) : (
                          <ul className="palm-detail-bullets palm-detail-bullets--compat">
                            {(tile.items ?? []).map((item, i) => (
                              <li key={i}>
                                <span
                                  dangerouslySetInnerHTML={{
                                    __html: formatBoldAndItalic(item),
                                  }}
                                />
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>
                    </article>
                  </Col>
                ))
              )}
            </Row>
          </div>
        </Container>

        <style>{`
        .palm-report-page strong {
          font-weight: 700;
          color: #0a0a0a;
        }
        .palm-report-page em {
          font-style: italic;
          color: #0a0a0a;
        }
        .palm-report-page .palm-prose {
          width: 100%;
          max-width: 100%;
          color: #334155;
        }
        .palm-report-page .palm-prose-paragraph {
          margin: 0 0 1.1rem 0;
          line-height: 1.75;
          font-size: clamp(0.9rem, 2.5vw, 1rem);
        }
        .palm-report-page .palm-prose-paragraph:last-child {
          margin-bottom: 0;
        }
      `}</style>
      </div>
    </div>
  );
};

export default FaceAnalyseReport;
