import { defaultSyntaxRules } from './src/config/syntaxRules.js';

console.log('Step keywords:', defaultSyntaxRules.stepKeywords);

// Build the regex exactly like the parser does
const stepPattern = new RegExp(
  `^(${defaultSyntaxRules.stepKeywords.rest.join('|')}|${defaultSyntaxRules.stepKeywords.step.join('|')})(?:\\s+(\\d+))?:\\s*(.*)$`, 
  'i'
);

console.log('Constructed pattern source:', stepPattern.source);

const testLine = 'SCHRITT 1: Freigabe?';
console.log(`\nTesting: "${testLine}"`);
console.log('Match result:', testLine.match(stepPattern));

// Let's also try with different variations
const variations = [
  'SCHRITT 1: Freigabe?',
  'SCHRITT 1:Freigabe?',
  'SCHRITT  1: Freigabe?',
  'RUHE: Test',
  '  SCHRITT 1: Freigabe?'
];

variations.forEach(line => {
  const match = line.match(stepPattern);
  console.log(`"${line}" -> ${match ? `[${match[1]}, ${match[2]}, ${match[3]}]` : 'null'}`);
});