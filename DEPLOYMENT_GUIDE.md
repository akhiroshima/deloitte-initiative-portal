# Production Deployment Guide - Deloitte Initiative Portal

## 🚀 Overview
This guide covers deploying the Deloitte Initiative Portal to production with all security, database, and infrastructure requirements.

## 📋 Prerequisites
- Netlify account
- Supabase account (or PostgreSQL with pgvector)
- Groq API account
- Hugging Face account (for embeddings)

## 🗄️ Database Setup

### 1. Supabase Setup
1. Create a new Supabase project
2. Go to Settings → Database
3. Copy the connection string
4. Run the schema migration:
   ```sql
   -- Copy and paste the contents of server/schema.sql
   -- This will create all necessary tables and indexes
   ```

### 2. Environment Variables
Set these in Netlify Site Settings → Environment Variables:

#### Required Variables
```bash
# Database
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
DATABASE_URL=postgresql://postgres:[password]@db.[project].supabase.co:5432/postgres

# Authentication
ALLOWED_EMAIL_DOMAIN=deloitte.com
AUTH_JWT_SECRET=your-long-random-secret-key

# AI Services
GROQ_API_KEY=your-groq-api-key
EMBEDDINGS_API_URL=https://api-inference.huggingface.co/models/sentence-transformers/all-MiniLM-L6-v2
EMBEDDINGS_API_KEY=your-huggingface-token
```

#### Optional Variables
```bash
# Development
NODE_ENV=production
```

## 🔧 Netlify Configuration

### 1. Build Settings
- **Build Command**: `npm run build`
- **Publish Directory**: `dist`
- **Node Version**: `18.x`

### 2. Function Settings
- **Node Version**: `18.x`
- **Timeout**: `30 seconds` (for AI functions)

### 3. Redirects
The `netlify.toml` file is already configured with:
- API redirects to functions
- SPA fallback for client-side routing

## 🔐 Security Configuration

### 1. Domain Configuration
Update the CORS settings in `netlify/functions/_lib/security.ts`:
```typescript
'Access-Control-Allow-Origin': 'https://your-domain.com'
```

### 2. Content Security Policy
The CSP is configured in the security headers. Update if needed for your domain.

### 3. Rate Limiting
Rate limits are configured in `netlify/functions/_lib/rateLimit.ts`:
- Auth endpoints: 5 requests per 15 minutes
- API endpoints: 100 requests per 15 minutes
- Search endpoints: 10 requests per minute

## 📊 Monitoring & Logging

### 1. Netlify Analytics
- Enable Netlify Analytics in site settings
- Monitor function execution and errors

### 2. Database Monitoring
- Use Supabase dashboard for database monitoring
- Set up alerts for high usage or errors

### 3. Error Tracking
- Consider adding Sentry or similar service
- Monitor client-side errors

## 🚀 Deployment Steps

### 1. Initial Deployment
1. Connect your GitHub repository to Netlify
2. Set all environment variables
3. Deploy the site
4. Test all functionality

### 2. Database Migration
1. Run the schema migration in Supabase
2. Verify all tables are created
3. Test database connections

### 3. Post-Deployment Testing
1. Test user registration
2. Test user login
3. Test AI search functionality
4. Test all CRUD operations
5. Test error handling

## 🔄 CI/CD Pipeline

### 1. GitHub Actions (Optional)
Create `.github/workflows/deploy.yml`:
```yaml
name: Deploy to Netlify
on:
  push:
    branches: [main]
jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-node@v2
        with:
          node-version: '18'
      - run: npm ci
      - run: npm run build
      - uses: nwtgck/actions-netlify@v1.2
        with:
          publish-dir: './dist'
          production-branch: main
          github-token: ${{ secrets.GITHUB_TOKEN }}
          deploy-message: "Deploy from GitHub Actions"
```

### 2. Netlify Deploy Hooks
1. Create deploy hooks in Netlify
2. Use for automated deployments
3. Configure branch-specific deployments

## 🛡️ Security Checklist

- [ ] All environment variables are set
- [ ] Database is properly secured
- [ ] CORS is configured for production domain
- [ ] Rate limiting is enabled
- [ ] Security headers are applied
- [ ] HTTPS is enforced
- [ ] Error boundaries are in place
- [ ] Input validation is working
- [ ] Authentication is tested

## 📈 Performance Optimization

### 1. Bundle Size
- Current bundle is ~595KB (gzipped: ~165KB)
- Consider code splitting for larger applications
- Monitor bundle size over time

### 2. Database Optimization
- Monitor query performance
- Add indexes as needed
- Consider connection pooling

### 3. Caching
- Implement Redis for session storage
- Add CDN for static assets
- Cache API responses where appropriate

## 🔧 Maintenance

### 1. Regular Updates
- Keep dependencies updated
- Monitor security advisories
- Update API keys regularly

### 2. Backup Strategy
- Database backups (Supabase handles this)
- Code repository backups
- Environment variable backups

### 3. Monitoring
- Set up uptime monitoring
- Monitor error rates
- Track user engagement

## 🆘 Troubleshooting

### Common Issues
1. **Database Connection Errors**
   - Check DATABASE_URL format
   - Verify Supabase credentials
   - Check network connectivity

2. **Authentication Issues**
   - Verify JWT secret
   - Check email domain configuration
   - Test with valid credentials

3. **AI Search Not Working**
   - Check Groq API key
   - Verify embeddings API access
   - Check rate limits

4. **Build Failures**
   - Check Node.js version
   - Verify all dependencies
   - Check for TypeScript errors

### Support
- Check Netlify function logs
- Review Supabase logs
- Monitor browser console for errors

## 📞 Next Steps

1. **User Onboarding**: Create user guides and documentation
2. **Analytics**: Implement user analytics and tracking
3. **Notifications**: Set up email notifications
4. **Backup**: Implement automated backup procedures
5. **Scaling**: Plan for increased usage and load

---

**Deployment Status**: ✅ Ready for Production
**Last Updated**: $(date)
**Version**: 1.0.0
