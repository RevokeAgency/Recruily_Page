# 🚀 Recruily_Page Deployment Guide

## 📋 Pre-Deployment Checklist

### ✅ Environment Setup
1. **Copy Environment Variables**
   ```bash
   cp .env.example .env.local
   ```

2. **Configure Supabase**
   - Create a new Supabase project at [supabase.com](https://supabase.com)
   - Get your project URL and anon key from Settings > API
   - Update `.env.local` with your Supabase credentials

3. **Setup Google AI**
   - Get API key from [Google AI Studio](https://makersuite.google.com/app/apikey)
   - Add to `.env.local` as `GOOGLE_AI_API_KEY`

### ✅ Database Setup
1. **Run Supabase Migrations** (if any)
   ```bash
   # Install Supabase CLI first
   npx supabase init
   npx supabase db reset
   ```

2. **Setup Authentication Tables**
   - Enable Email/Password auth in Supabase dashboard
   - Configure email templates for signup/login

## 🌐 Deployment Options

### Option 1: Vercel (Recommended)
This project is already configured for Vercel deployment.

1. **Connect to Vercel**
   ```bash
   npx vercel
   ```

2. **Add Environment Variables in Vercel**
   - Go to Project Settings > Environment Variables
   - Add all variables from `.env.local`

3. **Deploy**
   ```bash
   npx vercel --prod
   ```

### Option 2: Netlify
1. **Build for Static Export** (if needed)
   ```bash
   # Add to next.config.mjs if needed
   output: 'export'
   ```

2. **Build Project**
   ```bash
   npm run build
   ```

3. **Deploy to Netlify**
   - Drag and drop `.next` folder to Netlify
   - Or connect GitHub repository

### Option 3: Docker Deployment
1. **Create Dockerfile**
   ```dockerfile
   FROM node:18-alpine AS base
   
   WORKDIR /app
   COPY package*.json ./
   RUN npm ci --only=production
   
   COPY . .
   RUN npm run build
   
   EXPOSE 3000
   CMD ["npm", "start"]
   ```

2. **Build and Run**
   ```bash
   docker build -t recruily-page .
   docker run -p 3000:3000 --env-file .env.local recruily-page
   ```

## ⚙️ Production Configuration

### 1. Environment Variables
Ensure these are set in production:

```bash
# Required
NEXT_PUBLIC_SUPABASE_URL=your_production_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_production_supabase_key
GOOGLE_AI_API_KEY=your_google_ai_key

# Recommended
NEXTAUTH_URL=https://your-domain.com
NEXTAUTH_SECRET=your_production_secret
NODE_ENV=production
```

### 2. Security Settings
- [ ] Enable HTTPS
- [ ] Configure CORS in Supabase
- [ ] Set up proper authentication flows
- [ ] Enable rate limiting (if needed)

### 3. Performance Optimization
- [ ] Enable image optimization
- [ ] Configure CDN for static assets
- [ ] Setup monitoring and analytics

## 🧪 Testing Deployment

### Local Production Build
```bash
npm run build
npm run start
```

### Environment Validation
```bash
# Check if all required env vars are present
node -e "
const required = ['NEXT_PUBLIC_SUPABASE_URL', 'NEXT_PUBLIC_SUPABASE_ANON_KEY'];
const missing = required.filter(key => !process.env[key]);
if (missing.length) {
  console.error('Missing required env vars:', missing);
  process.exit(1);
}
console.log('✅ All required environment variables are set');
"
```

## 🔧 Post-Deployment Steps

### 1. Database Seeding (Optional)
If you need initial data:
```bash
# Run any seeding scripts
npm run seed
```

### 2. Domain Configuration
- Update CORS settings in Supabase for your domain
- Configure authentication redirect URLs
- Update `NEXTAUTH_URL` to your production domain

### 3. Monitoring Setup
- Setup error tracking (Sentry, LogRocket, etc.)
- Configure uptime monitoring
- Enable performance monitoring

## 🐛 Troubleshooting

### Common Issues

1. **Build Errors**
   - Ensure all environment variables are set
   - Check TypeScript errors (though they're ignored in config)
   - Verify all dependencies are installed

2. **Authentication Issues**
   - Check Supabase configuration
   - Verify redirect URLs are correct
   - Ensure middleware configuration is correct

3. **API Errors**
   - Check Google AI API key is valid
   - Verify Supabase RLS policies
   - Check CORS configuration

### Debugging Commands
```bash
# Check build output
npm run build 2>&1 | tee build.log

# Test API endpoints
curl -X GET https://your-domain.com/api/health

# Check environment variables
env | grep NEXT_PUBLIC
```

## 📊 Performance Monitoring

### Key Metrics to Monitor
- Page load times
- API response times  
- Error rates
- User authentication success rates
- File upload success rates

### Recommended Tools
- **Analytics**: Google Analytics, Vercel Analytics
- **Error Tracking**: Sentry, Bugsnag
- **Performance**: Lighthouse, WebPageTest
- **Uptime**: Pingdom, UptimeRobot

---

## 🆘 Support

For deployment issues:
1. Check this guide first
2. Review Vercel/Supabase documentation
3. Check GitHub issues for common problems
4. Contact support if needed

**Happy Deploying! 🚀**