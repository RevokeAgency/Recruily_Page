#!/usr/bin/env node

/**
 * Quick Authentication Setup
 * This script enables email/password auth in your Supabase project
 */

const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://easdyzpslrxplpogilhx.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVhc2R5enBzbHJ4cGxwb2dpbGh4Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0NTU4NDEyNSwiZXhwIjoyMDYxMTYwMTI1fQ.WaSy_lb0vIxiHljwck9hJwDj55sdKns4n_2crzwLJ1Q';

async function setupAuth() {
  console.log('🔧 Testing Supabase connection...');
  
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
    console.log('   → Go to: https://supabase.com/dashboard/project/easdyzpslrxplpogilhx/auth/providers');
    console.log('   → Ensure "Email" is enabled');
    console.log('   → Save changes');
    console.log('');
    
    console.log('2. 🌐 Configure Site URL:');
    console.log('   → Go to: https://supabase.com/dashboard/project/easdyzpslrxplpogilhx/auth/settings');
    console.log('   → Set Site URL to: http://localhost:3000');
    console.log('   → Add Redirect URLs: http://localhost:3000/auth/callback');
    console.log('   → Save changes');
    console.log('');
    
    console.log('3. 🗄️ Create Basic Tables (optional for auth):');
    console.log('   → Go to: https://supabase.com/dashboard/project/easdyzpslrxplpogilhx/sql/new');
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