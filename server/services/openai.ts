import OpenAI from "openai";
import type { ExtractedPrescriptionData } from "@shared/schema";

// the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
const openai = new OpenAI({ 
  apiKey: process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY_ENV_VAR || "default_key"
});

const EXTRACTION_SYSTEM_PROMPT = `Extract prescription data from this medical document. Return only valid JSON with this structure:

{
  "doctorName": "string",
  "hospitalClinic": "string",
  "consultationDate": "YYYY-MM-DD or null",
  "patientName": "string",
  "diagnosis": "string",
  "medicines": [{"name": "string", "dosage": "string", "frequency": "string", "duration": "string", "instructions": "string", "quantity": "string"}],
  "vitalSigns": {"bloodPressure": "string", "temperature": "string", "weight": "string", "pulse": "string"},
  "followUpDate": "YYYY-MM-DD or null",
  "specialInstructions": "string",
  "prescriptionNumber": "string"
}

Use "Not mentioned" for missing fields. Extract text accurately from handwritten prescriptions.`;

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
    // Add timeout wrapper for OpenAI API call
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('OpenAI API timeout after 30 seconds')), 30000);
    });

    const apiPromise = openai.chat.completions.create({
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
      max_tokens: 1500,
      temperature: 0.1,
      response_format: { type: "json_object" }
    });

    const response = await Promise.race([apiPromise, timeoutPromise]) as any;
    const extractedData = JSON.parse(response.choices[0].message.content || "{}");
    return extractedData as ExtractedPrescriptionData;
  } catch (error: any) {
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
