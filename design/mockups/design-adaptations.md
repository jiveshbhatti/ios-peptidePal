# Design Adaptations from Reference Mockup

## What to Adapt for PeptidePal

### Layout Structure ✓
- Bottom tab navigation with 4-5 main sections
- Card-based design for content
- Modal overlays for forms
- Clean header with title and actions

### Components to Reuse
1. **Dashboard Cards**
   - Overview metrics with icons
   - Progress bars for inventory
   - Schedule list items

2. **Calendar View**
   - Monthly grid layout
   - Daily schedule below calendar
   - Add button prominent

3. **Form Modals**
   - Overlay with blur background
   - Clear input fields with labels
   - Primary/secondary button actions

4. **List Items**
   - Image + text + metadata layout
   - Progress indicators
   - Action buttons inline

### Color Adaptations
Replace the blue/purple theme with our teal scheme:
- Primary: #6366F1 → #008080 (Teal)
- Cards: Keep white (#FFFFFF)
- Background: Keep light gray (#FAFAFA)
- Success: Keep green (#10B981)
- Error: Keep red (#EF4444)

### Feature Mapping
Reference Screen → PeptidePal Equivalent:
1. Dashboard → Home/Calendar (combined view)
2. Calendar → Integrated into Home
3. Add Peptide → From Inventory (not calendar)
4. Inventory → Inventory Management
5. History → Summary/Analytics

### Key Improvements for PeptidePal
1. Use our inventory-first approach
2. Add reconstitution calculator
3. Include vial tracking/activation
4. Show expiration warnings
5. Add dose logging confirmation

### Typography Adjustments
- Keep clean sans-serif (SF Pro Display)
- Maintain hierarchy shown in mockup
- Use our specified sizes from design system

### Spacing & Layout
- 16px standard margins (as shown)
- 12px card padding
- 8px between elements
- Consistent grid alignment

## Implementation Priority
1. Bottom navigation structure
2. Card components
3. Modal system
4. Calendar integration
5. List/table views
6. Charts and analytics