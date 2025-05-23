# PeptidePal iOS

A comprehensive iOS application for managing peptide regimens with inventory tracking, dose logging, and analytics.

## Features

### ✅ Implemented
- **Inventory Management**: Define peptide types with concentrations, typical doses, and schedules
- **Vial Lifecycle**: Track vial activation, usage, and expiration
- **Dose Logging**: Swipe-to-log doses with haptic feedback
- **Volume Display**: Shows "Draw X units" for easy dosing reference
- **Peptide Details**: Comprehensive view with overview, history, and statistics
- **Real-time Sync**: Firebase integration for instant updates across devices
- **Calculated Tracking**: Dose counts calculated from logs (no sync issues)
- **Haptic Feedback**: Native iOS haptics for user interactions

### 🚧 In Progress
- Summary dashboard with statistics
- Calculator improvements
- Data export/import functionality

### 📋 Planned
- Push notifications for dose reminders
- Dark mode support
- iOS widgets
- Apple Watch companion app

## Tech Stack

- **Framework**: React Native with Expo SDK 51
- **Navigation**: React Navigation (Stack + Bottom Tabs)
- **Backend**: Firebase Firestore
- **State Management**: React Hooks with Firebase listeners
- **UI**: Custom StyleSheet with iOS design patterns
- **Language**: TypeScript/JavaScript

## Getting Started

### Prerequisites
- Node.js 18+
- iOS Simulator (Xcode) or physical iOS device
- Expo CLI (`npm install -g expo-cli`)

### Installation

1. Clone the repository
```bash
git clone https://github.com/jiveshbhatti/studio
cd ios-peptidepal
```

2. Install dependencies
```bash
npm install
```

3. Start the development server
```bash
npm run dev
```

4. Run on iOS Simulator
```bash
# Press 'i' in the terminal after starting the dev server
# Or run directly:
npm run ios
```

## Development

### File Structure
```
src/
├── components/       # Reusable UI components
├── screens/         # Main app screens
├── services/        # Firebase and data services
├── navigation/      # Navigation configuration
├── utils/           # Helper functions
├── types/           # TypeScript type definitions
└── constants/       # Theme and app constants
```

### Key Commands
```bash
npm run dev          # Start development server
npm run ios          # Run on iOS simulator
npm run lint         # Run ESLint
npm run typecheck    # TypeScript type checking
```

### Firebase Configuration
The app uses Firebase Firestore for data persistence. Configuration is in:
- `src/firebase-config.js` - Firebase initialization
- `src/services/firebase-clean.js` - Core service functions

## Usage

### Adding a Peptide
1. Go to the Inventory tab
2. Tap the + button
3. Fill in peptide details (name, concentration, typical dose)
4. Set the default schedule (AM/PM/Both)
5. Save to create the peptide type

### Activating a Vial
1. In Inventory, tap on a peptide
2. Select "Activate Vial"
3. Enter BAC water amount for reconstitution
4. The peptide will appear on your schedule

### Logging Doses
1. On the Home screen, find the peptide
2. Swipe right to log a dose
3. The card shows "Draw X units" for reference
4. Swipe left on a logged dose to undo

### Viewing Details
1. Tap any peptide card to see details
2. View tabs: Overview, History, Stats
3. Manage vials and see usage trends

## Architecture

### Data Model
- **Peptides**: Core peptide data with schedules
- **Vials**: Individual vial tracking with activation dates
- **Dose Logs**: Historical record of all doses
- **Inventory**: Stock levels and peptide definitions

### Key Design Decisions
1. **No Authentication**: Single-user app design
2. **Calculated Values**: Dose counts derived from logs
3. **Real-time Sync**: Firebase listeners for instant updates
4. **Inventory-First**: All peptides defined in inventory before use

## Deployment

### Building for TestFlight
1. Install EAS CLI
```bash
npm install -g eas-cli
```

2. Configure EAS
```bash
eas build:configure
```

3. Build for iOS
```bash
eas build --platform ios
```

4. Submit to App Store
```bash
eas submit --platform ios
```

## Related Projects

- Web App: https://github.com/jiveshbhatti/studio
- iOS App Repository: https://github.com/jiveshbhatti/ios-peptidePal

## Contributing

1. Create a feature branch
2. Make your changes
3. Test on iOS simulator
4. Submit a pull request

## License

Private - All rights reserved

## Support

For issues or questions, please open an issue on GitHub.