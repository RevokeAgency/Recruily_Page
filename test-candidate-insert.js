#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js');
const { v4: uuidv4 } = require('uuid');

async function testCandidateInsert() {
  console.log('🧪 Testing candidate insertion with proper foreign keys...\n');
  
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://easdyzpslrxplpogilhx.supabase.co';
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVhc2R5enBzbHJ4cGxwb2dpbGh4Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0NTU4NDEyNSwiZXhwIjoyMDYxMTYwMTI1fQ.WaSy_lb0vIxiHljwck9hJwDj55sdKns4n_2crzwLJ1Q';
  
  const supabase = createClient(supabaseUrl, serviceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });
  
  try {
    // Use existing organisation ID
    const existingOrgId = '11111111-1111-1111-1111-111111111111'; // TechRecruit
    
    // Test different approaches for created_by field
    const testCandidates = [
      {
        id: uuidv4(),
        first_name: 'John',
        last_name: 'Test',
        email: 'john.test1@example.com',
        phone: '+1234567891',
        location: 'New York, NY',
        status: 'active',
        notes: '{"skills": ["JavaScript", "React"]}',
        organisation_id: existingOrgId,
        created_by: existingOrgId, // Try using org ID
      },
      {
        id: uuidv4(),
        first_name: 'Jane',
        last_name: 'Test',
        email: 'jane.test2@example.com',
        phone: '+1234567892',
        location: 'San Francisco, CA',
        status: 'active',
        notes: '{"skills": ["Python", "Django"]}',
        organisation_id: existingOrgId,
        created_by: null, // Try null
      }
    ];
    
    for (let i = 0; i < testCandidates.length; i++) {
      const candidate = testCandidates[i];
      
      console.log(`📝 Test ${i + 1}: Inserting candidate with created_by = ${candidate.created_by || 'null'}...`);
      
      const { data: insertResult, error: insertError } = await supabase
        .from('candidates')
        .insert([candidate])
        .select()
        .single();
        
      if (insertError) {
        console.log(`❌ Insert failed:`, insertError);
      } else {
        console.log(`✅ Insert successful:`, insertResult);
        
        // Clean up
        await supabase
          .from('candidates')
          .delete()
          .eq('id', candidate.id);
          
        console.log('🧹 Cleaned up test data');
        break; // Stop on first success
      }
    }
    
    // Also test job_candidate_matches insertion
    console.log('\n📝 Testing job_candidate_matches insertion...');
    
    // First check if there are any jobs
    const { data: jobs, error: jobsError } = await supabase
      .from('jobs')
      .select('id')
      .limit(1);
      
    if (jobsError) {
      console.log('❌ Jobs table error:', jobsError);
    } else if (jobs && jobs.length > 0) {
      const testMatch = {
        id: uuidv4(),
        job_id: jobs[0].id,
        candidate_id: uuidv4(), // This will fail but shows us the constraint
        match_score: 85,
        match_details: '{"skills_match": 0.9}',
        status: 'pending'
      };
      
      const { data: matchResult, error: matchError } = await supabase
        .from('job_candidate_matches')
        .insert([testMatch])
        .select()
        .single();
        
      if (matchError) {
        console.log('❌ Match insert failed:', matchError);
      } else {
        console.log('✅ Match insert successful:', matchResult);
        
        // Clean up
        await supabase
          .from('job_candidate_matches')
          .delete()
          .eq('id', testMatch.id);
      }
    } else {
      console.log('⚠️ No jobs found to test job_candidate_matches');
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

if (require.main === module) {
  require('dotenv').config({ path: '.env.local' });
  testCandidateInsert().catch(console.error);
}

module.exports = { testCandidateInsert };
