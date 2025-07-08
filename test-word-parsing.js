// Test script to simulate Word document parsing
import { readFileSync } from 'fs';
import { UnifiedTextParser } from './src/core/UnifiedTextParser.js';
import { parseWordDocument } from './src/core/enhancedWordParser.js';
import { DEFAULT_VALIDATION_RULES } from './src/config/validationRules.js';
import { defaultSyntaxRules } from './src/constants.jsx';

// Lees het extracted text bestand
const extractedText = readFileSync('/home/sjoeaat/extracted_programmbeschreibung.txt', 'utf-8');

console.log('🚀 Testing Unified Text Parser with extracted Word content...\n');

// Test de UnifiedTextParser direct
const parser = new UnifiedTextParser(defaultSyntaxRules, DEFAULT_VALIDATION_RULES);

try {
  const result = parser.parse(extractedText, 'word', {
    programName: 'Test Program',
    functionBlock: 'FB100'
  });

  console.log('📊 PARSING RESULTS:');
  console.log('===================');
  console.log(`Steps found: ${result.steps.length}`);
  console.log(`Variables found: ${result.variables.length}`);
  console.log(`Timers found: ${result.timers.length}`);
  console.log(`Markers found: ${result.markers.length}`);
  console.log(`Errors found: ${result.errors.length}`);
  console.log(`Warnings found: ${result.warnings.length}`);

  console.log('\n🎯 DETECTED STEPS:');
  result.steps.forEach((step, index) => {
    console.log(`${index + 1}. ${step.type} ${step.number}: ${step.description}`);
    if (step.entryConditions.length > 0) {
      console.log(`   Entry conditions: ${step.entryConditions.length}`);
    }
    if (step.transitions.length > 0) {
      console.log(`   Transitions: ${step.transitions.length}`);
    }
  });

  console.log('\n📝 DETECTED VARIABLES:');
  result.variables.forEach((variable, index) => {
    console.log(`${index + 1}. ${variable.name} (${variable.type}) - Line ${variable.lineNumber}`);
  });

  console.log('\n⚠️  ERRORS:');
  result.errors.forEach((error, index) => {
    console.log(`${index + 1}. ${error.type}: ${error.message} (Line ${error.lineNumber})`);
  });

  console.log('\n⚠️  WARNINGS:');
  result.warnings.forEach((warning, index) => {
    console.log(`${index + 1}. ${warning.type}: ${warning.message} (Line ${warning.lineNumber})`);
  });

  console.log('\n📈 STATISTICS:');
  console.log(`Total lines processed: ${extractedText.split('\n').length}`);
  console.log(`Total conditions: ${result.statistics.totalConditions}`);
  console.log(`External references: ${result.statistics.externalReferences}`);
  console.log(`Cross references: ${result.crossReferences?.length || 0}`);

} catch (error) {
  console.error('❌ PARSING ERROR:', error.message);
  console.error(error.stack);
}

console.log('\n🔍 Testing specific sections...');

// Test specifieke secties
const lines = extractedText.split('\n');
console.log('\nLooking for step declarations:');
lines.forEach((line, index) => {
  if (line.toLowerCase().includes('schritt') || line.toLowerCase().includes('rust')) {
    console.log(`Line ${index + 1}: "${line.trim()}"`);
  }
});