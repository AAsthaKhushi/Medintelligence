import { pgTable, text, serial, integer, boolean, timestamp, jsonb, vector, uuid, date, real } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { relations } from "drizzle-orm";

export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  name: text("name").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const prescriptions = pgTable("prescriptions", {
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
  processingStatus: text("processing_status").notNull().default("pending"), // pending, processing, completed, failed
  extractionConfidence: real("extraction_confidence"),
  // Timeline-specific fields
  scheduleData: jsonb("schedule_data"), // Parsed schedule information
  priorityLevel: text("priority_level").default("medium"), // critical, high, medium, low
  startDate: date("start_date"),
  endDate: date("end_date"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const medicines = pgTable("medicines", {
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
  timingInstructions: text("timing_instructions"), // "with food", "empty stomach", "bedtime"
  priorityLevel: text("priority_level").default("medium"), // critical, high, medium, low
  administrationRoute: text("administration_route").default("oral"), // oral, topical, injection, etc.
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// New table for medication schedules
export const medicationSchedules = pgTable("medication_schedules", {
  id: uuid("id").primaryKey().defaultRandom(),
  medicineId: uuid("medicine_id").notNull().references(() => medicines.id, { onDelete: "cascade" }),
  prescriptionId: uuid("prescription_id").notNull().references(() => prescriptions.id, { onDelete: "cascade" }),
  userId: uuid("user_id").notNull().references(() => users.id),
  scheduledTime: timestamp("scheduled_time").notNull(),
  frequency: text("frequency").notNull(), // "BID", "TID", "QID", "every 4 hours", etc.
  startDate: date("start_date").notNull(),
  endDate: date("end_date"),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// New table for medication status tracking
export const medicationStatus = pgTable("medication_status", {
  id: uuid("id").primaryKey().defaultRandom(),
  scheduleId: uuid("schedule_id").notNull().references(() => medicationSchedules.id, { onDelete: "cascade" }),
  medicineId: uuid("medicine_id").notNull().references(() => medicines.id, { onDelete: "cascade" }),
  prescriptionId: uuid("prescription_id").notNull().references(() => prescriptions.id, { onDelete: "cascade" }),
  userId: uuid("user_id").notNull().references(() => users.id),
  scheduledTime: timestamp("scheduled_time").notNull(),
  actualTime: timestamp("actual_time"),
  status: text("status").notNull().default("upcoming"), // upcoming, taken, missed, skipped
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// New table for medication conflicts
export const medicationConflicts = pgTable("medication_conflicts", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").notNull().references(() => users.id),
  medicineId1: uuid("medicine_id_1").notNull().references(() => medicines.id, { onDelete: "cascade" }),
  medicineId2: uuid("medicine_id_2").notNull().references(() => medicines.id, { onDelete: "cascade" }),
  conflictType: text("conflict_type").notNull(), // timing, interaction, contraindication
  severity: text("severity").notNull(), // minor, moderate, severe, critical
  description: text("description").notNull(),
  suggestedResolution: text("suggested_resolution"),
  isResolved: boolean("is_resolved").default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const chatConversations = pgTable("chat_conversations", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").notNull().references(() => users.id),
  prescriptionId: uuid("prescription_id").references(() => prescriptions.id),
  message: text("message").notNull(),
  isUserMessage: boolean("is_user_message").notNull(),
  context: jsonb("context"), // Related prescriptions and medical context
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  prescriptions: many(prescriptions),
  chatConversations: many(chatConversations),
  medicationSchedules: many(medicationSchedules),
  medicationStatus: many(medicationStatus),
  medicationConflicts: many(medicationConflicts),
}));

export const prescriptionsRelations = relations(prescriptions, ({ one, many }) => ({
  user: one(users, {
    fields: [prescriptions.userId],
    references: [users.id],
  }),
  medicines: many(medicines),
  chatConversations: many(chatConversations),
  medicationSchedules: many(medicationSchedules),
  medicationStatus: many(medicationStatus),
}));

export const medicinesRelations = relations(medicines, ({ one, many }) => ({
  prescription: one(prescriptions, {
    fields: [medicines.prescriptionId],
    references: [prescriptions.id],
  }),
  medicationSchedules: many(medicationSchedules),
  medicationStatus: many(medicationStatus),
  conflictsAsFirst: many(medicationConflicts, { relationName: "medicine1" }),
  conflictsAsSecond: many(medicationConflicts, { relationName: "medicine2" }),
}));

export const medicationSchedulesRelations = relations(medicationSchedules, ({ one, many }) => ({
  medicine: one(medicines, {
    fields: [medicationSchedules.medicineId],
    references: [medicines.id],
  }),
  prescription: one(prescriptions, {
    fields: [medicationSchedules.prescriptionId],
    references: [prescriptions.id],
  }),
  user: one(users, {
    fields: [medicationSchedules.userId],
    references: [users.id],
  }),
  medicationStatus: many(medicationStatus),
}));

export const medicationStatusRelations = relations(medicationStatus, ({ one }) => ({
  schedule: one(medicationSchedules, {
    fields: [medicationStatus.scheduleId],
    references: [medicationSchedules.id],
  }),
  medicine: one(medicines, {
    fields: [medicationStatus.medicineId],
    references: [medicines.id],
  }),
  prescription: one(prescriptions, {
    fields: [medicationStatus.prescriptionId],
    references: [prescriptions.id],
  }),
  user: one(users, {
    fields: [medicationStatus.userId],
    references: [users.id],
  }),
}));

export const medicationConflictsRelations = relations(medicationConflicts, ({ one }) => ({
  user: one(users, {
    fields: [medicationConflicts.userId],
    references: [users.id],
  }),
  medicine1: one(medicines, {
    fields: [medicationConflicts.medicineId1],
    references: [medicines.id],
    relationName: "medicine1",
  }),
  medicine2: one(medicines, {
    fields: [medicationConflicts.medicineId2],
    references: [medicines.id],
    relationName: "medicine2",
  }),
}));

export const chatConversationsRelations = relations(chatConversations, ({ one }) => ({
  user: one(users, {
    fields: [chatConversations.userId],
    references: [users.id],
  }),
  prescription: one(prescriptions, {
    fields: [chatConversations.prescriptionId],
    references: [prescriptions.id],
  }),
}));

// Zod schemas
export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
  name: true,
});

export const insertPrescriptionSchema = createInsertSchema(prescriptions).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertMedicineSchema = createInsertSchema(medicines).omit({
  id: true,
  createdAt: true,
});

export const insertChatConversationSchema = createInsertSchema(chatConversations).omit({
  id: true,
  createdAt: true,
});

export const insertMedicationScheduleSchema = createInsertSchema(medicationSchedules).omit({
  id: true,
  createdAt: true,
});

export const insertMedicationStatusSchema = createInsertSchema(medicationStatus).omit({
  id: true,
  createdAt: true,
});

export const insertMedicationConflictSchema = createInsertSchema(medicationConflicts).omit({
  id: true,
  createdAt: true,
});

// Types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

export type Prescription = typeof prescriptions.$inferSelect;
export type InsertPrescription = z.infer<typeof insertPrescriptionSchema>;

export type Medicine = typeof medicines.$inferSelect;
export type InsertMedicine = z.infer<typeof insertMedicineSchema>;

export type ChatConversation = typeof chatConversations.$inferSelect;
export type InsertChatConversation = z.infer<typeof insertChatConversationSchema>;

export type MedicationSchedule = typeof medicationSchedules.$inferSelect;
export type InsertMedicationSchedule = z.infer<typeof insertMedicationScheduleSchema>;

export type MedicationStatus = typeof medicationStatus.$inferSelect;
export type InsertMedicationStatus = z.infer<typeof insertMedicationStatusSchema>;

export type MedicationConflict = typeof medicationConflicts.$inferSelect;
export type InsertMedicationConflict = z.infer<typeof insertMedicationConflictSchema>;

// Extended types for API responses
export type PrescriptionWithMedicines = Prescription & {
  medicines: Medicine[];
};

export type MedicineWithSchedule = Medicine & {
  schedules: MedicationSchedule[];
  status: MedicationStatus[];
};

export type TimelineEvent = {
  id: string;
  time: Date;
  medicine: Medicine;
  prescription: Prescription;
  schedule: MedicationSchedule;
  status: MedicationStatus;
  conflicts: MedicationConflict[];
};

export type ExtractedPrescriptionData = {
  doctorName: string;
  hospitalClinic: string;
  consultationDate: string;
  patientName: string;
  diagnosis: string;
  medicines: {
    name: string;
    genericName?: string;
    dosage: string;
    frequency: string;
    duration: string;
    instructions: string;
    quantity: string;
  }[];
  vitalSigns: {
    bloodPressure?: string;
    temperature?: string;
    weight?: string;
    pulse?: string;
  };
  followUpDate?: string;
  specialInstructions: string;
  prescriptionNumber?: string;
};
