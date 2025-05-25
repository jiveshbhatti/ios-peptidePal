export type TimeOfDay = "AM" | "PM";
export type DayOfWeekIndex = 0 | 1 | 2 | 3 | 4 | 5 | 6; // Sunday (0) to Saturday (6)

export const DAYS_OF_WEEK: { index: DayOfWeekIndex; name: string; shortName: string }[] = [
  { index: 0, name: "Sunday", shortName: "Sun" },
  { index: 1, name: "Monday", shortName: "Mon" },
  { index: 2, name: "Tuesday", shortName: "Tue" },
  { index: 3, name: "Wednesday", shortName: "Wed" },
  { index: 4, name: "Thursday", shortName: "Thu" },
  { index: 5, name: "Friday", shortName: "Fri" },
  { index: 6, name: "Saturday", shortName: "Sat" },
];

export interface PeptideSchedule {
  frequency: "daily" | "specific_days";
  daysOfWeek?: DayOfWeekIndex[]; // Relevant if frequency is 'specific_days'
  times: TimeOfDay[]; // Times to take the peptide, e.g., ["AM"], ["PM"]
}

export interface Vial {
  id: string; // Unique ID for the vial
  name?: string; // Optional user-defined name like "Batch A", "Primary Vial"
  initialAmountUnits: number; // Original total number of doses this vial was expected to yield (immutable after activation)
  remainingAmountUnits: number; // Current number of doses left in this vial (decrements with use)
  reconstitutionBacWaterMl?: number;
  
  // --- NEW Fields for Reconstitution History ---
  totalPeptideInVialMcg?: number;   // e.g., 5000 (for a 5mg vial) - The total amount of peptide powder in THIS vial
  typicalDoseMcgForCalc?: number; // The typical dose in mcg that was used for calculations for THIS specific vial's reconstitution
  // --- End NEW Fields ---

  expirationDate?: string; // ISO date string
  dateAdded: string; // ISO date string, when this vial was added/started
  isActive: boolean; // DEPRECATED - Use isCurrent instead
  isCurrent?: boolean; // True if this is the current vial being used for new dose logs
  isReconstituted?: boolean; // True if this vial has been reconstituted and is ready to use
  reconstitutionDate?: string; // ISO date string when vial was reconstituted
  notes?: string;
  
  // Discard tracking
  discardedAt?: string; // ISO date string when vial was discarded
  discardReason?: string; // Reason for discarding (e.g., "Expired", "Contaminated", etc.)
}

export interface DoseLog {
  id: string;
  date: string; // ISO date string for the day
  timeOfDay?: TimeOfDay; // AM or PM, to distinguish doses on the same day
  dosage: number; // The actual amount/units administered for this specific log (based on peptide's typicalDosageUnits or overridden)
  unit?: string; // e.g., mg, mcg, IU. If not provided, assumes peptide.dosageUnit
  volumeDrawnMl?: number; // Actual volume drawn in milliliters
  vialId: string; // ID of the vial from which this dose was taken
}

export interface Peptide {
  id: string;
  name: string;
  imageUrl?: string;
  dataAiHint?: string; // For generating relevant placeholder images
  strength: string; // e.g., "10mg total", "5mg/ml reconstituted" - general strength descriptor
  schedule: PeptideSchedule;
  notes?: string;
  startDate?: string; // ISO date string, e.g., "2023-10-26T00:00:00.000Z" - when regimen for this peptide starts
  dosageUnit?: string; // Default unit for typical dosage and logging, e.g., "IU", "mcg", "syringe units"
  typicalDosageUnits?: number; // Typical amount per dose, in 'dosageUnit', e.g., 10 (units), 0.5 (mg)
  
  vials: Vial[]; // Array to store multiple vials
  doseLogs?: DoseLog[];
}

export interface ScheduledPeptideItem extends Peptide {
  time: TimeOfDay; // The specific time this instance is scheduled for
}
