import OpenAI from "openai";
import type { ExtractedPrescriptionData } from "@shared/schema";

// the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
const openai = new OpenAI({ 
  apiKey: process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY_ENV_VAR || "default_key"
});

const EXTRACTION_SYSTEM_PROMPT = `
You are MedGenie AI, specialized in extracting structured medical data from prescription documents. 

TASK: Extract prescription information and return ONLY valid JSON format.

REQUIRED JSON STRUCTURE:
{
  "doctorName": "Full doctor name with credentials",
  "hospitalClinic": "Medical facility name", 
  "consultationDate": "YYYY-MM-DD format",
  "patientName": "Patient full name",
  "diagnosis": "Primary medical condition/symptoms",
  "medicines": [
    {
      "name": "Complete medicine name",
      "genericName": "Generic/salt name if mentioned", 
      "dosage": "Strength (e.g., 500mg, 10ml)",
      "frequency": "How often (e.g., twice daily, every 8 hours)",
      "duration": "Treatment period (e.g., 7 days, 2 weeks)",
      "instructions": "Special instructions (before/after food, etc.)",
      "quantity": "Total quantity prescribed"
    }
  ],
  "vitalSigns": {
    "bloodPressure": "if mentioned",
    "temperature": "if mentioned", 
    "weight": "if mentioned",
    "pulse": "if mentioned"
  },
  "followUpDate": "Next appointment date if mentioned",
  "specialInstructions": "General care instructions",
  "prescriptionNumber": "Prescription ID if visible"
}

EXTRACTION RULES:
1. Extract ALL visible text accurately
2. If handwritten, interpret carefully
3. For unclear text, use "Not clearly visible" 
4. Maintain medical terminology precision
5. Include dosage units (mg, ml, tablets)
6. Convert frequency to standardized format
7. Extract both brand and generic names when available
8. Note any drug interactions mentioned
9. Include dietary restrictions if specified
10. Preserve doctor's special notes

QUALITY CHECKS:
- Verify medicine names against common pharmaceuticals
- Ensure dosage values are medically reasonable  
- Cross-reference frequency with standard prescribing
- Validate date formats
- Check for completeness of critical fields
`;

const CHAT_SYSTEM_PROMPT = `
You are MedGenie AI, a knowledgeable medical assistant helping users understand their prescription data. 

CORE PRINCIPLES:
1. SAFETY FIRST - Never provide medical advice that could harm
2. ACCURACY - Base responses only on provided prescription data  
3. CLARITY - Explain medical terms in simple language
4. EMPATHY - Be supportive and understanding
5. BOUNDARIES - Always recommend consulting healthcare providers

CAPABILITIES:
✅ Explain prescribed medications and their purposes
✅ Clarify dosage instructions and timing
✅ Identify potential drug interactions from user's prescription history
✅ Explain medical conditions mentioned in prescriptions
✅ Help track medication schedules and compliance
✅ Compare prescriptions from different doctors
✅ Provide general medication information
✅ Suggest questions to ask doctors

STRICT LIMITATIONS:
❌ Never diagnose medical conditions
❌ Never recommend changing prescribed dosages
❌ Never suggest stopping medications
❌ Never provide emergency medical guidance
❌ Never replace professional medical consultation
❌ Never speculate about conditions not in prescriptions

RESPONSE GUIDELINES:
1. Always reference specific prescription data when answering
2. Use clear, non-technical language
3. Include relevant context from user's prescription history
4. Highlight important safety information
5. Suggest follow-up questions for doctors when appropriate
6. Provide medication reminders and tips when helpful

EMERGENCY SITUATIONS:
If user mentions symptoms requiring immediate attention, respond:
"This sounds like it may need immediate medical attention. Please contact your doctor, call emergency services, or visit the nearest emergency room right away."

INTERACTION STYLE:
- Friendly but professional
- Supportive and reassuring
- Clear and educational  
- Proactive in identifying concerns
- Encouraging of doctor-patient communication
`;

export async function extractPrescriptionData(base64File: string, mimeType: string): Promise<ExtractedPrescriptionData> {
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system", 
          content: EXTRACTION_SYSTEM_PROMPT
        },
        {
          role: "user",
          content: [
            {
              type: "text",
              text: "Extract prescription data from this medical document. Return only valid JSON."
            },
            {
              type: "image_url",
              image_url: {
                url: `data:${mimeType};base64,${base64File}`,
                detail: "high"
              }
            }
          ]
        }
      ],
      max_tokens: 2000,
      temperature: 0.1,
      response_format: { type: "json_object" }
    });

    const extractedData = JSON.parse(response.choices[0].message.content || "{}");
    return extractedData as ExtractedPrescriptionData;
  } catch (error) {
    throw new Error(`Failed to extract prescription data: ${error.message}`);
  }
}

export async function generateEmbedding(text: string): Promise<number[]> {
  try {
    const response = await openai.embeddings.create({
      model: "text-embedding-3-small",
      input: text,
      encoding_format: "float"
    });

    return response.data[0].embedding;
  } catch (error) {
    throw new Error(`Failed to generate embedding: ${error.message}`);
  }
}

export async function generateChatResponse(
  userMessage: string, 
  prescriptionContext: string
): Promise<string> {
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: CHAT_SYSTEM_PROMPT
        },
        {
          role: "user",
          content: `
PRESCRIPTION CONTEXT:
${prescriptionContext}

USER QUESTION:
${userMessage}
          `
        }
      ],
      max_tokens: 1000,
      temperature: 0.3
    });

    return response.choices[0].message.content || "I apologize, but I couldn't generate a response. Please try again.";
  } catch (error) {
    throw new Error(`Failed to generate chat response: ${error.message}`);
  }
}

export function buildEmbeddingText(prescriptionData: ExtractedPrescriptionData): string {
  const components = [
    `Doctor: ${prescriptionData.doctorName}`,
    prescriptionData.hospitalClinic && `Hospital: ${prescriptionData.hospitalClinic}`,
    `Diagnosis: ${prescriptionData.diagnosis}`,
    prescriptionData.specialInstructions && `Instructions: ${prescriptionData.specialInstructions}`,
    ...prescriptionData.medicines.map(med => 
      `Medicine: ${med.name} ${med.genericName ? `(${med.genericName})` : ''} - ${med.dosage} - ${med.frequency} for ${med.duration} - ${med.instructions}`
    ),
    prescriptionData.vitalSigns && Object.entries(prescriptionData.vitalSigns)
      .filter(([_, value]) => value)
      .map(([key, value]) => `${key}: ${value}`)
      .join(', '),
    `Date: ${prescriptionData.consultationDate}`
  ].filter(Boolean);
  
  return components.join(' | ');
}
