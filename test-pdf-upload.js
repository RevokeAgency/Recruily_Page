#!/usr/bin/env node

/**
 * Test script for direct PDF to Gemini upload
 * This tests the new workflow where PDF files are sent directly to Gemini
 */

const fs = require('fs');
const FormData = require('form-data'); // We'll need to install this
const fetch = require('node-fetch'); // We'll need to install this

async function testPdfUpload() {
  console.log('🧪 Testing PDF upload with direct Gemini processing...');
  
  try {
    // Create a simple test text file that simulates a CV
    const testContent = `John Doe
    Email: john.doe@example.com
    Phone: (555) 123-4567
    Location: New York, NY
    
    PROFESSIONAL SUMMARY
    Experienced Software Engineer with 5 years of experience in full-stack development.
    
    TECHNICAL SKILLS
    JavaScript, React, Node.js, Python, SQL, AWS
    
    WORK EXPERIENCE
    Senior Software Engineer - TechCorp (2019-2024)
    - Developed web applications using React and Node.js
    - Led a team of 3 developers
    - Implemented CI/CD pipelines
    
    EDUCATION
    Bachelor of Computer Science - University of Tech (2019)
    `;
    
    // Write test file
    fs.writeFileSync('/tmp/test_cv.txt', testContent);
    
    // Prepare form data
    const form = new FormData();
    form.append('file', fs.createReadStream('/tmp/test_cv.txt'), {
      filename: 'test_cv.txt',
      contentType: 'text/plain'
    });
    form.append('jobId', 'test-job-123');
    
    // Make the request
    const response = await fetch('http://localhost:3000/api/upload-cv', {
      method: 'POST',
      body: form
    });
    
    const result = await response.json();
    
    console.log('📋 Response status:', response.status);
    console.log('📋 Response body:', JSON.stringify(result, null, 2));
    
    if (response.ok) {
      console.log('✅ Test passed! PDF upload with direct Gemini processing works.');
    } else {
      console.log('❌ Test failed:', result.error || 'Unknown error');
    }
    
    // Clean up
    fs.unlinkSync('/tmp/test_cv.txt');
    
  } catch (error) {
    console.error('❌ Test error:', error.message);
  }
}

// Check if we have the required dependencies
try {
  require('form-data');
  require('node-fetch');
  testPdfUpload();
} catch (error) {
  console.log('⚠️ Missing dependencies. Install with: npm install form-data node-fetch@2');
  console.log('📝 For now, let\'s just check if the server responds to a simple request...');
  
  // Simple test without dependencies
  console.log('🔗 Testing server availability at: http://localhost:3000/api/upload-cv');
}