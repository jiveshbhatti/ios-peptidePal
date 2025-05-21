# Supabase Schema Documentation

This document preserves the database schema from the Supabase implementation of PeptidePal for reference purposes.

## Database Tables

The schema includes the following tables:

### 1. inventory_peptides
- **id** (uuid)
- **name** (text)
- **num_vials** (int4)
- **concentration_per_vial_mcg** (int4)
- **storage_location** (text)
- **expiry_date** (date)
- **created_at** (timestamptz)
- **updated_at** (timestamptz)
- **active_vial_expiry_date** (timestamptz)
- **active_vial_reconstitution_date** (date)
- **active_vial_status** (text)
- **low_stock_threshold** (int4)
- **batch_number** (text) - Used for usage tracking with format "USAGE:14"
- **bac_water_volume_added** (float4)
- **typical_dose_mcg** (float4)

### 2. peptides
- **id** (uuid) - Same as inventory_peptides.id
- **name** (text)
- **strength** (text)
- **dosageUnit** (text)
- **typicalDosageUnits** (numeric)
- **schedule** (jsonb)
- **vials** (jsonb)
- **doseLogs** (jsonb)
- **imageUrl** (text)
- **dataAiHint** (text)
- **notes** (text)
- **startDate** (timestamptz)

### 3. inventory_bac_water
- **id** (uuid)
- **volume_ml_per_bottle** (int4)
- **num_bottles** (int4)
- **expiry_date** (date)
- **created_at** (timestamptz)
- **updated_at** (timestamptz)

### 4. inventory_syringes
- **id** (uuid)
- **type_size** (text)
- **quantity** (int4)
- **brand** (text)
- **created_at** (timestamptz)
- **updated_at** (timestamptz)

### 5. inventory_other_items
- **id** (uuid)
- **item_name** (text)
- **description** (text)
- **quantity** (int4)
- **notes** (text)
- **created_at** (timestamptz)
- **updated_at** (timestamptz)

## Key Relationships

- **inventory_peptides** and **peptides** share the same ID
- **peptides.vials** contains vial objects as a JSON array
- **peptides.doseLogs** contains dose log objects as a JSON array

## Column Naming Conventions

It's important to note that the database uses camelCase for some columns (especially JSON fields like **doseLogs**, **typicalDosageUnits**, etc.) and snake_case for others.

This inconsistency in naming conventions created challenges with the Supabase schema cache and was one of the motivating factors for considering a Firebase migration.

## Schema Visualization

![Supabase Schema](supabase_schema.png)

## Core Entity Models

### Vial Object Structure (in peptides.vials)
```json
{
  "id": "string",
  "isActive": true,
  "initialAmountUnits": 33,
  "remainingAmountUnits": 19,
  "reconstitutionDate": "2025-05-13",
  "expirationDate": "2025-06-10T00:00:00.000Z",
  "bacWaterMl": 3,
  "name": "Vial from batch N/A (Inv ID: c3c4391d)",
  "notes": "Activated from inventory. Original stock: 9 vials."
}
```

### DoseLog Object Structure (in peptides.doseLogs)
```json
{
  "id": "1747808081336",
  "date": "2025-05-21T06:14:07.516Z",
  "timeOfDay": "PM",
  "dosage": 300,
  "unit": "mcg",
  "vialId": "c3c4391d-c1fe-4e27-bb6b-faae10ec27ef",
  "reconstructed": false
}
```

### Schedule Object Structure (in peptides.schedule)
```json
{
  "frequency": "daily",
  "times": ["AM", "PM"],
  "daysOfWeek": [0, 1, 2, 3, 4, 5, 6]
}
```