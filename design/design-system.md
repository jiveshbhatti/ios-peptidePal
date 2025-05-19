# PeptidePal iOS Design System

## Color Palette

### Primary Colors
- **Primary Teal**: #008080 (Main brand color)
- **Primary Dark**: #006666 (Pressed states)
- **Primary Light**: #00A0A0 (Highlights)

### Accent Colors
- **Accent Coral**: #FF6B6B (CTAs, important actions)
- **Accent Orange**: #FFA726 (Warnings)

### Neutral Colors
- **Background**: #FAFAFA (App background)
- **Surface**: #FFFFFF (Cards, modals)
- **Border**: #F3F4F6 (Subtle borders)
- **Text Primary**: #1A1A1A
- **Text Secondary**: #6B7280
- **Text Tertiary**: #9CA3AF

### Semantic Colors
- **Success**: #10B981
- **Warning**: #F59E0B
- **Error**: #EF4444
- **Info**: #3B82F6

## Typography

### Font Family
- **Primary**: SF Pro Display (iOS System)
- **Mono**: SF Mono (for numbers/doses)

### Font Sizes
- **Title Large**: 34pt (bold)
- **Title 1**: 28pt (bold)
- **Title 2**: 22pt (semibold)
- **Title 3**: 20pt (semibold)
- **Headline**: 17pt (semibold)
- **Body**: 17pt (regular)
- **Callout**: 16pt (regular)
- **Subhead**: 15pt (regular)
- **Footnote**: 13pt (regular)
- **Caption**: 12pt (regular)

## Spacing

### Grid System
- Base unit: 4px
- Common spacings: 4, 8, 12, 16, 20, 24, 32, 40, 48

### Layout Margins
- Screen padding: 16px
- Card padding: 16px
- Component spacing: 12px
- Inline spacing: 8px

## Components

### Cards
```css
background: #FFFFFF;
border-radius: 12px;
padding: 16px;
box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
border: 1px solid #F3F4F6;
```

### Buttons

#### Primary Button
```css
background: #008080;
color: #FFFFFF;
border-radius: 12px;
padding: 14px 24px;
font-weight: 600;
font-size: 17px;
```

#### Secondary Button
```css
background: #F3F4F6;
color: #1A1A1A;
border-radius: 12px;
padding: 14px 24px;
font-weight: 500;
font-size: 17px;
```

### Input Fields
```css
background: #FFFFFF;
border: 1px solid #E5E7EB;
border-radius: 8px;
padding: 12px 16px;
font-size: 17px;
/* Focus state */
border-color: #008080;
box-shadow: 0 0 0 3px rgba(0, 128, 128, 0.1);
```

### Navigation Bar
```css
background: #FFFFFF;
border-top: 1px solid #F3F4F6;
height: 83px; /* iOS standard with safe area */
```

## Icons

### Style
- Line weight: 2px
- Size: 24x24px (standard)
- Color: Inherit from parent

### Key Icons
- Schedule: Calendar outline
- Inventory: Pill/capsule outline
- Calculator: Calculator outline
- Summary: Chart line outline
- Add: Plus circle
- Close: X mark
- Check: Checkmark
- Alert: Exclamation triangle
- Info: Info circle

## Animations

### Timing Functions
- **Default**: ease-in-out (0.25s)
- **Spring**: spring(1, 100, 10, 0)
- **Quick**: ease-out (0.15s)

### Common Animations
- Page transitions: slide from right
- Modal appearance: slide up + fade
- Button press: scale(0.98)
- Loading states: circular progress
- Success feedback: checkmark with bounce

## Accessibility

### Contrast Ratios
- Normal text: 4.5:1 minimum
- Large text: 3:1 minimum
- Interactive elements: 3:1 minimum

### Touch Targets
- Minimum size: 44x44 points
- Spacing between targets: 8px minimum

## Platform Considerations

### iOS Specific
- Status bar: Light content on teal backgrounds
- Safe areas: Respect notch and home indicator
- Haptic feedback: Light impact for buttons
- Native components where appropriate