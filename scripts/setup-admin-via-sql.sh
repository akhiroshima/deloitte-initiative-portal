#!/bin/bash
# Setup Admin Account via Direct SQL Execution
# This script uses curl to directly execute SQL against Supabase

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Development Supabase credentials
SUPABASE_URL="https://khukxqhbzekvklfwbfsx.supabase.co"
SERVICE_ROLE_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtodWt4cWhiemVrdmtsZndiZnN4Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1ODY1ODY3NiwiZXhwIjoyMDc0MjM0Njc2fQ.ZEVKIQIapS3G67hv2sYhf8vb_5jl22DLmxmoWv8vzLc"

echo -e "${CYAN}🚀 Starting admin account setup via SQL...${NC}"
echo -e "${YELLOW}⚠️  WARNING: This will DELETE ALL existing users!${NC}\n"

# Step 1: Audit current users
echo -e "${BLUE}📊 Auditing current users...${NC}"
curl -s "${SUPABASE_URL}/rest/v1/users?select=id,email,username,name" \
  -H "apikey: ${SERVICE_ROLE_KEY}" \
  -H "Authorization: Bearer ${SERVICE_ROLE_KEY}" | jq '.'

# Step 2: Delete all users from public.users
echo -e "\n${YELLOW}🗑️  Purging all users from public.users...${NC}"
curl -s -X DELETE "${SUPABASE_URL}/rest/v1/users?id=neq.dummy" \
  -H "apikey: ${SERVICE_ROLE_KEY}" \
  -H "Authorization: Bearer ${SERVICE_ROLE_KEY}" \
  -H "Prefer: return=minimal"

if [ $? -eq 0 ]; then
  echo -e "${GREEN}   ✓ Public users deleted${NC}"
else
  echo -e "${RED}   ✗ Failed to delete public users${NC}"
  exit 1
fi

# Step 3: Delete all auth users (requires service role)
echo -e "\n${YELLOW}🗑️  Purging all Supabase Auth users...${NC}"
# List auth users
AUTH_USERS=$(curl -s "${SUPABASE_URL}/auth/v1/admin/users" \
  -H "apikey: ${SERVICE_ROLE_KEY}" \
  -H "Authorization: Bearer ${SERVICE_ROLE_KEY}")

echo "$AUTH_USERS" | jq -r '.users[]? | .id' | while read -r user_id; do
  if [ -n "$user_id" ]; then
    curl -s -X DELETE "${SUPABASE_URL}/auth/v1/admin/users/${user_id}" \
      -H "apikey: ${SERVICE_ROLE_KEY}" \
      -H "Authorization: Bearer ${SERVICE_ROLE_KEY}" > /dev/null
    echo -e "   Deleted auth user: $user_id"
  fi
done
echo -e "${GREEN}   ✓ Auth users deleted${NC}"

# Step 4: Create admin user in Supabase Auth
echo -e "\n${BLUE}👤 Creating admin account...${NC}"
CREATE_USER_RESPONSE=$(curl -s -X POST "${SUPABASE_URL}/auth/v1/admin/users" \
  -H "apikey: ${SERVICE_ROLE_KEY}" \
  -H "Authorization: Bearer ${SERVICE_ROLE_KEY}" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@deloitte.com",
    "password": "admin1234",
    "email_confirm": true,
    "user_metadata": {
      "username": "admin",
      "name": "Admin User",
      "role": "Admin",
      "location": "Global",
      "skills": ["Administration", "Management"],
      "weekly_capacity_hrs": 40,
      "avatar_url": "https://ui-avatars.com/api/?name=Admin+User&background=0D9488"
    }
  }')

AUTH_USER_ID=$(echo "$CREATE_USER_RESPONSE" | jq -r '.id // empty')

if [ -n "$AUTH_USER_ID" ]; then
  echo -e "${GREEN}   ✓ Supabase Auth user created${NC}"
  echo -e "${CYAN}   Auth User ID: $AUTH_USER_ID${NC}"
else
  echo -e "${RED}   ✗ Failed to create auth user${NC}"
  echo "$CREATE_USER_RESPONSE" | jq '.'
  exit 1
fi

# Step 5: Wait for trigger to create public.users entry
echo -e "\n${BLUE}⏳ Waiting for database trigger...${NC}"
sleep 3

# Step 6: Update admin permissions
echo -e "\n${BLUE}🔧 Updating admin permissions...${NC}"
curl -s -X PATCH "${SUPABASE_URL}/rest/v1/users?email=eq.admin@deloitte.com" \
  -H "apikey: ${SERVICE_ROLE_KEY}" \
  -H "Authorization: Bearer ${SERVICE_ROLE_KEY}" \
  -H "Content-Type: application/json" \
  -H "Prefer: return=minimal" \
  -d '{
    "is_admin": true,
    "needs_password_change": false
  }'

echo -e "${GREEN}   ✓ Admin permissions set${NC}"

# Step 7: Verify setup
echo -e "\n${BLUE}✅ Verifying setup...${NC}"
ADMIN_USER=$(curl -s "${SUPABASE_URL}/rest/v1/users?email=eq.admin@deloitte.com&select=*" \
  -H "apikey: ${SERVICE_ROLE_KEY}" \
  -H "Authorization: Bearer ${SERVICE_ROLE_KEY}")

echo "$ADMIN_USER" | jq '.'

echo -e "\n${GREEN}✅ SUCCESS! Admin account created:${NC}"
echo -e "${CYAN}   Username:  admin${NC}"
echo -e "${CYAN}   Email:     admin@deloitte.com${NC}"
echo -e "${CYAN}   Password:  admin1234${NC}"
echo -e "\n${GREEN}🎉 You can now log in at:${NC}"
echo -e "${CYAN}   https://deloitte-portal-dev.netlify.app${NC}\n"

