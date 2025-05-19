# Dose Logging Modal Mockup

## Modal Presentation

### Overlay
- Background: Black with 0.3 opacity
- Blur effect on content behind
- Tap to dismiss (outside modal)

### Modal Container
- Background: #FFFFFF
- Border radius: 16px top corners
- Slides up from bottom
- Height: ~60% of screen
- Safe area padding at bottom

## Layout Structure

### Header
- Height: 56px
- Title: "Log Dose" (center, SF Pro Display Semibold 17pt)
- Close button: X icon (right, 24x24px, #6B7280)
- Bottom border: 1px solid #F3F4F6

### Peptide Info Section
- Padding: 16px
- Layout: Centered
- Components:
  - Image: 64x64px circular
  - Name: SF Pro Display Semibold 20pt
  - Schedule: SF Pro Display Regular 15pt, #6B7280
  - Next dose: SF Pro Display Regular 13pt, #9CA3AF

### Form Fields

#### Dose Amount
```
Dose Amount
┌─────────────────────────────┐
│  250                   mcg ▼│
└─────────────────────────────┘
[−]  Stepper Controls  [+]
```

- Label: SF Pro Display Regular 15pt, #6B7280
- Input: Large, centered
- Stepper: ± buttons for quick adjustment
- Unit dropdown on right

#### Time Selection
```
Time
┌──────────────┬──────────────┐
│    8:30      │      AM      │
└──────────────┴──────────────┘
```

- Two-part selector
- Time picker: Scrollable
- AM/PM: Segmented control

#### Date Selection (if not today)
```
Date
┌─────────────────────────────┐
│  May 20, 2025              ▼│
└─────────────────────────────┘
```

- Shows full date
- Tap to open date picker

#### Notes Field
```
Notes (optional)
┌─────────────────────────────┐
│                             │
│                             │
│                             │
└─────────────────────────────┘
```

- Multiline text input
- 3 lines visible
- Placeholder: "Add notes..."

### Vial Status Display
- Small info card
- Shows: "Active Vial: 15 doses remaining"
- Warning if low: Yellow background
- Error if empty: Red background

### Action Buttons
- Sticky footer with safe area padding
- Two buttons side by side:

#### Cancel Button
- Width: 48%
- Height: 48px
- Background: #F3F4F6
- Text: "Cancel" (#6B7280)
- Border radius: 8px

#### Log Dose Button
- Width: 48%
- Height: 48px
- Background: #008080
- Text: "Log Dose" (white)
- Border radius: 8px
- Disabled state if invalid

## Interactive Behavior

### Form Validation
- Real-time validation
- Required fields: Amount, Time
- Dose amount: Must be positive
- Time: Cannot be future

### Keyboard Handling
- Number pad for dose amount
- Dismiss on tap outside
- Next button navigation

### Success State
- Brief success animation
- Checkmark overlay
- Auto-dismiss after 1s

### Error Handling
- Shake animation on error
- Red highlight on invalid fields
- Error message display

## Animations

### Modal Appearance
- Slide up with spring physics
- Background fade in
- Duration: 0.3s

### Dismissal
- Slide down
- Background fade out
- Duration: 0.25s

### Success Feedback
- Checkmark scales in
- Haptic feedback (success)
- Green flash overlay

## Edge Cases

### Low Vial Warning
```
⚠️ Low Stock Alert
Only 3 doses remaining in active vial
[Continue] [View Inventory]
```

### Empty Vial Error
```
❌ Active Vial Empty
Please activate a new vial from inventory
[Go to Inventory]
```

### Expired Vial Warning
```
⚠️ Vial Expired
This vial expired on May 15, 2025
[Continue Anyway] [Cancel]
```