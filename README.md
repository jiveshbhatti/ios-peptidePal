# PeptidePal iOS

React Native iOS app for PeptidePal - A comprehensive peptide regimen management application.

## Tech Stack

- React Native with Expo
- TypeScript
- Supabase (Backend)
- React Navigation
- React Native Elements (UI)

## Getting Started

### Prerequisites

- Node.js 18+
- Expo CLI
- iOS Simulator (Xcode) or physical iOS device
- Expo Go app (for testing on physical devices)

### Installation

```bash
# Install dependencies
npm install

# Start the development server
npm start

# Run on iOS simulator
npm run ios
```

## Project Structure

```
ios-peptidepal/
├── src/
│   ├── components/      # Reusable UI components
│   ├── screens/        # App screens
│   ├── services/       # API and data services
│   ├── types/          # TypeScript type definitions
│   ├── utils/          # Utility functions
│   ├── navigation/     # Navigation configuration
│   ├── hooks/          # Custom React hooks
│   ├── contexts/       # React contexts
│   └── constants/      # App constants
├── assets/             # Images and other assets
├── App.tsx            # Main app component
└── app.json           # Expo configuration
```

## Features

- Inventory-centric peptide management
- Calendar view for scheduling
- Dose logging and tracking
- Vial management
- Real-time data sync with Supabase
- Reconstitution calculator

## Building for TestFlight

```bash
# Build for iOS
eas build --platform ios

# Submit to App Store Connect
eas submit --platform ios
```

## Related Projects

- Web App: https://github.com/jiveshbhatti/studio
- iOS App: https://github.com/jiveshbhatti/ios-peptidePal

## License

Private - All rights reserved