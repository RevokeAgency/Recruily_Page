-- Universal Job Import: add structured fields to jobs table
-- Safe to run multiple times (IF NOT EXISTS)
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS description_html TEXT;
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS hard_skills TEXT[] DEFAULT '{}';
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS soft_skills TEXT[] DEFAULT '{}';
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS salary_range TEXT;
