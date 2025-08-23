#!/usr/bin/env node

const { spawn } = require('child_process');
const path = require('path');

/**
 * Plugin validation script
 * Runs our Ruby constraint engine on the NestJS plugin project
 */

console.log('🔍 Validating NestJS Plugin Architecture...\n');

// Path to our constraint rules
const rulesScript = path.join(__dirname, '../src/constraints/simple-validator.rb');
const projectPath = path.join(__dirname, '..');

// Run the Ruby constraint engine
const validation = spawn('ruby', [rulesScript, projectPath], {
  stdio: 'inherit',
  cwd: process.cwd()
});

validation.on('close', (code) => {
  if (code === 0) {
    console.log('\n✅ Plugin architecture validation passed!');
    console.log('🚀 All plugins follow the constrained architecture.');
    process.exit(0);
  } else {
    console.log('\n❌ Plugin architecture validation failed!');
    console.log('🔧 Please fix the violations above before proceeding.');
    process.exit(1);
  }
});

validation.on('error', (err) => {
  console.error('❌ Failed to run validation script:', err.message);
  console.error('💡 Make sure Ruby is installed and the constraint engine is available.');
  process.exit(1);
});