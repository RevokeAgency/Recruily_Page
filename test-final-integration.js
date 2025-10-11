#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js');
const { v4: uuidv4 } = require('uuid');

async function testFullIntegration() {
  console.log('🧪 Testing complete system integration...\n');
  
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://easdyzpslrxplpogilhx.supabase.co';
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVhc2R5enBzbHJ4cGxwb2dpbGh4Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0NTU4NDEyNSwiZXhwIjoyMDYxMTYwMTI1fQ.WaSy_lb0vIxiHljwck9hJwDj55sdKns4n_2crzwLJ1Q';
  
  const supabase = createClient(supabaseUrl, serviceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });
  
  try {
    // Test 1: Create a candidate with correct schema
    console.log('📝 Test 1: Creating candidate with correct schema...');
    
    const testCandidate = {
      id: uuidv4(),
      first_name: 'Test',
      last_name: 'Integration',
      email: 'test.integration@example.com',
      phone: '+1234567890',
      location: 'Test Location',
      status: 'active',
      notes: JSON.stringify({
        summary: 'Test candidate for integration verification',
        skills: ['JavaScript', 'React', 'Node.js'],
        experience: [{
          title: 'Software Developer',
          company: 'Test Company',
          duration: '2022-2024',
          description: 'Test experience'
        }],
        education: [{
          degree: 'Computer Science',
          school: 'Test University',
          year: '2022'
        }],
        languages: ['English'],
        certifications: []
      }),
      organisation_id: '11111111-1111-1111-1111-111111111111', // TechRecruit
      created_by: null
    };
    
    const { data: candidateResult, error: candidateError } = await supabase
      .from('candidates')
      .insert([testCandidate])
      .select()
      .single();
      
    if (candidateError) {
      console.error('❌ Candidate creation failed:', candidateError);
      throw candidateError;
    }
    
    console.log('✅ Candidate created successfully:', candidateResult.id);
    
    // Test 2: Get existing job posting
    console.log('\n📝 Test 2: Getting existing job posting...');
    
    const { data: jobPostings, error: jobError } = await supabase
      .from('job_postings')
      .select('*')
      .limit(1);
      
    if (jobError) {
      console.error('❌ Job postings fetch failed:', jobError);
      throw jobError;
    }
    
    if (!jobPostings || jobPostings.length === 0) {
      console.error('❌ No job postings found');
      throw new Error('No job postings available');
    }
    
    const jobPosting = jobPostings[0];
    console.log('✅ Job posting found:', jobPosting.title);
    
    // Test 3: Create job candidate match
    console.log('\n📝 Test 3: Creating job candidate match...');
    
    const testMatch = {
      id: uuidv4(),
      job_id: jobPosting.id,
      candidate_id: candidateResult.id,
      match_score: 85,
      match_details: JSON.stringify({
        overall_score: 85,
        skills_score: 90,
        experience_score: 80,
        education_score: 85,
        strengths: ['Strong technical skills', 'Relevant experience'],
        gaps: ['Could benefit from more experience'],
        recommendations: ['Schedule interview', 'Strong candidate']
      }),
      status: 'pending'
    };
    
    const { data: matchResult, error: matchError } = await supabase
      .from('job_candidate_matches')
      .insert([testMatch])
      .select()
      .single();
      
    if (matchError) {
      console.error('❌ Match creation failed:', matchError);
      throw matchError;
    }
    
    console.log('✅ Job match created successfully:', matchResult.id);
    
    // Test 4: Retrieve candidates for job with proper joins
    console.log('\n📝 Test 4: Retrieving candidates with joins...');
    
    const { data: matches, error: retrieveError } = await supabase
      .from('job_candidate_matches')
      .select(`
        *,
        candidate:candidates (
          id,
          first_name,
          last_name,
          email,
          phone,
          location,
          status,
          notes,
          organisation_id,
          created_at,
          updated_at
        )
      `)
      .eq('job_id', jobPosting.id)
      .order('match_score', { ascending: false });
      
    if (retrieveError) {
      console.error('❌ Candidates retrieval failed:', retrieveError);
      throw retrieveError;
    }
    
    console.log(`✅ Retrieved ${matches?.length || 0} candidates for job`);
    
    if (matches && matches.length > 0) {
      const match = matches.find(m => m.candidate_id === candidateResult.id);
      if (match) {
        console.log('✅ Test candidate found in results:', {
          candidateName: `${match.candidate.first_name} ${match.candidate.last_name}`,
          matchScore: match.match_score,
          status: match.status
        });
      }
    }
    
    // Test 5: Clean up test data
    console.log('\n🧹 Test 5: Cleaning up test data...');
    
    await supabase.from('job_candidate_matches').delete().eq('id', matchResult.id);
    await supabase.from('candidates').delete().eq('id', candidateResult.id);
    
    console.log('✅ Test data cleaned up successfully');
    
    console.log('\n🎉 INTEGRATION TEST COMPLETE - ALL SYSTEMS WORKING! 🎉');
    console.log('\n📊 Summary:');
    console.log('✅ Database connection: SUCCESS');
    console.log('✅ Candidate creation: SUCCESS');
    console.log('✅ Job postings access: SUCCESS');
    console.log('✅ Match creation: SUCCESS');
    console.log('✅ Data retrieval with joins: SUCCESS');
    console.log('✅ Foreign key constraints: RESOLVED');
    
    return true;
    
  } catch (error) {
    console.error('\n❌ INTEGRATION TEST FAILED:', error);
    console.error('\n📊 Error Details:');
    console.error('  - Error message:', error.message);
    console.error('  - Error code:', error.code);
    console.error('  - Error details:', error.details);
    
    return false;
  }
}

if (require.main === module) {
  require('dotenv').config({ path: '.env.local' });
  testFullIntegration().then(success => {
    console.log('\n🏁 Final result:', success ? 'SUCCESS' : 'FAILED');
    process.exit(success ? 0 : 1);
  }).catch(error => {
    console.error('❌ Test execution error:', error);
    process.exit(1);
  });
}

module.exports = { testFullIntegration };
