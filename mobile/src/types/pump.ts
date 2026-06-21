export interface PumpSession {
  id: number;
  guidId: string;
  pumpedAt: string;
  leftAmount: number;
  rightAmount: number;
  totalAmount: number;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreatePumpSessionPayload {
  pumpedAt: string;
  leftAmount: number;
  rightAmount: number;
  notes?: string;
}

export interface UpdatePumpSessionPayload {
  pumpedAt?: string;
  leftAmount?: number;
  rightAmount?: number;
  notes?: string;
}
