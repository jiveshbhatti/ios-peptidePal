# Reconstitution Calculator Screen Mockup

## Layout Structure

### Navigation Header
- Height: 44px
- Background: #FFFFFF
- Title: "Calculator" (centered, SF Pro Display Bold 17pt)
- Bottom border: 1px solid #F3F4F6

### Content Container
- Background: #FAFAFA
- Scroll view with bounce

### Input Sections

#### Card Container
- Background: #FFFFFF
- Border radius: 12px
- Margin: 16px
- Padding: 16px
- Shadow: 0 2px 8px rgba(0,0,0,0.08)

#### Input Field Structure
```
Label
┌────────────────────────┐
│ Value            Unit ▼│
└────────────────────────┘
```

- Label: SF Pro Display Regular 15pt, #6B7280
- Input container: 
  - Height: 48px
  - Border: 1px solid #E5E7EB
  - Border radius: 8px
  - Background: #FFFFFF
- Value: SF Pro Display Regular 17pt, #1A1A1A
- Unit: SF Pro Display Regular 15pt, #008080

#### Input Fields

1. **Peptide Amount**
   - Label: "Total Peptide in Vial"
   - Placeholder: "5"
   - Unit options: mg, mcg

2. **BAC Water Volume**
   - Label: "BAC Water to Add"
   - Placeholder: "2"
   - Unit: ml (fixed)

3. **Desired Dose**
   - Label: "Desired Dose per Injection"
   - Placeholder: "250"
   - Unit options: mg, mcg, IU

4. **Syringe Type** (Optional)
   - Label: "Syringe Type"
   - Segmented control:
     - 31g (0.3ml)
     - 30g (0.5ml)
     - 29g (1ml)

### Results Section

#### Results Card
- Background: #E0F2F1 (light teal tint)
- Border: 1px solid #008080
- Border radius: 12px
- Margin: 16px
- Padding: 16px

#### Result Items
```
Icon | Label              | Value
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🧪   | Concentration      | 2.5 mg/ml
💉   | Volume to Draw     | 0.1 ml
📊   | Total Doses        | 20 doses
⏱️   | Days Supply        | ~20 days
```

- Icons: 20x20px
- Label: SF Pro Display Regular 15pt, #6B7280
- Value: SF Pro Display Semibold 17pt, #008080

### Visual Syringe Indicator
- Optional visual representation
- Shows fill level for volume to draw
- Animated fill on calculation

### Action Buttons
- "Calculate" button (if not real-time)
  - Full width
  - Height: 48px
  - Background: #008080
  - Text: White, SF Pro Display Semibold 17pt
  - Border radius: 8px
  - Margin: 16px

- "Save Calculation" (optional)
  - Secondary style
  - Below calculate button

## Interactive Behavior

### Real-time Calculation
- Updates results as user types
- Debounced (300ms) to avoid excessive updates

### Unit Selection
- Dropdown or segmented control
- Automatic unit conversion

### Input Validation
- Positive numbers only
- Max decimal places: 3
- Error states:
  - Red border
  - Error message below field

### Keyboard Handling
- Number pad for numeric inputs
- Done button to dismiss
- Next/Previous for field navigation

## States

### Empty State
- Grayed out results section
- Instructions: "Enter values above to calculate"

### Error State
- Red borders on invalid fields
- Error messages below fields
- Results section shows warning

### Loading State
- Subtle loading indicator in results
- Disabled during calculation

## Animations

### Results Update
- Fade in/out transition
- Value counter animation (optional)

### Focus States
- Border color change to teal
- Subtle shadow expansion