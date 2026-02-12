#!/bin/bash
# Apply full database setup to the linked Supabase project (schema + RLS + migrations).
# Requires: SUPABASE_DB_URL (Postgres connection string from Supabase Dashboard → Settings → Database)
#           and `psql` on PATH (e.g. from Postgres app or `brew install libpq`).
# Usage: ./scripts/apply-database-setup.sh

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"

if [ -z "${SUPABASE_DB_URL}" ]; then
  echo -e "${RED}ERROR: SUPABASE_DB_URL is not set.${NC}"
  echo "Get the connection string from: Supabase Dashboard → Settings → Database → Connection string (URI)."
  echo "Example: postgresql://postgres.[project-ref]:[PASSWORD]@aws-0-[region].pooler.supabase.com:6543/postgres"
  exit 1
fi

if ! command -v psql &>/dev/null; then
  echo -e "${RED}ERROR: psql not found. Install Postgres client (e.g. brew install libpq) and ensure psql is on PATH.${NC}"
  exit 1
fi

echo -e "${YELLOW}Applying database setup (6 steps) to Supabase...${NC}"

run_sql() {
  local label="$1"
  local file="$2"
  echo -e "${YELLOW}  → $label${NC}"
  psql "${SUPABASE_DB_URL}" -v ON_ERROR_STOP=1 -f "$file" && echo -e "  ${GREEN}✓ $label${NC}" || { echo -e "${RED}Failed: $label${NC}"; exit 1; }
}

run_sql "1. Base schema"           "${REPO_ROOT}/server/schema.sql"
run_sql "2. RLS policies"         "${REPO_ROOT}/server/rls-policies.sql"
run_sql "3. Supabase auth sync"   "${REPO_ROOT}/supabase/migrations/add_supabase_auth.sql"
run_sql "4. Join requests status" "${REPO_ROOT}/supabase/migrations/20260210000000_add_invited_status_to_join_requests.sql"
run_sql "5. Notifications initiative_id" "${REPO_ROOT}/supabase/migrations/20260210100000_add_initiative_id_to_notifications.sql"
run_sql "6. Feedback table"       "${REPO_ROOT}/supabase/migrations/20260210110000_add_feedback_table.sql"

echo -e "\n${GREEN}Database setup complete.${NC}"
