import { UnifiedTextParser } from './src/core/UnifiedTextParser.js';
import { defaultSyntaxRules } from './src/config/syntaxRules.js';

const text = `RUHE: Test

NICHT HMI01 HAND
Sicherheitsbereich 1 OK

SCHRITT 1: Freigabe?
Test condition

SCHRITT 2: Next step`;

console.log('=== DEBUGGING PARSING FLOW ===');

const parser = new UnifiedTextParser(defaultSyntaxRules);
const result = parser.parse(text, 'manual', { language: 'German' });

console.log('\n=== STEP ANALYSIS ===');
result.steps.forEach((step, i) => {
  console.log(`\nStep ${i+1}: ${step.type} ${step.number}`);
  console.log(`  Description: "${step.description}"`);
  console.log(`  Entry conditions: ${step.entryConditions.length} groups`);
  step.entryConditions.forEach((group, j) => {
    console.log(`    Group ${j+1} (${group.operator}): ${group.conditions.length} conditions`);
    group.conditions.forEach(cond => {
      console.log(`      - ${cond.isNot ? 'NOT ' : ''}${cond.variable}`);
    });
  });
  
  console.log(`  Exit conditions: ${step.exitConditions.length} groups`);
  step.exitConditions.forEach((group, j) => {
    console.log(`    Group ${j+1} (${group.operator}): ${group.conditions.length} conditions`);
    group.conditions.forEach(cond => {
      console.log(`      - ${cond.isNot ? 'NOT ' : ''}${cond.variable}`);
    });
  });
});

console.log(`\nErrors: ${result.errors.length}`);
result.errors.forEach(error => console.log(`  - ${error.message}`));