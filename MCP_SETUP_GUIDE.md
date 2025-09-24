# Supabase MCP Server Setup Guide

## 🎯 Overview

This guide covers setting up the Supabase MCP (Model Context Protocol) server for Cursor IDE integration. This allows Cursor to directly interact with your Supabase database for enhanced AI assistance.

## 🔧 Prerequisites

- Cursor IDE installed
- Supabase project with database access
- Supabase account with API access

## 📋 Setup Steps

### 1. Run the Setup Script

```bash
npm run setup:mcp
```

This will:
- Create `.env.mcp` from the template
- Display setup instructions

### 2. Get Your Supabase Credentials

#### Project Reference
1. Go to your [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project
3. Go to **Settings → General**
4. Copy the **Reference ID** (or look at the URL: `https://supabase.com/dashboard/project/YOUR_PROJECT_REF`)

#### Access Token
1. Go to [Supabase Account Settings → Access Tokens](https://supabase.com/dashboard/account/tokens)
2. Click **"Generate new token"**
3. Give it a descriptive name (e.g., "Cursor MCP Server")
4. Select appropriate scopes:
   - ✅ **Read access to organizations**
   - ✅ **Read access to projects**
   - ✅ **Read access to database**
5. Copy the token immediately (you won't see it again!)

### 3. Configure Environment Variables

Edit `.env.mcp` with your actual credentials:

```bash
# Replace with your actual values
SUPABASE_PROJECT_REF=your_actual_project_ref
SUPABASE_ACCESS_TOKEN=your_actual_access_token
```

### 4. Update MCP Configuration

Edit `.cursor/mcp.json` and replace `<project-ref>` with your actual project reference:

```json
{
  "mcpServers": {
    "supabase": {
      "command": "npx",
      "args": [
        "-y",
        "@supabase/mcp-server-supabase",
        "--read-only",
        "--project-ref=your_actual_project_ref"
      ],
      "env": {
        "SUPABASE_ACCESS_TOKEN": "<access-token>"
      }
    }
  }
}
```

### 5. Load Environment Variables

The MCP server needs access to your environment variables. You can either:

**Option A: Load from .env.mcp**
```bash
# Load environment variables and start Cursor
source .env.mcp && cursor .
```

**Option B: Set directly in mcp.json**
Replace `<access-token>` in `.cursor/mcp.json` with your actual token:

```json
{
  "mcpServers": {
    "supabase": {
      "command": "npx",
      "args": [
        "-y",
        "@supabase/mcp-server-supabase",
        "--read-only",
        "--project-ref=your_actual_project_ref"
      ],
      "env": {
        "SUPABASE_ACCESS_TOKEN": "your_actual_access_token"
      }
    }
  }
}
```

### 6. Restart Cursor

Close and restart Cursor to load the MCP server configuration.

## ✅ Verification

Once set up, you should be able to:

1. **Ask database questions**: "What tables do I have in my database?"
2. **Query data**: "Show me all users in the users table"
3. **Get schema info**: "What's the structure of the initiatives table?"
4. **Analyze data**: "How many initiatives are in progress?"

## 🔒 Security Notes

- The MCP server is configured with `--read-only` flag for safety
- Access tokens should be kept secure and not committed to git
- Consider using environment-specific tokens for development vs production

## 🛠️ Troubleshooting

### MCP Server Not Loading
1. Check that `.cursor/mcp.json` exists and is valid JSON
2. Verify your project reference is correct
3. Ensure your access token has the right permissions
4. Restart Cursor completely

### Permission Errors
1. Verify your access token has database read permissions
2. Check that your Supabase project is accessible
3. Ensure the project reference matches your actual project

### Connection Issues
1. Check your internet connection
2. Verify Supabase service status
3. Try regenerating your access token

## 📚 Available Commands

With the MCP server running, you can use these types of queries:

- `List all tables in my database`
- `Show me the schema for the users table`
- `What indexes exist on the initiatives table?`
- `How many rows are in each table?`
- `Show me recent entries in the notifications table`

## 🔄 Environment-Specific Setup

For multiple environments (dev/prod), you can:

1. Create separate MCP configurations:
   - `.cursor/mcp-dev.json`
   - `.cursor/mcp-prod.json`

2. Use different access tokens for each environment

3. Switch configurations as needed for your workflow

---

**🎉 Your Supabase MCP server is now ready for use with Cursor!**
