import { Medicine, Prescription, MedicationSchedule, MedicationStatus, MedicationConflict, TimelineEvent } from '@shared/schema';

export type FrequencyPattern = 'BID' | 'TID' | 'QID' | 'QD' | 'PRN' | 'interval' | 'custom';
export type PriorityLevel = 'critical' | 'high' | 'medium' | 'low';
export type AdministrationRoute = 'oral' | 'topical' | 'injection' | 'inhalation' | 'sublingual';
export type MedicationStatusType = 'upcoming' | 'taken' | 'missed' | 'skipped';
export type ConflictType = 'timing' | 'interaction' | 'contraindication';
export type ConflictSeverity = 'minor' | 'moderate' | 'severe' | 'critical';

export interface ParsedFrequency {
  pattern: FrequencyPattern;
  timesPerDay: number;
  intervalHours?: number;
  customTimes?: string[];
  instructions?: string;
}

export interface ScheduleSlot {
  time: Date;
  medications: {
    medicine: Medicine;
    prescription: Prescription;
    schedule: MedicationSchedule;
    status: MedicationStatus;
  }[];
  conflicts: MedicationConflict[];
}

export interface TimelineDay {
  date: Date;
  slots: ScheduleSlot[];
  totalMedications: number;
  completedMedications: number;
  missedMedications: number;
}

// Frequency parsing utilities
export function parseFrequencyToSchedule(frequency: string, startDate: Date, endDate?: Date): ParsedFrequency {
  const freq = frequency.toLowerCase().trim();
  
  // Standard medical abbreviations
  if (freq.includes('bid') || freq.includes('twice daily') || freq.includes('2x daily')) {
    return {
      pattern: 'BID',
      timesPerDay: 2,
      instructions: extractTimingInstructions(frequency)
    };
  }
  
  if (freq.includes('tid') || freq.includes('three times daily') || freq.includes('3x daily')) {
    return {
      pattern: 'TID',
      timesPerDay: 3,
      instructions: extractTimingInstructions(frequency)
    };
  }
  
  if (freq.includes('qid') || freq.includes('four times daily') || freq.includes('4x daily')) {
    return {
      pattern: 'QID',
      timesPerDay: 4,
      instructions: extractTimingInstructions(frequency)
    };
  }
  
  if (freq.includes('qd') || freq.includes('once daily') || freq.includes('daily') || freq.includes('1x daily')) {
    return {
      pattern: 'QD',
      timesPerDay: 1,
      instructions: extractTimingInstructions(frequency)
    };
  }
  
  if (freq.includes('prn') || freq.includes('as needed') || freq.includes('when needed')) {
    return {
      pattern: 'PRN',
      timesPerDay: 0,
      instructions: extractTimingInstructions(frequency)
    };
  }
  
  // Interval-based patterns
  const intervalMatch = freq.match(/(?:every|each)\s+(\d+)\s+(?:hour|hr)s?/i);
  if (intervalMatch) {
    const hours = parseInt(intervalMatch[1]);
    return {
      pattern: 'interval',
      timesPerDay: Math.floor(24 / hours),
      intervalHours: hours,
      instructions: extractTimingInstructions(frequency)
    };
  }
  
  // Custom times (e.g., "8 AM and 8 PM", "morning and evening")
  const customTimes = extractCustomTimes(frequency);
  if (customTimes.length > 0) {
    return {
      pattern: 'custom',
      timesPerDay: customTimes.length,
      customTimes,
      instructions: extractTimingInstructions(frequency)
    };
  }
  
  // Default fallback
  return {
    pattern: 'custom',
    timesPerDay: 1,
    instructions: frequency
  };
}

function extractTimingInstructions(frequency: string): string | undefined {
  const instructions = [];
  
  if (frequency.toLowerCase().includes('with food') || frequency.toLowerCase().includes('after meal')) {
    instructions.push('Take with food');
  }
  
  if (frequency.toLowerCase().includes('empty stomach') || frequency.toLowerCase().includes('before meal')) {
    instructions.push('Take on empty stomach');
  }
  
  if (frequency.toLowerCase().includes('bedtime') || frequency.toLowerCase().includes('at night')) {
    instructions.push('Take at bedtime');
  }
  
  if (frequency.toLowerCase().includes('morning')) {
    instructions.push('Take in morning');
  }
  
  return instructions.length > 0 ? instructions.join(', ') : undefined;
}

function extractCustomTimes(frequency: string): string[] {
  const times: string[] = [];
  
  // Extract specific times like "8 AM", "8:30 PM"
  const timeMatches = frequency.match(/(\d{1,2}(?::\d{2})?\s*(?:am|pm))/gi);
  if (timeMatches) {
    times.push(...timeMatches);
  }
  
  // Extract relative times like "morning", "evening", "bedtime"
  if (frequency.toLowerCase().includes('morning')) times.push('8:00 AM');
  if (frequency.toLowerCase().includes('evening')) times.push('6:00 PM');
  if (frequency.toLowerCase().includes('bedtime') || frequency.toLowerCase().includes('night')) {
    times.push('9:00 PM');
  }
  
  return times;
}

// Schedule generation
export function generateMedicationSchedule(
  medicine: Medicine,
  prescription: Prescription,
  userId: string,
  startDate: Date,
  endDate?: Date
): MedicationSchedule[] {
  const parsed = parseFrequencyToSchedule(medicine.frequency, startDate, endDate);
  const schedules: MedicationSchedule[] = [];
  
  if (parsed.pattern === 'PRN') {
    // PRN medications don't have fixed schedules
    return schedules;
  }
  
  const currentDate = new Date(startDate);
  const end = endDate ? new Date(endDate) : new Date(startDate.getTime() + 30 * 24 * 60 * 60 * 1000); // 30 days default
  
  while (currentDate <= end) {
    const times = getTimesForDay(parsed, currentDate);
    
    for (const time of times) {
      schedules.push({
        id: crypto.randomUUID(),
        medicineId: medicine.id,
        prescriptionId: prescription.id,
        userId,
        scheduledTime: time,
        frequency: medicine.frequency,
        startDate: currentDate,
        endDate: endDate || null,
        isActive: true,
        createdAt: new Date()
      });
    }
    
    currentDate.setDate(currentDate.getDate() + 1);
  }
  
  return schedules;
}

function getTimesForDay(parsed: ParsedFrequency, date: Date): Date[] {
  const times: Date[] = [];
  
  switch (parsed.pattern) {
    case 'BID':
      times.push(
        new Date(date.getFullYear(), date.getMonth(), date.getDate(), 8, 0, 0), // 8 AM
        new Date(date.getFullYear(), date.getMonth(), date.getDate(), 20, 0, 0) // 8 PM
      );
      break;
      
    case 'TID':
      times.push(
        new Date(date.getFullYear(), date.getMonth(), date.getDate(), 8, 0, 0),  // 8 AM
        new Date(date.getFullYear(), date.getMonth(), date.getDate(), 14, 0, 0), // 2 PM
        new Date(date.getFullYear(), date.getMonth(), date.getDate(), 20, 0, 0)  // 8 PM
      );
      break;
      
    case 'QID':
      times.push(
        new Date(date.getFullYear(), date.getMonth(), date.getDate(), 6, 0, 0),  // 6 AM
        new Date(date.getFullYear(), date.getMonth(), date.getDate(), 12, 0, 0), // 12 PM
        new Date(date.getFullYear(), date.getMonth(), date.getDate(), 18, 0, 0), // 6 PM
        new Date(date.getFullYear(), date.getMonth(), date.getDate(), 22, 0, 0)  // 10 PM
      );
      break;
      
    case 'QD':
      times.push(
        new Date(date.getFullYear(), date.getMonth(), date.getDate(), 8, 0, 0) // 8 AM
      );
      break;
      
    case 'interval':
      if (parsed.intervalHours) {
        const startHour = 8; // Start at 8 AM
        for (let i = 0; i < parsed.timesPerDay; i++) {
          const hour = startHour + (i * parsed.intervalHours);
          if (hour < 24) {
            times.push(
              new Date(date.getFullYear(), date.getMonth(), date.getDate(), hour, 0, 0)
            );
          }
        }
      }
      break;
      
    case 'custom':
      if (parsed.customTimes) {
        for (const timeStr of parsed.customTimes) {
          const time = parseTimeString(timeStr, date);
          if (time) times.push(time);
        }
      } else {
        // Default to 8 AM if no custom times found
        times.push(
          new Date(date.getFullYear(), date.getMonth(), date.getDate(), 8, 0, 0)
        );
      }
      break;
  }
  
  return times;
}

function parseTimeString(timeStr: string, date: Date): Date | null {
  const match = timeStr.match(/(\d{1,2})(?::(\d{2}))?\s*(am|pm)/i);
  if (!match) return null;
  
  let hour = parseInt(match[1]);
  const minute = match[2] ? parseInt(match[2]) : 0;
  const period = match[3].toLowerCase();
  
  if (period === 'pm' && hour !== 12) hour += 12;
  if (period === 'am' && hour === 12) hour = 0;
  
  return new Date(date.getFullYear(), date.getMonth(), date.getDate(), hour, minute, 0);
}

// Conflict detection
export function detectMedicationConflicts(
  schedules: MedicationSchedule[],
  medicines: Medicine[],
  prescriptions: Prescription[]
): MedicationConflict[] {
  const conflicts: MedicationConflict[] = [];
  
  // Group schedules by time slots (within 30 minutes)
  const timeSlots = new Map<string, MedicationSchedule[]>();
  
  for (const schedule of schedules) {
    const slotKey = getTimeSlotKey(schedule.scheduledTime);
    if (!timeSlots.has(slotKey)) {
      timeSlots.set(slotKey, []);
    }
    timeSlots.get(slotKey)!.push(schedule);
  }
  
  // Check for timing conflicts
  for (const [slotKey, slotSchedules] of timeSlots) {
    if (slotSchedules.length > 1) {
      // Multiple medications at the same time
      for (let i = 0; i < slotSchedules.length; i++) {
        for (let j = i + 1; j < slotSchedules.length; j++) {
          const schedule1 = slotSchedules[i];
          const schedule2 = slotSchedules[j];
          
          const medicine1 = medicines.find(m => m.id === schedule1.medicineId);
          const medicine2 = medicines.find(m => m.id === schedule2.medicineId);
          
          if (medicine1 && medicine2) {
            const conflict = createTimingConflict(schedule1, schedule2, medicine1, medicine2);
            if (conflict) conflicts.push(conflict);
          }
        }
      }
    }
  }
  
  // Check for drug interaction conflicts
  const interactionConflicts = detectDrugInteractions(medicines);
  conflicts.push(...interactionConflicts);
  
  return conflicts;
}

function getTimeSlotKey(date: Date): string {
  const hour = date.getHours();
  const minute = Math.floor(date.getMinutes() / 30) * 30; // Round to nearest 30 minutes
  return `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
}

function createTimingConflict(
  schedule1: MedicationSchedule,
  schedule2: MedicationSchedule,
  medicine1: Medicine,
  medicine2: Medicine
): MedicationConflict | null {
  // Check if both medications require food or empty stomach
  const foodConflict = checkFoodRequirementConflict(medicine1, medicine2);
  if (foodConflict) {
    return {
      id: crypto.randomUUID(),
      userId: schedule1.userId,
      medicineId1: medicine1.id,
      medicineId2: medicine2.id,
      conflictType: 'timing',
      severity: 'moderate',
      description: `Food requirement conflict: ${medicine1.name} and ${medicine2.name} have conflicting food requirements`,
      suggestedResolution: 'Consider spacing these medications by at least 2 hours',
      isResolved: false,
      createdAt: new Date()
    };
  }
  
  // Check for critical medication conflicts
  if (medicine1.priorityLevel === 'critical' || medicine2.priorityLevel === 'critical') {
    return {
      id: crypto.randomUUID(),
      userId: schedule1.userId,
      medicineId1: medicine1.id,
      medicineId2: medicine2.id,
      conflictType: 'timing',
      severity: 'severe',
      description: `Critical medication timing conflict: ${medicine1.name} and ${medicine2.name} are scheduled at the same time`,
      suggestedResolution: 'Consult your doctor immediately to resolve this conflict',
      isResolved: false,
      createdAt: new Date()
    };
  }
  
  return null;
}

function checkFoodRequirementConflict(medicine1: Medicine, medicine2: Medicine): boolean {
  const instructions1 = medicine1.timingInstructions?.toLowerCase() || '';
  const instructions2 = medicine2.timingInstructions?.toLowerCase() || '';
  
  const food1 = instructions1.includes('with food') || instructions1.includes('after meal');
  const food2 = instructions2.includes('with food') || instructions2.includes('after meal');
  const empty1 = instructions1.includes('empty stomach') || instructions1.includes('before meal');
  const empty2 = instructions2.includes('empty stomach') || instructions2.includes('before meal');
  
  return (food1 && empty2) || (food2 && empty1);
}

function detectDrugInteractions(medicines: Medicine[]): MedicationConflict[] {
  const conflicts: MedicationConflict[] = [];
  
  // This is a simplified interaction detection
  // In a real application, you would integrate with a drug interaction database
  const knownInteractions = [
    {
      drugs: ['warfarin', 'aspirin'],
      severity: 'severe' as ConflictSeverity,
      description: 'Increased risk of bleeding when taken together'
    },
    {
      drugs: ['simvastatin', 'amiodarone'],
      severity: 'moderate' as ConflictSeverity,
      description: 'May increase risk of muscle damage'
    }
  ];
  
  for (const interaction of knownInteractions) {
    const foundMedicines = medicines.filter(med => 
      interaction.drugs.some(drug => 
        med.name.toLowerCase().includes(drug) || 
        med.genericName?.toLowerCase().includes(drug)
      )
    );
    
    if (foundMedicines.length >= 2) {
      conflicts.push({
        id: crypto.randomUUID(),
        userId: '', // Will be set by caller
        medicineId1: foundMedicines[0].id,
        medicineId2: foundMedicines[1].id,
        conflictType: 'interaction',
        severity: interaction.severity,
        description: interaction.description,
        suggestedResolution: 'Consult your doctor before taking these medications together',
        isResolved: false,
        createdAt: new Date()
      });
    }
  }
  
  return conflicts;
}

// Timeline generation
export function generateOptimalTimeline(
  schedules: MedicationSchedule[],
  medicines: Medicine[],
  prescriptions: Prescription[],
  statuses: MedicationStatus[],
  conflicts: MedicationConflict[],
  targetDate: Date
): TimelineDay {
  const dayStart = new Date(targetDate);
  dayStart.setHours(0, 0, 0, 0);
  
  const dayEnd = new Date(targetDate);
  dayEnd.setHours(23, 59, 59, 999);
  
  // Filter schedules for the target date
  const daySchedules = schedules.filter(schedule => {
    const scheduleDate = new Date(schedule.scheduledTime);
    return scheduleDate >= dayStart && scheduleDate <= dayEnd && schedule.isActive;
  });
  
  // Group by time slots
  const slots = new Map<string, ScheduleSlot>();
  
  for (const schedule of daySchedules) {
    const slotKey = getTimeSlotKey(schedule.scheduledTime);
    const time = new Date(schedule.scheduledTime);
    
    if (!slots.has(slotKey)) {
      slots.set(slotKey, {
        time,
        medications: [],
        conflicts: []
      });
    }
    
    const slot = slots.get(slotKey)!;
    const medicine = medicines.find(m => m.id === schedule.medicineId);
    const prescription = prescriptions.find(p => p.id === schedule.prescriptionId);
    const status = statuses.find(s => s.scheduleId === schedule.id);
    
    if (medicine && prescription) {
      slot.medications.push({
        medicine,
        prescription,
        schedule,
        status: status || {
          id: crypto.randomUUID(),
          scheduleId: schedule.id,
          medicineId: medicine.id,
          prescriptionId: prescription.id,
          userId: schedule.userId,
          scheduledTime: schedule.scheduledTime,
          status: 'upcoming',
          createdAt: new Date()
        }
      });
    }
  }
  
  // Add conflicts to slots
  for (const conflict of conflicts) {
    const relevantSlots = Array.from(slots.values()).filter(slot =>
      slot.medications.some(med => 
        med.medicine.id === conflict.medicineId1 || med.medicine.id === conflict.medicineId2
      )
    );
    
    for (const slot of relevantSlots) {
      slot.conflicts.push(conflict);
    }
  }
  
  // Convert to sorted array
  const sortedSlots = Array.from(slots.values()).sort((a, b) => 
    a.time.getTime() - b.time.getTime()
  );
  
  // Calculate statistics
  const totalMedications = daySchedules.length;
  const completedMedications = statuses.filter(s => s.status === 'taken').length;
  const missedMedications = statuses.filter(s => s.status === 'missed').length;
  
  return {
    date: targetDate,
    slots: sortedSlots,
    totalMedications,
    completedMedications,
    missedMedications
  };
}

// Utility functions
export function calculateNextDose(medicine: Medicine, lastTaken?: Date): Date | null {
  if (!lastTaken) return null;
  
  const parsed = parseFrequencyToSchedule(medicine.frequency, lastTaken);
  
  switch (parsed.pattern) {
    case 'BID':
      return new Date(lastTaken.getTime() + 12 * 60 * 60 * 1000); // 12 hours
    case 'TID':
      return new Date(lastTaken.getTime() + 8 * 60 * 60 * 1000);  // 8 hours
    case 'QID':
      return new Date(lastTaken.getTime() + 6 * 60 * 60 * 1000);  // 6 hours
    case 'QD':
      return new Date(lastTaken.getTime() + 24 * 60 * 60 * 1000); // 24 hours
    case 'interval':
      if (parsed.intervalHours) {
        return new Date(lastTaken.getTime() + parsed.intervalHours * 60 * 60 * 1000);
      }
      break;
  }
  
  return null;
}

export function formatTime(date: Date): string {
  return date.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  });
}

export function formatDate(date: Date): string {
  return date.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
}

export function getPriorityColor(priority: PriorityLevel): string {
  switch (priority) {
    case 'critical': return 'text-red-600 bg-red-50 border-red-200';
    case 'high': return 'text-orange-600 bg-orange-50 border-orange-200';
    case 'medium': return 'text-blue-600 bg-blue-50 border-blue-200';
    case 'low': return 'text-gray-600 bg-gray-50 border-gray-200';
    default: return 'text-gray-600 bg-gray-50 border-gray-200';
  }
}

export function getStatusIcon(status: MedicationStatusType): string {
  switch (status) {
    case 'taken': return '✓';
    case 'missed': return '⚠️';
    case 'skipped': return '⏭️';
    case 'upcoming': return '⏰';
    default: return '⏰';
  }
}

export function getAdministrationIcon(route: AdministrationRoute): string {
  switch (route) {
    case 'oral': return '💊';
    case 'topical': return '🧴';
    case 'injection': return '💉';
    case 'inhalation': return '🌬️';
    case 'sublingual': return '👅';
    default: return '💊';
  }
} 