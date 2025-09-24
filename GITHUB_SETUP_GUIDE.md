# GitHub Setup Guide for Environment Separation

## 🎯 Overview

You now have:
- ✅ **Production Site**: `deloitte-initiative-portal` (Site ID: `73af53ba-99a1-4bba-b5bb-9e632d32b2fa`)
- ✅ **Development Site**: `deloitte-portal-dev` (Site ID: `c7824a08-e728-4a25-9c27-78993b5c9c0e`)
- ✅ **Environment Variables**: Configured for both sites
- ✅ **CI/CD Workflow**: Created in `.github/workflows/deploy.yml`

## 🚀 Required GitHub Setup Steps

### Step 1: Get Netlify Personal Access Token

1. Go to [Netlify User Settings](https://app.netlify.com/user/applications#personal-access-tokens)
2. Click **"New access token"**
3. Name: `GitHub Actions Deploy`
4. Copy the generated token

### Step 2: Add GitHub Repository Secrets

Go to your repository: https://github.com/akhiroshima/deloitte-initiative-portal/settings/secrets/actions

Add these secrets:

```
NETLIFY_AUTH_TOKEN=<your_netlify_personal_access_token>
NETLIFY_PROD_SITE_ID=73af53ba-99a1-4bba-b5bb-9e632d32b2fa
NETLIFY_DEV_SITE_ID=c7824a08-e728-4a25-9c27-78993b5c9c0e
```

### Step 3: Set Up Branch Protection Rules

1. Go to https://github.com/akhiroshima/deloitte-initiative-portal/settings/branches
2. Click **"Add rule"**
3. Configure for `main` branch:
   - ✅ **Require pull request reviews before merging**
   - ✅ **Require status checks to pass before merging**
   - ✅ **Require branches to be up to date before merging**
   - ✅ **Include administrators**

### Step 4: Connect Development Site to GitHub (Optional)

For automatic deploys on every push to `develop`:

1. Go to https://app.netlify.com/sites/deloitte-portal-dev/settings/deploys
2. Click **"Link to Git repository"**
3. Choose **GitHub** → **akhiroshima/deloitte-initiative-portal**
4. Set **Branch**: `develop`
5. Set **Build command**: `npm run build`
6. Set **Publish directory**: `dist`

## 🔄 Workflow Summary

### Development Process:
1. **Work on `develop` branch** → Auto-deploys to `deloitte-portal-dev.netlify.app`
2. **Create PR to `main`** → Creates deploy preview
3. **Merge to `main`** → Auto-deploys to `deloitte-initiative-portal.netlify.app`

### Site URLs:
- **Production**: https://deloitte-initiative-portal.netlify.app
- **Development**: https://deloitte-portal-dev.netlify.app

## ✅ Verification Steps

After completing the setup:

1. **Push to develop branch**:
   ```bash
   git checkout develop
   git push origin develop
   ```

2. **Check development deployment** at https://deloitte-portal-dev.netlify.app

3. **Create test PR to main** and verify preview deployment

4. **Merge to main** and verify production deployment

## 🚨 Important Notes

- Both sites use the **same Supabase database** (development approach)
- Environment variables are identical between sites
- All API keys and secrets are properly configured
- CI/CD workflow handles automatic deployments

## 🛠️ Troubleshooting

If deployments fail:
1. Check GitHub Actions logs
2. Verify Netlify site IDs in secrets
3. Ensure Netlify auth token has proper permissions
4. Check build logs in Netlify dashboard
