# 🎯 Recruily_Page Setup Guide

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ installed
- npm or pnpm package manager
- Supabase account
- Google AI API key

### 1. Clone & Install
```bash
git clone https://github.com/RevokeAgency/Recruily_Page.git
cd Recruily_Page
npm install --legacy-peer-deps
```

### 2. Environment Setup
```bash
cp .env.example .env.local
# Edit .env.local with your configuration
```

### 3. Run Development Server
```bash
npm run dev
# Open http://localhost:3000
```

## 🔧 Detailed Configuration

### Supabase Setup

1. **Create Project**
   - Go to [supabase.com](https://supabase.com)
   - Create a new project
   - Wait for initialization

2. **Get Credentials**
   - Navigate to Settings > API
   - Copy Project URL and anon public key
   - Add to `.env.local`:
   ```bash
   NEXT_PUBLIC_SUPABASE_URL=your_project_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
   ```

3. **Database Schema**
   The app expects these tables (auto-created via migrations):
   - `organisations` - Company profiles
   - `jobs` - Job postings
   - `candidates` - Candidate profiles
   - `resumes` - Resume files
   - `matches` - Job-candidate matches

4. **Authentication Setup**
   - Enable Email/Password authentication
   - Configure email templates
   - Set up redirect URLs for your domain

### Google AI Integration

1. **Get API Key**
   - Visit [Google AI Studio](https://makersuite.google.com/app/apikey)
   - Create new API key
   - Add to `.env.local`:
   ```bash
   GOOGLE_AI_API_KEY=your_api_key
   ```

2. **Features Enabled**
   - Resume parsing and analysis
   - Job description processing
   - Candidate matching algorithms

## 🛠️ Development Workflow

### Available Scripts
```bash
# Development
npm run dev          # Start dev server
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Run ESLint

# Testing (if implemented)
npm run test         # Run tests
npm run test:watch   # Watch mode
```

### Project Structure
```
Recruily_Page/
├── app/                    # Next.js App Router
│   ├── api/               # API routes
│   ├── dashboard/         # Protected dashboard pages
│   ├── auth/              # Authentication pages
│   └── page.tsx           # Landing page
├── components/            # React components
│   ├── ui/               # Base UI components (shadcn/ui)
│   └── ...               # Feature-specific components  
├── contexts/             # React Context providers
├── hooks/                # Custom React hooks
├── lib/                  # Utilities and configurations
├── supabase/             # Database functions
└── types/                # TypeScript definitions
```

## 🎨 Customization

### Branding
1. **Colors**: Edit `tailwind.config.ts`
2. **Fonts**: Update `app/layout.tsx`
3. **Logo**: Replace files in `public/` directory
4. **Copy**: Update text in components

### Features
- **Language Support**: Managed via `contexts/language-context.tsx`
- **Theme Support**: Dark/light mode via `components/theme-provider.tsx`
- **Authentication**: Supabase Auth with custom UI

### Adding New Features
1. Create components in `components/`
2. Add API routes in `app/api/`
3. Update types in `types/`
4. Add database functions in `supabase/functions/`

## 🔍 Key Features Overview

### Landing Page
- ✅ Hero section with CTAs
- ✅ Feature showcase
- ✅ Pricing plans
- ✅ Testimonials
- ✅ Contact forms
- ✅ FAQ section

### Dashboard
- ✅ Candidate management
- ✅ Job posting management
- ✅ AI-powered matching
- ✅ Bulk actions
- ✅ Resume upload/parsing
- ✅ Analytics overview

### Authentication
- ✅ Email/password signup
- ✅ User onboarding flow
- ✅ Password reset
- ✅ Email verification
- ✅ Protected routes

### AI Features
- ✅ Resume parsing with Google AI
- ✅ Job-candidate matching
- ✅ Candidate scoring
- ✅ Job description analysis

## 🐛 Common Issues & Solutions

### Installation Issues
```bash
# If npm install fails
npm install --legacy-peer-deps

# Clear cache and retry
npm cache clean --force
rm -rf node_modules package-lock.json
npm install
```

### Build Issues
```bash
# TypeScript errors (ignored by default)
npm run build
# Builds successfully due to ignoreBuildErrors: true

# Check specific errors
npx tsc --noEmit
```

### Runtime Issues
1. **Supabase Connection**: Check URL and key in .env.local
2. **Google AI Errors**: Verify API key and quotas
3. **Authentication Issues**: Check Supabase auth configuration

### Development Tips
- Use browser dev tools for debugging
- Check Next.js dev server logs
- Monitor Supabase dashboard for API calls
- Use TypeScript strict mode for better development

## 📱 Mobile Development
- Fully responsive design with Tailwind CSS
- Touch-friendly interface
- Mobile-optimized forms and navigation
- PWA capabilities (can be added)

## 🔒 Security Considerations
- Environment variables for sensitive data
- Supabase Row Level Security (RLS) policies
- Input validation and sanitization
- CSRF protection via Next.js
- Secure authentication flows

## 📈 Performance Optimization
- Next.js automatic optimization
- Image optimization enabled
- Code splitting and lazy loading
- Tailwind CSS purging
- Bundle analysis available

---

## 🆘 Getting Help

### Documentation
- [Next.js Docs](https://nextjs.org/docs)
- [Supabase Docs](https://supabase.com/docs)
- [Tailwind CSS Docs](https://tailwindcss.com/docs)
- [shadcn/ui Components](https://ui.shadcn.com/)

### Community
- Next.js Discord
- Supabase Discord  
- GitHub Discussions

**Happy Coding! 🎉**