export interface SleepLog {
  id: number;
  guidId: string;
  sleepStart: string;
  sleepEnd: string;
  durationMinutes: number;
  isNap: boolean;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateSleepLogPayload {
  sleepStart: string;
  sleepEnd: string;
  isNap?: boolean;
  notes?: string;
}

export interface UpdateSleepLogPayload {
  sleepStart?: string;
  sleepEnd?: string;
  isNap?: boolean;
  notes?: string;
}
