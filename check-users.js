#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js');

async function checkUsers() {
  console.log('👤 Checking for existing users...\n');
  
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://easdyzpslrxplpogilhx.supabase.co';
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVhc2R5enBzbHJ4cGxwb2dpbGh4Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0NTU4NDEyNSwiZXhwIjoyMDYxMTYwMTI1fQ.WaSy_lb0vIxiHljwck9hJwDj55sdKns4n_2crzwLJ1Q';
  
  const supabase = createClient(supabaseUrl, serviceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });
  
  try {
    // Check if users table exists and get existing users
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('id, email, name')
      .limit(10);
      
    if (usersError) {
      console.log('❌ Users table error:', usersError);
      
      // Try to create a system user for our API
      console.log('\n🔧 Attempting to create a system user...');
      
      const systemUserId = '00000000-0000-0000-0000-000000000001'; // Fixed UUID for system user
      const systemUser = {
        id: systemUserId,
        email: 'system@recruitment.ai',
        name: 'System User',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      
      const { data: newUser, error: createError } = await supabase
        .from('users')
        .upsert([systemUser])
        .select()
        .single();
        
      if (createError) {
        console.log('❌ Could not create system user:', createError);
      } else {
        console.log('✅ System user created/updated:', newUser);
      }
    } else {
      console.log('✅ Users found:', users.length);
      users.forEach(user => {
        console.log(`  - ${user.id}: ${user.email} (${user.name})`);
      });
      
      if (users.length > 0) {
        console.log(`\n💡 Can use existing user ID for created_by: ${users[0].id}`);
      }
    }
    
    // Also check organisations table
    console.log('\n🏢 Checking organisations...');
    const { data: orgs, error: orgsError } = await supabase
      .from('organisations')
      .select('id, name')
      .limit(10);
      
    if (orgsError) {
      console.log('❌ Organisations table error:', orgsError);
      
      // Try to create a default organisation
      console.log('\n🔧 Attempting to create default organisation...');
      
      const defaultOrgId = '00000000-0000-0000-0000-000000000002'; // Fixed UUID for default org
      const defaultOrg = {
        id: defaultOrgId,
        name: 'Default Organisation',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      
      const { data: newOrg, error: createOrgError } = await supabase
        .from('organisations')
        .upsert([defaultOrg])
        .select()
        .single();
        
      if (createOrgError) {
        console.log('❌ Could not create default organisation:', createOrgError);
      } else {
        console.log('✅ Default organisation created/updated:', newOrg);
      }
    } else {
      console.log('✅ Organisations found:', orgs.length);
      orgs.forEach(org => {
        console.log(`  - ${org.id}: ${org.name}`);
      });
    }
    
  } catch (error) {
    console.error('❌ User check failed:', error);
  }
}

if (require.main === module) {
  require('dotenv').config({ path: '.env.local' });
  checkUsers().catch(console.error);
}

module.exports = { checkUsers };
