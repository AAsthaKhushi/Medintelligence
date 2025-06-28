var __defProp = Object.defineProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};

// server/index.ts
import express2 from "express";

// server/routes.ts
import { createServer } from "http";

// shared/schema.ts
var schema_exports = {};
__export(schema_exports, {
  chatConversations: () => chatConversations,
  chatConversationsRelations: () => chatConversationsRelations,
  insertChatConversationSchema: () => insertChatConversationSchema,
  insertMedicationConflictSchema: () => insertMedicationConflictSchema,
  insertMedicationScheduleSchema: () => insertMedicationScheduleSchema,
  insertMedicationStatusSchema: () => insertMedicationStatusSchema,
  insertMedicineSchema: () => insertMedicineSchema,
  insertPrescriptionSchema: () => insertPrescriptionSchema,
  insertUserSchema: () => insertUserSchema,
  medicationConflicts: () => medicationConflicts,
  medicationConflictsRelations: () => medicationConflictsRelations,
  medicationSchedules: () => medicationSchedules,
  medicationSchedulesRelations: () => medicationSchedulesRelations,
  medicationStatus: () => medicationStatus,
  medicationStatusRelations: () => medicationStatusRelations,
  medicines: () => medicines,
  medicinesRelations: () => medicinesRelations,
  prescriptions: () => prescriptions,
  prescriptionsRelations: () => prescriptionsRelations,
  users: () => users,
  usersRelations: () => usersRelations
});
import { pgTable, text, boolean, timestamp, jsonb, vector, uuid, date, real } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { relations } from "drizzle-orm";
var users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  name: text("name").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull()
});
var prescriptions = pgTable("prescriptions", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").notNull().references(() => users.id),
  fileName: text("file_name").notNull(),
  fileUrl: text("file_url").notNull(),
  doctorName: text("doctor_name"),
  hospitalClinic: text("hospital_clinic"),
  consultationDate: date("consultation_date"),
  patientName: text("patient_name"),
  diagnosis: text("diagnosis"),
  vitalSigns: jsonb("vital_signs"),
  followUpDate: date("follow_up_date"),
  specialInstructions: text("special_instructions"),
  prescriptionNumber: text("prescription_number"),
  extractedText: text("extracted_text"),
  embedding: vector("embedding", { dimensions: 1536 }),
  processingStatus: text("processing_status").notNull().default("pending"),
  // pending, processing, completed, failed
  extractionConfidence: real("extraction_confidence"),
  // Timeline-specific fields
  scheduleData: jsonb("schedule_data"),
  // Parsed schedule information
  priorityLevel: text("priority_level").default("medium"),
  // critical, high, medium, low
  startDate: date("start_date"),
  endDate: date("end_date"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull()
});
var medicines = pgTable("medicines", {
  id: uuid("id").primaryKey().defaultRandom(),
  prescriptionId: uuid("prescription_id").notNull().references(() => prescriptions.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  genericName: text("generic_name"),
  dosage: text("dosage"),
  frequency: text("frequency"),
  duration: text("duration"),
  instructions: text("instructions"),
  quantity: text("quantity"),
  // Timeline-specific fields
  timingInstructions: text("timing_instructions"),
  // "with food", "empty stomach", "bedtime"
  priorityLevel: text("priority_level").default("medium"),
  // critical, high, medium, low
  administrationRoute: text("administration_route").default("oral"),
  // oral, topical, injection, etc.
  createdAt: timestamp("created_at").defaultNow().notNull()
});
var medicationSchedules = pgTable("medication_schedules", {
  id: uuid("id").primaryKey().defaultRandom(),
  medicineId: uuid("medicine_id").notNull().references(() => medicines.id, { onDelete: "cascade" }),
  prescriptionId: uuid("prescription_id").notNull().references(() => prescriptions.id, { onDelete: "cascade" }),
  userId: uuid("user_id").notNull().references(() => users.id),
  scheduledTime: timestamp("scheduled_time").notNull(),
  frequency: text("frequency").notNull(),
  // "BID", "TID", "QID", "every 4 hours", etc.
  startDate: date("start_date").notNull(),
  endDate: date("end_date"),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow().notNull()
});
var medicationStatus = pgTable("medication_status", {
  id: uuid("id").primaryKey().defaultRandom(),
  scheduleId: uuid("schedule_id").notNull().references(() => medicationSchedules.id, { onDelete: "cascade" }),
  medicineId: uuid("medicine_id").notNull().references(() => medicines.id, { onDelete: "cascade" }),
  prescriptionId: uuid("prescription_id").notNull().references(() => prescriptions.id, { onDelete: "cascade" }),
  userId: uuid("user_id").notNull().references(() => users.id),
  scheduledTime: timestamp("scheduled_time").notNull(),
  actualTime: timestamp("actual_time"),
  status: text("status").notNull().default("upcoming"),
  // upcoming, taken, missed, skipped
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull()
});
var medicationConflicts = pgTable("medication_conflicts", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").notNull().references(() => users.id),
  medicineId1: uuid("medicine_id_1").notNull().references(() => medicines.id, { onDelete: "cascade" }),
  medicineId2: uuid("medicine_id_2").notNull().references(() => medicines.id, { onDelete: "cascade" }),
  conflictType: text("conflict_type").notNull(),
  // timing, interaction, contraindication
  severity: text("severity").notNull(),
  // minor, moderate, severe, critical
  description: text("description").notNull(),
  suggestedResolution: text("suggested_resolution"),
  isResolved: boolean("is_resolved").default(false),
  createdAt: timestamp("created_at").defaultNow().notNull()
});
var chatConversations = pgTable("chat_conversations", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").notNull().references(() => users.id),
  prescriptionId: uuid("prescription_id").references(() => prescriptions.id),
  message: text("message").notNull(),
  isUserMessage: boolean("is_user_message").notNull(),
  context: jsonb("context"),
  // Related prescriptions and medical context
  createdAt: timestamp("created_at").defaultNow().notNull()
});
var usersRelations = relations(users, ({ many }) => ({
  prescriptions: many(prescriptions),
  chatConversations: many(chatConversations),
  medicationSchedules: many(medicationSchedules),
  medicationStatus: many(medicationStatus),
  medicationConflicts: many(medicationConflicts)
}));
var prescriptionsRelations = relations(prescriptions, ({ one, many }) => ({
  user: one(users, {
    fields: [prescriptions.userId],
    references: [users.id]
  }),
  medicines: many(medicines),
  chatConversations: many(chatConversations),
  medicationSchedules: many(medicationSchedules),
  medicationStatus: many(medicationStatus)
}));
var medicinesRelations = relations(medicines, ({ one, many }) => ({
  prescription: one(prescriptions, {
    fields: [medicines.prescriptionId],
    references: [prescriptions.id]
  }),
  medicationSchedules: many(medicationSchedules),
  medicationStatus: many(medicationStatus),
  conflictsAsFirst: many(medicationConflicts, { relationName: "medicine1" }),
  conflictsAsSecond: many(medicationConflicts, { relationName: "medicine2" })
}));
var medicationSchedulesRelations = relations(medicationSchedules, ({ one, many }) => ({
  medicine: one(medicines, {
    fields: [medicationSchedules.medicineId],
    references: [medicines.id]
  }),
  prescription: one(prescriptions, {
    fields: [medicationSchedules.prescriptionId],
    references: [prescriptions.id]
  }),
  user: one(users, {
    fields: [medicationSchedules.userId],
    references: [users.id]
  }),
  medicationStatus: many(medicationStatus)
}));
var medicationStatusRelations = relations(medicationStatus, ({ one }) => ({
  schedule: one(medicationSchedules, {
    fields: [medicationStatus.scheduleId],
    references: [medicationSchedules.id]
  }),
  medicine: one(medicines, {
    fields: [medicationStatus.medicineId],
    references: [medicines.id]
  }),
  prescription: one(prescriptions, {
    fields: [medicationStatus.prescriptionId],
    references: [prescriptions.id]
  }),
  user: one(users, {
    fields: [medicationStatus.userId],
    references: [users.id]
  })
}));
var medicationConflictsRelations = relations(medicationConflicts, ({ one }) => ({
  user: one(users, {
    fields: [medicationConflicts.userId],
    references: [users.id]
  }),
  medicine1: one(medicines, {
    fields: [medicationConflicts.medicineId1],
    references: [medicines.id],
    relationName: "medicine1"
  }),
  medicine2: one(medicines, {
    fields: [medicationConflicts.medicineId2],
    references: [medicines.id],
    relationName: "medicine2"
  })
}));
var chatConversationsRelations = relations(chatConversations, ({ one }) => ({
  user: one(users, {
    fields: [chatConversations.userId],
    references: [users.id]
  }),
  prescription: one(prescriptions, {
    fields: [chatConversations.prescriptionId],
    references: [prescriptions.id]
  })
}));
var insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
  name: true
});
var insertPrescriptionSchema = createInsertSchema(prescriptions).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});
var insertMedicineSchema = createInsertSchema(medicines).omit({
  id: true,
  createdAt: true
});
var insertChatConversationSchema = createInsertSchema(chatConversations).omit({
  id: true,
  createdAt: true
});
var insertMedicationScheduleSchema = createInsertSchema(medicationSchedules).omit({
  id: true,
  createdAt: true
});
var insertMedicationStatusSchema = createInsertSchema(medicationStatus).omit({
  id: true,
  createdAt: true
});
var insertMedicationConflictSchema = createInsertSchema(medicationConflicts).omit({
  id: true,
  createdAt: true
});

// server/db.ts
import "dotenv/config";
import { Pool, neonConfig } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-serverless";
import ws from "ws";
neonConfig.webSocketConstructor = ws;
if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?"
  );
}
var pool = new Pool({ connectionString: process.env.DATABASE_URL });
var db = drizzle({ client: pool, schema: schema_exports });

// server/storage.ts
import { eq, desc, and, sql, gte, lte } from "drizzle-orm";
var DatabaseStorage = class {
  async getUser(id) {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || void 0;
  }
  async getUserByUsername(username) {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user || void 0;
  }
  async createUser(insertUser) {
    const [user] = await db.insert(users).values(insertUser).returning();
    return user;
  }
  async createPrescription(prescription) {
    const [created] = await db.insert(prescriptions).values(prescription).returning();
    return created;
  }
  async getPrescription(id) {
    const [prescription] = await db.select().from(prescriptions).where(eq(prescriptions.id, id));
    if (!prescription) return void 0;
    const prescriptionMedicines = await db.select().from(medicines).where(eq(medicines.prescriptionId, id));
    return {
      ...prescription,
      medicines: prescriptionMedicines
    };
  }
  async getUserPrescriptions(userId) {
    const userPrescriptions = await db.select().from(prescriptions).where(eq(prescriptions.userId, userId)).orderBy(desc(prescriptions.createdAt));
    const prescriptionsWithMedicines = await Promise.all(
      userPrescriptions.map(async (prescription) => {
        const prescriptionMedicines = await db.select().from(medicines).where(eq(medicines.prescriptionId, prescription.id));
        return {
          ...prescription,
          medicines: prescriptionMedicines
        };
      })
    );
    return prescriptionsWithMedicines;
  }
  async updatePrescriptionProcessingStatus(id, status, data) {
    await db.update(prescriptions).set({
      processingStatus: status,
      updatedAt: /* @__PURE__ */ new Date(),
      ...data
    }).where(eq(prescriptions.id, id));
  }
  async updatePrescriptionEmbedding(id, embedding, extractedText) {
    await db.update(prescriptions).set({
      embedding: sql`${JSON.stringify(embedding)}::vector`,
      extractedText,
      updatedAt: /* @__PURE__ */ new Date()
    }).where(eq(prescriptions.id, id));
  }
  async createMedicine(medicine) {
    const [created] = await db.insert(medicines).values(medicine).returning();
    return created;
  }
  async createMedicines(medicineList) {
    if (medicineList.length === 0) return [];
    const created = await db.insert(medicines).values(medicineList).returning();
    return created;
  }
  async deleteMedicinesByPrescriptionId(prescriptionId) {
    await db.delete(medicines).where(eq(medicines.prescriptionId, prescriptionId));
  }
  async getMedicinesByPrescriptionId(prescriptionId) {
    const medicineList = await db.select().from(medicines).where(eq(medicines.prescriptionId, prescriptionId));
    return medicineList;
  }
  async createChatMessage(message) {
    const [created] = await db.insert(chatConversations).values(message).returning();
    return created;
  }
  async getChatHistory(userId, limit = 50) {
    return await db.select().from(chatConversations).where(eq(chatConversations.userId, userId)).orderBy(desc(chatConversations.createdAt)).limit(limit);
  }
  async findSimilarPrescriptions(userId, embedding, threshold = 0.7, limit = 5) {
    try {
      const similarPrescriptions = await db.execute(sql`
        SELECT p.*, 1 - (p.embedding <=> ${JSON.stringify(embedding)}::vector) as similarity_score
        FROM prescriptions p
        WHERE p.user_id = ${userId}
          AND p.processing_status = 'completed'
          AND p.embedding IS NOT NULL
          AND 1 - (p.embedding <=> ${JSON.stringify(embedding)}::vector) > ${threshold}
        ORDER BY p.embedding <=> ${JSON.stringify(embedding)}::vector
        LIMIT ${limit}
      `);
      const results = Array.isArray(similarPrescriptions) ? similarPrescriptions : [similarPrescriptions];
      const prescriptionsWithMedicines = await Promise.all(
        results.map(async (prescription) => {
          const prescriptionMedicines = await db.select().from(medicines).where(eq(medicines.prescriptionId, prescription.id));
          return {
            ...prescription,
            medicines: prescriptionMedicines
          };
        })
      );
      return prescriptionsWithMedicines;
    } catch (error) {
      console.error("Vector search error:", error);
      return [];
    }
  }
  async deletePrescription(id) {
    await db.delete(prescriptions).where(eq(prescriptions.id, id));
  }
  async deleteChatMessagesByPrescriptionId(prescriptionId) {
    await db.delete(chatConversations).where(eq(chatConversations.prescriptionId, prescriptionId));
  }
  async getMedicationSchedulesForDate(userId, startDate, endDate) {
    const schedules = await db.select().from(medicationSchedules).where(
      and(
        eq(medicationSchedules.userId, userId),
        gte(medicationSchedules.scheduledTime, startDate),
        lte(medicationSchedules.scheduledTime, endDate)
      )
    );
    return schedules;
  }
  async getMedicationStatusForDate(userId, startDate, endDate) {
    const statuses = await db.select().from(medicationStatus).where(
      and(
        eq(medicationStatus.userId, userId),
        gte(medicationStatus.scheduledTime, startDate),
        lte(medicationStatus.scheduledTime, endDate)
      )
    );
    return statuses;
  }
  async updateMedicationStatus(scheduleId, data) {
    const [updated] = await db.update(medicationStatus).set(data).where(eq(medicationStatus.scheduleId, scheduleId)).returning();
    return updated;
  }
  async getMedicationConflicts(userId) {
    const conflicts = await db.select().from(medicationConflicts).where(eq(medicationConflicts.userId, userId));
    return conflicts;
  }
  async generateMedicationSchedules(medicine, prescription, userId, startDate, endDate) {
    await db.delete(medicationSchedules).where(eq(medicationSchedules.medicineId, medicine.id));
    const warnings = [];
    let actualStartDate = startDate;
    if (!(actualStartDate instanceof Date) || isNaN(actualStartDate.getTime())) {
      if (prescription.consultationDate && !isNaN(new Date(prescription.consultationDate).getTime())) {
        actualStartDate = new Date(prescription.consultationDate);
      } else if (prescription.createdAt && !isNaN(new Date(prescription.createdAt).getTime())) {
        actualStartDate = new Date(prescription.createdAt);
      } else {
        actualStartDate = /* @__PURE__ */ new Date();
        warnings.push(`No valid consultationDate or createdAt for prescription ${prescription.id}, using today as start date.`);
      }
    }
    let numDays = 1;
    if (medicine.duration) {
      const match = medicine.duration.match(/(\d+)/);
      if (match) numDays = parseInt(match[1], 10);
    }
    if (!numDays || numDays < 1) {
      numDays = 1;
      warnings.push(`No valid duration for medicine ${medicine.name}, defaulting to 1 day.`);
    }
    const isApplication = medicine.administrationRoute && medicine.administrationRoute.toLowerCase() !== "oral" || /eye|skin|drop|ointment|apply|nasal|topical|cream|gel|spray/i.test(medicine.name || "");
    const isOral = !isApplication;
    let timesPerDay = 1;
    let times = [8];
    let mealTimings = [];
    let freqUsed = medicine.frequency ? medicine.frequency.toLowerCase() : "";
    if (!freqUsed) {
      freqUsed = "once a day";
      warnings.push(`No frequency for medicine ${medicine.name}, defaulting to 'once a day'.`);
    }
    if (isApplication) {
      if (freqUsed.includes("once")) {
        timesPerDay = 1;
        times = [8];
      } else if (freqUsed.includes("twice") || freqUsed.includes("2")) {
        timesPerDay = 2;
        times = [8, 20];
      } else if (freqUsed.includes("three") || freqUsed.includes("3")) {
        timesPerDay = 3;
        times = [8, 14, 20];
      } else if (freqUsed.includes("four") || freqUsed.includes("4")) {
        timesPerDay = 4;
        times = [8, 12, 16, 20];
      }
    } else if (isOral) {
      if (freqUsed.includes("once")) {
        timesPerDay = 1;
        times = [8];
        mealTimings = ["breakfast"];
      } else if (freqUsed.includes("twice") || freqUsed.includes("2")) {
        timesPerDay = 2;
        times = [8, 20];
        mealTimings = ["breakfast", "dinner"];
      } else if (freqUsed.includes("three") || freqUsed.includes("3")) {
        timesPerDay = 3;
        times = [8, 13, 20];
        mealTimings = ["breakfast", "lunch", "dinner"];
      } else if (freqUsed.includes("four") || freqUsed.includes("4")) {
        timesPerDay = 4;
        times = [8, 12, 16, 20];
        mealTimings = ["breakfast", "lunch", "evening", "dinner"];
      }
    }
    const schedules = [];
    for (let day = 0; day < numDays; day++) {
      for (let t = 0; t < timesPerDay; t++) {
        const scheduledDate = new Date(actualStartDate);
        scheduledDate.setDate(scheduledDate.getDate() + day);
        scheduledDate.setHours(times[t] || 8, 0, 0, 0);
        schedules.push({
          id: crypto.randomUUID(),
          medicineId: medicine.id,
          prescriptionId: prescription.id,
          userId,
          scheduledTime: scheduledDate,
          frequency: medicine.frequency || freqUsed,
          startDate: actualStartDate.toISOString().slice(0, 10),
          endDate: (endDate ? new Date(endDate) : new Date(actualStartDate.getTime() + (numDays - 1) * 24 * 60 * 60 * 1e3)).toISOString().slice(0, 10),
          isActive: true,
          createdAt: /* @__PURE__ */ new Date(),
          // Add mealTiming for oral medicines
          ...isOral && mealTimings[t] ? { mealTiming: mealTimings[t] } : {}
        });
      }
    }
    if (schedules.length > 0) {
      await db.insert(medicationSchedules).values(schedules);
    } else {
      warnings.push(`No schedules generated for medicine ${medicine.name} in prescription ${prescription.id}.`);
    }
    if (warnings.length > 0) {
      console.warn("Schedule generation warnings:", warnings);
    }
    return schedules;
  }
  async optimizeMedicationSchedule(userId, date2, conflicts) {
    return [];
  }
  async updateMedicationScheduleMealTiming(scheduleId, mealTiming) {
    await db.update(medicationSchedules).set({ mealTiming }).where(eq(medicationSchedules.id, scheduleId)).returning();
  }
};
var storage = new DatabaseStorage();

// server/services/openai.ts
import OpenAI from "openai";
import mammoth from "mammoth";
import pdfjsLib from "pdfjs-dist/legacy/build/pdf.js";
import pdfjsWorker from "pdfjs-dist/legacy/build/pdf.worker.js";
import { createCanvas } from "canvas";
var openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY_ENV_VAR || "default_key"
});
var EXTRACTION_SYSTEM_PROMPT = `Extract prescription data from this medical document. Return only valid JSON with this structure:

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
var CHAT_SYSTEM_PROMPT = `
You are MedGenie AI, a knowledgeable medical assistant helping users understand their prescription data. 

CORE PRINCIPLES:
1. SAFETY FIRST - Never provide medical advice that could harm
2. ACCURACY - Base responses only on provided prescription data  
3. CLARITY - Explain medical terms in simple language
4. EMPATHY - Be supportive and understanding
5. BOUNDARIES - Always recommend consulting healthcare providers

CAPABILITIES:
\u2705 Explain prescribed medications and their purposes
\u2705 Clarify dosage instructions and timing
\u2705 Identify potential drug interactions from user's prescription history
\u2705 Explain medical conditions mentioned in prescriptions
\u2705 Help track medication schedules and compliance
\u2705 Compare prescriptions from different doctors
\u2705 Provide general medication information
\u2705 Suggest questions to ask doctors

STRICT LIMITATIONS:
\u274C Never diagnose medical conditions
\u274C Never recommend changing prescribed dosages
\u274C Never suggest stopping medications
\u274C Never provide emergency medical guidance
\u274C Never replace professional medical consultation
\u274C Never speculate about conditions not in prescriptions

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
async function docxBufferToPngBase64(docxBuffer) {
  const { value: html } = await mammoth.convertToHtml({ buffer: docxBuffer });
  const canvas = createCanvas(1200, 1600);
  const ctx = canvas.getContext("2d");
  ctx.fillStyle = "#fff";
  ctx.fillRect(0, 0, 1200, 1600);
  ctx.fillStyle = "#000";
  ctx.font = "24px Arial";
  const text2 = html.replace(/<[^>]+>/g, "");
  const lines = text2.split(/\r?\n/);
  let y = 100;
  for (const line of lines) {
    ctx.fillText(line, 50, y, 1100);
    y += 32;
  }
  return canvas.toDataURL("image/png").replace(/^data:image\/png;base64,/, "");
}
async function pdfBufferToPngBase64(pdfBuffer) {
  pdfjsLib.GlobalWorkerOptions.workerSrc = pdfjsWorker;
  const pdf = await pdfjsLib.getDocument({ data: new Uint8Array(pdfBuffer) }).promise;
  const page = await pdf.getPage(1);
  const viewport = page.getViewport({ scale: 2 });
  const canvas = createCanvas(viewport.width, viewport.height);
  const ctx = canvas.getContext("2d");
  await page.render({ canvasContext: ctx, viewport }).promise;
  return canvas.toDataURL("image/png").replace(/^data:image\/png;base64,/, "");
}
async function extractPrescriptionData(base64File, mimeType, originalBuffer) {
  try {
    let imageBase64;
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
      max_tokens: 2e3,
      temperature: 0.1,
      response_format: { type: "json_object" }
    });
    if (!response.choices[0]?.message?.content) {
      throw new Error("OpenAI returned empty response");
    }
    const extractedData = JSON.parse(response.choices[0].message.content);
    return extractedData;
  } catch (error) {
    throw new Error(`Failed to extract prescription data: ${error.message}`);
  }
}
async function generateEmbedding(text2) {
  try {
    const response = await openai.embeddings.create({
      model: "text-embedding-3-small",
      input: text2,
      encoding_format: "float"
    });
    return response.data[0].embedding;
  } catch (error) {
    throw new Error(`Failed to generate embedding: ${error.message}`);
  }
}
async function generateChatResponse(userMessage, prescriptionContext) {
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
      max_tokens: 1e3,
      temperature: 0.3
    });
    return response.choices[0].message.content || "I apologize, but I couldn't generate a response. Please try again.";
  } catch (error) {
    throw new Error(`Failed to generate chat response: ${error.message}`);
  }
}
function buildEmbeddingText(prescriptionData) {
  const components = [
    `Doctor: ${prescriptionData.doctorName}`,
    prescriptionData.hospitalClinic && `Hospital: ${prescriptionData.hospitalClinic}`,
    `Diagnosis: ${prescriptionData.diagnosis}`,
    prescriptionData.specialInstructions && `Instructions: ${prescriptionData.specialInstructions}`,
    ...prescriptionData.medicines.map(
      (med) => `Medicine: ${med.name} ${med.genericName ? `(${med.genericName})` : ""} - ${med.dosage} - ${med.frequency} for ${med.duration} - ${med.instructions}`
    ),
    prescriptionData.vitalSigns && Object.entries(prescriptionData.vitalSigns).filter(([_, value]) => value).map(([key, value]) => `${key}: ${value}`).join(", "),
    `Date: ${prescriptionData.consultationDate}`
  ].filter(Boolean);
  return components.join(" | ");
}
async function generateMedicineInfo(medicineName) {
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
      throw new Error("OpenAI returned empty response");
    }
    const result = JSON.parse(content);
    return {
      sideEffects: result.sideEffects || "Information not available. Please consult your healthcare provider.",
      warnings: result.warnings || "Information not available. Please consult your healthcare provider."
    };
  } catch (error) {
    console.error("Error generating medicine info:", error);
    return {
      sideEffects: "Information not available. Please consult your healthcare provider.",
      warnings: "Information not available. Please consult your healthcare provider."
    };
  }
}

// server/services/fileProcessor.ts
import multer from "multer";
import path from "path";
import fs from "fs";
var storage2 = multer.memoryStorage();
var upload = multer({
  storage: storage2,
  limits: {
    fileSize: 10 * 1024 * 1024
    // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedMimeTypes = [
      "application/pdf",
      "image/jpeg",
      "image/png",
      "image/jpg",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
    ];
    if (allowedMimeTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("Invalid file type. Only PDF, JPG, PNG, and DOCX files are allowed."));
    }
  }
});
function convertFileToBase64(fileBuffer) {
  return fileBuffer.toString("base64");
}
function saveUploadedFile(fileBuffer, fileName) {
  const uploadsDir = path.join(process.cwd(), "uploads");
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
  }
  const filePath = path.join(uploadsDir, fileName);
  fs.writeFileSync(filePath, fileBuffer);
  return filePath;
}
function generateUniqueFileName(originalName) {
  const timestamp2 = Date.now();
  const random = Math.random().toString(36).substring(2);
  const extension = path.extname(originalName);
  const baseName = path.basename(originalName, extension);
  return `${baseName}_${timestamp2}_${random}${extension}`;
}

// server/routes.ts
async function registerRoutes(app2) {
  let demoUser = null;
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
  app2.get("/api/user", async (req, res) => {
    try {
      if (!demoUser) {
        return res.status(404).json({ error: "User not found" });
      }
      res.json(demoUser);
    } catch (error) {
      res.status(500).json({ error: "Failed to get user" });
    }
  });
  app2.post("/api/prescriptions/upload", upload.single("file"), async (req, res) => {
    try {
      if (!req.file || !demoUser) {
        return res.status(400).json({ error: "No file uploaded or user not found" });
      }
      const fileName = generateUniqueFileName(req.file.originalname);
      const filePath = saveUploadedFile(req.file.buffer, fileName);
      const publicUrl = `/uploads/${fileName}`;
      const prescription = await storage.createPrescription({
        userId: demoUser.id,
        fileName: req.file.originalname,
        fileUrl: publicUrl,
        processingStatus: "processing"
      });
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
  app2.get("/api/prescriptions", async (req, res) => {
    try {
      if (!demoUser) {
        return res.status(404).json({ error: "User not found" });
      }
      const prescriptions2 = await storage.getUserPrescriptions(demoUser.id);
      res.json(prescriptions2);
    } catch (error) {
      console.error("Get prescriptions error:", error);
      res.status(500).json({ error: "Failed to get prescriptions" });
    }
  });
  app2.get("/api/prescriptions/:id", async (req, res) => {
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
  app2.put("/api/prescriptions/:id", async (req, res) => {
    try {
      if (!demoUser) {
        return res.status(404).json({ error: "User not found" });
      }
      const id = req.params.id;
      const updates = req.body;
      const allowedFields = [
        "doctorName",
        "patientName",
        "consultationDate",
        "diagnosis",
        "instructions",
        "specialInstructions",
        "vitalSigns",
        "followUpDate"
      ];
      const updateData = {};
      for (const field of allowedFields) {
        if (updates[field] !== void 0) updateData[field] = updates[field];
      }
      await storage.updatePrescriptionProcessingStatus(id, "completed", updateData);
      if (Array.isArray(updates.medicines)) {
        await storage.deleteMedicinesByPrescriptionId(id);
        const newMeds = updates.medicines.filter((med) => med.name && med.name.trim() !== "").map((med) => ({ ...med, prescriptionId: id }));
        if (newMeds.length > 0) {
          await storage.createMedicines(newMeds);
        }
      }
      const updated = await storage.getPrescription(id);
      res.json(updated);
    } catch (error) {
      console.error("Update prescription error:", error);
      res.status(500).json({ error: "Failed to update prescription" });
    }
  });
  app2.delete("/api/prescriptions/:id", async (req, res) => {
    try {
      if (!demoUser) {
        return res.status(404).json({ error: "User not found" });
      }
      const id = req.params.id;
      const permanent = req.query.permanent === "true";
      const prescription = await storage.getPrescription(id);
      if (!prescription) {
        return res.status(404).json({ error: "Prescription not found" });
      }
      if (permanent) {
        await storage.deleteMedicinesByPrescriptionId(id);
        if (storage.deleteChatMessagesByPrescriptionId) {
          await storage.deleteChatMessagesByPrescriptionId(id);
        }
        await storage.deletePrescription(id);
        return res.json({ success: true, deleted: true });
      } else {
        await storage.updatePrescriptionProcessingStatus(id, "deleted");
        return res.json({ success: true, deleted: false });
      }
    } catch (error) {
      console.error("Delete prescription error:", error);
      res.status(500).json({ error: "Failed to delete prescription" });
    }
  });
  app2.delete("/api/prescriptions", async (req, res) => {
    try {
      if (!demoUser) {
        return res.status(404).json({ error: "User not found" });
      }
      const permanent = req.query.permanent === "true";
      const userId = demoUser.id;
      const prescriptions2 = await storage.getUserPrescriptions(userId);
      if (permanent) {
        for (const p of prescriptions2) {
          await storage.deleteMedicinesByPrescriptionId(p.id);
          if (storage.deleteChatMessagesByPrescriptionId) {
            await storage.deleteChatMessagesByPrescriptionId(p.id);
          }
          await storage.deletePrescription(p.id);
        }
        return res.json({ success: true, deleted: true });
      } else {
        for (const p of prescriptions2) {
          await storage.updatePrescriptionProcessingStatus(p.id, "deleted");
        }
        return res.json({ success: true, deleted: false });
      }
    } catch (error) {
      console.error("Delete all prescriptions error:", error);
      res.status(500).json({ error: "Failed to delete all prescriptions" });
    }
  });
  app2.post("/api/chat", async (req, res) => {
    try {
      const { message, prescriptionId } = req.body;
      if (!message || !demoUser) {
        return res.status(400).json({ error: "Message and user required" });
      }
      await storage.createChatMessage({
        userId: demoUser.id,
        prescriptionId: prescriptionId || null,
        message,
        isUserMessage: true
      });
      if (prescriptionId && /dosage timing|timing for my medications|when should I take|what time should I take/i.test(message)) {
        const prescription = await storage.getPrescription(prescriptionId);
        if (prescription && prescription.medicines && prescription.medicines.length > 0) {
          console.log("Dosage timing debug:", prescription.medicines.map((med) => ({
            name: med.name,
            frequency: med.frequency,
            instructions: med.instructions
          })));
          const points = [];
          prescription.medicines.forEach((med, idx) => {
            let medInfo = `\u2022 ${med.name ? med.name + ": " : ""}`;
            let hasInfo = false;
            if (med.frequency && med.frequency.trim().toLowerCase() !== "not mentioned") {
              medInfo += `Frequency: ${med.frequency}`;
              hasInfo = true;
            }
            if (med.instructions && med.instructions.trim().toLowerCase() !== "not mentioned") {
              if (hasInfo) medInfo += ", ";
              medInfo += `Instructions: ${med.instructions}`;
              hasInfo = true;
            }
            if (hasInfo) {
              points.push(medInfo);
            }
          });
          let responseText = "";
          if (points.length > 0) {
            responseText = `Dosage timing and instructions as per your prescription:
${points.join("\n")}`;
            const unclear = prescription.medicines.some(
              (med) => (!med.frequency || med.frequency.trim().toLowerCase() === "not mentioned") && (!med.instructions || med.instructions.trim().toLowerCase() === "not mentioned")
            );
            if (unclear) {
              responseText += "\n\nNote: Some medicines do not have clear timing or instructions mentioned. Please consult your doctor for precise dosage timings.";
            }
          } else {
            responseText = "Dosage timing and instructions are not mentioned on your prescription. Please consult your doctor before taking any medications.";
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
      let context = "";
      if (prescriptionId) {
        const prescription = await storage.getPrescription(prescriptionId);
        if (prescription) {
          context = `Current Prescription: Dr. ${prescription.doctorName}, ${prescription.diagnosis}, Medicines: ${prescription.medicines.map((m) => m.name).join(", ")}`;
        }
      } else {
        try {
          const messageEmbedding = await generateEmbedding(message);
          const similarPrescriptions = await storage.findSimilarPrescriptions(demoUser.id, messageEmbedding, 0.6, 3);
          if (similarPrescriptions.length > 0) {
            context = `Related Prescriptions: ${similarPrescriptions.map(
              (p) => `Dr. ${p.doctorName} - ${p.diagnosis} - ${p.medicines.map((m) => m.name).slice(0, 2).join(", ")}`
            ).join("; ")}`;
          }
        } catch (embeddingError) {
          console.warn("Could not generate embedding for context:", embeddingError);
        }
      }
      const aiResponse = await generateChatResponse(message, context);
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
  app2.get("/api/chat/history", async (req, res) => {
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
  app2.get("/api/timeline/schedules", async (req, res) => {
    try {
      if (!demoUser) {
        return res.status(404).json({ error: "User not found" });
      }
      const { date: date2 } = req.query;
      if (!date2) {
        return res.status(400).json({ error: "Date parameter is required" });
      }
      const targetDate = new Date(date2);
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
  app2.get("/api/timeline/status", async (req, res) => {
    try {
      if (!demoUser) {
        return res.status(404).json({ error: "User not found" });
      }
      const { date: date2 } = req.query;
      if (!date2) {
        return res.status(400).json({ error: "Date parameter is required" });
      }
      const targetDate = new Date(date2);
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
  app2.put("/api/timeline/status/:scheduleId", async (req, res) => {
    try {
      if (!demoUser) {
        return res.status(404).json({ error: "User not found" });
      }
      const { scheduleId } = req.params;
      const { status, notes, actualTime } = req.body;
      const updatedStatus = await storage.updateMedicationStatus(scheduleId, {
        status,
        notes,
        actualTime: actualTime || (/* @__PURE__ */ new Date()).toISOString()
      });
      res.json(updatedStatus);
    } catch (error) {
      console.error("Update status error:", error);
      res.status(500).json({ error: "Failed to update medication status" });
    }
  });
  app2.get("/api/timeline/conflicts", async (req, res) => {
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
  app2.post("/api/timeline/generate-schedules", async (req, res) => {
    try {
      if (!demoUser) {
        return res.status(404).json({ error: "User not found" });
      }
      const { prescriptionId, startDate, endDate } = req.body;
      const prescription = await storage.getPrescription(prescriptionId);
      if (!prescription) {
        return res.status(404).json({ error: "Prescription not found" });
      }
      const medicines2 = await storage.getMedicinesByPrescriptionId(prescriptionId);
      const schedules = [];
      for (const medicine of medicines2) {
        const medicineSchedules = await storage.generateMedicationSchedules(
          medicine,
          prescription,
          demoUser.id,
          new Date(startDate),
          endDate ? new Date(endDate) : void 0
        );
        schedules.push(...medicineSchedules);
      }
      res.json({ schedules, message: `Generated ${schedules.length} medication schedules` });
    } catch (error) {
      console.error("Generate schedules error:", error);
      res.status(500).json({ error: "Failed to generate medication schedules" });
    }
  });
  app2.post("/api/timeline/optimize", async (req, res) => {
    try {
      if (!demoUser) {
        return res.status(404).json({ error: "User not found" });
      }
      const { date: date2, conflicts } = req.body;
      const optimizedSchedules = await storage.optimizeMedicationSchedule(
        demoUser.id,
        new Date(date2),
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
  app2.put("/api/timeline/schedule/:scheduleId/meal-timing", async (req, res) => {
    try {
      if (!demoUser) {
        return res.status(404).json({ error: "User not found" });
      }
      const { scheduleId } = req.params;
      const { mealTiming } = req.body;
      await storage.updateMedicationScheduleMealTiming(scheduleId, mealTiming);
      res.json({ success: true, message: "Meal timing updated successfully" });
    } catch (error) {
      console.error("Update meal timing error:", error);
      res.status(500).json({ error: "Failed to update meal timing" });
    }
  });
  app2.get("/api/medicine-info", async (req, res) => {
    try {
      const { name } = req.query;
      if (!name || typeof name !== "string") {
        return res.status(400).json({ error: "Medicine name is required" });
      }
      const medicineInfo = await generateMedicineInfo(name);
      res.json(medicineInfo);
    } catch (error) {
      console.error("Get medicine info error:", error);
      res.status(500).json({ error: "Failed to get medicine information" });
    }
  });
  const httpServer = createServer(app2);
  return httpServer;
}
async function processFileAsync(prescriptionId, fileBuffer, mimeType) {
  try {
    await storage.updatePrescriptionProcessingStatus(prescriptionId, "processing");
    const base64File = convertFileToBase64(fileBuffer);
    const extractedData = await extractPrescriptionData(base64File, mimeType, fileBuffer);
    const confidence = calculateExtractionConfidence(extractedData);
    const parseDate = (dateStr) => {
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
    if (extractedData.medicines && extractedData.medicines.length > 0) {
      const medicines2 = extractedData.medicines.map((med) => ({
        prescriptionId,
        name: med.name,
        genericName: med.genericName,
        dosage: med.dosage,
        frequency: med.frequency,
        duration: med.duration,
        instructions: med.instructions,
        quantity: med.quantity
      }));
      await storage.createMedicines(medicines2);
    }
    const embeddingText = buildEmbeddingText(extractedData);
    const embedding = await generateEmbedding(embeddingText);
    await storage.updatePrescriptionEmbedding(prescriptionId, embedding, embeddingText);
  } catch (error) {
    console.error("File processing error:", error);
    await storage.updatePrescriptionProcessingStatus(prescriptionId, "failed");
  }
}
function calculateExtractionConfidence(data) {
  let score = 0;
  const maxScore = 10;
  if (data.doctorName) score += 2;
  if (data.diagnosis) score += 2;
  if (data.medicines && data.medicines.length > 0) score += 3;
  if (data.hospitalClinic) score += 1;
  if (data.consultationDate) score += 1;
  if (data.patientName) score += 1;
  return Math.min(score / maxScore, 1);
}

// server/vite.ts
import express from "express";
import fs2 from "fs";
import path3 from "path";
import { createServer as createViteServer, createLogger } from "vite";

// vite.config.ts
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path2 from "path";
import runtimeErrorOverlay from "@replit/vite-plugin-runtime-error-modal";
var vite_config_default = defineConfig({
  plugins: [
    react(),
    runtimeErrorOverlay(),
    ...process.env.NODE_ENV !== "production" && process.env.REPL_ID !== void 0 ? [
      await import("@replit/vite-plugin-cartographer").then(
        (m) => m.cartographer()
      )
    ] : []
  ],
  resolve: {
    alias: {
      "@": path2.resolve(import.meta.dirname, "client", "src"),
      "@shared": path2.resolve(import.meta.dirname, "shared"),
      "@assets": path2.resolve(import.meta.dirname, "attached_assets")
    }
  },
  root: path2.resolve(import.meta.dirname, "client"),
  build: {
    outDir: path2.resolve(import.meta.dirname, "dist/public"),
    emptyOutDir: true
  },
  server: {
    fs: {
      strict: true,
      deny: ["**/.*"]
    }
  },
  define: {
    // Define API base URL for different environments
    __API_BASE_URL__: JSON.stringify(
      process.env.NODE_ENV === "production" ? "/.netlify/functions/api" : "/api"
    )
  }
});

// server/vite.ts
import { nanoid } from "nanoid";
var viteLogger = createLogger();
function log(message, source = "express") {
  const formattedTime = (/* @__PURE__ */ new Date()).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true
  });
  console.log(`${formattedTime} [${source}] ${message}`);
}
async function setupVite(app2, server) {
  const serverOptions = {
    middlewareMode: true,
    hmr: { server },
    allowedHosts: true
  };
  const vite = await createViteServer({
    ...vite_config_default,
    configFile: false,
    customLogger: {
      ...viteLogger,
      error: (msg, options) => {
        viteLogger.error(msg, options);
        process.exit(1);
      }
    },
    server: serverOptions,
    appType: "custom"
  });
  app2.use(vite.middlewares);
  app2.use("*", async (req, res, next) => {
    const url = req.originalUrl;
    try {
      const clientTemplate = path3.resolve(
        import.meta.dirname,
        "..",
        "client",
        "index.html"
      );
      let template = await fs2.promises.readFile(clientTemplate, "utf-8");
      template = template.replace(
        `src="/src/main.tsx"`,
        `src="/src/main.tsx?v=${nanoid()}"`
      );
      const page = await vite.transformIndexHtml(url, template);
      res.status(200).set({ "Content-Type": "text/html" }).end(page);
    } catch (e) {
      vite.ssrFixStacktrace(e);
      next(e);
    }
  });
}
function serveStatic(app2) {
  const distPath = path3.resolve(import.meta.dirname, "public");
  if (!fs2.existsSync(distPath)) {
    throw new Error(
      `Could not find the build directory: ${distPath}, make sure to build the client first`
    );
  }
  app2.use(express.static(distPath));
  app2.use("*", (_req, res) => {
    res.sendFile(path3.resolve(distPath, "index.html"));
  });
}

// server/index.ts
import "dotenv/config";
import path4 from "path";
var app = express2();
app.use(express2.json());
app.use(express2.urlencoded({ extended: false }));
app.use("/uploads", express2.static(path4.join(process.cwd(), "uploads")));
app.use((req, res, next) => {
  const start = Date.now();
  const path5 = req.path;
  let capturedJsonResponse = void 0;
  const originalResJson = res.json;
  res.json = function(bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };
  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path5.startsWith("/api")) {
      let logLine = `${req.method} ${path5} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }
      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "\u2026";
      }
      log(logLine);
    }
  });
  next();
});
(async () => {
  const server = await registerRoutes(app);
  app.use((err, _req, res, _next) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";
    res.status(status).json({ message });
    throw err;
  });
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }
  const port = 5e3;
  server.listen(port, "localhost", () => {
    log(`serving on port ${port}`);
  });
})();
