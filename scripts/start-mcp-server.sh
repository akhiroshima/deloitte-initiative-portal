#!/bin/bash

# Start Supabase MCP Server
# This script starts the Supabase MCP server with proper configuration

set -e

echo "🚀 Starting Supabase MCP Server"
echo "================================"

# Check if environment file exists
if [ ! -f "env-mcp.txt" ]; then
    echo "❌ Environment file env-mcp.txt not found"
    echo "📝 Please create env-mcp.txt with your Supabase credentials"
    exit 1
fi

# Load environment variables
echo "📋 Loading environment variables..."
export $(cat env-mcp.txt | grep -v '^#' | xargs)

# Check if required variables are set
if [ -z "$SUPABASE_PROJECT_REF" ] || [ -z "$SUPABASE_DB_PASSWORD" ]; then
    echo "❌ Missing required environment variables"
    echo "📝 Please update env-mcp.txt with your actual Supabase credentials"
    exit 1
fi

echo "✅ Environment variables loaded"
echo "🔗 Project: $SUPABASE_PROJECT_REF"
echo "🌍 Region: ${SUPABASE_REGION:-us-east-1}"
echo "🏠 Host: ${MCP_HOST:-127.0.0.1}"
echo "🔌 Port: ${MCP_PORT:-3001}"

# Start the MCP server
echo ""
echo "🚀 Starting MCP server..."
echo "Press Ctrl+C to stop the server"
echo ""

/Library/Frameworks/Python.framework/Versions/3.12/bin/supabase-mcp-server
