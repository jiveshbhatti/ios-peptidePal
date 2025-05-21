#!/bin/bash
# Script to cleanup unneeded Firebase test scripts

# Create a directory for archived scripts
mkdir -p scripts/archived

# List of scripts to keep
KEEP_SCRIPTS=(
  "migration-test.js"
  "admin-migrate-to-firebase.js"
  "backup-database.js"
  "restore-database.js"
  "cleanup.sh"
)

# Move other scripts to archived folder
for script in scripts/*.js; do
  filename=$(basename "$script")
  keep=false
  
  for keep_script in "${KEEP_SCRIPTS[@]}"; do
    if [ "$filename" == "$keep_script" ]; then
      keep=true
      break
    fi
  done
  
  if [ "$keep" == false ]; then
    echo "Moving $filename to scripts/archived/"
    mv "$script" "scripts/archived/$filename"
  else
    echo "Keeping $filename"
  fi
done

echo "Cleanup complete"