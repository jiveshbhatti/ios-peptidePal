# Schema Differences Between Production and Development

PeptidePal has different column naming conventions in production vs. development databases. This document explains the differences and how we handle them.

## Column Naming Conventions

| Column Purpose | Production (camelCase) | Development (lowercase) |
|----------------|------------------------|-------------------------|
| Dose logs      | `doseLogs`            | `doselogs`              |
| Typical dose   | `typicalDosageUnits`  | `typicaldosageunits`   |
| AI data        | `dataAiHint`          | `dataaihint`           |
| Start date     | `startDate`           | `startdate`            |

## How We Handle This

We've implemented an adaptive approach in `peptide.service.adaptive.ts` that:

1. Detects the current environment (production or development)
2. Uses the appropriate column names for that environment
3. Keeps application code consistent while adapting database access

```typescript
// Determine which column naming style to use based on environment
const columnNames = {
  doseLogs: config.isProduction ? 'doseLogs' : 'doselogs',
  typicalDosageUnits: config.isProduction ? 'typicalDosageUnits' : 'typicaldosageunits',
  dataAiHint: config.isProduction ? 'dataAiHint' : 'dataaihint',
  startDate: config.isProduction ? 'startDate' : 'startdate'
};
```

## Using the Adaptive Service

When updating database fields that might have different naming:

```typescript
// Create updates object with adaptive column names
const updates: any = { 
  vials: updatedVials 
};

// Use the correct column name for the current environment
updates[columnNames.doseLogs] = [...(peptide.doseLogs || []), newDoseLog];

// Then update
return this.updatePeptide(peptideId, updates);
```

## How It Works

1. The service checks which environment is active using `config.isProduction`
2. It selects the appropriate column name format based on the environment
3. When updating data, it uses computed property names to set the right column:
   ```typescript
   updates[columnNames.doseLogs] = newValue;
   ```
4. This allows your code to work in both environments without changes

## Why We Need This

The different naming conventions exist because:

1. The production database was set up with camelCase column names
2. The development database was set up with lowercase column names
3. PostgreSQL treats unquoted identifiers as lowercase
4. The app needs to work correctly in both environments

## If You Need to Add New Columns

When adding new columns that might differ between environments:

1. Add the column mapping to the `columnNames` object:
   ```typescript
   columnNames.newField = config.isProduction ? 'newField' : 'newfield';
   ```

2. Use the mapping when updating:
   ```typescript
   updates[columnNames.newField] = newValue;
   ```