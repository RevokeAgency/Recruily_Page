# 🚀 Recruily - AI-Powered Recruitment Platform

*Modern recruitment made simple with AI-driven candidate matching*

[![Deployed on Vercel](https://img.shields.io/badge/Deployed%20on-Vercel-black?style=for-the-badge&logo=vercel)](https://vercel.com/rolandkrottmaier-gmailcoms-projects/v0-recruitify-landing-page)
[![Built with v0](https://img.shields.io/badge/Built%20with-v0.app-black?style=for-the-badge)](https://v0.app/chat/projects/7tTZXBvJlht)
[![Next.js](https://img.shields.io/badge/Next.js-14.2+-black?style=for-the-badge&logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-3178C6?style=for-the-badge&logo=typescript)](https://typescriptlang.org/)
[![Supabase](https://img.shields.io/badge/Supabase-Backend-3ECF8E?style=for-the-badge&logo=supabase)](https://supabase.com/)

## 🌟 Overview

Recruily is a comprehensive recruitment platform that leverages artificial intelligence to streamline the hiring process. Built with modern web technologies, it offers both a compelling landing page and a full-featured dashboard for managing candidates, jobs, and recruitment workflows.

### ✨ Key Features

- 🤖 **AI-Powered Matching** - Google AI integration for intelligent candidate-job matching
- 📄 **Resume Parsing** - Automatic extraction and analysis of candidate information
- 🎯 **Smart Scoring** - AI-driven candidate evaluation and ranking
- 📊 **Analytics Dashboard** - Comprehensive recruitment metrics and insights
- 🔐 **Secure Authentication** - Supabase-powered user management
- 🌐 **Multi-language Support** - Internationalization ready
- 📱 **Responsive Design** - Fully mobile-optimized interface
- 🎨 **Modern UI/UX** - Built with Tailwind CSS and shadcn/ui components

## 🛠️ Technology Stack

### Frontend
- **Framework**: Next.js 14+ (App Router)
- **Language**: TypeScript 5.0+
- **Styling**: Tailwind CSS
- **Components**: Radix UI + shadcn/ui
- **Animations**: Framer Motion
- **Icons**: Lucide React

### Backend & Database
- **Backend**: Supabase (PostgreSQL + Auth + Storage)
- **AI Integration**: Google Generative AI
- **Authentication**: Supabase Auth
- **File Upload**: Supabase Storage

### Development Tools
- **Build Tool**: Next.js built-in
- **Type Checking**: TypeScript
- **Linting**: ESLint
- **Package Manager**: npm/pnpm
- **Version Control**: Git

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- npm or pnpm
- Supabase account
- Google AI API key

### 1. Installation
```bash
# Clone the repository
git clone https://github.com/RevokeAgency/Recruily_Page.git
cd Recruily_Page

# Install dependencies
npm install --legacy-peer-deps
```

### 2. Environment Setup
```bash
# Copy environment template
cp .env.example .env.local

# Edit with your configuration
# See SETUP.md for detailed instructions
```

### 3. Development
```bash
# Start development server
npm run dev

# Open http://localhost:3000
```

### 4. Production Build
```bash
# Build for production
npm run build

# Start production server
npm run start
```

## 📚 Documentation

- **[Setup Guide](./SETUP.md)** - Detailed configuration and development setup
- **[Deployment Guide](./DEPLOYMENT.md)** - Production deployment instructions
- **[v0.app Integration](https://v0.app/chat/projects/7tTZXBvJlht)** - Continue building with v0.app

## 🏗️ Project Structure

```
Recruily_Page/
├── app/                    # Next.js App Router
│   ├── api/               # API routes & server actions
│   ├── dashboard/         # Protected dashboard pages
│   ├── auth/              # Authentication flows
│   └── page.tsx           # Landing page
├── components/            # React components (65+ files)
│   ├── ui/               # Base UI components
│   ├── navbar.tsx        # Navigation
│   ├── features.tsx      # Feature showcase
│   └── ...               # Feature-specific components
├── contexts/             # React Context providers
├── hooks/                # Custom React hooks
├── lib/                  # Utilities and configurations
├── supabase/             # Database functions & migrations
├── types/                # TypeScript type definitions
└── public/               # Static assets
```

## 🎯 Features Overview

### 🌐 Landing Page
- Hero section with compelling messaging
- Interactive feature demonstrations
- Pricing plans with detailed comparisons
- Customer testimonials and social proof
- FAQ section and contact forms
- Mobile-responsive design

### 📊 Dashboard
- **Candidate Management**: Upload, parse, and organize candidate profiles
- **Job Management**: Create and manage job postings with AI assistance
- **AI Matching**: Intelligent candidate-job matching with scoring
- **Analytics**: Recruitment metrics and performance insights
- **Bulk Actions**: Mass operations for efficiency
- **User Management**: Team collaboration and permissions

### 🤖 AI Integration
- **Resume Analysis**: Extract skills, experience, and qualifications
- **Job Analysis**: Parse job requirements and generate match criteria
- **Candidate Scoring**: AI-powered evaluation and ranking
- **Smart Recommendations**: Suggest optimal matches

## 🔧 Configuration

### Environment Variables
```bash
# Required
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_key
GOOGLE_AI_API_KEY=your_google_ai_key

# Optional
NEXTAUTH_SECRET=your_secret
NEXT_PUBLIC_APP_URL=your_domain
```

### Supabase Setup
1. Create new Supabase project
2. Run database migrations
3. Configure authentication settings
4. Set up Row Level Security (RLS) policies

See [SETUP.md](./SETUP.md) for detailed configuration instructions.

## 🚀 Deployment

### Vercel (Recommended)
```bash
npx vercel
```

### Other Platforms
- **Netlify**: Static export support
- **Docker**: Containerized deployment
- **Self-hosted**: Traditional server deployment

See [DEPLOYMENT.md](./DEPLOYMENT.md) for platform-specific instructions.

## 🤝 Development Workflow

### v0.app Integration
This project is automatically synced with [v0.app](https://v0.app):
1. Make changes in v0.app interface
2. Deploy from v0.app
3. Changes auto-sync to this repository
4. Vercel auto-deploys from repository

### Manual Development
1. Fork/clone this repository
2. Make your changes locally
3. Test thoroughly
4. Deploy to your preferred platform

## 🔒 Security

- Environment-based configuration
- Supabase Row Level Security
- Input validation and sanitization
- Secure authentication flows
- CSRF protection
- XSS prevention

## 📈 Performance

- Next.js automatic optimizations
- Image optimization and lazy loading
- Code splitting and tree shaking
- Tailwind CSS purging
- Bundle size monitoring

## 🧪 Testing

```bash
# Run type checking
npx tsc --noEmit

# Run linting
npm run lint

# Build test
npm run build
```

## 📄 License

This project is licensed under the [MIT License](./LICENSE).

## 🆘 Support

### Getting Help
- **Documentation**: Check [SETUP.md](./SETUP.md) and [DEPLOYMENT.md](./DEPLOYMENT.md)
- **Issues**: Open a GitHub issue
- **v0.app**: Continue building at [v0.app project](https://v0.app/chat/projects/7tTZXBvJlht)

### Contributing
1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

---

**Built with ❤️ using v0.app, Next.js, and modern web technologies**

*Ready to revolutionize your recruitment process? Get started today!* 🚀
