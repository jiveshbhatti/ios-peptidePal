# Supabase Column Naming Convention

This document outlines important information about column naming in the PeptidePal application, particularly regarding case sensitivity with Supabase PostgreSQL.

## Important Convention

**All database column names must use lowercase** when writing to Supabase.

### Case Sensitivity Issue

Supabase uses PostgreSQL, which treats unquoted identifiers as lowercase. This means:

- Column names in the database are stored in lowercase
- TypeScript interfaces may use camelCase for better readability
- When sending data to Supabase, use lowercase keys

### Examples of Column Name Mapping

| TypeScript Interface | Database Column   |
|---------------------|-------------------|
| `doseLogs`          | `doselogs`        |
| `typicalDosageUnits`| `typicaldosageunits` |
| `dataAiHint`        | `dataaihint`      |
| `createdAt`         | `createdat`       |

## How to Implement This

### In SQL Scripts

When creating tables, use lowercase column names:

```sql
CREATE TABLE public.peptides (
  id UUID PRIMARY KEY,
  name TEXT,
  doselogs JSONB DEFAULT '[]'::jsonb,
  typicaldosageunits NUMERIC,
  createdat TIMESTAMP WITH TIME ZONE DEFAULT now()
);
```

### In TypeScript Code

When reading data from Supabase, you can still use camelCase:

```typescript
interface Peptide {
  id: string;
  name: string;
  doseLogs: DoseLog[];  // Camel case in TypeScript
  typicalDosageUnits: number;
  createdAt: string;
}

// Reading from the database
const peptide = data as Peptide;
console.log(peptide.doseLogs);  // Accessing with camelCase is fine
```

When writing to Supabase, use lowercase keys:

```typescript
// WRONG - will cause errors
const updates = {
  doseLogs: [...peptide.doseLogs, newLog],
  typicalDosageUnits: 300
};

// CORRECT - use lowercase keys for database operations
const updates = {
  doselogs: [...peptide.doseLogs, newLog],
  typicaldosageunits: 300
};

// Apply the update
const { data, error } = await supabase
  .from('peptides')
  .update(updates)
  .eq('id', peptideId);
```

## Common Errors

If you see errors like:

```
Could not find the 'doseLogs' column of 'peptides' in the schema cache
```

This indicates you're trying to use camelCase column names with Supabase, which won't work. Change to lowercase keys when updating data.

## Type Safety Solution

To maintain type safety while using lowercase for Supabase, we use `any` type for updates:

```typescript
// Using 'any' type to allow lowercase keys
const updates: any = {
  doselogs: [...peptide.doseLogs, newLog],
  vials: updatedVials
};

// Then update the database
return this.updatePeptide(peptideId, updates);
```