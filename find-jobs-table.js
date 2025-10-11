#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js');

async function findJobsTable() {
  console.log('🔍 Looking for jobs-related tables...\n');
  
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://easdyzpslrxplpogilhx.supabase.co';
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVhc2R5enBzbHJ4cGxwb2dpbGh4Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0NTU4NDEyNSwiZXhwIjoyMDYxMTYwMTI1fQ.WaSy_lb0vIxiHljwck9hJwDj55sdKns4n_2crzwLJ1Q';
  
  const supabase = createClient(supabaseUrl, serviceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });
  
  const jobTableNames = [
    'jobs',
    'job_postings', 
    'job_listings',
    'positions',
    'openings',
    'vacancies',
    'postings',
    'job_posts',
    'recruitment_jobs',
    'hiring_jobs'
  ];
  
  for (const tableName of jobTableNames) {
    try {
      const { data, error } = await supabase
        .from(tableName)
        .select('*')
        .limit(1);
        
      if (!error) {
        console.log(`✅ Found jobs table: ${tableName}`);
        if (data && data.length > 0) {
          console.log(`📊 Sample columns:`, Object.keys(data[0]));
          console.log(`📋 Sample record:`, data[0]);
        } else {
          // Try to get table structure even if empty
          const { data: emptyData, error: emptyError } = await supabase
            .from(tableName)
            .select('*')
            .limit(0);
            
          if (!emptyError) {
            console.log(`📊 Table exists but empty: ${tableName}`);
          }
        }
        return tableName;
      }
    } catch (e) {
      // Continue trying
    }
  }
  
  console.log('❌ No jobs table found with common names');
  
  // Try to get all table names through a different approach
  console.log('\n🔍 Trying to find all available tables...');
  
  const commonTables = [
    'candidates', 'organisations', 'job_candidate_matches', 'resumes',
    'profiles', 'companies', 'applications', 'interviews', 'assessments',
    'skills', 'experiences', 'educations', 'certifications'
  ];
  
  console.log('📋 Available tables:');
  for (const table of commonTables) {
    try {
      const { error } = await supabase
        .from(table)
        .select('id')
        .limit(1);
        
      if (!error) {
        console.log(`  ✅ ${table}`);
      }
    } catch (e) {
      // Table doesn't exist
    }
  }
}

if (require.main === module) {
  require('dotenv').config({ path: '.env.local' });
  findJobsTable().catch(console.error);
}
