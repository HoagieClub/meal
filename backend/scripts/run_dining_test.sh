#!/bin/bash

# ============================================================================
# run_dining_test.sh - Script to run the dining events test
#
# This script provides a convenient way to run the dining events test with
# various options, including filtering by date, category, and saving results
# to a file.
#
# Copyright © 2021-2025 Hoagie Club and affiliates.
# ============================================================================

# Determine the base directory
SCRIPT_PATH=$(readlink -f "$0")
SCRIPT_DIR=$(dirname "$SCRIPT_PATH")

# If the script is in the scripts directory, the base dir is one level up
# If it's in the backend directory (via symlink), the base dir is the current directory
if [[ "$SCRIPT_DIR" == */scripts ]]; then
    BASE_DIR=$(dirname "$SCRIPT_DIR")
else
    BASE_DIR="$SCRIPT_DIR"
fi

# Define the output directory relative to the base directory
OUTPUT_DIR="$BASE_DIR/scripts/outputs"

# Display usage information
usage() {
    echo "Usage: $0 [options]"
    echo ""
    echo "Options:"
    echo "  --date DATE       Filter events by date (YYYY-MM-DD)"
    echo "  --category IDS    Filter by category IDs (comma-separated, default: 2,3)"
    echo "  --output FILE     Save results to a JSON file (will be stored in scripts/outputs/)"
    echo "  --analyze         Analyze the date range of events"
    echo "  --location ID     Filter events by location ID"
    echo "  --menu MENU_ID    Get menu for a specific menu ID (format: YYYY-MM-DD-MealName)"
    echo "  --help            Display this help message"
    echo ""
    echo "Examples:"
    echo "  $0 --date 2025-03-01"
    echo "  $0 --category 2 --output residential.json"
    echo "  $0 --location 5 --menu 2025-02-27-Breakfast"
    echo ""
    echo "Note: All output files will be saved to the scripts/outputs/ directory"
    echo ""
    exit 1
}

# Change to the base directory
cd "$BASE_DIR"

# Create the output directory if it doesn't exist
mkdir -p "$OUTPUT_DIR"
echo "Output directory: $OUTPUT_DIR"

# Check if Python is installed
if ! command -v python &> /dev/null; then
    echo "Error: Python is not installed or not in PATH"
    exit 1
fi

# Check if required packages are installed
check_package() {
    python -c "import $1" 2>/dev/null
    if [ $? -ne 0 ]; then
        echo "Installing required package: $1"
        pip install $1
    fi
}

check_package tabulate
check_package pytz

# Parse command line arguments
DATE=""
CATEGORY="2,3"
OUTPUT=""
ANALYZE=""
LOCATION=""
MENU=""
COMMAND="events"

while [[ $# -gt 0 ]]; do
    case "$1" in
        --date)
            DATE="$2"
            shift 2
            ;;
        --category)
            CATEGORY="$2"
            shift 2
            ;;
        --output)
            # Store just the filename, we'll prepend the output directory
            OUTPUT="$2"
            shift 2
            ;;
        --analyze)
            ANALYZE="--analyze"
            shift
            ;;
        --location)
            LOCATION="$2"
            shift 2
            ;;
        --menu)
            MENU="$2"
            COMMAND="menu"
            shift 2
            ;;
        --help)
            usage
            ;;
        *)
            echo "Unknown option: $1"
            usage
            ;;
    esac
done

# Build the command based on the options
if [ "$COMMAND" = "events" ]; then
    CMD="python manage.py test_dining events"
    
    if [ -n "$DATE" ]; then
        CMD="$CMD --date $DATE"
    fi
    
    if [ -n "$CATEGORY" ]; then
        CMD="$CMD --category $CATEGORY"
    fi
    
    if [ -n "$ANALYZE" ]; then
        CMD="$CMD $ANALYZE"
    fi
    
    if [ -n "$OUTPUT" ]; then
        # Prepend the output directory to the filename
        FULL_OUTPUT_PATH="$OUTPUT_DIR/$OUTPUT"
        CMD="$CMD --output $FULL_OUTPUT_PATH"
    fi
elif [ "$COMMAND" = "menu" ]; then
    if [ -z "$LOCATION" ]; then
        echo "Error: --location is required when using --menu"
        usage
    fi
    
    CMD="python manage.py test_dining menu --location $LOCATION --menu $MENU"
    
    if [ -n "$OUTPUT" ]; then
        # Prepend the output directory to the filename
        FULL_OUTPUT_PATH="$OUTPUT_DIR/$OUTPUT"
        CMD="$CMD --output $FULL_OUTPUT_PATH"
    fi
fi

# Display the command being run
echo "Running: $CMD"
echo "========================================"

# Run the command
eval $CMD

# Check if the command was successful
if [ $? -eq 0 ]; then
    echo "========================================"
    echo "Test completed successfully!"
    
    if [ -n "$OUTPUT" ]; then
        echo "Results saved to: $FULL_OUTPUT_PATH"
    fi
else
    echo "========================================"
    echo "Test failed with errors."
    exit 1
fi
