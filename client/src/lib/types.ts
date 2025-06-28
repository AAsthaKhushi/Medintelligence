export type ProcessingStatus = 'pending' | 'processing' | 'completed' | 'failed';

export interface ChatMessage {
  id: string;
  message: string;
  isUserMessage: boolean;
  createdAt: string;
  context?: any;
}

export interface UploadResponse {
  id: string;
  status: ProcessingStatus;
  message: string;
}

export interface ChatResponse {
  response: string;
}

export interface Medicine {
  id?: string;
  name: string;
  genericName?: string;
  dosage: string;
  frequency: string;
  duration: string;
  instructions?: string;
  quantity?: string;
  timingInstructions?: string;
  priorityLevel?: string;
  administrationRoute?: string;
  createdAt?: string;
}

export interface Prescription {
  id: string;
  userId?: string;
  fileName?: string;
  fileUrl?: string;
  doctorName?: string;
  hospitalClinic?: string;
  consultationDate?: string;
  patientName?: string;
  diagnosis?: string;
  vitalSigns?: Record<string, string>;
  followUpDate?: string;
  specialInstructions?: string;
  prescriptionNumber?: string;
  extractedText?: string;
  processingStatus?: ProcessingStatus;
  extractionConfidence?: number;
  scheduleData?: any;
  priorityLevel?: string;
  startDate?: string;
  endDate?: string;
  createdAt?: string;
  updatedAt?: string;
  medicines: Medicine[];
  originalDocument?: {
    filename: string;
    type: 'pdf' | 'image' | 'docx';
    url?: string;
    previewUrl?: string;
  };
}
