// PalmReadingReportPage.tsx
import React, { useEffect, useState } from "react";
import { Button, Container, Row, Col, Alert } from "react-bootstrap";
import { useLocation, useNavigate } from "react-router-dom";
import "./PalmReport.css";

type PalmReadingDetail = {
  hand_shape?: string | null;
  finger_analysis?: string | null;
  palm_lines?: string | null;
  characteristics?: string | null;
  personality_traits?: string[] | null;
  life_patterns?: string[] | null;
  career_insights?: string[] | null;
  health_observations?: string[] | null;
  spiritual_guidance?: string[] | null;
};

type PalmReportState = {
  success?: boolean;
  data?: {
    image_url?: string;
    raw_analysis?: string;
    palm_reading_detail?: PalmReadingDetail;
  };
};

type DetailSectionKey = keyof PalmReadingDetail;

const PALM_DETAIL_SECTIONS: { key: DetailSectionKey; label: string }[] = [
  { key: "hand_shape", label: "Hand shape" },
  { key: "finger_analysis", label: "Finger analysis" },
  { key: "palm_lines", label: "Palm lines" },
  { key: "characteristics", label: "Characteristics" },
  { key: "personality_traits", label: "Personality traits" },
  { key: "life_patterns", label: "Life patterns" },
  { key: "career_insights", label: "Career insights" },
  { key: "health_observations", label: "Health observations" },
  { key: "spiritual_guidance", label: "Spiritual guidance" },
];

function getDetailSectionPayload(
  detail: PalmReadingDetail,
  key: DetailSectionKey,
):
  | { kind: "prose"; text: string }
  | { kind: "list"; items: string[] }
  | null {
  const v = detail[key];
  if (v == null) return null;
  if (typeof v === "string") {
    const t = v.trim();
    return t ? { kind: "prose", text: t } : null;
  }
  if (Array.isArray(v)) {
    const items = v
      .filter((x) => typeof x === "string" && String(x).trim())
      .map((x) => String(x).trim());
    return items.length ? { kind: "list", items } : null;
  }
  return null;
}

type VisibleDetailSection = {
  key: DetailSectionKey;
  label: string;
  payload: { kind: "prose"; text: string } | { kind: "list"; items: string[] };
};

function buildVisibleDetailSections(
  detail: PalmReadingDetail,
): VisibleDetailSection[] {
  const out: VisibleDetailSection[] = [];
  for (const sec of PALM_DETAIL_SECTIONS) {
    const payload = getDetailSectionPayload(detail, sec.key);
    if (!payload) continue;
    out.push({ key: sec.key, label: sec.label, payload });
  }
  return out;
}

/** Same grid rule as Relationship Compatibility: first two full width, then pairs (md=6). */
function detailColMd(idx: number, total: number): number {
  if (total <= 0) return 12;
  if (idx < 2) return 12;
  const rest = total - 2;
  if (rest % 2 === 1 && idx === total - 1) return 12;
  return 6;
}

/** Strip leading `*` / `-` list markers from API lines (prose, not bullets). */
function normalizeProseLine(line: string): string {
  return line
    .replace(/^\*\s+/, "")
    .replace(/^-\s+/, "")
    .trim();
}

/** `**bold**` then paired `*italic*` (e.g. disclaimer). */
function formatBoldAndItalic(line: string): string {
  if (!line) return "";
  const t = normalizeProseLine(line);
  return t
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/\*([^*]+?)\*/g, "<em>$1</em>");
}

/**
 * Respect API newlines: `\n\n` = new paragraph, `\n` = line break inside paragraph.
 * No auto bullet lists — prose only.
 */
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

const PalmReadingReportPage: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [report, setReport] = useState<PalmReportState | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [username, setUsername] = useState<string>("");

  useEffect(() => {
    const state = location.state as { success?: boolean } | null;
    if (state && state.success) {
      setReport(location.state as PalmReportState);
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

  if (!report?.data) {
    return (
      <div
        className="palm-report-page min-vh-100 d-flex flex-column align-items-center justify-content-center"
        style={{ backgroundColor: "#fff", padding: "clamp(16px, 4vw, 24px)" }}
      >
        <div className="text-center">
          <div className="spinner-border text-secondary mb-3" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
          <p className="text-dark">Generating your palm reading...</p>
        </div>
      </div>
    );
  }

  const { data } = report;
  const detail: PalmReadingDetail = data.palm_reading_detail ?? {};
  const visibleSections = buildVisibleDetailSections(detail);

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
                  <h2 className="palm-tile__title">Palm Analysis</h2>
                </header>
              </article>
            </Col>

            <Col xs={12}>
              <article className="palm-tile--media mb-3">
                <div className="palm-tile__body palm-tile__body--media">
                  <div className="palm-report-image-wrap d-flex justify-content-center">
                    <img
                      src={data.image_url}
                      alt="Uploaded palm for analysis"
                      className="palm-report-image img-fluid"
                    />
                  </div>
                </div>
              </article>
            </Col>
          </Row>

          <div className="palm-report-detail-grid">
            <Row className="g-3">
              {visibleSections.map((entry, idx) => (
                <Col
                  xs={12}
                  md={detailColMd(idx, visibleSections.length)}
                  key={entry.key}
                >
                  <article className="palm-tile palm-tile--report-section palm-tile--compat-grid h-100">
                    <header className="palm-tile__head">
                      <h2 className="palm-tile__title">{entry.label}</h2>
                      <div className="palm-tile__divider" aria-hidden />
                    </header>
                    <div className="palm-tile__body">
                      {entry.payload.kind === "prose" ? (
                        renderApiProse(entry.payload.text)
                      ) : (
                        <ul className="palm-detail-bullets palm-detail-bullets--compat">
                          {entry.payload.items.map((item, i) => (
                            <li key={i}>{item}</li>
                          ))}
                        </ul>
                      )}
                    </div>
                  </article>
                </Col>
              ))}
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

export default PalmReadingReportPage;
