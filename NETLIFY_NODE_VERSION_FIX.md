# Netlify Node.js Version Fix Guide

## Problem Resolved
- **Issue**: Build failing with "Node.js v22.19.0" - invalid/unsupported version
- **Root Cause**: Netlify was attempting to use a non-existent Node.js version

## Solution Implemented

### 1. Configuration Files Updated

**`.nvmrc`** - Node Version Manager
```
20
```

**`netlify.toml`** - Netlify Configuration
```toml
[build]
  command = "npm run build"
  publish = ".next"

[build.environment]
  NODE_VERSION = "20"

[[plugins]]
  package = "@netlify/plugin-nextjs"
```

**`package.json`** - Engine Constraints
```json
{
  "engines": {
    "node": "20.x",
    "npm": ">=9.0.0"
  }
}
```

### 2. Environment Variables
Add these to your Netlify dashboard (Site settings → Environment variables):

```
NODE_VERSION = 20
NEXT_PUBLIC_SUPABASE_URL = https://easdyzpslrxplpogilhx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY = [your-key]
SUPABASE_SERVICE_ROLE_KEY = [your-service-key]
NODE_ENV = production
```

### 3. Deployment Steps
1. Push the committed changes to your repository
2. Verify environment variables in Netlify dashboard
3. Trigger a new deployment
4. Monitor build logs to confirm Node.js 20.x is being used

## Expected Result
✅ Build will use Node.js 20.x (stable, supported version)
✅ No more "v22.19.0 invalid version" errors
✅ Successful deployment with Next.js 14.2.32 compatibility

## Verification
After deployment, check the build logs should show:
```
Using Node.js version 20.x.x
```

## Troubleshooting
If build still fails:
1. Clear Netlify build cache (Deploy settings → Clear cache)
2. Verify all environment variables are set
3. Check that `@netlify/plugin-nextjs` is properly loaded