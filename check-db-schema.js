#!/usr/bin/env node

/**
 * Check the actual database schema to understand what's available
 */

const { createClient } = require('@supabase/supabase-js');

async function checkDatabaseSchema() {
  console.log('🔍 Checking Supabase database schema...\n');
  
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://easdyzpslrxplpogilhx.supabase.co';
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVhc2R5enBzbHJ4cGxwb2dpbGh4Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0NTU4NDEyNSwiZXhwIjoyMDYxMTYwMTI1fQ.WaSy_lb0vIxiHljwck9hJwDj55sdKns4n_2crzwLJ1Q';
  
  const supabase = createClient(supabaseUrl, serviceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });
  
  try {
    // Check candidates table
    console.log('📋 Checking candidates table structure...');
    const { data: candidatesTest, error: candidatesError } = await supabase
      .from('candidates')
      .select('*')
      .limit(1);
      
    if (candidatesError) {
      console.log('❌ Candidates table error:', candidatesError);
    } else {
      console.log('✅ Candidates table accessible');
      if (candidatesTest && candidatesTest.length > 0) {
        console.log('📊 Sample candidate columns:', Object.keys(candidatesTest[0]));
      }
    }
    
    // Check job_matches table
    console.log('\n📋 Checking job_matches table...');
    const { data: matchesTest, error: matchesError } = await supabase
      .from('job_matches')
      .select('*')
      .limit(1);
      
    if (matchesError) {
      console.log('❌ Job matches table error:', matchesError);
      
      // Try alternative table names
      console.log('\n🔍 Trying alternative table names...');
      
      const alternativeNames = [
        'job_candidate_matches',
        'candidate_matches', 
        'matches',
        'job_applications',
        'applications'
      ];
      
      for (const tableName of alternativeNames) {
        try {
          const { data, error } = await supabase
            .from(tableName)
            .select('*')
            .limit(1);
            
          if (!error) {
            console.log(`✅ Found alternative table: ${tableName}`);
            if (data && data.length > 0) {
              console.log(`📊 ${tableName} columns:`, Object.keys(data[0]));
            }
          }
        } catch (altError) {
          // Continue trying
        }
      }
    } else {
      console.log('✅ Job matches table accessible');
      if (matchesTest && matchesTest.length > 0) {
        console.log('📊 Sample match columns:', Object.keys(matchesTest[0]));
      }
    }
    
    // Check what tables exist
    console.log('\n📋 Checking available tables...');
    const { data: tables, error: tablesError } = await supabase.rpc('get_schema_tables');
    
    if (tablesError) {
      console.log('⚠️ Could not get schema info, trying direct queries...');
      
      // Try some common table patterns
      const commonTables = ['jobs', 'candidates', 'users', 'job_matches', 'applications', 'resumes'];
      
      for (const table of commonTables) {
        try {
          const { error } = await supabase
            .from(table)
            .select('id')
            .limit(1);
            
          if (!error) {
            console.log(`✅ Table exists: ${table}`);
          }
        } catch (e) {
          // Table doesn't exist or no access
        }
      }
    } else {
      console.log('✅ Available tables:', tables);
    }
    
    // Test a simple insert to understand what's expected
    console.log('\n📋 Testing candidate insertion to understand schema...');
    
    const testCandidate = {
      id: 'test-' + Date.now(),
      name: 'Test Candidate',
      email: 'test@example.com',
      phone: '+1234567890',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    
    const { data: insertTest, error: insertError } = await supabase
      .from('candidates')
      .insert([testCandidate])
      .select()
      .single();
      
    if (insertError) {
      console.log('❌ Insert test error:', insertError);
      console.log('🔍 This helps us understand the required schema');
      
      // Try to parse the error to understand required fields
      if (insertError.message) {
        const message = insertError.message.toLowerCase();
        if (message.includes('column') && message.includes('does not exist')) {
          console.log('💡 Suggestion: The database schema may be different from what we expect');
        }
      }
    } else {
      console.log('✅ Insert test successful:', insertTest);
      
      // Clean up test data
      await supabase
        .from('candidates')
        .delete()
        .eq('id', testCandidate.id);
        
      console.log('🧹 Test data cleaned up');
    }
    
  } catch (error) {
    console.error('❌ Database check failed:', error);
  }
}

if (require.main === module) {
  // Load environment variables
  require('dotenv').config({ path: '.env.local' });
  checkDatabaseSchema().catch(console.error);
}

module.exports = { checkDatabaseSchema };