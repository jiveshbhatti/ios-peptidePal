# Home/Calendar Screen Mockup

## Layout Structure

### Status Bar
- Time on left
- Battery, wifi, cellular on right
- Light content (white text)

### Navigation Header
- Height: 44px
- Background: #008080 (primary teal)
- Title: "May 2025" (centered, white, SF Pro Display Bold 17pt)
- Left: Previous month arrow
- Right: Settings gear icon

### Calendar Section
- Background: #FFFFFF
- Corner radius: 12px top corners only
- Padding: 16px
- Sunday-Saturday headers (SF Pro Display Medium 13pt, #6B7280)
- Date grid:
  - Each cell: 44x44px
  - Today: Teal circle background
  - Selected: Teal border
  - Has events: Small teal dot below number
  - Past dates: #9CA3AF (light gray)
  - Future dates: #1A1A1A

### Today's Schedule Section
- Background: #FAFAFA
- Padding: 16px
- Title: "Today's Schedule" (SF Pro Display Semibold 20pt)
- Peptide cards:
  - Background: #FFFFFF
  - Border radius: 12px
  - Shadow: 0 2px 8px rgba(0,0,0,0.08)
  - Height: 88px
  - Layout: Horizontal with image, info, and action

### Peptide Card Details
```
[Image] [Info Section] [Action Button]
  48x48   Flexible      44x44

Image: Circular, 48x48px
Info:
  - Name (SF Pro Display Semibold 17pt)
  - Schedule (SF Pro Display Regular 15pt, #6B7280)
  - Dose (SF Pro Display Regular 15pt, #6B7280)
Action: "Log" button or checkmark if completed
```

### Bottom Tab Bar
- Height: 83px (49px bar + 34px safe area)
- Background: #FFFFFF with blur
- Border top: 1px solid #F3F4F6
- Icons: 24x24px, centered
- Labels: SF Pro Display Regular 10pt
- Active color: #008080
- Inactive color: #9CA3AF

## Interactive Elements

### Month Navigation
- Tap arrows to navigate months
- Swipe horizontally for month change
- Smooth slide animation

### Date Selection
- Tap to select date
- Selected state: Teal border
- Updates schedule below

### Peptide Actions
- "Log" button: Teal background, white text
- Completed: Green checkmark
- Tap card for peptide details

## Responsive Behavior
- Calendar adjusts cell size for screen width
- Schedule cards stack vertically
- Maintains 16px margins