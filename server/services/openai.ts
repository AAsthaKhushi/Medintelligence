import OpenAI from "openai";
import type { ExtractedPrescriptionData } from "@shared/schema";
import mammoth from "mammoth";
// @ts-ignore
import pdfjsLib from "pdfjs-dist/legacy/build/pdf.js";
// @ts-ignore
import pdfjsWorker from "pdfjs-dist/legacy/build/pdf.worker.js";
// @ts-ignore
import { createCanvas, CanvasRenderingContext2D } from "canvas";

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

// Helper: Convert DOCX buffer to PNG (via HTML -> Canvas)
async function docxBufferToPngBase64(docxBuffer: Buffer): Promise<string> {
  const { value: html } = await mammoth.convertToHtml({ buffer: docxBuffer });
  // Render HTML to canvas (node-canvas)
  const canvas = createCanvas(1200, 1600);
  const ctx = canvas.getContext("2d") as CanvasRenderingContext2D;
  ctx.fillStyle = "#fff";
  ctx.fillRect(0, 0, 1200, 1600);
  ctx.fillStyle = "#000";
  ctx.font = "24px Arial";
  // Render plain text (strip HTML tags)
  const text = html.replace(/<[^>]+>/g, '');
  const lines = text.split(/\r?\n/);
  let y = 100;
  for (const line of lines) {
    ctx.fillText(line, 50, y, 1100);
    y += 32;
  }
  return canvas.toDataURL("image/png").replace(/^data:image\/png;base64,/, "");
}

// Helper: Convert first page of PDF buffer to PNG base64 (pure JS)
async function pdfBufferToPngBase64(pdfBuffer: Buffer): Promise<string> {
  pdfjsLib.GlobalWorkerOptions.workerSrc = pdfjsWorker;
  const pdf = await pdfjsLib.getDocument({ data: new Uint8Array(pdfBuffer) }).promise;
  const page = await pdf.getPage(1);
  const viewport = page.getViewport({ scale: 2 });
  const canvas = createCanvas(viewport.width, viewport.height);
  const ctx = canvas.getContext("2d") as CanvasRenderingContext2D;
  // @ts-ignore
  await page.render({ canvasContext: ctx, viewport }).promise;
  return canvas.toDataURL("image/png").replace(/^data:image\/png;base64,/, "");
}

// Main extraction function - OpenAI handles everything
export async function extractPrescriptionData(
  base64File: string, 
  mimeType: string, 
  originalBuffer?: Buffer
): Promise<ExtractedPrescriptionData> {
  try {
    let imageBase64: string;
    if (mimeType === "application/pdf" && originalBuffer) {
      imageBase64 = await pdfBufferToPngBase64(originalBuffer);
    } else if (mimeType === "application/vnd.openxmlformats-officedocument.wordprocessingml.document" && originalBuffer) {
      imageBase64 = await docxBufferToPngBase64(originalBuffer);
    } else if (mimeType.startsWith("image/")) {
      imageBase64 = base64File;
    } else {
      throw new Error(`Unsupported file type: ${mimeType}`);
    }

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
              text: "Extract prescription data from this medical document image. Return only valid JSON."
            },
            {
              type: "image_url",
              image_url: {
                url: `data:image/png;base64,${imageBase64}`,
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

    if (!response.choices[0]?.message?.content) {
      throw new Error('OpenAI returned empty response');
    }

    const extractedData = JSON.parse(response.choices[0].message.content);
    return extractedData as ExtractedPrescriptionData;
  } catch (error: any) {
    throw new Error(`Failed to extract prescription data: ${error.message}`);
  }
}

// Fallback function for text-based extraction (useful for DOCX content)
export async function extractPrescriptionDataFromText(
  textContent: string
): Promise<ExtractedPrescriptionData> {
  try {
    console.log('Processing text content with OpenAI...');
    
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system", 
          content: EXTRACTION_SYSTEM_PROMPT
        },
        {
          role: "user",
          content: `Extract prescription data from this medical document text. Return only valid JSON.\n\nDocument text:\n${textContent}`
        }
      ],
      max_tokens: 2000,
      temperature: 0.1,
      response_format: { type: "json_object" }
    });

    const extractedData = JSON.parse(response.choices[0].message.content || "{}");
    return extractedData as ExtractedPrescriptionData;
    
  } catch (error: any) {
    throw new Error(`Failed to extract prescription data from text: ${error.message}`);
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
    throw new Error(`Failed to generate embedding: ${(error as any).message}`);
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
    throw new Error(`Failed to generate chat response: ${(error as any).message}`);
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

export async function generateMedicineInfo(medicineName: string): Promise<{ sideEffects: string; warnings: string }> {
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: `You are a medical information assistant. Provide general information about medications in a safe, patient-friendly manner. Always emphasize consulting healthcare providers for specific medical advice. Return only valid JSON with this structure: {"sideEffects": "string", "warnings": "string"}`
        },
        {
          role: "user",
          content: `Provide general side effects and warnings for the medication: ${medicineName}. Keep responses concise and patient-friendly.`
        }
      ],
      max_tokens: 500,
      temperature: 0.1,
      response_format: { type: "json_object" }
    });

    const content = response.choices[0].message.content;
    if (!content) {
      throw new Error('OpenAI returned empty response');
    }

    const result = JSON.parse(content);
    return {
      sideEffects: result.sideEffects || "Information not available. Please consult your healthcare provider.",
      warnings: result.warnings || "Information not available. Please consult your healthcare provider."
    };
  } catch (error: any) {
    console.error("Error generating medicine info:", error);
    return {
      sideEffects: "Information not available. Please consult your healthcare provider.",
      warnings: "Information not available. Please consult your healthcare provider."
    };
  }
}