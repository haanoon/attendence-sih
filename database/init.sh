#!/bin/bash

# PostgreSQL Database Initialization Script
# This script creates the database, applies the schema, and loads sample data

set -e

# Database configuration
DB_NAME="${DATABASE_NAME:-attendance_db}"
DB_USER="${DATABASE_USER:-postgres}"
DB_HOST="${DATABASE_HOST:-localhost}"
DB_PORT="${DATABASE_PORT:-5432}"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}Starting PostgreSQL database initialization...${NC}"

# Check if PostgreSQL is running
if ! command -v psql &> /dev/null; then
    echo -e "${RED}Error: PostgreSQL is not installed or not in PATH${NC}"
    exit 1
fi

# Function to execute SQL with error handling
execute_sql() {
    local sql_file=$1
    local description=$2
    
    echo -e "${YELLOW}$description...${NC}"
    
    if PGPASSWORD="${DATABASE_PASSWORD}" psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -f "$sql_file"; then
        echo -e "${GREEN}✓ $description completed successfully${NC}"
    else
        echo -e "${RED}✗ Failed to execute $description${NC}"
        exit 1
    fi
}

# Create database if it doesn't exist
echo -e "${YELLOW}Creating database if it doesn't exist...${NC}"
PGPASSWORD="${DATABASE_PASSWORD}" createdb -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" "$DB_NAME" 2>/dev/null || echo "Database might already exist"

# Get the directory where this script is located
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Apply schema
execute_sql "$SCRIPT_DIR/schema.sql" "Applying database schema"

# Load sample data (optional)
if [ "${LOAD_SAMPLE_DATA:-true}" = "true" ]; then
    execute_sql "$SCRIPT_DIR/seed.sql" "Loading sample data"
fi

echo -e "${GREEN}Database initialization completed successfully!${NC}"
echo -e "${YELLOW}Database: $DB_NAME${NC}"
echo -e "${YELLOW}Host: $DB_HOST:$DB_PORT${NC}"
echo -e "${YELLOW}User: $DB_USER${NC}"

# Display some basic statistics
echo -e "${GREEN}Database Statistics:${NC}"
PGPASSWORD="${DATABASE_PASSWORD}" psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -c "
SELECT 
    'Users' as table_name, COUNT(*) as count FROM users
UNION ALL
SELECT 
    'Classes' as table_name, COUNT(*) as count FROM classes
UNION ALL
SELECT 
    'Enrollments' as table_name, COUNT(*) as count FROM class_enrollments
UNION ALL
SELECT 
    'Sessions' as table_name, COUNT(*) as count FROM attendance_sessions
UNION ALL
SELECT 
    'Records' as table_name, COUNT(*) as count FROM attendance_records
ORDER BY table_name;
"