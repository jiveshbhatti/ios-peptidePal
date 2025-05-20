# PeptidePal iOS App Preview

This document provides a visual preview of the iOS application screens that have been implemented.

## Home/Calendar Screen

```
┌───────────────────────────────────────┐
│              Status Bar               │
├───────────────────────────────────────┤
│          May 2025          🔄️ ⚙️       │
├───────────────────────────────────────┤
│  S   M   T   W   T   F   S            │
│                                       │
│  1   2   3   4   5   6   7            │
│  8   9  10  11 [12] 13  14            │
│ 15  16  17  18  19  20  21            │
│ 22  23  24  25  26  27  28            │
│ 29  30  31                            │
│                                       │
│          [Go to Today]                │
├───────────────────────────────────────┤
│         Today's Schedule              │
│ ┌─────────────────────────────────┐   │
│ │ 🟢 [IMG] Peptide A    AM • 250mcg│   │
│ │      5 doses left        [Log]   │   │
│ └─────────────────────────────────┘   │
│ ┌─────────────────────────────────┐   │
│ │ 🟢 [IMG] Peptide B    PM • 100mcg│   │
│ │      2 doses left        [Log]   │   │
│ └─────────────────────────────────┘   │
│                                       │
└───────────────────────────────────────┘
      HOME    INVENTORY    CALCULATOR    SUMMARY
```

### Features
- Interactive calendar with month navigation
- Today indicator and date selection
- Scheduled peptides marked on calendar
- Daily schedule display with peptide cards
- Dose logging button for each scheduled peptide
- Remaining doses indicator with color coding
- Pull-to-refresh for data updates

## Dose Logging Modal

```
┌───────────────────────────────────────┐
│         ◌                             │
│       ┌─────────────────────────────┐ │
│       │          Log Dose         X │ │
│       ├─────────────────────────────┤ │
│       │                             │ │
│       │         Peptide A           │ │
│       │       AM • May 12, 2025     │ │
│       │                             │ │
│       │       Dose Amount           │ │
│       │  [−]     250     [+]  mcg   │ │
│       │                             │ │
│       │           Time              │ │
│       │         [08:30 AM]          │ │
│       │                             │ │
│       │     Notes (optional)        │ │
│       │ [                         ] │ │
│       │ [                         ] │ │
│       │                             │ │
│       │   Active Vial: 5 doses left │ │
│       │                             │ │
│       │  [Cancel]        [Log Dose] │ │
│       └─────────────────────────────┘ │
└───────────────────────────────────────┘
```

### Features
- Bottom sheet modal with iOS design patterns
- Dose amount stepper with +/- controls 
- Time picker with AM/PM selection
- Notes field for additional information
- Vial status indicator with warnings
- Form validation for safe dose logging

## Inventory Screen

```
┌───────────────────────────────────────┐
│              Status Bar               │
├───────────────────────────────────────┤
│            Inventory                   │
├───────────────────────────────────────┤
│ 🔍 Search inventory...                 │
├───────────────────────────────────────┤
│ [Peptides] [BAC Water] [Syringes] [Other] │
├───────────────────────────────────────┤
│         Active Peptides (2)           │
│ ┌─────────────────────────────────┐   │
│ │ 🟢 [IMG] Peptide A     10 vials  │ > │
│ │      5000mcg/vial               │   │
│ │      [=========------]          │   │
│ │      Active vial in use         │   │
│ └─────────────────────────────────┘   │
│ ┌─────────────────────────────────┐   │
│ │ 🟢 [IMG] Peptide B     5 vials   │ > │
│ │      10000mcg/vial              │   │
│ │      [=====----------]          │   │
│ │      Active vial in use         │   │
│ └─────────────────────────────────┘   │
│                                       │
│         Inactive Stock (3)            │
│ ┌─────────────────────────────────┐   │
│ │ ⚪ [IMG] Peptide C     2 vials   │ > │
│ │      2500mcg/vial               │   │
│ └─────────────────────────────────┘   │
│                                       │
│                 [+]                   │
└───────────────────────────────────────┘
```

### Features
- Segmented control for inventory categories
- Search functionality with real-time filtering
- Visual indicators for active and inactive stock
- Progress bars for active vial usage
- Floating action button for adding new items
- Long press menu for peptide actions
- Pull-to-refresh for data updates

## Peptide Form Modal

```
┌───────────────────────────────────────┐
│         ◌                             │
│       ┌─────────────────────────────┐ │
│       │        Add Peptide        X │ │
│       ├─────────────────────────────┤ │
│       │ [Inventory] [Schedule]       │ │
│       │                             │ │
│       │ Peptide Name                │ │
│       │ [BPC-157                  ] │ │
│       │                             │ │
│       │ Number of Vials             │ │
│       │ [5                        ] │ │
│       │                             │ │
│       │ Concentration per Vial (mcg)│ │
│       │ [5000                     ] │ │
│       │                             │ │
│       │ Typical Dose (mcg)          │ │
│       │ [250                      ] │ │
│       │                             │ │
│       │ ...more fields...           │ │
│       │                             │ │
│       │  [Cancel]        [Save]     │ │
│       └─────────────────────────────┘ │
└───────────────────────────────────────┘
```

### Features
- Tabbed form interface (Inventory & Schedule)
- Validation for required fields
- Schedule controls (frequency, days of week, time)
- Unit type selection
- Form submission handling

2. **Calculator Screen**
   - Reconstitution calculator
   - Dose volume calculations
   - Syringe selection

3. **Summary Screen**
   - Usage statistics and visualization
   - Vial history tracking
   - Data export options