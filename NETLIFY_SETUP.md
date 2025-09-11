# Netlify Environment Variables Setup

## Quick Setup (Recommended)

1. **Import Environment Variables**
   - Go to your Netlify Dashboard → Site settings → Environment variables
   - Click "Import from .env file"
   - Upload the `netlify-environment.json` file from this repository
   - Click "Import variables"

## Manual Setup (Alternative)

If you prefer to add variables manually, add these environment variables in your Netlify Dashboard:

### Required Supabase Configuration
```
NEXT_PUBLIC_SUPABASE_URL=https://easdyzpslrxplpogilhx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVhc2R5enBzbHJ4cGxwb2dpbGh4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDU1ODQxMjUsImV4cCI6MjA2MTE2MDEyNX0.DLXRdhm2SOAz17e4QNhPw8DrDdQaRbuQVMQ2cbiMJ1s
```

### Optional Configuration
```
NODE_ENV=production
NEXT_PUBLIC_APP_URL=https://your-site-name.netlify.app
NEXTAUTH_URL=https://your-site-name.netlify.app
NEXTAUTH_SECRET=your-production-secret-here
NEXT_PUBLIC_MAX_FILE_SIZE=10
NEXT_PUBLIC_ALLOWED_FILE_TYPES=.pdf,.doc,.docx
NEXT_PUBLIC_ENABLE_ANALYTICS=false
NEXT_PUBLIC_ENABLE_ONBOARDING=true
NEXT_PUBLIC_ENABLE_BULK_ACTIONS=true
```

## Security Notes

- ✅ Only `NEXT_PUBLIC_*` variables are exposed to the frontend
- ✅ The `NEXT_PUBLIC_SUPABASE_ANON_KEY` is safe to expose (it's the anonymous/public key)
- ❌ Never add `SUPABASE_SERVICE_ROLE_KEY` to Netlify environment variables
- ❌ Service role keys should only be used in secure server environments

## Verification

After deployment, verify that:
1. No "supabaseUrl is required" errors appear in build logs
2. Supabase connection works in the deployed application
3. Authentication flow functions correctly
4. Database operations work as expected

## Troubleshooting

If you still encounter issues:
1. Clear Netlify build cache and redeploy
2. Check that all environment variables are correctly set
3. Verify the Supabase project is active and accessible
4. Check browser console for any remaining configuration errors