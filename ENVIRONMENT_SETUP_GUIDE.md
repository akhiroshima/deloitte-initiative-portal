# Environment Setup Guide - Deloitte Initiative Portal

## 🎯 Overview

This guide covers setting up separate development and production environments using **separate Supabase projects** and **Git branch strategy** with complete data isolation.

## 🏗️ Architecture

```
┌─────────────────┐    ┌─────────────────┐
│   Development   │    │   Production    │
│                 │    │                 │
│ Git: develop    │    │ Git: main       │
│ DB: dev project │    │ DB: prod project│
│ Site: dev-*     │    │ Site: prod-*    │
└─────────────────┘    └─────────────────┘
```

## 📋 Prerequisites

- Netlify account
- Supabase account
- GitHub repository access
- Required API keys (Groq, Hugging Face, Resend)

## 🚀 Step-by-Step Setup

### 1. Repository Setup ✅

The repository is already configured with:
- ✅ `main` branch (production)
- ✅ `develop` branch (development)
- ✅ Environment configuration files
- ✅ Netlify configuration files
- ✅ GitHub Actions workflows

### 2. Supabase Projects Setup

**🎯 Create Two Separate Supabase Projects**

#### Production Database
1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Create new project: `deloitte-portal-prod`
3. Choose same region as current project
4. Copy the project URL and anon key
5. Run the schema migration (copy from `server/schema.sql`)

#### Development Database
1. Create another new project: `deloitte-portal-dev`
2. Choose same region as production
3. Copy the project URL and anon key
4. Run the same schema migration
5. **Important**: This will have completely separate data

### 3. Netlify Sites Setup

#### Production Site
1. Go to [Netlify Dashboard](https://app.netlify.com)
2. Click "New site from Git"
3. Connect to your GitHub repository
4. Configure:
   - **Branch to deploy**: `main`
   - **Build command**: `npm run build`
   - **Publish directory**: `dist`
   - **Configuration file**: `netlify-production.toml`

#### Development Site
1. Create another site from the same repository
2. Configure:
   - **Branch to deploy**: `develop`
   - **Build command**: `npm run build`
   - **Publish directory**: `dist`
   - **Configuration file**: `netlify-development.toml`

### 4. Environment Variables Configuration

#### Production Site Environment Variables
Set these in Netlify Site Settings → Environment Variables:

```bash
# Database (Production)
SUPABASE_URL=https://your-prod-project.supabase.co
SUPABASE_ANON_KEY=your_prod_anon_key
VITE_SUPABASE_URL=https://your-prod-project.supabase.co
VITE_SUPABASE_ANON_KEY=your_prod_anon_key

# Authentication
ALLOWED_EMAIL_DOMAIN=deloitte.com
AUTH_JWT_SECRET=your_production_jwt_secret

# AI Services
GROQ_API_KEY=your_production_groq_key
EMBEDDINGS_API_URL=https://api-inference.huggingface.co/models/sentence-transformers/all-MiniLM-L6-v2
EMBEDDINGS_API_KEY=your_production_hf_token

# Email Service
RESEND_API_KEY=your_production_resend_key

# Environment
NODE_ENV=production
VITE_ENVIRONMENT=production
```

#### Development Site Environment Variables
Set these in Netlify Site Settings → Environment Variables:

```bash
# Database (Development)
SUPABASE_URL=https://your-dev-project.supabase.co
SUPABASE_ANON_KEY=your_dev_anon_key
VITE_SUPABASE_URL=https://your-dev-project.supabase.co
VITE_SUPABASE_ANON_KEY=your_dev_anon_key

# Authentication
ALLOWED_EMAIL_DOMAIN=deloitte.com
AUTH_JWT_SECRET=your_development_jwt_secret

# AI Services
GROQ_API_KEY=your_development_groq_key
EMBEDDINGS_API_URL=https://api-inference.huggingface.co/models/sentence-transformers/all-MiniLM-L6-v2
EMBEDDINGS_API_KEY=your_development_hf_token

# Email Service
RESEND_API_KEY=your_development_resend_key

# Environment
NODE_ENV=development
VITE_ENVIRONMENT=development
```

### 5. Branch Protection Rules

#### GitHub Repository Settings
1. Go to Settings → Branches
2. Add rule for `main` branch:
   - ✅ Require pull request reviews
   - ✅ Require status checks to pass
   - ✅ Require branches to be up to date
   - ✅ Restrict pushes to `main`

3. Add rule for `develop` branch:
   - ✅ Require pull request reviews
   - ✅ Allow force pushes (for development)

## 🔄 Development Workflow

### Daily Development Process
1. **Start work on develop branch**:
   ```bash
   git checkout develop
   git pull origin develop
   ```

2. **Create feature branch**:
   ```bash
   git checkout -b feature/your-feature-name
   ```

3. **Make changes and test locally**:
   ```bash
   npm run dev
   ```

4. **Commit and push to feature branch**:
   ```bash
   git add .
   git commit -m "Add your feature"
   git push origin feature/your-feature-name
   ```

5. **Create Pull Request to develop**:
   - Test on development site
   - Get code review
   - Merge to develop

6. **Deploy to development site**:
   - Automatic deployment when merged to develop

### Production Deployment Process
1. **Create Pull Request from develop to main**:
   - All features tested on development site
   - Code review completed
   - All tests passing

2. **Merge to main**:
   - Automatic deployment to production site
   - Production data remains safe

3. **Monitor production**:
   - Check deployment logs
   - Verify functionality
   - Monitor error rates

## 🛡️ Data Safety

### Complete Data Isolation
- ✅ **Separate Supabase projects** for each environment
- ✅ **Different database URLs** in environment variables
- ✅ **No shared data** between environments
- ✅ **Independent user accounts** and data

### Rollback Strategy
- ✅ **Git-based rollback**: Revert commits if needed
- ✅ **Netlify rollback**: Deploy previous version
- ✅ **Database backup**: Supabase automatic backups

## 📊 Monitoring

### Development Environment
- Monitor development site for errors
- Check function logs in Netlify
- Test new features thoroughly

### Production Environment
- Monitor production site performance
- Set up alerts for errors
- Regular health checks

## 🔧 Troubleshooting

### Common Issues

#### Environment Variables Not Loading
- Check Netlify site settings
- Verify variable names match exactly
- Restart deployment

#### Database Connection Issues
- Verify Supabase project URLs
- Check API keys are correct
- Ensure database is accessible

#### Build Failures
- Check build logs in Netlify
- Verify all dependencies are installed
- Check for TypeScript errors

### Getting Help
1. Check Netlify function logs
2. Check Supabase dashboard
3. Review GitHub Actions (if configured)
4. Check browser console for errors

## 📚 Additional Resources

- [Netlify Documentation](https://docs.netlify.com/)
- [Supabase Documentation](https://supabase.com/docs)
- [Git Branching Strategies](https://www.atlassian.com/git/tutorials/comparing-workflows)

## ✅ Checklist

### Initial Setup
- [ ] Create Supabase production project
- [ ] Create Supabase development project
- [ ] Set up Netlify production site
- [ ] Set up Netlify development site
- [ ] Configure environment variables
- [ ] Test both environments

### Ongoing Maintenance
- [ ] Regular database backups
- [ ] Monitor both environments
- [ ] Keep dependencies updated
- [ ] Review and update documentation

---

**🎉 You now have a complete development and production environment setup with full data isolation!**
