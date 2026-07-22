export interface Baby {
  id: number;
  guidId: string;
  name: string;
  avatarColor: string;
  dateOfBirth: string;
  weightKg: number | null;
  heightCm: number | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateBabyPayload {
  name: string;
  avatarColor: string;
  dateOfBirth: string;
  weightKg?: number;
  heightCm?: number;
}

export interface UpdateBabyPayload {
  name?: string;
  avatarColor?: string;
  dateOfBirth?: string;
  weightKg?: number;
  heightCm?: number;
}
