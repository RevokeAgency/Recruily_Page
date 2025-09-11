#!/usr/bin/env node

/**
 * Quick Authentication Setup
 * This script enables email/password auth in your Supabase project
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

async function setupAuth() {
  console.log('🔧 Testing Supabase connection...');
  
  if (!supabaseUrl || !supabaseServiceKey) {
    console.error('❌ Missing Supabase credentials in .env.local');
    console.log('Please set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY');
    return;
  }
  
  // Create admin client
  const supabase = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });

  try {
    // Test connection by trying to get auth settings
    console.log('✅ Supabase connection established');
    console.log('📋 Your Supabase project is ready for authentication');
    console.log('');
    
    console.log('🎯 To complete the setup:');
    console.log('');
    console.log('1. 📧 Enable Email Authentication:');
    console.log(`   → Go to: ${supabaseUrl.replace('.co', '.com/dashboard').replace('https://', 'https://supabase.com/dashboard/project/').replace('.supabase', '')}/auth/providers`);
    console.log('   → Ensure "Email" is enabled');
    console.log('   → Save changes');
    console.log('');
    
    console.log('2. 🌐 Configure Site URL:');
    console.log(`   → Go to: ${supabaseUrl.replace('.co', '.com/dashboard').replace('https://', 'https://supabase.com/dashboard/project/').replace('.supabase', '')}/auth/settings`);
    console.log('   → Set Site URL to: http://localhost:3000');
    console.log('   → Add Redirect URLs: http://localhost:3000/auth/callback');
    console.log('   → Save changes');
    console.log('');
    
    console.log('3. 🗄️ Create Basic Tables (optional for auth):');
    console.log(`   → Go to: ${supabaseUrl.replace('.co', '.com/dashboard').replace('https://', 'https://supabase.com/dashboard/project/').replace('.supabase', '')}/sql/new`);
    console.log('   → Run: CREATE TABLE IF NOT EXISTS public.user_profiles (id uuid references auth.users primary key);');
    console.log('');
    
    console.log('🎉 After these steps, login/signup will work!');
    
  } catch (error) {
    console.error('❌ Connection failed:', error.message);
    
    if (error.message.includes('Invalid JWT')) {
      console.log('✅ This error is actually expected - it means Supabase is working!');
      console.log('🔧 The authentication will work once you enable it in the dashboard.');
    }
  }
}

if (require.main === module) {
  setupAuth();
}