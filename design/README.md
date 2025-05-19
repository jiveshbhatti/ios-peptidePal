# PeptidePal iOS Design Resources

This folder contains comprehensive design documentation and resources for the PeptidePal iOS app.

## Folder Structure

```
design/
├── design-system.md      # Complete design system specifications
├── mockups/             # Detailed screen mockup descriptions
│   ├── 01-home-calendar.md
│   ├── 02-inventory.md
│   ├── 03-calculator.md
│   ├── 04-dose-logging.md
│   └── 05-summary-dashboard.md
├── ai-prompts/          # Prompts for AI design generation
│   ├── figma-style-prompts.md
│   ├── midjourney-prompts.md
│   └── dall-e-prompts.md
└── README.md           # This file
```

## Design Overview

### Brand Identity
- **Primary Color**: Teal (#008080)
- **Design Philosophy**: Clean, minimal, medical-grade professional
- **Inspiration**: Airbnb, Notion, Linear design systems
- **Target Audience**: Health-conscious individuals tracking peptide regimens

### Key Design Principles
1. **Clarity**: Easy-to-read typography and clear visual hierarchy
2. **Accessibility**: High contrast ratios and large touch targets
3. **Consistency**: Unified component system across all screens
4. **Native Feel**: Following iOS design guidelines and patterns
5. **Medical Precision**: Clean, professional aesthetic appropriate for health tracking

## Screen Designs

### Core Screens
1. **Home/Calendar**: Monthly view with daily schedule
2. **Inventory**: Stock management with vial tracking
3. **Calculator**: Reconstitution calculations
4. **Summary**: Analytics and usage reports

### Modal/Secondary Screens
- Dose logging modal
- Add/Edit peptide forms
- Settings and preferences
- Export options

## Using AI Tools for Design

### Recommended Tools
1. **Figma**: Primary design tool for creating mockups
2. **Midjourney**: High-quality UI mockup generation
3. **DALL-E 3**: Quick concept visualization
4. **Claude**: Design description and component specs

### Workflow
1. Use AI prompts to generate initial concepts
2. Refine in Figma for pixel-perfect designs
3. Export components for development
4. Create interactive prototypes

## Design System Components

### Essential Components
- Navigation bars and tab bars
- Cards and list items
- Buttons and CTAs
- Form inputs and controls
- Modals and sheets
- Progress indicators
- Empty states
- Loading states

### Color Usage
- Primary actions: Teal (#008080)
- Destructive actions: Red (#EF4444)
- Success states: Green (#10B981)
- Warnings: Orange (#F59E0B)
- Background: Off-white (#FAFAFA)
- Surface: White (#FFFFFF)

## Implementation Notes

### iOS Specific Considerations
- Safe area insets for notch and home indicator
- Native font (SF Pro Display)
- Standard iOS navigation patterns
- Haptic feedback for interactions
- Dark mode support (future enhancement)

### Responsive Design
- Support for different iPhone sizes
- Landscape orientation considerations
- Dynamic type support
- Adaptive layouts

## Getting Started

1. Review the design system documentation
2. Check individual screen mockups
3. Use AI prompts to generate visual concepts
4. Create high-fidelity designs in Figma
5. Export assets for development

## Resources

### External References
- [Apple Human Interface Guidelines](https://developer.apple.com/design/human-interface-guidelines/ios)
- [iOS Design Resources](https://developer.apple.com/design/resources/)
- [React Native Design Patterns](https://reactnative.dev/docs/design)

### Tools
- [Figma iOS UI Kit](https://www.figma.com/community/file/809487622678629513)
- [SF Symbols](https://developer.apple.com/sf-symbols/)
- [Expo Icons](https://icons.expo.fyi/)

## Contributing

When adding new designs:
1. Follow the established design system
2. Document new components thoroughly
3. Update AI prompts for consistency
4. Test on multiple device sizes
5. Consider accessibility requirements