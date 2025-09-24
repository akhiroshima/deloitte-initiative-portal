#!/bin/bash

# Supabase MCP Server Setup Script
# This script helps configure the Supabase MCP server for Cursor

set -e

echo "🔧 Setting up Supabase MCP Server for Cursor"
echo "============================================="

# Check if .cursor directory exists
if [ ! -d ".cursor" ]; then
    echo "📁 Creating .cursor directory..."
    mkdir -p .cursor
fi

# Check if mcp.json exists
if [ ! -f ".cursor/mcp.json" ]; then
    echo "❌ .cursor/mcp.json not found. Please run this script from the project root."
    exit 1
fi

# Create .env.mcp from template
if [ -f "env-mcp.txt" ]; then
    if [ ! -f ".env.mcp" ]; then
        cp env-mcp.txt .env.mcp
        echo "✅ Created .env.mcp from template"
    else
        echo "⚠️  .env.mcp already exists. Skipping..."
    fi
else
    echo "❌ env-mcp.txt template not found"
    exit 1
fi

echo ""
echo "📝 Next steps:"
echo "1. Get your Supabase project reference from your dashboard"
echo "2. Generate an access token from Supabase Account Settings > Access Tokens"
echo "3. Update .env.mcp with your actual credentials"
echo "4. Update .cursor/mcp.json with your project-ref"
echo "5. Restart Cursor to load the MCP server"
echo ""
echo "🔍 To find your project reference:"
echo "   - Go to your Supabase project dashboard"
echo "   - Look at the URL: https://supabase.com/dashboard/project/YOUR_PROJECT_REF"
echo "   - Or go to Settings > General > Reference ID"
echo ""
echo "🔑 To generate an access token:"
echo "   - Go to https://supabase.com/dashboard/account/tokens"
echo "   - Click 'Generate new token'"
echo "   - Give it a name and select appropriate scopes"
echo "   - Copy the token (you won't see it again!)"
echo ""
echo "✨ MCP setup template ready!"
