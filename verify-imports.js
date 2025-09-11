const fs = require('fs');
const path = require('path');

// Verify all the files that Vercel is complaining about
const files = [
  'components/ui/button.tsx',
  'components/ui/card.tsx', 
  'components/ui/tabs.tsx',
  'lib/email-service.ts'
];

console.log('🔍 Verifying file existence and case...');
files.forEach(file => {
  const fullPath = path.resolve(file);
  const exists = fs.existsSync(fullPath);
  console.log(`${exists ? '✅' : '❌'} ${file} - ${exists ? 'EXISTS' : 'NOT FOUND'}`);
  if (exists) {
    const stat = fs.statSync(fullPath);
    console.log(`   Size: ${stat.size} bytes, Modified: ${stat.mtime}`);
  }
});

console.log('\n📁 Checking directory structure...');
const dirs = ['components', 'components/ui', 'lib'];
dirs.forEach(dir => {
  if (fs.existsSync(dir)) {
    console.log(`✅ ${dir}/`);
    const contents = fs.readdirSync(dir);
    contents.forEach(item => {
      console.log(`   - ${item}`);
    });
  } else {
    console.log(`❌ ${dir}/ - NOT FOUND`);
  }
});
