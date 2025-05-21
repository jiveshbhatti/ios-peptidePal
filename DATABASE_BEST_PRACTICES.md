# Database Best Practices for PeptidePal

## Critical Lessons from the Dose Logs Corruption Issue

### What Happened
We lost historical dose logs for the Glow peptide when making schema changes. This happened because:

1. We had inconsistent column naming in our database (camelCase vs. lowercase)
2. We attempted to fix the issue by updating multiple columns at once with different naming conventions
3. This caused Supabase's schema cache to malfunction, resulting in data loss
4. The lost data had to be reconstructed with estimated dates, losing exact historical information

### Best Practices Moving Forward

#### 1. Always Backup Before Schema Changes
```js
// Before making schema changes or updating structure, ALWAYS back up the data
node backup-peptides-data.js
```

#### 2. Be Consistent with Column Naming
- Our database uses camelCase column names: `doseLogs`, `typicalDosageUnits`, etc.
- Always use the exact case when referencing columns - don't mix `doselogs` and `doseLogs`
- Prefer to update individual columns in separate operations to avoid schema cache issues

#### 3. Use Multi-Step Updates for Complex Changes
Update one field at a time, especially for tables with complex schema:

```js
// CORRECT: Update fields individually
await supabase
  .from('peptides')
  .update({ "doseLogs": updatedDoseLogs })
  .eq('id', peptideId);

await supabase
  .from('peptides')
  .update({ "vials": updatedVials })
  .eq('id', peptideId);

// INCORRECT: Update multiple camelCase fields at once
await supabase
  .from('peptides')
  .update({ 
    "doseLogs": updatedDoseLogs,
    "vials": updatedVials
  })
  .eq('id', peptideId);
```

#### 4. Test Schema Changes on Development First
- Never test schema changes directly on production data
- Create a dev environment with a copy of production data
- Test schema changes on the dev copy before applying to production

#### 5. Implement a Versioning System
- Add a version field to track schema changes
- Implement migration scripts for each schema version change

#### 6. Monitor Data Integrity
- Add validation checks to ensure data integrity
- Log warnings for unexpected data states
- Implement a way to detect when data is lost or corrupted

## Database Schema Reference

### Peptides Table
- `id`: UUID (Primary Key)
- `name`: Text
- `doseLogs`: JSONB array (camelCase)
- `vials`: JSONB array (camelCase)
- `typicalDosageUnits`: Number (camelCase)
- `startDate`: Date (camelCase)
- `dataAiHint`: Text (camelCase)

### Inventory Peptides Table
- `id`: UUID (Primary Key, matches peptide id)
- `name`: Text
- `batch_number`: Text (Used for usage tracking with format `USAGE:14`)
- `num_vials`: Number
- `concentration_per_vial_mcg`: Number
- `active_vial_status`: Enum ('NONE', 'IN_USE', 'FINISHED', 'DISCARDED')

## Emergency Data Recovery

If data corruption occurs:
1. Stop all app operations
2. Run the backup restore script: `node restore-from-backup.js`
3. Check data integrity after restoration
4. Implement fixes with more careful approaches

## Checklist for Database Changes

Before making database changes:
- [ ] Backup all data
- [ ] Document the current schema
- [ ] Test changes on development first
- [ ] Use single-column updates when possible
- [ ] Verify data after changes
- [ ] Update documentation