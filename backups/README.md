# PeptidePal Database Backups

This directory contains database backups created by the backup scripts.

## Backup Structure

Each backup is stored in a separate directory with the following naming pattern:
`backup-YYYY-MM-DDTHH-mm-ss.sssZ`

Inside each backup directory, you'll find:
- One JSON file for each database table
- A `metadata.json` file containing information about the backup

## Creating a Manual Backup

To create a manual backup, run:

```bash
node scripts/backup-database.js
```

This will create a new backup in this directory.

## Restoring from a Backup

To restore from a backup, run:

```bash
node scripts/restore-database.js
```

This will guide you through an interactive process to:
1. Select which backup to restore from
2. Choose which tables to restore
3. Confirm the restoration

⚠️ **WARNING: Restoring will overwrite existing data in the database!** ⚠️

## Automatic Backups

For automatic backups, set up a cron job or scheduled task to run the backup script daily.

See `DATABASE_BACKUP_STRATEGY.md` in the root directory for detailed information on the backup strategy and implementation.