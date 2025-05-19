# Inventory Screen Mockup

## Layout Structure

### Navigation Header
- Height: 44px
- Background: #FFFFFF
- Title: "Inventory" (centered, SF Pro Display Bold 17pt)
- Right: Plus icon for adding (24x24px, #008080)
- Bottom border: 1px solid #F3F4F6

### Search Bar
- Height: 36px
- Background: #F3F4F6
- Corner radius: 8px
- Margin: 16px
- Placeholder: "Search peptides..." (#9CA3AF)
- Search icon: 16x16px, left padding 12px

### Content Sections

#### Active Peptides Section
- Section header: "Active Peptides (3)" (SF Pro Display Semibold 17pt)
- Margin: 16px top, 8px bottom

#### Peptide Inventory Card
```
┌─────────────────────────────────────┐
│ [Status] [Image] [Content] [Arrow]  │
│   8x8     48x48   Flexible   >      │
└─────────────────────────────────────┘
```

- Background: #FFFFFF
- Border radius: 12px
- Padding: 16px
- Margin: 8px horizontal, 8px vertical
- Shadow: 0 2px 8px rgba(0,0,0,0.08)

#### Card Content Structure
- Status indicator: 8x8px circle
  - Green (#10B981): Active/In use
  - Yellow (#F59E0B): Low stock
  - Gray (#9CA3AF): Inactive
- Image: 48x48px circular
- Text content:
  - Name (SF Pro Display Semibold 17pt)
  - Stock info (SF Pro Display Regular 15pt, #6B7280)
  - Active vial status with progress bar
- Arrow: Chevron right (#9CA3AF)

#### Progress Bar (for active vials)
- Height: 4px
- Background: #F3F4F6
- Fill: #008080 (teal)
- Corner radius: 2px
- Width: 200px

#### Inactive Stock Section
- Same structure as active section
- Cards show gray status indicator
- No progress bars

### Floating Action Button
- Position: Bottom right, 16px margin
- Size: 56x56px
- Background: #008080
- Icon: Plus sign, white, 24x24px
- Shadow: 0 4px 12px rgba(0,128,128,0.3)

## States

### Empty State
- Icon: Empty box illustration
- Title: "No peptides in inventory"
- Subtitle: "Add your first peptide to get started"
- CTA: "Add Peptide" button

### Loading State
- Skeleton cards with shimmer effect
- Same layout structure

### Pull to Refresh
- Standard iOS pull-to-refresh indicator
- Teal color theme

## Interactions

### Card Tap
- Navigate to peptide detail/edit screen
- Subtle press animation (scale 0.98)

### Add Button
- Opens add peptide form
- Spring animation on appear

### Search
- Real-time filtering as user types
- Smooth fade in/out of results

### Swipe Actions
- Swipe left to reveal:
  - Edit (blue)
  - Delete (red)
- Confirmation dialog for delete