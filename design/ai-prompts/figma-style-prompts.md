# AI Design Generation Prompts - Figma Style

## General Style Guide Prompt
```
Create a modern iOS app design system for a medical tracking app. Use these specifications:
- Primary color: Teal (#008080)
- Clean, minimal aesthetic similar to Airbnb and Notion
- White background (#FAFAFA) with white cards (#FFFFFF)
- SF Pro Display font
- Subtle shadows and rounded corners (12px)
- Native iOS components
- Safe area considerations for iPhone
```

## Screen-Specific Prompts

### 1. Calendar/Home Screen
```
Design an iOS app home screen with:
- Monthly calendar view at top with teal accent color
- Calendar grid showing dots on scheduled days
- Today highlighted with teal circle
- Below calendar: "Today's Schedule" section with peptide cards
- Each card shows: circular image, peptide name, time (AM/PM), and "Log" button
- Bottom tab bar with 4 icons
- Modern, clean design like Airbnb
- White cards on light gray background
```

### 2. Inventory Screen
```
Create an iOS inventory management screen:
- Search bar at top
- Two sections: "Active Peptides" and "Inactive Stock"
- Cards for each item showing:
  - Status indicator (green/yellow/gray circle)
  - Circular peptide image
  - Name and stock count
  - Progress bar for active vials
- Floating add button (teal) in bottom right
- Clean card-based layout
- Subtle shadows and modern typography
```

### 3. Calculator Screen
```
Design a calculator screen for iOS app:
- "Reconstitution Calculator" title
- Input fields in white cards:
  - Peptide amount (with mg/mcg dropdown)
  - BAC water volume (ml)
  - Desired dose (with unit selector)
- Results section with light teal background
- Shows: concentration, volume to draw, total doses
- Use icons for each result
- Number pad friendly input fields
- Modern, scientific calculator aesthetic
```

### 4. Dose Logging Modal
```
Create an iOS modal/bottom sheet design:
- Slides up from bottom
- "Log Dose" header with X close button
- Peptide image and name centered
- Form fields:
  - Dose amount with stepper controls
  - Time picker (scrollable)
  - Optional notes field
- Shows vial status warning if low
- Two buttons: Cancel (gray) and Log Dose (teal)
- Blurred background overlay
- Rounded top corners
```

### 5. Summary Dashboard
```
Design an analytics dashboard for iOS:
- Time period selector (Week/Month/Quarter/All)
- Horizontal scrolling overview cards:
  - Total doses
  - Active peptides
  - Adherence rate
  - Days tracked
- Peptide list with mini sparkline charts
- Export button in top right
- Clean data visualization
- Mix of cards and charts
- Professional medical app aesthetic
```

## Component-Specific Prompts

### Navigation Bar
```
iOS navigation bar with:
- White background
- Centered title in bold
- Teal accent for buttons
- 44px height
- Subtle bottom border
```

### Tab Bar
```
iOS tab bar design:
- 4 icons: Calendar, Pill, Calculator, Chart
- Teal for active state
- Gray for inactive
- Labels below icons
- White background with top border
```

### Cards
```
Modern card component:
- White background
- 12px rounded corners
- 16px padding
- Subtle shadow: 0 2px 8px rgba(0,0,0,0.08)
- Thin gray border
```

### Buttons
```
Button designs:
- Primary: Teal background, white text
- Secondary: Light gray background, dark text
- 48px height, 12px rounded corners
- 17pt semibold text
```

## Color Palette Export
```
Create a color palette card showing:
- Primary Teal: #008080
- Accent Coral: #FF6B6B
- Success Green: #10B981
- Warning Orange: #F59E0B
- Error Red: #EF4444
- Grays: #1A1A1A, #6B7280, #9CA3AF, #F3F4F6
- Background: #FAFAFA
- Surface: #FFFFFF
```

## Full App Mockup
```
Create a complete iOS app mockup showcase:
- iPhone 14 Pro frame
- Show 5 screens in a grid layout
- Include app icon (teal with white pill symbol)
- Modern presentation style
- Clean background
- Professional medical app branding
- "PeptidePal" app name
```