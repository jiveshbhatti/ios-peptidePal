# Summary Dashboard Screen Mockup

## Layout Structure

### Navigation Header
- Height: 44px
- Background: #FFFFFF
- Title: "Summary" (centered, SF Pro Display Bold 17pt)
- Right: Export icon (24x24px, #008080)
- Bottom border: 1px solid #F3F4F6

### Time Period Selector
- Height: 44px
- Margin: 16px horizontal, 8px vertical
- Segmented control:
  - Week
  - Month
  - Quarter
  - All Time
- Active segment: #008080 background, white text
- Inactive: #F3F4F6 background, #6B7280 text

### Overview Cards Section
- Horizontal scroll view
- Height: 120px
- Padding: 16px left
- Card size: 140px wide

#### Overview Card Structure
```
┌─────────────────┐
│      Icon       │
│      Value      │
│      Label      │
└─────────────────┘
```

- Background: #FFFFFF
- Border radius: 12px
- Padding: 16px
- Shadow: 0 2px 8px rgba(0,0,0,0.08)
- Icon: 32x32px, teal tint
- Value: SF Pro Display Bold 24pt
- Label: SF Pro Display Regular 13pt, #6B7280

#### Card Types:
1. Total Doses (💉 icon)
2. Active Peptides (💊 icon)
3. Adherence Rate (✓ icon)
4. Days Tracked (📅 icon)

### Peptide Summary List

#### Section Header
- "Peptide Details" (SF Pro Display Semibold 17pt)
- Right: "View All" link (#008080)

#### Peptide Summary Card
```
┌────────────────────────────────────┐
│ [Image] [Name & Info]    [Chart]   │
│  48x48                    80x48    │
└────────────────────────────────────┘
```

- Background: #FFFFFF
- Border radius: 12px
- Margin: 16px horizontal, 8px vertical
- Padding: 16px
- Shadow: 0 2px 8px rgba(0,0,0,0.08)

#### Card Content:
- Image: 48x48px circular
- Name: SF Pro Display Semibold 17pt
- Strength: SF Pro Display Regular 15pt, #6B7280
- Stats: SF Pro Display Regular 13pt, #6B7280
  - "23 doses • 2 vials used"
- Mini chart: Sparkline showing dose trend

### Vial Status Summary

#### Expandable Section
```
Vial Overview                      ▼
┌────────────────────────────────────┐
│ Active: 3                          │
│ Expired: 1                         │
│ Empty: 2                           │
│ Total Used: 6                      │
└────────────────────────────────────┘
```

- Collapsible with chevron
- Status counts with colored indicators

### Export Options (Modal)

#### Export Button Action
- Opens bottom sheet
- Options:
  - Export as JSON
  - Export as CSV
  - Generate PDF Report
  - Share Summary

### Charts Section

#### Adherence Chart
- Type: Line chart
- Height: 200px
- Shows daily adherence percentage
- Teal line with gradient fill

#### Dose Distribution
- Type: Bar chart
- Height: 150px
- Shows doses by time of day (AM/PM)

#### Peptide Usage Pie Chart
- Type: Donut chart
- Height: 150px
- Shows relative usage by peptide

## Interactive Elements

### Time Period Selection
- Immediate data refresh
- Smooth transition animation

### Card Interactions
- Tap peptide card → Navigate to detail
- Tap overview cards → Highlight relevant data

### Charts
- Touch to show tooltips
- Pinch to zoom (line charts)
- Tap legend to filter

### Pull to Refresh
- Updates all statistics
- Syncs with Supabase

## Empty States

### No Data
```
[Illustration]
No data to display
Start logging doses to see your summary
[Go to Schedule]
```

### No Peptides
```
[Illustration]
No peptides added yet
Add peptides from inventory to get started
[Go to Inventory]
```

## Loading States
- Skeleton screens for cards
- Shimmer effect on charts
- Progress indicator during export

## Export Modal Design

### Modal Container
- Bottom sheet style
- Rounded top corners
- Height: 280px

### Export Options
```
Export Data
━━━━━━━━━━━━━━━━━━━━━━━━
📄 Export as JSON
📊 Export as CSV
📑 Generate PDF Report
🔗 Share Summary
━━━━━━━━━━━━━━━━━━━━━━━━
[Cancel]
```

- Each option: 56px height
- Icons: 24x24px
- Separator lines
- Cancel button at bottom