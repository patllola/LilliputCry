export type Baby = {
  id: string;
  name: string;
  color: string;
  /** Display string, e.g. "Apr 21, 2025" */
  born: string;
  /** Day-of-month the baby was born — drives the monthly celebration. */
  bornDay: number;
  age: string;
  weight: string;
  height: string;
  milestoneLabel: string;
};

export type Medication = {
  id: string;
  babyId: string;
  name: string;
  dose: string;
  time: string;
  reminder: boolean;
  done: boolean;
};
