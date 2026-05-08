import React from "react";

/** Matches “Detailed analysis” paragraph: size + gray body copy. */
const REPORT_BODY_TEXT: React.CSSProperties = {
  color: "#4B5563",
  fontSize: "14px",
  lineHeight: 1.6,
};

/** Normalize API strings that use literal `\n` or `\\n`. */
function normalizeReportNewlines(raw: unknown): string {
  if (raw == null) return "";
  let s = typeof raw === "string" ? raw : String(raw);
  s = s.replace(/\\n/g, "\n").replace(/\r\n/g, "\n");
  return s;
}

/**
 * Renders `/chat/generate_soul_report` (and similar) payloads in the wellness chat.
 * New API: `report_data` with assessment, detailed_analysis, recommendations (vibrational_frequency).
 * Legacy: nested `report` object with dynamic keys.
 */
function formatKey(key: string): string {
  return key.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

function renderValue(val: unknown): React.ReactNode {
  if (val === null || val === undefined) return "";

  if (
    typeof val === "string" ||
    typeof val === "number" ||
    typeof val === "boolean"
  ) {
    return String(val);
  }

  if (Array.isArray(val)) {
    return (
      <ul className="mb-0 ps-3">
        {val.map((item, idx) => (
          <li key={idx}>{renderValue(item)}</li>
        ))}
      </ul>
    );
  }

  if (typeof val === "object") {
    return (
      <div style={{ marginLeft: "8px" }}>
        {Object.entries(val as Record<string, unknown>).map(([k, v]) => (
          <div key={k} className="mb-2">
            <b>{formatKey(k)}:</b>{" "}
            {typeof v === "object" && v !== null ? renderValue(v) : String(v)}
          </div>
        ))}
      </div>
    );
  }

  return String(val);
}

function renderReportDynamic(report: Record<string, unknown>): React.ReactNode {
  return (
    <div style={{ whiteSpace: "pre-wrap" }}>
      {Object.entries(report).map(([key, value]) => (
        <div key={key} className="mb-3">
          <h6 className="fw-semibold">{formatKey(key)}</h6>
          <div>
            {key === "detailed_analysis" && typeof value === "string" ? (
              <div style={{ whiteSpace: "pre-wrap", ...REPORT_BODY_TEXT }}>
                {normalizeReportNewlines(value)}
              </div>
            ) : (
              renderValue(value)
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

function renderVibrationalFrequencyReport(
  rd: Record<string, unknown>,
): React.ReactNode {
  const assessment = (rd.assessment ?? {}) as Record<string, unknown>;
  const recommendations = (rd.recommendations ?? {}) as Record<
    string,
    unknown
  >;
  const practices = recommendations.practices;
  const guidance = recommendations.guidance;
  const considerations = recommendations.considerations;

  return (
    <div className="soul-report-chat text-start small">
      {rd.report_title != null && (
        <h5 className="fw-bold mb-2">{String(rd.report_title)}</h5>
      )}
      {rd.timestamp != null && (
        <div className="text-muted mb-3" style={{ fontSize: "0.85rem" }}>
          {String(rd.timestamp)}
        </div>
      )}

      <h6 className="fw-semibold mt-2 mb-2">Assessment</h6>
      {assessment.vibrational_frequency != null && (
        <p className="mb-2" style={REPORT_BODY_TEXT}>
          <strong className="text-dark">Vibrational frequency:</strong>{" "}
          {String(assessment.vibrational_frequency)}
        </p>
      )}
      {assessment.current_status != null && (
        <p className="mb-2" style={REPORT_BODY_TEXT}>
          <strong className="text-dark">Current status:</strong>{" "}
          {String(assessment.current_status)}
        </p>
      )}
      {assessment.key_metrics != null && (
        <p className="mb-2" style={REPORT_BODY_TEXT}>
          <strong className="text-dark">Key metrics:</strong>{" "}
          {String(assessment.key_metrics)}
        </p>
      )}
      {Array.isArray(assessment.strengths) &&
        (assessment.strengths as unknown[]).length > 0 && (
          <>
            <p className="fw-semibold mb-1" style={{ fontSize: "14px" }}>
              Strengths
            </p>
            <ul className="mb-3 ps-3">
              {(assessment.strengths as unknown[]).map((s, i) => (
                <li key={i} style={REPORT_BODY_TEXT}>
                  {String(s)}
                </li>
              ))}
            </ul>
          </>
        )}
      {Array.isArray(assessment.areas_for_improvement) &&
        (assessment.areas_for_improvement as unknown[]).length > 0 && (
          <>
            <p className="fw-semibold mb-1" style={{ fontSize: "14px" }}>
              Areas for improvement
            </p>
            <ul className="mb-3 ps-3">
              {(assessment.areas_for_improvement as unknown[]).map((s, i) => (
                <li key={i} style={REPORT_BODY_TEXT}>
                  {String(s)}
                </li>
              ))}
            </ul>
          </>
        )}

      {normalizeReportNewlines(rd.detailed_analysis).trim().length > 0 && (
        <>
          <h6 className="fw-semibold mt-2 mb-2">Detailed analysis</h6>
          <div
            className="mb-3"
            style={{ whiteSpace: "pre-wrap", ...REPORT_BODY_TEXT }}
          >
            {normalizeReportNewlines(rd.detailed_analysis)}
          </div>
        </>
      )}

      {(Array.isArray(practices) ||
        Array.isArray(guidance) ||
        Array.isArray(considerations)) && (
        <>
          <h6 className="fw-semibold mt-2 mb-2">Recommendations</h6>
          {Array.isArray(practices) && practices.length > 0 && (
            <>
              <p className="fw-semibold mb-1" style={{ fontSize: "14px" }}>
                Practices
              </p>
              <ul className="mb-2 ps-3">
                {practices.map((s, i) => (
                  <li key={i} style={REPORT_BODY_TEXT}>
                    {String(s)}
                  </li>
                ))}
              </ul>
            </>
          )}
          {Array.isArray(guidance) && guidance.length > 0 && (
            <>
              <p className="fw-semibold mb-1" style={{ fontSize: "14px" }}>
                Guidance
              </p>
              <ul className="mb-2 ps-3">
                {guidance.map((s, i) => (
                  <li key={i} style={REPORT_BODY_TEXT}>
                    {String(s)}
                  </li>
                ))}
              </ul>
            </>
          )}
          {Array.isArray(considerations) && considerations.length > 0 && (
            <>
              <p className="fw-semibold mb-1" style={{ fontSize: "14px" }}>
                Considerations
              </p>
              <ul className="mb-3 ps-3">
                {considerations.map((s, i) => (
                  <li key={i} style={REPORT_BODY_TEXT}>
                    {String(s)}
                  </li>
                ))}
              </ul>
            </>
          )}
        </>
      )}
    </div>
  );
}

function isVibrationalReportData(rd: Record<string, unknown>): boolean {
  const a = rd.assessment as Record<string, unknown> | undefined;
  if (!a) return false;
  return (
    typeof a.vibrational_frequency === "number" ||
    typeof a.current_status === "string" ||
    typeof a.key_metrics === "string"
  );
}

export function soulReportChatContent(apiData: unknown): React.ReactNode {
  if (apiData == null || typeof apiData !== "object") {
    return "Report generated successfully!";
  }

  const p = apiData as Record<string, unknown>;
  const rd = p.report_data ?? p.report;

  if (rd == null || typeof rd !== "object") {
    const msg = p.message;
    return typeof msg === "string" && msg.trim()
      ? msg
      : "Report generated successfully!";
  }

  const reportObj = rd as Record<string, unknown>;
  const rtype = p.report_type;

  if (
    rtype === "vibrational_frequency" ||
    isVibrationalReportData(reportObj)
  ) {
    return renderVibrationalFrequencyReport(reportObj);
  }

  return renderReportDynamic(reportObj);
}
