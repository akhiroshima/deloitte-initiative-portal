# 🐳 Docker Development Guide - Deloitte Initiative Portal

## 🎯 Overview

This guide covers Docker containerization for the Deloitte Initiative Portal, providing isolated development environments and production-ready containers.

## 🏗️ Docker Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Docker Environment                       │
├─────────────────────────────────────────────────────────────┤
│  Frontend (React/Vite)     │  Backend Services              │
│  Port: 5173                │                                │
│                            │  PostgreSQL + pgvector         │
│                            │  Port: 5432                    │
│                            │                                │
│                            │  Redis (Caching)              │
│                            │  Port: 6379                    │
│                            │                                │
│                            │  Adminer (DB Admin)           │
│                            │  Port: 8080                    │
└─────────────────────────────────────────────────────────────┘
```

## 🚀 Quick Start

### 1. **Start Development Environment**
```bash
# Start all services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

### 2. **Development with Live Reload**
```bash
# Start with development overrides
docker-compose -f docker-compose.yml -f docker-compose.dev.yml up -d

# Access your application
open http://localhost:5173
```

### 3. **Database Management**
```bash
# Access database via Adminer
open http://localhost:8080

# Connection details:
# Server: postgres
# Username: postgres
# Password: postgres
# Database: deloitte_portal_dev
```

## 📋 Available Services

| Service | URL | Purpose |
|---------|-----|---------|
| **Frontend** | http://localhost:5173 | React development server |
| **Database** | localhost:5432 | PostgreSQL with pgvector |
| **Redis** | localhost:6379 | Caching service |
| **Adminer** | http://localhost:8080 | Database administration |

## 🛠️ Docker Commands

### **Development Commands**
```bash
# Build and start services
docker-compose up --build

# Start in background
docker-compose up -d

# View service logs
docker-compose logs frontend
docker-compose logs postgres

# Execute commands in running containers
docker-compose exec frontend npm install
docker-compose exec postgres psql -U postgres -d deloitte_portal_dev

# Restart specific service
docker-compose restart frontend
```

### **Database Operations**
```bash
# Run database migrations
docker-compose exec postgres psql -U postgres -d deloitte_portal_dev -f /docker-entrypoint-initdb.d/01-schema.sql

# Backup database
docker-compose exec postgres pg_dump -U postgres deloitte_portal_dev > backup.sql

# Restore database
docker-compose exec -T postgres psql -U postgres deloitte_portal_dev < backup.sql
```

### **Production Build**
```bash
# Build production image
docker build --target production -t deloitte-portal:prod .

# Run production container
docker run -p 80:80 deloitte-portal:prod
```

## 🔧 Configuration

### **Environment Variables**
Create a `.env` file in the project root:

```env
# Database
POSTGRES_DB=deloitte_portal_dev
POSTGRES_USER=postgres
POSTGRES_PASSWORD=postgres

# Frontend (Vite requires VITE_ prefix)
VITE_SUPABASE_URL=http://localhost:54322
VITE_SUPABASE_ANON_KEY=your-local-supabase-anon-key

# Redis
REDIS_URL=redis://localhost:6379
```

### **Development vs Production**

**Development Features:**
- ✅ Hot reload enabled
- ✅ Source maps included
- ✅ Development dependencies installed
- ✅ Volume mounting for live code changes
- ✅ Debug logging enabled

**Production Features:**
- ✅ Optimized build
- ✅ Multi-stage build (smaller image)
- ✅ Nginx for static file serving
- ✅ Security headers configured
- ✅ Gzip compression enabled

## 🔄 Workflow Integration

### **Local Development Workflow**
1. **Start Docker environment**: `docker-compose up -d`
2. **Make code changes** (auto-reloads in container)
3. **Test locally** at http://localhost:5173
4. **Run tests**: `docker-compose exec frontend npm test`
5. **Commit changes** when ready

### **CI/CD Integration**
The Docker setup integrates with your existing GitHub Actions workflow:

```yaml
# Example GitHub Action step
- name: Build Docker Image
  run: docker build --target production -t ${{ env.IMAGE_NAME }}:${{ github.sha }} .

- name: Test Docker Image
  run: docker run --rm ${{ env.IMAGE_NAME }}:${{ github.sha }} npm test
```

## 🐛 Troubleshooting

### **Common Issues**

**Port Conflicts:**
```bash
# Check what's using port 5173
lsof -i :5173

# Use different ports
docker-compose -f docker-compose.yml -f docker-compose.dev.yml up -d
```

**Database Connection Issues:**
```bash
# Check database logs
docker-compose logs postgres

# Reset database
docker-compose down -v
docker-compose up postgres -d
```

**Frontend Not Loading:**
```bash
# Rebuild frontend container
docker-compose build --no-cache frontend
docker-compose up frontend
```

### **Performance Optimization**

**Faster Builds:**
```bash
# Use BuildKit for faster builds
DOCKER_BUILDKIT=1 docker-compose build

# Parallel builds
docker-compose build --parallel
```

**Volume Optimization:**
```bash
# Use named volumes for node_modules
docker-compose down
docker volume prune
docker-compose up -d
```

## 🚀 Deployment Options

### **1. Docker Compose (Simple)**
```bash
# Production deployment
docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d
```

### **2. Kubernetes (Scalable)**
```bash
# Generate Kubernetes manifests
kompose convert

# Deploy to Kubernetes
kubectl apply -f k8s/
```

### **3. Cloud Platforms**
- **AWS ECS/Fargate**: Use the production Dockerfile
- **Google Cloud Run**: Supports container deployment
- **Azure Container Instances**: Direct Docker deployment
- **DigitalOcean App Platform**: Docker-based deployment

## 📊 Monitoring & Logs

### **View Logs**
```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f frontend

# Last 100 lines
docker-compose logs --tail=100 frontend
```

### **Resource Monitoring**
```bash
# Container resource usage
docker stats

# Service-specific stats
docker-compose exec frontend top
```

## 🔐 Security Best Practices

1. **Use non-root user in containers**
2. **Scan images for vulnerabilities**: `docker scan deloitte-portal:prod`
3. **Keep base images updated**
4. **Use secrets for sensitive data**
5. **Limit container capabilities**

## ✅ Next Steps

After setting up Docker:
1. **Test the environment**: Ensure all services start correctly
2. **Run the application**: Verify frontend loads at localhost:5173
3. **Check database**: Connect via Adminer and verify schema
4. **Integration testing**: Test with your existing CI/CD pipeline
5. **Production deployment**: Use the production Dockerfile for deployment

**Your Docker environment is now ready for development! 🎉**
