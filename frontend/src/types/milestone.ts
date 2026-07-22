export interface Milestone {
  id: string;
  babyId: string | null;
  achievedAt: string;
  note: string;
  imageUrl: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateMilestonePayload {
  achievedAt: string;
  note: string;
  image: File;
  babyId?: string;
}

export interface UpdateMilestonePayload {
  achievedAt?: string;
  note?: string;
  image?: File;
  babyId?: string;
}
