-- Recruily Database Setup SQL
-- Run this in your Supabase SQL Editor: https://supabase.com/dashboard/project/easdyzpslrxplpogilhx/sql/new

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Enable RLS (Row Level Security) 
ALTER TABLE auth.users ENABLE ROW LEVEL SECURITY;

-- Drop existing tables if they exist (for clean setup)
DROP TABLE IF EXISTS public.matches CASCADE;
DROP TABLE IF EXISTS public.resumes CASCADE; 
DROP TABLE IF EXISTS public.candidates CASCADE;
DROP TABLE IF EXISTS public.jobs CASCADE;
DROP TABLE IF EXISTS public.organisations CASCADE;

-- Organizations table
CREATE TABLE public.organisations (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    domain TEXT,
    website TEXT,
    description TEXT,
    size TEXT,
    industry TEXT,
    logo_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    owner_id UUID REFERENCES auth.users(id) ON DELETE CASCADE
);

-- Jobs table  
CREATE TABLE public.jobs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    requirements TEXT,
    responsibilities TEXT,
    location TEXT,
    remote_ok BOOLEAN DEFAULT FALSE,
    salary_min INTEGER,
    salary_max INTEGER,
    salary_currency TEXT DEFAULT 'USD',
    employment_type TEXT DEFAULT 'full-time',
    experience_level TEXT,
    company TEXT,
    skills TEXT[] DEFAULT '{}',
    benefits TEXT[],
    status TEXT DEFAULT 'open' CHECK (status IN ('draft', 'open', 'closed', 'paused')),
    featured BOOLEAN DEFAULT FALSE,
    expires_at TIMESTAMP WITH TIME ZONE,
    organisation_id UUID REFERENCES public.organisations(id) ON DELETE CASCADE,
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Candidates table
CREATE TABLE public.candidates (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    phone TEXT,
    location TEXT,
    linkedin_url TEXT,
    portfolio_url TEXT,
    github_url TEXT,
    skills TEXT[] DEFAULT '{}',
    experience_years INTEGER,
    education TEXT,
    degree TEXT,
    university TEXT,
    graduation_year INTEGER,
    summary TEXT,
    bio TEXT,
    availability TEXT,
    salary_expectation_min INTEGER,
    salary_expectation_max INTEGER,
    visa_status TEXT,
    languages TEXT[] DEFAULT '{}',
    certifications TEXT[] DEFAULT '{}',
    profile_image_url TEXT,
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'hired', 'not_interested')),
    source TEXT,
    tags TEXT[] DEFAULT '{}',
    organisation_id UUID REFERENCES public.organisations(id) ON DELETE CASCADE,
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Resumes table
CREATE TABLE public.resumes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    candidate_id UUID REFERENCES public.candidates(id) ON DELETE CASCADE,
    file_name TEXT NOT NULL,
    file_path TEXT NOT NULL,
    file_type TEXT NOT NULL,
    file_size INTEGER,
    original_name TEXT,
    parsed_content JSONB,
    parsed_text TEXT,
    parsing_status TEXT DEFAULT 'pending' CHECK (parsing_status IN ('pending', 'processing', 'completed', 'failed')),
    parsing_error TEXT,
    version INTEGER DEFAULT 1,
    is_current BOOLEAN DEFAULT TRUE,
    uploaded_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Matches table (AI-powered job-candidate matching)
CREATE TABLE public.matches (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    job_id UUID REFERENCES public.jobs(id) ON DELETE CASCADE,
    candidate_id UUID REFERENCES public.candidates(id) ON DELETE CASCADE,
    score INTEGER NOT NULL CHECK (score >= 0 AND score <= 100),
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'reviewed', 'contacted', 'interviewing', 'rejected', 'hired')),
    match_reasons JSONB,
    strengths TEXT[] DEFAULT '{}',
    weaknesses TEXT[] DEFAULT '{}',
    skill_matches JSONB,
    experience_match INTEGER,
    location_match BOOLEAN DEFAULT FALSE,
    salary_match BOOLEAN DEFAULT FALSE,
    notes TEXT,
    recruiter_notes TEXT,
    ai_analysis JSONB,
    contacted_at TIMESTAMP WITH TIME ZONE,
    interview_scheduled_at TIMESTAMP WITH TIME ZONE,
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(job_id, candidate_id)
);

-- Communication/Messages table (for tracking candidate communications)
CREATE TABLE public.communications (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    candidate_id UUID REFERENCES public.candidates(id) ON DELETE CASCADE,
    job_id UUID REFERENCES public.jobs(id) ON DELETE CASCADE,
    type TEXT NOT NULL CHECK (type IN ('email', 'call', 'message', 'interview', 'note')),
    subject TEXT,
    content TEXT,
    direction TEXT CHECK (direction IN ('inbound', 'outbound')),
    status TEXT DEFAULT 'sent' CHECK (status IN ('draft', 'sent', 'delivered', 'read', 'replied')),
    sent_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    sent_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    read_at TIMESTAMP WITH TIME ZONE,
    replied_at TIMESTAMP WITH TIME ZONE,
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User profiles (extend auth.users with additional info)
CREATE TABLE public.user_profiles (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    first_name TEXT,
    last_name TEXT,
    avatar_url TEXT,
    phone TEXT,
    title TEXT,
    department TEXT,
    organisation_id UUID REFERENCES public.organisations(id) ON DELETE CASCADE,
    role TEXT DEFAULT 'recruiter' CHECK (role IN ('admin', 'manager', 'recruiter', 'viewer')),
    permissions JSONB DEFAULT '{}',
    preferences JSONB DEFAULT '{}',
    is_active BOOLEAN DEFAULT TRUE,
    last_login TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX idx_jobs_organisation_id ON public.jobs(organisation_id);
CREATE INDEX idx_jobs_status ON public.jobs(status);
CREATE INDEX idx_jobs_created_at ON public.jobs(created_at);
CREATE INDEX idx_candidates_organisation_id ON public.candidates(organisation_id);
CREATE INDEX idx_candidates_email ON public.candidates(email);
CREATE INDEX idx_candidates_skills ON public.candidates USING gin(skills);
CREATE INDEX idx_matches_job_id ON public.matches(job_id);
CREATE INDEX idx_matches_candidate_id ON public.matches(candidate_id);
CREATE INDEX idx_matches_score ON public.matches(score);
CREATE INDEX idx_resumes_candidate_id ON public.resumes(candidate_id);
CREATE INDEX idx_communications_candidate_id ON public.communications(candidate_id);
CREATE INDEX idx_communications_job_id ON public.communications(job_id);

-- Enable Row Level Security (RLS) on all tables
ALTER TABLE public.organisations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.candidates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.resumes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.communications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

-- RLS Policies: Users can only access data from their organization

-- Organisations: Users can only see/modify their own organisation
CREATE POLICY "Users can manage own organisation" ON public.organisations
    FOR ALL USING (
        owner_id = auth.uid() OR 
        id IN (SELECT organisation_id FROM public.user_profiles WHERE id = auth.uid())
    );

-- User profiles: Users can see profiles in their organization
CREATE POLICY "Users can view organisation user profiles" ON public.user_profiles
    FOR ALL USING (
        id = auth.uid() OR 
        organisation_id IN (
            SELECT organisation_id FROM public.user_profiles WHERE id = auth.uid()
        )
    );

-- Jobs: Users can manage jobs in their organisation
CREATE POLICY "Users can manage organisation jobs" ON public.jobs
    FOR ALL USING (
        organisation_id IN (
            SELECT organisation_id FROM public.user_profiles WHERE id = auth.uid()
            UNION
            SELECT id FROM public.organisations WHERE owner_id = auth.uid()
        )
    );

-- Candidates: Users can manage candidates in their organisation  
CREATE POLICY "Users can manage organisation candidates" ON public.candidates
    FOR ALL USING (
        organisation_id IN (
            SELECT organisation_id FROM public.user_profiles WHERE id = auth.uid()
            UNION  
            SELECT id FROM public.organisations WHERE owner_id = auth.uid()
        )
    );

-- Resumes: Users can access resumes of candidates in their organisation
CREATE POLICY "Users can manage candidate resumes" ON public.resumes
    FOR ALL USING (
        candidate_id IN (
            SELECT id FROM public.candidates WHERE organisation_id IN (
                SELECT organisation_id FROM public.user_profiles WHERE id = auth.uid()
                UNION
                SELECT id FROM public.organisations WHERE owner_id = auth.uid()
            )
        )
    );

-- Matches: Users can manage matches for their organisation's jobs
CREATE POLICY "Users can manage organisation matches" ON public.matches
    FOR ALL USING (
        job_id IN (
            SELECT id FROM public.jobs WHERE organisation_id IN (
                SELECT organisation_id FROM public.user_profiles WHERE id = auth.uid()
                UNION
                SELECT id FROM public.organisations WHERE owner_id = auth.uid()
            )
        )
    );

-- Communications: Users can manage communications for their organisation
CREATE POLICY "Users can manage organisation communications" ON public.communications  
    FOR ALL USING (
        candidate_id IN (
            SELECT id FROM public.candidates WHERE organisation_id IN (
                SELECT organisation_id FROM public.user_profiles WHERE id = auth.uid()
                UNION
                SELECT id FROM public.organisations WHERE owner_id = auth.uid()
            )
        )
    );

-- Functions for automated tasks

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers to automatically update updated_at
CREATE TRIGGER update_organisations_updated_at BEFORE UPDATE ON public.organisations
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_jobs_updated_at BEFORE UPDATE ON public.jobs
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_candidates_updated_at BEFORE UPDATE ON public.candidates  
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_matches_updated_at BEFORE UPDATE ON public.matches
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_profiles_updated_at BEFORE UPDATE ON public.user_profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to create user profile automatically on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.user_profiles (id, first_name, last_name)
    VALUES (
        NEW.id,
        NEW.raw_user_meta_data->>'first_name',
        NEW.raw_user_meta_data->>'last_name'
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create profile on user signup
CREATE OR REPLACE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Insert some sample data for testing (optional)
INSERT INTO public.organisations (name, domain, description, owner_id) VALUES
('Demo Company', 'demo.com', 'A sample company for testing purposes', '00000000-0000-0000-0000-000000000000')
ON CONFLICT DO NOTHING;

-- Success message
SELECT 'Database setup completed successfully! 🎉' AS message;