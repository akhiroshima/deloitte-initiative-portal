# Supabase MCP Server Setup Guide

## 🎯 Overview

The Supabase MCP (Model Context Protocol) server allows you to interact with your Supabase database directly through the MCP interface. This enables AI assistants to query, analyze, and manage your database schema and data.

## 📋 Prerequisites

- ✅ Supabase MCP server installed (`supabase-mcp-server`)
- ✅ Supabase project with database access
- ✅ Database password for your Supabase project

## 🚀 Quick Start

### 1. Configure Environment Variables

Update the `env-mcp.txt` file with your actual Supabase credentials:

```bash
# Copy the template
cp env-mcp.txt .env.mcp

# Edit with your actual credentials
nano .env.mcp
```

Required variables:
- `SUPABASE_PROJECT_REF`: Your project reference (extract from Supabase URL)
- `SUPABASE_DB_PASSWORD`: Your database password
- `SUPABASE_REGION`: Your Supabase region (e.g., `us-east-1`)

### 2. Start the MCP Server

```bash
# Using the provided script
./scripts/start-mcp-server.sh

# Or manually
export $(cat env-mcp.txt | grep -v '^#' | xargs)
/Library/Frameworks/Python.framework/Versions/3.12/bin/supabase-mcp-server
```

### 3. Connect to MCP Server

The server will start on `127.0.0.1:3001` by default. You can connect to it using any MCP-compatible client.

## 🔧 Configuration Options

### Environment Variables

| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `SUPABASE_PROJECT_REF` | Your Supabase project reference | - | ✅ |
| `SUPABASE_DB_PASSWORD` | Database password | - | ✅ |
| `SUPABASE_REGION` | Supabase region | `us-east-1` | ❌ |
| `SUPABASE_ACCESS_TOKEN` | Management API token | - | ❌ |
| `MCP_HOST` | Server host | `127.0.0.1` | ❌ |
| `MCP_PORT` | Server port | `3001` | ❌ |
| `MCP_LOG_LEVEL` | Log level | `INFO` | ❌ |

### Configuration File

You can also use a YAML configuration file (`supabase-mcp-config.yaml`):

```yaml
supabase:
  project_ref: "your_project_ref"
  db_password: "your_password"
  region: "us-east-1"
  access_token: "your_token"

database:
  host: "db.your_project.supabase.co"
  port: 5432
  database: "postgres"
  user: "postgres"
  password: "your_password"

server:
  host: "127.0.0.1"
  port: 3001
  log_level: "INFO"
```

## 🛠️ Usage Examples

### Database Schema Analysis

The MCP server can help you:
- Analyze your database schema
- Query table structures
- Understand relationships between tables
- Generate SQL queries

### Data Operations

- Query data from tables
- Analyze data patterns
- Generate reports
- Perform data transformations

### Schema Management

- View table definitions
- Understand column types and constraints
- Analyze foreign key relationships
- Generate migration scripts

## 🔍 Troubleshooting

### Common Issues

#### 1. Connection Errors
```
Error: Could not connect to database
```
**Solution**: Check your database credentials and network connectivity.

#### 2. Authentication Errors
```
Error: Authentication failed
```
**Solution**: Verify your `SUPABASE_DB_PASSWORD` is correct.

#### 3. Project Not Found
```
Error: Project not found
```
**Solution**: Check your `SUPABASE_PROJECT_REF` matches your project.

### Debug Mode

Run with debug logging:
```bash
export MCP_LOG_LEVEL=DEBUG
./scripts/start-mcp-server.sh
```

### Check Server Status

The server should output:
```
🚀 Starting Supabase MCP Server
================================
📋 Loading environment variables...
✅ Environment variables loaded
🔗 Project: your_project_ref
🌍 Region: us-east-1
🏠 Host: 127.0.0.1
🔌 Port: 3001

🚀 Starting MCP server...
```

## 📚 Integration with AI Assistants

### Claude Desktop

Add to your `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "supabase": {
      "command": "/path/to/your/project/scripts/start-mcp-server.sh",
      "args": []
    }
  }
}
```

### Other MCP Clients

The server exposes standard MCP endpoints that can be used with any MCP-compatible client.

## 🔒 Security Considerations

1. **Environment Variables**: Never commit `.env.mcp` to version control
2. **Database Access**: Use read-only database users when possible
3. **Network Security**: Run on localhost in development
4. **Access Tokens**: Rotate access tokens regularly

## 📖 Additional Resources

- [Supabase MCP Server GitHub](https://github.com/Deploya-labs/mcp-supabase)
- [Model Context Protocol Documentation](https://modelcontextprotocol.io/)
- [Supabase Documentation](https://supabase.com/docs)

## ✅ Checklist

- [ ] Supabase MCP server installed
- [ ] Environment variables configured
- [ ] Database credentials verified
- [ ] MCP server starts successfully
- [ ] Can connect to database
- [ ] AI assistant can query database

---

**🎉 You now have a fully functional Supabase MCP server!**
