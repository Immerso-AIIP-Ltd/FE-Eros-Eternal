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
