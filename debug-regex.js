import { defaultSyntaxRules } from './src/config/syntaxRules.js';

const testLines = [
  'SCHRITT 1: Freigabe?',
  'RUHE: N10: Blockierung',
  'SCHRITT 2: Schließen'
];

console.log('Step keywords:', defaultSyntaxRules.stepKeywords);

const stepPattern = new RegExp(
  `^(${defaultSyntaxRules.stepKeywords.rest.join('|')}|${defaultSyntaxRules.stepKeywords.step.join('|')})(?:\\s+(\\d+))?:\\s*(.*)$`, 
  'i'
);

console.log('Pattern:', stepPattern);

testLines.forEach(line => {
  const match = line.match(stepPattern);
  console.log(`\n"${line}"`);
  console.log('Match:', match ? [match[1], match[2], match[3]] : null);
});