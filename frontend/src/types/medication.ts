export interface Medication {
  id: string;
  babyId: string | null;
  name: string;
  dose: string | null;
  timeOfDay: string;
  repeatDaily: boolean;
  reminderEnabled: boolean;
  isDoneToday: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateMedicationPayload {
  name: string;
  dose?: string;
  timeOfDay: string;
  repeatDaily: boolean;
  reminderEnabled: boolean;
  babyId?: string;
}

export interface UpdateMedicationPayload {
  name?: string;
  dose?: string;
  timeOfDay?: string;
  repeatDaily?: boolean;
  reminderEnabled?: boolean;
  babyId?: string;
}
