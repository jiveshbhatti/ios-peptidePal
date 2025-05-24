export interface WeightEntry {
  id: string;
  date: string;
  weight: number;
  unit: 'kg' | 'lbs';
  notes?: string;
  createdAt: string;
}

export interface BodyMeasurement {
  id: string;
  date: string;
  measurements: {
    chest?: number;
    waist?: number;
    hips?: number;
    leftArm?: number;
    rightArm?: number;
    leftThigh?: number;
    rightThigh?: number;
    neck?: number;
  };
  unit: 'cm' | 'inches';
  notes?: string;
  createdAt: string;
}

export interface ProgressPhoto {
  id: string;
  date: string;
  photoUri: string;
  type: 'front' | 'side' | 'back';
  weight?: number;
  notes?: string;
  createdAt: string;
}

export interface UserProfile {
  id: string;
  name?: string;
  email?: string;
  dateOfBirth?: string;
  height?: number;
  heightUnit: 'cm' | 'ft';
  gender?: 'male' | 'female' | 'other';
  activityLevel?: 'sedentary' | 'light' | 'moderate' | 'active' | 'very_active';
  goals?: string[];
  createdAt: string;
  updatedAt: string;
}

export interface MetricsStats {
  startingWeight?: number;
  currentWeight?: number;
  goalWeight?: number;
  totalWeightChange?: number;
  weeklyAverage?: number;
  monthlyAverage?: number;
}