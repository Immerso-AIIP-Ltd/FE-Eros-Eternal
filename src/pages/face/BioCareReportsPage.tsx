import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Activity,
  CalendarDays,
  FileText,
  HeartPulse,
  LogOut,
  Plus,
  RefreshCw,
  ShieldCheck,
} from "lucide-react";
import ErosClinicLogo from "@/assets/images/eros-wellness-ai-clinic-cropped.png";
import { usePhcSession } from "@/context/PhcSessionContext";
import { formatIstDateTime } from "@/lib/dateTime";
import { getPhcCopy } from "@/i18n/phcCopy";
import {
  getBioCareReport,
  listBioCareReports,
  type BioCareReportListItem,
} from "@/lib/phcApi";
import type { CombinedReportData } from "@/types/rppg";

function getReportTimestamp(item: BioCareReportListItem) {
  return item.scan_timestamp || "";
}

function asCombinedReport(raw: unknown): CombinedReportData | null {
  if (!raw || typeof raw !== "object") return null;
  const data = raw as Record<string, any>;
  if (data.success && data.rppg) return data as CombinedReportData;
  if (data.report_data) return asCombinedReport(data.report_data);
  if (data.rppg) {
    return {
      success: true,
      uploadedImage: "",
      data: {
        face_analysis_text: "",
        spiritual_interpretation: "",
      },
      rppg: data.rppg,
      aiReport: data.ai_report ?? data.aiReport,
      sectionInsights: data.section_insights ?? data.sectionInsights,
      apiHealthData: data.api_health_data ?? data.apiHealthData,
      rppgSignals: data.rppg_signals ?? data.rppgSignals,
    } as CombinedReportData;
  }
  return null;
}

const BioCareReportsPage: React.FC = () => {
  const navigate = useNavigate();
  const {
    language,
    patient,
    setBioCareReport,
    resetPatientFlow,
  } = usePhcSession();
  const t = getPhcCopy(language);
  const [reports, setReports] = useState<BioCareReportListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [openingId, setOpeningId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const sortedReports = useMemo(() => {
    return [...reports].sort((a, b) => {
      const left = new Date(getReportTimestamp(a)).getTime();
      const right = new Date(getReportTimestamp(b)).getTime();
      return (Number.isFinite(right) ? right : 0) - (Number.isFinite(left) ? left : 0);
    });
  }, [reports]);

  const loadReports = async () => {
    if (!patient?.userId) return;
    setLoading(true);
    setError(null);
    try {
      const result = await listBioCareReports(patient.userId);
      setReports(result);
    } catch (err) {
      console.error("Failed to load Bio Care reports:", err);
      setError(t.reportLoadFailed);
      setReports([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!patient?.userId) {
      navigate("/profile", { replace: true });
      return;
    }
    loadReports();
  }, [navigate, patient?.userId]);

  const startNewScan = () => {
    setBioCareReport(null);
    navigate("/facescan");
  };

  const openReport = async (item: BioCareReportListItem) => {
    if (!patient?.userId) return;
    setOpeningId(item.report_id);
    setError(null);
    try {
      let report = asCombinedReport(item.report_data);
      if (!report) {
        const detail = await getBioCareReport(patient.userId, item.report_id);
        report = asCombinedReport(detail);
      }
      if (!report) throw new Error("Invalid report payload");
      setBioCareReport(report);
      navigate("/face-report", { state: report });
    } catch (err) {
      console.error("Failed to open Bio Care report:", err);
      setError(t.reportOpenFailed);
    } finally {
      setOpeningId(null);
    }
  };

  const handleNextPerson = () => {
    resetPatientFlow();
    navigate("/profile", { replace: true });
  };

  return (
    <div className="phc-history-root">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Montserrat:wght@700;800&family=DM+Sans:wght@400;500;700;800&display=swap');

        .phc-history-root {
          min-height: 100vh;
          width: 100vw;
          background:
            linear-gradient(135deg, rgba(240,249,255,0.96), rgba(255,255,255,0.98)),
            radial-gradient(circle at top left, rgba(0,184,248,0.14), transparent 36%);
          color: #0f172a;
          font-family: 'DM Sans', system-ui, -apple-system, BlinkMacSystemFont, sans-serif;
          padding: 28px;
          overflow-x: hidden;
        }

        .phc-history-shell {
          width: min(1120px, 100%);
          margin: 0 auto;
        }

        .phc-history-topbar {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 16px;
          margin-bottom: 22px;
        }

        .phc-history-brand,
        .phc-history-icon-btn {
          border: 1px solid #dbeafe;
          background: #ffffff;
          color: #0369a1;
          border-radius: 10px;
          padding: 0 14px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          font-weight: 700;
          cursor: pointer;
          box-shadow: 0 8px 22px rgba(15,23,42,0.06);
        }

        .phc-history-icon-btn {
          height: 42px;
        }

        .phc-history-brand {
          cursor: default;
          width: 190px;
          min-height: 76px;
          padding: 10px 18px;
          overflow: hidden;
        }

        .phc-history-brand img {
          width: auto;
          max-width: 100%;
          height: 58px;
          display: block;
          object-fit: contain;
        }

        .phc-history-top-actions {
          display: flex;
          align-items: center;
          justify-content: flex-end;
          gap: 10px;
          flex-wrap: wrap;
        }

        .phc-history-hero {
          display: grid;
          grid-template-columns: minmax(0, 1.5fr) minmax(280px, 0.75fr);
          gap: 18px;
          align-items: stretch;
          margin-bottom: 18px;
        }

        .phc-history-panel {
          background: #ffffff;
          border: 1px solid rgba(148, 163, 184, 0.20);
          border-radius: 16px;
          box-shadow: 0 18px 45px rgba(15,23,42,0.08);
          padding: 22px;
        }

        .phc-history-kicker {
          color: #0284c7;
          font-size: 0.76rem;
          font-weight: 800;
          text-transform: uppercase;
          letter-spacing: 0.08em;
          margin-bottom: 8px;
        }

        .phc-history-title {
          font-family: 'Montserrat', sans-serif;
          font-size: clamp(1.6rem, 3vw, 2.35rem);
          line-height: 1.08;
          margin: 0 0 10px;
          letter-spacing: 0;
        }

        .phc-history-subtitle {
          color: #64748b;
          font-size: 0.98rem;
          line-height: 1.55;
          max-width: 680px;
          margin: 0;
        }

        .phc-history-patient {
          display: grid;
          gap: 12px;
        }

        .phc-history-patient-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          color: #475569;
          font-size: 0.88rem;
        }

        .phc-history-patient-row strong {
          color: #0f172a;
          text-align: right;
        }

        .phc-history-actions {
          display: flex;
          gap: 12px;
          flex-wrap: wrap;
          margin-top: 18px;
        }

        .phc-history-primary,
        .phc-history-secondary {
          border: none;
          border-radius: 11px;
          min-height: 44px;
          padding: 0 16px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          font-weight: 800;
          cursor: pointer;
        }

        .phc-history-primary {
          color: #ffffff;
          background: linear-gradient(135deg, #00b8f8, #0284c7);
          box-shadow: 0 12px 24px rgba(2,132,199,0.24);
        }

        .phc-history-secondary {
          color: #0369a1;
          background: #e0f2fe;
        }

        .phc-history-error {
          border: 1px solid #fecaca;
          background: #fef2f2;
          color: #b91c1c;
          border-radius: 12px;
          padding: 12px 14px;
          margin-bottom: 16px;
          font-weight: 700;
        }

        .phc-history-list {
          display: grid;
          gap: 12px;
        }

        .phc-history-card {
          background: #ffffff;
          border: 1px solid #e2e8f0;
          border-radius: 14px;
          padding: 16px;
          display: grid;
          grid-template-columns: minmax(0, 1fr) auto;
          align-items: center;
          gap: 16px;
          box-shadow: 0 8px 24px rgba(15,23,42,0.05);
        }

        .phc-history-card-main {
          display: grid;
          gap: 9px;
          min-width: 0;
        }

        .phc-history-card-title {
          display: flex;
          align-items: center;
          gap: 8px;
          color: #0f172a;
          font-weight: 800;
        }

        .phc-history-date {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          color: #64748b;
          font-size: 0.84rem;
        }

        .phc-history-summary {
          color: #475569;
          font-size: 0.9rem;
          line-height: 1.45;
          max-width: 760px;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .phc-history-metrics {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
        }

        .phc-history-chip {
          border-radius: 999px;
          background: #f8fafc;
          border: 1px solid #e2e8f0;
          color: #334155;
          padding: 5px 9px;
          font-size: 0.76rem;
          font-weight: 700;
        }

        .phc-history-open {
          border: none;
          border-radius: 10px;
          background: #0f172a;
          color: #ffffff;
          min-height: 40px;
          padding: 0 14px;
          font-weight: 800;
          cursor: pointer;
          white-space: nowrap;
        }

        .phc-history-open:disabled,
        .phc-history-primary:disabled {
          opacity: 0.62;
          cursor: wait;
        }

        .phc-history-empty {
          background: #ffffff;
          border: 1px dashed #bae6fd;
          border-radius: 16px;
          padding: 34px;
          text-align: center;
          color: #475569;
        }

        .phc-history-empty svg {
          color: #0284c7;
          margin-bottom: 12px;
        }

        @media (max-width: 760px) {
          .phc-history-root { padding: 18px; }
          .phc-history-topbar,
          .phc-history-hero,
          .phc-history-card {
            grid-template-columns: 1fr;
          }
          .phc-history-topbar {
            display: grid;
          }
          .phc-history-card {
            align-items: stretch;
          }
          .phc-history-open {
            width: 100%;
          }
          .phc-history-summary {
            white-space: normal;
          }
          .phc-history-top-actions {
            justify-content: stretch;
          }
          .phc-history-icon-btn {
            flex: 1;
          }
          .phc-history-brand {
            width: 160px;
            min-height: 64px;
            padding: 8px 14px;
          }
          .phc-history-brand img {
            height: 48px;
          }
        }
      `}</style>

      <main className="phc-history-shell">
        <div className="phc-history-topbar">
          <div className="phc-history-brand" aria-label="EROS Wellness AI Clinic">
            <img src={ErosClinicLogo} alt="EROS Wellness AI Clinic" />
          </div>
          <div className="phc-history-top-actions">
            <button type="button" className="phc-history-icon-btn" onClick={loadReports} disabled={loading}>
              <RefreshCw size={17} />
              {t.reportHistory}
            </button>
            <button type="button" className="phc-history-icon-btn" onClick={handleNextPerson}>
              <LogOut size={17} />
              {t.logout}
            </button>
          </div>
        </div>

        <section className="phc-history-hero">
          <div className="phc-history-panel">
            <div className="phc-history-kicker">{t.bioCare}</div>
            <h1 className="phc-history-title">{t.previousReports}</h1>
            <p className="phc-history-subtitle">{t.previousReportsSubtitle}</p>
            <div className="phc-history-actions">
              <button type="button" className="phc-history-primary" onClick={startNewScan}>
                <Plus size={18} />
                {reports.length > 0 ? t.takeNewScan : t.takeFirstScan}
              </button>
              <button type="button" className="phc-history-secondary" onClick={handleNextPerson}>
                {t.nextPerson}
              </button>
            </div>
          </div>

          <aside className="phc-history-panel phc-history-patient">
            <div className="phc-history-patient-row">
              <span>{t.signedInAs}</span>
              <strong>{patient?.username ?? "—"}</strong>
            </div>
            <div className="phc-history-patient-row">
              <span>{t.phoneNumber}</span>
              <strong>{patient?.phoneNumber ?? "—"}</strong>
            </div>
            <div className="phc-history-patient-row">
              <span>{t.reportLanguage}</span>
              <strong>{language === "gu" ? t.gujarati : t.english}</strong>
            </div>
          </aside>
        </section>

        {error && <div className="phc-history-error">{error}</div>}

        {loading ? (
          <div className="phc-history-empty">
            <RefreshCw size={34} />
            <p>{t.loadingReport}</p>
          </div>
        ) : sortedReports.length === 0 ? (
          <div className="phc-history-empty">
            <ShieldCheck size={38} />
            <p>{t.noPreviousReports}</p>
          </div>
        ) : (
          <section className="phc-history-list" aria-label={t.previousReports}>
            {sortedReports.map((item, index) => {
              const metrics = item.metrics ?? {};
              return (
                <article className="phc-history-card" key={item.report_id || `${item.scan_timestamp}-${index}`}>
                  <div className="phc-history-card-main">
                    <div className="phc-history-card-title">
                      <FileText size={18} />
                      {t.bioCareReport}
                    </div>
                    <span className="phc-history-date">
                      <CalendarDays size={15} />
                      {formatIstDateTime(getReportTimestamp(item))}
                    </span>
                    {item.summary && (
                      <p className="phc-history-summary">{item.summary}</p>
                    )}
                    <div className="phc-history-metrics">
                      {metrics.heart_rate !== undefined && (
                        <span className="phc-history-chip">
                          <HeartPulse size={12} /> HR {metrics.heart_rate}
                        </span>
                      )}
                      {metrics.bp_systolic !== undefined && (
                        <span className="phc-history-chip">
                          <Activity size={12} /> BP {metrics.bp_systolic}/{metrics.bp_diastolic ?? "—"}
                        </span>
                      )}
                      {metrics.signal_quality !== undefined && (
                        <span className="phc-history-chip">
                          SQ {metrics.signal_quality}%
                        </span>
                      )}
                    </div>
                  </div>
                  <button
                    type="button"
                    className="phc-history-open"
                    disabled={openingId === item.report_id}
                    onClick={() => openReport(item)}
                  >
                    {openingId === item.report_id ? t.loadingReport : t.openReport}
                  </button>
                </article>
              );
            })}
          </section>
        )}
      </main>
    </div>
  );
};

export default BioCareReportsPage;
