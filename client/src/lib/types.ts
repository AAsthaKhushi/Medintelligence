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
