// Verification script for Supabase connection
require('dotenv').config({ path: '.env.local' });

async function verifySupabaseConnection() {
  console.log('🔍 Verifying Supabase connection...\n');
  
  // Check environment variables
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  
  console.log('📋 Environment Variables Check:');
  console.log(`✅ NEXT_PUBLIC_SUPABASE_URL: ${supabaseUrl ? '✓ Set' : '❌ Missing'}`);
  console.log(`✅ NEXT_PUBLIC_SUPABASE_ANON_KEY: ${supabaseAnonKey ? '✓ Set (' + supabaseAnonKey.substring(0, 20) + '...)' : '❌ Missing'}`);
  console.log(`✅ SUPABASE_SERVICE_ROLE_KEY: ${serviceRoleKey ? '✓ Set (' + serviceRoleKey.substring(0, 20) + '...)' : '❌ Missing'}\n`);
  
  if (!supabaseUrl || !supabaseAnonKey) {
    console.log('❌ Missing required Supabase credentials!');
    console.log('📖 Please follow the instructions in GET_SUPABASE_CREDENTIALS.md\n');
    return;
  }
  
  // Validate URL format
  if (!supabaseUrl.includes('supabase.co')) {
    console.log('⚠️  URL format seems incorrect. Should be: https://your-project.supabase.co\n');
  }
  
  // Test API connection
  try {
    console.log('🌐 Testing API connection...');
    
    const response = await fetch(`${supabaseUrl}/rest/v1/`, {
      headers: {
        'apikey': supabaseAnonKey,
        'Authorization': `Bearer ${supabaseAnonKey}`
      }
    });
    
    if (response.ok) {
      console.log('✅ API connection successful!');
    } else {
      console.log(`❌ API connection failed: ${response.status} ${response.statusText}`);
    }
    
  } catch (error) {
    console.log(`❌ Connection test failed: ${error.message}`);
  }
  
  // Test database access
  try {
    console.log('🗄️  Testing database access...');
    
    const { createClient } = require('@supabase/supabase-js');
    const supabase = createClient(supabaseUrl, supabaseAnonKey);
    
    const { data, error } = await supabase
      .from('candidates')
      .select('count')
      .limit(1);
    
    if (error) {
      if (error.code === 'PGRST116') {
        console.log('⚠️  Table "candidates" not found. You may need to run database migrations.');
      } else {
        console.log(`❌ Database query failed: ${error.message}`);
      }
    } else {
      console.log('✅ Database access successful!');
    }
    
  } catch (error) {
    console.log(`❌ Database test failed: ${error.message}`);
  }
  
  console.log('\n🎯 Next Steps:');
  console.log('1. If all tests pass: Restart your app (npm run dev)');
  console.log('2. Visit: http://localhost:3000/api/test-database');
  console.log('3. Try uploading a CV file');
  console.log('4. Check if status shows "connected" instead of "mock_mode"');
}

verifySupabaseConnection();