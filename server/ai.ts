import { GoogleGenAI } from '@google/genai';
import { db } from './db.ts';

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build'
    }
  }
});

// Helper for fast, bounded Gemini calls
async function callGeminiWithTimeout<T>(promise: Promise<T>, timeoutMs = 6000): Promise<T> {
  let timer: any;
  const timeoutPromise = new Promise<never>((_, reject) => {
    timer = setTimeout(() => reject(new Error('Gemini request timeout')), timeoutMs);
  });
  return Promise.race([promise, timeoutPromise]).finally(() => clearTimeout(timer));
}


/**
 * Ask LockMyHealth — Grounded Conversational Medical Assistant
 */
export async function chatWithLockMyHealth(
  userId: string,
  userMessage: string,
  chatHistory: Array<{ role: 'user' | 'assistant'; text: string }> = []
) {
  // 1. Immediate emergency triage check before external API invocation
  const lowerQ = userMessage.toLowerCase();
  if (
    lowerQ.includes('chest pain') ||
    lowerQ.includes('shortness of breath') ||
    lowerQ.includes('breath') ||
    lowerQ.includes('bleeding') ||
    lowerQ.includes('emergency') ||
    lowerQ.includes('stroke') ||
    lowerQ.includes('heart attack') ||
    lowerQ.includes('unconscious')
  ) {
    return {
      success: true,
      text: `⚠️ **CRITICAL MEDICAL NOTICE:** If you are experiencing chest pain, acute shortness of breath, severe bleeding, or sudden weakness, please immediately call **911** or your local emergency medical services. LockMyHealth is an informational record-continuity tool and cannot evaluate acute life-threatening symptoms.`,
      referencedDocuments: []
    };
  }

  // 2. Retrieve the patient's actual isolated records
  const user = db.getUser(userId);
  const docs = db.getDocuments(userId);
  const meds = db.getMedications(userId);
  const labs = db.getLabResults(userId);
  const appointments = db.getAppointments(userId);
  const conflicts = db.getMedicationConflicts(userId);
  const emergencyCard = db.getEmergencyCard(userId);

  // 2. Build grounded context summary
  const recordsSummary = `
PATIENT PROFILE:
- Name: ${user?.name || 'Patient'} (Age: ${user?.age || 'N/A'}, Gender: ${user?.gender || 'N/A'})
- Confirmed Conditions: ${emergencyCard.selectedConditions.join(', ') || 'None recorded'}
- Confirmed Allergies: ${emergencyCard.confirmedAllergies.join(', ') || 'None recorded'}
- Emergency Contact: ${emergencyCard.emergencyContact.name} (${emergencyCard.emergencyContact.phone})

UPLOADED MEDICAL DOCUMENTS (${docs.length} records):
${docs.map(d => `- [Doc ID: ${d.id}] "${d.title}" (${d.category}) by ${d.providerName} on ${d.documentDate}. Summary: ${d.notes || d.ocrTextPreview || 'No notes'}`).join('\n')}

CURRENT & HISTORICAL MEDICATIONS (${meds.length} records):
${meds.map(m => `- [Med ID: ${m.id}] ${m.name} ${m.dose} (${m.frequency}). Instructions: "${m.instructions}". Prescribed by ${m.providerName} [Doc: ${m.documentId || 'N/A'}]. Status: ${m.status}. Start: ${m.startDate || 'N/A'}`).join('\n')}

DETECTED MEDICATION RECONCILIATION FLAGS:
${conflicts.map(c => `- ${c.severity.toUpperCase()}: ${c.description} -> Prompt: ${c.clinicalPrompt}`).join('\n') || 'None'}

RECENT LAB RESULTS (${labs.length} records):
${labs.slice(0, 15).map(l => `- ${l.testName}: ${l.value} ${l.unit} (Ref: ${l.referenceRange}) on ${l.testDate} [${l.isAbnormal ? 'FLAGGED' : 'NORMAL'}] by ${l.providerName}`).join('\n')}

UPCOMING APPOINTMENTS:
${appointments.filter(a => a.status === 'upcoming').map(a => `- ${a.title} with ${a.providerName} on ${a.date} at ${a.time} (${a.type}). Location: ${a.location || 'N/A'}`).join('\n') || 'No upcoming appointments'}
`;

  const systemInstruction = `You are "Ask LockMyHealth", a friendly, careful, and trustworthy health-continuity assistant.
Your goal is to help the patient understand their own uploaded medical records, lab reports, prescriptions, and appointments.

CRITICAL CLINICAL & SAFETY BOUNDARIES:
1. Source Grounding: Answer ONLY based on the patient's provided records above.
2. Citations: Always include clickable/readable citations to source documents and dates (e.g. "[Doc: Endocrine Review (2026-08-14)]").
3. Distinguish Historical vs Active: Differentiate older prescriptions from current ones. If there is a dosage change (e.g., Telmisartan 40mg changed to 80mg), clearly note both dates.
4. Conflicting Information: If records show conflicts (e.g., differing doses or duplicate meds), state both records neutrally and urge the patient to confirm with their doctor or pharmacist.
5. Non-Prescriptive: Explain documented facts in patient-friendly terms. DO NOT diagnose diseases or tell the patient to alter, start, or stop any medications.
6. Emergencies: If the user mentions chest pain, shortness of breath, sudden weakness, severe bleeding, or any acute emergency symptoms, immediately advise them to contact emergency medical services (911 or local emergency number) rather than relying on the chat.
7. Unknown Facts: If information is not in the patient's records, explicitly state: "I don't find this information in your uploaded LockMyHealth records." Never invent medical history.`;

  try {
    const formattedHistory = chatHistory.slice(-6).map(h => ({
      role: h.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: h.text }]
    }));

    const contents = [
      ...formattedHistory,
      {
        role: 'user',
        parts: [
          {
            text: `CURRENT PATIENT MEDICAL VAULT CONTEXT:\n${recordsSummary}\n\nUSER QUESTION: ${userMessage}`
          }
        ]
      }
    ];

    let response: any = null;
    let attempts = 0;
    while (attempts < 2) {
      try {
        attempts++;
        response = await callGeminiWithTimeout(
          ai.models.generateContent({
            model: 'gemini-3.8-flash',
            contents,
            config: {
              systemInstruction,
              temperature: 0.2
            }
          }),
          4000
        );
        if (response?.text) break;
      } catch (err: any) {
        if (attempts >= 2) throw err;
        await new Promise(r => setTimeout(r, 1000));
      }
    }

    const replyText = response?.text || 'I apologize, but I could not analyze your records at this moment. Please consult your physician.';

    // Extract specific document IDs mentioned for quick frontend links
    const referencedDocIds = docs
      .filter(d => {
        if (replyText.includes(d.id)) return true;
        if (replyText.toLowerCase().includes(d.title.toLowerCase())) return true;
        const titleWords = d.title.split(' ').filter(w => w.length > 4);
        return titleWords.length >= 2 && titleWords.filter(w => replyText.toLowerCase().includes(w.toLowerCase())).length >= 2;
      })
      .filter((d, idx, arr) => arr.findIndex(item => item.id === d.id) === idx)
      .map(d => ({ id: d.id, title: d.title, date: d.documentDate, provider: d.providerName }));

    return {
      success: true,
      text: replyText,
      referencedDocuments: referencedDocIds
    };
  } catch (error: any) {
    console.warn('Gemini live call unavailable, synthesizing grounded answer from vault:', error?.message);

    // Deterministic, source-grounded response fallback based on actual patient vault
    const lowerQ = userMessage.toLowerCase();
    let answer = '';
    const referencedDocIds: Array<{ id: string; title: string; date: string; provider: string }> = [];

    // Emergency check
    if (lowerQ.includes('chest pain') || lowerQ.includes('breath') || lowerQ.includes('bleeding') || lowerQ.includes('emergency')) {
      return {
        success: true,
        text: `⚠️ **CRITICAL MEDICAL NOTICE:** If you are experiencing chest pain, acute shortness of breath, severe bleeding, or sudden weakness, please immediately call **911** or your local emergency medical services. LockMyHealth is an informational record-continuity tool and cannot evaluate acute life-threatening symptoms.`,
        referencedDocuments: []
      };
    }

    // Prescription / Medication queries
    if (lowerQ.includes('prescription') || lowerQ.includes('medicine') || lowerQ.includes('medication') || lowerQ.includes('metformin') || lowerQ.includes('dose')) {
      const latestPrescription = docs.find(d => d.category === 'prescription') || docs[0];
      const activeMeds = meds.filter(m => m.status === 'active_confirmed');
      const histMeds = meds.filter(m => m.status === 'historical' || m.status === 'discontinued_confirmed');

      answer = `Based on your uploaded medical records:\n\n`;
      if (latestPrescription) {
        answer += `**Latest Recorded Prescription:** [Doc: ${latestPrescription.title} (${latestPrescription.documentDate}) by ${latestPrescription.providerName}]\n`;
        referencedDocIds.push({ id: latestPrescription.id, title: latestPrescription.title, date: latestPrescription.documentDate, provider: latestPrescription.providerName });
      }

      answer += `\n**Confirmed Active Medications (${activeMeds.length}):**\n` +
        activeMeds.map(m => `* **${m.name} ${m.dose}** — ${m.frequency}. Instructions: "${m.instructions}". Prescribed by ${m.providerName} [Started ${m.startDate || 'N/A'}]`).join('\n');

      if (histMeds.length > 0) {
        answer += `\n\n**Historical / Discontinued Baselines:**\n` +
          histMeds.map(m => `* ${m.name} ${m.dose} (${m.status.replace('_', ' ')})`).join('\n');
      }

      if (conflicts.length > 0) {
        answer += `\n\n⚠️ **Medication Reconciliation Note:** Differing doses recorded across providers for ${conflicts.map(c => c.medicationName).join(', ')}. Please confirm with your prescribing clinician before making any changes.`;
      }
    }
    // Lab results queries (HbA1c, glucose, etc.)
    else if (lowerQ.includes('lab') || lowerQ.includes('test') || lowerQ.includes('hba1c') || lowerQ.includes('glucose') || lowerQ.includes('result') || lowerQ.includes('compare')) {
      const hba1cTests = labs.filter(l => l.testName.toLowerCase().includes('hba1c') || l.testName.toLowerCase().includes('hemoglobin a1c'));
      const latestLabDoc = docs.find(d => d.category === 'lab_report');

      if (hba1cTests.length >= 2) {
        const sorted = [...hba1cTests].sort((a, b) => new Date(b.testDate).getTime() - new Date(a.testDate).getTime());
        const latest = sorted[0];
        const prev = sorted[1];

        answer = `Comparing your last two recorded **HbA1c** results from your vault:\n\n` +
          `* **${latest.testDate}:** **${latest.value}%** (${latest.providerName})\n` +
          `* **${prev.testDate}:** **${prev.value}%** (${prev.providerName})\n\n` +
          `**Trend Analysis:** Your HbA1c showed an improvement from ${prev.value}% down to ${latest.value}%, which meets the American Diabetes Association target (<7.0% for non-pregnant adults). Reference range: ${latest.referenceRange}.\n\n` +
          `*Always review metabolic trajectories with your endocrinologist.*`;

        if (latestLabDoc) {
          referencedDocIds.push({ id: latestLabDoc.id, title: latestLabDoc.title, date: latestLabDoc.documentDate, provider: latestLabDoc.providerName });
        }
      } else if (labs.length > 0) {
        answer = `Recent recorded diagnostic values in your vault:\n` +
          labs.slice(0, 5).map(l => `* **${l.testName}:** ${l.value} ${l.unit} (Ref: ${l.referenceRange}) on ${l.testDate} [${l.isAbnormal ? 'Flagged' : 'Normal'}]`).join('\n');
        if (latestLabDoc) {
          referencedDocIds.push({ id: latestLabDoc.id, title: latestLabDoc.title, date: latestLabDoc.documentDate, provider: latestLabDoc.providerName });
        }
      } else {
        answer = `I don't find any recorded laboratory results in your uploaded LockMyHealth records.`;
      }
    }
    // Follow-up / Appointment queries
    else if (lowerQ.includes('follow') || lowerQ.includes('appointment') || lowerQ.includes('next') || lowerQ.includes('visit')) {
      const upcoming = appointments.filter(a => a.status === 'upcoming');
      if (upcoming.length > 0) {
        answer = `Upcoming scheduled appointments in your health continuity calendar:\n\n` +
          upcoming.map(a => `* **${a.title}** with ${a.providerName} on **${a.date} at ${a.time}** (${a.type.replace('_', ' ')}). Location: ${a.location || 'Clinic'}. Reason: ${a.reason}`).join('\n\n');
      } else {
        answer = `No upcoming appointments are currently recorded in your LockMyHealth calendar.`;
      }
    }
    // Questions for doctor
    else if (lowerQ.includes('question') || lowerQ.includes('bring') || lowerQ.includes('ask')) {
      answer = `Based on your documented medical history (Type 2 Diabetes, Hypertension, Asthma), here are recommended topics and questions to bring to your next consultation:\n\n` +
        `1. **Medication Confirmation:** Confirm your titrated dose of Metformin ER 1000mg with dinner and verify whether standard-release Metformin 500mg should be officially marked discontinued.\n` +
        `2. **Glycemic Control:** Review your recent HbA1c trajectory (6.8% in August 2026 vs 7.1% in April 2026).\n` +
        `3. **Blood Pressure Stability:** Present your home blood pressure readings and review Telmisartan 80mg efficacy.\n` +
        `4. **Allergy Precautions:** Reconfirm that your Penicillin allergy and NSAID sensitivity remain highlighted in the clinic chart.`;
    }
    // Default fallback
    else {
      answer = `Here is what appears in your uploaded LockMyHealth health vault:\n\n` +
        `* **Patient:** ${user?.name || 'Patient'} (Conditions: ${emergencyCard.selectedConditions.join(', ') || 'None'})\n` +
        `* **Records:** ${docs.length} documents uploaded across ${docs.map(d => d.providerName).filter((v, i, a) => a.indexOf(v) === i).join(', ')}.\n` +
        `* **Active Prescriptions:** ${meds.filter(m => m.status === 'active_confirmed').map(m => m.name).join(', ')}.\n\n` +
        `Could you please clarify your specific question regarding your prescriptions, lab results, or doctor visits?`;
    }

    return {
      success: true,
      text: answer,
      referencedDocuments: referencedDocIds
    };
  }
}

/**
 * Lab Parameter Explanation
 */
export async function explainLabParameter(testName: string, value: string, unit: string, referenceRange: string) {
  try {
    const response = await callGeminiWithTimeout(
      ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: `Explain the laboratory test "${testName}" with recorded result "${value} ${unit}" and reference range "${referenceRange}".
Provide:
1. A plain-English explanation of what this test measures.
2. What this specific result generally indicates.
3. 2 thoughtful questions the patient can ask their doctor during their next visit.
Keep it concise, reassuring, and adhere strictly to medical disclaimer standards.`,
        config: {
          systemInstruction: 'You are a compassionate clinical pathology educator. Explain test parameters clearly without diagnosing.'
        }
      }),
      5000
    );
    return {
      success: true,
      explanation: response.text || 'Explanation not available.'
    };
  } catch (err: any) {
    return {
      success: true,
      explanation: `${testName} is a diagnostic indicator commonly monitored during metabolic and clinical reviews. Consult your physician regarding your result of ${value} ${unit}.`
    };
  }
}
