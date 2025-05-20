# PeptidePal iOS Development Progress

## Project Setup ✅
- [x] Initialize React Native Expo project with TypeScript
- [x] Configure git repository and push to GitHub
- [x] Install core dependencies (Supabase, Navigation, UI libraries)
- [x] Configure app.json for iOS development
- [x] Set up EAS configuration for TestFlight deployment
- [x] Copy type definitions from web app
- [x] Set up Supabase client with same credentials as web app
- [x] Create folder structure for organized development

## Features from Web App to Implement

### Core Features
- [ ] Inventory-centric peptide management
  - [ ] Create inventory screens
  - [ ] Add/Edit/Delete peptide inventory
  - [ ] Vial activation system
  - [ ] Centralized peptide definition with schedule
  - [ ] Stock tracking (num_vials, concentration, typical dose)
  - [x] Active vial lifecycle management
  - [ ] Single source of truth for peptide properties
- [x] Calendar view for scheduling
  - [ ] Weekly view
  - [x] Monthly view
  - [x] Day selection and navigation
- [x] Daily schedule display
  - [x] Show peptides for selected day
  - [x] Quick dose logging actions
- [x] Dose logging
  - [x] Log dose dialog
  - [x] Verify vial status
  - [x] Update remaining amounts
- [ ] Peptide information page
  - [ ] Display peptide details
  - [ ] Show vial information
  - [ ] Dosage charts (line/bar)
- [ ] Usage summary page
  - [ ] Consolidated overview
  - [ ] Vial status tracking
- [ ] Reconstitution calculator
  - [ ] Standalone tool
  - [ ] Calculate concentrations
- [ ] Data management
  - [ ] Real-time Supabase sync
  - [ ] Export data as JSON
  - [ ] Import data from JSON

### Navigation Structure
- [x] Bottom tab navigation
  - [x] Schedule (Calendar)
  - [x] Inventory
  - [x] Calculator
  - [x] Summary
- [ ] Stack navigation for detail screens

### UI Components to Create
- [x] Common UI components
  - [x] Custom buttons with iOS native feel
  - [x] Input fields with proper keyboard handling
  - [ ] Date/time pickers (iOS native style)
  - [x] Modal dialogs (bottom sheets for iOS)
  - [x] Segmented controls for options
  - [ ] Progress bars with animations
  - [x] Pull-to-refresh indicators
- [x] Peptide-specific components
  - [x] Peptide list item with image, name, schedule badges
  - [x] Vial status indicator with colors (green/yellow/red)
  - [ ] Dose log item with deletion capability
  - [x] Schedule badge (AM/PM indicators)
  - [ ] Inventory card with progress bar for active vials
  - [x] Quick dose steppers with +/- controls
  - [ ] Sparkline charts for mini visualizations

### Services to Implement
- [x] Peptide service (CRUD operations)
- [x] Inventory service
- [x] Dose logging service
- [ ] Calculator utilities
- [x] Date/time utilities

### Real-time Features
- [ ] Supabase subscriptions (replaced with polling)
- [x] Live data updates
- [x] Sync across devices

### iOS-Specific Features
- [x] Native iOS styling
  - [ ] SF Pro Display font usage
  - [x] iOS standard spacing (16px margins)
  - [x] Native component heights (44px, 48px)
  - [x] Bottom safe area handling
- [ ] Haptic feedback
  - [ ] Success feedback on dose logging
  - [ ] Selection feedback on taps
- [x] Bottom sheet modals for iOS pattern
- [ ] Swipe actions on list items
  - [ ] Swipe to edit/delete
  - [ ] Swipe to log dose
- [x] Floating action buttons with spring animations
- [ ] Smooth transitions between screens
- [ ] Push notifications (future)
- [ ] Calendar integration
- [ ] Health app integration (future)

## Current Status
- Project initialized with React Native Expo
- Basic folder structure created
- Dependencies installed
- Git repository configured
- Type definitions copied from web app
- Navigation structure implemented with bottom tabs
- Home screen with calendar and schedule implemented
- Basic data sync from Supabase with polling
- UI components created with iOS-native styling
- Date utilities implemented without external dependencies
- Peptide card styling with visual differentiation for logged doses
- Fixed scheduling logic to respect vial status

## Key Web App Features to Replicate (Recently Implemented)

### Inventory-Centric Architecture
- Inventory is the single source of truth for peptide definitions
- Peptide types and schedules are defined when creating inventory items
- Activating vials from inventory makes peptides available on schedule
- ID consistency between inventory_peptides and peptides tables
- Centralized editing through inventory forms

### Enhanced Peptide Management
- Vial lifecycle tracking (initialAmountUnits, remainingAmountUnits)
- Multiple vials per peptide with active vial selection
- Automatic dose count calculation based on concentration and typical dose
- Vial expiration tracking with visual indicators
- Low stock warnings and notifications

### Visual Design & UX Updates
- Modern card-based layouts with subtle shadows
- Teal primary color (#008080) for consistency
- Progress bars for vial usage visualization
- Status indicators (active/expired/empty badges)
- Empty states with helpful illustrations
- Loading states with skeleton screens
- Success/error feedback with toasts

### Data Persistence & Sync
- Real-time Supabase synchronization
- Import/Export functionality as JSON
- Export with timestamp naming
- Import with merge/replace strategies
- Migration handling for data structure changes

### Recently Added Improvements
- Dedicated vial history on peptide info pages
- Better error handling for edge cases
- Improved form validation with Zod schemas
- Enhanced chart visualizations (line/bar options)
- Quick dose calculators within forms
- Batch/lot number tracking
- Storage location management

## Mobile Design Specifications from Mockups

### Screen Layouts
1. **Home/Calendar**:
   - Monthly calendar view with dot indicators
   - Selected date highlighting
   - Today's schedule with peptide cards
   - Quick log buttons on each card

2. **Inventory**:
   - Search functionality
   - Active/Inactive peptide sections
   - Visual vial status with progress bars
   - Floating add button
   - Swipe actions for edit/delete

3. **Calculator**:
   - Clean input form layout
   - Unit selection dropdowns
   - Real-time calculation updates
   - Visual syringe indicators
   - Results displayed in cards

4. **Dose Logging**:
   - Bottom sheet modal pattern
   - Large dose input with steppers
   - Time picker with AM/PM toggle
   - Vial status warnings inline
   - Success animations

5. **Summary Dashboard**:
   - Time period segmented control
   - Horizontal scrolling metric cards
   - Peptide summary list with sparklines
   - Expandable vial overview section
   - Interactive charts with tooltips

## Next Steps
1. ✅ Create basic navigation structure
   - ✅ Bottom tab navigation with icons
   - [ ] Stack navigation for detail screens
   - ✅ Proper safe area handling
2. ✅ Skip authentication (following web app pattern)
3. Create main screens with iOS patterns:
   - ✅ Calendar with native date components
   - [ ] Inventory with search and sections
   - [ ] Calculator with real-time updates
   - [ ] Summary with export options
4. Port UI components with iOS adaptations:
   - ✅ Bottom sheets instead of dialogs
   - ✅ Native segmented controls
   - ✅ iOS-style form inputs
5. Implement data services:
   - ✅ Direct Supabase integration (no auth)
   - [ ] Real-time subscriptions
   - [ ] Offline data caching
6. Add iOS-specific polish:
   - [ ] Haptic feedback
   - [ ] Swipe gestures
   - ✅ Spring animations
   - ✅ Pull-to-refresh
7. [ ] Test on iOS simulator and devices
8. [ ] Build for TestFlight

## Architecture Decisions to Maintain
- Inventory-first data model
- No authentication required
- Direct Supabase connections
- Real-time sync for all data
- Client-side data validation
- TypeScript for type safety

## Notes
- Using same Supabase instance as web app for data consistency
- Maintaining feature parity with web application
- Focus on iOS-native user experience
- TypeScript for type safety