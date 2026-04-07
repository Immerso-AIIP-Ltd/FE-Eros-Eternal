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

function hasStringArrayValue(v: unknown): v is string[] {
  return (
    Array.isArray(v) &&
    v.some((x) => typeof x === "string" && String(x).trim().length > 0)
  );
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

function combineSpiritualGuidance(detail: PalmReadingDetail): string {
  const v = detail.spiritual_guidance;
  if (!hasStringArrayValue(v)) return "";
  return v
    .filter((s) => s && String(s).trim())
    .map((s) => String(s).trim())
    .join("\n\n");
}

/** Line opens a numbered block like `**1. HAND STRUCTURE:**` or `2. Palm Lines:` */
function parseSectionHeaderLine(
  line: string,
): { num: string; titleRaw: string } | null {
  const t = line.trim();
  const m = t.match(/^(\*{0,2})(\d+)\.\s+(.+?)(\*{0,2}):\s*(\*{0,2})?\s*$/);
  if (!m) return null;
  const titleRaw = m[3].replace(/\*+/g, "").trim();
  if (!titleRaw) return null;
  return { num: m[2], titleRaw };
}

function toSectionHeading(num: string, titleRaw: string): string {
  const title = titleRaw
    .split(/\s+/)
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(" ");
  return `${num}. ${title}`;
}

type ParsedSpiritualSection = { num: string; titleRaw: string; body: string };

function parseSpiritualGuidanceSections(combined: string): {
  intro: string;
  sections: ParsedSpiritualSection[];
} {
  const lines = combined.split(/\r?\n/);
  const sections: ParsedSpiritualSection[] = [];
  const introLines: string[] = [];
  let current: { num: string; titleRaw: string; body: string[] } | null =
    null;

  const flush = () => {
    if (current) {
      sections.push({
        num: current.num,
        titleRaw: current.titleRaw,
        body: current.body.join("\n").trim(),
      });
      current = null;
    }
  };

  for (const line of lines) {
    const h = parseSectionHeaderLine(line);
    if (h) {
      flush();
      current = { num: h.num, titleRaw: h.titleRaw, body: [] };
      continue;
    }
    if (!current) introLines.push(line);
    else current.body.push(line);
  }
  flush();

  let intro = introLines.join("\n").trim();
  if (sections.length > 0 && intro) {
    const first = sections[0];
    sections[0] = {
      ...first,
      body: first.body ? `${intro}\n\n${first.body}` : intro,
    };
    intro = "";
  }

  return { intro, sections };
}

/** One stacked tile per numbered section; fallback single tile if no headers found. */
function renderSpiritualGuidanceSectionTiles(
  detail: PalmReadingDetail,
): React.ReactNode {
  const combined = combineSpiritualGuidance(detail);
  if (!combined) return null;

  const { intro, sections } = parseSpiritualGuidanceSections(combined);

  if (sections.length === 0) {
    const body = intro || combined;
    return (
      <Col xs={12} key="spiritual-fallback">
        <article className="palm-tile palm-tile--content-only">
          <div className="palm-tile__body palm-tile__body--solo">
            {renderApiProse(body)}
          </div>
        </article>
      </Col>
    );
  }

  return (
    <>
      {sections.map((sec, idx) => (
        <Col xs={12} key={`${sec.num}-${sec.titleRaw}-${idx}`}>
          <article className="palm-tile">
            <header className="palm-tile__head">
              <h2 className="palm-tile__title">
                {toSectionHeading(sec.num, sec.titleRaw)}
              </h2>
              <div className="palm-tile__divider" aria-hidden />
            </header>
            <div className="palm-tile__body">
              {renderApiProse(sec.body)}
            </div>
          </article>
        </Col>
      ))}
    </>
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
          <Row className="g-4 palm-tile-stack">
            {/* Tile 1 — profile header */}
            <div className="palm-report-user d-flex flex-column align-items-center justify-content-center mb-3 mb-md-4">
              <div className="text-center px-2">
                <h5
                  className="mt-2 mb-0"
                  style={{ color: "#374151", fontWeight: 500 }}
                >
                  Palm Analysis
                </h5>
              </div>
            </div>

            <div className="palm-report-image-wrap d-flex justify-content-center mb-4 mb-md-5">
              <img
                src={data.image_url}
                alt="Uploaded Palm"
                className="palm-report-image img-fluid rounded shadow"
                style={{ border: "1px solid #e5e7eb" }}
              />
            </div>

            {hasStringArrayValue(detail.spiritual_guidance) ? (
              <Col xs={12}>
                <article >
                  <header className="palm-tile__head">
                    <h1 className="palm-tile__title mb-3 pb-3" style={{fontSize: '1.5rem', fontWeight: 700}}>Spiritual Guidance</h1>
                  </header>
                  <div className="palm-tile__body" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                    {renderSpiritualGuidanceSectionTiles(detail)}
                  </div>
                </article>
              </Col>
            ) : null}
          </Row>
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
