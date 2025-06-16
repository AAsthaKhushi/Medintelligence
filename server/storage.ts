import { 
  users, 
  prescriptions, 
  medicines, 
  chatConversations,
  type User, 
  type InsertUser,
  type Prescription,
  type InsertPrescription,
  type PrescriptionWithMedicines,
  type Medicine,
  type InsertMedicine,
  type ChatConversation,
  type InsertChatConversation
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, and, sql } from "drizzle-orm";

export interface IStorage {
  // User methods
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;

  // Prescription methods
  createPrescription(prescription: InsertPrescription): Promise<Prescription>;
  getPrescription(id: string): Promise<PrescriptionWithMedicines | undefined>;
  getUserPrescriptions(userId: string): Promise<PrescriptionWithMedicines[]>;
  updatePrescriptionProcessingStatus(id: string, status: string, data?: Partial<Prescription>): Promise<void>;
  updatePrescriptionEmbedding(id: string, embedding: number[], extractedText: string): Promise<void>;

  // Medicine methods
  createMedicine(medicine: InsertMedicine): Promise<Medicine>;
  createMedicines(medicines: InsertMedicine[]): Promise<Medicine[]>;

  // Chat methods
  createChatMessage(message: InsertChatConversation): Promise<ChatConversation>;
  getChatHistory(userId: string, limit?: number): Promise<ChatConversation[]>;

  // Vector search
  findSimilarPrescriptions(userId: string, embedding: number[], threshold?: number, limit?: number): Promise<PrescriptionWithMedicines[]>;
}

export class DatabaseStorage implements IStorage {
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(insertUser)
      .returning();
    return user;
  }

  async createPrescription(prescription: InsertPrescription): Promise<Prescription> {
    const [created] = await db
      .insert(prescriptions)
      .values(prescription)
      .returning();
    return created;
  }

  async getPrescription(id: string): Promise<PrescriptionWithMedicines | undefined> {
    const [prescription] = await db
      .select()
      .from(prescriptions)
      .where(eq(prescriptions.id, id));

    if (!prescription) return undefined;

    const prescriptionMedicines = await db
      .select()
      .from(medicines)
      .where(eq(medicines.prescriptionId, id));

    return {
      ...prescription,
      medicines: prescriptionMedicines,
    };
  }

  async getUserPrescriptions(userId: string): Promise<PrescriptionWithMedicines[]> {
    const userPrescriptions = await db
      .select()
      .from(prescriptions)
      .where(eq(prescriptions.userId, userId))
      .orderBy(desc(prescriptions.createdAt));

    const prescriptionsWithMedicines = await Promise.all(
      userPrescriptions.map(async (prescription) => {
        const prescriptionMedicines = await db
          .select()
          .from(medicines)
          .where(eq(medicines.prescriptionId, prescription.id));

        return {
          ...prescription,
          medicines: prescriptionMedicines,
        };
      })
    );

    return prescriptionsWithMedicines;
  }

  async updatePrescriptionProcessingStatus(id: string, status: string, data?: Partial<Prescription>): Promise<void> {
    await db
      .update(prescriptions)
      .set({
        processingStatus: status,
        updatedAt: new Date(),
        ...data,
      })
      .where(eq(prescriptions.id, id));
  }

  async updatePrescriptionEmbedding(id: string, embedding: number[], extractedText: string): Promise<void> {
    await db
      .update(prescriptions)
      .set({
        embedding: sql`${JSON.stringify(embedding)}::vector`,
        extractedText,
        updatedAt: new Date(),
      })
      .where(eq(prescriptions.id, id));
  }

  async createMedicine(medicine: InsertMedicine): Promise<Medicine> {
    const [created] = await db
      .insert(medicines)
      .values(medicine)
      .returning();
    return created;
  }

  async createMedicines(medicineList: InsertMedicine[]): Promise<Medicine[]> {
    if (medicineList.length === 0) return [];
    
    const created = await db
      .insert(medicines)
      .values(medicineList)
      .returning();
    return created;
  }

  async createChatMessage(message: InsertChatConversation): Promise<ChatConversation> {
    const [created] = await db
      .insert(chatConversations)
      .values(message)
      .returning();
    return created;
  }

  async getChatHistory(userId: string, limit: number = 50): Promise<ChatConversation[]> {
    return await db
      .select()
      .from(chatConversations)
      .where(eq(chatConversations.userId, userId))
      .orderBy(desc(chatConversations.createdAt))
      .limit(limit);
  }

  async findSimilarPrescriptions(
    userId: string, 
    embedding: number[], 
    threshold: number = 0.7, 
    limit: number = 5
  ): Promise<PrescriptionWithMedicines[]> {
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
        results.map(async (prescription: any) => {
          const prescriptionMedicines = await db
            .select()
            .from(medicines)
            .where(eq(medicines.prescriptionId, prescription.id));

          return {
            ...prescription,
            medicines: prescriptionMedicines,
          };
        })
      );

      return prescriptionsWithMedicines;
    } catch (error) {
      console.error('Vector search error:', error);
      return [];
    }
  }
}

export const storage = new DatabaseStorage();
