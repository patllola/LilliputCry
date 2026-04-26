export interface FeedingLog {
  id: number;
  guidId: string;
  fedAt: string;
  milkPrepared: number;
  milkFed: number;
  wasteAmount: number;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateFeedingLogPayload {
  fedAt: string;
  milkPrepared: number;
  milkFed: number;
  notes?: string;
}

export interface UpdateFeedingLogPayload {
  fedAt?: string;
  milkPrepared?: number;
  milkFed?: number;
  notes?: string;
}
