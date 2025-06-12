#!/bin/bash

# Directory path
SERVER_DIR="/Users/skeltonmod/personal_projects/warehouse-system/server"

# Check if directory exists
if [ ! -d "$SERVER_DIR" ]; then
  echo "Error: Server directory not found at $SERVER_DIR"
  exit 1
fi

# Find and count all .js files
JS_FILES=$(find "$SERVER_DIR" -type f -name "*.js")
FILE_COUNT=$(echo "$JS_FILES" | grep -c "^")

# Check if any .js files were found
if [ "$FILE_COUNT" -eq 0 ]; then
  echo "No .js files found in $SERVER_DIR"
  exit 0
fi

# Inform user of what will be deleted
echo "Found $FILE_COUNT .js files in $SERVER_DIR"
echo "The following files will be deleted:"
echo "$JS_FILES"

# Prompt for confirmation
read -p "Are you sure you want to delete these files? (y/n): " CONFIRM
if [[ "$CONFIRM" != "y" && "$CONFIRM" != "Y" ]]; then
  echo "Operation cancelled"
  exit 0
fi

# Delete the files
find "$SERVER_DIR" -type f -name "*.js" -delete

echo "Successfully deleted all .js files from $SERVER_DIR"
