// Vial completion types and interfaces

export enum VialCompletionType {
  FULLY_USED = 'fully_used',        // All doses consumed normally
  PARTIAL_WASTE = 'partial_waste',  // Some doses wasted/unused
  EXPIRED = 'expired',              // Expired with doses remaining
  TRANSFERRED = 'transferred',      // Remaining doses moved to new vial
  CONTAMINATED = 'contaminated',    // Safety/contamination disposal
  LOST = 'lost',                    // Vial lost or misplaced
  DAMAGED = 'damaged',              // Physical damage to vial
  OTHER = 'other'                   // Custom reason provided
}

export interface VialCompletion {
  type: VialCompletionType;
  remainingDoses: number;           // Doses left when completed
  wastedDoses: number;              // Doses wasted (same as remaining for most cases)
  reason?: string;                  // Additional details/custom reason
  completedAt: string;              // ISO timestamp
  completedBy?: string;             // User ID if we add auth later
  transferredToVialId?: string;     // For TRANSFERRED type
  costWasted?: number;              // Calculated cost of wasted doses
}

export interface VialWastageStats {
  totalVials: number;
  totalDosesUsed: number;
  totalDosesWasted: number;
  totalCostWasted: number;
  wastagePercentage: number;
  averageVialUtilization: number;   // % of doses used per vial on average
  wasteByReason: {
    [key in VialCompletionType]?: {
      count: number;
      dosesWasted: number;
      costWasted: number;
    };
  };
}

// Helper to get display text for completion types
export const getCompletionTypeDisplay = (type: VialCompletionType): string => {
  switch (type) {
    case VialCompletionType.FULLY_USED:
      return 'Fully Used';
    case VialCompletionType.PARTIAL_WASTE:
      return 'Partially Used';
    case VialCompletionType.EXPIRED:
      return 'Expired';
    case VialCompletionType.TRANSFERRED:
      return 'Transferred';
    case VialCompletionType.CONTAMINATED:
      return 'Contaminated';
    case VialCompletionType.LOST:
      return 'Lost';
    case VialCompletionType.DAMAGED:
      return 'Damaged';
    case VialCompletionType.OTHER:
      return 'Other';
    default:
      return 'Unknown';
  }
};

// Helper to determine if wastage occurred
export const hasWastage = (type: VialCompletionType): boolean => {
  return type !== VialCompletionType.FULLY_USED && type !== VialCompletionType.TRANSFERRED;
};