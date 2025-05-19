import type { Peptide, DoseLog, Vial } from './peptide';

// Define the schema for our Supabase database
export type Database = {
  public: {
    Tables: {
      peptides: {
        Row: Peptide; // What we get back from the database
        Insert: Omit<Peptide, 'id'>; // What we can insert (excluding id which is auto-generated)
        Update: Partial<Peptide>; // What we can update (any subset of fields)
      };
      // Add other tables here as needed
    };
    Functions: {
      // Add any database functions here
    };
  };
};
