#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

console.log('🔍 Build Debug Information');
console.log('=========================');

console.log('\n📁 Current Working Directory:', process.cwd());

console.log('\n🔧 Key Files Check:');
const filesToCheck = [
  './components/ui/button.tsx',
  './components/ui/card.tsx',
  './components/ui/tabs.tsx',
  './lib/email-service.ts',
  './lib/utils.ts',
  './lib/index.ts',
  './tsconfig.json',
  './next.config.mjs'
];

filesToCheck.forEach(file => {
  if (fs.existsSync(file)) {
    console.log(`✅ ${file} exists`);
  } else {
    console.log(`❌ ${file} MISSING`);
  }
});

console.log('\n📦 Package.json Dependencies:');
const packageJson = JSON.parse(fs.readFileSync('./package.json', 'utf8'));
const importantDeps = ['next', 'react', 'typescript', '@types/node', 'class-variance-authority', 'clsx', 'tailwind-merge'];

importantDeps.forEach(dep => {
  const version = packageJson.dependencies?.[dep] || packageJson.devDependencies?.[dep];
  if (version) {
    console.log(`✅ ${dep}: ${version}`);
  } else {
    console.log(`❌ ${dep}: NOT FOUND`);
  }
});

console.log('\n🎯 Path Resolution Test:');
try {
  const tsConfig = JSON.parse(fs.readFileSync('./tsconfig.json', 'utf8'));
  console.log('✅ tsconfig.json paths:', JSON.stringify(tsConfig.compilerOptions.paths, null, 2));
} catch (error) {
  console.log('❌ Error reading tsconfig.json:', error.message);
}

console.log('\n🌍 Environment Variables:');
console.log('NODE_ENV:', process.env.NODE_ENV || 'undefined');
console.log('NODE_VERSION:', process.env.NODE_VERSION || 'undefined');

console.log('\n✅ Debug completed successfully!');