# Netlify UI Configuration Guide

## 🚨 CRITICAL: Netlify is Ignoring Configuration Files

**Issue**: Netlify logs show:
- Line 125: "No config file was defined: using default values"
- Line 173: "command: npm run build, commandOrigin: ui"

This means Netlify is using **UI settings** that override our `netlify.toml` file.

## ✅ SOLUTION: Configure via Netlify Dashboard

### 1. Build Settings (Site Settings → Build & Deploy)

Navigate to your Netlify dashboard → Your Site → Site settings → Build & deploy

**Build command:**
```bash
npm install && npm run build
```

**Publish directory:**
```
.next
```

### 2. Environment Variables (Site Settings → Environment Variables)

Add these environment variables:

#### Required Variables:
```bash
NEXT_PUBLIC_SUPABASE_URL=https://easdyzpslrxplpogilhx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVhc2R5enBzbHJ4cGxwb2dpbGh4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDU1ODQxMjUsImV4cCI6MjA2MTE2MDEyNX0.DLXRdhm2SOAz17e4QNhPw8DrDdQaRbuQVMQ2cbiMJ1s
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVhc2R5enBzbHJ4cGxwb2dpbGh4Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0NTU4NDEyNSwiZXhwIjoyMDYxMTYwMTI1fQ.WaSy_lb0vIxiHljwck9hJwDj55sdKns4n_2crzwLJ1Q
```

#### Node.js Version:
```bash
NODE_VERSION=20.18.0
```

#### Optional Variables:
```bash
NODE_ENV=production
NETLIFY=true
CI=true
NEXT_PUBLIC_APP_URL=https://recruily-page.netlify.app
NEXTAUTH_URL=https://recruily-page.netlify.app
NEXTAUTH_SECRET=your-production-nextauth-secret-here
NEXT_PUBLIC_MAX_FILE_SIZE=10
NEXT_PUBLIC_ALLOWED_FILE_TYPES=.pdf,.doc,.docx
NEXT_PUBLIC_ENABLE_ANALYTICS=false
NEXT_PUBLIC_ENABLE_ONBOARDING=true
NEXT_PUBLIC_ENABLE_BULK_ACTIONS=true
```

### 3. Node.js Version (Build Settings)

In the Build environment variables section, ensure:
```bash
NODE_VERSION=20.18.0
```

### 4. Clear Build Cache

After updating settings:
1. Go to Site settings → Build & deploy → Environment
2. Click "Clear cache and deploy site"

## 🔧 Why This Works

### Dependency-Free Validation Script
- ✅ **Zero Dependencies**: No chalk, no dotenv, no external packages
- ✅ **ANSI Colors**: Uses native terminal colors (works everywhere)
- ✅ **Built-in .env Loading**: Reads .env.local without dotenv package
- ✅ **Node Version Agnostic**: Works with any Node.js version
- ✅ **Platform Detection**: Detects Netlify/Vercel/CI environments automatically

### Expected Build Flow After Configuration
1. ✅ Netlify uses Node.js 20.18.0 (from NODE_VERSION env var)
2. ✅ Runs `npm install` (installs all dependencies including chalk)
3. ✅ Runs prebuild: `node scripts/validate-env.js` (no external dependencies)
4. ✅ Environment validation passes (colored output without chalk dependency)
5. ✅ Next.js build completes successfully

## 🚀 Verification Steps

After configuring the UI settings:

1. **Trigger New Deploy**: Push any change or manually redeploy
2. **Check Build Logs** for these success indicators:
   - `Now using node v20.18.0` (instead of v22.19.0)
   - `🔍 Validating environment variables...` (colored output working)
   - `✅ Environment validation passed!`
   - Build completes without "Cannot find module" errors

## 📋 Troubleshooting

### If Still Using Wrong Node Version:
1. Check NODE_VERSION is set in environment variables
2. Clear build cache and redeploy
3. Verify .nvmrc and .node-version files are committed

### If Environment Variables Missing:
1. Double-check all variables are set in Netlify UI
2. Ensure no typos in variable names
3. Variables should be set for "All environments" or "Production"

### If Build Command Wrong:
1. Verify build command is `npm install && npm run build`
2. Ensure publish directory is `.next`
3. Clear any cached build settings

## ✅ Success Criteria
- ✅ Node.js 20.18.0 in use (not v22.19.0)
- ✅ No "Cannot find module 'chalk'" errors
- ✅ Colored environment validation output
- ✅ Build completes successfully
- ✅ Site deploys without errors