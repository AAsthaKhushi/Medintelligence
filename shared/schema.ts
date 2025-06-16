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
}));

export const prescriptionsRelations = relations(prescriptions, ({ one, many }) => ({
  user: one(users, {
    fields: [prescriptions.userId],
    references: [users.id],
  }),
  medicines: many(medicines),
  chatConversations: many(chatConversations),
}));

export const medicinesRelations = relations(medicines, ({ one }) => ({
  prescription: one(prescriptions, {
    fields: [medicines.prescriptionId],
    references: [prescriptions.id],
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

// Types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

export type Prescription = typeof prescriptions.$inferSelect;
export type InsertPrescription = z.infer<typeof insertPrescriptionSchema>;

export type Medicine = typeof medicines.$inferSelect;
export type InsertMedicine = z.infer<typeof insertMedicineSchema>;

export type ChatConversation = typeof chatConversations.$inferSelect;
export type InsertChatConversation = z.infer<typeof insertChatConversationSchema>;

// Extended types for API responses
export type PrescriptionWithMedicines = Prescription & {
  medicines: Medicine[];
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
