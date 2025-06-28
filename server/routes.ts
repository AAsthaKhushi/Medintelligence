import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { 
  extractPrescriptionData, 
  generateEmbedding, 
  generateChatResponse, 
  buildEmbeddingText,
  generateMedicineInfo
} from "./services/openai";
import { 
  upload, 
  convertFileToBase64, 
  saveUploadedFile, 
  generateUniqueFileName 
} from "./services/fileProcessor";
import { insertPrescriptionSchema, insertChatConversationSchema } from "@shared/schema";
import { z } from "zod";
import { eq } from "drizzle-orm";

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
      const publicUrl = `/uploads/${fileName}`;
      
      // Create initial prescription record
      const prescription = await storage.createPrescription({
        userId: demoUser.id,
        fileName: req.file.originalname,
        fileUrl: publicUrl,
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

  // Update prescription
  app.put("/api/prescriptions/:id", async (req, res) => {
    try {
      if (!demoUser) {
        return res.status(404).json({ error: "User not found" });
      }
      const id = req.params.id;
      const updates = req.body;

      // Only allow updating fields that are safe
      const allowedFields = [
        "doctorName", "patientName", "consultationDate", "diagnosis",
        "instructions", "specialInstructions", "vitalSigns", "followUpDate"
      ];
      const updateData: any = {};
      for (const field of allowedFields) {
        if (updates[field] !== undefined) updateData[field] = updates[field];
      }

      // Update prescription
      await storage.updatePrescriptionProcessingStatus(id, "completed", updateData);

      // Optionally update medicines if provided
      if (Array.isArray(updates.medicines)) {
        await storage.deleteMedicinesByPrescriptionId(id);
        const newMeds = updates.medicines
          .filter((med: any) => med.name && med.name.trim() !== "")
          .map((med: any) => ({ ...med, prescriptionId: id }));
        if (newMeds.length > 0) {
          await storage.createMedicines(newMeds);
        }
      }

      // Return updated prescription
      const updated = await storage.getPrescription(id);
      res.json(updated);
    } catch (error) {
      console.error("Update prescription error:", error);
      res.status(500).json({ error: "Failed to update prescription" });
    }
  });

  // Delete prescription
  app.delete("/api/prescriptions/:id", async (req, res) => {
    try {
      if (!demoUser) {
        return res.status(404).json({ error: "User not found" });
      }
      const id = req.params.id;
      const permanent = req.query.permanent === 'true';
      const prescription = await storage.getPrescription(id);
      if (!prescription) {
        return res.status(404).json({ error: "Prescription not found" });
      }
      if (permanent) {
        // Delete medicines and chat messages, then prescription
        await storage.deleteMedicinesByPrescriptionId(id);
        if (storage.deleteChatMessagesByPrescriptionId) {
          await storage.deleteChatMessagesByPrescriptionId(id);
        }
        await storage.deletePrescription(id);
        return res.json({ success: true, deleted: true });
      } else {
        // Soft delete: mark as deleted
        await storage.updatePrescriptionProcessingStatus(id, "deleted");
        return res.json({ success: true, deleted: false });
      }
    } catch (error) {
      console.error("Delete prescription error:", error);
      res.status(500).json({ error: "Failed to delete prescription" });
    }
  });

  // Delete all prescriptions for the user
  app.delete("/api/prescriptions", async (req, res) => {
    try {
      if (!demoUser) {
        return res.status(404).json({ error: "User not found" });
      }
      const permanent = req.query.permanent === 'true';
      const userId = demoUser.id;
      const prescriptions = await storage.getUserPrescriptions(userId);
      if (permanent) {
        for (const p of prescriptions) {
          await storage.deleteMedicinesByPrescriptionId(p.id);
          if (storage.deleteChatMessagesByPrescriptionId) {
            await storage.deleteChatMessagesByPrescriptionId(p.id);
          }
          await storage.deletePrescription(p.id);
        }
        return res.json({ success: true, deleted: true });
      } else {
        for (const p of prescriptions) {
          await storage.updatePrescriptionProcessingStatus(p.id, "deleted");
        }
        return res.json({ success: true, deleted: false });
      }
    } catch (error) {
      console.error("Delete all prescriptions error:", error);
      res.status(500).json({ error: "Failed to delete all prescriptions" });
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

      // Special handling for dosage timing quick action
      if (
        prescriptionId &&
        /dosage timing|timing for my medications|when should I take|what time should I take/i.test(message)
      ) {
        const prescription = await storage.getPrescription(prescriptionId);
        if (prescription && prescription.medicines && prescription.medicines.length > 0) {
          // Debug log for medicine values
          console.log('Dosage timing debug:', prescription.medicines.map(med => ({
            name: med.name,
            frequency: med.frequency,
            instructions: med.instructions
          })));
          // Collect all unique frequencies and instructions
          const points: string[] = [];
          prescription.medicines.forEach((med, idx) => {
            let medInfo = `• ${med.name ? med.name + ': ' : ''}`;
            let hasInfo = false;
            if (med.frequency && med.frequency.trim().toLowerCase() !== 'not mentioned') {
              medInfo += `Frequency: ${med.frequency}`;
              hasInfo = true;
            }
            if (med.instructions && med.instructions.trim().toLowerCase() !== 'not mentioned') {
              if (hasInfo) medInfo += ", ";
              medInfo += `Instructions: ${med.instructions}`;
              hasInfo = true;
            }
            if (hasInfo) {
              points.push(medInfo);
            }
          });
          let responseText = '';
          if (points.length > 0) {
            responseText = `Dosage timing and instructions as per your prescription:\n${points.join('\n')}`;
            // If any medicine lacks clear timing, add a note
            const unclear = prescription.medicines.some(med =>
              (!med.frequency || med.frequency.trim().toLowerCase() === 'not mentioned') &&
              (!med.instructions || med.instructions.trim().toLowerCase() === 'not mentioned')
            );
            if (unclear) {
              responseText += '\n\nNote: Some medicines do not have clear timing or instructions mentioned. Please consult your doctor for precise dosage timings.';
            }
          } else {
            responseText = 'Dosage timing and instructions are not mentioned on your prescription. Please consult your doctor before taking any medications.';
          }
          await storage.createChatMessage({
            userId: demoUser.id,
            prescriptionId,
            message: responseText,
            isUserMessage: false,
            context: { type: "dosage_timing" }
          });
          return res.json({ response: responseText });
        }
        // Fallback if no timing info found
        const fallback = "Dosage timing and instructions are not mentioned on your prescription. Please consult your doctor before taking any medications.";
        await storage.createChatMessage({
          userId: demoUser.id,
          prescriptionId,
          message: fallback,
          isUserMessage: false,
          context: { type: "dosage_timing" }
        });
        return res.json({ response: fallback });
      }

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

  // Timeline API endpoints
  // Get medication schedules for a specific date
  app.get("/api/timeline/schedules", async (req, res) => {
    try {
      if (!demoUser) {
        return res.status(404).json({ error: "User not found" });
      }

      const { date } = req.query;
      if (!date) {
        return res.status(400).json({ error: "Date parameter is required" });
      }

      const targetDate = new Date(date as string);
      const dayStart = new Date(targetDate);
      dayStart.setHours(0, 0, 0, 0);
      
      const dayEnd = new Date(targetDate);
      dayEnd.setHours(23, 59, 59, 999);

      const schedules = await storage.getMedicationSchedulesForDate(demoUser.id, dayStart, dayEnd);
      res.json(schedules);
    } catch (error) {
      console.error("Get schedules error:", error);
      res.status(500).json({ error: "Failed to get medication schedules" });
    }
  });

  // Get medication status for a specific date
  app.get("/api/timeline/status", async (req, res) => {
    try {
      if (!demoUser) {
        return res.status(404).json({ error: "User not found" });
      }

      const { date } = req.query;
      if (!date) {
        return res.status(400).json({ error: "Date parameter is required" });
      }

      const targetDate = new Date(date as string);
      const dayStart = new Date(targetDate);
      dayStart.setHours(0, 0, 0, 0);
      
      const dayEnd = new Date(targetDate);
      dayEnd.setHours(23, 59, 59, 999);

      const statuses = await storage.getMedicationStatusForDate(demoUser.id, dayStart, dayEnd);
      res.json(statuses);
    } catch (error) {
      console.error("Get status error:", error);
      res.status(500).json({ error: "Failed to get medication status" });
    }
  });

  // Update medication status
  app.put("/api/timeline/status/:scheduleId", async (req, res) => {
    try {
      if (!demoUser) {
        return res.status(404).json({ error: "User not found" });
      }

      const { scheduleId } = req.params;
      const { status, notes, actualTime } = req.body;

      const updatedStatus = await storage.updateMedicationStatus(scheduleId, {
        status,
        notes,
        actualTime: actualTime || new Date().toISOString()
      });

      res.json(updatedStatus);
    } catch (error) {
      console.error("Update status error:", error);
      res.status(500).json({ error: "Failed to update medication status" });
    }
  });

  // Get medication conflicts
  app.get("/api/timeline/conflicts", async (req, res) => {
    try {
      if (!demoUser) {
        return res.status(404).json({ error: "User not found" });
      }

      const conflicts = await storage.getMedicationConflicts(demoUser.id);
      res.json(conflicts);
    } catch (error) {
      console.error("Get conflicts error:", error);
      res.status(500).json({ error: "Failed to get medication conflicts" });
    }
  });

  // Generate schedules for a prescription
  app.post("/api/timeline/generate-schedules", async (req, res) => {
    try {
      if (!demoUser) {
        return res.status(404).json({ error: "User not found" });
      }

      const { prescriptionId, startDate, endDate } = req.body;
      
      const prescription = await storage.getPrescription(prescriptionId);
      if (!prescription) {
        return res.status(404).json({ error: "Prescription not found" });
      }

      const medicines = await storage.getMedicinesByPrescriptionId(prescriptionId);
      const schedules = [];

      for (const medicine of medicines) {
        const medicineSchedules = await storage.generateMedicationSchedules(
          medicine,
          prescription,
          demoUser.id,
          new Date(startDate),
          endDate ? new Date(endDate) : undefined
        );
        schedules.push(...medicineSchedules);
      }

      res.json({ schedules, message: `Generated ${schedules.length} medication schedules` });
    } catch (error) {
      console.error("Generate schedules error:", error);
      res.status(500).json({ error: "Failed to generate medication schedules" });
    }
  });

  // Optimize medication schedule
  app.post("/api/timeline/optimize", async (req, res) => {
    try {
      if (!demoUser) {
        return res.status(404).json({ error: "User not found" });
      }

      const { date, conflicts } = req.body;
      
      // This would integrate with AI to optimize the schedule
      // For now, return a simple response
      const optimizedSchedules = await storage.optimizeMedicationSchedule(
        demoUser.id,
        new Date(date),
        conflicts
      );

      res.json({ 
        optimizedSchedules, 
        message: "Schedule optimized successfully" 
      });
    } catch (error) {
      console.error("Optimize schedule error:", error);
      res.status(500).json({ error: "Failed to optimize medication schedule" });
    }
  });

  // Update meal timing for a schedule
  app.put('/api/timeline/schedule/:scheduleId/meal-timing', async (req, res) => {
    try {
      if (!demoUser) {
        return res.status(404).json({ error: 'User not found' });
      }
      const { scheduleId } = req.params;
      const { mealTiming } = req.body;
      // Update the schedule
      await storage.updateMedicationScheduleMealTiming(scheduleId, mealTiming);
      res.json({ success: true, message: 'Meal timing updated successfully' });
    } catch (error) {
      console.error('Update meal timing error:', error);
      res.status(500).json({ error: 'Failed to update meal timing' });
    }
  });

  // Get medicine information (side effects and warnings)
  app.get('/api/medicine-info', async (req, res) => {
    try {
      const { name } = req.query;
      
      if (!name || typeof name !== 'string') {
        return res.status(400).json({ error: 'Medicine name is required' });
      }

      const medicineInfo = await generateMedicineInfo(name);
      res.json(medicineInfo);
    } catch (error) {
      console.error('Get medicine info error:', error);
      res.status(500).json({ error: 'Failed to get medicine information' });
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
    const extractedData = await extractPrescriptionData(base64File, mimeType, fileBuffer);

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
