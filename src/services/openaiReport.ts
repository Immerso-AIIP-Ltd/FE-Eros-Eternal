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
  };
  stress: {
    level: string;
    index: number;
  };
  metadata: {
    scanDurationSeconds: number;
    timestamp: string;
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
  const prompt = `Analyze this health scan data and provide a comprehensive report:

VITALS:
- Heart Rate: ${data.vitals.heartRate.value} ${data.vitals.heartRate.unit} (${data.vitals.heartRate.status})
- Signal Quality: ${data.vitals.signalQuality.percentage}% (${data.vitals.signalQuality.status})
- Breathing Rate: ${data.vitals.breathingRate.value} ${data.vitals.breathingRate.unit} (${data.vitals.breathingRate.status})

HEART RATE VARIABILITY (HRV):
- SDNN: ${data.hrv.sdnn.value} ${data.hrv.sdnn.unit} (${data.hrv.sdnn.status})
- RMSSD: ${data.hrv.rmssd.value} ${data.hrv.rmssd.unit} (${data.hrv.rmssd.status})
- pNN50: ${data.hrv.pnn50.value} ${data.hrv.pnn50.unit} (${data.hrv.pnn50.status})

STRESS ANALYSIS:
- Stress Level: ${data.stress.level}
- Stress Index: ${data.stress.index}/100

SCAN METADATA:
- Duration: ${data.metadata.scanDurationSeconds} seconds
- Time: ${data.metadata.timestamp}

Provide a JSON response with this structure:
{
  "summary": "2-3 sentence overall health summary",
  "insights": ["4-5 key health insights based on the data"],
  "recommendations": ["4-5 actionable health recommendations"],
  "riskFactors": ["0-3 potential risk factors if any"],
  "disclaimer": "Medical disclaimer text"
}`;

  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: 'You are a health analysis AI. Analyze biometric data and provide insights. Be professional but accessible. Always include appropriate medical disclaimers.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      response_format: { type: 'json_object' },
      temperature: 0.7
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
  frequencyDomain: string;
  nonlinear: string;
  stressRespiratory: string;
}

export interface SectionInsightsInput {
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
  rrIntervalCount: number;
  recordingClass: string;
  // Frequency domain
  vlf?: number;
  lf?: number;
  hf?: number;
  tp?: number;
  lfHfRatio?: number;
  // Nonlinear
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
  const prompt = `You are a health analysis AI. Given these biometric scan results, provide a brief interpretation (2-3 sentences) for EACH section explaining what the user's specific numbers mean for their health.

TIME DOMAIN HRV:
- Heart Rate: ${data.heartRate} BPM (${data.heartRateStatus})
- SDNN: ${data.sdnn} ms (${data.sdnnStatus})
- RMSSD: ${data.rmssd} ms (${data.rmssdStatus})
- pNN50: ${data.pnn50}% (${data.pnn50Status})
- RR Intervals: ${data.rrIntervalCount} collected
- Recording: ${data.recordingClass}

FREQUENCY DOMAIN HRV:
- VLF: ${data.vlf ?? 'N/A'} ms²
- LF: ${data.lf ?? 'N/A'} ms²
- HF: ${data.hf ?? 'N/A'} ms²
- Total Power: ${data.tp ?? 'N/A'} ms²
- LF/HF Ratio: ${data.lfHfRatio ?? 'N/A'}

NONLINEAR HRV:
- SD1: ${data.sd1 ?? 'N/A'} ms (short-term variability)
- SD2: ${data.sd2 ?? 'N/A'} ms (long-term variability)
- SD1/SD2 Ratio: ${data.sd1Sd2Ratio ?? 'N/A'}
- Sample Entropy: ${data.sampleEntropy ?? 'N/A'}
- DFA Alpha1: ${data.dfaAlpha1 ?? 'N/A'}

STRESS & RESPIRATORY:
- Stress Level: ${data.stressLevel}
- Stress Index: ${data.stressIndex}/100
- Sympathovagal Balance: ${data.sympathovagalBalance ?? 'N/A'}
- Breathing Rate: ${data.breathingRate} breaths/min (${data.breathingRateStatus})
- Breathing Rate SD: ${data.breathingRateSd ?? 'N/A'} breaths/min
- Breathing Stability: ${data.breathingStability ?? 'N/A'}
- Breath Cycles: ${data.breathCyclesDetected ?? 'N/A'}

Respond in JSON:
{
  "timeDomain": "2-3 sentence interpretation of the time domain HRV numbers",
  "frequencyDomain": "2-3 sentence interpretation of the frequency domain numbers",
  "nonlinear": "2-3 sentence interpretation of the nonlinear analysis numbers",
  "stressRespiratory": "2-3 sentence interpretation of the stress and respiratory numbers"
}`;

  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: 'You are a health biometrics analyst. Interpret specific scan numbers for the user in plain language. Be concise, specific to their values, and professional. Do not give medical advice — only explain what the numbers indicate.'
        },
        { role: 'user', content: prompt }
      ],
      response_format: { type: 'json_object' },
      temperature: 0.7,
      max_tokens: 600
    });

    const content = response.choices[0]?.message?.content;
    if (!content) throw new Error('No response');
    return JSON.parse(content) as SectionInsights;
  } catch (error) {
    console.error('Failed to generate section insights:', error);
    return generateFallbackSectionInsights(data);
  }
}

function generateFallbackSectionInsights(data: SectionInsightsInput): SectionInsights {
  const rmssdDesc = data.rmssd < 20 ? 'very low, suggesting reduced parasympathetic activity' : data.rmssd < 40 ? 'moderate' : 'healthy';
  const sdnnDesc = data.sdnn < 30 ? 'below normal, indicating limited overall variability' : data.sdnn < 100 ? 'within normal range' : 'high, indicating strong variability';

  return {
    timeDomain: `Your SDNN of ${data.sdnn.toFixed(1)}ms is ${sdnnDesc}. RMSSD of ${data.rmssd.toFixed(1)}ms is ${rmssdDesc}. pNN50 of ${data.pnn50.toFixed(1)}% ${data.pnn50 < 3 ? 'confirms limited beat-to-beat variation' : 'shows normal successive interval differences'}.`,
    frequencyDomain: data.tp && data.tp > 0
      ? `Total spectral power is ${data.tp.toFixed(2)}ms². LF/HF ratio of ${(data.lfHfRatio || 0).toFixed(2)} ${(data.lfHfRatio || 0) > 2 ? 'suggests sympathetic dominance' : (data.lfHfRatio || 0) < 0.5 ? 'suggests parasympathetic dominance' : 'indicates balanced autonomic tone'}.`
      : 'Frequency domain data was limited for this scan. A longer recording may yield more detailed spectral analysis.',
    nonlinear: `SD1 of ${(data.sd1 || 0).toFixed(1)}ms reflects short-term variability, while SD2 of ${(data.sd2 || 0).toFixed(1)}ms captures longer-term patterns. ${data.sampleEntropy !== null && data.sampleEntropy !== undefined ? `Sample entropy of ${data.sampleEntropy.toFixed(3)} indicates ${data.sampleEntropy < 0.5 ? 'low signal complexity' : 'moderate to good complexity'}.` : ''}`,
    stressRespiratory: `Stress level is ${data.stressLevel} with an index of ${data.stressIndex}/100. Breathing rate of ${data.breathingRate} breaths/min is ${data.breathingRateStatus.toLowerCase()}. ${data.breathingStability ? `Breathing stability is ${data.breathingStability}.` : ''}`,
  };
}

function generateFallbackReport(data: HealthData): AIReport {
  const hr = data.vitals.heartRate.value;
  const hrStatus = data.vitals.heartRate.status;
  const stressLevel = data.stress.level;
  
  return {
    summary: `Your scan shows a heart rate of ${hr} BPM (${hrStatus}) with ${stressLevel} stress levels. Overall HRV metrics indicate ${data.hrv.sdnn.status} autonomic function.`,
    insights: [
      `Heart rate is ${hrStatus.toLowerCase()} at ${hr} BPM`,
      `HRV SDNN of ${data.hrv.sdnn.value}ms indicates ${data.hrv.sdnn.status.toLowerCase()} variability`,
      `RMSSD of ${data.hrv.rmssd.value}ms shows ${data.hrv.rmssd.status.toLowerCase()} parasympathetic activity`,
      `Stress analysis reveals ${stressLevel} sympathetic tone`,
      `Signal quality was ${data.vitals.signalQuality.status.toLowerCase()} at ${data.vitals.signalQuality.percentage}%`
    ],
    recommendations: [
      'Maintain regular cardiovascular exercise',
      'Practice stress management techniques',
      'Ensure adequate sleep for recovery',
      'Monitor heart rate trends over time',
      'Consult healthcare provider if symptoms persist'
    ],
    riskFactors: hrStatus === 'HIGH' || hrStatus === 'LOW' ? [`${hrStatus} heart rate detected - consult physician`] : [],
    disclaimer: 'This report is AI-generated for informational purposes only. Not a substitute for professional medical advice. Consult a healthcare provider for medical concerns.'
  };
}
