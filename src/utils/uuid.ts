/**
 * UUID utility functions for proper ID generation
 */

// Generate a proper UUID v4 format for Postgres
export function generateUUID(): string {
  // Create UUID v4 format: xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx
  // where x is any hex digit and y is one of 8, 9, A, or B
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

// Generate a test ID in proper UUID format
export function generateTestId(prefix = 'test'): string {
  return `${prefix}-${generateUUID()}`;
}