# 🔑 Supabase Backend Setup Guide

## Your Supabase Project Details

**Project Reference**: `easdyzpslrxplpogilhx`  
**Project URL**: `https://easdyzpslrxplpogilhx.supabase.co`  
**Dashboard URL**: `https://supabase.com/dashboard/project/easdyzpslrxplpogilhx`

---

## 🚀 Quick Setup Steps

### 1. Get Your API Keys

Visit your Supabase dashboard: **https://supabase.com/dashboard/project/easdyzpslrxplpogilhx/settings/api**

Copy these values:
- **Project URL**: `https://easdyzpslrxplpogilhx.supabase.co` ✅ (already configured)
- **Anon (public) key**: `eyJ...` (copy the long key starting with eyJ)  
- **Service role key**: `eyJ...` (copy the service role key)

### 2. Update Environment Variables

Edit the `.env.local` file and replace these placeholders:

```bash
# Replace this line:
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
# With your actual anon key:
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Replace this line:  
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
# With your actual service role key:
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### 3. Set Up Authentication

In your Supabase dashboard:

1. **Go to Authentication**: https://supabase.com/dashboard/project/easdyzpslrxplpogilhx/auth/users
2. **Enable Email/Password**: Go to Authentication > Settings > Auth Providers
3. **Configure Site URL**: Set to `http://localhost:3000` (for development)
4. **Add Redirect URLs**: 
   - `http://localhost:3000/auth/callback`
   - `http://localhost:3000/dashboard`

### 4. Create Database Schema

Run this SQL in your Supabase SQL Editor: https://supabase.com/dashboard/project/easdyzpslrxplpogilhx/sql/new

```sql
-- Enable RLS (Row Level Security)
ALTER TABLE auth.users ENABLE ROW LEVEL SECURITY;

-- Organizations table
CREATE TABLE IF NOT EXISTS public.organisations (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    domain TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    owner_id UUID REFERENCES auth.users(id)
);

-- Jobs table  
CREATE TABLE IF NOT EXISTS public.jobs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    requirements TEXT,
    location TEXT,
    salary_range TEXT,
    company TEXT,
    skills TEXT[],
    status TEXT DEFAULT 'open',
    organisation_id UUID REFERENCES public.organisations(id),
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Candidates table
CREATE TABLE IF NOT EXISTS public.candidates (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    phone TEXT,
    location TEXT,
    skills TEXT[],
    experience_years INTEGER,
    education TEXT,
    summary TEXT,
    organisation_id UUID REFERENCES public.organisations(id),
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Resumes table
CREATE TABLE IF NOT EXISTS public.resumes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    candidate_id UUID REFERENCES public.candidates(id),
    file_name TEXT NOT NULL,
    file_path TEXT NOT NULL,
    file_type TEXT NOT NULL,
    parsed_content JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Matches table
CREATE TABLE IF NOT EXISTS public.matches (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    job_id UUID REFERENCES public.jobs(id),
    candidate_id UUID REFERENCES public.candidates(id),
    score INTEGER NOT NULL CHECK (score >= 0 AND score <= 100),
    status TEXT DEFAULT 'pending',
    strengths TEXT[],
    weaknesses TEXT[],
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(job_id, candidate_id)
);

-- Enable Row Level Security policies
ALTER TABLE public.organisations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.jobs ENABLE ROW LEVEL SECURITY;  
ALTER TABLE public.candidates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.resumes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.matches ENABLE ROW LEVEL SECURITY;

-- RLS Policies (users can only see their organization's data)
CREATE POLICY "Users can view own organisation" ON public.organisations
    FOR ALL USING (auth.uid() = owner_id);

CREATE POLICY "Users can view organisation jobs" ON public.jobs
    FOR ALL USING (
        organisation_id IN (
            SELECT id FROM public.organisations WHERE owner_id = auth.uid()
        )
    );

CREATE POLICY "Users can view organisation candidates" ON public.candidates  
    FOR ALL USING (
        organisation_id IN (
            SELECT id FROM public.organisations WHERE owner_id = auth.uid()
        )
    );

CREATE POLICY "Users can view candidate resumes" ON public.resumes
    FOR ALL USING (
        candidate_id IN (
            SELECT id FROM public.candidates WHERE organisation_id IN (
                SELECT id FROM public.organisations WHERE owner_id = auth.uid()
            )
        )
    );

CREATE POLICY "Users can view organisation matches" ON public.matches
    FOR ALL USING (
        job_id IN (
            SELECT id FROM public.jobs WHERE organisation_id IN (
                SELECT id FROM public.organisations WHERE owner_id = auth.uid()
            )
        )
    );
```

### 5. Set Up Storage (for resume uploads)

1. **Go to Storage**: https://supabase.com/dashboard/project/easdyzpslrxplpogilhx/storage/buckets
2. **Create Bucket**: Name it `resumes`
3. **Set Policies**: Make it accessible to authenticated users
4. **Configure CORS**: Allow file uploads from your domain

### 6. Test the Setup

1. Restart your development server
2. Go to the signup page and create a new account  
3. Check if you receive the confirmation email
4. Try logging in after email confirmation
5. Test creating jobs and uploading resumes

---

## 🔧 Alternative: One-Click Setup Script

If you want me to help set this up automatically, I can create a setup script. Just provide:

1. **Your Supabase Anon Key** (from the dashboard)
2. **Your Supabase Service Role Key** (from the dashboard)  
3. **Google AI API Key** (optional, for AI features)

---

## 📞 **Need Help?**

1. **Can't find API keys?** Check: https://supabase.com/dashboard/project/easdyzpslrxplpogilhx/settings/api
2. **Database issues?** Use the SQL Editor: https://supabase.com/dashboard/project/easdyzpslrxplpogilhx/sql/new
3. **Auth problems?** Check: https://supabase.com/dashboard/project/easdyzpslrxplpogilhx/auth/users

Let me know when you have the API keys and I'll complete the setup! 🚀