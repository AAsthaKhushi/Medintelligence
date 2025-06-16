import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { 
  extractPrescriptionData, 
  generateEmbedding, 
  generateChatResponse, 
  buildEmbeddingText 
} from "./services/openai";
import { 
  upload, 
  convertFileToBase64, 
  saveUploadedFile, 
  generateUniqueFileName 
} from "./services/fileProcessor";
import { insertPrescriptionSchema, insertChatConversationSchema } from "@shared/schema";
import { z } from "zod";

export async function registerRoutes(app: Express): Promise<Server> {
  // Create a demo user for development
  let demoUser: any = null;
  try {
    demoUser = await storage.getUserByUsername("demo");
    if (!demoUser) {
      demoUser = await storage.createUser({
        username: "demo",
        password: "demo123",
        name: "Dr. John Davis"
      });
    }
  } catch (error) {
    console.error("Error creating demo user:", error);
  }

  // Get current user (simplified for demo)
  app.get("/api/user", async (req, res) => {
    try {
      if (!demoUser) {
        return res.status(404).json({ error: "User not found" });
      }
      res.json(demoUser);
    } catch (error) {
      res.status(500).json({ error: "Failed to get user" });
    }
  });

  // Upload and process prescription
  app.post("/api/prescriptions/upload", upload.single('file'), async (req, res) => {
    try {
      if (!req.file || !demoUser) {
        return res.status(400).json({ error: "No file uploaded or user not found" });
      }

      const fileName = generateUniqueFileName(req.file.originalname);
      const filePath = saveUploadedFile(req.file.buffer, fileName);
      
      // Create initial prescription record
      const prescription = await storage.createPrescription({
        userId: demoUser.id,
        fileName: req.file.originalname,
        fileUrl: filePath,
        processingStatus: "processing"
      });

      // Process file asynchronously
      processFileAsync(prescription.id, req.file.buffer, req.file.mimetype);

      res.json({ 
        id: prescription.id, 
        status: "processing",
        message: "File uploaded successfully. AI extraction in progress." 
      });
    } catch (error) {
      console.error("Upload error:", error);
      res.status(500).json({ error: "Failed to upload file" });
    }
  });

  // Get user prescriptions
  app.get("/api/prescriptions", async (req, res) => {
    try {
      if (!demoUser) {
        return res.status(404).json({ error: "User not found" });
      }

      const prescriptions = await storage.getUserPrescriptions(demoUser.id);
      res.json(prescriptions);
    } catch (error) {
      console.error("Get prescriptions error:", error);
      res.status(500).json({ error: "Failed to get prescriptions" });
    }
  });

  // Get specific prescription
  app.get("/api/prescriptions/:id", async (req, res) => {
    try {
      const prescription = await storage.getPrescription(req.params.id);
      if (!prescription) {
        return res.status(404).json({ error: "Prescription not found" });
      }
      res.json(prescription);
    } catch (error) {
      console.error("Get prescription error:", error);
      res.status(500).json({ error: "Failed to get prescription" });
    }
  });

  // Chat with AI
  app.post("/api/chat", async (req, res) => {
    try {
      const { message, prescriptionId } = req.body;
      
      if (!message || !demoUser) {
        return res.status(400).json({ error: "Message and user required" });
      }

      // Save user message
      await storage.createChatMessage({
        userId: demoUser.id,
        prescriptionId: prescriptionId || null,
        message,
        isUserMessage: true
      });

      // Get context from similar prescriptions
      let context = "";
      if (prescriptionId) {
        const prescription = await storage.getPrescription(prescriptionId);
        if (prescription) {
          context = `Current Prescription: Dr. ${prescription.doctorName}, ${prescription.diagnosis}, Medicines: ${prescription.medicines.map(m => m.name).join(', ')}`;
        }
      } else {
        // Generate embedding for the user message to find similar prescriptions
        try {
          const messageEmbedding = await generateEmbedding(message);
          const similarPrescriptions = await storage.findSimilarPrescriptions(demoUser.id, messageEmbedding, 0.6, 3);
          
          if (similarPrescriptions.length > 0) {
            context = `Related Prescriptions: ${similarPrescriptions.map(p => 
              `Dr. ${p.doctorName} - ${p.diagnosis} - ${p.medicines.map(m => m.name).slice(0, 2).join(', ')}`
            ).join('; ')}`;
          }
        } catch (embeddingError) {
          console.warn("Could not generate embedding for context:", embeddingError);
        }
      }

      // Generate AI response
      const aiResponse = await generateChatResponse(message, context);

      // Save AI response
      await storage.createChatMessage({
        userId: demoUser.id,
        prescriptionId: prescriptionId || null,
        message: aiResponse,
        isUserMessage: false,
        context: context ? { relatedPrescriptions: context } : null
      });

      res.json({ response: aiResponse });
    } catch (error) {
      console.error("Chat error:", error);
      res.status(500).json({ error: "Failed to process chat message" });
    }
  });

  // Get chat history
  app.get("/api/chat/history", async (req, res) => {
    try {
      if (!demoUser) {
        return res.status(404).json({ error: "User not found" });
      }

      const history = await storage.getChatHistory(demoUser.id);
      res.json(history);
    } catch (error) {
      console.error("Get chat history error:", error);
      res.status(500).json({ error: "Failed to get chat history" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}

// Async file processing function
async function processFileAsync(prescriptionId: string, fileBuffer: Buffer, mimeType: string) {
  try {
    // Update status to processing
    await storage.updatePrescriptionProcessingStatus(prescriptionId, "processing");

    // Convert file to base64 for OpenAI
    const base64File = convertFileToBase64(fileBuffer);

    // Extract data using GPT-4o Vision
    const extractedData = await extractPrescriptionData(base64File, mimeType);

    // Calculate extraction confidence based on completeness
    const confidence = calculateExtractionConfidence(extractedData);

    // Helper function to parse dates safely
    const parseDate = (dateStr: string | undefined | null): string | null => {
      if (!dateStr || dateStr === "Not mentioned" || dateStr === "Not clearly visible" || dateStr === "Not specified") {
        return null;
      }
      try {
        const parsed = new Date(dateStr);
        return isNaN(parsed.getTime()) ? null : dateStr;
      } catch {
        return null;
      }
    };

    // Update prescription with extracted data
    await storage.updatePrescriptionProcessingStatus(prescriptionId, "completed", {
      doctorName: extractedData.doctorName,
      hospitalClinic: extractedData.hospitalClinic,
      consultationDate: parseDate(extractedData.consultationDate),
      patientName: extractedData.patientName,
      diagnosis: extractedData.diagnosis,
      vitalSigns: extractedData.vitalSigns,
      followUpDate: parseDate(extractedData.followUpDate),
      specialInstructions: extractedData.specialInstructions,
      prescriptionNumber: extractedData.prescriptionNumber,
      extractionConfidence: confidence
    });

    // Create medicines
    if (extractedData.medicines && extractedData.medicines.length > 0) {
      const medicines = extractedData.medicines.map(med => ({
        prescriptionId,
        name: med.name,
        genericName: med.genericName,
        dosage: med.dosage,
        frequency: med.frequency,
        duration: med.duration,
        instructions: med.instructions,
        quantity: med.quantity
      }));

      await storage.createMedicines(medicines);
    }

    // Generate and store vector embedding
    const embeddingText = buildEmbeddingText(extractedData);
    const embedding = await generateEmbedding(embeddingText);
    await storage.updatePrescriptionEmbedding(prescriptionId, embedding, embeddingText);

  } catch (error) {
    console.error("File processing error:", error);
    await storage.updatePrescriptionProcessingStatus(prescriptionId, "failed");
  }
}

function calculateExtractionConfidence(data: any): number {
  let score = 0;
  const maxScore = 10;

  // Critical fields
  if (data.doctorName) score += 2;
  if (data.diagnosis) score += 2;
  if (data.medicines && data.medicines.length > 0) score += 3;
  
  // Important fields
  if (data.hospitalClinic) score += 1;
  if (data.consultationDate) score += 1;
  if (data.patientName) score += 1;

  return Math.min(score / maxScore, 1);
}
