#!/bin/bash

# Environment Setup Script – single env from env-template.txt

set -e

echo "Setting up Deloitte Initiative Portal environment"
echo "=================================================="

if [ -f ".env" ]; then
    echo ".env already exists. Skipping."
    exit 0
fi

if [ -f "env-template.txt" ]; then
    cp env-template.txt .env
    echo "Created .env from env-template.txt"
    echo "Update .env with SUPABASE_SERVICE_ROLE_KEY, URL, and any other missing credentials."
else
    echo "env-template.txt not found"
    exit 1
fi

echo "See docs/DEPLOYMENT_GUIDE.md for details."
