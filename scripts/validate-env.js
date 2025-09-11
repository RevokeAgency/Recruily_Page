#!/usr/bin/env node

/**
 * Environment Variables Validation Script
 * This script runs before the build to validate environment variables
 * Now supports graceful fallbacks for missing credentials
 */

const chalk = require('chalk')

// Load environment variables from .env.local if it exists
try {
  require('dotenv').config({ path: '.env.local' })
} catch (e) {
  // dotenv not available or .env.local doesn't exist, continue anyway
}

// Required environment variables for production
const requiredEnvVars = [
  'NEXT_PUBLIC_SUPABASE_URL',
  'NEXT_PUBLIC_SUPABASE_ANON_KEY'
]

// Optional environment variables (with defaults)
const optionalEnvVars = [
  'NODE_ENV',
  'NEXT_PUBLIC_APP_URL',
  'NEXTAUTH_URL',
  'NEXTAUTH_SECRET'
]

function validateEnvironmentVariables() {
  console.log(chalk.blue('🔍 Validating environment variables...'))
  
  let hasMissingVars = false
  let hasErrors = false
  
  // Check required variables
  for (const envVar of requiredEnvVars) {
    const value = process.env[envVar]
    
    if (!value || value.trim() === '') {
      console.log(chalk.yellow(`⚠️  Missing environment variable: ${envVar}`))
      hasMissingVars = true
    } else {
      // Additional validation for Supabase URL
      if (envVar === 'NEXT_PUBLIC_SUPABASE_URL') {
        if (!value.startsWith('https://')) {
          console.error(chalk.red(`❌ ${envVar} must start with https://`))
          hasErrors = true
        } else if (!value.includes('.supabase.co')) {
          console.warn(chalk.yellow(`⚠️  ${envVar} doesn't appear to be a valid Supabase URL`))
        } else {
          console.log(chalk.green(`✅ ${envVar} is properly configured`))
        }
      } else {
        console.log(chalk.green(`✅ ${envVar} is set`))
      }
    }
  }
  
  // Check optional variables (just report)
  console.log(chalk.blue('\n📋 Optional environment variables:'))
  for (const envVar of optionalEnvVars) {
    const value = process.env[envVar]
    
    if (value && value.trim() !== '') {
      console.log(chalk.green(`✅ ${envVar} is set`))
    } else {
      console.log(chalk.yellow(`⚠️  ${envVar} is not set (optional)`))
    }
  }
  
  // Determine build mode and handle accordingly
  const isProduction = process.env.NODE_ENV === 'production'
  const isNetlifyBuild = process.env.NETLIFY === 'true'
  
  if (hasErrors) {
    // Critical validation errors - fail the build
    console.error(chalk.red('\n❌ Environment validation failed due to invalid values!'))
    process.exit(1)
  } else if (hasMissingVars) {
    if (isNetlifyBuild) {
      // On Netlify, warn but allow build to continue with fallbacks
      console.log(chalk.yellow('\n⚠️  Missing environment variables detected on Netlify'))
      console.log(chalk.yellow('Build will continue with mock Supabase client as fallback'))
      console.log(chalk.blue('\n💡 To fix this:'))
      console.log(chalk.blue('   1. Go to Site settings → Environment variables'))
      console.log(chalk.blue('   2. Add the missing variables from netlify-environment.json'))
      console.log(chalk.blue('   3. Redeploy your site'))
    } else if (isProduction) {
      // Local production build - warn but continue
      console.log(chalk.yellow('\n⚠️  Missing environment variables in production build'))
      console.log(chalk.yellow('Using fallback configuration'))
    } else {
      // Development build - warn but continue
      console.log(chalk.yellow('\n⚠️  Missing environment variables in development'))
      console.log(chalk.blue('💡 For full functionality:'))
      console.log(chalk.blue('   1. Copy .env.example to .env.local'))
      console.log(chalk.blue('   2. Fill in the Supabase credentials'))
    }
    
    console.log(chalk.green('\n✅ Build will continue with fallback configuration'))
  } else {
    console.log(chalk.green('\n✅ Environment validation passed!'))
  }
}

// Run validation
try {
  validateEnvironmentVariables()
} catch (error) {
  console.error(chalk.red('❌ Error during environment validation:'), error.message)
  // Don't exit on validation errors - let build continue
  console.log(chalk.yellow('⚠️  Continuing build with default configuration'))
}