import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: import.meta.env.VITE_OPENAI_API_KEY || process.env.OPENAI_API_KEY,
  dangerouslyAllowBrowser: true // For client-side usage
});

export interface HealthData {
  vitals: {
    heartRate: { value: number; unit: string; status: string };
    signalQuality: { value: number; percentage: number; status: string };
    breathingRate: { value: number; unit: string; status: string };
  };
  hrv: {
    sdnn: { value: number; unit: string; status: string };
    rmssd: { value: number; unit: string; status: string };
    pnn50: { value: number; unit: string; status: string };
    pnn20: { value: number; unit: string; status: string };
  };
  stress: {
    level: string;
    index: number;
  };
  metadata: {
    scanDurationSeconds: number;
    timestamp: string;
    reportLanguage?: string;
    locale?: string;
  };
}

export interface AIReport {
  summary: string;
  insights: string[];
  recommendations: string[];
  riskFactors: string[];
  disclaimer: string;
}

export async function generateHealthReport(data: HealthData): Promise<AIReport> {
  const wantsGujarati = data.metadata.reportLanguage === 'gu' || data.metadata.locale === 'gu-IN';
  const languageInstruction = wantsGujarati
    ? 'Write the entire JSON response values in Gujarati. Keep JSON keys exactly in English.'
    : 'Write the JSON response values in English.';
  const prompt = `Analyze this health scan data and provide a comprehensive report:

VITALS:
- Heart Rate: ${data.vitals.heartRate.value} ${data.vitals.heartRate.unit} (${data.vitals.heartRate.status})
- Signal Quality: ${data.vitals.signalQuality.percentage}% (${data.vitals.signalQuality.status})
- Breathing Rate: ${data.vitals.breathingRate.value} ${data.vitals.breathingRate.unit} (${data.vitals.breathingRate.status})

HEART / RECOVERY PATTERN METRICS (time-domain wellness indicators—not medical diagnostics):
- SDNN: ${data.hrv.sdnn.value} ${data.hrv.sdnn.unit} (${data.hrv.sdnn.status})
- RMSSD: ${data.hrv.rmssd.value} ${data.hrv.rmssd.unit} (${data.hrv.rmssd.status})
- pNN20: ${data.hrv.pnn20.value} ${data.hrv.pnn20.unit} (${data.hrv.pnn20.status})
- pNN50: ${data.hrv.pnn50.value} ${data.hrv.pnn50.unit} (${data.hrv.pnn50.status})

RELAXATION / RECOVERY (wellness screening score—not clinical stress testing):
- Legacy level label (from device): ${data.stress.level}
- Relaxation / recovery score (/100): ${data.stress.index}

CONTEXT: This is an AI-powered preventive wellness screening pathway. Prefer language about recovery patterns,
relaxation indicators, and trend screening—not definitive medical diagnosis.

SCAN METADATA:
- Duration: ${data.metadata.scanDurationSeconds} seconds
- Time: ${data.metadata.timestamp}
- Output language: ${wantsGujarati ? 'Gujarati (gu-IN)' : 'English (en-US)'}

Provide a JSON response with this structure:
{
  "summary": "2-3 sentence overall health summary",
  "insights": ["4-5 key health insights based on the data"],
  "recommendations": ["4-5 actionable health recommendations"],
  "riskFactors": ["0-3 potential risk factors if any"],
  "disclaimer": "Medical disclaimer text"
}

${languageInstruction}`;

  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content:
            'You summarize preventive wellness screening from AI-derived wellness indicators only. BP/HR/recovery-pattern numbers are not medical measurements. Use terms like relaxation, recovery pattern, and trend screening—not definitive diagnoses. Encourage verification with clinical assessment and diagnostics. Always include disclaimers; this is not medical advice.',
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      response_format: { type: 'json_object' },
      temperature: 0.7,
      max_tokens: 1000
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      throw new Error('No response from OpenAI');
    }

    return JSON.parse(content) as AIReport;
  } catch (error) {
    console.error('Failed to generate AI report:', error);
    // Return fallback report
    return generateFallbackReport(data);
  }
}

// ============================================
// PER-SECTION GPT INSIGHTS
// ============================================

export interface SectionInsights {
  timeDomain: string;
  nonlinear: string;
  stressRespiratory: string;
}

export interface SectionInsightsInput {
  language?: string;
  locale?: string;
  heartRate: number;
  heartRateStatus: string;
  signalQuality: number;
  breathingRate: number;
  breathingRateStatus: string;
  sdnn: number;
  sdnnStatus: string;
  rmssd: number;
  rmssdStatus: string;
  pnn50: number;
  pnn50Status: string;
  pnn20: number;
  pnn20Status: string;
  rrIntervalCount: number;
  recordingClass: string;
  // Nonlinear wellness indicators
  sd1?: number;
  sd2?: number;
  sd1Sd2Ratio?: number;
  sampleEntropy?: number | null;
  dfaAlpha1?: number | null;
  // Stress & respiratory
  stressLevel: string;
  stressIndex: number;
  sympathovagalBalance?: number | null;
  breathingRateSd?: number;
  breathingStability?: string;
  breathCyclesDetected?: number;
}

export async function generateSectionInsights(data: SectionInsightsInput): Promise<SectionInsights> {
  const wantsGujarati = data.language === 'gu' || data.locale === 'gu-IN';
  const languageInstruction = wantsGujarati
    ? 'Write all JSON values in Gujarati. Keep JSON keys exactly as timeDomain, nonlinear, stressRespiratory.'
    : 'Write all JSON values in English.';
  const prompt = `You interpret preventive wellness screening data (NOT medical diagnostics). Preferred language: recovery pattern, relaxation score, wellness trends.

SECTION 1 — RECOVERY PATTERN (time-domain indicators):
- Heart rate (wellness): ${data.heartRate} BPM (${data.heartRateStatus})
- SDNN: ${data.sdnn} ms (${data.sdnnStatus})
- RMSSD: ${data.rmssd} ms (${data.rmssdStatus})
- pNN20: ${data.pnn20}% (${data.pnn20Status})
- pNN50: ${data.pnn50}% (${data.pnn50Status})
- RR intervals captured: ${data.rrIntervalCount}
- Recording: ${data.recordingClass}

SECTION 2 — RECOVERY PATTERN (nonlinear indicators):
- SD1: ${data.sd1 ?? 'N/A'} ms
- SD2: ${data.sd2 ?? 'N/A'} ms
- SD1/SD2 Ratio: ${data.sd1Sd2Ratio ?? 'N/A'}
- Sample Entropy: ${data.sampleEntropy ?? 'N/A'}
- DFA Alpha1: ${data.dfaAlpha1 ?? 'N/A'}

SECTION 3 — RELAXATION / RECOVERY & BREATHING:
- Legacy level label (sensor): ${data.stressLevel}
- Relaxation / recovery score (/100): ${data.stressIndex}
- Sympathovagal balance: ${data.sympathovagalBalance ?? 'N/A'}
- Breathing: ${data.breathingRate} breaths/min (${data.breathingRateStatus}); SD ${data.breathingRateSd ?? 'N/A'}; stability ${data.breathingStability ?? 'N/A'}; cycles ${data.breathCyclesDetected ?? 'N/A'}

Do not analyse VLF, LF, HF, or LF/HF ratio.

Respond in JSON with ONLY: timeDomain, nonlinear, stressRespiratory (each 2–3 sentences).
${languageInstruction}`;

  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content:
            'Explain wellness-screening summaries only. Never diagnose. Use recovery / relaxation wording. Mention clinical + device validation for concerns.',
        },
        { role: 'user', content: prompt },
      ],
      response_format: { type: 'json_object' },
      temperature: 0.7,
      max_tokens: 600,
    });

    const content = response.choices[0]?.message?.content;
    if (!content) throw new Error('No response');
    const parsed = JSON.parse(content) as Record<string, string>;
    return {
      timeDomain: typeof parsed.timeDomain === 'string' ? parsed.timeDomain : '',
      nonlinear: typeof parsed.nonlinear === 'string' ? parsed.nonlinear : '',
      stressRespiratory:
        typeof parsed.stressRespiratory === 'string' ? parsed.stressRespiratory : '',
    };
  } catch (error) {
    console.error('Failed to generate section insights:', error);
    return generateFallbackSectionInsights(data);
  }
}

function generateFallbackSectionInsights(data: SectionInsightsInput): SectionInsights {
  const wantsGujarati = data.language === 'gu' || data.locale === 'gu-IN';
  if (wantsGujarati) {
    return {
      timeDomain: `રિકવરી પેટર્ન સ્નેપશોટ: SDNN આશરે ${data.sdnn.toFixed(1)} ms અને RMSSD આશરે ${data.rmssd.toFixed(1)} ms. આ વેલનેસ સ્તરના સૂચકાંકો છે, ક્લિનિકલ HRV ટેસ્ટનો વિકલ્પ નથી.`,
      nonlinear: 'નોનલિનિયર સૂચકાંકો ટ્રેન્ડ સમજવા માટે ધબકારા વચ્ચેના ફેરફારની રચના દર્શાવે છે. આ ક્લિનિકલ નિદાન માટે નથી.',
      stressRespiratory: `રિલેક્સેશન / રિકવરી સ્કોર ${data.stressIndex}/100 છે. શ્વાસ દર ${data.breathingRate} breaths/min છે; ચિંતા હોય તો PHC ડિવાઇસથી ચકાસો.`,
    };
  }
  const rmssdDesc =
    data.rmssd < 20 ? 'on the lower side for this modality' : data.rmssd < 40 ? 'moderate' : 'relatively favourable';
  const sdnnDesc =
    data.sdnn < 30 ? 'limited for this snapshot' : data.sdnn < 100 ? 'typical illustrative band' : 'elevated for this snapshot';

  return {
    timeDomain: `Recovery-pattern snapshot: SDNN ~${data.sdnn.toFixed(1)} ms (${sdnnDesc}), RMSSD ~${data.rmssd.toFixed(1)} ms (${rmssdDesc}). These are wellness-level markers—not substitutes for clinical HRV testing.`,
    nonlinear: `Nonlinear indicators describe shape complexity of beat-to-beat variation for trend awareness only.`,
    stressRespiratory: `Relaxation / recovery score context: ${data.stressIndex}/100 (legacy sensor label "${data.stressLevel}"). Breathing ${data.breathingRate} breaths/min. Cross-check onsite if concerns.`,
  };
}

function generateFallbackReport(data: HealthData): AIReport {
  const wantsGujarati = data.metadata.reportLanguage === 'gu' || data.metadata.locale === 'gu-IN';
  const hr = data.vitals.heartRate.value;
  const hrStatus = data.vitals.heartRate.status;
  const stressLevel = data.stress.level;
  if (wantsGujarati) {
    return {
      summary: `પ્રિવેન્ટિવ વેલનેસ સ્નેપશોટ: હાર્ટ રેટ ${hr} BPM (${hrStatus}); રિકવરી પેટર્ન સૂચકાંકો વેલનેસ સ્તરના છે, મેડિકલ નિદાન નથી. રિલેક્સેશન સ્કોર ${data.stress.index}/100 છે.`,
      insights: [
        `હાર્ટ રેટ ટ્રેન્ડ: ${hr} BPM (${hrStatus})`,
        `SDNN આશરે ${data.hrv.sdnn.value} ms - વેલનેસ સૂચક`,
        `RMSSD આશરે ${data.hrv.rmssd.value} ms - વેલનેસ સૂચક`,
        `રિલેક્સેશન / રિકવરી સ્કોર ${data.stress.index}/100; જરૂર પડે તો ક્લિનિકલ ચકાસણી કરો`,
        `કેપ્ચર ગુણવત્તા આશરે ${data.vitals.signalQuality.percentage}% (${data.vitals.signalQuality.status})`,
      ],
      recommendations: [
        'યોગ્ય હોય ત્યારે નિયમિત હળવી શારીરિક પ્રવૃત્તિ ચાલુ રાખો',
        'શ્વાસ કસરત અને આરામનો સમય રિકવરીમાં મદદરૂપ થઈ શકે છે',
        'સરખામણી માટે સમાન પ્રકાશ અને પોઝ્ચરમાં ફરી સ્કેન કરો',
        'PHCમાં ઉપલબ્ધ BP/શુગર/SpO2 જેવા ડિવાઇસથી ચકાસણી કરો',
        'લક્ષણો અથવા અસામાન્ય ક્લિનિકલ વાઇટલ્સ હોય તો આરોગ્યકર્મીનો સંપર્ક કરો',
      ],
      riskFactors:
        hrStatus === 'HIGH' || hrStatus === 'LOW'
          ? [`આ વેલનેસ સ્ક્રીનમાં હાર્ટ રેટ "${hrStatus}" છે - ક્લિનિકલ પુષ્ટિ કરાવો`]
          : [],
      disclaimer:
        'BP, HR અને HRV જેવા આઉટપુટ વેલનેસ સૂચકાંકો છે, મેડિકલ માપદંડ નથી. આ મેડિકલ સલાહ નથી.',
    };
  }
  
  return {
    summary: `Preventive wellness snapshot: heart rate ${hr} BPM (${hrStatus}); recovery-pattern indicators are wellness-level—not medical diagnostics. Relaxation-score context (${data.stress.index}/100, legacy sensor label "${stressLevel}") is for screening narratives only.`,
    insights: [
      `Heart-rate trend (wellness): ${hrStatus.toLowerCase()} at ${hr} BPM`,
      `Recovery-pattern marker SDNN (~${data.hrv.sdnn.value} ms) — illustrative, non-diagnostic`,
      `Recovery-pattern marker RMSSD (~${data.hrv.rmssd.value} ms) — illustrative, non-diagnostic`,
      `Relaxation / recovery score ${data.stress.index}/100 from onboard analytics; verify with clinician if concerned`,
      `Capture quality ~${data.vitals.signalQuality.percentage}% (${data.vitals.signalQuality.status.toLowerCase()})`,
    ],
    recommendations: [
      'Maintain regular cardiovascular-friendly movement where appropriate',
      'Use breathwork and downtime to support subjective recovery',
      'Repeat scans under stable lighting and posture for comparable trends',
      'Follow up with onsite diagnostics where camps provide BP/glucose/etc.',
      'Consult a healthcare provider for symptoms or abnormal clinical vitals',
    ],
    riskFactors:
      hrStatus === 'HIGH' || hrStatus === 'LOW'
        ? [`Marked heart-rate band "${hrStatus}" on this wellness screen—seek clinical confirmation`]
        : [],
    disclaimer:
      'BP, HR and HRV-like outputs are wellness indicators, not medical measurements. Not medical advice.',
  };
}
