import { 
  users, 
  prescriptions, 
  medicines, 
  chatConversations,
  medicationSchedules,
  medicationStatus,
  medicationConflicts,
  type User, 
  type InsertUser,
  type Prescription,
  type InsertPrescription,
  type PrescriptionWithMedicines,
  type Medicine,
  type InsertMedicine,
  type ChatConversation,
  type InsertChatConversation,
  type MedicationSchedule,
  type InsertMedicationSchedule,
  type MedicationStatus,
  type InsertMedicationStatus,
  type MedicationConflict,
  type InsertMedicationConflict
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, and, sql, gte, lte } from "drizzle-orm";

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
  deleteMedicinesByPrescriptionId(prescriptionId: string): Promise<void>;
  getMedicinesByPrescriptionId(prescriptionId: string): Promise<Medicine[]>;

  // Chat methods
  createChatMessage(message: InsertChatConversation): Promise<ChatConversation>;
  getChatHistory(userId: string, limit?: number): Promise<ChatConversation[]>;

  // Vector search
  findSimilarPrescriptions(userId: string, embedding: number[], threshold?: number, limit?: number): Promise<PrescriptionWithMedicines[]>;

  // Timeline methods
  getMedicationSchedulesForDate(userId: string, startDate: Date, endDate: Date): Promise<MedicationSchedule[]>;
  getMedicationStatusForDate(userId: string, startDate: Date, endDate: Date): Promise<MedicationStatus[]>;
  updateMedicationStatus(scheduleId: string, data: Partial<MedicationStatus>): Promise<MedicationStatus>;
  getMedicationConflicts(userId: string): Promise<MedicationConflict[]>;
  generateMedicationSchedules(medicine: Medicine, prescription: Prescription, userId: string, startDate: Date, endDate?: Date): Promise<MedicationSchedule[]>;
  optimizeMedicationSchedule(userId: string, date: Date, conflicts: string[]): Promise<MedicationSchedule[]>;

  // New methods
  deletePrescription(id: string): Promise<void>;
  deleteChatMessagesByPrescriptionId(prescriptionId: string): Promise<void>;
  updateMedicationScheduleMealTiming(scheduleId: string, mealTiming: string): Promise<void>;
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

  async deleteMedicinesByPrescriptionId(prescriptionId: string): Promise<void> {
    await db.delete(medicines).where(eq(medicines.prescriptionId, prescriptionId));
  }

  async getMedicinesByPrescriptionId(prescriptionId: string): Promise<Medicine[]> {
    const medicineList = await db
      .select()
      .from(medicines)
      .where(eq(medicines.prescriptionId, prescriptionId));
    return medicineList;
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

  async deletePrescription(id: string): Promise<void> {
    await db.delete(prescriptions).where(eq(prescriptions.id, id));
  }

  async deleteChatMessagesByPrescriptionId(prescriptionId: string): Promise<void> {
    await db.delete(chatConversations).where(eq(chatConversations.prescriptionId, prescriptionId));
  }

  async getMedicationSchedulesForDate(userId: string, startDate: Date, endDate: Date): Promise<MedicationSchedule[]> {
    const schedules = await db
      .select()
      .from(medicationSchedules)
      .where(
        and(
          eq(medicationSchedules.userId, userId),
          gte(medicationSchedules.scheduledTime, startDate),
          lte(medicationSchedules.scheduledTime, endDate)
        )
      );
    return schedules;
  }

  async getMedicationStatusForDate(userId: string, startDate: Date, endDate: Date): Promise<MedicationStatus[]> {
    const statuses = await db
      .select()
      .from(medicationStatus)
      .where(
        and(
          eq(medicationStatus.userId, userId),
          gte(medicationStatus.scheduledTime, startDate),
          lte(medicationStatus.scheduledTime, endDate)
        )
      );
    return statuses;
  }

  async updateMedicationStatus(scheduleId: string, data: Partial<MedicationStatus>): Promise<MedicationStatus> {
    const [updated] = await db
      .update(medicationStatus)
      .set(data)
      .where(eq(medicationStatus.scheduleId, scheduleId))
      .returning();
    return updated;
  }

  async getMedicationConflicts(userId: string): Promise<MedicationConflict[]> {
    const conflicts = await db
      .select()
      .from(medicationConflicts)
      .where(eq(medicationConflicts.userId, userId));
    return conflicts;
  }

  async generateMedicationSchedules(medicine: Medicine, prescription: Prescription, userId: string, startDate: Date, endDate?: Date): Promise<MedicationSchedule[]> {
    // Remove existing schedules for this medicine
    await db.delete(medicationSchedules).where(eq(medicationSchedules.medicineId, medicine.id));

    // Fallbacks and warnings
    const warnings: string[] = [];

    // Fallback for start date
    let actualStartDate = startDate;
    if (!(actualStartDate instanceof Date) || isNaN(actualStartDate.getTime())) {
      if (prescription.consultationDate && !isNaN(new Date(prescription.consultationDate).getTime())) {
        actualStartDate = new Date(prescription.consultationDate);
      } else if (prescription.createdAt && !isNaN(new Date(prescription.createdAt).getTime())) {
        actualStartDate = new Date(prescription.createdAt);
      } else {
        actualStartDate = new Date();
        warnings.push(`No valid consultationDate or createdAt for prescription ${prescription.id}, using today as start date.`);
      }
    }

    // Parse duration (e.g., '5 days')
    let numDays = 1;
    if (medicine.duration) {
      const match = medicine.duration.match(/(\d+)/);
      if (match) numDays = parseInt(match[1], 10);
    }
    if (!numDays || numDays < 1) {
      numDays = 1;
      warnings.push(`No valid duration for medicine ${medicine.name}, defaulting to 1 day.`);
    }

    // Determine administration route (application vs oral)
    const isApplication = (medicine.administrationRoute && medicine.administrationRoute.toLowerCase() !== 'oral') || /eye|skin|drop|ointment|apply|nasal|topical|cream|gel|spray/i.test(medicine.name || '');
    const isOral = !isApplication;

    // Parse frequency and assign times
    let timesPerDay = 1;
    let times: number[] = [8]; // Default 8am
    let mealTimings: string[] = [];
    let freqUsed = medicine.frequency ? medicine.frequency.toLowerCase() : '';
    if (!freqUsed) {
      freqUsed = 'once a day';
      warnings.push(`No frequency for medicine ${medicine.name}, defaulting to 'once a day'.`);
    }
    if (isApplication) {
      if (freqUsed.includes('once')) { timesPerDay = 1; times = [8]; }
      else if (freqUsed.includes('twice') || freqUsed.includes('2')) { timesPerDay = 2; times = [8, 20]; }
      else if (freqUsed.includes('three') || freqUsed.includes('3')) { timesPerDay = 3; times = [8, 14, 20]; }
      else if (freqUsed.includes('four') || freqUsed.includes('4')) { timesPerDay = 4; times = [8, 12, 16, 20]; }
    } else if (isOral) {
      if (freqUsed.includes('once')) { timesPerDay = 1; times = [8]; mealTimings = ['breakfast']; }
      else if (freqUsed.includes('twice') || freqUsed.includes('2')) { timesPerDay = 2; times = [8, 20]; mealTimings = ['breakfast', 'dinner']; }
      else if (freqUsed.includes('three') || freqUsed.includes('3')) { timesPerDay = 3; times = [8, 13, 20]; mealTimings = ['breakfast', 'lunch', 'dinner']; }
      else if (freqUsed.includes('four') || freqUsed.includes('4')) { timesPerDay = 4; times = [8, 12, 16, 20]; mealTimings = ['breakfast', 'lunch', 'evening', 'dinner']; }
    }

    // Generate schedules
    const schedules: MedicationSchedule[] = [];
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
          endDate: (endDate ? new Date(endDate) : new Date(actualStartDate.getTime() + (numDays - 1) * 24 * 60 * 60 * 1000)).toISOString().slice(0, 10),
          isActive: true,
          createdAt: new Date(),
          // Add mealTiming for oral medicines
          ...(isOral && mealTimings[t] ? { mealTiming: mealTimings[t] } : {})
        } as any);
      }
    }
    // Insert into DB
    if (schedules.length > 0) {
      await db.insert(medicationSchedules).values(schedules);
    } else {
      warnings.push(`No schedules generated for medicine ${medicine.name} in prescription ${prescription.id}.`);
    }
    // Optionally log warnings
    if (warnings.length > 0) {
      console.warn('Schedule generation warnings:', warnings);
    }
    return schedules;
  }

  async optimizeMedicationSchedule(userId: string, date: Date, conflicts: string[]): Promise<MedicationSchedule[]> {
    // For now, return empty array - this would be implemented with AI optimization
    // In a real implementation, this would use AI to optimize the schedule
    return [];
  }

  async updateMedicationScheduleMealTiming(scheduleId: string, mealTiming: string): Promise<void> {
    await db
      .update(medicationSchedules)
      .set({ mealTiming })
      .where(eq(medicationSchedules.id, scheduleId))
      .returning();
  }
}

export const storage = new DatabaseStorage();
