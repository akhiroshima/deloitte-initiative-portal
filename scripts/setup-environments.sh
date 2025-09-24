#!/bin/bash

# Environment Setup Script for Deloitte Initiative Portal
# This script helps set up development and production environments

set -e

echo "🚀 Setting up Deloitte Initiative Portal Environments"
echo "=================================================="

# Function to create environment file
create_env_file() {
    local env_type=$1
    local env_file=".env.${env_type}"
    local template_file="env-${env_type}.txt"
    
    if [ -f "$env_file" ]; then
        echo "⚠️  $env_file already exists. Skipping..."
        return
    fi
    
    if [ -f "$template_file" ]; then
        cp "$template_file" "$env_file"
        echo "✅ Created $env_file from $template_file"
        echo "📝 Please update the values in $env_file with your actual credentials"
    else
        echo "❌ Template file $template_file not found"
        exit 1
    fi
}

# Function to setup Netlify configuration
setup_netlify_config() {
    local env_type=$1
    local config_file="netlify-${env_type}.toml"
    
    if [ -f "$config_file" ]; then
        echo "✅ Netlify configuration for $env_type is ready: $config_file"
    else
        echo "❌ Netlify configuration file $config_file not found"
        exit 1
    fi
}

# Main setup process
echo ""
echo "📋 Setting up environment files..."
create_env_file "production"
create_env_file "development"

echo ""
echo "📋 Checking Netlify configurations..."
setup_netlify_config "production"
setup_netlify_config "development"

echo ""
echo "🎉 Environment setup complete!"
echo ""
echo "📝 Next steps:"
echo "1. Update .env.production with your production credentials"
echo "2. Update .env.development with your development credentials"
echo "3. Create separate Supabase projects for each environment"
echo "4. Set up Netlify sites for each environment"
echo "5. Configure branch-based deployments"
echo ""
echo "📚 See DEPLOYMENT_GUIDE.md for detailed instructions"
