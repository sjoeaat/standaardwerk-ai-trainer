import { UnifiedTextParser } from './src/core/UnifiedTextParser.js';
import { defaultSyntaxRules } from './src/config/syntaxRules.js';

const text = `RUHE: Test

NICHT HMI01 HAND
Sicherheitsbereich 1 OK

SCHRITT 1: Freigabe?`;

console.log('=== STEP-BY-STEP NORMALIZATION ===');
console.log('Original:');
console.log(JSON.stringify(text));

const parser = new UnifiedTextParser(defaultSyntaxRules);

// Manually call each normalization step
let normalized = text;

console.log('\n1. removeExtraWhitespace:');
normalized = parser.removeExtraWhitespace(normalized);
console.log(JSON.stringify(normalized));

console.log('\n2. normalizeLineEndings:');
normalized = parser.normalizeLineEndings(normalized);
console.log(JSON.stringify(normalized));

console.log('\n3. normalizeEncoding:');
normalized = parser.normalizeEncoding(normalized);
console.log(JSON.stringify(normalized));

console.log('\n4. normalizeManualInput:');
normalized = parser.normalizeManualInput(normalized);
console.log(JSON.stringify(normalized));

console.log('\n5. applyConsistencyRules:');
normalized = parser.applyConsistencyRules(normalized);
console.log(JSON.stringify(normalized));

console.log('\nFinal lines:');
normalized.split('\n').forEach((line, i) => {
  console.log(`${i+1}: "${line}"`);
});