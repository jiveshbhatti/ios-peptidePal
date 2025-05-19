# Web App Features Reference

This document serves as a reference for all features implemented in the web app that need to be replicated in the iOS app.

## Core Architecture
- **Inventory-Centric Design**: Peptides are first defined in inventory, then activated for scheduling
- **Shared ID System**: Inventory items and schedule items share the same ID
- **Real-time Sync**: All data changes sync across devices via Supabase

## User Workflows

### 1. Adding a New Peptide
1. Navigate to Inventory page
2. Click "Add Peptide" button
3. Fill form with:
   - Inventory details (name, vials, concentration, typical dose, storage)
   - Schedule details (frequency, days, times)
   - Regimen details (start date, notes)
4. System creates entries in both inventory and scheduling tables

### 2. Activating a Vial
1. From inventory, select a peptide with available stock
2. Click "Activate Vial"
3. System:
   - Decrements inventory count
   - Creates vial record with calculated doses
   - Makes peptide available on schedule

### 3. Logging Doses
1. Select day on calendar
2. View scheduled peptides
3. Click "Log Dose" on peptide
4. Confirm or adjust dose amount
5. System updates remaining vial amounts

## Key Features

### Calendar View
- Weekly and monthly views
- Visual indicators for scheduled peptides
- Quick navigation to today
- Day selection shows detailed schedule

### Daily Schedule
- List of peptides for selected day
- Shows:
  - Peptide image
  - Name and strength
  - Time (AM/PM)
  - Dosage
  - Log/unlog buttons

### Inventory Management
- Stock tracking
- Vial activation
- Low stock warnings
- Batch/lot tracking
- Expiration dates

### Peptide Info Page
- Detailed peptide information
- Active vial status
- Dosage trend charts
- Vial history
- Edit capabilities

### Reconstitution Calculator
- Input: peptide amount, BAC water, desired dose
- Output: concentration, volume to draw, doses per vial
- Syringe type selection

### Summary Page
- Overview of all peptides
- Usage statistics
- Vial status tracking
- Export/import data

## Data Model

### InventoryPeptide
- Stock management
- Physical vial tracking
- Storage information
- Batch tracking

### Peptide (Schedule)
- Scheduling information
- Active regimen details
- Vial history
- Dose logs

### Vial
- Individual vial tracking
- Reconstitution details
- Remaining doses
- Expiration tracking

### DoseLog
- Date/time of dose
- Amount taken
- Associated vial
- User notes

## UI/UX Patterns
- Clean, white/light gray background
- Teal accent color (#008080)
- Sans-serif typography
- Card-based layouts
- Modal dialogs for forms
- Toast notifications for feedback
- Subtle animations

## Error Handling
- Vial status validation
- Expired vial warnings
- Empty vial prevention
- Form validation
- Network error handling

## Future Considerations
- AI image generation (currently deferred)
- Community features
- Advanced analytics
- Health app integration
- Push notifications